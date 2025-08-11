import { redisClient } from "@repo/redis/index.ts";
import prisma from "@repo/db/prisma";

async function startWorker() {
  console.log("Worker started...");

  let lastId = "0"; // start from new messages only and  $ for last 

  while (true) {
    try {
      const streams = await redisClient.xRead(
        { key: "chat:all", id: lastId },
        { BLOCK: 5000, COUNT: 10 }
      );

      if (Array.isArray(streams)) {
        for (const stream of streams) {
          // Ensure stream is of the expected type before accessing messages
          if (
            typeof stream === "object" &&
            stream !== null &&
            "messages" in stream &&
            Array.isArray((stream as any).messages)
          ) {
            for (const message of (stream as any).messages) {
              lastId = message.id;
              const data = message.message;

              let parsed;
              try {
                parsed = JSON.parse(data.message);
              } catch {
                console.error("Invalid JSON in stream", data.message);
                continue;
              }

              await prisma.chat.create({
                data: {
                  roomId: parsed.roomId,
                  userId: parsed.userId,
                  message: JSON.stringify(parsed.message),
                },
              });

              console.log(`Saved drawing op in room ${parsed.roomId}`);
            }
          }
        }
      }
    } catch (err) {
      console.error("Worker error:", err);
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
}

startWorker();
