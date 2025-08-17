"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import DrawingCanvas from "../../../components/DrawingCanvas"
import Link from "next/link"

interface Room {
  id: string
  slug: string
  adminId: string
  Admin: {
    id: string
    name: string
    email: string
  }
  chats: Array<{
    id: number
    message: string
    userId: string
    User: {
      id: string
      name: string
      email: string
    }
  }>
}

interface User {
  id: string
  name: string
  email: string
}

export default function RoomPage() {
  const [room, setRoom] = useState<Room | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [connected, setConnected] = useState(false)
  const router = useRouter()
  const params = useParams()
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (!token || !userData) {
      router.push("/signin")
      return
    }

    setUser(JSON.parse(userData))
    fetchRoom()
  }, [params.slug, router])

  const fetchRoom = async () => {
    try {
      const token = localStorage.getItem("token")
      console.log("[v0] Fetching room:", params.slug)

      const response = await fetch(`http://localhost:3000/room/${params.slug}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("[v0] Room fetch response:", { status: response.status })

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Room data:", data)
        setRoom(data.room)
        connectWebSocket(data.room.id)
      } else {
        setError("Room not found")
      }
    } catch (err) {
      console.error("[v0] Room fetch error:", err)
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const connectWebSocket = (roomId: string) => {
    const token = localStorage.getItem("token")
    if (!token) return

    console.log("[v0] Connecting to WebSocket for room:", roomId)
    const ws = new WebSocket(`ws://localhost:8080?token=${token}`)
    wsRef.current = ws

    ws.onopen = () => {
      console.log("[v0] WebSocket connected")
      setConnected(true)

      const joinMessage = {
        type: "join_room",
        data: {
          roomId: roomId,
        },
      }

      console.log("[v0] Sending join room message:", joinMessage)
      ws.send(JSON.stringify(joinMessage))
    }

    ws.onclose = () => {
      console.log("[v0] WebSocket disconnected")
      setConnected(false)
    }

    ws.onerror = (error) => {
      console.error("[v0] WebSocket error:", error)
      setConnected(false)
    }

    ws.onmessage = (event) => {
      console.log("[v0] Room page received WebSocket message:", event.data)
    }
  }

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-indigo-600 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading room...</p>
        </div>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Room Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/dashboard"
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-sm"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 rounded-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 transition-colors">
                ← Dashboard
              </Link>
              <h1 className="text-lg font-bold text-gray-900">{room.slug}</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}></div>
                <span className="text-sm text-gray-600">{connected ? "Connected" : "Disconnected"}</span>
              </div>
              <span className="text-sm text-gray-600">Admin: {room.Admin.name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1">
        <DrawingCanvas roomId={room.id} websocket={wsRef.current} initialDrawings={room.chats} />
      </div>
    </div>
  )
}
