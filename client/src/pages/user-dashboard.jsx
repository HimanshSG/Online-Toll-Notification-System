import React, { useState, useEffect, useCallback } from 'react';
import { useLocation as useNavigate } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { getUserNotifications, getUserProfile, updateUserLocation, getNearbyTollPlazas } from '@/lib/api';
import { logout } from '@/lib/auth';
import useLocation from '@/hooks/useLocation';
import useWebSocket from '@/hooks/useWebSocket';
import UserNavigation from '@/components/UserNavigation';
import UserTabs from '@/components/UserTabs';
import HomeTab from '@/components/DashboardTabs/HomeTab';
import HistoryTab from '@/components/DashboardTabs/HistoryTab';
import ProfileTab from '@/components/DashboardTabs/ProfileTab';

const LOCATION_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

const UserDashboard = () => {
  const [, setLocation] = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('home');
  const [userData, setUserData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [nearbyTolls, setNearbyTolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  const { location: userLocation, error: locationError, refreshLocation } = useLocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  });

  const userId = userData?.id;
  const { isConnected: wsConnected, notifications: wsNotifications, sendLocationUpdate } = useWebSocket(userId);

  // Enhanced error handling
  const handleError = useCallback((error, context) => {
    console.error(`Error in ${context}:`, error);
    toast({
      title: 'Error',
      description: error.message || `Failed to ${context}`,
      variant: 'destructive',
    });
  }, [toast]);

  // Fetch user profile with retry logic
  const fetchUserData = useCallback(async () => {
    try {
      const profile = await getUserProfile();
      setUserData(profile);
    } catch (error) {
      handleError(error, 'fetching user profile');
    }
  }, [handleError]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Fetch notifications with WebSocket integration
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!userData) return;
      
      try {
        const notifs = await getUserNotifications();
        setNotifications(notifs);
      } catch (error) {
        handleError(error, 'fetching notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [userData, handleError]);

  // Handle WebSocket notifications with deduplication
  useEffect(() => {
    if (wsNotifications.length > 0) {
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const newNotifs = wsNotifications.filter(wsNotif => !existingIds.has(wsNotif.id));
        return [...newNotifs, ...prev];
      });
    }
  }, [wsNotifications]);

  // Location update handler with status tracking
  const handleLocationUpdate = useCallback(async () => {
    if (!userLocation || !userData) return;

    setIsUpdatingLocation(true);
    try {
      await updateUserLocation({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });

      sendLocationUpdate({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });

      const nearby = await getNearbyTollPlazas({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radius: 50 // kilometers
      });

      setNearbyTolls(nearby);
    } catch (error) {
      handleError(error, 'updating location');
    } finally {
      setIsUpdatingLocation(false);
    }
  }, [userLocation, userData, sendLocationUpdate, handleError]);

  // Scheduled location updates
  useEffect(() => {
    let intervalId;

    if (userLocation && userData) {
      handleLocationUpdate(); // Initial update
      intervalId = setInterval(handleLocationUpdate, LOCATION_UPDATE_INTERVAL);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [userLocation, userData, handleLocationUpdate]);

  // Location error handling
  useEffect(() => {
    if (locationError) {
      toast({
        title: 'Location Access Required',
        description: 'Enable location services for toll alerts',
        variant: 'destructive',
        action: (
          <Button variant="outline" onClick={refreshLocation}>
            Retry
          </Button>
        )
      });
    }
  }, [locationError, toast, refreshLocation]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setLocation('/');
    } catch (error) {
      handleError(error, 'logging out');
    }
  }, [setLocation, handleError]);

  const handleRechargeSuccess = useCallback((addedAmount) => {
    setUserData(prev => ({
      ...prev,
      fastagBalance: (prev.fastagBalance || 0) + addedAmount,
      updatedAt: new Date().toISOString(),
    }));
    
    // Trigger balance check after recharge
    if (userLocation) {
      handleLocationUpdate();
    }
  }, [userLocation, handleLocationUpdate]);

  if (loading && !userData) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-background text-foreground">
      <UserNavigation 
        notifications={notifications} 
        onLogout={handleLogout}
        connectionStatus={wsConnected ? 'connected' : 'disconnected'}
      />

      <div className="pb-20">
        {activeTab === 'home' && (
          <HomeTab
            userData={userData}
            userLocation={userLocation}
            nearbyTolls={nearbyTolls}
            notifications={notifications}
            onRefreshLocation={refreshLocation}
            onRechargeSuccess={handleRechargeSuccess}
            isUpdatingLocation={isUpdatingLocation}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab 
            notifications={notifications} 
            wsConnection={wsConnected}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileTab
            userData={userData}
            onUpdateSuccess={(updatedData) => {
              setUserData(updatedData);
              fetchUserData(); // Refresh all user data
            }}
          />
        )}
      </div>

      <UserTabs 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        notificationCount={notifications.filter(n => n.status === 'unread').length}
      />
    </section>
  );
};

export default UserDashboard;