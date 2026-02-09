import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

interface AuthRequest extends Request {
  auth?: {
    userId: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: "Authorization header missing" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET || "RANDOM_TOKEN_SECRET") as JwtPayload;

    if (!decodedToken || typeof decodedToken !== "object" || !decodedToken.userId) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    req.auth = { userId: decodedToken.userId };
    next();
  } catch (error) {
    res.status(401).json({ error: "Authentication failed" });
  }
};
