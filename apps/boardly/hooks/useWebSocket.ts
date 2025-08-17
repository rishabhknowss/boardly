"use client"

import { useEffect, useRef, useCallback } from "react"
import { WebSocketClient } from "@/lib/api"

export function useWebSocket(roomId: string | null, token: string | null) {
  const wsClient = useRef<WebSocketClient | null>(null)

  const connect = useCallback(() => {
    if (!roomId || !token) {
      console.log("[v0] WebSocket hook: missing roomId or token")
      return
    }

    console.log("[v0] WebSocket hook: connecting to room", roomId)
    wsClient.current = new WebSocketClient()
    wsClient.current.connect(roomId, token)
  }, [roomId, token])

  const disconnect = useCallback(() => {
    console.log("[v0] WebSocket hook: disconnecting")
    if (wsClient.current) {
      wsClient.current.disconnect()
      wsClient.current = null
    }
  }, [])

  const sendMessage = useCallback((message: any) => {
    if (wsClient.current) {
      console.log("[v0] WebSocket hook: sending message", message)
      wsClient.current.sendMessage(message)
    }
  }, [])

  const onMessage = useCallback((handler: (message: any) => void) => {
    if (wsClient.current) {
      wsClient.current.onMessage(handler)
    }
  }, [])

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return {
    connect,
    disconnect,
    sendMessage,
    onMessage,
    isConnected: !!wsClient.current,
  }
}
