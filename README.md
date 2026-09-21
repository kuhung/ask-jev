# 问问Jev (Ask Jev)

面向中国大陆年轻人的复古新野蛮主义 (Neo-Brutalism) 生活微决策老管家。专治“买不买”、“花不花”、“用不用”、“中午吃什么”、“去不去”等内耗纠结，直截了当给结论。

---

## 一、线上访问与产品亮点

- **生产环境公开访问地址**：**[https://askjev.kuhung.me](https://askjev.kuhung.me)**
- **开源代码仓库 (GitHub)**：**[https://github.com/kuhung/ask-jev](https://github.com/kuhung/ask-jev)**
- **开发者主页**：**[kuhung.me](https://kuhung.me)**
- **致敬与灵感鸣谢**：**[askjev.net](https://askjev.net)**（致敬 90 年代经典的 Ask Jeeves 拟人决策形态）

### 核心体验设计：
   - 适配手机触控黄金区（Thumb Zone），最小触控面积不低于 44px。
   - 输入框字号锁定在 16px 以上，彻底杜绝 iOS Safari 聚焦时破坏性自动放大页面。
   - 分段控制器（Segmented Controls）：在移动端自适应为平铺大胶囊，大拇指单手即可丝滑切换。
   - 中文拼音输入法防护（`compositionstart` / `compositionend`），解决选词回车误提交问题。
   - 裁决生成后自动收起软键盘并平滑聚焦定位到结论卡片。
2. **美学设计：现代新野蛮复古风 (Neo-Brutalism)**：
   - 传承 90 年代经典 Ask Jeeves 的奶黄底色、鲜红立体椭圆 Ask 按钮与纯矢量 SVG 老管家肖像。
   - 融合前沿的黑色硬阴影（`shadow-brutal`）、高反差双线边框与现代流式组件排版。
3. **闭环心理机制**：
   - “听老管家的就这么办”触发全屏五彩纸屑撒花特效，给予彻底锁定决心的满足感。
   - 随处可一键复制结构化决断金句卡片，便于在微信群、朋友圈分享。

---

## 二、Vercel 一键全栈部署

项目采用 Next.js 15 App Router 全栈架构，前端静态化分发 + 后端 Serverless 接口：

### 1. 环境变量配置 (Vercel Project Settings)
在 Vercel 控制台的项目环境变量中配置：
- `TYPESAFE_JEV_ENDPOINT`: TypeSafe Jev 模型服务真实请求地址（例如 `https://api.typesafe.com/v1/jev/decide`）。
- `TYPESAFE_JEV_API_KEY`: 访问凭证密钥（保存在 Vercel 服务端，绝不泄露给前端）。

若未配置环境变量，服务自动切换至内置的高拟真 Jev 本地推演引擎，保证 100% 稳定运行。

### 2. 本地开发与体验命令
```bash
cd ask-jev

# 安装依赖（用户本地开发走查时执行）
npm install

# 启动本地开发服务
npm run dev
```
打开浏览器访问 `http://localhost:3000` 即可。

### 3. 零安装即开即用预览
仓库根目录保留了轻量零依赖的 `index.html`，无需安装任何 npm 包，双击即可在任何浏览器或手机端预览完整的移动端适配效果与决策逻辑。

---

## 三、工程结构说明

```text
ask-jev/
├── app/
│   ├── api/
│   │   └── jev/
│   │       └── route.ts          # TypeSafe Jev 模型 Serverless 代理路由
│   ├── globals.css               # Tailwind CSS 与动效配置
│   ├── layout.tsx                # 全局根布局、移动端 Viewport 与 SEO 元数据
│   └── page.tsx                  # 现代 Neo-Brutalism 主页面
├── components/
│   ├── ApiSettingsModal.tsx      # 接口配置与连通性测试弹窗
│   ├── AskBadge.tsx              # 复古倾斜 Ask Jev 徽标
│   ├── DecisionBox.tsx           # 移动端适配核心输入与模式选择器
│   ├── JevAvatar.tsx             # 纯矢量 SVG 响应式老管家肖像
│   ├── TopicMatrix.tsx           # 移动端自适应热门纠结胶囊库
│   └── VerdictCard.tsx           # 裁决结果卡片与撒花闭环
├── lib/
│   ├── mockJev.ts                # 本地高拟真推演引擎与高频题库
│   └── types.ts                  # 全链路 TypeScript 严格类型契约
├── docs/
│   ├── PRD.md                    # 需求架构方案与移动端规范
│   ├── reviews/
│   │   └── UX_AND_EXPRESSION_REVIEW.md # 表达体系、交互连贯性与表现形式深度审查
│   └── test-reports/
│       └── PROD_TEST_REPORT.md   # 生产环境详尽用例测试与评估报告
├── scripts/
│   ├── run-production-tests.mjs  # 生产环境自动化测试套件
│   └── run-deep-tests-curl.mjs   # 生产环境深度场景与边界探测脚本
├── index.html                    # 零依赖单页版 (同步支持移动端)
├── package.json                  # Next.js 15 生产级配置
├── tailwind.config.ts            # 主题与 Neo-Brutalism 样式配置
├── tsconfig.json                 # TypeScript 严格配置
├── vercel.json                   # Vercel 部署配置
└── README.md                     # 本说明文档
```

---

## 四、致敬与开发者信息

- **项目开源代码库**：[https://github.com/kuhung/ask-jev](https://github.com/kuhung/ask-jev)
- **开发者**：[kuhung.me](https://kuhung.me)
- **特别致敬与鸣谢**：[askjev.net](https://askjev.net)（为本项目提供了经典管家拟人决策原型的灵感来源）

