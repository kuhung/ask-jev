'use client';

import React from 'react';
import { DecisionMode } from '@/lib/types';

interface TopicItem {
  title: string;
  note: string;
  q: string;
  mode: DecisionMode;
}

const TOPICS: TopicItem[] = [
  {
    title: '剁手大件 (买不买)',
    note: '换手机、相机、大件数码',
    q: '6000块的苹果新机现在买不买？',
    mode: 'yes_no',
  },
  {
    title: '钱包保卫 (花不花)',
    note: '年卡、报课、超支预算',
    q: '3000块的健身房年卡要不要办？',
    mode: 'yes_no',
  },
  {
    title: '闲置断舍离 (用不用)',
    note: '闲鱼、旧物、扔还是留',
    q: '买了一年没穿的羽绒服挂闲鱼还是留着？',
    mode: 'choice',
  },
  {
    title: '干饭指南 (吃什么)',
    note: '外卖、堂食、轻食纠结',
    q: '中午吃骨汤麻辣烫还是轻食鸡胸肉沙拉？',
    mode: 'choice',
  },
  {
    title: '打工人防耗 (去不去)',
    note: '团建、饭局、人情往来',
    q: '周五晚上部门自费聚餐去不去？',
    mode: 'yes_no',
  },
  {
    title: '冲动诊断 (评个分)',
    note: '脑热想法、1至10分评估',
    q: '冲动想辞职去摆摊卖手冲咖啡靠谱度打分',
    mode: 'score',
  },
];

interface TopicMatrixProps {
  onSelectTopic: (q: string, mode: DecisionMode) => void;
  onOpenDoc: () => void;
  onOpenAbout: () => void;
}

export const TopicMatrix: React.FC<TopicMatrixProps> = ({
  onSelectTopic,
  onOpenDoc,
  onOpenAbout,
}) => {
  return (
    <div className="w-full bg-cream-200 border-2 border-black shadow-brutal p-4 sm:p-5 rounded-md mt-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 左侧两列：场景分类 */}
        <div className="md:col-span-2">
          <div className="text-sm sm:text-base font-bold text-black border-b border-black pb-1.5 mb-3 flex items-center justify-between">
            <span>常问纠结专区 (Areas of Interest)</span>
            <span className="text-xs font-normal text-gray-600">点击自动填词</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {TOPICS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectTopic(item.q, item.mode)}
                className="text-left bg-cream-50 hover:bg-white border border-black p-2.5 rounded shadow-brutal-sm active:translate-y-0.5 active:shadow-none transition-all group"
              >
                <div className="text-xs sm:text-sm font-bold text-blue-900 group-hover:text-retroRed-600 underline">
                  {item.title}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">{item.note}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 右侧一列：精选目的地 */}
        <div className="border-t md:border-t-0 md:border-l border-black pt-4 md:pt-0 md:pl-5">
          <div className="text-sm sm:text-base font-bold text-black border-b border-black pb-1.5 mb-3">
            精选导航 (Destinations)
          </div>

          <ul className="space-y-2 text-xs sm:text-sm font-bold text-blue-900 list-disc pl-4">
            <li>
              <button
                type="button"
                onClick={onOpenAbout}
                className="underline hover:text-retroRed-600 text-left"
              >
                认识 Jev 老管家
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={onOpenDoc}
                className="underline hover:text-retroRed-600 text-left"
              >
                TypeSafe Jev 模型规范
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() =>
                  alert(
                    '【赛博硬币决断法】：当你在两件事之间犹豫不决时，抛硬币的关键不在于落下来的那一面，而在于抛在空中的瞬间，你心里已经知道了答案。问问Jev帮你把内心的声音直接放大！'
                  )
                }
                className="underline hover:text-retroRed-600 text-left"
              >
                赛博硬币决断法
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() =>
                  alert(
                    '【管家箴言】：\n1. 能用几十块钱解决的问题，不要消耗几小时情绪。\n2. 想做的事情不会犹豫，犹豫的事情大概率不值得做。\n3. 买前冷静七天，立省百分之百。'
                  )
                }
                className="underline hover:text-retroRed-600 text-left"
              >
                治好精神内耗的 100 句话
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
