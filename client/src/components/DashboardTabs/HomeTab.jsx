import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMapMarkerAlt, 
  faCheckCircle, 
  faTimesCircle, 
  faSms 
} from '@fortawesome/free-solid-svg-icons';
import { Button} from '@/components/ui/button';
import RechargeDialog from '@/components/RechargeDialog';
import FastagBalanceCard from '@/components/FastagBalanceCard';
import MapComponent from '@/components/MapComponent';
import TollCard from '@/components/TollCard';
import { formatDate, timeAgo } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";

const HomeTab = ({ 
  userData, 
  userLocation, 
  nearbyTolls = [], 
  notifications = [],
  onRechargeSuccess 
}) => {
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  
  const nearestToll = nearbyTolls.length > 0 ? nearbyTolls[0] : null;
  
  const todayProximityNotifications = notifications
    .filter(n => n.type === 'proximity' && n.sentAt && new Date(n.sentAt).toDateString() === new Date().toDateString())
    .slice(0, 3);

  if (!userData) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-muted rounded-lg p-10 text-center">
          <FontAwesomeIcon icon="spinner" spin className="text-primary text-4xl mb-4" />
          <p>Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 bg-background text-foreground">
      <FastagBalanceCard 
        fastagBalance={userData.fastagBalance || 0}
        fastagId={userData.fastagId}
        isVerified={userData.isVerified}
        onRechargeClick={() => setIsRechargeOpen(true)}
      />

      <section className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Your Location</h2>
        </div>
        
        <MapComponent 
          userLocation={userLocation} 
          tollPlazas={nearbyTolls} 
        />
        
        {!userLocation && (
          <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded text-sm text-yellow-800 dark:text-yellow-200">
            <FontAwesomeIcon icon="exclamation-circle" className="mr-1" />
            Location services are required to detect nearby toll plazas. Please enable location access.
          </div>
        )}
      </section>

      {nearestToll && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold mb-3">Nearest Toll Plaza</h2>
          <TollCard 
            toll={nearestToll} 
            distance={nearestToll.distance} 
            highlighted={nearestToll.distance <= 2}
          />
        </section>
      )}

      {nearbyTolls.length > 1 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold mb-3">Upcoming Toll Plazas</h2>
          <div className="grid grid-cols-1 gap-3">
            {nearbyTolls.slice(1, 4).map(toll => (
              <TollCard 
                key={toll.id || `${toll.name}-${toll.distance}`} 
                toll={toll} 
                distance={toll.distance} 
                compact={true}
              />
            ))}
          </div>
        </section>
      )}

      {todayProximityNotifications.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold mb-3">Today's Toll Alerts</h2>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {todayProximityNotifications.map(notification => (
              <div 
                key={notification.id || notification.sentAt} 
                className="p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <div className="rounded-full p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-3">
                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                    </div>
                    <div>
                      <p className="text-sm">{notification.message.replace(/\s*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\s*$/, '')}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {timeAgo(notification.sentAt)}
                        </span>
                        {notification.status?.includes('sms') && (
                          <Badge 
                            variant={notification.status === 'sms_failed' ? 'destructive' : 'secondary'} 
                            className="text-xs gap-1 py-0.5"
                          >
                            <FontAwesomeIcon 
                              icon={notification.status === 'sms_sent' ? faCheckCircle : faTimesCircle} 
                              className="h-3 w-3"
                            />
                            SMS {notification.status.split('_')[1]}
                          </Badge>
                        )}
                      </div>
                      {notification.error && (
                        <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                          {notification.error}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge 
                    variant={notification.status === 'seen' ? 'outline' : 'default'}
                    className="text-xs"
                  >
                    {notification.status === 'seen' ? 'Read' : 'New'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <RechargeDialog 
        open={isRechargeOpen}
        onOpenChange={setIsRechargeOpen}
        currentBalance={userData.fastagBalance || 0}
        fastagId={userData.fastagId}
        onRechargeSuccess={onRechargeSuccess}
      />
    </div>
  );
};

export default HomeTab;