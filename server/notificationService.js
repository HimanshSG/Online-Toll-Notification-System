import { User, NotificationLog, TollPlaza } from "../shared/schema.js";
import { calculateDistance } from "./storage.js";
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER

const twilioClient = twilio(accountSid, authToken);

const PROXIMITY_THRESHOLD_KM = 2; // Default proximity threshold
const FIVE_MINUTES = 5 * 60 * 1000; // 5 minutes in ms
const NOTIFICATION_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days retention

export function setupNotificationService(wss) {
  /**
   * Enhanced notification system with dual delivery (WS + SMS)
   */
  async function sendNotification({ userId, type, message, tollPlazaId = null }) {
    try {
      // Clean message by removing any trailing timestamps
      const cleanMessage = message.replace(/\s*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\s*$/, '').trim();
      
      // Create notification with SMS status
      const notification = await NotificationLog.create({
        userId,
        tollPlazaId,
        type,
        message: cleanMessage, // Store cleaned message
        status: 'sent',
        smsStatus: 'pending',
        sentAt: new Date(),
        expiresAt: new Date(Date.now() + NOTIFICATION_TTL) // Auto-expire old notifications
      });

      const user = await User.findById(userId)
        .select('contactNumber settings name')
        .lean();

      if (!user) return notification;

      // SMS Handling
      if (user.contactNumber && user.settings?.smsAlertsEnabled) {
        const smsAllowed = user.settings[`${type}Alerts`]?.sms ?? false;
        
        if (smsAllowed) {
          try {
            await twilioClient.messages.create({
              body: `TollAlert: ${cleanMessage.substring(0, 160)}`,
              from: twilioPhone,
              to: user.contactNumber
            });
            
            await NotificationLog.updateOne(
              { _id: notification._id },
              { $set: { smsStatus: 'sent' } }
            );
          } catch (error) {
            await NotificationLog.updateOne(
              { _id: notification._id },
              { 
                $set: { 
                  smsStatus: 'failed',
                  smsError: error.message.substring(0, 200)
                } 
              }
            );
          }
        } else {
          await NotificationLog.updateOne(
            { _id: notification._id },
            { $set: { smsStatus: 'not_required' } }
          );
        }
      }

      // WebSocket broadcast with standardized format
      const populatedNotification = await NotificationLog.findById(notification._id)
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

      wss.clients.forEach(client => {
        if (client.userId === userId.toString() && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "notification",
            data: wsPayload
          }));
        }
      });

      return wsPayload;

    } catch (error) {
      console.error("Notification error:", error);
      throw error;
    }
  }
  
  async function checkProximityAlerts(userId, latitude, longitude) {
    try {
      const user = await User.findById(userId)
        .select('settings fastagBalance')
        .lean();

      if (!user?.settings?.notificationsEnabled) return;

      const tollPlazas = await TollPlaza.find();
      const fiveMinutesAgo = new Date(Date.now() - FIVE_MINUTES);
      
      // Check balance alert first
      if (user.settings.balanceAlerts?.enabled && 
          user.fastagBalance < user.settings.balanceAlerts.threshold) {
        
        const hasRecentBalanceAlert = await NotificationLog.exists({
          userId,
          type: "balance",
          sentAt: { $gte: fiveMinutesAgo }
        });

        if (!hasRecentBalanceAlert) {
          await sendNotification({
            userId,
            type: "balance",
            message: `Low balance: ₹${user.fastagBalance}. Minimum threshold: ₹${user.settings.balanceAlerts.threshold}`,
          });
        }
      }

      // Check proximity alerts
      for (const toll of tollPlazas) {
        const distance = calculateDistance(latitude, longitude, toll.latitude, toll.longitude);
        toll.distance = distance; // Add distance for reference
        
        if (distance <= PROXIMITY_THRESHOLD_KM && user.settings.proximityAlerts?.enabled) {
          const hasRecentAlert = await NotificationLog.exists({
            userId,
            tollPlazaId: toll._id,
            type: "proximity",
            sentAt: { $gte: fiveMinutesAgo }
          });

          if (!hasRecentAlert) {
            await sendNotification({
              userId,
              type: "proximity",
              message: `Approaching ${toll.name} (${distance.toFixed(1)}km away). Fee: ₹${toll.tollFee}`,
              tollPlazaId: toll._id
            });
          }
        }
      }
    } catch (error) {
      console.error("Proximity check error:", error);
    }
  }

  // Add method to mark notifications as read
  async function markAsRead(notificationIds, userId) {
    await NotificationLog.updateMany(
      { 
        _id: { $in: notificationIds },
        userId,
        status: 'sent' 
      },
      { $set: { status: 'read' } }
    );
  }

  return {
    sendNotification,
    checkProximityAlerts,
    markAsRead
  };
}