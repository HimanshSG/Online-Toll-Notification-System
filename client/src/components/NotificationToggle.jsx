import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export default function NotificationToggle() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkExistingSubscription();
  }, []);

  const checkExistingSubscription = async () => {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    }
  };

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      if (isSubscribed) {
        await unsubscribe();
      } else {
        await subscribe();
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribe = async () => {
    // 1. Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permission denied');
    }

    // 2. Register service worker
    const reg = await navigator.serviceWorker.register('/sw.js');
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
    });

    // 3. Send to backend
    const response = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
      credentials: 'include' // For session cookies
    });

    if (!response.ok) throw new Error('Subscription failed');
    setIsSubscribed(true);
    toast.success('Notifications enabled!');
  };

  const unsubscribe = async () => {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      await fetch('/api/subscribe', {
        method: 'DELETE',
        credentials: 'include'
      });
    }

    setIsSubscribed(false);
    toast.info('Notifications disabled');
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`px-4 py-2 rounded-md text-white ${
        isSubscribed ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
      }`}
    >
      {isLoading ? 'Processing...' : isSubscribed ? 'Disable Notifications' : 'Enable Notifications'}
    </button>
  );
}