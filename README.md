# 萌宝日记 (MengBao Diary) 🍼

> 0-6岁婴儿育儿助手 · AI驱动的智能育儿记录应用

## 产品功能

- **吃喝拉撒记录** - 喂奶/辅食、睡眠、换尿布、洗澡等日常记录
- **健康档案** - 疫苗计划（国家免疫规划）、生长曲线、体温/黄疸/体重/身高
- **AI育儿助手** - 基于 Claude claude-sonnet-4-6，智能对话+个性化育儿计划
- **成长报告** - AI自动生成周报/月报，数据洞察+改善建议
- **家庭共享** - 多账号协同（爸妈、祖父母）
- **中英双语** - 支持中文/英文界面

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | React Native (Expo ~55) |
| 路由 | Expo Router v4 |
| 数据库 | Supabase (PostgreSQL + Auth + RLS) |
| AI | Claude API (claude-sonnet-4-6) |
| UI动画 | React Native Reanimated 3 |
| 状态管理 | Zustand |
| 国际化 | i18next + react-i18next |

## 快速开始

### 1. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件：
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_ANTHROPIC_API_KEY=your-anthropic-api-key
```

### 2. 初始化 Supabase 数据库

在 Supabase Dashboard > SQL Editor 中运行 `supabase/schema.sql`

### 3. 安装依赖并运行

```bash
npm install
npm start          # 启动开发服务器
npm run android    # Android
npm run ios        # iOS (需要 macOS)
npm run web        # Web 浏览器
```

## 项目结构

```
├── app/
│   ├── _layout.tsx          # 根布局 + Auth监听
│   ├── index.tsx            # 启动路由守卫
│   ├── (auth)/
│   │   └── login.tsx        # 登录/注册
│   ├── (tabs)/
│   │   ├── index.tsx        # 首页仪表盘
│   │   ├── records.tsx      # 记录列表
│   │   ├── health.tsx       # 健康档案
│   │   ├── ai.tsx           # AI助手
│   │   └── reports.tsx      # 成长报告
│   └── modals/
│       ├── add-record.tsx   # 添加记录弹窗
│       └── baby-setup.tsx   # 宝宝信息设置
├── components/ui/           # 通用UI组件
├── constants/
│   ├── theme.ts             # 主题颜色/字体/间距
│   └── types.ts             # TypeScript类型定义
├── lib/
│   ├── supabase.ts          # Supabase客户端
│   ├── ai.ts                # Claude AI集成
│   └── i18n.ts              # 国际化配置
├── locales/
│   ├── zh.ts                # 中文翻译
│   └── en.ts                # 英文翻译
├── stores/
│   ├── auth.store.ts        # 认证状态
│   ├── baby.store.ts        # 宝宝数据
│   └── records.store.ts     # 记录数据
└── supabase/
    └── schema.sql           # 数据库建表SQL
```

## 数据库设计

- `babies` - 宝宝基本信息 (RLS: 仅本人可访问)
- `records` - 所有日常记录 (RLS: 通过baby所有权验证)
- `vaccines` - 疫苗接种记录
- `reports` - AI生成的复盘报告
- `family_members` - 家庭成员共享访问

## 部署

### Web (Vercel/Netlify)
```bash
npx expo export --platform web
```

### iOS/Android (EAS Build)
```bash
npx eas build --platform all
```
