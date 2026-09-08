import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { FeedbackItem, FeedbackStatus } from '../src/types';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin!@#';
const ADMIN_TOKEN_SECRET = 'wyx_admin_token_secure_key_2026';

export const app = express();

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Helper auth check middleware for admin routes
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader === `Bearer ${ADMIN_TOKEN_SECRET}`) {
    return next();
  }
  return res.status(401).json({ error: '未经授权的管理员访问' });
};

// API 1: Admin Login
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.json({
      success: true,
      message: '管理员登录成功',
      token: ADMIN_TOKEN_SECRET,
      adminUser: {
        username: ADMIN_USERNAME,
        role: '超级管理员',
        displayName: '系统管理员',
      },
    });
  }
  return res.status(401).json({
    success: false,
    error: '账号密码不对',
  });
});

// API 2: Get all feedback items
app.get('/api/feedback', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const isAdmin = authHeader === `Bearer ${ADMIN_TOKEN_SECRET}`;
  const items = await db.getAll(isAdmin);
  res.json({ success: true, items, storageMode: db.getStorageMode() });
});

// API 3: Submit new feedback
app.post('/api/feedback', async (req: Request, res: Response) => {
  const newItem: FeedbackItem = req.body;
  if (!newItem || !newItem.description) {
    return res.status(400).json({ error: '建议描述不能为空' });
  }

  const saved = await db.add(newItem);
  res.status(201).json({ success: true, item: saved, storageMode: db.getStorageMode() });
});

// API 4: Admin update status
app.put('/api/admin/feedback/:id/status', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, operator, remark } = req.body as {
    status: FeedbackStatus;
    operator?: string;
    remark?: string;
  };

  const updated = await db.updateStatus(id, status, operator || '管理员', remark);
  if (!updated) {
    return res.status(404).json({ error: '未找到指定建议记录' });
  }
  res.json({ success: true, item: updated });
});

// API 5: Admin official reply
app.post('/api/admin/feedback/:id/reply', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { responderName, responderRole, content, newStatus } = req.body;

  if (!content || !responderName) {
    return res.status(400).json({ error: '答复内容与答复人姓名不能为空' });
  }

  const updated = await db.addReply(
    id,
    { responderName, responderRole: responderRole || '服务主管', content },
    newStatus || '已答复'
  );

  if (!updated) {
    return res.status(404).json({ error: '未找到指定建议记录' });
  }
  res.json({ success: true, item: updated });
});

// API 6: Admin delete item
app.delete('/api/admin/feedback/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = await db.delete(id);
  if (!deleted) {
    return res.status(404).json({ error: '未找到指定建议记录' });
  }
  res.json({ success: true, message: '删除成功' });
});

// API 7: Admin stats
app.get('/api/admin/stats', requireAdmin, async (_req: Request, res: Response) => {
  const stats = await db.getStats();
  res.json({ success: true, stats });
});

// API 8: Storage status check
app.get('/api/storage-status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    mode: db.getStorageMode(),
    configured: db.getStorageMode() === 'supabase',
    message:
      db.getStorageMode() === 'supabase'
        ? '已成功连接到 Supabase 云端 PostgreSQL 数据库'
        : '当前运行在本地文件/模拟存储模式。配置 SUPABASE_URL 和 SUPABASE_ANON_KEY 后即可启用全球云同步。',
  });
});
