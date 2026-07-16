import { useEffect, useRef, useCallback } from 'react';

const WS_BASE = window.location.port === '5173'
  ? 'ws://localhost:4000'
  : (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host;

export default function useWebSocket({ onDeviceOnline, onDeviceOffline, onAdminConnected, onDisconnect }) {
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  const connect = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`${WS_BASE}/ws?token=${token}`);

    ws.onopen = () => {
      clearTimeout(reconnectRef.current);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case 'admin_connected':
            onAdminConnected?.(msg.payload.onlineDevices || []);
            break;
          case 'device_online':
            onDeviceOnline?.(msg.payload);
            break;
          case 'device_offline':
            onDeviceOffline?.(msg.payload);
            break;
        }
      } catch {}
    };

    ws.onclose = () => {
      wsRef.current = null;
      onDisconnect?.();
      reconnectRef.current = setTimeout(connect, 5000);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, [onDeviceOnline, onDeviceOffline, onAdminConnected, onDisconnect]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  return wsRef;
}
