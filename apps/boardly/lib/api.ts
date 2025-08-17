const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080"

export interface User {
  id: string
  email: string
  name: string
}

export interface Room {
  id: string
  name: string
  slug: string
  createdBy: string
  createdAt: string
}

export interface DrawingMessage {
  id: string
  roomId: string
  userId: string
  type: "draw" | "shape" | "text" | "clear"
  data: any
  timestamp: string
}

class ApiClient {
  private token: string | null = null

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("token")
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    console.log("[v0] API Request:", endpoint, options)

    const url = `${API_BASE_URL}${endpoint}`
    const headers = {
      "Content-Type": "application/json",
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      console.log("[v0] API Response status:", response.status)

      if (!response.ok) {
        const error = await response.text()
        console.error("[v0] API Error:", error)
        throw new Error(error || "Request failed")
      }

      const data = await response.json()
      console.log("[v0] API Response data:", data)
      return data
    } catch (error) {
      console.error("[v0] API Request failed:", error)
      throw error
    }
  }

  async signup(email: string, password: string, name: string) {
    console.log("[v0] Signing up user:", email)
    const response = await this.request("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    })

    if (response.token) {
      this.token = response.token
      localStorage.setItem("token", response.token)
      console.log("[v0] User signed up successfully")
    }

    return response
  }

  async signin(email: string, password: string) {
    console.log("[v0] Signing in user:", email)
    const response = await this.request("/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })

    if (response.token) {
      this.token = response.token
      localStorage.setItem("token", response.token)
      console.log("[v0] User signed in successfully")
    }

    return response
  }

  async getProfile(): Promise<User> {
    console.log("[v0] Fetching user profile")
    return this.request("/auth/me")
  }

  async createRoom(name: string): Promise<Room> {
    console.log("[v0] Creating room:", name)
    return this.request("/rooms", {
      method: "POST",
      body: JSON.stringify({ name }),
    })
  }

  async getRooms(): Promise<Room[]> {
    console.log("[v0] Fetching user rooms")
    return this.request("/rooms")
  }

  async getRoom(slug: string): Promise<Room> {
    console.log("[v0] Fetching room:", slug)
    return this.request(`/rooms/${slug}`)
  }

  async getRoomMessages(roomId: string): Promise<DrawingMessage[]> {
    console.log("[v0] Fetching room messages:", roomId)
    return this.request(`/rooms/${roomId}/messages`)
  }

  logout() {
    console.log("[v0] User logging out")
    this.token = null
    localStorage.removeItem("token")
  }

  isAuthenticated(): boolean {
    return !!this.token
  }

  getToken(): string | null {
    return this.token
  }
}

export const apiClient = new ApiClient()

// WebSocket connection utility
export class WebSocketClient {
  private ws: WebSocket | null = null
  private roomId: string | null = null
  private token: string | null = null
  private messageHandlers: ((message: any) => void)[] = []

  connect(roomId: string, token: string) {
    console.log("[v0] Connecting to WebSocket for room:", roomId)

    this.roomId = roomId
    this.token = token

    const wsUrl = `${WS_BASE_URL}?roomId=${roomId}&token=${token}`
    this.ws = new WebSocket(wsUrl)

    this.ws.onopen = () => {
      console.log("[v0] WebSocket connected")
    }

    this.ws.onmessage = (event) => {
      console.log("[v0] WebSocket message received:", event.data)
      try {
        const message = JSON.parse(event.data)
        this.messageHandlers.forEach((handler) => handler(message))
      } catch (error) {
        console.error("[v0] Failed to parse WebSocket message:", error)
      }
    }

    this.ws.onclose = () => {
      console.log("[v0] WebSocket disconnected")
    }

    this.ws.onerror = (error) => {
      console.error("[v0] WebSocket error:", error)
    }
  }

  sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log("[v0] Sending WebSocket message:", message)
      this.ws.send(JSON.stringify(message))
    } else {
      console.error("[v0] WebSocket not connected")
    }
  }

  onMessage(handler: (message: any) => void) {
    this.messageHandlers.push(handler)
  }

  disconnect() {
    console.log("[v0] Disconnecting WebSocket")
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.messageHandlers = []
  }
}
