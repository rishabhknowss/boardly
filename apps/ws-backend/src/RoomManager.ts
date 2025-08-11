import { WebSocket } from "ws";

export class RoomManager {
  private static instance: RoomManager;
  private rooms: Map<string, Set<WebSocket>> = new Map();

  private constructor() {} 

  public static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  public joinRoom(roomId: string, socket: WebSocket) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(socket);
  }

  public leaveRoom(roomId: string, socket: WebSocket) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(socket);
      if (room.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  public broadcast(roomId: string, message: any , exclude?: WebSocket) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    for (const client of room) {
      if (client !== exclude) {
        client.send(JSON.stringify(message));
      }
    }
  }
}
