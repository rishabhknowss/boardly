import { WebSocketServer } from "ws";
import { RoomManager } from "./RoomManager";

import jwt from "jsonwebtoken";
const ws = new WebSocketServer({ port: 8080 });
const roomManager = RoomManager.getInstance();


function checkUser(token: string): boolean {
  if (!token) {
    return false;
  }
  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET || "THISISJWTSECRET"
  );
  if (!decoded || typeof decoded !== "object" || !("userId" in decoded)) {
    return false;
  }

  return true;
}
ws.on("connection", (socket, req) => {
  const url = req.url || "";
  if (!url) {
    return;
  }
  const QueryParams = new URLSearchParams(url.split("?")[1]);
  const token = QueryParams.get("token") || "";
  const userIsValid = checkUser(token);
  if (!userIsValid) {
    ws.close();
    return;
  }


  socket.on("message", (raw) => {
    const { type, data } = JSON.parse(raw.toString());

    if (type === "join_room") {
      roomManager.joinRoom(data.roomId, socket);
    }

    if (type === "chat_message") {
      roomManager.broadcast(data.roomId, {
        type: "chat_message",
        message: data.message,
      }, socket);
    }
  });

    socket.on("close", () => {
  });
});

