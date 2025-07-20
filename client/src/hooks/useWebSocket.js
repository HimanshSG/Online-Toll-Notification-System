import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for WebSocket connections
 * @param {string} userId - User ID for authentication
 * @returns {Object} WebSocket utilities
 */
export function useWebSocket(userId) {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);
  const reconnectRef = useRef(null);

  const connect = useCallback(() => {
    if (!userId) return;

    if (socketRef.current) {
      socketRef.current.close();
    }

    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("✅ WebSocket connected");
      setIsConnected(true);

      // Send auth message
      socket.send(JSON.stringify({
        type: "authenticate",
        userId,
      }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') {
          setNotifications(prev => {
            const alreadyExists = prev.some(notif => notif.id === data.data.id);
            if (!alreadyExists) {
              return [data.data, ...prev];
            }
            return prev;
          });
        }
      } catch (err) {
        console.error("WebSocket message parse error:", err);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = (event) => {
      console.warn(`⚠️ WebSocket closed: ${event.code}`);
      setIsConnected(false);

      if (event.code !== 1000) { // 1000 = normal close
        reconnectRef.current = setTimeout(() => {
          console.log("🔄 Reconnecting WebSocket...");
          connect();
        }, 3000);
      }
    };
  }, [userId]);

  const sendLocationUpdate = useCallback((location) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'locationUpdate',
        userId,
        latitude: location.latitude,
        longitude: location.longitude,
      }));
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      connect();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
      }
    };
  }, [userId, connect]);

  return {
    isConnected,
    notifications,
    sendLocationUpdate
  };
}

export default useWebSocket;
