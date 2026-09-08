export type FeedbackType = '操作优化' | '界面优化' | '增加功能建议' | '功能建议' | '问题反馈' | '其他';

export type FeedbackStatus = '待处理' | '处理中' | '已采纳' | '已答复' | '已归档';

export interface TimelineEvent {
  time: string;
  title: string;
  description?: string;
  operator?: string;
}

export interface FeedbackItem {
  id: string;
  type: FeedbackType;
  feature: string;
  description: string;
  images: string[]; // base64 or blob URLs
  isAnonymous: boolean;
  contactName?: string;
  contactInfo?: string;
  status: FeedbackStatus;
  createdAt: string;
  officialReply?: {
    repliedAt: string;
    responderName: string;
    responderRole: string;
    content: string;
  };
  timeline: TimelineEvent[];
  community?: string;
  deviceInfo?: string;
}

export interface AdminUser {
  username: string;
  role: string;
  displayName: string;
  token: string;
}

export type ActiveTab = 'form' | 'history' | 'admin';
