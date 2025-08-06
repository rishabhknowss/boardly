import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

// Extend the Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
      };
    }
  }
}

interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export function middleware(req: Request, res: Response, next: NextFunction) {
  // Log the request method and URL
  console.log(`${req.method} ${req.url}`);

  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: "Authorization header is required" 
      });
    }

    // Check if the header starts with "Bearer "
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        error: "Authorization header must start with 'Bearer '" 
      });
    }

    // Extract the token
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    if (!token) {
      return res.status(401).json({ 
        error: "Token is required" 
      });
    }

    // Verify the token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || "THISISJWTSECRET"
    ) as JwtPayload;

    if (!decoded.userId) {
      return res.status(401).json({ 
        error: "Invalid token payload" 
      });
    }

    // Attach user info to the request object
    req.user = {
      userId: decoded.userId
    };

    // Call the next middleware or route handler
    next();

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        error: "Invalid token" 
      });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        error: "Token has expired" 
      });
    }

    console.error("Middleware error:", error);
    return res.status(500).json({ 
      error: "Internal server error" 
    });
  }
}