/**
 * Socket.IO real-time service for delivery partner app.
 * Uses socket.io-client npm package.
 * Events: new_order_placed, order_status_updated, delivery_update
 *
 * Exponential backoff: reconnection delay doubles on each failure (2s → 4s → 8s → ... → max 60s).
 * Error throttling: timeout errors logged max once every 30s to avoid console spam.
 */

import { API_BASE } from '../utils/constants';
import { useDeliveryStore } from '../store/deliveryStore';
import { io as IO } from 'socket.io-client';

let _socket = null;
let _reconnectTimer = null;
let _pollInterval = null;
let _reconnectAttempts = 0;       // reset on success
let _lastTimeoutLog = 0;          // throttle timeout logs (ms timestamp)
const LOG_THROTTLE_MS = 30000;    // max 1 timeout log per 30s
const BASE_RECONNECT_MS = 2000;   // start at 2s
const MAX_RECONNECT_MS = 60000;   // cap at 60s

function _backoffMs() {
  const delay = Math.min(BASE_RECONNECT_MS * Math.pow(2, _reconnectAttempts), MAX_RECONNECT_MS);
  return delay;
}

function _throttledLog(prefix, msg) {
  const now = Date.now();
  if (now - _lastTimeoutLog > LOG_THROTTLE_MS) {
    _lastTimeoutLog = now;
    console.log(prefix, msg);
  }
}

/** Check if backend appears reachable (WS or API succeeded recently) */
export function isBackendReachable() {
  return _socket?.connected || false;
}

export function connectSocketIO() {
  disconnectSocketIO();

  const serverUrl = API_BASE.replace('/api', '');
  console.log('[WS] Connecting Socket.IO to:', serverUrl);

  try {
    const reconnectDelay = _backoffMs();
    console.log(`[WS] Reconnect attempt #${_reconnectAttempts + 1}, delay: ${reconnectDelay}ms`);

    _socket = IO(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: reconnectDelay,
      reconnectionDelayMax: MAX_RECONNECT_MS,
      reconnectionAttempts: 50,        // finite attempts with backoff (~8 min total)
      timeout: 8000,                   // slightly longer for mobile networks
    });

    _socket.on('connect', () => {
      _reconnectAttempts = 0;          // reset backoff on success
      _lastTimeoutLog = 0;             // reset throttle
      console.log('[WS] Connected:', _socket.id);
      useDeliveryStore.getState().setWsConnected(true);
      _socket.emit('join_delivery');
      // Immediately fetch orders — resets _consecutivePollFailures on success
      useDeliveryStore.getState().loadOrders();
    });

    _socket.on('disconnect', (reason) => {
      console.log('[WS] Disconnected:', reason);
      useDeliveryStore.getState().setWsConnected(false);
    });

    _socket.on('connect_error', (err) => {
      _reconnectAttempts++;
      useDeliveryStore.getState().setWsConnected(false);
      // Only log timeout errors once per 30s to avoid spam
      if (err.message === 'timeout') {
        _throttledLog(`[WS] Timeout (attempt #${_reconnectAttempts}) — backend may be down`);
      } else {
        console.log('[WS] Error:', err.message);
      }
    });

    _socket.on('room_joined', (data) => {
      console.log('[WS] Room:', data.room);
    });

    // ── Events from backend ──────────────────────

    _socket.on('new_order_placed', (data) => {
      console.log('[WS] New order:', data.order_id);
      useDeliveryStore.getState().loadOrders();
      try {
        const { playNewOrderAlert } = require('./notificationService');
        playNewOrderAlert();
      } catch {}
    });

    _socket.on('order_status_updated', (data) => {
      console.log('[WS] Order status:', data.order_id, '->', data.status);
      useDeliveryStore.getState().loadOrders();
    });

    _socket.on('delivery_update', (data) => {
      console.log('[WS] Delivery:', data.order_id, data.status);
      useDeliveryStore.getState().loadOrders();
    });

  } catch (e) {
    console.log('[WS] Setup error:', e.message);
  }
}

export function disconnectSocketIO() {
  clearTimeout(_reconnectTimer);
  _reconnectTimer = null;
  if (_socket) {
    try { _socket.removeAllListeners(); _socket.close(); } catch (e) {}
    _socket = null;
  }
  useDeliveryStore.getState().setWsConnected(false);
}

/** Start real-time: Socket.IO + smart polling (pauses when backend known-down) */
export function startRealtime(pollIntervalMs = 5000) {
  connectSocketIO();
  _pollInterval = setInterval(() => {
    // Skip polling if WS disconnected for a while — avoids spamming timeouts
    const store = useDeliveryStore.getState();
    if (!store.wsConnected && store._consecutivePollFailures >= 3) {
      // Exponential backoff for polling too
      const skipCount = store._consecutivePollFailures - 3;
      const skipInterval = Math.min(skipCount + 1, 12); // 4s → 12s → ... → 60s
      if (skipCount > 0 && skipCount % skipInterval !== 0) return;
    }
    store.loadOrders();
  }, pollIntervalMs);
  return () => {
    disconnectSocketIO();
    clearInterval(_pollInterval);
    _pollInterval = null;
  };
}

export function reconnectSocketIO() {
  disconnectSocketIO();
  connectSocketIO();
}
