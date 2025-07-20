import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatDate, timeAgo } from '@/lib/utils';

const HistoryTab = ({ notifications = [] }) => {
  const [view, setView] = useState('all');
  
  // Notification type configuration
  const notificationTypes = {
    all: { label: 'All', icon: 'list' },
    proximity: { label: 'Toll Alerts', icon: 'map-marker-alt' },
    balance: { label: 'Balance', icon: 'wallet' }
  };

  // Get styling for notification type
  const getNotificationStyle = (type) => {
    switch(type) {
      case 'proximity':
        return {
          icon: 'map-marker-alt',
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          text: 'text-blue-600 dark:text-blue-400',
          label: 'Toll Alert'
        };
      case 'balance':
        return {
          icon: 'wallet',
          bg: 'bg-red-100 dark:bg-red-900/30',
          text: 'text-red-600 dark:text-red-400',
          label: 'Balance Alert'
        };
      default:
        return {
          icon: 'bell',
          bg: 'bg-gray-100 dark:bg-gray-800',
          text: 'text-gray-600 dark:text-gray-400',
          label: 'Notification'
        };
    }
  };

  const filteredNotifications = view === 'all' 
    ? notifications
    : notifications.filter(n => n.type === view);
  
  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const date = new Date(notification.sentAt).toLocaleDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(notification);
    return groups;
  }, {});

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20">
      <h1 className="text-xl font-bold mb-4 dark:text-white">History</h1>
      
      <Tabs defaultValue="all" onValueChange={setView}>
        <TabsList className="grid w-full grid-cols-3 mb-4">
          {Object.entries(notificationTypes).map(([type, { label, icon }]) => (
            <TabsTrigger key={type} value={type}>
              <FontAwesomeIcon icon={icon} className="mr-2 text-xs" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {filteredNotifications.length === 0 ? (
          <Card className="dark:bg-gray-800">
            <CardContent className="py-10 text-center">
              <div className="rounded-full w-16 h-16 bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon 
                  icon={notificationTypes[view]?.icon || 'bell'} 
                  className="text-gray-400 dark:text-gray-300 text-xl" 
                />
              </div>
              <h3 className="text-lg font-medium mb-2 dark:text-white">No notifications</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {view === 'all' 
                  ? "You don't have any notifications yet"
                  : `No ${notificationTypes[view]?.label.toLowerCase()} found`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedNotifications)
              .sort(([a], [b]) => new Date(b) - new Date(a))
              .map(([date, items]) => (
                <div key={date}>
                  <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-medium">
                    {new Date(date).toDateString() === new Date().toDateString()
                      ? 'Today'
                      : new Date(date).toDateString() === new Date(Date.now() - 86400000).toDateString()
                        ? 'Yesterday'
                        : formatDate(date)}
                  </h3>
                  <Card className="dark:bg-gray-800">
                    <CardContent className="p-0">
                      {items.map(notification => {
                        const { icon, bg, text, label } = getNotificationStyle(notification.type);
                        return (
                          <div key={notification.id} className="p-4 border-b last:border-none dark:border-gray-700">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${bg}`}>
                                <FontAwesomeIcon icon={icon} className={`text-lg ${text}`} />
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-medium text-neutral-800 dark:text-neutral-200">
                                    {label}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {timeAgo(notification.sentAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {notification.message}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>
              ))}
          </div>
        )}
      </Tabs>
    </div>
  );
};

export default HistoryTab;