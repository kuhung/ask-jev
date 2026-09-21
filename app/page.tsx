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
import { Star, Bell } from 'lucide-react';

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
  const handleSelectTopic = async (q: string, m: DecisionMode) => {
    setQuestion(q);
    setMode(m);
    setContext('');
    setIsLoading(true);
    setLastQuestion(q);
    setVerdictData(null);

    const customKey = typeof window !== 'undefined' ? localStorage.getItem('ask_jev_api_key') : null;
    const customEndpoint = typeof window !== 'undefined' ? localStorage.getItem('ask_jev_api_endpoint') : null;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (customKey?.trim()) headers['x-typesafe-key'] = customKey.trim();
    if (customEndpoint?.trim()) headers['x-typesafe-endpoint'] = customEndpoint.trim();

    try {
      const res = await fetch('/api/jev', {
        method: 'POST',
        headers,
        body: JSON.stringify({ question: q, mode: m, context: '' }),
      });

      if (res.ok) {
        const json: JevDecisionResponse = await res.json();
        setVerdictData(json.data);
      } else {
        throw new Error('API 调用失败');
      }
    } catch {
      console.warn('词条请求后端失败，使用客户端回退推演');
      const { runMockJevInference } = await import('@/lib/mockJev');
      const fallback = runMockJevInference(q, m, '');
      setVerdictData(fallback);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        verdictRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
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
            className="bg-cream-50 hover:bg-white text-black font-bold text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 border-2 border-black rounded shadow-brutal-sm active:translate-y-0.5 active:shadow-none transition-all inline-flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-dashed border-black/20">
          <div className="flex items-center gap-2 sm:gap-3">
            <JevAvatar className="w-16 h-20 sm:w-24 sm:h-28" />
            <AskBadge />
          </div>

          <div className="text-center sm:text-right">
            <h1 className="font-display text-3xl sm:text-5xl text-retroRed-600 tracking-tight leading-none">
              Have a Question?
            </h1>
            <p className="font-sans font-bold text-sm sm:text-xl text-black mt-1.5">
              专治日常内耗，直接敲上问题问 <span className="font-display text-retroRed-600 text-2xl sm:text-3xl">Ask!</span>
            </p>
          </div>
        </div>

        {/* 中间核心控制区 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          {/* 左侧说明与开源鸣谢卡片 */}
          <aside className="order-2 lg:order-1 lg:col-span-1 space-y-3">
            <div className="bg-yellow-100 border-2 border-dashed border-amber-600 p-3 rounded shadow-brutal-sm flex items-start gap-2.5">
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
                  className="text-blue-800 underline font-bold hover:text-red-700 cursor-pointer"
                >
                  查看接口配置 &raquo;
                </button>
              </div>
            </div>

            {/* 开源仓库、开发者与致敬鸣谢立牌 */}
            <div className="bg-cream-50 border-2 border-black p-3 rounded shadow-brutal-sm text-xs space-y-2">
              <div className="font-bold text-black border-b border-black pb-1 flex items-center justify-between">
                <span>项目档案与鸣谢</span>
                <span className="text-[10px] bg-amber-200 border border-black px-1 rounded font-bold">开源</span>
              </div>
              <div>
                <a
                  href="https://github.com/kuhung/ask-jev"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-black hover:text-retroRed-600 underline flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                  <span>开源代码仓库 (GitHub)</span>
                </a>
              </div>
              <div className="text-gray-700">
                开发者：
                <a
                  href="https://kuhung.me"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-blue-900 hover:text-retroRed-600 underline ml-0.5"
                >
                  kuhung.me
                </a>
              </div>
              <div className="text-gray-700">
                特别致敬：
                <a
                  href="https://askjev.net"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-blue-900 hover:text-retroRed-600 underline ml-0.5"
                >
                  askjev.net
                </a>
              </div>
            </div>

            {/* 老管家执业守则卡片，充实侧栏，平衡页面视觉重心 */}
            <div className="bg-cream-100 border-2 border-black p-3 rounded shadow-brutal-sm text-xs space-y-1.5">
              <div className="font-bold text-black border-b border-black pb-1 flex items-center justify-between">
                <span>老管家当班备忘</span>
                <span className="text-[10px] bg-retroRed-600 text-white px-1 rounded font-bold">箴言</span>
              </div>
              <ul className="text-gray-700 space-y-1 text-[11px] leading-snug">
                <li>• 纠结超3分钟，坚决交由硬币裁决。</li>
                <li>• 听劝才能少走弯路，内耗止于行动。</li>
                <li>• 冲动消费放满7天，大概率不会再买。</li>
              </ul>
            </div>
          </aside>

          {/* 右侧核心交互输入盒 */}
          <div className="order-1 lg:order-2 lg:col-span-3 space-y-4">
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
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
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
