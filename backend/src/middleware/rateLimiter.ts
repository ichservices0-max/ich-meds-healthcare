import { Request, Response, NextFunction } from 'express';

export const authIpLimiter = (_req: Request, _res: Response, next: NextFunction) => next();
export const authAccountLimiter = (_req: Request, _res: Response, next: NextFunction) => next();
export const publicLimiter = (_req: Request, _res: Response, next: NextFunction) => next();
export const apiLimiter = (_req: Request, _res: Response, next: NextFunction) => next();

