import React from 'react';

export const AskBadge: React.FC = () => {
  return (
    <div className="inline-flex flex-col items-start select-none">
      <div className="bg-gradient-to-br from-red-500 via-retroRed-600 to-retroRed-800 border-2 sm:border-3 border-cream-50 rounded-[50%/50%] px-4 py-2 sm:px-6 sm:py-3 shadow-brutal-sm sm:shadow-brutal -rotate-6 transform transition-transform hover:rotate-0">
        <span className="text-white font-display text-2xl sm:text-4xl italic tracking-tighter drop-shadow-[2px_2px_0px_#440000] leading-none">
          Ask
        </span>
      </div>
      <div className="font-display text-xl sm:text-2xl font-black text-black ml-4 sm:ml-6 -mt-1 tracking-tight">
        Jev
      </div>
    </div>
  );
};
