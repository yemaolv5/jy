import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, FeedbackItem, FeedbackStatus, AdminUser } from './types';
import { DEFAULT_FEEDBACK_LIST } from './data/mockData';
import { api, getStoredAdminSession, setStoredAdminSession } from './services/api';
import { Topbar } from './components/Topbar';
import { SuggestionForm } from './components/SuggestionForm';
import { HistoryView } from './components/HistoryView';
import { AdminView } from './components/AdminView';
import { AdminLoginDialog } from './components/AdminLoginDialog';
import { SuccessDialog } from './components/SuccessDialog';
import { ImageLightbox } from './components/ImageLightbox';

const STORAGE_KEY = 'wyx_suggestion_items_v2';

export default function App() {
  const [items, setItems] = useState<FeedbackItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse saved feedback items', e);
    }
    return DEFAULT_FEEDBACK_LIST;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('form');
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => getStoredAdminSession());
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);
  const [successItem, setSuccessItem] = useState<FeedbackItem | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2400);
  };

  // Load from database / server API on mount or when adminUser changes
  const refreshItems = useCallback(async () => {
    try {
      const remoteItems = await api.fetchFeedbacks();
      if (remoteItems && remoteItems.length > 0) {
        setItems(remoteItems);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteItems));
      }
    } catch (e) {
      console.warn('Could not fetch from server API, using local items', e);
    }
  }, []);

  useEffect(() => {
    refreshItems();
  }, [refreshItems, adminUser]);

  // Sync state to localStorage for offline robustness
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to sync items to localStorage', e);
    }
  }, [items]);

  // User submits new suggestion
  const handleCreateFeedback = async (newItem: FeedbackItem) => {
    // Optimistic UI update
    setItems((prev) => [newItem, ...prev]);
    setSuccessItem(newItem);

    try {
      const saved = await api.createFeedback(newItem);
      if (saved && saved.id) {
        setItems((prev) => prev.map((item) => (item.id === newItem.id ? saved : item)));
      }
    } catch (e) {
      console.error('Failed to persist to server API', e);
    }
  };

  // User deletes own submission
  const handleDeleteItem = async (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    await api.deleteFeedback(id);
    showToast('已撤回删除该条建议记录');
  };

  // User simulate reply in user view
  const handleSimulateReply = async (id: string) => {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const replyData = {
      responderName: '智汇服务体验组 - 王主管',
      responderRole: '产品负责人',
      content:
        '您好！非常感谢您的宝贵建议。我们已在内部完成方案评审，技术团队已安排优化改造，预期在近期版本上线，届时欢迎您体验！',
    };

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            status: '已采纳',
            officialReply: {
              repliedAt: timeStr,
              ...replyData,
            },
            timeline: [
              ...item.timeline,
              {
                time: `${String(now.getHours()).padStart(2, '0')}:${String(
                  now.getMinutes()
                ).padStart(2, '0')}`,
                title: '建议已被采纳并答复',
                description: '体验组评估通过，已进入排期开发流程',
                operator: '体验组负责人',
              },
            ],
          };
        }
        return item;
      })
    );

    await api.replyFeedback(id, replyData, '已采纳');
    showToast('已完成模拟官方审核与采纳答复！');
  };

  // Admin login success
  const handleAdminLoginSuccess = (admin: AdminUser) => {
    setAdminUser(admin);
    setStoredAdminSession(admin);
    setActiveTab('admin');
    showToast(`欢迎系统管理员 ${admin.username} 进入治理后台`);
    refreshItems();
  };

  // Admin logout
  const handleAdminLogout = () => {
    setAdminUser(null);
    setStoredAdminSession(null);
    setActiveTab('form');
    showToast('已安全退出管理后台');
    refreshItems();
  };

  // Admin updates status
  const handleAdminUpdateStatus = async (id: string, status: FeedbackStatus, remark?: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          return {
            ...item,
            status,
            timeline: [
              ...item.timeline,
              {
                time: timeStr,
                title: `状态已更新为「${status}」`,
                description: remark || '管理员流转了处理进度',
                operator: adminUser?.displayName || '系统管理员',
              },
            ],
          };
        }
        return item;
      })
    );

    const updated = await api.updateStatus(id, status, adminUser?.displayName || '系统管理员', remark);
    if (updated) {
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
    }
    showToast(`建议状态已成功流转为「${status}」`);
  };

  // Admin officially replies
  const handleAdminReply = async (
    id: string,
    reply: { responderName: string; responderRole: string; content: string },
    newStatus: FeedbackStatus
  ) => {
    const updated = await api.replyFeedback(id, reply, newStatus);
    if (updated) {
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } else {
      // Optimistic local update
      const now = new Date();
      const timeFull = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate()
      ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const timeShort = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      setItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              status: newStatus,
              officialReply: {
                repliedAt: timeFull,
                responderName: reply.responderName,
                responderRole: reply.responderRole,
                content: reply.content,
              },
              timeline: [
                ...item.timeline,
                {
                  time: timeShort,
                  title: newStatus === '已采纳' ? '建议已被采纳并答复' : '官方已正式答复',
                  description: `${reply.responderName}：${reply.content.slice(0, 30)}...`,
                  operator: reply.responderName,
                },
              ],
            };
          }
          return item;
        })
      );
    }
  };

  // Admin deletes item
  const handleAdminDelete = async (id: string) => {
    if (window.confirm('确定要彻底删除该条意见建议记录吗？此操作不可逆。')) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      await api.deleteFeedback(id);
      showToast('该条建议已从数据库中永久移除');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-start justify-center sm:py-4 px-0 sm:px-4">
      {/* Container adapts to wider width when in Admin View for dashboard ergonomics */}
      <main
        className={`w-full transition-all duration-300 min-h-screen sm:min-h-[720px] bg-slate-50 relative shadow-2xl sm:rounded-3xl overflow-hidden flex flex-col border border-slate-200/70 ${
          activeTab === 'admin' ? 'max-w-[760px]' : 'max-w-[520px]'
        }`}
        aria-label="意见建议服务与治理应用"
      >
        {/* Top Header */}
        <Topbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          submissionCount={items.length}
          adminUser={adminUser}
          onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'form' ? (
            <SuggestionForm
              onSubmit={handleCreateFeedback}
              onPreviewImage={(url) => setPreviewImageUrl(url)}
              onShowToast={showToast}
            />
          ) : activeTab === 'history' ? (
            <HistoryView
              items={items}
              onDeleteItem={handleDeleteItem}
              onSimulateReply={handleSimulateReply}
              onPreviewImage={(url) => setPreviewImageUrl(url)}
              onGoToForm={() => setActiveTab('form')}
            />
          ) : adminUser ? (
            <AdminView
              admin={adminUser}
              items={items}
              onLogout={handleAdminLogout}
              onBackToUser={() => setActiveTab('form')}
              onRefresh={async () => {
                await refreshItems();
                showToast('已从数据库同步最新数据');
              }}
              onUpdateStatus={handleAdminUpdateStatus}
              onReply={handleAdminReply}
              onDelete={handleAdminDelete}
              onPreviewImage={(url) => setPreviewImageUrl(url)}
              onShowToast={showToast}
            />
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-500">请先登录管理员账号</p>
              <button
                type="button"
                onClick={() => setIsAdminLoginOpen(true)}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                管理员登录
              </button>
            </div>
          )}
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 px-4 py-2.5 rounded-xl bg-slate-900/90 text-white text-xs sm:text-sm font-medium shadow-2xl backdrop-blur-sm pointer-events-none transition-all duration-200 animate-in fade-in zoom-in-95 text-center max-w-[85vw]"
          >
            {toastMessage}
          </div>
        )}

        {/* Admin Login Dialog */}
        <AdminLoginDialog
          isOpen={isAdminLoginOpen}
          onClose={() => setIsAdminLoginOpen(false)}
          onSuccess={handleAdminLoginSuccess}
        />

        {/* Success Modal */}
        <SuccessDialog
          isOpen={!!successItem}
          item={successItem}
          onContinue={() => setSuccessItem(null)}
          onViewProgress={() => {
            setSuccessItem(null);
            setActiveTab('history');
          }}
        />

        {/* Lightbox for screenshots */}
        <ImageLightbox
          imageUrl={previewImageUrl}
          onClose={() => setPreviewImageUrl(null)}
        />
      </main>
    </div>
  );
}
