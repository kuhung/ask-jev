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

export const runtime = 'nodejs';

const DEFAULT_TYPESAFE_ENDPOINT = 'https://api.typesafe.ai/v1/systemone';
const DEFAULT_MODEL = 'jev-latest';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as JevDecisionRequest;
    const { question, mode = 'yes_no', context } = body;

    if (!question || !question.trim()) {
      return NextResponse.json(
        { code: 400, message: '问题内容不能为空' },
        { status: 400 }
      );
    }

    const endpoint = process.env.TYPESAFE_JEV_ENDPOINT || DEFAULT_TYPESAFE_ENDPOINT;
    const apiKey = process.env.TYPESAFE_JEV_API_KEY;

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
          const parsedData = parseTypeSafeResponse(remoteJson, question, mode);
          if (parsedData) {
            return NextResponse.json<JevDecisionResponse>({
              code: 0,
              data: parsedData,
            });
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
    return NextResponse.json<JevDecisionResponse>({
      code: 0,
      data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { code: 500, message: err?.message || '决策服务异常' },
      { status: 500 }
    );
  }
}

/**
 * 将用户输入转化为 TypeSafe 官方 System One 原语请求 (Noul / Choice / Score)
 * 官方规范参考: https://docs.typesafe.ai/api
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
            false: '坚决别买、劝退止损、纯属冲动消费或消耗性社交、应当立刻拒绝',
          },
        },
      },
    };
  }

  if (mode === 'choice') {
    // 自动提取候选选项
    const parts = question.split(/还是|或者|vs|VS|\/|、/).map((s) => s.trim()).filter(Boolean);
    const criteria: Record<string, string> = {};
    if (parts.length >= 2) {
      parts.forEach((p) => {
        criteria[p] = `选项：${p}，评估该选项在当下带来的效用与情绪抚慰`;
      });
    } else {
      criteria['选项A'] = '选择第一个方案';
      criteria['选项B'] = '选择备选方案';
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

  if (answer.type === 'noul') {
    const noulAns = answer as TypeSafeNoulAnswer;
    const prob = noulAns.noul;
    const isYes = prob >= 0.5;
    const percent = Math.round(prob * 100);

    return {
      mode,
      verdict: isYes ? '果断去办！' : '坚决别买！',
      verdictTag: isYes ? `建议执行 (胜率 ${percent}%)` : `劝退止损 (冲动度 ${100 - percent}%)`,
      badgeClass: isYes ? ('green' as const) : ('red' as const),
      probability: prob,
      reasoning: isYes
        ? `TypeSafe Jev 模型推演显示执行收益明确（概率 ${percent}%）。纠结只会徒增心理损耗，与其事后反刍遗憾，不如放手一搏，去办吧！`
        : `TypeSafe Jev 模型评估此项冲动成分高达 ${100 - percent}%。生活里的很多执念买完就贬值。先冷静放上七天，把钱留在兜里带来的安全感更踏实。`,
      signId,
      rawAnswer: noulAns,
    };
  }

  if (answer.type === 'choice') {
    const choiceAns = answer as TypeSafeChoiceAnswer;
    const winner = choiceAns.choice;
    const conf = Math.round(choiceAns.confidence * 100);

    return {
      mode,
      verdict: `首选：${winner}！`,
      verdictTag: `最优选项 (置信度 ${conf}%)`,
      badgeClass: 'gold' as const,
      confidence: choiceAns.confidence,
      reasoning: `经过 TypeSafe Jev 模型多维度概率计算，选择「${winner}」在当下的综合收益最高（模型置信度 ${conf}%）。不要再滑动屏幕反复比较了，听老管家的，直接定下来！`,
      signId,
      rawAnswer: choiceAns,
    };
  }

  if (answer.type === 'score') {
    const scoreAns = answer as TypeSafeScoreAnswer;
    // score 原值通常在 0 到 criteria.length - 1 之间，归一化到 10 分制
    const normalizedScore = Math.min(10, Math.max(1, Math.round((scoreAns.score + 1) * 2.5)));
    const conf = Math.round(scoreAns.confidence * 100);

    return {
      mode,
      score: normalizedScore,
      verdict: `冲动指数 ${normalizedScore} 分`,
      verdictTag: normalizedScore >= 7 ? '冲动预警' : '相对理性',
      badgeClass: normalizedScore >= 7 ? ('red' as const) : ('gold' as const),
      confidence: scoreAns.confidence,
      reasoning: `TypeSafe Jev 模型加权评分得出冲动指数为 ${normalizedScore}/10（置信度 ${conf}%）。${
        normalizedScore >= 7
          ? '这属于典型的情绪应激决策，买前爽快，还款肉疼。建议立刻关掉软件，深呼吸三分钟，立省百分之百。'
          : '该念头具备一定的可行性，但建议先做好细致的预算拆解与备用方案再开工。'
      }`,
      signId,
      rawAnswer: scoreAns,
    };
  }

  return null;
}
