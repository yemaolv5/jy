import React, { useState } from 'react';
import {
  Inbox,
  Shield,
  User,
  Clock,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Trash2,
  Sparkles,
  Search,
  CheckCircle2,
  PlusCircle,
  CornerDownRight,
  RefreshCw,
} from 'lucide-react';
import { FeedbackItem, FeedbackStatus } from '../types';

interface HistoryViewProps {
  items: FeedbackItem[];
  onDeleteItem: (id: string) => void;
  onSimulateReply: (id: string) => void;
  onPreviewImage: (url: string) => void;
  onGoToForm: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  items,
  onDeleteItem,
  onSimulateReply,
  onPreviewImage,
  onGoToForm,
}) => {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedTimelines, setExpandedTimelines] = useState<Record<string, boolean>>({});

  const toggleTimeline = (id: string) => {
    setExpandedTimelines((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredItems = items.filter((item) => {
    const matchesStatus =
      selectedStatusFilter === '全部' ? true : item.status === selectedStatusFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      item.description.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q) ||
      item.feature.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q);

    return matchesStatus && matchesQuery;
  });

  const getStatusBadge = (status: FeedbackStatus) => {
    switch (status) {
      case '待处理':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
            待处理
          </span>
        );
      case '处理中':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
            处理中
          </span>
        );
      case '已采纳':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            已采纳
          </span>
        );
      case '已答复':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/80">
            已答复
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="px-3.5 sm:px-4 py-3.5 pb-24 space-y-3.5">
      {/* Search & Filter Bar */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="history-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索建议内容、类型、关联功能或编号..."
            className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              清空
            </button>
          )}
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
          {['全部', '待处理', '处理中', '已采纳', '已答复'].map((status) => {
            const count =
              status === '全部'
                ? items.length
                : items.filter((i) => i.status === status).length;
            const isActive = selectedStatusFilter === status;
            return (
              <button
                key={status}
                id={`status-filter-${status}`}
                type="button"
                onClick={() => setSelectedStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                <span>{status}</span>
                <span className={`ml-1 text-[11px] ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List items */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
            <Inbox className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h3 className="text-sm font-bold text-slate-700 mb-1">
            {searchQuery || selectedStatusFilter !== '全部'
              ? '没有找到符合筛选条件的记录'
              : '暂时没有提交任何意见建议'}
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            无论您是在日常使用中遇到卡顿，还是有好点子，都可以随时告诉我们。
          </p>
          <button
            id="empty-go-to-form-btn"
            type="button"
            onClick={onGoToForm}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>提交第一条建议</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isTimelineOpen = !!expandedTimelines[item.id];

            return (
              <article
                key={item.id}
                id={`history-card-${item.id}`}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 transition-shadow hover:shadow-md"
              >
                {/* Card Top: Type, Feature, Anonymity, Status */}
                <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100/70 text-blue-700">
                      {item.type}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {item.feature}
                    </span>

                    {/* Anonymous tag */}
                    {item.isAnonymous ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        <Shield className="w-3 h-3 text-emerald-600" />
                        <span>匿名反馈</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        <User className="w-3 h-3 text-slate-500" />
                        <span>{item.contactName ? `${item.contactName}` : '实名'}</span>
                      </span>
                    )}
                  </div>

                  <div>{getStatusBadge(item.status)}</div>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-800 my-3 leading-relaxed whitespace-pre-line break-words">
                  {item.description}
                </p>

                {/* Screenshots */}
                {item.images && item.images.length > 0 && (
                  <div className="mb-3">
                    <div className="text-[11px] text-slate-400 mb-1.5">
                      附件截图（{item.images.length}张，点击可放大）：
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.images.map((imgUrl, imgIdx) => (
                        <button
                          key={imgIdx}
                          type="button"
                          onClick={() => onPreviewImage(imgUrl)}
                          className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 hover:opacity-90 transition-opacity cursor-pointer"
                        >
                          <img
                            src={imgUrl}
                            alt={`截图附件 ${imgIdx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Official Reply Box if available */}
                {item.officialReply && (
                  <div className="mb-3 p-3 rounded-xl bg-blue-50/70 border border-blue-100/80">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                          答
                        </div>
                        <span className="text-xs font-bold text-slate-800">
                          {item.officialReply.responderName}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-blue-200/60 text-blue-800 rounded font-medium">
                          {item.officialReply.responderRole}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {item.officialReply.repliedAt}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed pl-6">
                      {item.officialReply.content}
                    </p>
                  </div>
                )}

                {/* Timeline toggle */}
                {item.timeline && item.timeline.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100/70">
                    <button
                      type="button"
                      onClick={() => toggleTimeline(item.id)}
                      className="flex items-center justify-between w-full text-[11px] text-slate-500 hover:text-blue-600 py-1 cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>处理流转日志 ({item.timeline.length}条动态)</span>
                      </span>
                      {isTimelineOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {isTimelineOpen && (
                      <div className="mt-2 pl-2 space-y-2 border-l-2 border-blue-200 ml-1.5 text-xs animate-in fade-in duration-150">
                        {item.timeline.map((evt, evtIdx) => (
                          <div key={evtIdx} className="relative pl-3">
                            <div className="absolute -left-[11px] top-1 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white" />
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800">
                                {evt.title}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {evt.time}
                              </span>
                              {evt.operator && (
                                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                  {evt.operator}
                                </span>
                              )}
                            </div>
                            {evt.description && (
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {evt.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Card Footer Meta & Interactive Controls */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-mono">编号: {item.id}</span>
                    <span>·</span>
                    <span>{item.createdAt}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Interactive button to simulate workflow / staff reply */}
                    {item.status !== '已采纳' && item.status !== '已答复' && (
                      <button
                        type="button"
                        onClick={() => onSimulateReply(item.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-medium transition-colors cursor-pointer"
                        title="测试：模拟服务团队审核并进行采纳答复"
                      >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>模拟官方答复</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="撤回/删除此条建议"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
