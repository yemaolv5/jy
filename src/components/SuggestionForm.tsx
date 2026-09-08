import React, { useState, useRef } from 'react';
import {
  Lightbulb,
  Upload,
  X,
  Eye,
  Shield,
  ShieldOff,
  User,
  Phone,
  Info,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { FeedbackItem, FeedbackType } from '../types';
import { FEEDBACK_TYPES, RELATED_FEATURES, QUICK_TAGS } from '../data/mockData';
import { formatCSTDateTime } from '../utils/date';

interface SuggestionFormProps {
  onSubmit: (item: FeedbackItem) => void;
  onPreviewImage: (url: string) => void;
  onShowToast: (msg: string) => void;
}

export const SuggestionForm: React.FC<SuggestionFormProps> = ({
  onSubmit,
  onPreviewImage,
  onShowToast,
}) => {
  const [selectedType, setSelectedType] = useState<FeedbackType>('操作优化');
  const [selectedFeature, setSelectedFeature] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);
  const [contactName, setContactName] = useState<string>('');
  const [contactInfo, setContactInfo] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_IMAGES = 5;
  const MAX_CHARS = 500;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      onShowToast(`最多只能上传 ${MAX_IMAGES} 张图片`);
      return;
    }

    const validFiles = (Array.from(files) as File[]).filter(f => f.type.startsWith('image/'));
    const filesToRead = validFiles.slice(0, remaining);

    if (files.length > remaining) {
      onShowToast(`本次仅可添加 ${remaining} 张，最多保留 ${MAX_IMAGES} 张`);
    }

    filesToRead.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages(prev => {
            if (prev.length >= MAX_IMAGES) return prev;
            return [...prev, event.target!.result as string];
          });
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleApplyQuickTag = (tag: string) => {
    if (description.includes(tag)) {
      onShowToast('该建议已在内容中');
      return;
    }
    const separator = description.trim() ? '\n' : '';
    const newText = (description + separator + tag).slice(0, MAX_CHARS);
    setDescription(newText);
    onShowToast('已填入常用建议内容');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedDesc = description.trim();

    if (!trimmedDesc) {
      onShowToast('请填写具体的建议描述');
      const descElement = document.getElementById('feedback-description');
      descElement?.focus();
      return;
    }

    if (trimmedDesc.length < 5) {
      onShowToast('建议内容请至少输入5个字');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const now = new Date();
      const timeStr = formatCSTDateTime(now, true);
      const logTimeStr = formatCSTDateTime(now, false);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const newId = `YJ${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${randomCode}`;

      const newItem: FeedbackItem = {
        id: newId,
        type: selectedType,
        feature: selectedFeature || '未指定功能模块',
        description: trimmedDesc,
        images: [...images],
        isAnonymous,
        contactName: isAnonymous ? undefined : (contactName.trim() || undefined),
        contactInfo: isAnonymous ? undefined : (contactInfo.trim() || undefined),
        status: '待处理',
        createdAt: timeStr,
        community: isAnonymous ? '阳光香榭小区 (已匿名脱敏)' : '阳光香榭小区',
        deviceInfo: isAnonymous
          ? '通用客户端 (账号信息已脱敏屏蔽)'
          : `移动终端设备 / 客户端 v2.4.2`,
        timeline: [
          {
            time: logTimeStr,
            title: isAnonymous ? '建议已匿名提交' : '建议已提交',
            description: isAnonymous
              ? '系统已剔除个人姓名、手机号及房号信息'
              : `已登记联系方式 (${contactName.trim() || '业主本人'})`,
            operator: '系统'
          }
        ]
      };

      onSubmit(newItem);
      setIsSubmitting(false);

      // Reset form
      setDescription('');
      setSelectedFeature('');
      setImages([]);
      setContactName('');
      setContactInfo('');
    }, 450);
  };

  return (
    <div className="px-3.5 sm:px-4 py-4 pb-28">
      {/* Intro card */}
      <div className="relative flex items-center gap-3.5 p-4 rounded-2xl bg-gradient-to-br from-white to-blue-50/70 border border-white shadow-sm overflow-hidden mb-3.5">
        <div className="absolute -right-6 -bottom-8 w-28 h-28 rounded-full bg-blue-500/5 pointer-events-none" />
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/20 shrink-0">
          <Lightbulb className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm sm:text-base font-bold text-slate-800 leading-snug">
            您的建议会帮助我们做得更好
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            欢迎反馈为您服务物业版小程序的操作优化、界面设计与新增功能需求。
          </p>
        </div>
      </div>

      <form id="suggestion-form" onSubmit={handleSubmit} noValidate>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 divide-y divide-slate-100 space-y-4">
          
          {/* ANONYMOUS TOGGLE CARD - Core feature requested */}
          <div className="pb-1 pt-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${isAnonymous ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {isAnonymous ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-800">匿名反馈</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                      isAnonymous
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {isAnonymous ? '已开启匿名' : '实名/留联络'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isAnonymous
                      ? '隐去姓名、手机号及房号，安心建言'
                      : '如希望物业或研发专人向您答复，可填写联系方式'}
                  </p>
                </div>
              </div>

              {/* iOS style toggle button */}
              <button
                id="anonymous-toggle-button"
                type="button"
                role="switch"
                aria-checked={isAnonymous}
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  isAnonymous ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isAnonymous ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Optional contact inputs if not anonymous */}
            {!isAnonymous && (
              <div className="mt-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>联络信息（选填，用于跟进反馈进展）</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      id="contact-name-input"
                      type="text"
                      maxLength={15}
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="您的称呼（如：王女士）"
                      className="w-full text-xs h-9 px-3 rounded-lg bg-white border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      id="contact-info-input"
                      type="text"
                      maxLength={30}
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                      placeholder="手机号 / 微信号"
                      className="w-full text-xs h-9 pl-8 pr-3 rounded-lg bg-white border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 建议类型 */}
          <div className="pt-4">
            <label className="flex items-center gap-1 text-sm font-bold text-slate-800 mb-2.5">
              <span>建议类型</span>
              <span className="text-red-500 text-xs">*</span>
            </label>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="建议类型">
              {FEEDBACK_TYPES.map((type) => {
                const isActive = selectedType === type;
                return (
                  <button
                    key={type}
                    id={`type-chip-${type}`}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    onClick={() => setSelectedType(type)}
                    className={`h-9 px-3.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 ring-2 ring-blue-600/20'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/70'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 关联功能 */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="feature-select" className="text-sm font-bold text-slate-800 flex items-center gap-1">
                <span>关联功能</span>
                <span className="text-xs text-slate-400 font-normal">（选填）</span>
              </label>
              {selectedFeature && (
                <button
                  type="button"
                  onClick={() => setSelectedFeature('')}
                  className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  清除选择
                </button>
              )}
            </div>
            <div className="relative">
              <select
                id="feature-select"
                value={selectedFeature}
                onChange={(e) => setSelectedFeature(e.target.value)}
                className="w-full h-11 px-3.5 pr-9 text-xs sm:text-sm rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
              >
                <option value="">请选择相关页面或功能模块</option>
                {RELATED_FEATURES.map((feat) => (
                  <option key={feat} value={feat}>
                    {feat}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* 建议描述 */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="feedback-description" className="flex items-center gap-1 text-sm font-bold text-slate-800">
                <span>建议描述</span>
                <span className="text-red-500 text-xs">*</span>
              </label>
              <span className="text-xs text-slate-400 font-mono">
                <b className={description.length >= MAX_CHARS ? 'text-red-500' : 'text-slate-600'}>
                  {description.length}
                </b>
                /{MAX_CHARS}
              </span>
            </div>

            <div className="relative rounded-xl border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 transition-all">
              <textarea
                id="feedback-description"
                rows={5}
                maxLength={MAX_CHARS}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="请详细描述您遇到的问题、期望的操作体验、流程优化或功能需求..."
                className="w-full p-3 text-xs sm:text-sm text-slate-800 bg-transparent resize-y outline-none placeholder:text-slate-400 leading-relaxed min-h-[120px]"
              />
            </div>

            {/* Quick Suggestions Helper */}
            <div className="mt-2.5">
              <div className="flex items-center gap-1 text-xs text-slate-500 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>常见建议快捷填入：</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TAGS.map((tag, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyQuickTag(tag)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border border-slate-200/60 transition-colors cursor-pointer text-left"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 上传截图 */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-2.5">
              <div className="text-sm font-bold text-slate-800">
                <span>上传截图</span>
                <span className="text-xs font-normal text-slate-400 ml-1.5">（选填）</span>
              </div>
              <span className="text-xs text-slate-400">
                最多{MAX_IMAGES}张，已上传 {images.length}/{MAX_IMAGES}
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
              {images.map((imgUrl, index) => (
                <div
                  key={index}
                  className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm"
                >
                  <img
                    src={imgUrl}
                    alt={`已上传截图 ${index + 1}`}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => onPreviewImage(imgUrl)}
                  />
                  {/* Overlay buttons */}
                  <button
                    type="button"
                    aria-label={`预览截图 ${index + 1}`}
                    onClick={() => onPreviewImage(imgUrl)}
                    className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`删除截图 ${index + 1}`}
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-900/70 text-white flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {images.length < MAX_IMAGES && (
                <button
                  id="upload-screenshot-btn"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 text-slate-400 hover:text-blue-600 transition-all cursor-pointer p-1"
                >
                  <Upload className="w-5 h-5 stroke-[1.7]" />
                  <span className="text-[11px] font-medium">添加截图</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Dynamic privacy and auto-info notice */}
        <div className={`mt-3 p-3 rounded-xl text-xs leading-relaxed flex items-start gap-2.5 ${
          isAnonymous
            ? 'bg-emerald-50/70 border border-emerald-200/70 text-emerald-800'
            : 'bg-slate-100 border border-slate-200 text-slate-600'
        }`}>
          <Info className={`w-4 h-4 shrink-0 mt-0.5 ${isAnonymous ? 'text-emerald-600' : 'text-slate-500'}`} />
          <div>
            {isAnonymous ? (
              <>
                <span className="font-semibold">匿名安全保障：</span>
                当前已启用纯匿名模式。系统已阻断提取您的账号UID、房号、姓名及手机号，工作人员无法追溯您的个人资料，仅保留必要的客户端版本以帮助定位界面兼容性。
              </>
            ) : (
              <>
                <span className="font-semibold">实名信息采集说明：</span>
                系统将附带提交人称呼与联系方式，用于客服人员回访或告知优化进展，同时记录提交时间与当前系统版本。
              </>
            )}
          </div>
        </div>

        {/* Sticky Submit Dock */}
        <div className="fixed bottom-0 left-0 right-0 z-20 p-3 sm:p-4 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg max-w-md mx-auto">
          <button
            id="submit-feedback-btn"
            type="submit"
            disabled={isSubmitting}
            className={`w-full h-12 rounded-full font-bold text-sm sm:text-base text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
              isSubmitting
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>正在提交...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>{isAnonymous ? '匿名提交建议' : '提交意见建议'}</span>
              </>
            )}
          </button>
          <p className="text-[11px] text-slate-400 text-center mt-1.5">
            提交后将正式进入服务督办流程（不可撤回/删除），可在「查看反馈」随时跟踪处理进度
          </p>
        </div>
      </form>
    </div>
  );
};
