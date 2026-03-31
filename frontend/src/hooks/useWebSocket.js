import { useEffect, useRef, useCallback } from 'react'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'

// Singleton state — lives outside React, persists across navigation
let globalWs = null
let globalListeners = new Set()
let pendingMessages = []
let reconnectTimer = null
let reconnectAttempts = 0
let isConnecting = false

function getReadyState() {
  return globalWs?.readyState
}

function flushPending() {
  if (globalWs?.readyState !== WebSocket.OPEN) return
  const queue = pendingMessages.splice(0)
  queue.forEach(msg => globalWs.send(msg))
}

function broadcast(data) {
  globalListeners.forEach(fn => {
    try { fn(data) } catch (e) { console.error('[WS] Listener error', e) }
  })
}

function connect() {
  if (isConnecting) return
  if (globalWs?.readyState === WebSocket.OPEN) return
  if (globalWs?.readyState === WebSocket.CONNECTING) return

  clearTimeout(reconnectTimer)
  isConnecting = true

  const ws = new WebSocket(WS_URL)
  globalWs = ws

  ws.onopen = () => {
    console.log('[WS] Connected')
    isConnecting = false
    reconnectAttempts = 0
    flushPending()
  }

  ws.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data)
      broadcast(data)
    } catch (err) {
      console.error('[WS] Parse error', err)
    }
  }

  ws.onclose = () => {
    console.log('[WS] Disconnected')
    isConnecting = false
    globalWs = null
    const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000)
    reconnectAttempts += 1
    reconnectTimer = setTimeout(() => connect(), delay)
  }

  ws.onerror = (e) => {
    console.error('[WS] Error', e)
    isConnecting = false
  }
}

function sendMessage(data) {
  const msg = JSON.stringify(data)
  if (globalWs?.readyState === WebSocket.OPEN) {
    globalWs.send(msg)
  } else {
    pendingMessages.push(msg)
    connect()
  }
}

// Boot the connection immediately when this module loads
connect()

// React hook — just subscribes/unsubscribes a listener
export function useWebSocket(onMessage) {
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const listener = useCallback((data) => {
    onMessageRef.current?.(data)
  }, [])

  useEffect(() => {
    globalListeners.add(listener)
    if (getReadyState() !== WebSocket.OPEN && getReadyState() !== WebSocket.CONNECTING) {
      connect()
    }
    return () => {
      globalListeners.delete(listener)
    }
  }, [listener])

  const send = useCallback((data) => {
    sendMessage(data)
  }, [])

  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimer)
    globalWs?.close()
    globalWs = null
    pendingMessages = []
  }, [])

  return { send, disconnect }
}