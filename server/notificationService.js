import dotenv from "dotenv";
dotenv.config();
import { User, NotificationLog, TollPlaza } from "../shared/schema.js";
import { calculateDistance } from "./storage.js";
import twilio from 'twilio';
import { WebSocketServer } from 'ws';

// Environment validation
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioPhone) {
  throw new Error('Twilio credentials missing in environment variables');
}

const twilioClient = twilio(accountSid, authToken);

// Constants
const PROXIMITY_THRESHOLD_KM = 2;
const FIVE_MINUTES = 5 * 60 * 1000;
const NOTIFICATION_TTL = 30 * 24 * 60 * 60 * 1000;

// Improved SMS Templates with better error handling
const SMS_TEMPLATES = {
  proximity: (tollData) => {
    const name = tollData?.name || 'toll plaza';
    const distance = tollData?.distance ? tollData.distance.toFixed(1) : 'unknown';
    const fee = tollData?.tollFee || 'unknown';
    return `Toll Alert: Approaching ${name} (${distance}km). Fee: ₹${fee}`;
  },
  balance: (balanceData) => {
    const balance = balanceData?.balance ?? 'unknown';
    const threshold = balanceData?.threshold ?? 'unknown';
    return `Toll Alert: Low balance ₹${balance} (Min: ₹${threshold})`;
  }
};

