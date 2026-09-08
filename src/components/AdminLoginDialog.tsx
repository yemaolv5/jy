import React, { useState } from 'react';
import { ShieldCheck, Lock, User, X, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { AdminUser } from '../types';

interface AdminLoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (admin: AdminUser) => void;
}

export const AdminLoginDialog: React.FC<AdminLoginDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('请输入用户名和密码');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const res = await api.loginAdmin(username.trim(), password.trim());
    setLoading(false);

    if (res.success && res.adminUser) {
      onSuccess(res.adminUser);
      onClose();
    } else {
      setErrorMsg(res.error || '账号密码不对');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-sm p-6 bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="w-13 h-13 mx-auto mb-3.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
          <ShieldCheck className="w-7 h-7" />
        </div>

        <h3 id="admin-dialog-title" className="text-lg font-bold text-slate-800 text-center">
          管理入口登录
        </h3>
        <p className="text-xs text-slate-500 text-center mt-1 mb-5">
          请输入管理员凭证以查看与治理所有提交的意见建议
        </p>

        {errorMsg && (
          <div className="mb-3.5 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              管理员账号
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="admin-username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入管理员账号"
                className="w-full h-10 pl-9 pr-3 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              管理密码
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="admin-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入管理密码"
                className="w-full h-10 pl-9 pr-3 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800"
              />
            </div>
          </div>

          <button
            id="admin-submit-login-btn"
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>登 录 管 理 后 台</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
