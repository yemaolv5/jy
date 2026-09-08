import React from 'react';
import { ChevronLeft, FileText, PlusCircle, ShieldCheck, UserCheck } from 'lucide-react';
import { ActiveTab, AdminUser } from '../types';

interface TopbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  submissionCount: number;
  adminUser: AdminUser | null;
  onOpenAdminLogin: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  activeTab,
  onTabChange,
  submissionCount,
  adminUser,
  onOpenAdminLogin,
}) => {
  const handleAdminEntryClick = () => {
    if (adminUser) {
      onTabChange('admin');
    } else {
      onOpenAdminLogin();
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-3.5 sm:px-4 text-white shadow-md bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600">
      {/* Left section */}
      <div className="flex items-center gap-1.5 min-w-[92px]">
        {activeTab === 'history' || activeTab === 'admin' ? (
          <button
            id="topbar-back-button"
            type="button"
            onClick={() => onTabChange('form')}
            className="flex items-center gap-0.5 text-xs sm:text-sm font-medium text-white/90 hover:text-white transition-colors cursor-pointer py-1 pr-2 active:scale-95"
            aria-label="返回建议填写"
          >
            <ChevronLeft className="w-5 h-5 -ml-1" />
            <span>返回</span>
          </button>
        ) : (
          /* Changed from "便民通道" to "管理入口" as requested */
          <button
            id="admin-entry-button"
            type="button"
            onClick={handleAdminEntryClick}
            className="flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer active:scale-95 shadow-sm border border-white/20"
            title={adminUser ? '点击进入意见建议管理后台' : '管理员点击登录后台'}
          >
            {adminUser ? (
              <>
                <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-300" />
                <span>管理后台</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-300" />
                <span>管理入口</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Center Title */}
      <h1 className="text-base sm:text-lg font-bold tracking-wide text-center truncate">
        {activeTab === 'form'
          ? '意见建议'
          : activeTab === 'history'
          ? '意见列表'
          : '意见建议管理后台'}
      </h1>

      {/* Right section */}
      <div className="flex justify-end min-w-[92px]">
        {activeTab === 'form' ? (
          <button
            id="topbar-history-button"
            type="button"
            onClick={() => onTabChange('history')}
            className="relative flex items-center gap-1 text-xs font-semibold py-1.5 px-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all active:scale-95 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>意见列表</span>
            {submissionCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-bold bg-amber-400 text-slate-900 rounded-full">
                {submissionCount}
              </span>
            )}
          </button>
        ) : activeTab === 'history' ? (
          <button
            id="topbar-new-feedback-button"
            type="button"
            onClick={() => onTabChange('form')}
            className="flex items-center gap-1 text-xs font-semibold py-1.5 px-2.5 rounded-full bg-white text-blue-600 hover:bg-blue-50 transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>提建议</span>
          </button>
        ) : (
          <button
            id="topbar-admin-exit-btn"
            type="button"
            onClick={() => onTabChange('form')}
            className="flex items-center gap-1 text-xs font-semibold py-1.5 px-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all active:scale-95 cursor-pointer"
          >
            <span>返回主页</span>
          </button>
        )}
      </div>
    </header>
  );
};
