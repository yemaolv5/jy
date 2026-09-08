import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Types
export interface FeedbackReply {
  repliedAt: string;
  responderName: string;
  responderRole: string;
  content: string;
}

export interface FeedbackTimelineNode {
  time: string;
  title: string;
  description: string;
  operator?: string;
}

export type FeedbackStatus = '待处理' | '处理中' | '已采纳' | '已答复' | '暂缓处理';
export type FeedbackType = '操作优化' | '界面优化' | '增加功能建议' | '问题反馈' | '其他';

export interface FeedbackItem {
  id: string;
  type: FeedbackType;
  feature: string;
  description: string;
  images?: string[];
  isAnonymous: boolean;
  contactName?: string;
  contactInfo?: string;
  status: FeedbackStatus;
  createdAt: string;
  officialReply?: FeedbackReply;
  timeline?: FeedbackTimelineNode[];
  community?: string;
  deviceInfo?: string;
}

const DEFAULT_ITEMS: FeedbackItem[] = [
  {
    id: 'YJ20250907001',
    type: '增加功能建议',
    feature: '远程开门',
    description: '地下车库负一层信号较弱时，蓝牙开门等待时间较长，希望能支持离线蓝牙秘钥或开门小组件，方便回家直接通行。',
    images: [],
    isAnonymous: true,
    status: '已采纳',
    createdAt: '2025-09-07 14:28:10',
    community: '阳光香榭小区 (匿名已脱敏)',
    deviceInfo: 'iOS 18.2 / 客户端 v2.4.1 (无账号关联)',
    officialReply: {
      repliedAt: '2025-09-07 17:35:00',
      responderName: '智联硬件研发组 - 张工',
      responderRole: '技术主管',
      content: '感谢您的宝贵建议！我们已完成离线蓝牙离线验签协议方案评估，预计将在下周发布的 v2.5.0 版本上线“锁屏负一屏开门小组件”与离线蓝牙鉴权，敬请期待更新。',
    },
    timeline: [
      {
        time: '2025-09-07 14:28',
        title: '建议已匿名提交',
        description: '系统已剔除个人姓名、手机号及房号信息',
        operator: '系统',
      },
      {
        time: '2025-09-07 15:10',
        title: '产品与技术组已立项评估',
        description: '已安排门禁系统工程师联合软硬件团队现场实测',
        operator: '工程运维中心',
      },
      {
        time: '2025-09-07 17:35',
        title: '方案确认并正式答复',
        description: '建议已被采纳并安排排期研发',
        operator: '智联硬件研发组',
      },
    ],
  },
  {
    id: 'YJ20250906003',
    type: '界面优化',
    feature: '收费/在线缴费',
    description: '老年人看不清每期水电明细的字体，字号太小了，希望在账单详情页增加一键放大或长辈模式。',
    images: [],
    isAnonymous: true,
    status: '处理中',
    createdAt: '2025-09-06 09:15:22',
    community: '翠湖花园',
    deviceInfo: 'Android 14 (无账号关联)',
    timeline: [
      {
        time: '2025-09-06 09:15',
        title: '建议已匿名提交',
        description: '未附带任何个人私密数据',
        operator: '系统',
      },
      {
        time: '2025-09-06 10:00',
        title: 'UI/UX体验设计组受理',
        description: '已纳入适老化专项改造清单',
        operator: '体验设计部',
      },
    ],
  },
];

// Supabase Client Setup
function getSupabase(): SupabaseClient | null {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)?.trim();
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY
  )?.trim();

  if (!url || !key) {
    return null;
  }

  try {
    return createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (e) {
    console.error('Failed to init Supabase client:', e);
    return null;
  }
}

function rowToItem(row: Record<string, unknown>): FeedbackItem {
  return {
    id: String(row.id || ''),
    type: (row.type as FeedbackType) || '其他',
    feature: String(row.feature || ''),
    description: String(row.description || ''),
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    isAnonymous: Boolean(row.is_anonymous ?? row.isAnonymous ?? true),
    contactName: (row.contact_name as string) || (row.contactName as string) || undefined,
    contactInfo: (row.contact_info as string) || (row.contactInfo as string) || undefined,
    status: (row.status as FeedbackStatus) || '待处理',
    createdAt: String(row.created_at || row.createdAt || new Date().toISOString()),
    officialReply: (row.official_reply || row.officialReply) as FeedbackReply || undefined,
    timeline: Array.isArray(row.timeline) ? (row.timeline as FeedbackTimelineNode[]) : [],
    community: (row.community as string) || undefined,
    deviceInfo: (row.device_info as string) || (row.deviceInfo as string) || undefined,
  };
}

