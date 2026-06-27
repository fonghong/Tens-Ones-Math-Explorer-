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
    <div id="place-value-display" className="w-full h-full bg-white border-2 border-[#E5E1DA] rounded-2xl sm:rounded-[28px] p-3 sm:p-5 md:p-6 shadow-sm flex flex-col items-center justify-between select-none min-h-[100px] sm:min-h-[220px]">
      {/* Mini Header */}
      <span className="text-slate-400 font-extrabold text-[10px] xs:text-xs sm:text-sm md:text-base uppercase tracking-widest mb-1">
        {language === 'ZH' ? '目前顯示數值' : 'Current Number'}
      </span>

      {/* Combined Comic Display */}
      <div className="flex items-center text-5xl xs:text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black font-display leading-none py-1 sm:py-3 tracking-tight">
        {/* Tens Digit (Blue) */}
        <div className="relative w-[40px] xs:w-[50px] sm:w-[65px] md:w-[85px] lg:w-[100px] h-[50px] xs:h-[60px] sm:h-[80px] md:h-[105px] lg:h-[120px] flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={`tens-${tensDigit}`}
              initial={{ y: -35, opacity: 0, scale: 0.7 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 35, opacity: 0, scale: 0.7 }}
              transition={{ type: 'spring', stiffness: 300, damping: 16 }}
              className="text-blue-500 absolute font-display font-black leading-none drop-shadow-sm"
            >
              {tensDigit}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Ones Digit (Orange) */}
        <div className="relative w-[40px] xs:w-[50px] sm:w-[65px] md:w-[85px] lg:w-[100px] h-[50px] xs:h-[60px] sm:h-[80px] md:h-[105px] lg:h-[120px] flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={`ones-${onesDigit}`}
              initial={{ y: -35, opacity: 0, scale: 0.7 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 35, opacity: 0, scale: 0.7 }}
              transition={{ type: 'spring', stiffness: 300, damping: 16 }}
              className="text-orange-500 absolute font-display font-black leading-none drop-shadow-sm"
            >
              {onesDigit}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Place Value Column Titles */}
      <div className="flex gap-6 xs:gap-10 sm:gap-14 mt-1 border-t-2 border-slate-100 pt-2 sm:pt-3 w-full max-w-xs justify-center">
        <span className="text-blue-600 font-black uppercase tracking-wider text-[10px] xs:text-xs sm:text-sm md:text-base">
          {language === 'ZH' ? '十位 TENS' : 'TENS'}
        </span>
        <span className="text-orange-600 font-black uppercase tracking-wider text-[10px] xs:text-xs sm:text-sm md:text-base">
          {language === 'ZH' ? '個位 ONES' : 'ONES'}
        </span>
      </div>

      {/* Place Value Columns Grid */}
      <div className="hidden sm:block [@media(max-height:640px)]:hidden w-full mt-2 pt-2 border-t border-slate-100">
        <div className="grid grid-cols-2 gap-2 text-center divide-x divide-slate-100">
          {/* Left Column: Tens位 */}
          <div className="flex flex-col items-center justify-center px-1">
            <div className="text-[9px] xs:text-[11px] sm:text-xs md:text-sm font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mb-1 border border-blue-100 uppercase tracking-wide">
              {language === 'ZH' ? '十位 (組群)' : 'Tens Zone'}
            </div>
            <div className="text-sm xs:text-lg sm:text-2xl md:text-3xl font-black text-blue-500 font-display">
              {physicalTens}
            </div>
            <div className="text-[9px] xs:text-[11px] sm:text-xs md:text-sm text-slate-500 font-bold">
              {language === 'ZH' ? `${physicalTens} 個十` : `${physicalTens} Tens`}
            </div>
          </div>

          {/* Right Column: Ones位 */}
          <div className="flex flex-col items-center justify-center px-1">
            <div className="text-[9px] xs:text-[11px] sm:text-xs md:text-sm font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full mb-1 border border-orange-100 uppercase tracking-wide">
              {language === 'ZH' ? '個位 (散件)' : 'Ones Zone'}
            </div>
            <div className="text-sm xs:text-lg sm:text-2xl md:text-3xl font-black text-orange-500 font-display">
              {physicalOnes}
            </div>
            <div className="text-[9px] xs:text-[11px] sm:text-xs md:text-sm text-slate-500 font-bold">
              {language === 'ZH' ? `${physicalOnes} 個一` : `${physicalOnes} Ones`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
