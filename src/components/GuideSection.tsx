/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Language } from '../types';
import { BookOpen, Sparkles, RefreshCw, Zap } from 'lucide-react';

interface GuideSectionProps {
  language: Language;
}

export const GuideSection: React.FC<GuideSectionProps> = ({ language }) => {
  const content = {
    ZH: {
      title: '家長與教師教學指引 (Parent & Teacher Guide)',
      intro: '本教材專為4歲幼兒設計，旨在將抽象的「十進位」與「退位」轉化為直觀的物理世界。以下是引導幼兒學習的黃金技巧：',
      barrier1Title: '進位突破 (例如 29 ➜ 30)',
      barrier1Desc: '當加到第10個散件時，球球會自動被吸引、聚集，並被一個藍色圓圈框起來，飛往左邊。這告訴孩子：「10個散球會魔法變身成1個大十位圓圈！」',
      barrier2Title: '退位理解 (例如 30 ➜ 29)',
      barrier2Desc: '當個位是0（沒有散球）且按【-】時，左邊的一個十位圓圈會突然「啪！」一聲爆開，變成10個橘色小球飛回右邊，接著才消滅1個，剩下29。幼兒能親眼看見「拆十」的完整物理過程！',
      feature3Title: '互動玩法：手動拆開 (Split)',
      feature3Desc: '直接點擊左邊的【藍色十位圓圈】，它會立刻「啪！」爆開成10個小橘球。請讓孩子多次點擊並觀察，即使滿地都是球，總數量也完全沒變哦！這有助於理解數量的守恆。',
      feature4Title: '手動裝籃 (Basket Mode)',
      feature4Desc: '把自動分組關閉，開啟【籃子模式】。孩子可以親自把10個橘色球球「拖曳」放進發光的籃子裡，放滿10個時，它就會變成十位圓圈！這能極大增強手腦協調與數量感知。',
      tip: '💡 教學建議：多讓孩子自己用手指去拖曳橘色球球、點擊藍色圓圈，這比單純按按鈕更有身體記憶哦！',
    },
    ENG: {
      title: 'Parent & Teacher Guide (教學指引)',
      intro: 'This interactive explorer is crafted for 4-year-olds to turn abstract "tens" and "ones" into a tangible, playful physical experience. Here is how you can guide your child:',
      barrier1Title: 'Carrying Over (e.g., 29 ➜ 30)',
      barrier1Desc: 'When the 10th orange dot is added, they automatically cluster together with a magnetic pull, form a blue ring, and fly to the left. Ask your child: "Look! What happened to our 10 loose dots?"',
      barrier2Title: 'Borrowing Subtraction (e.g., 30 ➜ 29)',
      barrier2Desc: 'When starting at 30 (0 loose dots) and clicking [-], a blue ring instantly "Pops!" and splits into 10 loose dots flying back to the right. Only then is 1 dot deleted, leaving 29. Kids physically witness where the 9 ones came from!',
      feature3Title: 'Interactive Play: Tap to Break',
      feature3Desc: 'Let your child tap any blue Tens ring. It instantly pops back into 10 loose orange dots. Guide them to notice that the total number does not change! This builds number conservation skills.',
      feature4Title: 'Interactive Play: Basket Mode',
      feature4Desc: 'Turn off Auto-Group and try Basket Mode! Your child can drag loose orange dots one-by-one into the glowing basket. Once 10 are filled, it magically turns into a Tens ring. This reinforces active counting!',
      tip: "💡 Tip: Encouraging your child to drag the dots and tap the rings with their own fingers builds spatial math intuition far better than just tapping buttons!",
    },
  };

  const current = content[language];

  return (
    <div id="guide-section" className="bg-white border-2 border-[#E5E1DA] rounded-[32px] p-6 md:p-8 max-w-5xl mx-auto my-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-blue-50 p-2.5 rounded-2xl text-blue-600 border border-blue-100 shadow-sm">
          <BookOpen className="w-6 h-6" />
        </div>
        <h2 className="text-xl md:text-2xl font-black text-slate-800 font-sans tracking-tight">
          {current.title}
        </h2>
      </div>

      <p className="text-slate-500 mb-6 text-sm md:text-base leading-relaxed font-semibold">
        {current.intro}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Card 1 */}
        <div className="bg-slate-50/55 rounded-2xl p-5 border border-[#E5E1DA] shadow-sm flex gap-4">
          <div className="text-blue-500 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 mb-1.5 flex items-center gap-1.5 text-base">
              {current.barrier1Title}
            </h3>
            <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed">
              {current.barrier1Desc}
            </p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-slate-50/55 rounded-2xl p-5 border border-[#E5E1DA] shadow-sm flex gap-4">
          <div className="text-orange-500 shrink-0">
            <RefreshCw className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 mb-1.5 flex items-center gap-1.5 text-base">
              {current.barrier2Title}
            </h3>
            <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed">
              {current.barrier2Desc}
            </p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-slate-50/55 rounded-2xl p-5 border border-[#E5E1DA] shadow-sm flex gap-4">
          <div className="text-blue-600 shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 mb-1.5 flex items-center gap-1.5 text-base">
              {current.feature3Title}
            </h3>
            <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed">
              {current.feature3Desc}
            </p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-slate-50/55 rounded-2xl p-5 border border-[#E5E1DA] shadow-sm flex gap-4">
          <div className="text-orange-500 shrink-0 font-bold text-lg">
            🧺
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 mb-1.5 flex items-center gap-1.5 text-base">
              {current.feature4Title}
            </h3>
            <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed">
              {current.feature4Desc}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#E5E1DA]">
        <p className="text-slate-600 font-extrabold text-xs md:text-sm leading-relaxed">
          {current.tip}
        </p>
      </div>
    </div>
  );
};