function itemToRow(item: FeedbackItem): Record<string, unknown> {
  return {
    id: item.id,
    type: item.type,
    feature: item.feature,
    description: item.description,
    images: item.images || [],
    is_anonymous: item.isAnonymous,
    contact_name: item.contactName || null,
    contact_info: item.contactInfo || null,
    status: item.status,
    created_at: item.createdAt,
    official_reply: item.officialReply || null,
    timeline: item.timeline || [],
    community: item.community || null,
    device_info: item.deviceInfo || null,
  };
}

// In-memory fallback
let memoryItems = [...DEFAULT_ITEMS];

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin!@#';
const ADMIN_TOKEN = 'wyx_admin_token_secure_key_2026';

export const app = express();

// CORS
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  if (auth === `Bearer ${ADMIN_TOKEN}`) {
    return next();
  }
  return res.status(401).json({ error: '未经授权的管理员访问' });
};

// Define API router
const router = express.Router();

// Status check
router.get('/storage-status', (_req: Request, res: Response) => {
  const supabase = getSupabase();
  res.json({
    success: true,
    configured: Boolean(supabase),
    mode: supabase ? 'supabase' : 'local_memory',
    message: supabase
      ? '已成功连通 Supabase 全球云端数据库！'
      : '未配置 Supabase 环境变量，当前运行在内存/本地模式。',
  });
});

// Admin login
router.post('/admin/login', (req: Request, res: Response) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.json({
      success: true,
      message: '管理员登录成功',
      token: ADMIN_TOKEN,
      adminUser: {
        username: ADMIN_USERNAME,
        role: '超级管理员',
        displayName: '系统管理员',
      },
    });
  }
  return res.status(401).json({ success: false, error: '账号或密码不正确' });
});

// Get feedback list
router.get('/feedback', async (req: Request, res: Response) => {
  const isAdmin = req.headers.authorization === `Bearer ${ADMIN_TOKEN}`;
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        let items = data.map((r) => rowToItem(r as Record<string, unknown>));
        if (!isAdmin) {
          items = items.map((i) =>
            i.isAnonymous ? { ...i, contactName: undefined, contactInfo: undefined } : i
          );
        }
        return res.json({ success: true, items, mode: 'supabase' });
      }
      console.error('Supabase query error:', error);
    } catch (err) {
      console.error('Supabase fetch error:', err);
    }
  }

  // Fallback
  let items = [...memoryItems];
  if (!isAdmin) {
    items = items.map((i) =>
      i.isAnonymous ? { ...i, contactName: undefined, contactInfo: undefined } : i
    );
  }
  res.json({ success: true, items, mode: 'local' });
});

// Submit feedback
router.post('/feedback', async (req: Request, res: Response) => {
  const newItem: FeedbackItem = req.body;
  if (!newItem || !newItem.description) {
    return res.status(400).json({ error: '建议内容不能为空' });
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      const row = itemToRow(newItem);
      const { error } = await supabase.from('feedback').insert(row);
      if (error) {
        console.error('Supabase insert error:', error);
      } else {
        memoryItems.unshift(newItem);
        return res.status(201).json({ success: true, item: newItem, mode: 'supabase' });
      }
    } catch (err) {
      console.error('Supabase insert exception:', err);
    }
  }

  memoryItems.unshift(newItem);
  res.status(201).json({ success: true, item: newItem, mode: 'local' });
});