export function setupNotificationService(wss = new WebSocketServer({ noServer: true })) {
  /**
   * Enhanced notification system with dual delivery (WS + SMS)
   */
  async function sendNotification({ userId, type, message, tollPlazaId = null }) {
    const session = await NotificationLog.startSession();
    session.startTransaction();

    try {
      // Input validation
      if (!userId || !type || !message) {
        throw new Error('Missing required notification parameters');
      }

      // Message sanitization
      const cleanMessage = message
        .replace(/\s*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\s*$/, '')
        .trim()
        .substring(0, 500);

      // Create notification record
      const notification = await NotificationLog.create([{
        userId,
        tollPlazaId,
        type,
        message: cleanMessage,
        status: 'sent',
        smsStatus: 'pending',
        sentAt: new Date(),
        expiresAt: new Date(Date.now() + NOTIFICATION_TTL)
      }], { session });

      const [createdNotification] = notification;
      const user = await User.findById(userId)
        .session(session)
        .select('contactNumber settings name fastagBalance')
        .lean();

      if (!user) {
        await session.abortTransaction();
        return null;
      }

      // SMS Delivery (if enabled)
      if (user.contactNumber && user.settings?.smsAlertsEnabled) {
        const smsAllowed = user.settings[`${type}Alerts`]?.sms ?? false;
        
        if (smsAllowed) {
          try {
            let smsBody;
            
            if (type === 'proximity' && tollPlazaId) {
              const tollData = await TollPlaza.findById(tollPlazaId)
                .select('name tollFee latitude longitude')
                .lean();
              
              // Calculate distance if needed
              const distance = tollData?.distance || 0;
              
              smsBody = SMS_TEMPLATES.proximity({
                ...tollData,
                distance
              });
            } 
            else if (type === 'balance') {
              smsBody = SMS_TEMPLATES.balance({
                balance: user.fastagBalance,
                threshold: user.settings.balanceAlerts?.threshold
              });
            }
            else {
              smsBody = cleanMessage.substring(0, 160);
            }

            await twilioClient.messages.create({
              body: smsBody,
              from: twilioPhone,
              to: user.contactNumber
            });

            await NotificationLog.updateOne(
              { _id: createdNotification._id },
              { $set: { smsStatus: 'sent' } },
              { session }
            );
          } catch (error) {
            await NotificationLog.updateOne(
              { _id: createdNotification._id },
              { 
                $set: { 
                  smsStatus: 'failed',
                  smsError: error.message.substring(0, 200)
                } 
              },
              { session }
            );
          }
        } else {
          await NotificationLog.updateOne(
            { _id: createdNotification._id },
            { $set: { smsStatus: 'not_required' } },
            { session }
          );
        }
      }

      // WebSocket broadcast
      const populatedNotification = await NotificationLog.findById(createdNotification._id)
        .session(session)
        .populate('tollPlazaId', 'name tollFee latitude longitude')
        .lean();

      const wsPayload = {
        id: populatedNotification._id.toString(),
        type: populatedNotification.type,
        message: populatedNotification.message,
        status: populatedNotification.status,
        sentAt: populatedNotification.sentAt.toISOString(),
        data: populatedNotification.tollPlazaId ? {
          name: populatedNotification.tollPlazaId.name,
          fee: populatedNotification.tollPlazaId.tollFee,
          distance: populatedNotification.tollPlazaId.distance
        } : null
      };

      // Broadcast to connected clients
      wss.clients.forEach(client => {
        if (client.userId === userId.toString() && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "notification",
            data: wsPayload
          }));
        }
      });

      await session.commitTransaction();
      return wsPayload;

    } catch (error) {
      await session.abortTransaction();
      console.error("Notification processing failed:", error);
      throw new Error(`Notification failed: ${error.message}`);
    } finally {
      session.endSession();
    }
  }

  /**
   * Proximity alert checker with cooldown period
   */
  async function checkProximityAlerts(userId, latitude, longitude) {
    if (!latitude || !longitude) return;

    const session = await NotificationLog.startSession();
    session.startTransaction();

    try {
      const user = await User.findById(userId)
        .session(session)
        .select('settings fastagBalance contactNumber')
        .lean();

      if (!user?.settings?.notificationsEnabled) {
        await session.abortTransaction();
        return;
      }

      const tollPlazas = await TollPlaza.find().session(session);
      const fiveMinutesAgo = new Date(Date.now() - FIVE_MINUTES);
      
      // Balance alert check
      if (user.settings.balanceAlerts?.enabled && 
          user.fastagBalance < user.settings.balanceAlerts.threshold) {
        
        const hasRecentBalanceAlert = await NotificationLog.exists({
          userId,
          type: "balance",
          sentAt: { $gte: fiveMinutesAgo }
        }).session(session);

        if (!hasRecentBalanceAlert) {
          await sendNotification({
            userId,
            type: "balance",
            message: SMS_TEMPLATES.balance({
              balance: user.fastagBalance,
              threshold: user.settings.balanceAlerts.threshold
            })
          });
        }
      }

      // Proximity alert check
      for (const toll of tollPlazas) {
        const distance = calculateDistance(latitude, longitude, toll.latitude, toll.longitude);
        
        if (distance <= PROXIMITY_THRESHOLD_KM && user.settings.proximityAlerts?.enabled) {
          const hasRecentAlert = await NotificationLog.exists({
            userId,
            tollPlazaId: toll._id,
            type: "proximity",
            sentAt: { $gte: fiveMinutesAgo }
          }).session(session);

          if (!hasRecentAlert) {
            await sendNotification({
              userId,
              type: "proximity",
              message: SMS_TEMPLATES.proximity({
                name: toll.name,
                distance,
                tollFee: toll.tollFee
              }),
              tollPlazaId: toll._id
            });
          }
        }
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      console.error("Proximity check failed:", error);
    } finally {
      session.endSession();
    }
  }

  /**
   * Mark notifications as read
   */
  async function markAsRead(notificationIds, userId) {
    if (!Array.isArray(notificationIds) || !userId) return;

    try {
      await NotificationLog.updateMany(
        { 
          _id: { $in: notificationIds },
          userId,
          status: 'sent' 
        },
        { $set: { status: 'read' } }
      );
    } catch (error) {
      console.error("Mark as read failed:", error);
    }
  }

  return {
    sendNotification,
    checkProximityAlerts,
    markAsRead,
    wss
  };
}