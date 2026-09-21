# 问问Jev (Ask Jev) 产品原型与 TypeSafe 官方接口规范

## 一、一页纸概览 (Executive View)

| 维度 | 内容说明 |
| :--- | :--- |
| **产品定位** | 面向中国大陆年轻人的复古新野蛮主义 (Neo-Brutalism) 生活微决策决断机，专治买不买、吃什么、去不去。 |
| **参考原型** | 经典 Ask Jeeves (Ask Jev) 拟人管家搜索界面，结合现代前沿组件（Next.js 15 + Tailwind CSS）。 |
| **官方接口** | 对接 TypeSafe 官方 **System One API**（`POST https://api.typesafe.ai/v1/systemone`），模型为旗舰决策模型 `jev-latest`。 |
| **三大原语** | 严格映射 TypeSafe 底层原语：**Noul** (Yes/No 概率)、**Choice** (多项择一分布)、**Score** (分阶梯加权评分)。 |
| **部署方式** | **Vercel 一键零配置全栈部署**，前端 SSR/SSG + 后端 Serverless 路由代理保护密钥。 |

---

## 二、TypeSafe 官方 System One 接口规范 (API Contract)

依据 TypeSafe 官方文档 [https://docs.typesafe.ai/api](https://docs.typesafe.ai/api)：

### 1. 基础调用说明
- **Endpoint**: `POST https://api.typesafe.ai/v1/systemone`
- **Headers**:
  - `Authorization: Bearer <TYPESAFE_API_KEY>`
  - `Content-Type: application/json`
- **模型 (Model)**: `jev-latest`（官方旗舰 System One 决策模型）

### 2. 三大核心原语映射

#### ① Noul 原语（解决“买不买”、“去不去”、“花不花”）
- **作用**：评估是/否命题，返回介于 0 (No) 到 1 (Yes) 之间的精确校准概率。
- **请求参数**：
  ```json
  {
    "state": "【用户提问】：6000块的苹果新机现在买不买？\n【背景/限制】：手头的iPhone 13电池健康81%，还能凑合用。",
    "model": "jev-latest",
    "questions": {
      "decision": {
        "type": "noul",
        "instructions": "评估该事项是否值得执行、买入或参加：6000块的苹果新机现在买不买？",
        "criteria": {
          "true": "应该去办、非常值得买入或参与、行动收益明显高于代价",
          "false": "坚决别买、劝退止损、纯属冲动消费或消耗性社交、应当立刻拒绝"
        }
      }
    }
  }
  ```
- **官方响应**：
  ```json
  {
    "model": "jev-1.13.0",
    "answers": {
      "decision": {
        "type": "noul",
        "noul": 0.18
      }
    },
    "usage": { "input_tokens": 128, "output_tokens": 18 }
  }
  ```
- **业务输出**：概率低于 0.5 时输出【坚决别买！】（冲动度 82%），高于 0.5 时输出【果断冲！】。

#### ② Choice 原语（解决“中午吃什么”、“A还是B”）
- **作用**：从用户给定的候选项中挑选唯一最优解，并输出全概率分布与整体置信度（Confidence）。
- **请求参数**：
  ```json
  {
    "state": "【用户提问】：中午吃骨汤麻辣烫还是轻食鸡胸肉沙拉？\n【背景/限制】：最近在控糖，但是今天上午加班心情烦闷",
    "model": "jev-latest",
    "questions": {
      "decision": {
        "type": "choice",
        "instructions": "从候选项目中选出唯一最优项：中午吃骨汤麻辣烫还是轻食鸡胸肉沙拉？",
        "criteria": {
          "骨汤麻辣烫": "温暖饱腹，抚慰情绪，建议多煮青菜和牛肉",
          "轻食鸡胸肉沙拉": "严格控糖减脂"
        }
      }
    }
  }
  ```
- **官方响应**：
  ```json
  {
    "model": "jev-1.13.0",
    "answers": {
      "decision": {
        "type": "choice",
        "choice": "骨汤麻辣烫",
        "probabilities": { "骨汤麻辣烫": 0.86, "轻食鸡胸肉沙拉": 0.14 },
        "confidence": 0.82
      }
    },
    "usage": { "input_tokens": 142, "output_tokens": 32 }
  }
  ```
- **业务输出**：输出胜出选项【首选：骨汤麻辣烫！】，标注模型置信度 82%。

#### ③ Score 原语（解决“冲动诊断”、“靠谱度打分”）
- **作用**：按照从低到高的有序评价梯队打分，返回加权数值与置信度。
- **请求参数**：
  ```json
  {
    "state": "【用户提问】：冲动想辞职去大理租个院子摆摊卖手冲咖啡靠谱度打分",
    "model": "jev-latest",
    "questions": {
      "decision": {
        "type": "score",
        "instructions": "评估此项念头的冲动系数与日后后悔风险（从低到高）：冲动想辞职去大理租个院子摆摊卖手冲咖啡靠谱度打分",
        "criteria": [
          "第1级：深思熟虑，理性决策，后悔概率极低",
          "第2级：轻度犹豫，可适度小成本试水",
          "第3级：冲动明显，存在明显的现实顾虑与沉没成本",
          "第4级：极其脑热，必定后悔，强烈建议立省100%"
        ]
      }
    }
  }
  ```
- **官方响应**：
  ```json
  {
    "model": "jev-1.13.0",
    "answers": {
      "decision": {
        "type": "score",
        "score": 3.2,
        "legend": { "0": "第1级...", "1": "第2级...", "2": "第3级...", "3": "第4级..." },
        "probabilities": { "0": 0.0, "1": 0.05, "2": 0.25, "3": 0.70 },
        "confidence": 0.88
      }
    },
    "usage": { "input_tokens": 150, "output_tokens": 26 }
  }
  ```
- **业务输出**：归一化为 10 分制输出【冲动指数 8 分（冲动预警）】。

---

## 三、安全与环境变量配置

在 Vercel 生产环境中：
- `TYPESAFE_JEV_API_KEY`: 填入你的 TypeSafe 密钥（可在 console.typesafe.ai 获取）。
- `TYPESAFE_JEV_ENDPOINT`: 默认为 `https://api.typesafe.ai/v1/systemone`，支持配置内部私有网关或代理。
- 若环境变量未配置，系统会自动无缝切换至本地内置的高拟真 Jev 推演引擎，确保任何情况下页面都不崩溃。