// Admin status update
router.put('/admin/feedback/:id/status', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, operator, remark } = req.body;

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data: current } = await supabase.from('feedback').select('timeline').eq('id', id).single();
      const existingTimeline = (current?.timeline as FeedbackTimelineNode[]) || [];
      const newTimeline = [
        ...existingTimeline,
        {
          time: timeStr,
          title: `状态已变更为「${status}」`,
          description: remark || '管理员更新了处理状态',
          operator: operator || '系统管理员',
        },
      ];

      const { data, error } = await supabase
        .from('feedback')
        .update({ status, timeline: newTimeline })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return res.json({ success: true, item: rowToItem(data as Record<string, unknown>) });
      }
    } catch (err) {
      console.error('Supabase update status exception:', err);
    }
  }

  const found = memoryItems.find((i) => i.id === id);
  if (!found) return res.status(404).json({ error: '未找到该条记录' });
  found.status = status;
  found.timeline = [
    ...(found.timeline || []),
    {
      time: timeStr,
      title: `状态已变更为「${status}」`,
      description: remark || '管理员更新了处理状态',
      operator: operator || '系统管理员',
    },
  ];
  res.json({ success: true, item: found });
});

// Admin reply
router.post('/admin/feedback/:id/reply', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { responderName, responderRole, content, newStatus } = req.body;

  if (!content || !responderName) {
    return res.status(400).json({ error: '答复内容与答复人姓名不能为空' });
  }

  const now = new Date();
  const timeFull = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const timeShort = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const officialReply: FeedbackReply = {
    repliedAt: timeFull,
    responderName,
    responderRole: responderRole || '服务治理主管',
    content,
  };

  const status = newStatus || '已答复';
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data: current } = await supabase.from('feedback').select('timeline').eq('id', id).single();
      const existingTimeline = (current?.timeline as FeedbackTimelineNode[]) || [];
      const newTimeline = [
        ...existingTimeline,
        {
          time: timeShort,
          title: status === '已采纳' ? '建议已被采纳并答复' : '官方已答复',
          description: `${responderName} (${responderRole || '主管'})：${content.slice(0, 45)}...`,
          operator: responderName,
        },
      ];

      const { data, error } = await supabase
        .from('feedback')
        .update({
          official_reply: officialReply,
          status,
          timeline: newTimeline,
        })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return res.json({ success: true, item: rowToItem(data as Record<string, unknown>) });
      }
    } catch (err) {
      console.error('Supabase add reply exception:', err);
    }
  }

  const found = memoryItems.find((i) => i.id === id);
  if (!found) return res.status(404).json({ error: '未找到该条记录' });
  found.officialReply = officialReply;
  found.status = status;
  found.timeline = [
    ...(found.timeline || []),
    {
      time: timeShort,
      title: status === '已采纳' ? '建议已被采纳并答复' : '官方已答复',
      description: `${responderName}：${content.slice(0, 45)}...`,
      operator: responderName,
    },
  ];
  res.json({ success: true, item: found });
});

// Admin delete
router.delete('/admin/feedback/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('feedback').delete().eq('id', id);
    } catch (err) {
      console.error('Supabase delete exception:', err);
    }
  }
  memoryItems = memoryItems.filter((i) => i.id !== id);
  res.json({ success: true, message: '删除成功' });
});

// Admin stats
router.get('/admin/stats', requireAdmin, async (_req: Request, res: Response) => {
  const supabase = getSupabase();
  let items = memoryItems;
  if (supabase) {
    try {
      const { data } = await supabase.from('feedback').select('*');
      if (data) items = data.map((r) => rowToItem(r as Record<string, unknown>));
    } catch (e) {
      console.error('Stats fetch exception:', e);
    }
  }

  const total = items.length;
  const pending = items.filter((i) => i.status === '待处理').length;
  const processing = items.filter((i) => i.status === '处理中').length;
  const adopted = items.filter((i) => i.status === '已采纳').length;
  const replied = items.filter((i) => i.status === '已答复').length;
  const anonymous = items.filter((i) => i.isAnonymous).length;

  res.json({
    success: true,
    stats: {
      total,
      pending,
      processing,
      adopted,
      replied,
      anonymous,
      realname: total - anonymous,
      storageMode: supabase ? 'supabase' : 'local_memory',
    },
  });
});

// Mount router under both '/api' and '/' so Vercel rewrites work seamlessly
app.use('/api', router);
app.use('/', router);

// Vercel Serverless Function entry point
export default function handler(req: Request, res: Response) {
  return app(req, res);
}
