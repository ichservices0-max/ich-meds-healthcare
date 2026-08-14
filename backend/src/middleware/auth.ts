import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ─── TypeScript Augmentation ─────────────────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

// ─── JWT Payload shape ────────────────────────────────────────────────────────
interface JwtPayload {
  id: string;
  role?: string;
  iat?: number;
  exp?: number;
}

// ─── Middleware ───────────────────────────────────────────────────────────────
export const protectPatient = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided. Authorization denied.' });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Malformed authorization header.' });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not defined in environment variables');
      res.status(500).json({ error: 'Server configuration error.' });
      return;
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;

    req.user = { id: decoded.id };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token has expired. Please log in again.' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token. Authorization denied.' });
      return;
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
};

export const authenticateDoctor = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided. Authorization denied.' });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Malformed authorization header.' });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not defined in environment variables');
      res.status(500).json({ error: 'Server configuration error.' });
      return;
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;

    if (decoded.role !== 'doctor') {
      res.status(403).json({ error: 'Forbidden: Doctor access required' });
      return;
    }

    req.user = { id: decoded.id };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token has expired. Please log in again.' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token. Authorization denied.' });
      return;
    }
    console.error('Doctor Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
};

export const authenticateAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided. Authorization denied.' });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Malformed authorization header.' });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not defined in environment variables');
      res.status(500).json({ error: 'Server configuration error.' });
      return;
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;

    if (decoded.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
      return;
    }

    req.user = { id: decoded.id };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token has expired. Please log in again.' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token. Authorization denied.' });
      return;
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
};
