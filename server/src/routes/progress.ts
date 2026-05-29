import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_dev_key';

const authMiddleware = (req: any, res: any, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token, authorization denied' });

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

router.get('/', authMiddleware, async (req: any, res: any) => {
  try {
    const progress = await prisma.progress.findUnique({
      where: { userId: req.user.userId }
    });
    
    if (!progress) {
      return res.status(404).json({ error: 'Progress not found' });
    }
    
    res.json({
      unlockedLevels: JSON.parse(progress.unlockedLevels),
      starsData: JSON.parse(progress.starsData)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching progress' });
  }
});

router.post('/', authMiddleware, async (req: any, res: any) => {
  try {
    const { unlockedLevels, starsData } = req.body;
    
    const progress = await prisma.progress.update({
      where: { userId: req.user.userId },
      data: {
        unlockedLevels: JSON.stringify(unlockedLevels),
        starsData: JSON.stringify(starsData)
      }
    });
    
    res.json({ message: 'Progress updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error updating progress' });
  }
});

export default router;
