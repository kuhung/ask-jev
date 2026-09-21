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
import { Star, Bell, Github } from 'lucide-react';

export default function Home() {
  const [question, setQuestion] = useState('');
  const [mode, setMode] = useState<DecisionMode>('yes_no');
  const [context, setContext] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verdictData, setVerdictData] = useState<JevDecisionData | null>(null);
  const [lastQuestion, setLastQuestion] = useState('');
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const verdictRef = useRef<HTMLDivElement>(null);

  // 显示复古 Toast 浮层
  const showToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMsg(null);
    }, 3200);
  };

  // 执行裁决
  const handleAsk = async (isReroll = false) => {
    const q = question.trim();
    if (!q) {
      showToast('请先输入你想让 Jev 裁决的纠结问题！');
      return;
    }

    if (isReroll && q === lastQuestion && verdictData) {
      showToast('老管家重新把关也是同一结论，听劝才能少走弯路！');
    }

    setIsLoading(true);
    setLastQuestion(q);
    setVerdictData(null);

    // 从 localStorage 读取用户自定义配置
    const customKey = typeof window !== 'undefined' ? localStorage.getItem('ask_jev_api_key') : null;
    const customEndpoint = typeof window !== 'undefined' ? localStorage.getItem('ask_jev_api_endpoint') : null;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (customKey?.trim()) headers['x-typesafe-key'] = customKey.trim();
    if (customEndpoint?.trim()) headers['x-typesafe-endpoint'] = customEndpoint.trim();

    try {
      const res = await fetch('/api/jev', {
        method: 'POST',
        headers,
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
    showToast(`已抽取纠结场景：「${pick.q.slice(0, 14)}...」`);
  };

  // 重置
  const handleReset = () => {
    setQuestion('');
    setContext('');
    setVerdictData(null);
    showToast('已清空重置，请敲入新的纠结事项');
  };

  // 场景词条选择
  const handleSelectTopic = (q: string, m: DecisionMode) => {
    setQuestion(q);
    setMode(m);
    setIsLoading(true);
    setLastQuestion(q);
    setVerdictData(null);

    const customKey = typeof window !== 'undefined' ? localStorage.getItem('ask_jev_api_key') : null;
    const customEndpoint = typeof window !== 'undefined' ? localStorage.getItem('ask_jev_api_endpoint') : null;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (customKey?.trim()) headers['x-typesafe-key'] = customKey.trim();
    if (customEndpoint?.trim()) headers['x-typesafe-endpoint'] = customEndpoint.trim();

    fetch('/api/jev', {
      method: 'POST',
      headers,
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
      {/* 全局 Neo-Brutalism Toast 浮层 */}
      {toastMsg && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 animate-fadeIn max-w-[92vw]">
          <div className="bg-cream-100 border-2 border-black shadow-brutal px-4 py-2 rounded flex items-center gap-2 text-xs sm:text-sm font-bold text-black">
            <Bell size={14} className="text-retroRed-600 animate-bounce" />
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* 统一 Neo-Brutalism 顶部导航栏 */}
      <header className="bg-cream-200 border-b-2 border-black px-2 sm:px-6 pt-2 pb-1.5 flex items-center justify-between gap-2 overflow-x-auto whitespace-nowrap scrollbar-none shadow-sm">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="bg-retroRed-600 text-white font-bold text-xs sm:text-sm px-3 sm:px-4 py-1.5 border-2 border-black rounded shadow-brutal-sm active:translate-y-0.5 active:shadow-none transition-all"
          >
            首页
          </button>
          <button
            type="button"
            onClick={handleInspiration}
            className="bg-white hover:bg-cream-100 text-black font-bold text-xs sm:text-sm px-3 sm:px-4 py-1.5 border-2 border-black rounded shadow-brutal-sm active:translate-y-0.5 active:shadow-none transition-all"
          >
            随便抛个硬币！
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <a
            href="https://github.com/kuhung/ask-jev"
            target="_blank"
            rel="noreferrer"
            className="bg-cream-50 hover:bg-white text-black font-bold text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 border-2 border-black rounded shadow-brutal-sm active:translate-y-0.5 active:shadow-none transition-all inline-flex items-center gap-1"
          >
            <Github size={13} />
            <span>GitHub</span>
          </a>
          <button
            type="button"
            onClick={() => setIsApiModalOpen(true)}
            className="bg-cream-50 hover:bg-white text-black font-bold text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 border-2 border-black rounded shadow-brutal-sm active:translate-y-0.5 active:shadow-none transition-all"
          >
            TypeSafe 接口设置
          </button>
          <button
            type="button"
            onClick={() =>
              showToast(
                'Jev 致敬了 90 年代经典 Ask Jeeves。在这个选择过载的时代，专治买不买与吃什么，直截了当给出决断！'
              )
            }
            className="bg-cream-50 hover:bg-white text-black font-bold text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 border-2 border-black rounded shadow-brutal-sm active:translate-y-0.5 active:shadow-none transition-all"
          >
            关于管家
          </button>
        </div>
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
              onAsk={() => handleAsk(false)}
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
                  onReroll={() => handleAsk(true)}
                  onToast={showToast}
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
            showToast(
              'Jev 致敬了 90 年代经典 Ask Jeeves。专为年轻人的高频生活抉择打造，直截了当，拒绝太极！'
            )
          }
          onToast={showToast}
        />

        {/* 底部复古 468x60 招租横幅广告条 */}
        <aside className="mt-8 border-2 border-black bg-white p-3 rounded shadow-brutal flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <Star className="text-retroRed-600 fill-retroRed-600 animate-pulse" size={24} />
            <div>
              <div
                onClick={() => showToast('欢迎向朋友分享【问问Jev】生活微决策决断机！')}
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
            onClick={() => showToast('商务合作请联系 Jev 管家团队！')}
            className="text-xs font-bold text-blue-900 underline sm:border-l sm:border-gray-300 sm:pl-4 whitespace-nowrap"
          >
            联系管家 &raquo;
          </button>
        </aside>
        {/* 底部版权、开源仓库与致敬鸣谢 */}
        <footer className="mt-8 pt-4 pb-8 border-t-2 border-dashed border-black/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-700">
          <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
            <a
              href="https://github.com/kuhung/ask-jev"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-black hover:text-retroRed-600 underline"
            >
              <Github size={14} />
              <span>开源代码库 (GitHub)</span>
            </a>
            <span className="text-gray-400">|</span>
            <span>
              开发者：
              <a
                href="https://kuhung.me"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-blue-900 hover:text-retroRed-600 underline"
              >
                kuhung.me
              </a>
            </span>
          </div>

          <div className="text-center sm:text-right text-xs text-gray-600">
            特别致敬与鸣谢：
            <a
              href="https://askjev.net"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-blue-900 hover:text-retroRed-600 underline ml-1"
            >
              askjev.net
            </a>
            （经典灵感源泉）
          </div>
        </footer>
      </main>

      {/* 接口设置弹窗 */}
      <ApiSettingsModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
      />
    </div>
  );
}
