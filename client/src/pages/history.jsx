import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faList,
  faMapMarkerAlt,
  faWallet,
  faInfoCircle,
  faBellSlash,
  faTrash,
  faCheckCircle,
  faTimesCircle,
  faSms
} from '@fortawesome/free-solid-svg-icons';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, timeAgo } from '@/lib/utils';
import UserNavigation from '@/components/UserNavigation';
import { logout } from '@/lib/auth';
import { clearUserNotifications, getUserNotifications } from '@/lib/api';

const History = () => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [routeHistory, setRouteHistory] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const data = await getUserNotifications();
        setNotifications(data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        toast({
          title: 'Error',
          description: 'Failed to load notifications',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('history')) || [];
    setRouteHistory(savedHistory);
  }, []);

  const handleClearNotifications = async () => {
    try {
      await clearUserNotifications();
      setNotifications([]);
      toast({ title: 'Success', description: 'Notifications cleared' });
    } catch (error) {
      toast({ title: 'Error', description: 'Clear failed', variant: 'destructive' });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === filter);

  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const date = new Date(notification.sentAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(notification);
    return groups;
  }, {});

  return (
    <section className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <UserNavigation notifications={notifications} onLogout={handleLogout} />

      <div className="max-w-4xl mx-auto px-4 py-6 pb-20">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              History & Notifications
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Toll alerts and transaction history
            </p>
          </div>
          {notifications.length > 0 && filter !== 'routes' && (
            <Button variant="destructive" size="sm" onClick={handleClearNotifications}>
              <FontAwesomeIcon icon={faTrash} className="mr-2" />
              Clear All
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { value: 'all', label: 'All', icon: faList },
            { value: 'proximity', label: 'Toll Alerts', icon: faMapMarkerAlt },
            { value: 'balance', label: 'Balance', icon: faWallet },
            { value: 'routes', label: 'Routes', icon: faInfoCircle },
          ].map(({ value, label, icon }) => (
            <Button
              key={value}
              variant={filter === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(value)}
            >
              <FontAwesomeIcon icon={icon} className="mr-2" />
              {label}
            </Button>
          ))}
        </div>

        {filter === 'routes' ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-neutral-800 dark:text-white mb-4">
              Planned Routes
            </h2>
            {routeHistory.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FontAwesomeIcon icon={faBellSlash} className="text-gray-400 text-4xl mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    No saved routes
                  </h3>
                </CardContent>
              </Card>
            ) : (
              routeHistory.map((entry, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-neutral-800 dark:text-neutral-200">
                          {entry.route}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {entry.tollDetails.length} toll plazas
                        </p>
                        <p className="text-sm font-medium text-primary mt-1">
                          Total: {formatCurrency(entry.totalCost)}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatDate(entry.createdAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : Object.keys(groupedNotifications).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedNotifications)
              .sort(([a], [b]) => new Date(b) - new Date(a))
              .map(([date, items]) => (
                <div key={date}>
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    {date}
                  </h2>
                  <Card className="dark:bg-gray-800">
                    <CardContent className="p-0">
                      {items.map(notification => (
                        <div key={notification._id} className="p-4 border-b last:border-none dark:border-gray-700">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${
                              notification.type === 'proximity' 
                                ? 'bg-blue-100 dark:bg-blue-900/30'
                                : 'bg-red-100 dark:bg-red-900/30'
                            }`}>
                              <FontAwesomeIcon
                                icon={notification.type === 'proximity' ? faMapMarkerAlt : faWallet}
                                className={`text-lg ${
                                  notification.type === 'proximity' 
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-red-600 dark:text-red-400'
                                }`}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-neutral-800 dark:text-neutral-200">
                                    {notification.type === 'proximity'
                                      ? 'Toll Alert'
                                      : 'Balance Alert'}
                                  </span>
                                  <div className="flex gap-2">
                                    <Badge 
                                      variant={notification.status === 'seen' ? 'outline' : 'default'}
                                      className="text-xs"
                                    >
                                      {notification.status === 'seen' ? 'Read' : 'New'}
                                    </Badge>
                                    {notification.status.includes('sms') && (
                                      <Badge
                                        variant={notification.status === 'sms_failed' ? 'destructive' : 'secondary'}
                                        className="text-xs gap-1"
                                      >
                                        <FontAwesomeIcon 
                                          icon={notification.status === 'sms_sent' ? faCheckCircle : faTimesCircle} 
                                          className="h-3 w-3"
                                        />
                                        SMS {notification.status.split('_')[1]}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <span className="text-xs text-gray-400">
                                  {timeAgo(notification.sentAt)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {notification.message}
                                {notification.error && (
                                  <span className="text-xs text-red-500 dark:text-red-400 block mt-1">
                                    {notification.error}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FontAwesomeIcon icon={faBellSlash} className="text-gray-400 text-4xl mb-4" />
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                No notifications
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {filter === 'all' 
                  ? "You haven't received any notifications"
                  : `No ${filter} notifications found`}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
};

export default History;