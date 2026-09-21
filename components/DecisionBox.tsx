'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DecisionMode } from '@/lib/types';
import { Sparkles, RotateCcw, ChevronDown, ChevronUp, X } from 'lucide-react';

interface DecisionBoxProps {
  question: string;
  setQuestion: (q: string) => void;
  mode: DecisionMode;
  setMode: (m: DecisionMode) => void;
  context: string;
  setContext: (c: string) => void;
  onAsk: () => void;
  onInspiration: () => void;
  onReset: () => void;
  isLoading: boolean;
}

export const DecisionBox: React.FC<DecisionBoxProps> = ({
  question,
  setQuestion,
  mode,
  setMode,
  context,
  setContext,
  onAsk,
  onInspiration,
  onReset,
  isLoading,
}) => {
  const [showContext, setShowContext] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isComposingRef = useRef(false);

  // 当外部注入背景（如灵感抽取）时，自动平滑展开背景输入框，确保决策依据完全可见
  useEffect(() => {
    if (context && context.trim().length > 0) {
      setShowContext(true);
    }
  }, [context]);

  // 当检测到对比连词或评分关键词时，自动对齐模式，提升输入体验
  useEffect(() => {
    if (/还是|或者|vs|VS|\/|、/.test(question) && mode === 'yes_no') {
      setMode('choice');
    } else if (/打分|评个分|靠谱度|指数|评分/.test(question) && mode !== 'score') {
      setMode('score');
    }
  }, [question, mode, setMode]);

  // 根据当前模式定制输入框提示
  const getPlaceholder = () => {
    switch (mode) {
      case 'yes_no':
        return '例如：6000块的苹果新机现在买不买？或：周六聚餐去不去？';
      case 'choice':
        return '例如：中午吃骨汤麻辣烫还是轻食沙拉？或：美式 / 拿铁';
      case 'score':
        return '例如：冲动想辞职去摆摊卖手冲咖啡靠谱度打分';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isComposingRef.current && (e.nativeEvent as any).keyCode !== 229) {
      e.preventDefault();
      inputRef.current?.blur();
      onAsk();
    }
  };

  return (
    <div className="w-full bg-cream-50 border-2 border-black shadow-brutal p-3 sm:p-5 rounded-md">
      {/* 搜索输入行与大红色 Ask 按钮 */}
      <div className="flex flex-row items-center gap-2 sm:gap-3">
        <div className="flex-1 bg-white border-2 border-black shadow-retro-inset p-1.5 sm:p-2 relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent outline-none text-base sm:text-lg font-sans text-black placeholder:text-gray-400 placeholder:italic pr-7"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onCompositionStart={() => { isComposingRef.current = true; }}
            onCompositionEnd={() => { isComposingRef.current = false; }}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            autoComplete="off"
          />
          {question.trim().length > 0 && (
            <button
              type="button"
              onClick={() => {
                setQuestion('');
                inputRef.current?.focus();
              }}
              className="absolute right-2 text-gray-400 hover:text-black p-0.5 rounded transition-colors"
              title="清除输入"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          onClick={() => {
            inputRef.current?.blur();
            onAsk();
          }}
          disabled={isLoading}
          className="bg-gradient-to-br from-retroRed-500 via-retroRed-600 to-retroRed-800 text-white font-display text-xl sm:text-2xl px-5 sm:px-8 py-2.5 sm:py-3 rounded-[50%/50%] border-2 border-white outline outline-2 outline-black shadow-brutal hover:brightness-105 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
        >
          {isLoading ? '审题中...' : 'Ask!'}
        </button>
      </div>

      {/* 移动端/桌面端统一适配的分段模式选择器 */}
      <div className="mt-3 pt-3 border-t border-gray-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="w-full sm:w-auto">
          <div className="grid grid-cols-3 sm:flex sm:items-center gap-1.5 bg-cream-200 p-1 border border-black rounded shadow-inner text-xs sm:text-sm">
            <button
              type="button"
              onClick={() => setMode('yes_no')}
              className={`py-1.5 sm:py-1 px-2 rounded font-bold transition-all text-center ${
                mode === 'yes_no'
                  ? 'bg-retroRed-600 text-white shadow-sm'
                  : 'text-black hover:bg-cream-300'
              }`}
            >
              是 / 否 (买/去)
            </button>
            <button
              type="button"
              onClick={() => setMode('choice')}
              className={`py-1.5 sm:py-1 px-2 rounded font-bold transition-all text-center ${
                mode === 'choice'
                  ? 'bg-retroRed-600 text-white shadow-sm'
                  : 'text-black hover:bg-cream-300'
              }`}
            >
              选一个 (吃啥/A或B)
            </button>
            <button
              type="button"
              onClick={() => setMode('score')}
              className={`py-1.5 sm:py-1 px-2 rounded font-bold transition-all text-center ${
                mode === 'score'
                  ? 'bg-retroRed-600 text-white shadow-sm'
                  : 'text-black hover:bg-cream-300'
              }`}
            >
              评个分 (冲动评估)
            </button>
          </div>
        </div>

        {/* 补充具体背景开关 */}
        <button
          type="button"
          onClick={() => setShowContext(!showContext)}
          className={`text-xs sm:text-sm px-2.5 py-1 rounded border border-black font-bold flex items-center self-end sm:self-center gap-1 transition-all ${
            showContext
              ? 'bg-amber-100 text-retroRed-700 shadow-brutal-sm'
              : 'bg-white hover:bg-cream-100 text-blue-900 shadow-sm'
          }`}
        >
          {showContext ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showContext ? '收起背景信息' : '+ 补充具体顾虑/预算'}
        </button>
      </div>

      {/* 补充背景折叠输入框 */}
      {showContext && (
        <div className="mt-2.5 p-2.5 bg-cream-100 border border-black rounded shadow-retro-inset animate-fadeIn">
          <label className="block text-xs font-bold text-gray-700 mb-1">
            输入你的现状限制（如余额紧张、在减脂、对方平时关系一般等，帮助 Jev 更扎心）：
          </label>
          <textarea
            className="w-full h-16 bg-white border border-gray-400 p-2 text-xs sm:text-sm font-sans outline-none rounded resize-none"
            placeholder="例如：手头积蓄还想备战考公，另外今天下午还要开总结会心情很烦躁..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
        </div>
      )}

      {/* 快捷操作栏：重置、抽灵感 */}
      <div className="mt-3 pt-2 border-t border-dashed border-gray-300 flex flex-wrap items-center justify-between gap-2 text-xs">
        <button
          type="button"
          onClick={onReset}
          className="bg-white hover:bg-cream-100 text-black border border-black px-2.5 py-1 font-bold rounded shadow-brutal-sm active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1"
        >
          <RotateCcw size={12} /> 清空重置
        </button>

        <button
          type="button"
          onClick={onInspiration}
          className="bg-amber-100 hover:bg-amber-200 text-retroRed-700 border border-black px-3 py-1 font-bold rounded shadow-brutal-sm active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5"
        >
          <Sparkles size={13} className="text-amber-600" />
          <span>抽取热门纠结场景</span>
        </button>
      </div>
    </div>
  );
};
