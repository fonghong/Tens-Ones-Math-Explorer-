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

  // Helper to warm up and unlock iOS/Android SpeechSynthesis inside direct user interaction contexts
  const triggerSpeechWarmup = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const synthObj = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(' ');
        utterance.volume = 0.01;
        utterance.rate = 2; // speak quickly
        synthObj.speak(utterance);
        
        // Force the browser to populate voices if not already loaded
        if (typeof synthObj.getVoices === 'function') {
          synthObj.getVoices();
        }
      } catch (e) {
        console.warn('SpeechSynthesis inline warmup failed:', e);
      }
    }
  };

  // Pre-load speech synthesis voices and unlock audio on first user touch/gesture
  React.useEffect(() => {
    const unlockSpeech = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const synthObj = window.speechSynthesis;
        
        // Create an empty silent space utterance to unlock iOS/Android TTS engine (empty strings are ignored on iOS)
        try {
          const utterance = new SpeechSynthesisUtterance(' ');
          utterance.volume = 0.01;
          utterance.rate = 1;
          synthObj.speak(utterance);
        } catch (e) {
          console.warn('SpeechSynthesis warmup failed:', e);
        }

        // Force browser to load / populate voices list
        if (typeof synthObj.getVoices === 'function') {
          synthObj.getVoices();
        }
      }
      
      // Remove event listeners after first user gesture
      window.removeEventListener('click', unlockSpeech, true);
      window.removeEventListener('touchstart', unlockSpeech, true);
    };

    window.addEventListener('click', unlockSpeech, true);
    window.addEventListener('touchstart', unlockSpeech, true);

    // Warm up voices load on mount
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (typeof window.speechSynthesis.getVoices === 'function') {
        window.speechSynthesis.getVoices();
      }
      
      const handleVoicesChanged = () => {
        if (typeof window.speechSynthesis.getVoices === 'function') {
          window.speechSynthesis.getVoices();
        }
      };
      
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      return () => {
        window.removeEventListener('click', unlockSpeech, true);
        window.removeEventListener('touchstart', unlockSpeech, true);
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      };
    }

    return () => {
      window.removeEventListener('click', unlockSpeech, true);
      window.removeEventListener('touchstart', unlockSpeech, true);
    };
  }, []);

  // Handle Increments clamped to 99
  const handleIncrement = () => {
    triggerSpeechWarmup();
    synth.setEnabled(soundEffects);
    synth.playTick();
    setValue((prev) => {
      const next = Math.min(99, prev + step);
      return next;
    });
  };

  // Handle Decrements clamped to 0
  const handleDecrement = () => {
    triggerSpeechWarmup();
    synth.setEnabled(soundEffects);
    synth.playTick();
    setValue((prev) => {
      const next = Math.max(0, prev - step);
      return next;
    });
  };

  // Jump to specific mathematical presets
  const handleJumpToPreset = (presetVal: number) => {
    triggerSpeechWarmup();
    synth.setEnabled(soundEffects);
    synth.playPop();
    setValue(presetVal);
  };

  // Full reset
  const handleReset = () => {
    triggerSpeechWarmup();
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
    <div className="min-h-screen bg-[#FAF7F2] text-[#333] py-3 px-3 sm:py-6 sm:px-6 font-sans">
      
      {/* 1. Header Navigation Bar */}
      <header className="max-w-7xl lg:max-w-[1440px] xl:max-w-[1536px] w-full mx-auto flex flex-col landscape:flex-row sm:flex-row items-center justify-between gap-1.5 sm:gap-4 mb-2 sm:mb-4 bg-white border-b-2 border-[#E5E1DA] rounded-xl sm:rounded-3xl p-1.5 xs:p-2 sm:p-3 md:p-4 shadow-sm select-none">
        {/* Row 1 for Mobile / Left section for Desktop */}
        <div className="w-full landscape:w-auto sm:w-auto flex items-center justify-between landscape:justify-start sm:justify-start gap-2">
          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="bg-blue-100 p-1 rounded-lg sm:p-2.5 rounded-xl sm:rounded-2xl text-blue-600 border border-blue-200 shadow-sm animate-bounce-slow">
              <Sparkles className="w-3.5 h-3.5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-xs sm:text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                {language === 'ZH' ? '十位與個位數學探險' : 'Tens and Ones Explorer'}
              </h1>
            </div>
          </div>
          
          {/* Controls on Top-Right for Mobile Portrait only (hidden on landscape/sm) */}
          <div className="flex landscape:hidden sm:hidden items-center gap-1.5">
            <button
              onClick={() => {
                setLanguage(language === 'ENG' ? 'ZH' : 'ENG');
                synth.setEnabled(soundEffects);
                synth.playPop();
              }}
              className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[9px] font-black text-slate-700 border border-slate-200"
            >
              {language === 'ENG' ? 'ZH' : 'ENG'}
            </button>
            <button
              onClick={() => {
                setActiveTab(activeTab === 'play' ? 'guide' : 'play');
                synth.setEnabled(soundEffects);
                synth.playPop();
              }}
              className={`p-1 rounded-md border text-slate-500 hover:bg-slate-50 ${
                activeTab === 'guide' ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-white border-[#E5E1DA]'
              }`}
            >
              <Settings className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 1.5 Tab Switcher in Header */}
        <div className="bg-slate-100/80 p-0.5 rounded-lg sm:rounded-2xl flex items-center gap-1 border border-[#E5E1DA] select-none scale-95 xs:scale-100">
          <button
            id="tab-play-btn"
            onClick={() => {
              setActiveTab('play');
              synth.setEnabled(soundEffects);
              synth.playPop();
            }}
            className={`px-2 py-1 rounded-md sm:rounded-xl text-[10px] sm:text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'play'
                ? 'bg-slate-800 text-white shadow-sm font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>🎮</span>
            <span>{language === 'ZH' ? '幼兒探索' : 'Play'}</span>
          </button>
          
          <button
            id="tab-guide-btn"
            onClick={() => {
              setActiveTab('guide');
              synth.setEnabled(soundEffects);
              synth.playPop();
            }}
            className={`px-2 py-1 rounded-md sm:rounded-xl text-[10px] sm:text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-slate-800 text-white shadow-sm font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📖</span>
            <span>{language === 'ZH' ? '教學指引' : 'Guides'}</span>
          </button>
        </div>

        {/* Global Controls & Language Switcher for Desktop */}
        <div className="hidden landscape:flex sm:flex items-center gap-1.5 sm:gap-2.5">
          {/* Language pill toggle */}
          <div className="bg-slate-100 p-0.5 rounded-xl flex items-center gap-0.5 border border-[#E5E1DA]">
            <button
              onClick={() => {
                setLanguage('ENG');
                synth.setEnabled(soundEffects);
                synth.playPop();
              }}
              className={`px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all uppercase cursor-pointer ${
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
              className={`px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all uppercase cursor-pointer ${
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
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-blue-100 border-blue-200 text-blue-700 font-bold'
                : 'bg-white border-[#E5E1DA] text-slate-500 hover:bg-slate-50'
            }`}
            title="Parent Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <main className="max-w-7xl lg:max-w-[1440px] xl:max-w-[1536px] w-full mx-auto grid grid-cols-1 gap-3 sm:gap-6">

        {activeTab === 'play' ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full px-2 sm:px-4"
          >
            <div className="flex flex-col lg:grid lg:grid-cols-12 landscape:grid landscape:grid-cols-12 gap-3 sm:gap-5 items-stretch w-full">
              
              {/* Left Side (Top on Mobile): Place Value Display */}
              <div className="order-1 lg:order-none landscape:order-none lg:col-span-4 lg:col-start-1 lg:row-start-1 landscape:col-span-5 landscape:col-start-1 landscape:row-start-1 flex flex-col">
                <PlaceValueDisplay
                  value={value}
                  physicalTens={physicalTens}
                  physicalOnes={physicalOnes}
                  language={language}
                />
              </div>

              {/* Dot Zone / MathCanvas (Second on Mobile) */}
              <div className="order-2 lg:order-none landscape:order-none lg:col-span-8 lg:col-start-5 lg:row-start-1 lg:row-span-2 landscape:col-span-7 landscape:col-start-6 landscape:row-start-1 landscape:row-span-2 flex flex-col justify-center w-full h-[320px] xs:h-[380px] sm:h-[460px] md:h-[520px] lg:h-[580px] xl:h-[640px] landscape:max-sm:h-[220px] landscape:max-md:h-[280px] md:landscape:h-[520px] lg:landscape:h-[580px] xl:landscape:h-[640px] aspect-auto">
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

              {/* Control Panel (Third/Bottom on Mobile) */}
              <div className="order-3 lg:order-none landscape:order-none lg:col-span-4 lg:col-start-1 lg:row-start-2 landscape:col-span-5 landscape:col-start-1 landscape:row-start-2 flex flex-col">
                {/* Toddler-Friendly Game Controls Bar */}
                <div className="w-full bg-white border-2 border-[#E5E1DA] rounded-2xl sm:rounded-[28px] p-3 sm:p-5 shadow-sm flex flex-col items-center justify-between gap-3 sm:gap-5 select-none">
                  
                  {/* Main Action Buttons: Huge Minus & Plus side-by-side */}
                  <div className="w-full flex items-center justify-between gap-2 sm:gap-4">
                    {/* Minus Button [-] */}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDecrement}
                      disabled={value === 0}
                      className={`flex-1 h-12 xs:h-14 sm:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all group cursor-pointer ${
                        value === 0
                          ? 'bg-slate-100 border-b-2 border-slate-200 text-slate-300 cursor-not-allowed'
                          : 'bg-red-100 border-b-[5px] sm:border-b-[8px] border-red-200 active:border-b-2 active:translate-y-0.5 text-red-500'
                      }`}
                    >
                      <div className="w-5 xs:w-6 sm:w-10 h-1.5 xs:h-1.5 sm:h-2.5 bg-red-500 rounded-full group-hover:scale-110 transition-transform"></div>
                    </motion.button>

                    {/* Plus Button [+] */}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleIncrement}
                      disabled={value >= 99}
                      className={`flex-1 h-12 xs:h-14 sm:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all group cursor-pointer relative ${
                        value >= 99
                          ? 'bg-slate-100 border-b-2 border-slate-200 text-slate-300 cursor-not-allowed'
                          : 'bg-green-100 border-b-[5px] sm:border-b-[8px] border-green-200 active:border-b-2 active:translate-y-0.5 text-green-500'
                      }`}
                    >
                      <div className="relative group-hover:scale-110 transition-transform w-5 h-5 xs:w-6 xs:h-6 sm:w-10 sm:h-10 flex items-center justify-center">
                        <div className="w-5 xs:w-6 sm:w-10 h-1.5 xs:h-1.5 sm:h-2.5 bg-green-500 rounded-full"></div>
                        <div className="w-5 xs:w-6 sm:w-10 h-1.5 xs:h-1.5 sm:h-2.5 bg-green-500 rounded-full rotate-90 absolute"></div>
                      </div>
                    </motion.button>
                  </div>

                  {/* Reset to 0 and Input Setter */}
                  <div className="w-full flex items-center gap-2 xs:gap-3">
                    <button
                      onClick={handleReset}
                      className="flex-1 py-2.5 xs:py-3 sm:py-4 rounded-xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 text-amber-800 text-xs xs:text-sm sm:text-base font-black flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                      {language === 'ZH' ? '歸零' : 'Reset'}
                    </button>

                    <div className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 sm:py-4 bg-slate-50 border-2 border-slate-200 rounded-xl shadow-sm transition-colors">
                      <span className="text-xs xs:text-sm sm:text-base font-black text-slate-500">
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
                        className="w-10 xs:w-12 sm:w-18 text-center font-black text-xs xs:text-sm sm:text-base text-slate-700 bg-white border border-[#E5E1DA] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 py-0.5"
                      />
                    </div>
                  </div>

                  {/* Fast Jump Presets */}
                  <div className="w-full flex flex-col gap-1.5 sm:gap-2.5">
                    <span className="text-[10px] xs:text-xs sm:text-sm font-black text-slate-400 text-center tracking-wide">
                      {language === 'ZH' ? '學習進位與退位門檻' : 'Place Value Boundaries'}
                    </span>
                    
                    <div className="grid grid-cols-2 gap-1.5 xs:gap-2 sm:gap-3">
                      <button
                        onClick={() => handleJumpToPreset(9)}
                        className={`py-1.5 xs:py-2 sm:py-3 px-2 rounded-xl border-2 text-[10px] xs:text-xs sm:text-sm md:text-base font-bold transition-all shadow-sm cursor-pointer ${
                          value === 9
                            ? 'bg-orange-500 border-orange-600 text-white font-black'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        9 ({language === 'ZH' ? '準備' : 'Ready'})
                      </button>

                      <button
                        onClick={() => handleJumpToPreset(99)}
                        className={`py-1.5 xs:py-2 sm:py-3 px-2 rounded-xl border-2 text-[10px] xs:text-xs sm:text-sm md:text-base font-bold transition-all shadow-sm cursor-pointer ${
                          value === 99
                            ? 'bg-slate-700 border-slate-800 text-white font-black'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        99 ({language === 'ZH' ? '最大' : 'Max'})
                      </button>

                      <button
                        onClick={() => handleJumpToPreset(29)}
                        className={`col-span-1 py-1.5 xs:py-2 sm:py-3 px-2 rounded-xl border-2 text-[10px] xs:text-xs sm:text-sm md:text-base font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer ${
                          value === 29
                            ? 'bg-blue-500 border-blue-600 text-white font-black'
                            : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800'
                        }`}
                      >
                        29➜30
                      </button>

                      <button
                        onClick={() => handleJumpToPreset(30)}
                        className={`col-span-1 py-1.5 xs:py-2 sm:py-3 px-2 rounded-xl border-2 text-[10px] xs:text-xs sm:text-sm md:text-base font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer ${
                          value === 30
                            ? 'bg-orange-500 border-orange-600 text-white font-black'
                            : 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-800'
                        }`}
                      >
                        30➜29
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
                      className="w-full mt-1.5 py-2.5 xs:py-3 sm:py-4 rounded-xl bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-black text-xs xs:text-sm sm:text-base shadow-md animate-pulse flex items-center justify-center gap-2 cursor-pointer border border-blue-400"
                    >
                      <span>🧺</span>
                      <span>
                        {language === 'ZH' ? '合十進位！' : 'Group Tens!'}
                      </span>
                    </motion.button>
                  )}

                </div>
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
                      <span>🧮</span>
                      {language === 'ZH' ? '分組模式 (Grouping Mode)' : 'Grouping Mode'}
                    </h4>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                      {language === 'ZH'
                        ? '【十數格模式】提供一個 5×2 的十數格。動手拖曳球球進去時會自動磁吸對齊，放滿 10 個時，瞬間自動合十！'
                        : '"Ten Frame Mode" displays a 5×2 grid. Drag loose dots into the frame where they snap to cell centers. Fill all 10 to group!'}
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
                      {language === 'ZH' ? '十數格模式' : 'Ten Frame'}
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
      <footer className="max-w-7xl lg:max-w-[1440px] xl:max-w-[1536px] w-full mx-auto text-center mt-12 mb-6 select-none">
        <p className="text-xs font-semibold text-slate-400 font-sans tracking-wide">
          {language === 'ZH'
            ? '十位與個位數學探險家 • 專業幼兒啟蒙數位教材'
            : 'Tens and Ones Explorer • Gamified Early childhood Mathematics Tool'}
        </p>
      </footer>

    </div>
  );
}
