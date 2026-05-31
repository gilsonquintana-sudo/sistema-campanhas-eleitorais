import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

interface DecodedToken {
  id: number;
  email: string;
  nivel: string;
  candidato_id?: number;
  multiplicador_id?: number;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as DecodedToken;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

export const authorizeLevel = (levels: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !levels.includes(req.user.nivel)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    next();
  };
};
