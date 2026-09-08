import fs from 'fs';
import path from 'path';
import { FeedbackItem, FeedbackStatus } from '../src/types';
import { DEFAULT_FEEDBACK_LIST } from '../src/data/mockData';
import {
  getSupabaseClient,
  isSupabaseConfigured,
  rowToFeedbackItem,
  feedbackItemToRow,
} from './supabase';

const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = isVercel ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'feedback_db.json');
const SEED_FILE = path.join(process.cwd(), 'data', 'feedback_db.json');

export function formatCSTDateTime(dateInput: Date = new Date(), includeSeconds: boolean = false): string {
  try {
    const formatter = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: false,
    });
    const parts = formatter.formatToParts(dateInput);
    const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
    const y = get('year');
    const m = get('month');
    const d = get('day');
    const h = get('hour');
    const min = get('minute');
    const s = get('second');
    return includeSeconds && s ? `${y}-${m}-${d} ${h}:${min}:${s}` : `${y}-${m}-${d} ${h}:${min}`;
  } catch {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${dateInput.getFullYear()}-${pad(dateInput.getMonth() + 1)}-${pad(dateInput.getDate())} ${pad(dateInput.getHours())}:${pad(dateInput.getMinutes())}`;
  }
}

class FeedbackDatabase {
  private localItems: FeedbackItem[] = [];

  constructor() {
    this.initLocal();
  }

  private initLocal() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        this.localItems = JSON.parse(content);
      } else if (isVercel && fs.existsSync(SEED_FILE)) {
        const content = fs.readFileSync(SEED_FILE, 'utf-8');
        this.localItems = JSON.parse(content);
        this.saveLocal();
      } else {
        this.localItems = [...DEFAULT_FEEDBACK_LIST];
        this.saveLocal();
      }
    } catch (err) {
      console.error('Failed to initialize local database fallback:', err);
      this.localItems = [...DEFAULT_FEEDBACK_LIST];
    }
  }

  private saveLocal() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.localItems, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist local database fallback:', err);
    }
  }

  public getStorageMode(): 'supabase' | 'local_file' {
    return isSupabaseConfigured() ? 'supabase' : 'local_file';
  }

  public async getAll(isAdmin: boolean = false): Promise<FeedbackItem[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('feedback')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase query error, falling back to local store:', error);
        } else if (data) {
          const items = data.map((row) => rowToFeedbackItem(row as Record<string, unknown>));
          if (!isAdmin) {
            return items.map((item) => {
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
          return items;
        }
      } catch (err) {
        console.error('Failed to fetch from Supabase:', err);
      }
    }

    // Local fallback
    if (isAdmin) {
      return [...this.localItems];
    }
    return this.localItems.map((item) => {
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

  public async getById(id: string): Promise<FeedbackItem | undefined> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('feedback')
          .select('*')
          .eq('id', id)
          .single();
        if (!error && data) {
          return rowToFeedbackItem(data as Record<string, unknown>);
        }
      } catch (e) {
        console.error('Supabase getById error:', e);
      }
    }
    return this.localItems.find((i) => i.id === id);
  }

  public async add(item: FeedbackItem): Promise<FeedbackItem> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const row = feedbackItemToRow(item);
        const { error } = await supabase.from('feedback').insert(row);
        if (error) {
          console.error('Supabase insert error, saving to local fallback:', error);
        } else {
          // Keep local mirror updated as well
          this.localItems.unshift(item);
          this.saveLocal();
          return item;
        }
      } catch (err) {
        console.error('Failed to insert into Supabase:', err);
      }
    }

    // Local save
    this.localItems.unshift(item);
    this.saveLocal();
    return item;
  }

  public async updateStatus(
    id: string,
    status: FeedbackStatus,
    operator: string = '管理员',
    remark?: string
  ): Promise<FeedbackItem | null> {
    const now = new Date();
    const timeStr = formatCSTDateTime(now, false);

    const currentItem = await this.getById(id);
    if (!currentItem) return null;

    const newTimeline = [
      ...(currentItem.timeline || []),
      {
        time: timeStr,
        title: `状态已更新为「${status}」`,
        description: remark || `管理员更新了建议处理状态`,
        operator,
      },
    ];

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase
          .from('feedback')
          .update({
            status,
            timeline: newTimeline,
          })
          .eq('id', id);

        if (error) {
          console.error('Supabase updateStatus error:', error);
        } else {
          currentItem.status = status;
          currentItem.timeline = newTimeline;
          // Update local mirror
          const localIndex = this.localItems.findIndex((i) => i.id === id);
          if (localIndex !== -1) {
            this.localItems[localIndex] = { ...currentItem };
            this.saveLocal();
          }
          return currentItem;
        }
      } catch (e) {
        console.error('Supabase update error:', e);
      }
    }

    // Local fallback
    const local = this.localItems.find((i) => i.id === id);
    if (!local) return null;
    local.status = status;
    local.timeline = newTimeline;
    this.saveLocal();
    return local;
  }

  public async addReply(
    id: string,
    reply: { responderName: string; responderRole: string; content: string },
    newStatus: FeedbackStatus = '已答复'
  ): Promise<FeedbackItem | null> {
    const currentItem = await this.getById(id);
    if (!currentItem) return null;

    const now = new Date();
    const timeFull = formatCSTDateTime(now, true);
    const timeShort = formatCSTDateTime(now, false);

    const officialReply = {
      repliedAt: timeFull,
      responderName: reply.responderName,
      responderRole: reply.responderRole,
      content: reply.content,
    };

    const newTimeline = [
      ...(currentItem.timeline || []),
      {
        time: timeShort,
        title: newStatus === '已采纳' ? '建议已被采纳并答复' : '官方已正式答复',
        description: `${reply.responderName} (${reply.responderRole})：${reply.content.slice(0, 40)}...`,
        operator: reply.responderName,
      },
    ];

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase
          .from('feedback')
          .update({
            official_reply: officialReply,
            status: newStatus,
            timeline: newTimeline,
          })
          .eq('id', id);

        if (error) {
          console.error('Supabase addReply error:', error);
        } else {
          currentItem.officialReply = officialReply;
          currentItem.status = newStatus;
          currentItem.timeline = newTimeline;
          const localIndex = this.localItems.findIndex((i) => i.id === id);
          if (localIndex !== -1) {
            this.localItems[localIndex] = { ...currentItem };
            this.saveLocal();
          }
          return currentItem;
        }
      } catch (e) {
        console.error('Supabase addReply error:', e);
      }
    }

    // Local fallback
    const local = this.localItems.find((i) => i.id === id);
    if (!local) return null;
    local.officialReply = officialReply;
    local.status = newStatus;
    local.timeline = newTimeline;
    this.saveLocal();
    return local;
  }

  public async delete(id: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('feedback').delete().eq('id', id);
        if (error) {
          console.error('Supabase delete error:', error);
        } else {
          this.localItems = this.localItems.filter((i) => i.id !== id);
          this.saveLocal();
          return true;
        }
      } catch (e) {
        console.error('Supabase delete error:', e);
      }
    }

    const initialLen = this.localItems.length;
    this.localItems = this.localItems.filter((i) => i.id !== id);
    if (this.localItems.length !== initialLen) {
      this.saveLocal();
      return true;
    }
    return false;
  }

  public async getStats() {
    const items = await this.getAll(true);
    const total = items.length;
    const pending = items.filter((i) => i.status === '待处理').length;
    const processing = items.filter((i) => i.status === '处理中').length;
    const adopted = items.filter((i) => i.status === '已采纳').length;
    const replied = items.filter((i) => i.status === '已答复').length;
    const anonymous = items.filter((i) => i.isAnonymous).length;

    return {
      total,
      pending,
      processing,
      adopted,
      replied,
      anonymous,
      realname: total - anonymous,
      storageMode: this.getStorageMode(),
    };
  }
}

export const db = new FeedbackDatabase();
