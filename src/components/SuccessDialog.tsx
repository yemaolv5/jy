import React from 'react';
import { Check, Shield, User, ArrowRight, RotateCcw } from 'lucide-react';
import { FeedbackItem } from '../types';

interface SuccessDialogProps {
  isOpen: boolean;
  item: FeedbackItem | null;
  onContinue: () => void;
  onViewProgress: () => void;
}

export const SuccessDialog: React.FC<SuccessDialogProps> = ({
  isOpen,
  item,
  onContinue,
  onViewProgress,
}) => {
  if (!isOpen || !item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-sm p-6 bg-white rounded-2xl shadow-2xl text-center animate-in zoom-in-95 duration-200 border border-slate-100">
        {/* Success Icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 ring-8 ring-emerald-50">
          <Check className="w-8 h-8 stroke-[3]" />
        </div>

        <h3 id="dialog-title" className="text-xl font-bold text-slate-800 mb-1">
          建议提交成功
        </h3>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 my-2 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
          <span>建议编号:</span>
          <span className="font-mono text-blue-600 font-bold">{item.id}</span>
        </div>

        {/* Anonymous status note */}
        <div className={`mt-2 mb-4 p-3 rounded-xl text-xs text-left flex items-start gap-2.5 ${
          item.isAnonymous
            ? 'bg-emerald-50/80 border border-emerald-100 text-emerald-800'
            : 'bg-blue-50/80 border border-blue-100 text-blue-800'
        }`}>
          {item.isAnonymous ? (
            <>
              <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">已启用全匿名保护</p>
                <p className="text-[11px] text-emerald-700/80 mt-0.5">
                  系统已对您的身份与房号完成脱敏，仅反馈建议内容至服务组。
                </p>
              </div>
            </>
          ) : (
            <>
              <User className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">实名登记反馈</p>
                <p className="text-[11px] text-blue-700/80 mt-0.5">
                  已记录联系方式（{item.contactName || '热心业主'}），工作人员处理后将及时与您沟通。
                </p>
              </div>
            </>
          )}
        </div>

        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          非常感谢您对服务与产品体验的真诚建议，相关部门会尽快评估并在「我的提交」中同步进度。
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            id="dialog-continue-btn"
            type="button"
            onClick={onContinue}
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>继续提交</span>
          </button>
          <button
            id="dialog-view-progress-btn"
            type="button"
            onClick={onViewProgress}
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all shadow-md shadow-blue-500/25 cursor-pointer"
          >
            <span>查看进度</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
