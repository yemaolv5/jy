import fs from 'fs';
import path from 'path';
import { FeedbackItem, FeedbackStatus } from '../src/types';
import { DEFAULT_FEEDBACK_LIST } from '../src/data/mockData';

const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = isVercel ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'feedback_db.json');
const SEED_FILE = path.join(process.cwd(), 'data', 'feedback_db.json');

export class FeedbackDatabase {
  private items: FeedbackItem[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        this.items = JSON.parse(content);
      } else if (isVercel && fs.existsSync(SEED_FILE)) {
        const content = fs.readFileSync(SEED_FILE, 'utf-8');
        this.items = JSON.parse(content);
        this.save();
      } else {
        // Seed default items
        this.items = [...DEFAULT_FEEDBACK_LIST];
        this.save();
      }
    } catch (err) {
      console.error('Failed to initialize database, using default seed data:', err);
      this.items = [...DEFAULT_FEEDBACK_LIST];
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.items, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database to file:', err);
    }
  }

  public getAll(isAdmin: boolean = false): FeedbackItem[] {
    if (isAdmin) {
      return [...this.items];
    }
    // Return all items for user view (with anonymity respected)
    return this.items.map((item) => {
      if (item.isAnonymous) {
        return {
          ...item,
          contactName: undefined,
          contactInfo: undefined,
        };
      }
      return item;
    });
  }

  public getById(id: string): FeedbackItem | undefined {
    return this.items.find((i) => i.id === id);
  }

  public add(item: FeedbackItem): FeedbackItem {
    this.items.unshift(item);
    this.save();
    return item;
  }

  public updateStatus(id: string, status: FeedbackStatus, operator: string = '管理员', remark?: string): FeedbackItem | null {
    const item = this.items.find((i) => i.id === id);
    if (!item) return null;

    item.status = status;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    item.timeline = item.timeline || [];
    item.timeline.push({
      time: timeStr,
      title: `状态已更新为「${status}」`,
      description: remark || `管理员更新了建议处理状态`,
      operator,
    });

    this.save();
    return item;
  }

  public addReply(
    id: string,
    reply: { responderName: string; responderRole: string; content: string },
    newStatus: FeedbackStatus = '已答复'
  ): FeedbackItem | null {
    const item = this.items.find((i) => i.id === id);
    if (!item) return null;

    const now = new Date();
    const timeFull = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const timeShort = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    item.officialReply = {
      repliedAt: timeFull,
      responderName: reply.responderName,
      responderRole: reply.responderRole,
      content: reply.content,
    };
    item.status = newStatus;

    item.timeline = item.timeline || [];
    item.timeline.push({
      time: timeShort,
      title: newStatus === '已采纳' ? '建议已被采纳并答复' : '官方已正式答复',
      description: `${reply.responderName} (${reply.responderRole})：${reply.content.slice(0, 40)}...`,
      operator: reply.responderName,
    });

    this.save();
    return item;
  }

  public delete(id: string): boolean {
    const initialLen = this.items.length;
    this.items = this.items.filter((i) => i.id !== id);
    if (this.items.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public getStats() {
    const total = this.items.length;
    const pending = this.items.filter((i) => i.status === '待处理').length;
    const processing = this.items.filter((i) => i.status === '处理中').length;
    const adopted = this.items.filter((i) => i.status === '已采纳').length;
    const replied = this.items.filter((i) => i.status === '已答复').length;
    const anonymous = this.items.filter((i) => i.isAnonymous).length;

    return {
      total,
      pending,
      processing,
      adopted,
      replied,
      anonymous,
      realname: total - anonymous,
    };
  }
}

export const db = new FeedbackDatabase();
