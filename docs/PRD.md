# 问问Jev (Ask Jev) 产品原型与全栈架构方案

## 一、一页纸概览 (Executive View)

| 维度 | 内容说明 |
| :--- | :--- |
| **产品定位** | 面向中国大陆年轻人的复古新野蛮主义 (Neo-Brutalism) 生活微决策决断机，专治买不买、吃什么、去不去。 |
| **参考原型** | 经典 Ask Jeeves (Ask Jev) 拟人管家搜索界面，结合当下前沿现代前沿组件（Next.js 15 + Tailwind CSS）。 |
| **移动端首选** | 针对手机触控、微信内打开、移动端软键盘输入与小屏浏览做 100% 深度响应式适配。 |
| **部署方式** | **Vercel 一键零配置全栈部署**，前端 SSR/SSG + 后端 Serverless API 路由统一交付。 |
| **底层模型** | 后端对接 TypeSafe 推出的 **Jev 模型**（通过 AI Gateway 或服务端密钥转发，前端零秘钥暴露）。 |
| **交互形式** | 是/否裁决 (Yes/No)、多项择一 (Choice)、冲动指数打分 (Score)。 |

---

## 二、移动端深度适配规范 (Mobile-First Experience)

由于中国大陆用户主要通过微信、小红书、手机浏览器访问，移动端体验按 P0 级打磨：

### 1. 视口与尺寸防护
- **防缩放与字体基准**：输入框字号锁定在 16px 以上，避免 iOS Safari 聚焦输入框时触发破坏性页面自动放大。
- **安全区留白**：使用 `env(safe-area-inset-bottom)` 与 `100dvh`，确保在 iPhone 灵动岛、刘海屏及手势导航条下不被遮挡。

### 2. 触控与拇指操作流 (Thumb Zone)
- **大号触控靶心**：所有可点按区域高度不低于 44px，提供明确的 `:active` 触控按下反馈。
- **分段控制器 (Segmented Controls)**：在手机小屏下，将原桌面端收音机单选框自适应转为手指滑动触达的大号卡片胶囊，方便单手大拇指快速切换【是/否】、【选一个】、【评个分】。
- **快速纠结胶囊**：精选热门纠结词条在手机端以左右滑动或大颗粒药丸形式展现，一触即填。

### 3. 软键盘弹出与视口重排
- 严格侦听中文拼音输入法合成事件（`compositionstart` / `compositionend`），解决选词回车直接触发提交的痛点。
- 提交后自动收起虚拟键盘，视口平滑聚焦至管家裁决卡片，无须用户手动上下翻找。

---

## 三、Next.js + Vercel 全栈工程架构

工程采用全栈一体化目录结构：

```text
ask-jev/
├── app/
│   ├── api/
│   │   └── jev/
│   │       └── route.ts          # TypeSafe Jev 模型 Serverless 代理路由 (隐藏秘钥)
│   ├── layout.tsx                # 全局根布局、移动端 Viewport 与 SEO 元数据
│   ├── page.tsx                  # 现代 Neo-Brutalism 主页面组件
│   └── globals.css               # Tailwind CSS 指令与复古现代融合样式
├── components/
│   ├── JevAvatar.tsx             # 纯矢量 SVG 响应式老管家肖像
│   ├── AskBadge.tsx              # 复古立体倾斜 Ask Jev 徽标
│   ├── DecisionBox.tsx           # 移动端适配核心输入与模式选择器
│   ├── VerdictCard.tsx           # 裁决结果信封卡片与撒花动效
│   ├── TopicMatrix.tsx           # 移动端自适应热门纠结胶囊库
│   └── ApiSettingsModal.tsx      # 接口配置与测试弹窗
├── lib/
│   ├── mockJev.ts                # 本地高拟真推理引擎 (离线兜底)
│   └── types.ts                  # 全链路 TypeScript 类型契约
├── docs/
│   └── PRD.md                    # 本方案文档
├── index.html                    # 零依赖极速预览版 (已同步完成移动端强化)
├── package.json                  # Next.js 15 生产级工程配置
├── tailwind.config.ts            # 前沿 Neo-Brutalism 主题与色彩配置
├── tsconfig.json                 # TypeScript 严格配置
└── README.md                     # Vercel 一键部署与操作指南
```

---

## 四、TypeSafe Jev 后端接口定义

### Serverless 代理路由：`app/api/jev/route.ts`
- **前端请求路径**：`POST /api/jev`
- **环境变量**：
  - `TYPESAFE_JEV_ENDPOINT`: TypeSafe Jev 模型服务真实地址
  - `TYPESAFE_JEV_API_KEY`: TypeSafe 访问密钥（保存在 Vercel 环境变量中）

#### 请求入参 (TypeScript 定义)
```typescript
export interface JevDecisionRequest {
  question: string;
  mode: 'yes_no' | 'choice' | 'score';
  context?: string;
  options?: string[];
}
```

#### 响应出参 (TypeScript 定义)
```typescript
export interface JevDecisionResponse {
  code: number;
  data: {
    mode: 'yes_no' | 'choice' | 'score';
    verdict: string;
    verdictTag: string;
    badgeClass: 'red' | 'green' | 'gold';
    score?: number | null;
    reasoning: string;
    signId: string;
  };
}
```
