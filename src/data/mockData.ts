import { FeedbackItem, FeedbackType } from '../types';

export const FEEDBACK_TYPES: FeedbackType[] = [
  '操作优化',
  '界面优化',
  '增加功能建议',
  '问题反馈',
  '其他',
];

export const RELATED_FEATURES = [
  '首页/工作台',
  '扫一扫',
  '收费/在线缴费',
  '故障上报',
  '远程开门',
  '业主认证',
  '缴费反馈',
  '开门故障',
  '报事报修',
  '通知公告',
  '我的/设置',
  '其他功能',
];

export const QUICK_TAGS = [
  '长辈模式下字体建议再稍微放大一些',
  '扫码充电偶发对焦慢，希望能优化相机的调起速度',
];

export const DEFAULT_FEEDBACK_LIST: FeedbackItem[] = [
  {
    id: 'YJ20250907001',
    type: '增加功能建议',
    feature: '远程开门',
    description: '地下车库负一层信号较弱时，蓝牙开门等待时间较长，希望能支持离线蓝牙秘钥或开门小组件，方便回家直接通行。',
    images: [],
    isAnonymous: true,
    status: '已采纳',
    createdAt: '2025-09-07 14:28:10',
    community: '阳光香榭小区 (匿名已脱敏)',
    deviceInfo: 'iOS 18.2 / 客户端 v2.4.1 (无账号关联)',
    officialReply: {
      repliedAt: '2025-09-07 17:35:00',
      responderName: '智联硬件研发组 - 张工',
      responderRole: '技术主管',
      content: '感谢您的宝贵建议！我们已完成离线蓝牙离线验签协议方案评估，预计将在下周发布的 v2.5.0 版本上线“锁屏负一屏开门小组件”与离线蓝牙鉴权，敬请期待更新。',
    },
    timeline: [
      {
        time: '2025-09-07 14:28',
        title: '建议已匿名提交',
        description: '系统已剔除个人姓名、手机号及房号信息',
        operator: '系统'
      },
      {
        time: '2025-09-07 15:10',
        title: '产品团队已受理',
        description: '已分派至智能门禁硬件研发组评估',
        operator: '客服中心'
      },
      {
        time: '2025-09-07 17:35',
        title: '建议已被采纳并答复',
        description: '纳入 v2.5.0 功能排期',
        operator: '研发主管'
      }
    ]
  },
  {
    id: 'YJ20250906042',
    type: '操作优化',
    feature: '报事报修',
    description: '报修拍照上传时希望能直接连拍多张，现在每次只能单选图片并等待预览，比较耗时。',
    images: [],
    isAnonymous: false,
    contactName: '陈先生',
    contactInfo: '138****6789',
    status: '处理中',
    createdAt: '2025-09-06 09:15:32',
    community: '阳光香榭小区 3栋2单元',
    deviceInfo: 'Android 15 / 客户端 v2.4.0',
    officialReply: {
      repliedAt: '2025-09-06 11:20:10',
      responderName: '前端体验优化组 - 李经理',
      responderRole: '产品经理',
      content: '陈先生您好，感谢反馈！多图连拍多选组件正在联调阶段，会在近期升级体验，方便大家快速报障。',
    },
    timeline: [
      {
        time: '2025-09-06 09:15',
        title: '建议已实名提交',
        description: '已关联业主联系方式便于跟进',
        operator: '用户'
      },
      {
        time: '2025-09-06 11:20',
        title: '体验团队已答复',
        description: '已安排前端工程师跟进批量相册选择能力',
        operator: '产品经理'
      }
    ]
  }
];
