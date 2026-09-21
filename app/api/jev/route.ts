import { NextRequest, NextResponse } from 'next/server';
import {
  JevDecisionRequest,
  JevDecisionResponse,
  TypeSafeSystemOneRequest,
  TypeSafeSystemOneResponse,
  TypeSafeNoulAnswer,
  TypeSafeChoiceAnswer,
  TypeSafeScoreAnswer,
} from '@/lib/types';
import { runMockJevInference } from '@/lib/mockJev';
import { checkRateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';

const DEFAULT_TYPESAFE_ENDPOINT = 'https://api.typesafe.ai/v1/systemone';
const DEFAULT_MODEL = 'jev-latest';

/**
 * 剥除字符串首尾中英文标点符号与多余空白
 */
function cleanPunctuation(text: string): string {
  return text.replace(/^[？?！!。，,、\s]+|[？?！!。，,、\s]+$/g, '').trim();
}

/**
 * 动词意图识别器与管家人设文案矩阵
 */
interface SemanticAction {
  triggers: string[];
  yesVerdict: string;
  noVerdict: string;
  yesReason: string;
  noReason: string;
}

const SEMANTIC_ACTIONS: SemanticAction[] = [
  {
    triggers: ['买', '购', '入', '换', '苹果', '手机', '相机', '数码', '耳机', '大衣', '包', '车', '二手车'],
    yesVerdict: '果断拿下！',
    noVerdict: '坚决别买！',
    yesReason: '这件物品带来的长期使用价值明显高于代价。既然已深思熟虑，那就开开心心收入囊中，让它提升你的生活品质！',
    noReason: '你现在强烈的渴望源于短期的多巴胺刺激。买前朝思暮想，买后角落落灰。把钱留在卡里带来的安全感，远胜拆快递那五分钟的虚假满足。',
  },
  {
    triggers: ['去', '聚餐', '团建', '参加', '婚礼', '饭局', '聚会', '见面', '赴约', '自驾', '露营'],
    yesVerdict: '盛装赴会！',
    noVerdict: '礼貌推掉！',
    yesReason: '这次社交能带来真实的能量交换与情绪抚慰。放下顾虑轻装赴约，享受当下的交流与氛围！',
    noReason: '凡是在去之前就让你心生抗拒的社交，去了大多也是如坐针毡。与其勉强自己迎合客套，不如礼貌推掉，把宝贵时间留给独处充电。',
  },
  {
    triggers: ['办', '卡', '课', '健身', '年卡', '充值', '会员', '私教', '培训'],
    yesVerdict: '放手去练！',
    noVerdict: '千万别办！',
    yesReason: '这次行动规划具备明确的可执行性。既然决心改变，就别再迟疑，立刻开工！',
    noReason: '指望通过一次性大额付费来购买自律，是消费陷阱中最温柔的套路。先坚持连续两周每晚快走或运动30分钟，真做到了再去谈办卡。',
  },
  {
    triggers: ['复合', '前任', '联系', '找他', '找她', '表白', '回头', '和好'],
    yesVerdict: '顺从心意！',
    noVerdict: '彻底翻篇！',
    yesReason: '既然彼此心中仍有真诚牵绊，且核心症结已有解法，那就勇敢迈出一步，把话说透，不给人生留遗憾。',
    noReason: '变质的冷饭加热三次也不会变新鲜。现在的不甘心只是沉没成本在作祟。立刻放下手机，深呼吸洗把脸，大步向前才能遇见新天地。',
  },
  {
    triggers: ['闲鱼', '卖', '挂', '扔', '断舍离', '清理'],
    yesVerdict: '立刻挂闲鱼！',
    noVerdict: '暂且留着！',
    yesReason: '超过半年没碰过的物件在你的生活里已经死去了。变现哪怕几十块钱，都比让它白白占用高昂的居住空间强得多。',
    noReason: '这件物品承载着不可替代的刚需属性或阶段性意义，贸然处置日后大概率还会溢价买回。先妥善收纳，观察一个季度再说。',
  },
];

function matchSemanticAction(question: string): SemanticAction | null {
  const cleanQ = question.toLowerCase();
  for (const action of SEMANTIC_ACTIONS) {
    if (action.triggers.some((t) => cleanQ.includes(t))) {
      return action;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  // 1. 前置接口防刷与频控校验
  const rateLimit = checkRateLimit(req);
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        code: 429,
        message: '提问过于频繁，请稍候再试',
        retryAfter: rateLimit.retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfter),
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.reset),
        },
      }
    );
  }

  const rateLimitHeaders = {
    'X-RateLimit-Limit': String(rateLimit.limit),
    'X-RateLimit-Remaining': String(rateLimit.remaining),
    'X-RateLimit-Reset': String(rateLimit.reset),
  };

  try {
    const body = (await req.json()) as JevDecisionRequest;
    const { question, mode = 'yes_no', context } = body;

    if (!question || !question.trim()) {
      return NextResponse.json(
        { code: 400, message: '问题内容不能为空' },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    // 支持前端传入自定义 Key/Endpoint (透传自请求头或环境变量)
    const headerKey = req.headers.get('x-typesafe-key');
    const headerEndpoint = req.headers.get('x-typesafe-endpoint');

    const endpoint = headerEndpoint?.trim() || process.env.TYPESAFE_JEV_ENDPOINT || DEFAULT_TYPESAFE_ENDPOINT;
    const apiKey = headerKey?.trim() || process.env.TYPESAFE_JEV_API_KEY;

    // 当配置了官方 API Key 时，发起真实 TypeSafe System One 评估请求
    if (apiKey && apiKey.trim()) {
      try {
        const typesafeReq = buildTypeSafeRequest(question.trim(), mode, context?.trim());

        const remoteRes = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify(typesafeReq),
          cache: 'no-store',
        });

        if (remoteRes.ok) {
          const remoteJson = (await remoteRes.json()) as TypeSafeSystemOneResponse;
          const parsedData = parseTypeSafeResponse(remoteJson, question.trim(), mode);
          if (parsedData) {
            return NextResponse.json<JevDecisionResponse>(
              {
                code: 0,
                data: parsedData,
              },
              { headers: rateLimitHeaders }
            );
          }
        } else {
          console.warn(`TypeSafe API 返回异常状态: ${remoteRes.status}，已平滑降级至内置推演。`);
        }
      } catch (remoteErr) {
        console.warn('TypeSafe 远程请求网络异常，已平滑降级至内置推演:', remoteErr);
      }
    }

    // 本地内置高拟真推演兜底
    const data = runMockJevInference(question.trim(), mode, context?.trim());
    return NextResponse.json<JevDecisionResponse>(
      {
        code: 0,
        data,
      },
      { headers: rateLimitHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      { code: 500, message: err?.message || '决策服务异常' },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}

/**
 * 将用户输入转化为 TypeSafe 官方 System One 原语请求 (Noul / Choice / Score)
 */
function buildTypeSafeRequest(
  question: string,
  mode: 'yes_no' | 'choice' | 'score',
  context?: string
): TypeSafeSystemOneRequest {
  const state = context
    ? `【用户提问】：${question}\n【背景/限制】：${context}`
    : `【用户提问】：${question}`;

  if (mode === 'yes_no') {
    return {
      state,
      model: DEFAULT_MODEL,
      questions: {
        decision: {
          type: 'noul',
          instructions: `评估该事项是否值得执行、买入或参加：${question}`,
          criteria: {
            true: '应该去办、非常值得买入或参与、行动收益明显高于代价',
            false: '坚决别做、劝退止损、纯属冲动消费或消耗性社交、应当立刻拒绝',
          },
        },
      },
    };
  }

  if (mode === 'choice') {
    // 自动提取候选选项并清洗两端标点
    const rawParts = question.split(/还是|或者|vs|VS|\/|、/).map(cleanPunctuation).filter(Boolean);
    const criteria: Record<string, string> = {};

    if (rawParts.length >= 2) {
      rawParts.forEach((p) => {
        criteria[p] = `选项：${p}，评估该选项在当下带来的效用与情绪抚慰`;
      });
    } else {
      // 启发式场景自适应对立候选（消除生硬的选项A/选项B）
      const qLower = question.toLowerCase();
      if (/吃|饭|餐|外卖|喝|奶茶|火锅|烧烤|麻辣烫|轻食/.test(qLower)) {
        criteria['重口犒劳 (外卖热食)'] = '满足口腹之欲，抚慰当下心情';
        criteria['健康轻食 (少油控糖)'] = '身体负担小，契合控糖减脂目标';
      } else if (/去|玩|周末|假期|出行|逛|户外|旅行/.test(qLower)) {
        criteria['出门探索 (户外透气)'] = '打破沉闷，出去走走见见阳光';
        criteria['宅家休整 (彻底放空)'] = '不耗精力，安安静静给自己充电';
      } else {
        criteria['稳健守成 (保持现状)'] = '遵循常规路径，控制不确定性风险';
        criteria['果断尝试 (打破常规)'] = '拥抱新可能，以行动打破内耗僵局';
      }
    }

    return {
      state,
      model: DEFAULT_MODEL,
      questions: {
        decision: {
          type: 'choice',
          instructions: `从候选项目中选出唯一最优项：${question}`,
          criteria,
        },
      },
    };
  }

  // score 模式
  return {
    state,
    model: DEFAULT_MODEL,
    questions: {
      decision: {
        type: 'score',
        instructions: `评估此项念头的冲动系数与日后后悔风险（从低到高）：${question}`,
        criteria: [
          '第1级：深思熟虑，理性决策，后悔概率极低',
          '第2级：轻度犹豫，可适度小成本试水',
          '第3级：冲动明显，存在明显的现实顾虑与沉没成本',
          '第4级：极其脑热，必定后悔，强烈建议立省100%',
        ],
      },
    },
  };
}

/**
 * 解析 TypeSafe 官方 System One 结构化响应并组装老管家裁决
 */
function parseTypeSafeResponse(
  res: TypeSafeSystemOneResponse,
  question: string,
  mode: 'yes_no' | 'choice' | 'score'
) {
  const answer = res.answers?.decision;
  if (!answer) return null;

  const signId = Math.floor(1000 + Math.random() * 9000);
  const semantic = matchSemanticAction(question);

  if (answer.type === 'noul') {
    const noulAns = answer as TypeSafeNoulAnswer;
    const prob = noulAns.noul;
    const isYes = prob >= 0.5;
    const percent = Math.round(prob * 100);

    let verdict = isYes ? '果断去办！' : '坚决别干！';
    let reasoning = isYes
      ? `老管家为你推演完毕，执行胜算达 ${percent}%。犹豫只会徒增心理内耗，既然大方向明确，与其日后反刍遗憾，不如放手一搏，去办！`
      : `老管家综合推演评估此项冲动风险达 ${100 - percent}%。真正值得做的事你早就兴奋地开工了，绝不会拖到现在到处问人。现在停下，立省百分之百的精力。`;

    if (semantic) {
      verdict = isYes ? semantic.yesVerdict : semantic.noVerdict;
      reasoning = isYes ? semantic.yesReason : semantic.noReason;
    }

    return {
      mode,
      verdict,
      verdictTag: isYes ? `建议执行 (胜率 ${percent}%)` : `劝退止损 (冲动度 ${100 - percent}%)`,
      badgeClass: isYes ? ('green' as const) : ('red' as const),
      probability: prob,
      reasoning,
      signId,
      rawAnswer: noulAns,
    };
  }

  if (answer.type === 'choice') {
    const choiceAns = answer as TypeSafeChoiceAnswer;
    const rawWinner = choiceAns.choice;
    const cleanWinner = cleanPunctuation(rawWinner);
    const conf = Math.round(choiceAns.confidence * 100);

    return {
      mode,
      verdict: `首选：${cleanWinner}！`,
      verdictTag: `最优选项 (置信度 ${conf}%)`,
      badgeClass: 'gold' as const,
      confidence: choiceAns.confidence,
      reasoning: `老管家综合推演了你的生活节律与情绪效用，选择「${cleanWinner}」是当下综合回报最高的一手（置信度 ${conf}%）。不要再滑动屏幕反复比较了，听老管家的，立刻定下来！`,
      signId,
      rawAnswer: choiceAns,
    };
  }

  if (answer.type === 'score') {
    const scoreAns = answer as TypeSafeScoreAnswer;
    const normalizedScore = Math.min(10, Math.max(1, Math.round((scoreAns.score + 1) * 2.5)));
    const conf = Math.round(scoreAns.confidence * 100);

    const isHighRisk = normalizedScore >= 7;
    const reasoning = isHighRisk
      ? `老管家加权评估此念头的冲动指数为 ${normalizedScore}/10 分（置信度 ${conf}%）。这属于典型的情绪应激反应，脑热开工，日后肉疼。建议立刻关掉软件，深呼吸三分钟，立省百分之百。`
      : `老管家加权评估此项决策可行性良好，冲动指数仅为 ${normalizedScore}/10 分（置信度 ${conf}%）。该想法具备较强理性支撑，建议进一步拆解小成本试水步骤，稳步推进。`;

    return {
      mode,
      score: normalizedScore,
      verdict: `冲动指数 ${normalizedScore} 分`,
      verdictTag: isHighRisk ? '冲动预警' : '相对理性',
      badgeClass: isHighRisk ? ('red' as const) : ('gold' as const),
      confidence: scoreAns.confidence,
      reasoning,
      signId,
      rawAnswer: scoreAns,
    };
  }

  return null;
}
