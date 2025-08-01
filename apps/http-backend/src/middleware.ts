import { NextFunction, Request, Response } from "express";

export function middleware(req: Request, res: Response, next: NextFunction) {
  // Log the request method and URL
  console.log(`${req.method} ${req.url}`);

  // Add any additional middleware logic here

  // Call the next middleware or route handler
  next();
}
