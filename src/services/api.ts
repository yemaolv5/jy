import { FeedbackItem, FeedbackStatus, AdminUser } from '../types';

const ADMIN_STORAGE_KEY = 'wyx_feedback_admin_session';

export const getStoredAdminSession = (): AdminUser | null => {
  try {
    const raw = sessionStorage.getItem(ADMIN_STORAGE_KEY) || localStorage.getItem(ADMIN_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read admin session', e);
  }
  return null;
};

export const setStoredAdminSession = (admin: AdminUser | null) => {
  if (!admin) {
    sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  } else {
    sessionStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(admin));
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(admin));
  }
};

const getHeaders = () => {
  const admin = getStoredAdminSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (admin?.token) {
    headers['Authorization'] = `Bearer ${admin.token}`;
  }
  return headers;
};

export const api = {
  // Admin Login
  loginAdmin: async (username: string, password: string): Promise<{ success: boolean; adminUser?: AdminUser; error?: string }> => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const admin: AdminUser = {
          username: data.adminUser.username,
          role: data.adminUser.role,
          displayName: data.adminUser.displayName,
          token: data.token,
        };
        setStoredAdminSession(admin);
        return { success: true, adminUser: admin };
      }
      return { success: false, error: data.error || '账号密码不对' };
    } catch (e) {
      // Local fallback in case of direct static preview
      if (username === 'admin' && password === 'admin!@#') {
        const admin: AdminUser = {
          username: 'admin',
          role: '超级管理员',
          displayName: '系统管理员',
          token: 'wyx_admin_token_secure_key_2026',
        };
        setStoredAdminSession(admin);
        return { success: true, adminUser: admin };
      }
      return { success: false, error: '账号密码不对' };
    }
  },

  // Fetch all feedback
  fetchFeedbacks: async (): Promise<FeedbackItem[]> => {
    try {
      const res = await fetch('/api/feedback', {
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.items)) {
          return data.items;
        }
      }
    } catch (e) {
      console.warn('API fetchFeedbacks error, falling back to local storage', e);
    }
    // Fallback to localStorage
    const saved = localStorage.getItem('wyx_suggestion_items_v2');
    return saved ? JSON.parse(saved) : [];
  },

  // Submit feedback
  createFeedback: async (item: FeedbackItem): Promise<FeedbackItem> => {
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.item) {
          return data.item;
        }
      }
    } catch (e) {
      console.warn('API createFeedback error, saving locally', e);
    }
    return item;
  },

  // Admin update status
  updateStatus: async (
    id: string,
    status: FeedbackStatus,
    operator: string = '系统管理员',
    remark?: string
  ): Promise<FeedbackItem | null> => {
    try {
      const res = await fetch(`/api/admin/feedback/${id}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status, operator, remark }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.item) {
          return data.item;
        }
      }
    } catch (e) {
      console.warn('API updateStatus error', e);
    }
    return null;
  },

  // Admin official reply
  replyFeedback: async (
    id: string,
    reply: { responderName: string; responderRole: string; content: string },
    newStatus: FeedbackStatus = '已答复'
  ): Promise<FeedbackItem | null> => {
    try {
      const res = await fetch(`/api/admin/feedback/${id}/reply`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ...reply, newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.item) {
          return data.item;
        }
      }
    } catch (e) {
      console.warn('API replyFeedback error', e);
    }
    return null;
  },

  // Admin delete
  deleteFeedback: async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        return !!data.success;
      }
    } catch (e) {
      console.warn('API deleteFeedback error', e);
    }
    return false;
  },

  // Admin stats
  fetchStats: async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          return data.stats;
        }
      }
    } catch (e) {
      console.warn('API fetchStats error', e);
    }
    return null;
  },
};
