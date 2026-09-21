# 问问Jev (Ask Jev)

面向中国大陆用户的复古 Web 1.0 风格生活微决策老管家。专治“买不买”、“花不花”、“用不用”、“中午吃什么”、“去不去”等精神内耗，直截了当给结论。

---

## 一、产品定位与核心价值

日常琐事往往带来大量心理内耗。纠结的原因通常在于信息过载带来的反复拉扯。

问问Jev 将经典的 90 年代 Ask Jeeves 管家搜索界面做本土化重构，核心特性包括：
1. **老管家形象**：毒舌、幽默且一针见血，绝不打太极，直接给结论与硬核点评。
2. **三大裁决模式**：
   - **是 / 否 (Yes / No)**：适配买不买、花不花、用不用、去不去。
   - **选一个 (Choice)**：适配中午吃什么、二选一与多选一场景。
   - **评个分 (Score)**：评估冲动消费指数与后悔概率（1 至 10 分）。
3. **闭环行动反馈**：
   - “听老管家的就这么办”触发全屏撒花，给予用户彻底定下来的心理确定感。
   - “我不服再摇一次”满足投机心理。
   - 一键复制决断金句卡片便于分享。

---

## 二、运行与体验方式

本项目遵循**零依赖、零构建成本**原则，无需执行任何 `npm install`：

### 本地直接双击体验
直接用 Chrome、Safari、Edge 或 Firefox 浏览器打开 `index.html` 即可立即体验全部交互。

### 或使用极简静态服务器启动
```bash
# 进入目录
cd ask-jev

# 使用 Python 快速起一个本地服务
python3 -m http.server 8000
```
打开浏览器访问 `http://localhost:8000` 即可。

---

## 三、后端 TypeSafe Jev 模型接口对接

页面内置双引擎机制：
- **离线 / 演示模式**：在未配置后端时，前端自动启用内置的高拟真 Jev 本地推理引擎，开箱即用。
- **真实 API 模式**：点击顶部「TypeSafe 接口设置」，输入你的后端服务地址即可无缝切换到真实模型调用。

### 1. 接口协议定义 (API Contract)
- **请求方式**: `POST /api/jev/decide`
- **请求头**: `Content-Type: application/json`

#### 请求体示例 (Request)
```json
{
  "question": "中午吃骨汤麻辣烫还是轻食鸡胸肉沙拉？",
  "mode": "choice",
  "context": "最近在控糖减脂，但是今天上午加班心情烦闷",
  "timestamp": 1726915000000
}
```

#### 响应体示例 (Response)
```json
{
  "code": 0,
  "data": {
    "mode": "choice",
    "verdict": "去吃麻辣烫！",
    "verdictTag": "实事求是",
    "badgeClass": "gold",
    "score": null,
    "reasoning": "心情不好的时候硬逼自己嚼生冷菜叶，下午大概率会因为心理空虚而报复性狂点高热量零食。去吃一碗骨汤麻辣烫，多涮白菜、香菇和牛肉，少放红油麻酱，兼顾抚慰与健康。"
  }
}
```

### 2. 后端服务端示例代码 (Node.js / Express 示范)
```javascript
const express = require('express');
const app = express();
app.use(express.json());

app.post('/api/jev/decide', async (req, res) => {
  const { question, mode, context } = req.body;
  
  // 此处调用 TypeSafe Jev 模型服务
  // 例如：const result = await typesafeJev.predict({ question, mode, context });
  
  res.json({
    code: 0,
    data: {
      mode: mode,
      verdict: "坚决别买！",
      verdictTag: "理智保卫",
      badgeClass: "red",
      reasoning: "你现在强烈的渴望其实源于生活枯燥带来的冲动消费欲。把钱留在兜里带来的安全感，远胜拆快递那10分钟的虚假多巴胺。"
    }
  });
});

app.listen(3000, () => console.log('Jev API Server running on port 3000'));
```

---

## 四、项目资产结构

```text
ask-jev/
├── README.md            # 项目说明与启动指引
├── index.html           # 高保真单页应用（自包含复古UI、SVG管家肖像与动效引擎）
└── docs/
    └── PRD.md           # 详细产品需求、场景映射与接口规范方案
```
