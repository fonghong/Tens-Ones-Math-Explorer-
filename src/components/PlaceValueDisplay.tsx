/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Language } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface PlaceValueDisplayProps {
  value: number; // total target value
  physicalTens: number; // actual number of rings currently on canvas
  physicalOnes: number; // actual number of loose dots currently on canvas
  language: Language;
}

export const PlaceValueDisplay: React.FC<PlaceValueDisplayProps> = ({
  value,
  physicalTens,
  physicalOnes,
  language,
}) => {
  // Pad value to two digits to always represent Tens and Ones clearly
  const paddedValueStr = value.toString().padStart(2, '0');
  const tensDigit = paddedValueStr[0];
  const onesDigit = paddedValueStr[1];

  return (
    <div id="place-value-display" className="w-full bg-white border-2 border-[#E5E1DA] rounded-[28px] p-4 shadow-sm flex flex-col items-center">
      {/* Mini Header */}
      <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest select-none mb-1">
        {language === 'ZH' ? '目前顯示數值' : 'Current Number'}
      </span>

      {/* Combined Comic Display */}
      <div className="flex items-center text-6xl md:text-7xl font-black font-display leading-none select-none py-1.5 tracking-tight">
        {/* Tens Digit (Blue) */}
        <div className="relative w-[45px] md:w-[60px] h-[55px] md:h-[75px] flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={`tens-${tensDigit}`}
              initial={{ y: -25, opacity: 0, scale: 0.7 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 25, opacity: 0, scale: 0.7 }}
              transition={{ type: 'spring', stiffness: 300, damping: 16 }}
              className="text-blue-500 absolute font-display font-black leading-none drop-shadow-sm"
            >
              {tensDigit}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Ones Digit (Orange) */}
        <div className="relative w-[45px] md:w-[60px] h-[55px] md:h-[75px] flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={`ones-${onesDigit}`}
              initial={{ y: -25, opacity: 0, scale: 0.7 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 25, opacity: 0, scale: 0.7 }}
              transition={{ type: 'spring', stiffness: 300, damping: 16 }}
              className="text-orange-500 absolute font-display font-black leading-none drop-shadow-sm"
            >
              {onesDigit}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Place Value Column Titles */}
      <div className="flex gap-10 mt-1 select-none border-t border-slate-100 pt-2 w-full max-w-xs justify-center">
        <span className="text-blue-600 font-extrabold uppercase tracking-widest text-[10px] md:text-xs">
          {language === 'ZH' ? '十位 TENS' : 'TENS'}
        </span>
        <span className="text-orange-600 font-extrabold uppercase tracking-widest text-[10px] md:text-xs">
          {language === 'ZH' ? '個位 ONES' : 'ONES'}
        </span>
      </div>

      {/* Place Value Columns Grid */}
      <div className="w-full mt-3 pt-3 border-t border-slate-100">
        <div className="grid grid-cols-2 gap-2 text-center divide-x divide-slate-100">
          {/* Left Column: Tens位 */}
          <div className="flex flex-col items-center justify-center px-1 select-none">
            <div className="text-[10px] font-black text-blue-600 bg-blue-50/70 px-2 py-0.5 rounded-full mb-0.5 border border-blue-100 uppercase tracking-wide">
              {language === 'ZH' ? '十位 (組群)' : 'Tens Zone'}
            </div>
            <div className="text-xl md:text-2xl font-black text-blue-500 font-display">
              {physicalTens}
            </div>
            <div className="text-[9px] text-slate-500 font-bold">
              {language === 'ZH' ? `${physicalTens} 個十` : `${physicalTens} Tens`}
            </div>
          </div>

          {/* Right Column: Ones位 */}
          <div className="flex flex-col items-center justify-center px-1 select-none">
            <div className="text-[10px] font-black text-orange-600 bg-orange-50/70 px-2 py-0.5 rounded-full mb-0.5 border border-orange-100 uppercase tracking-wide">
              {language === 'ZH' ? '個位 (散件)' : 'Ones Zone'}
            </div>
            <div className="text-xl md:text-2xl font-black text-orange-500 font-display">
              {physicalOnes}
            </div>
            <div className="text-[9px] text-slate-500 font-bold">
              {language === 'ZH' ? `${physicalOnes} 個一` : `${physicalOnes} Ones`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
