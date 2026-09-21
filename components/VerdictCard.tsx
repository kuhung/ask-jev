'use client';

import React, { useState } from 'react';
import { JevDecisionData } from '@/lib/types';
import confetti from 'canvas-confetti';
import { Check, Copy, RefreshCw, ThumbsUp, ShieldCheck } from 'lucide-react';

interface VerdictCardProps {
  question: string;
  data: JevDecisionData;
  onReroll: () => void;
  onToast?: (msg: string) => void;
}

export const VerdictCard: React.FC<VerdictCardProps> = ({
  question,
  data,
  onReroll,
  onToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [isAdopted, setIsAdopted] = useState(false);

  // 触发纸屑撒花特效并进入锁定印章状态
  const handleAdopt = () => {
    if (isAdopted) return;

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });
    setIsAdopted(true);
    if (onToast) {
      onToast('老管家为你点赞！决策已加盖火漆印，内耗已终止，立刻行动！');
    }
  };

  const handleCopy = async () => {
    const text = `【问问Jev老管家裁决】\n问题：${question}\n裁决：${data.verdict}\n点评：${data.reasoning}`;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // 降级使用 textarea 复制
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      if (onToast) onToast('金句已复制到剪贴板，可前往微信群或朋友圈分享！');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
      if (onToast) onToast('复制受阻，请长按手动复制评语文本');
    }
  };

  const getBadgeStyle = () => {
    switch (data.badgeClass) {
      case 'green':
        return 'bg-emerald-700 text-white border-emerald-950';
      case 'gold':
        return 'bg-amber-600 text-white border-amber-900';
      case 'red':
      default:
        return 'bg-retroRed-600 text-white border-retroRed-800';
    }
  };

  return (
    <div className="relative w-full bg-cream-50 border-[3px] border-retroRed-800 shadow-brutal p-4 sm:p-6 rounded-md animate-fadeIn overflow-hidden">
      {/* 已采纳复古火漆印章 */}
      {isAdopted && (
        <div className="absolute right-3 top-2 sm:right-6 sm:top-4 rotate-[-12deg] pointer-events-none select-none z-10 animate-fadeIn">
          <div className="border-4 border-dashed border-retroRed-600 text-retroRed-600 font-display font-black text-xs sm:text-base px-3 py-1 rounded bg-cream-50/90 shadow-sm flex items-center gap-1 uppercase tracking-wider">
            <ShieldCheck size={16} /> 决策已锁 · DECISION SEALED
          </div>
        </div>
      )}

      {/* 头部问题回响与文书备忘编号 */}
      <div className="flex items-center justify-between border-b border-dashed border-red-300 pb-2 mb-3 text-xs text-gray-600">
        <span className="font-bold truncate max-w-[65%]">针对提问：「{question}」</span>
        <span className="font-mono text-gray-500">备忘录 No. #{data.signId}</span>
      </div>

      {/* 结论标签或打分 */}
      <div className="mb-3">
        {data.score !== undefined && data.score !== null ? (
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl sm:text-5xl text-retroRed-600">
              {data.score}
            </span>
            <span className="text-gray-600 font-bold text-sm sm:text-base">
              / 10 分 ({data.verdictTag || '冲动评估'})
            </span>
          </div>
        ) : (
          <span
            className={`inline-block px-4 py-1.5 font-display text-2xl sm:text-3xl rounded border-2 shadow-brutal-sm tracking-wider ${getBadgeStyle()}`}
          >
            {data.verdict}
          </span>
        )}
      </div>

      {/* 管家犀利评语 */}
      <div className="bg-cream-100 border-l-4 border-retroRed-600 p-3.5 sm:p-4 rounded-r text-sm sm:text-base leading-relaxed text-gray-900 font-serif mb-4 shadow-sm relative">
        <span className="text-retroRed-600 font-serif text-2xl leading-none absolute -top-1 left-2 select-none opacity-40">“</span>
        <div className="pl-3">{data.reasoning}</div>
      </div>

      {/* 情绪闭环操作按钮 */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200">
        <button
          type="button"
          onClick={handleAdopt}
          disabled={isAdopted}
          className={`flex-1 sm:flex-none font-bold border-2 border-black px-4 py-2 text-xs sm:text-sm rounded shadow-brutal-sm active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-1.5 transition-all ${
            isAdopted
              ? 'bg-gray-200 text-gray-500 border-gray-400 cursor-not-allowed shadow-none'
              : 'bg-amber-300 hover:bg-amber-400 text-black'
          }`}
        >
          <ThumbsUp size={14} /> {isAdopted ? '已遵照管家裁决！' : '听老管家的，就这么办！'}
        </button>

        <button
          type="button"
          onClick={onReroll}
          className="bg-white hover:bg-cream-100 text-black font-bold border-2 border-black px-3 py-2 text-xs sm:text-sm rounded shadow-brutal-sm active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-1 transition-all"
        >
          <RefreshCw size={13} /> 我不服再摇一次
        </button>

        <button
          type="button"
          onClick={handleCopy}
          className="bg-white hover:bg-cream-100 text-black font-bold border-2 border-black px-3 py-2 text-xs sm:text-sm rounded shadow-brutal-sm active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-1 transition-all"
        >
          {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
          <span>{copied ? '已复制金句' : '复制金句'}</span>
        </button>
      </div>
    </div>
  );
};
