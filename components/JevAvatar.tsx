import React from 'react';

interface JevAvatarProps {
  className?: string;
}

export const JevAvatar: React.FC<JevAvatarProps> = ({ className = "w-20 h-24 sm:w-28 sm:h-32" }) => {
  return (
    <svg 
      className={`${className} filter drop-shadow-[2px_2px_0px_rgba(0,0,0,0.25)]`} 
      viewBox="0 0 140 160" 
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Jev 老管家肖像"
    >
      {/* 头部与秃顶轮廓 */}
      <path 
        d="M45,95 C30,90 25,60 30,35 C35,12 65,8 90,12 C115,18 122,48 118,75 C115,95 100,105 80,110 Z" 
        fill="#FFE0BD" 
        stroke="#222" 
        strokeWidth="3"
      />
      {/* 侧边稀疏黑发 */}
      <path d="M28,45 C24,35 26,65 32,75 C35,65 36,55 28,45 Z" fill="#222" />
      <path d="M115,48 C120,40 120,68 114,80 C112,70 112,58 115,48 Z" fill="#222" />
      {/* 慈祥调侃眉毛 */}
      <path d="M42,48 Q55,42 66,48" fill="none" stroke="#222" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M82,46 Q94,38 106,44" fill="none" stroke="#222" strokeWidth="3.5" strokeLinecap="round" />
      {/* 眼睛 */}
      <circle cx="56" cy="56" r="3.5" fill="#222" />
      <circle cx="92" cy="54" r="3.5" fill="#222" />
      {/* 大鼻子 */}
      <path d="M72,50 Q78,68 82,72 Q70,76 66,72" fill="#FFE0BD" stroke="#222" strokeWidth="3" strokeLinejoin="round" />
      {/* 微笑抿嘴 */}
      <path d="M54,88 Q74,98 94,86" fill="none" stroke="#222" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M93,85 L98,82" fill="none" stroke="#222" strokeWidth="2.5" strokeLinecap="round" />
      {/* 双下巴 */}
      <path d="M60,98 Q74,104 88,98" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" />
      {/* 黑西装 */}
      <path d="M15,160 L38,112 L102,112 L125,160 Z" fill="#1C2128" stroke="#111" strokeWidth="3" />
      {/* 白领口 */}
      <polygon points="52,112 88,112 70,140" fill="#FFFFFF" stroke="#333" strokeWidth="1.5" />
      {/* 鲜红领带 */}
      <polygon points="67,125 73,125 76,160 64,160" fill="#D32F2F" stroke="#9A0007" strokeWidth="1.5" />
      <polygon points="65,123 75,123 72,130 68,130" fill="#B71C1C" />
    </svg>
  );
};
