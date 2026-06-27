/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Language, ChineseDialect, IncrementStep } from './types';
import { MathCanvas, MathCanvasRef } from './components/MathCanvas';
import { PlaceValueDisplay } from './components/PlaceValueDisplay';
import { GuideSection } from './components/GuideSection';
import { synth } from './utils/audio';
import { motion } from 'motion/react';
import {
  Settings,
  HelpCircle,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Sparkles,
  Award,
  Globe,
  Plus,
  Minus,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  // Game states
  const [value, setValue] = useState<number>(29); // Start at 29 so they can try 29 -> 30 instantly!
  const [step, setStep] = useState<IncrementStep>(1);
  const [autoGroup, setAutoGroup] = useState<boolean>(true);
  const [language, setLanguage] = useState<Language>('ZH');
  const [chineseDialect, setChineseDialect] = useState<ChineseDialect>('cantonese');
  const [voiceover, setVoiceover] = useState<boolean>(true);
  const [soundEffects, setSoundEffects] = useState<boolean>(true);

  // Distraction-free tabs separating toddler play from guides/controls
  const [activeTab, setActiveTab] = useState<'play' | 'guide'>('play');

  // States returned from physics canvas for dynamic display rendering
  const [physicalTens, setPhysicalTens] = useState<number>(2);
  const [physicalOnes, setPhysicalOnes] = useState<number>(9);

  // Toggle parent setting panels (defaults to true in guide tab)
  const [showSettings, setShowSettings] = useState<boolean>(true);

  // Canvas Ref to trigger resets / manual groupings
  const canvasRef = useRef<MathCanvasRef | null>(null);

  // Handle Increments clamped to 99
  const handleIncrement = () => {
    synth.setEnabled(soundEffects);
    synth.playTick();
    setValue((prev) => {
      const next = Math.min(99, prev + step);
      return next;
    });
  };

  // Handle Decrements clamped to 0
  const handleDecrement = () => {
    synth.setEnabled(soundEffects);
    synth.playTick();
    setValue((prev) => {
      const next = Math.max(0, prev - step);
      return next;
    });
  };

  // Jump to specific mathematical presets
  const handleJumpToPreset = (presetVal: number) => {
    synth.setEnabled(soundEffects);
    synth.playPop();
    setValue(presetVal);
  };

  // Full reset
  const handleReset = () => {
    synth.setEnabled(soundEffects);
    synth.playCelebration();
    setValue(0);
    if (canvasRef.current) {
      canvasRef.current.reset();
    }
  };

  // Trigger manual grouping if >= 10 loose dots on canvas
  const handleManualGroup = () => {
    if (canvasRef.current) {
      canvasRef.current.triggerGroupAll();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#333] py-6 px-4 md:px-6 font-sans">
      
      {/* 1. Header Navigation Bar */}
      <header className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white border-b-2 border-[#E5E1DA] rounded-3xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2.5 rounded-2xl text-blue-600 border border-blue-200 shadow-sm animate-bounce-slow">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              {language === 'ZH' ? '十位與個位數學探險家' : 'Tens and Ones Explorer'}
            </h1>
            <p className="text-xs md:text-sm font-semibold text-slate-400">
              {language === 'ZH' ? '⭐ 專為4歲幼兒設計的圖像化十進位啟蒙教材' : '⭐ Playful early place-value learning tool for toddlers'}
            </p>
          </div>
        </div>

        {/* Global Controls & Language Switcher */}
        <div className="flex items-center gap-2.5">
          {/* Language pill toggle */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-[#E5E1DA]">
            <button
              onClick={() => {
                setLanguage('ENG');
                synth.setEnabled(soundEffects);
                synth.playPop();
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wide cursor-pointer ${
                language === 'ENG'
                  ? 'bg-slate-800 text-white shadow-sm font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ENG
            </button>
            <button
              onClick={() => {
                setLanguage('ZH');
                synth.setEnabled(soundEffects);
                synth.playPop();
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wide cursor-pointer ${
                language === 'ZH'
                  ? 'bg-slate-800 text-white shadow-sm font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              中文
            </button>
          </div>

          {/* Quick Config Button */}
          <button
            onClick={() => {
              setActiveTab(activeTab === 'play' ? 'guide' : 'play');
              synth.setEnabled(soundEffects);
              synth.playPop();
            }}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-blue-100 border-blue-200 text-blue-700 font-bold'
                : 'bg-white border-[#E5E1DA] text-slate-500 hover:bg-slate-50'
            }`}
            title="Parent Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 1.5 Tab Switcher: Focus Play vs Teaching Guides */}
      <div className="max-w-5xl mx-auto mb-6 flex justify-center px-4">
        <div className="bg-white/95 backdrop-blur p-1.5 rounded-3xl flex items-center gap-1 border-2 border-[#E5E1DA] shadow-sm select-none">
          <button
            id="tab-play-btn"
            onClick={() => {
              setActiveTab('play');
              synth.setEnabled(soundEffects);
              synth.playPop();
            }}
            className={`px-5 py-2.5 rounded-2xl text-xs md:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'play'
                ? 'bg-slate-800 text-white shadow-sm font-black'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <span>🎮</span>
            <span>{language === 'ZH' ? '幼兒探索區' : 'Toddler Play'}</span>
          </button>
          <button
            id="tab-guide-btn"
            onClick={() => {
              setActiveTab('guide');
              synth.setEnabled(soundEffects);
              synth.playPop();
            }}
            className={`px-5 py-2.5 rounded-2xl text-xs md:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-slate-800 text-white shadow-sm font-black'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <span>📖</span>
            <span>{language === 'ZH' ? '教師與家長教學指引' : 'Teacher & Parent Guide'}</span>
          </button>
        </div>
      </div>

      {/* 2. Main Workspace Layout */}
      <main className="max-w-5xl mx-auto grid grid-cols-1 gap-6">

        {activeTab === 'play' ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full px-4"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch w-full">
              
              {/* Left Column: Place Value Number & Play Console */}
              <div className="col-span-1 lg:col-span-4 flex flex-col gap-4">
                {/* Dynamic Numerical Place Value Display */}
                <PlaceValueDisplay
                  value={value}
                  physicalTens={physicalTens}
                  physicalOnes={physicalOnes}
                  language={language}
                />

                {/* Toddler-Friendly Game Controls Bar */}
                <div className="w-full bg-white border-2 border-[#E5E1DA] rounded-[28px] p-4 shadow-sm flex flex-col items-center gap-4">
                  
                  {/* Main Action Buttons: Huge Minus & Plus side-by-side */}
                  <div className="w-full flex items-center justify-between gap-4">
                    {/* Minus Button [-] */}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDecrement}
                      disabled={value === 0}
                      className={`flex-1 h-16 md:h-20 rounded-2xl flex items-center justify-center transition-all group select-none cursor-pointer ${
                        value === 0
                          ? 'bg-slate-100 border-b-2 border-slate-200 text-slate-300 cursor-not-allowed'
                          : 'bg-red-100 border-b-8 border-red-200 active:border-b-2 active:translate-y-1 text-red-500'
                      }`}
                    >
                      <div className="w-7 h-2 bg-red-500 rounded-full group-hover:scale-110 transition-transform"></div>
                    </motion.button>

                    {/* Plus Button [+] */}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleIncrement}
                      disabled={value >= 99}
                      className={`flex-1 h-16 md:h-20 rounded-2xl flex items-center justify-center transition-all group select-none cursor-pointer relative ${
                        value >= 99
                          ? 'bg-slate-100 border-b-2 border-slate-200 text-slate-300 cursor-not-allowed'
                          : 'bg-green-100 border-b-8 border-green-200 active:border-b-2 active:translate-y-1 text-green-500'
                      }`}
                    >
                      <div className="relative group-hover:scale-110 transition-transform w-7 h-7 flex items-center justify-center">
                        <div className="w-7 h-2 bg-green-500 rounded-full"></div>
                        <div className="w-7 h-2 bg-green-500 rounded-full rotate-90 absolute"></div>
                      </div>
                    </motion.button>
                  </div>

                  {/* Reset to 0 and Input Setter */}
                  <div className="w-full flex items-center gap-2">
                    <button
                      onClick={handleReset}
                      className="flex-1 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all select-none cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {language === 'ZH' ? '歸零' : 'Reset'}
                    </button>

                    <div className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl shadow-sm transition-colors">
                      <span className="text-[10px] font-black text-slate-500 select-none">
                        {language === 'ZH' ? '設為:' : 'Set:'}
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={value === 0 && physicalOnes === 0 && physicalTens === 0 ? '' : value}
                        placeholder="0"
                        onChange={(e) => {
                          const parsed = parseInt(e.target.value, 10);
                          if (!isNaN(parsed)) {
                            handleJumpToPreset(Math.max(0, Math.min(99, parsed)));
                          } else {
                            handleJumpToPreset(0);
                          }
                        }}
                        className="w-12 text-center font-black text-xs text-slate-700 bg-white border border-[#E5E1DA] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 py-0.5"
                      />
                    </div>
                  </div>

                  {/* Fast Jump Presets */}
                  <div className="w-full flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 text-center select-none">
                      {language === 'ZH' ? '學習進位與退位門檻' : 'Learn Place Value Boundaries'}
                    </span>
                    
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => handleJumpToPreset(9)}
                        className={`py-1.5 px-2 rounded-xl border text-xs font-bold transition-all shadow-sm select-none cursor-pointer ${
                          value === 9
                            ? 'bg-orange-500 border-orange-600 text-white'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        9 ({language === 'ZH' ? '準備進位' : 'Ready'})
                      </button>

                      <button
                        onClick={() => handleJumpToPreset(99)}
                        className={`py-1.5 px-2 rounded-xl border text-xs font-bold transition-all shadow-sm select-none cursor-pointer ${
                          value === 99
                            ? 'bg-slate-700 border-slate-800 text-white font-bold'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        99 ({language === 'ZH' ? '最大' : 'Max'})
                      </button>

                      <button
                        onClick={() => handleJumpToPreset(29)}
                        className={`col-span-1 py-1.5 px-2 rounded-xl border text-[10px] font-bold transition-all shadow-sm flex items-center justify-center gap-1 select-none cursor-pointer ${
                          value === 29
                            ? 'bg-blue-500 border-blue-600 text-white font-black'
                            : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        29 ➜ 30 ({language === 'ZH' ? '進位' : 'Carry'})
                      </button>

                      <button
                        onClick={() => handleJumpToPreset(30)}
                        className={`col-span-1 py-1.5 px-2 rounded-xl border text-[10px] font-bold transition-all shadow-sm flex items-center justify-center gap-1 select-none cursor-pointer ${
                          value === 30
                            ? 'bg-orange-500 border-orange-600 text-white font-black'
                            : 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-800'
                        }`}
                      >
                        <RotateCcw className="w-3 h-3" />
                        30 ➜ 29 ({language === 'ZH' ? '退位' : 'Borrow'})
                      </button>
                    </div>
                  </div>

                  {/* Interactive Manual Group Magic Wand Button (Glows when loose dots >= 10) */}
                  {physicalOnes >= 10 && !autoGroup && (
                    <motion.button
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileHover={{ scale: 1.05 }}
                      onClick={handleManualGroup}
                      className="w-full mt-1 py-2 rounded-xl bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-extrabold text-[11px] shadow-md animate-pulse flex items-center justify-center gap-1.5 select-none cursor-pointer border border-blue-400"
                    >
                      <span>🧺</span>
                      <span>
                        {language === 'ZH' ? '合十進位！' : 'Group Tens!'}
                      </span>
                      <span>✨</span>
                    </motion.button>
                  )}

                </div>
              </div>

              {/* Right Column: The Interactive Game Canvas Area */}
              <div className="col-span-1 lg:col-span-8 flex flex-col justify-center w-full min-h-[340px] lg:h-[460px] aspect-[8/5] md:aspect-[8/4.8] lg:aspect-auto">
                <MathCanvas
                  ref={canvasRef}
                  value={value}
                  step={step}
                  autoGroup={autoGroup}
                  language={language}
                  chineseDialect={chineseDialect}
                  voiceover={voiceover}
                  soundEffects={soundEffects}
                  onValueChange={setValue}
                  onPhysicalCountsChange={(tens, ones) => {
                    setPhysicalTens(tens);
                    setPhysicalOnes(ones);
                  }}
                />
              </div>

            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 gap-6"
          >
            {/* 5. Parent-Facing Configuration Panel */}
            <div className="w-full max-w-4xl mx-auto bg-white border-2 border-[#E5E1DA] rounded-[32px] p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-5 select-none">
                <Settings className="w-5 h-5 text-slate-600" />
                <h3 className="text-base md:text-lg font-bold text-slate-800">
                  {language === 'ZH' ? '家長與教師 進階教學控制板' : 'Teacher & Parent Advanced Configurations'}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Left Settings Column: Default Step selector (1-10 Dropdown) */}
                <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-between gap-3">
                  <div className="select-none">
                    <h4 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
                      <span>⚙️</span>
                      {language === 'ZH' ? '每次加減步伐大小 (Dropdown)' : 'Step Size Selector'}
                    </h4>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                      {language === 'ZH'
                        ? '可自由設定 1 至 10。設為較大步伐時，點擊一次 [+] 能在畫面中看見更具衝擊感的連續進位與閃爍效果。'
                        : 'Configure a step size of 1 to 10. Click [+] to trigger multiple consecutive ring grouping transitions.'}
                    </p>
                  </div>

                  <div className="relative">
                    <select
                      value={step}
                      onChange={(e) => {
                        const s = parseInt(e.target.value, 10) as IncrementStep;
                        setStep(s);
                        synth.setEnabled(soundEffects);
                        synth.playPop();
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm cursor-pointer"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
                        <option key={`step-opt-${s}`} value={s}>
                          {language === 'ZH' ? `每次增減：${s} 個球` : `Step size: ${s}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Middle Settings Column: Auto-Grouping Toggle */}
                <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-between gap-3">
                  <div className="select-none">
                    <h4 className="font-bold text-slate-700 text-sm flex items-center gap-1">
                      <span>🧺</span>
                      {language === 'ZH' ? '分組模式 (Grouping Mode)' : 'Grouping Mode'}
                    </h4>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                      {language === 'ZH'
                        ? '【籃子模式】提供一個大容量合十籃。可以動手拖曳球球進去，放滿 10 個時，球球會停止互斥並留在原地，湊齊 10 個瞬間合體！'
                        : '"Basket Mode" displays a magical basket. Drag loose dots into the basket where they stay still without repelling.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setAutoGroup(true);
                        synth.setEnabled(soundEffects);
                        synth.playPop();
                      }}
                      className={`py-2 rounded-xl text-xs md:text-sm font-bold transition-all border select-none cursor-pointer ${
                        autoGroup
                          ? 'bg-blue-500 border-blue-600 text-white font-black shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {language === 'ZH' ? '自動分組' : 'Auto Group'}
                    </button>
                    <button
                      onClick={() => {
                        setAutoGroup(false);
                        synth.setEnabled(soundEffects);
                        synth.playPop();
                      }}
                      className={`py-2 rounded-xl text-xs md:text-sm font-bold transition-all border select-none cursor-pointer ${
                        !autoGroup
                          ? 'bg-orange-500 border-orange-600 text-white font-black shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {language === 'ZH' ? '籃子模式' : 'Basket Mode'}
                    </button>
                  </div>
                </div>

                {/* Right Settings Column: Sound & Speech configuration */}
                <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-between gap-3">
                  <div className="select-none">
                    <h4 className="font-bold text-slate-700 text-sm flex items-center gap-1">
                      <span>🔊</span>
                      {language === 'ZH' ? '音效與語音朗讀 (Audio)' : 'Sound & Voiceover'}
                    </h4>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                      {language === 'ZH'
                        ? '數值改變時，會使用中文（廣東話 / 普通話）或英文女聲緩慢、親切地朗讀出當前總數。'
                        : 'Numbers are read out loud slowly with toddler-friendly tone as values change.'}
                    </p>
                  </div>

                  {language === 'ZH' && (
                    <div className="flex flex-col gap-1.5 select-none">
                      <label className="text-[11px] font-bold text-slate-500">中文語音種類 (Chinese Dialect)：</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => {
                            setChineseDialect('cantonese');
                            synth.setEnabled(soundEffects);
                            synth.playPop();
                          }}
                          className={`py-1.5 rounded-xl text-xs font-black border transition-all select-none cursor-pointer ${
                            chineseDialect === 'cantonese'
                              ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm'
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          香港廣東話
                        </button>
                        <button
                          onClick={() => {
                            setChineseDialect('mandarin');
                            synth.setEnabled(soundEffects);
                            synth.playPop();
                          }}
                          className={`py-1.5 rounded-xl text-xs font-black border transition-all select-none cursor-pointer ${
                            chineseDialect === 'mandarin'
                              ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm'
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          普通話
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setVoiceover(!voiceover);
                        synth.setEnabled(soundEffects);
                        synth.playPop();
                      }}
                      className={`py-2 rounded-xl text-xs md:text-sm font-bold transition-all border flex items-center justify-center gap-1.5 select-none cursor-pointer ${
                        voiceover
                          ? 'bg-blue-500 border-blue-600 text-white shadow-sm font-black'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <Volume2 className="w-4 h-4" />
                      {language === 'ZH' ? '語音讀數' : 'Speech'}
                    </button>

                    <button
                      onClick={() => {
                        setSoundEffects(!soundEffects);
                        synth.setEnabled(!soundEffects);
                        synth.playPop();
                      }}
                      className={`py-2 rounded-xl text-xs md:text-sm font-bold transition-all border flex items-center justify-center gap-1.5 select-none cursor-pointer ${
                        soundEffects
                          ? 'bg-blue-500 border-blue-600 text-white shadow-sm font-black'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <Award className="w-4 h-4" />
                      {language === 'ZH' ? '音效開關' : 'Sound FX'}
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* 6. Comprehensive Pedagogical Guide Area */}
            <GuideSection language={language} />
          </motion.div>
        )}

      </main>

      {/* 7. Footer Design Element */}
      <footer className="max-w-5xl mx-auto text-center mt-12 mb-6 select-none">
        <p className="text-xs font-semibold text-slate-400 font-sans tracking-wide">
          {language === 'ZH'
            ? '十位與個位數學探險家 • 專業幼兒啟蒙數位教材'
            : 'Tens and Ones Explorer • Gamified Early childhood Mathematics Tool'}
        </p>
      </footer>

    </div>
  );
}
