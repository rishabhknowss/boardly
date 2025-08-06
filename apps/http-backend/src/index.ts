import express, { Application } from "express";
import { middleware } from "./middleware";
import prisma from "@repo/db/prisma";
import { CreateRoomSchema, CreateUserSchema, SigninSchema } from "@repo/common/types";
import jwt from "jsonwebtoken";

const app: Application = express();

interface User {
  id: string;
  email: string;
  name: string | null;
  password: string;
}

// Extend the Request interface to include user from middleware
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
      };
    }
  }
}

app.use(express.json());

app.post("/signup", async (req, res) => {
  const payload = req.body;
  
  if (!payload.email || !payload.password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  
  try {
    const parsedPayload = CreateUserSchema.safeParse(payload);
    if (!parsedPayload.success) {
      return res.status(400).json({ 
        error: "Invalid user data", 
        details: parsedPayload.error 
      });
    }

    const user = await prisma.user.create({
      data: {
        email: parsedPayload.data.email,
        name: parsedPayload.data.name,
        password: parsedPayload.data.password,
      },
    });

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || "THISISJWTSECRET",
      {
        expiresIn: "1d",
      }
    );

    res.status(201).json({
      msg: "User created successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token: token
    });
  } catch (e: any) {
    if (e.code === 'P2002' && e.meta?.target?.includes('email')) {
      return res.status(409).json({ 
        error: 'A user with this email already exists' 
      });
    }
    console.error("Error creating user:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/signin", async (req, res) => {
  const payload = req.body;
  const parsedPayload = SigninSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return res.status(400).json({ 
      error: "Invalid credentials format", 
      details: parsedPayload.error 
    });
  }

  try {
    const user: User | null = await prisma.user.findUnique({
      where: {
        email: parsedPayload.data.email,
      },
    });

    // Check if user exists and password matches
    if (!user || user.password !== parsedPayload.data.password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || "THISISJWTSECRET",
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({
      msg: "Signin successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token: token
    });
  } catch (error) {
    console.error("Error signing in:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Create room endpoint - requires authentication
app.post("/create-room", middleware, async (req, res) => {
  const payload = req.body;
  
  // Validate request body exists
  if (!payload || Object.keys(payload).length === 0) {
    return res.status(400).json({ error: "Room data is required" });
  }

  // Validate payload structure
  const parsedPayload = CreateRoomSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return res.status(400).json({ 
      error: "Invalid room data", 
      details: parsedPayload.error 
    });
  }

  // Check if user is authenticated (from middleware)
  if (!req.user?.userId) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    // Check if room with this slug already exists
    const existingRoom = await prisma.room.findUnique({
      where: {
        slug: parsedPayload.data.slug,
      }
    });

    if (existingRoom) {
      return res.status(409).json({ 
        error: 'A room with this slug already exists' 
      });
    }

    // Create the room
    const room = await prisma.room.create({
      data: {
        slug: parsedPayload.data.slug,
        adminId: req.user.userId,
      },
      include: {
        Admin: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        }
      }
    });

    res.status(201).json({
      msg: "Room created successfully",
      room: {
        id: room.id,
        slug: room.slug,
        adminId: room.adminId,
        admin: room.Admin,
        createdAt: room.createdAt,
      },
    });
  } catch (e: any) {
    // Handle duplicate slug constraint (backup check)
    if (e.code === 'P2002' && e.meta?.target?.includes('slug')) {
      return res.status(409).json({ 
        error: 'A room with this slug already exists' 
      });
    }
    
    // Handle foreign key constraint (user doesn't exist)
    if (e.code === 'P2003' && e.meta?.field_name?.includes('adminId')) {
      return res.status(400).json({ 
        error: 'Invalid user ID' 
      });
    }

    console.error("Error creating room:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get user's rooms
app.get("/my-rooms", middleware, async (req, res) => {
  if (!req.user?.userId) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    const rooms = await prisma.room.findMany({
      where: {
        adminId: req.user.userId,
      },
      select: {
        id: true,
        slug: true,
        createdAt: true,
        _count: {
          select: {
            chats: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      }
    });

    res.status(200).json({
      msg: "Rooms retrieved successfully",
      rooms: rooms,
    });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get room details
app.get("/room/:slug", middleware, async (req, res) => {
  const { slug } = req.params;

  if (!slug) {
    return res.status(400).json({ error: "Room slug is required" });
  }

  try {
    const room = await prisma.room.findUnique({
      where: {
        slug: slug,
      },
      include: {
        Admin: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        },
        chats: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          },
          orderBy: {
            id: 'asc',
          }
        }
      }
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    res.status(200).json({
      msg: "Room details retrieved successfully",
      room: room,
    });
  } catch (error) {
    console.error("Error fetching room details:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

app.listen(3000, () => {
  console.log("HTTP Backend is running on port 3000");
});

export default app;