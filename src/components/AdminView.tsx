import React, { useState } from 'react';
import {
  Shield,
  User,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MessageSquare,
  Trash2,
  LogOut,
  ArrowLeft,
  Download,
  RefreshCw,
  Sparkles,
  Phone,
  Layers,
  ChevronDown,
  ChevronUp,
  Send,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { FeedbackItem, FeedbackStatus, AdminUser } from '../types';
import { FEEDBACK_TYPES } from '../data/mockData';

interface AdminViewProps {
  admin: AdminUser;
  items: FeedbackItem[];
  onLogout: () => void;
  onBackToUser: () => void;
  onRefresh: () => void;
  onUpdateStatus: (id: string, status: FeedbackStatus, remark?: string) => Promise<void>;
  onReply: (
    id: string,
    reply: { responderName: string; responderRole: string; content: string },
    newStatus: FeedbackStatus
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onPreviewImage: (url: string) => void;
  onShowToast: (msg: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  admin,
  items,
  onLogout,
  onBackToUser,
  onRefresh,
  onUpdateStatus,
  onReply,
  onDelete,
  onPreviewImage,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('全部');
  const [anonymityFilter, setAnonymityFilter] = useState<'全部' | '匿名' | '实名'>('全部');
  const [typeFilter, setTypeFilter] = useState<string>('全部');
  const [replyingId, setReplyingId] = useState<string | null>(null);

  // Reply form state
  const [responderName, setResponderName] = useState('服务治理与体验组');
  const [responderRole, setResponderRole] = useState('产品体验主管');
  const [replyContent, setReplyContent] = useState('');
  const [replyStatus, setReplyStatus] = useState<FeedbackStatus>('已采纳');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Expanded timelines
  const [expandedTimelines, setExpandedTimelines] = useState<Record<string, boolean>>({});

  const toggleTimeline = (id: string) => {
    setExpandedTimelines((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Stats calculation
  const total = items.length;
  const pendingCount = items.filter((i) => i.status === '待处理').length;
  const processingCount = items.filter((i) => i.status === '处理中').length;
  const adoptedCount = items.filter((i) => i.status === '已采纳').length;
  const repliedCount = items.filter((i) => i.status === '已答复').length;
  const anonymousCount = items.filter((i) => i.isAnonymous).length;

  const filteredItems = items.filter((item) => {
    if (statusFilter !== '全部' && item.status !== statusFilter) return false;
    if (anonymityFilter === '匿名' && !item.isAnonymous) return false;
    if (anonymityFilter === '实名' && item.isAnonymous) return false;
    if (typeFilter !== '全部' && item.type !== typeFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchText =
        item.description.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.feature.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        (item.contactName && item.contactName.toLowerCase().includes(q)) ||
        (item.contactInfo && item.contactInfo.toLowerCase().includes(q));
      if (!matchText) return false;
    }
    return true;
  });

  const handleStartReply = (item: FeedbackItem) => {
    setReplyingId(item.id);
    setReplyContent(item.officialReply ? item.officialReply.content : '');
    setReplyStatus(item.status === '已采纳' ? '已采纳' : '已采纳');
  };

  const handleSendReply = async (id: string) => {
    if (!replyContent.trim()) {
      onShowToast('请输入答复内容');
      return;
    }

    setIsSubmittingReply(true);
    await onReply(
      id,
      {
        responderName: responderName.trim() || '管理员',
        responderRole: responderRole.trim() || '服务体验组',
        content: replyContent.trim(),
      },
      replyStatus
    );
    setIsSubmittingReply(false);
    setReplyingId(null);
    setReplyContent('');
    onShowToast('官方答复与处理进度已成功同步！');
  };

  const handleExportCSV = () => {
    if (items.length === 0) {
      onShowToast('暂无可导出的数据');
      return;
    }

    const headers = ['建议编号', '类型', '关联功能', '匿名状态', '联系人', '联系方式', '建议内容', '当前状态', '提交时间', '官方答复'];
    const rows = items.map((i) => [
      i.id,
      i.type,
      i.feature,
      i.isAnonymous ? '匿名' : '实名',
      i.contactName || '--',
      i.contactInfo || '--',
      `"${i.description.replace(/"/g, '""')}"`,
      i.status,
      i.createdAt,
      i.officialReply ? `"${i.officialReply.content.replace(/"/g, '""')}"` : '--',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `意见建议汇总_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('已导出所有意见建议 CSV 表格');
  };

  const quickReplySnippets = [
    '感谢您的宝贵建议！我们已采纳并纳入下个版本排期中。',
    '已安排专人实地核验与工程排查，感谢您的热心监督！',
    '此功能目前已在灰度测试阶段，预计近期向全体用户开放。',
    '建议已收悉，因涉及底层门禁协议升级，我们正在加紧评估方案。',
  ];

  return (
    <div className="px-3.5 sm:px-4 py-4 pb-24 space-y-4">
      {/* Admin Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onBackToUser}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="返回用户提交界面"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">意见建议治理后台</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                  {admin.role}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                已登录账号：<span className="font-mono text-blue-300 font-semibold">{admin.username}</span> · 数据库实时同步
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="从数据库拉取最新建议"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">刷新</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white transition-colors cursor-pointer"
              title="导出当前全部数据为CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">导出</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-colors cursor-pointer"
              title="退出管理员身份"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>退出</span>
            </button>
          </div>
        </div>

        {/* Metric Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-white/10">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[11px] text-slate-300">总建议条数</div>
            <div className="text-xl font-bold font-mono text-white mt-0.5">{total}</div>
            <div className="text-[10px] text-emerald-300 mt-0.5 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>匿名 {anonymousCount} 条 ({total > 0 ? Math.round((anonymousCount / total) * 100) : 0}%)</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="text-[11px] text-amber-200">待处理</div>
            <div className="text-xl font-bold font-mono text-amber-300 mt-0.5">{pendingCount}</div>
            <div className="text-[10px] text-amber-200/80 mt-0.5">需审核评估</div>
          </div>

          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div className="text-[11px] text-blue-200">处理中</div>
            <div className="text-xl font-bold font-mono text-blue-300 mt-0.5">{processingCount}</div>
            <div className="text-[10px] text-blue-200/80 mt-0.5">研发/物业跟进中</div>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="text-[11px] text-emerald-200">已采纳/已答复</div>
            <div className="text-xl font-bold font-mono text-emerald-300 mt-0.5">
              {adoptedCount + repliedCount}
            </div>
            <div className="text-[10px] text-emerald-200/80 mt-0.5">已形成业务闭环</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="admin-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索编号、建议内容、功能模块、联系人称呼..."
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

        {/* Filter Rows */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-semibold text-[11px] flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>状态:</span>
          </span>
          {['全部', '待处理', '处理中', '已采纳', '已答复', '已归档'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold text-[11px] flex items-center gap-1">
            <Shield className="w-3 h-3" />
            <span>属性:</span>
          </span>
          {(['全部', '匿名', '实名'] as const).map((an) => (
            <button
              key={an}
              type="button"
              onClick={() => setAnonymityFilter(an)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                anonymityFilter === an
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {an === '全部' ? '全部形式' : an === '匿名' ? '纯匿名反馈' : '实名反馈'}
            </button>
          ))}
        </div>
      </div>

      {/* Suggestion list */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">没有找到匹配的意见建议</p>
          <p className="text-xs text-slate-400 mt-1">请调整搜索关键词或重置筛选选项</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredItems.map((item) => {
            const isReplying = replyingId === item.id;
            const isTimelineOpen = !!expandedTimelines[item.id];

            return (
              <article
                key={item.id}
                id={`admin-item-${item.id}`}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3 transition-shadow hover:shadow-md"
              >
                {/* Header: ID, Time, Type, Anonymity, Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                      {item.id}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700">
                      {item.type}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {item.feature}
                    </span>

                    {/* Anonymous or Real Name details */}
                    {item.isAnonymous ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Shield className="w-3 h-3 text-emerald-600" />
                        <span>匿名反馈 (身份信息已脱敏)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <User className="w-3 h-3 text-blue-600" />
                        <span>
                          实名: {item.contactName || '业主'} {item.contactInfo ? `(${item.contactInfo})` : ''}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Status badge */}
                  <div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        item.status === '待处理'
                          ? 'bg-amber-100 text-amber-800'
                          : item.status === '处理中'
                          ? 'bg-blue-100 text-blue-800'
                          : item.status === '已采纳'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === '已答复'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* Suggestion content */}
                <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  {item.description}
                </div>

                {/* Screenshots */}
                {item.images && item.images.length > 0 && (
                  <div>
                    <div className="text-[11px] text-slate-400 mb-1">
                      业主上传截图（{item.images.length}张，点击查看大图）：
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.images.map((imgUrl, imgIdx) => (
                        <button
                          key={imgIdx}
                          type="button"
                          onClick={() => onPreviewImage(imgUrl)}
                          className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 hover:opacity-85 transition-opacity cursor-pointer"
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

                {/* Current Official Reply */}
                {item.officialReply && !isReplying && (
                  <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200/70 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-blue-900 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                        <span>已发送的官方答复：</span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.officialReply.repliedAt}
                      </span>
                    </div>
                    <p className="text-slate-700 mt-1 leading-relaxed pl-5">
                      {item.officialReply.content}
                    </p>
                    <div className="mt-1.5 text-[10px] text-slate-500 pl-5">
                      答复责任人：{item.officialReply.responderName} ({item.officialReply.responderRole})
                    </div>
                  </div>
                )}

                {/* Reply Form if opened */}
                {isReplying && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border-2 border-blue-500/40 space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>填写官方评估与答复</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setReplyingId(null)}
                        className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        取消
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={responderName}
                        onChange={(e) => setResponderName(e.target.value)}
                        placeholder="答复人/部门名称"
                        className="h-8 px-2.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="text"
                        value={responderRole}
                        onChange={(e) => setResponderRole(e.target.value)}
                        placeholder="答复人职务/角色"
                        className="h-8 px-2.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <textarea
                      rows={3}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="请输入给业主的详细处理进展、技术解决方案或采纳排期..."
                      className="w-full p-2.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800"
                    />

                    {/* Quick reply templates */}
                    <div>
                      <div className="text-[11px] text-slate-400 mb-1">快捷模板填入：</div>
                      <div className="flex flex-wrap gap-1">
                        {quickReplySnippets.map((snip, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => setReplyContent(snip)}
                            className="text-[10px] px-2 py-0.5 rounded bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                          >
                            {snip.slice(0, 16)}...
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-500 text-[11px]">更新状态为:</span>
                        {(['处理中', '已采纳', '已答复'] as FeedbackStatus[]).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setReplyStatus(st)}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                              replyStatus === st
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-slate-600 border border-slate-200'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={isSubmittingReply}
                        onClick={() => handleSendReply(item.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>{isSubmittingReply ? '正在答复...' : '发布官方答复'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Timeline toggle */}
                {item.timeline && item.timeline.length > 0 && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => toggleTimeline(item.id)}
                      className="flex items-center justify-between w-full text-[11px] text-slate-400 hover:text-slate-600 py-1 cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>流转日志 ({item.timeline.length}条)</span>
                      </span>
                      {isTimelineOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isTimelineOpen && (
                      <div className="mt-1 pl-2 space-y-1.5 border-l-2 border-blue-200 ml-1.5 text-[11px]">
                        {item.timeline.map((evt, eIdx) => (
                          <div key={eIdx} className="relative pl-3">
                            <div className="absolute -left-[11px] top-1 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white" />
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <span className="font-semibold">{evt.title}</span>
                              <span className="text-[10px] text-slate-400">{evt.time}</span>
                              {evt.operator && (
                                <span className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
                                  {evt.operator}
                                </span>
                              )}
                            </div>
                            {evt.description && (
                              <p className="text-[10px] text-slate-500 mt-0.5">{evt.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Action Controls for Admin */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  {/* Status change actions */}
                  <div className="flex flex-wrap items-center gap-1 text-xs">
                    <span className="text-[11px] text-slate-400 mr-1">快捷流转:</span>
                    {(['待处理', '处理中', '已采纳', '已答复', '已归档'] as FeedbackStatus[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => onUpdateStatus(item.id, st)}
                        className={`text-[10px] px-2 py-0.5 rounded transition-colors cursor-pointer ${
                          item.status === st
                            ? 'bg-slate-800 text-white font-bold'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  {/* Reply button & Delete button */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleStartReply(item)}
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer shadow-sm"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>{item.officialReply ? '修改答复' : '官方答复'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="删除此建议"
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
