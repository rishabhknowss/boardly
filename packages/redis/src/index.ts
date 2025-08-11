import { createClient } from "redis";

type RedisClientType = ReturnType<typeof createClient>;

class RedisManager {
  private static instance: RedisClientType;

  static getInstance(): RedisClientType {
    if (!RedisManager.instance) {
      const client: RedisClientType = createClient({
        url: process.env.REDIS_URL || "redis://localhost:6379",
      });
      client.on("error", (err) => console.error("Redis Error", err));
      client.connect();
      RedisManager.instance = client;
    }
    return RedisManager.instance;
  }
}

export const redisClient: RedisClientType = RedisManager.getInstance();
