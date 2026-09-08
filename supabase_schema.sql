-- ========================================================
-- 意见建议与反馈系统 - Supabase PostgreSQL 表结构建表脚本
-- 请复制以下所有 SQL 语句，打开 Supabase 项目后台的「SQL Editor」粘贴并运行即可
-- ========================================================

-- 1. 创建意见建议主表
CREATE TABLE IF NOT EXISTS public.feedback (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  feature TEXT NOT NULL,
  description TEXT NOT NULL,
  images JSONB DEFAULT '[]'::jsonb,
  is_anonymous BOOLEAN DEFAULT true,
  contact_name TEXT,
  contact_info TEXT,
  status TEXT DEFAULT '待处理',
  created_at TEXT NOT NULL,
  official_reply JSONB,
  timeline JSONB DEFAULT '[]'::jsonb,
  community TEXT,
  device_info TEXT
);

-- 2. 创建索引以优化列表查询与排序性能
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback (status);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON public.feedback (type);

-- 3. 开启 Row Level Security (RLS)，并添加安全访问策略
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- 允许匿名和所有人读取建议列表
CREATE POLICY "Allow public read access" 
ON public.feedback 
FOR SELECT 
USING (true);

-- 允许匿名用户提交新建议
CREATE POLICY "Allow public insert" 
ON public.feedback 
FOR INSERT 
WITH CHECK (true);

-- 允许通过 service_role 或经过鉴权的后端更新记录（状态流转、官方回复）
CREATE POLICY "Allow update access" 
ON public.feedback 
FOR UPDATE 
USING (true);

-- 允许删除记录
CREATE POLICY "Allow delete access" 
ON public.feedback 
FOR DELETE 
USING (true);

-- 4. 插入一条初始测试示例数据（如果表中无记录）
INSERT INTO public.feedback (
  id, type, feature, description, images, is_anonymous, 
  status, created_at, timeline
) 
SELECT 
  'YJ20250907001', 
  '增加功能建议', 
  '远程开门', 
  '地下车库负一层信号较弱时，蓝牙开门等待时间较长，希望能支持离线蓝牙秘钥或开门小组件，方便回家直接通行。', 
  '[]'::jsonb, 
  true, 
  '处理中', 
  '2025-09-07 14:28:10', 
  '[{"time": "14:28", "title": "业主提交建议", "description": "匿名提交成功，进入待处理队列"}, {"time": "15:00", "title": "技术工程组接单", "description": "已安排门禁系统工程师联合软硬件团队现场实测", "operator": "工程运维中心"}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.feedback LIMIT 1);
