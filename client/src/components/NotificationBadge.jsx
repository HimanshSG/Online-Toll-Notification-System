import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faMapMarkerAlt, faWallet } from '@fortawesome/free-solid-svg-icons';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDate, timeAgo } from '@/lib/utils';

const NotificationBadge = ({ notifications = [], onClick = () => {} }) => {
  const unreadCount = notifications.filter(n => n.status === 'sent').length;

  // Group notifications by date (today, yesterday, older)
  const groupNotifications = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups = {
      today: [],
      yesterday: [],
      older: []
    };

    notifications.forEach(notification => {
      const notifDate = new Date(notification.sentAt);
      notifDate.setHours(0, 0, 0, 0);

      if (notifDate.getTime() === today.getTime()) {
        groups.today.push(notification);
      } else if (notifDate.getTime() === yesterday.getTime()) {
        groups.yesterday.push(notification);
      } else {
        groups.older.push(notification);
      }
    });

    return groups;
  };

  const groupedNotifications = groupNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <FontAwesomeIcon icon={faBell} className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary"></span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-medium">Notifications</h4>
          {notifications.length > 0 && (
            <Badge variant="secondary">{notifications.length}</Badge>
          )}
        </div>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <FontAwesomeIcon 
              icon={faBell} 
              className="h-12 w-12 text-muted-foreground mb-3" 
            />
            <p className="text-sm text-muted-foreground">
              No notifications yet
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            {Object.entries(groupedNotifications).map(([group, groupNotifications]) => {
              if (groupNotifications.length === 0) return null;

              return (
                <div key={group}>
                  <div className="px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
                    {group === 'today' ? 'Today' : group === 'yesterday' ? 'Yesterday' : 'Older'}
                  </div>
                  {groupNotifications.map((notification) => (
                    <div 
                      key={notification.id || notification.sentAt} 
                      className={`p-4 border-b hover:bg-muted/50 transition-colors cursor-pointer ${
                        notification.status === 'sent' ? 'bg-muted/20' : ''
                      }`}
                      onClick={() => onClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`rounded-full p-2 ${
                          notification.type === 'proximity' 
                            ? 'bg-primary/10 text-primary' 
                            : 'bg-destructive/10 text-destructive'
                        }`}>
                          <FontAwesomeIcon 
                            icon={notification.type === 'proximity' ? faMapMarkerAlt : faWallet} 
                            className="h-4 w-4" 
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium">
                                {notification.type === 'proximity' ? 'Toll Plaza Alert' : 'Balance Alert'}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {timeAgo(notification.sentAt)}
                            </span>
                          </div>
                          <p className="text-sm mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(notification.sentAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBadge;