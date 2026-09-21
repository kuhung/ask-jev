import { NextRequest, NextResponse } from 'next/server';
import { JevDecisionRequest, JevDecisionResponse } from '@/lib/types';
import { runMockJevInference } from '@/lib/mockJev';

export const runtime = 'nodejs';

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

    const endpoint = process.env.TYPESAFE_JEV_ENDPOINT;
    const apiKey = process.env.TYPESAFE_JEV_API_KEY;

    // 若配置了环境变量，优先调用 TypeSafe Jev 远程模型
    if (endpoint) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const remoteRes = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({ question, mode, context, timestamp: Date.now() }),
          cache: 'no-store',
        });

        if (remoteRes.ok) {
          const remoteJson = await remoteRes.json();
          return NextResponse.json({
            code: 0,
            data: remoteJson.data || remoteJson,
          });
        }
        console.warn(`TypeSafe Jev 远程返回非200状态: ${remoteRes.status}，平滑回退至内置推演。`);
      } catch (remoteErr) {
        console.warn('TypeSafe Jev 远程调用异常，平滑回退至内置推演:', remoteErr);
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
