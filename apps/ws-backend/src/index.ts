import { WebSocketServer } from "ws";
import { RoomManager } from "./RoomManager";
import { redisClient } from "@repo/redis/index.ts";

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
  let currentRoomId: string | null = null;
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

  socket.on("message", async (raw) => {
    const { type, data } = JSON.parse(raw.toString());

    const decodedToken = jwt.decode(token);
    const userId =
      typeof decodedToken === "object" &&
      decodedToken !== null &&
      "userId" in decodedToken
        ? (decodedToken.userId as string)
        : "";

    console.log("New connection", { userId });

    if (type === "join_room") {
     currentRoomId = data.roomId;

      roomManager.joinRoom(data.roomId, socket);
    }

    console.log(data);

    if (type === "chat_message") {
      const red = await redisClient.xAdd("chat:all", "*", {
        message: JSON.stringify({
          roomId: data.roomId,
          userId: userId,
          message: data.message,
        }),
      });
      console.log(
        "Message added to Redis",
        { roomId: data.roomId, userId: userId, message: data.message },
        red
      );
      roomManager.broadcast(
        data.roomId,
        {
          type: "chat_message",
          message: data.message,
        },
        socket
      );
    }
  });

  socket.on("close", () => {
    if (currentRoomId) {
      roomManager.leaveRoom(currentRoomId, socket);
      console.log(`User left room ${currentRoomId}`);
    }
  });
});
