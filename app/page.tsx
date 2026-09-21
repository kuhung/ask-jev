'use client';

import React, { useState, useRef } from 'react';
import { JevAvatar } from '@/components/JevAvatar';
import { AskBadge } from '@/components/AskBadge';
import { DecisionBox } from '@/components/DecisionBox';
import { VerdictCard } from '@/components/VerdictCard';
import { TopicMatrix } from '@/components/TopicMatrix';
import { ApiSettingsModal } from '@/components/ApiSettingsModal';
import { DecisionMode, JevDecisionData, JevDecisionResponse } from '@/lib/types';
import { INSPIRATION_ITEMS } from '@/lib/mockJev';
import { Star } from 'lucide-react';

export default function Home() {
  const [question, setQuestion] = useState('');
  const [mode, setMode] = useState<DecisionMode>('yes_no');
  const [context, setContext] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verdictData, setVerdictData] = useState<JevDecisionData | null>(null);
  const [lastQuestion, setLastQuestion] = useState('');
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);

  const verdictRef = useRef<HTMLDivElement>(null);

  // 执行裁决
  const handleAsk = async () => {
    const q = question.trim();
    if (!q) {
      alert('请先输入你想让 Jev 裁决的纠结问题！');
      return;
    }

    setIsLoading(true);
    setLastQuestion(q);
    setVerdictData(null);

    try {
      // 优先请求本地 Next.js API 路由 (该路由会代理远程 TypeSafe Jev 或执行内置推演)
      const res = await fetch('/api/jev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, mode, context: context.trim() }),
      });

      if (res.ok) {
        const json: JevDecisionResponse = await res.json();
        setVerdictData(json.data);
      } else {
        throw new Error('API 调用失败');
      }
    } catch (err) {
      console.warn('请求后端失败，使用客户端回退推演');
      const { runMockJevInference } = await import('@/lib/mockJev');
      const fallback = runMockJevInference(q, mode, context.trim());
      setVerdictData(fallback);
    } finally {
      setIsLoading(false);
      // 移动端平滑定位到结果卡片
      setTimeout(() => {
        verdictRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  };

  // 随机抽取灵感
  const handleInspiration = () => {
    const pick = INSPIRATION_ITEMS[Math.floor(Math.random() * INSPIRATION_ITEMS.length)];
    setQuestion(pick.q);
    setContext(pick.context);
    setMode(pick.mode);
  };

  // 重置
  const handleReset = () => {
    setQuestion('');
    setContext('');
    setVerdictData(null);
  };

  // 场景词条选择
  const handleSelectTopic = (q: string, m: DecisionMode) => {
    setQuestion(q);
    setMode(m);
    // 自动触发一次裁决
    setIsLoading(true);
    setLastQuestion(q);
    setVerdictData(null);

    fetch('/api/jev', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q, mode: m }),
    })
      .then((r) => r.json())
      .then((json: JevDecisionResponse) => {
        setVerdictData(json.data);
        setTimeout(() => {
          verdictRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="w-full min-h-screen">
      {/* 顶部复古横向导航栏 (移动端支持平滑横滑) */}
      <header className="bg-retroWin-tab border-b-2 border-[#5A5A6E] px-2 sm:px-4 pt-1 flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-none shadow-sm">
        <button
          type="button"
          onClick={handleReset}
          className="bg-retroWin-tabActive text-black font-bold text-xs sm:text-sm px-3 sm:px-4 py-1.5 border-t-2 border-l-2 border-white border-r-2 border-black rounded-t"
        >
          首页
        </button>
        <button
          type="button"
          onClick={handleInspiration}
          className="bg-retroWin-tabInactive hover:bg-[#63638E] text-white font-bold text-xs sm:text-sm px-3 sm:px-4 py-1.5 border-t border-l border-[#777799] border-r border-black rounded-t transition-colors"
        >
          随便抛个硬币！
        </button>
        <button
          type="button"
          onClick={() => setIsApiModalOpen(true)}
          className="bg-retroWin-tabInactive hover:bg-[#63638E] text-white font-bold text-xs sm:text-sm px-3 sm:px-4 py-1.5 border-t border-l border-[#777799] border-r border-black rounded-t transition-colors"
        >
          TypeSafe 接口设置
        </button>
        <button
          type="button"
          onClick={() =>
            alert(
              '【关于 Jev 老管家】：\nJev 致敬了 90 年代经典 Ask Jeeves。在这个信息严重过载、每个人都在买不买与吃什么之间内耗的时代，Jev 专治各种无意义纠结。\n后端由 TypeSafe Jev 专有模型强力驱动，直接给出确定性硬核决断！'
            )
          }
          className="bg-retroWin-tabInactive hover:bg-[#63638E] text-white font-bold text-xs sm:text-sm px-3 sm:px-4 py-1.5 border-t border-l border-[#777799] border-r border-black rounded-t transition-colors"
        >
          关于 Jev 管家
        </button>
      </header>

      {/* 主页面容器 */}
      <main className="max-w-4xl mx-auto px-3 sm:px-6 pt-4 sm:pt-8">
        {/* 顶部形象与标语区 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <JevAvatar className="w-16 h-20 sm:w-24 sm:h-28" />
            <AskBadge />
          </div>

          <div className="text-center sm:text-right">
            <h1 className="font-display text-3xl sm:text-5xl text-retroRed-600 tracking-tight leading-none">
              Have a Question?
            </h1>
            <p className="font-sans font-bold text-sm sm:text-xl text-black mt-1">
              专治日常内耗，直接敲上问题问 <span className="font-display text-retroRed-600 text-2xl sm:text-3xl">Ask!</span>
            </p>
          </div>
        </div>

        {/* 中间核心控制区 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          {/* 左侧 NEW 贴纸 */}
          <aside className="lg:col-span-1 bg-yellow-100 border-2 border-dashed border-amber-600 p-3 rounded shadow-brutal-sm flex items-start gap-2.5">
            <div className="bg-amber-400 border border-amber-700 text-retroRed-600 font-display text-xs font-bold px-1.5 py-0.5 rounded shadow-sm">
              NEW!
            </div>
            <div className="text-xs leading-snug">
              <span className="font-bold">基于 TypeSafe Jev 模型！</span>
              <br />
              结构化极速输出。
              <br />
              <button
                type="button"
                onClick={() => setIsApiModalOpen(true)}
                className="text-blue-800 underline font-bold hover:text-red-700"
              >
                查看接口配置 &raquo;
              </button>
            </div>
          </aside>

          {/* 右侧核心交互输入盒 */}
          <div className="lg:col-span-3 space-y-4">
            <DecisionBox
              question={question}
              setQuestion={setQuestion}
              mode={mode}
              setMode={setMode}
              context={context}
              setContext={setContext}
              onAsk={handleAsk}
              onInspiration={handleInspiration}
              onReset={handleReset}
              isLoading={isLoading}
            />

            {/* 裁决结果信封卡片 */}
            <div ref={verdictRef}>
              {verdictData && (
                <VerdictCard
                  question={lastQuestion}
                  data={verdictData}
                  onReroll={handleAsk}
                />
              )}
            </div>
          </div>
        </div>

        {/* 探索场景胶囊矩阵 */}
        <TopicMatrix
          onSelectTopic={handleSelectTopic}
          onOpenDoc={() => setIsApiModalOpen(true)}
          onOpenAbout={() =>
            alert(
              '【关于 Jev 老管家】：\nJev 致敬了 90 年代经典 Ask Jeeves。专为中国年轻人高频生活抉择打造，直截了当，拒绝太极！'
            )
          }
        />

        {/* 底部复古 468x60 招租横幅广告条 */}
        <aside className="mt-8 border-2 border-black bg-white p-3 rounded shadow-brutal flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <Star className="text-retroRed-600 fill-retroRed-600 animate-pulse" size={24} />
            <div>
              <div
                onClick={() => alert('感谢关注！欢迎向朋友安利【问问Jev】生活微决策决断机！')}
                className="font-display text-lg sm:text-xl text-blue-900 underline cursor-pointer"
              >
                ADVERTISE HERE! 广告位招租！
              </div>
              <div className="text-[11px] text-gray-500">
                专治选择困难、纠结内耗。你的横幅可以挂在这里！
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => alert('商务联系：请联系 Jev 管家团队！')}
            className="text-xs font-bold text-blue-900 underline sm:border-l sm:border-gray-300 sm:pl-4 whitespace-nowrap"
          >
            联系管家 &raquo;
          </button>
        </aside>
      </main>

      {/* 接口设置弹窗 */}
      <ApiSettingsModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
      />
    </div>
  );
}
