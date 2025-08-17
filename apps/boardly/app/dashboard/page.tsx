"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Room {
  id: string
  slug: string
  createdAt: string
  _count: {
    chats: number
  }
}

interface User {
  id: string
  name: string
  email: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [showJoinRoom, setShowJoinRoom] = useState(false)
  const [newRoomSlug, setNewRoomSlug] = useState("")
  const [joinRoomSlug, setJoinRoomSlug] = useState("")
  const [createLoading, setCreateLoading] = useState(false)
  const [joinLoading, setJoinLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (!token || !userData) {
      router.push("/signin")
      return
    }

    setUser(JSON.parse(userData))
    fetchRooms()
  }, [router])

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem("token")
      console.log("[v0] Fetching rooms with token:", token ? "present" : "missing")

      const response = await fetch("http://localhost:3000/my-rooms", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("[v0] Rooms fetch response:", { status: response.status })

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Rooms data:", data)
        setRooms(data.rooms)
      } else {
        setError("Failed to fetch rooms")
      }
    } catch (err) {
      console.error("[v0] Rooms fetch error:", err)
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setError("")

    console.log("[v0] Creating room with slug:", newRoomSlug)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:3000/create-room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slug: newRoomSlug }),
      })

      const data = await response.json()
      console.log("[v0] Create room response:", { status: response.status, data })

      if (response.ok) {
        setShowCreateRoom(false)
        setNewRoomSlug("")
        fetchRooms()
      } else {
        setError(data.error || "Failed to create room")
      }
    } catch (err) {
      console.error("[v0] Create room error:", err)
      setError("Network error")
    } finally {
      setCreateLoading(false)
    }
  }

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setJoinLoading(true)
    setError("")

    console.log("[v0] Joining room with slug:", joinRoomSlug)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:3000/room/${joinRoomSlug}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("[v0] Join room response:", { status: response.status })

      if (response.ok) {
        router.push(`/room/${joinRoomSlug}`)
      } else {
        setError("Room not found")
      }
    } catch (err) {
      console.error("[v0] Join room error:", err)
      setError("Network error")
    } finally {
      setJoinLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-indigo-600 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <span className="text-xl font-bold text-gray-900">boardly</span>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name}</span>
              <button onClick={handleLogout} className="text-gray-500 hover:text-gray-900 transition-colors">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Rooms</h1>
          <p className="text-gray-600">Create and manage your drawing spaces</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">{error}</div>}

        <div className="mb-8">
          <div className="flex gap-4">
            <button
              onClick={() => setShowCreateRoom(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all font-medium shadow-sm"
            >
              Create Room
            </button>
            <button
              onClick={() => setShowJoinRoom(true)}
              className="border border-indigo-600 text-indigo-600 px-6 py-3 rounded-xl hover:bg-indigo-50 transition-all font-medium"
            >
              Join Room
            </button>
          </div>
        </div>

        {showCreateRoom && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create Room</h2>
              <form onSubmit={handleCreateRoom}>
                <div className="mb-4">
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                    Room Name
                  </label>
                  <input
                    type="text"
                    id="slug"
                    value={newRoomSlug}
                    onChange={(e) => setNewRoomSlug(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="my-room"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition-all font-medium disabled:opacity-50 shadow-sm"
                  >
                    {createLoading ? "Creating..." : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateRoom(false)
                      setNewRoomSlug("")
                      setError("")
                    }}
                    className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition-all font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showJoinRoom && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Join Room</h2>
              <form onSubmit={handleJoinRoom}>
                <div className="mb-4">
                  <label htmlFor="joinSlug" className="block text-sm font-medium text-gray-700 mb-2">
                    Room Name
                  </label>
                  <input
                    type="text"
                    id="joinSlug"
                    value={joinRoomSlug}
                    onChange={(e) => setJoinRoomSlug(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="room-name"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={joinLoading}
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition-all font-medium disabled:opacity-50 shadow-sm"
                  >
                    {joinLoading ? "Joining..." : "Join"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowJoinRoom(false)
                      setJoinRoomSlug("")
                      setError("")
                    }}
                    className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition-all font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {rooms.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms yet</h3>
            <p className="text-gray-600 mb-6">Create your first room to get started</p>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-sm"
            >
              Create Your First Room
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <Link
                key={room.id}
                href={`/room/${room.slug}`}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">{room.slug.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="text-sm text-gray-500">{formatDate(room.createdAt)}</div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  {room.slug}
                </h3>

                <div className="text-sm text-gray-500">{room._count.chats} drawings</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
