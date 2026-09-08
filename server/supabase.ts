import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { FeedbackItem } from '../src/types';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL?.trim();
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY
  )?.trim();

  if (!url || !key) {
    return null;
  }

  if (!supabaseClient) {
    try {
      supabaseClient = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (e) {
      console.error('初始化 Supabase 客户端失败:', e);
      return null;
    }
  }
  return supabaseClient;
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL?.trim();
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY
  )?.trim();
  return Boolean(url && key);
}

export function rowToFeedbackItem(row: Record<string, unknown>): FeedbackItem {
  return {
    id: String(row.id || ''),
    type: (row.type as FeedbackItem['type']) || '其他',
    feature: String(row.feature || ''),
    description: String(row.description || ''),
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    isAnonymous: Boolean(row.is_anonymous ?? row.isAnonymous ?? true),
    contactName: (row.contact_name as string) || (row.contactName as string) || undefined,
    contactInfo: (row.contact_info as string) || (row.contactInfo as string) || undefined,
    status: (row.status as FeedbackItem['status']) || '待处理',
    createdAt: String(row.created_at || row.createdAt || new Date().toISOString()),
    officialReply: (row.official_reply || row.officialReply) as FeedbackItem['officialReply'] || undefined,
    timeline: Array.isArray(row.timeline) ? (row.timeline as FeedbackItem['timeline']) : [],
    community: (row.community as string) || undefined,
    deviceInfo: (row.device_info as string) || (row.deviceInfo as string) || undefined,
  };
}

export function feedbackItemToRow(item: FeedbackItem): Record<string, unknown> {
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
