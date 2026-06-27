/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Dot, Cluster, Language, ChineseDialect, IncrementStep } from '../types';
import { synth } from '../utils/audio';

interface MathCanvasProps {
  value: number;
  step: IncrementStep;
  autoGroup: boolean;
  language: Language;
  chineseDialect: ChineseDialect;
  voiceover: boolean;
  soundEffects: boolean;
  onValueChange: (newValue: number) => void;
  onPhysicalCountsChange: (tens: number, ones: number) => void;
}

export interface MathCanvasRef {
  reset: () => void;
  triggerGroupAll: () => void;
}

// Sparkle particle interface
interface Sparkle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
}

export const MathCanvas = forwardRef<MathCanvasRef, MathCanvasProps>((props, ref) => {
  const {
    value,
    step,
    autoGroup,
    language,
    chineseDialect,
    voiceover,
    soundEffects,
    onValueChange,
    onPhysicalCountsChange,
  } = props;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keep refs of props to avoid stale closures in the animation loops
  const propsRef = useRef({
    value,
    step,
    autoGroup,
    language,
    chineseDialect,
    voiceover,
    soundEffects
  });

  // Always keep propsRef synchronized on every render
  propsRef.current = {
    value,
    step,
    autoGroup,
    language,
    chineseDialect,
    voiceover,
    soundEffects
  };

  // Core physical entities
  const dotsRef = useRef<Dot[]>([]);
  const clustersRef = useRef<Cluster[]>([]);
  const sparklesRef = useRef<Sparkle[]>([]);

  // Dragging states
  const draggedDotIdRef = useRef<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const isLassoActiveRef = useRef<boolean>(false);
  const lassoPointsRef = useRef<{ x: number; y: number }[]>([]);

  // Animation Queue and Transition states
  const visualValueRef = useRef<number>(value);
  const targetValueRef = useRef<number>(value);
  const isAnimatingQueueRef = useRef<boolean>(false);
  const queueTimerRef = useRef<number>(0);

  // Layout sizing constants
  const LOGICAL_WIDTH = 800;
  const LOGICAL_HEIGHT = 420;
  const TENS_DIVIDER_X = LOGICAL_WIDTH * 0.46;

  // Basket configurations
  const basketCenter = { x: LOGICAL_WIDTH * 0.73, y: LOGICAL_HEIGHT * 0.58 };
  const basketRadius = 85; // Enlarged from 65 to give kids more space and prevent crowding

  // Track if speech synthesis is currently active
  const lastSpokenValueRef = useRef<number>(-1);

  // CPU lag prevention: track last emitted counts to avoid re-triggering parent state on every frame
  const lastEmittedTensRef = useRef<number>(-1);
  const lastEmittedOnesRef = useRef<number>(-1);

  // Instantly populate clusters and dots for large jumps or initial state
  const instantlySyncValue = (targetVal: number) => {
    dotsRef.current = [];
    clustersRef.current = [];
    sparklesRef.current = [];

    const numTens = Math.floor(targetVal / 10);
    const numOnes = targetVal % 10;

    // Create Tens Clusters
    for (let t = 0; t < numTens; t++) {
      const clusterId = `cluster_${Date.now()}_${t}_${Math.random().toString(36).substr(2, 4)}`;
      const col = t % 3;
      const row = Math.floor(t / 3);
      const targetX = 65 + col * 115;
      const targetY = 110 + row * 115;

      const newCluster: Cluster = {
        id: clusterId,
        x: targetX,
        y: targetY,
        targetX,
        targetY,
        scale: 1.0,
        isBreaking: false,
        glowProgress: 0,
      };
      clustersRef.current.push(newCluster);

      // Create 10 dots inside this cluster
      for (let d = 0; d < 10; d++) {
        const angle = (d * 2 * Math.PI) / 10;
        const ringRadius = 35;
        dotsRef.current.push({
          id: `dot_c_${clusterId}_${d}`,
          x: targetX + Math.cos(angle) * ringRadius,
          y: targetY + Math.sin(angle) * ringRadius,
          targetX: targetX + Math.cos(angle) * ringRadius,
          targetY: targetY + Math.sin(angle) * ringRadius,
          vx: 0,
          vy: 0,
          color: '#ff7043',
          size: 13,
          state: 'grouped',
          clusterId: clusterId,
          angleOffset: angle,
          isExploding: false,
          explosionTime: 0,
          isNew: false,
        });
      }
    }

    // Create Ones Loose Dots
    for (let o = 0; o < numOnes; o++) {
      const id = `dot_${Date.now()}_${o}_${Math.random().toString(36).substr(2, 4)}`;
      // Position them on the left portion of Ones Zone
      const posX = TENS_DIVIDER_X + 90 + Math.random() * 80;
      const posY = LOGICAL_HEIGHT * 0.25 + Math.random() * (LOGICAL_HEIGHT * 0.5);

      dotsRef.current.push({
        id,
        x: posX,
        y: posY,
        targetX: posX,
        targetY: posY,
        vx: (Math.random() - 0.5) * 1.0,
        vy: (Math.random() - 0.5) * 1.0,
        color: '#ff7043',
        size: 13,
        state: 'loose',
        clusterId: null,
        angleOffset: 0,
        isExploding: false,
        explosionTime: 0,
        isNew: false,
      });
    }

    visualValueRef.current = targetVal;
    targetValueRef.current = targetVal;

    // Spawn neat burst sparkles
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2.5;
      sparklesRef.current.push({
        x: LOGICAL_WIDTH * 0.6,
        y: LOGICAL_HEIGHT * 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#4fc3f7',
        size: 3 + Math.random() * 3,
        alpha: 1,
        decay: 0.03,
      });
    }
  };

  // Expose reset and action triggers to the parent
  useImperativeHandle(ref, () => ({
    reset: () => {
      dotsRef.current = [];
      clustersRef.current = [];
      sparklesRef.current = [];
      visualValueRef.current = 0;
      targetValueRef.current = 0;
      isAnimatingQueueRef.current = false;
      lastEmittedTensRef.current = -1;
      lastEmittedOnesRef.current = -1;
      onPhysicalCountsChange(0, 0);
    },
    triggerGroupAll: () => {
      groupLooseOnesManual();
    }
  }));

  // Sync target value when prop changes
  useEffect(() => {
    if (dotsRef.current.length === 0 && clustersRef.current.length === 0 && value > 0) {
      instantlySyncValue(value);
    } else {
      const diff = Math.abs(value - visualValueRef.current);
      if (diff > 10 || visualValueRef.current === 0) {
        instantlySyncValue(value);
      } else {
        targetValueRef.current = value;
      }
    }
  }, [value]);

  // Voiceover reader
  const speak = (num: number) => {
    if (!propsRef.current.voiceover || lastSpokenValueRef.current === num) return;
    lastSpokenValueRef.current = num;

    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    let text = '';
    if (propsRef.current.language === 'ZH') {
      if (num === 0) text = '零';
      else {
        const tens = Math.floor(num / 10);
        const ones = num % 10;
        let tensText = '';
        if (tens > 1) tensText = `${tens}十`;
        else if (tens === 1) tensText = '十';

        let onesText = '';
        if (ones > 0) onesText = ones.toString();

        text = tensText + onesText;
      }
    } else {
      text = num.toString();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (propsRef.current.language === 'ZH') {
      if (propsRef.current.chineseDialect === 'cantonese') {
        utterance.lang = 'zh-HK';
        if ('speechSynthesis' in window) {
          const voices = window.speechSynthesis.getVoices();
          const hkVoice = voices.find(v => {
            const l = v.lang.toLowerCase().replace('_', '-');
            return l === 'zh-hk' || l === 'zh-yue' || v.name.toLowerCase().includes('cantonese') || v.name.toLowerCase().includes('hong kong') || v.name.toLowerCase().includes('廣東話') || v.name.toLowerCase().includes('粤语');
          });
          if (hkVoice) {
            utterance.voice = hkVoice;
          }
        }
      } else {
        utterance.lang = 'zh-TW';
        if ('speechSynthesis' in window) {
          const voices = window.speechSynthesis.getVoices();
          const twVoice = voices.find(v => {
            const l = v.lang.toLowerCase().replace('_', '-');
            return l === 'zh-tw' || l === 'zh-cn' || v.name.toLowerCase().includes('mandarin') || v.name.toLowerCase().includes('taiwan') || v.name.toLowerCase().includes('普通話') || v.name.toLowerCase().includes('国语');
          });
          if (twVoice) {
            utterance.voice = twVoice;
          }
        }
      }
    } else {
      utterance.lang = 'en-US';
    }
    utterance.rate = 0.8; // Friendly, slow rate for toddlers
    utterance.pitch = 1.25; // cute, slightly high pitched voice
    window.speechSynthesis.speak(utterance);
  };

  // Helper: check if a dot is inside the magic basket
  const isInsideBasket = (x: number, y: number) => {
    const dx = x - basketCenter.x;
    const dy = y - basketCenter.y;
    return Math.sqrt(dx * dx + dy * dy) < basketRadius;
  };

  // Manual Trigger to Group 10 loose dots from Ones Zone
  const groupLooseOnesManual = () => {
    const looseOnes = dotsRef.current.filter(d => d.state === 'loose');
    if (looseOnes.length >= 10) {
      triggerGroupAnimation(looseOnes.slice(0, 10));
    }
  };

  // Trigger carry-over clustering animation
  const triggerGroupAnimation = (dotsToGroup: Dot[]) => {
    isAnimatingQueueRef.current = true;
    synth.setEnabled(propsRef.current.soundEffects);
    synth.playDing();

    // Create a new cluster ID
    const clusterId = `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    // Determine target slot in the Tens Zone (arranged in 3 columns)
    const clusterIndex = clustersRef.current.length;
    const col = clusterIndex % 3;
    const row = Math.floor(clusterIndex / 3);
    
    // Smooth grid positions
    const targetX = 65 + col * 115;
    const targetY = 110 + row * 115;

    // Start cluster at the average position of the grouping dots to make it organic
    let avgX = 0;
    let avgY = 0;
    dotsToGroup.forEach(d => {
      avgX += d.x;
      avgY += d.y;
    });
    avgX /= dotsToGroup.length;
    avgY /= dotsToGroup.length;

    const newCluster: Cluster = {
      id: clusterId,
      x: avgX,
      y: avgY,
      targetX,
      targetY,
      scale: 0.1,
      isBreaking: false,
      glowProgress: 1.0,
    };

    clustersRef.current.push(newCluster);

    // Bind dots to this cluster
    dotsToGroup.forEach((dot, idx) => {
      dot.state = 'grouped';
      dot.clusterId = clusterId;
      dot.angleOffset = (idx * 2 * Math.PI) / 10;
      dot.vx = 0;
      dot.vy = 0;
    });

    // Spawn flashy golden sparkles around cluster center
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2;
      sparklesRef.current.push({
        x: avgX,
        y: avgY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#FFD700', // gold
        size: 3 + Math.random() * 4,
        alpha: 1,
        decay: 0.02 + Math.random() * 0.02,
      });
    }

    // Animate cluster flying to the Tens Zone
    let progress = 0;
    const animateFly = () => {
      progress += 0.04; // Fly speed
      if (progress < 1) {
        newCluster.scale = 0.1 + 0.9 * progress;
        newCluster.glowProgress = 1.0 - progress;
        requestAnimationFrame(animateFly);
      } else {
        newCluster.scale = 1.0;
        newCluster.glowProgress = 0;
        isAnimatingQueueRef.current = false; // Release lock

        // Final feedback burst
        for (let i = 0; i < 15; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1 + Math.random() * 2;
          sparklesRef.current.push({
            x: newCluster.x,
            y: newCluster.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: '#4fc3f7', // ice blue
            size: 2 + Math.random() * 3,
            alpha: 1,
            decay: 0.03 + Math.random() * 0.03,
          });
        }
      }
    };

    animateFly();
  };

  // Trigger borrowing break ring animation
  const triggerBreakAnimation = (clusterToBreak: Cluster) => {
    isAnimatingQueueRef.current = true;
    synth.setEnabled(propsRef.current.soundEffects);
    synth.playBreak();

    clusterToBreak.isBreaking = true;

    // Release dots bound to this cluster
    const clusterDots = dotsRef.current.filter(d => d.clusterId === clusterToBreak.id);

    // Explode sparkles around center
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      sparklesRef.current.push({
        x: clusterToBreak.x,
        y: clusterToBreak.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#ff7043', // sunset orange
        size: 3 + Math.random() * 4,
        alpha: 1,
        decay: 0.02 + Math.random() * 0.03,
      });
    }

    // Remove the cluster container from list immediately so it dissolves visually
    clustersRef.current = clustersRef.current.filter(c => c.id !== clusterToBreak.id);

    if (clusterDots.length > 0) {
      // 10-group de-clusters!
      // Select the first dot as the "subtracted dot" that goes left and pops
      const subtractedDot = clusterDots[0];
      const normalDots = clusterDots.slice(1);

      // Mark the subtracted dot state so it is processed, but doesn't count as part of standard loose ones
      subtractedDot.state = 'subtracted';
      subtractedDot.clusterId = null;

      const subStartX = subtractedDot.x;
      const subStartY = subtractedDot.y;
      const subTargetX = clusterToBreak.x - 120; // Move left in the Tens Zone
      const subTargetY = clusterToBreak.y + (Math.random() - 0.5) * 40;

      let subProgress = 0;
      const animateSubtracted = () => {
        subProgress += 0.04;
        if (subProgress < 1) {
          subtractedDot.x = subStartX + (subTargetX - subStartX) * subProgress;
          subtractedDot.y = subStartY + (subTargetY - subStartY) * subProgress;
          requestAnimationFrame(animateSubtracted);
        } else {
          // It reached the far left, so pop it!
          synth.setEnabled(propsRef.current.soundEffects);
          synth.playPop();

          // Spawn popped sparkles
          for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            sparklesRef.current.push({
              x: subTargetX,
              y: subTargetY,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              color: '#ff8a65',
              size: 2 + Math.random() * 3,
              alpha: 1,
              decay: 0.05 + Math.random() * 0.05,
            });
          }
          // Remove from list
          dotsRef.current = dotsRef.current.filter(d => d.id !== subtractedDot.id);
        }
      };
      animateSubtracted();

      // For the other 9 dots, make them stay briefly in the Tens Zone to see the de-cluster, then fly to the Ones Zone!
      normalDots.forEach((dot, idx) => {
        dot.state = 'transitioning';
        dot.clusterId = null;

        const startX = dot.x;
        const startY = dot.y;

        // Random target position in Ones Zone
        const targetOnesX = LOGICAL_WIDTH * 0.6 + Math.random() * (LOGICAL_WIDTH * 0.22);
        const targetOnesY = LOGICAL_HEIGHT * 0.25 + Math.random() * (LOGICAL_HEIGHT * 0.45);

        let flyProgress = 0;
        const animateNormalDot = () => {
          flyProgress += 0.035; // Around ~30 frames (500-600ms total)
          if (flyProgress < 1) {
            if (flyProgress < 0.25) {
              // First 25% of animation: wiggle slightly/hover right here in the Tens Zone!
              // This is beautiful because kids see exactly 9 orange dots left in the Tens Zone!
              dot.x = startX + (Math.random() - 0.5) * 1.5;
              dot.y = startY + (Math.random() - 0.5) * 1.5;
            } else {
              // Remaining 75%: Fly gracefully across the line into the Ones Zone!
              const ratio = (flyProgress - 0.25) / 0.75;
              // Smooth cubic interpolation
              const t = ratio * ratio * (3 - 2 * ratio);
              dot.x = startX + (targetOnesX - startX) * t;
              dot.y = startY + (targetOnesY - startY) * t;
            }
            requestAnimationFrame(animateNormalDot);
          } else {
            // Settle as a standard loose dot!
            dot.x = targetOnesX;
            dot.y = targetOnesY;
            dot.state = 'loose';
            dot.vx = (Math.random() - 0.5) * 1.0;
            dot.vy = (Math.random() - 0.5) * 1.0;
          }
        };
        animateNormalDot();
      });
    }

    // Sequential tick down updates
    visualValueRef.current -= 1;
    speak(visualValueRef.current);

    // Release queue lock after the entire sequence completes (~850ms)
    setTimeout(() => {
      isAnimatingQueueRef.current = false;
    }, 850);
  };

  // Check if there are loose dots to auto-group
  const checkAutoGroup = () => {
    if (!propsRef.current.autoGroup) return;
    if (draggedDotIdRef.current !== null) return;

    // Loose ones are dots that are 'loose'
    const looseOnes = dotsRef.current.filter(d => d.state === 'loose');
    if (looseOnes.length >= 10) {
      triggerGroupAnimation(looseOnes.slice(0, 10));
    }
  };

  // Main Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const updateAndRender = () => {
      // Safeguard: If physical representations are empty but prop value is > 0, instantly synchronize them.
      // This prevents any mounting timing race conditions where the canvas starts blank.
      if (dotsRef.current.length === 0 && clustersRef.current.length === 0 && value > 0) {
        instantlySyncValue(value);
      }

      // Clear with soft visual background
      ctx.fillStyle = '#fafafa';
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

      // Draw background themes for Zones
      // Left Zone: Tens Zone (turquoise)
      ctx.fillStyle = 'rgba(79, 195, 247, 0.04)';
      ctx.fillRect(0, 0, TENS_DIVIDER_X, LOGICAL_HEIGHT);

      // Right Zone: Ones Zone (warm yellow-orange)
      ctx.fillStyle = 'rgba(255, 112, 67, 0.04)';
      ctx.fillRect(TENS_DIVIDER_X, 0, LOGICAL_WIDTH - TENS_DIVIDER_X, LOGICAL_HEIGHT);

      // Draw Divider Line with a nice dashed divider and exchange flows
      ctx.strokeStyle = '#E5E1DA';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(TENS_DIVIDER_X, 0);
      ctx.lineTo(TENS_DIVIDER_X, LOGICAL_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // Draw exchange hints in Traditional Chinese or English
      ctx.fillStyle = 'rgba(120, 144, 156, 0.7)';
      ctx.font = 'bold 15px "Inter", sans-serif';
      ctx.textAlign = 'center';
      if (propsRef.current.language === 'ZH') {
        ctx.fillText('← 合 (十個一組)', TENS_DIVIDER_X - 75, 30);
        ctx.fillText('(拆開圓圈) 拆 →', TENS_DIVIDER_X + 75, 30);
      } else {
        ctx.fillText('← Merge (Group of 10)', TENS_DIVIDER_X - 100, 30);
        ctx.fillText('(Tap to Break) Split →', TENS_DIVIDER_X + 100, 30);
      }

      // Draw Zone Labels & Subtle Icons
      ctx.font = 'bold 22px "Inter", sans-serif';
      
      // Tens Label (Blue)
      ctx.fillStyle = '#0288d1';
      ctx.textAlign = 'left';
      ctx.fillText(propsRef.current.language === 'ZH' ? '⊞ 十位區 (組群)' : '⊞ Tens Zone (Groups)', 20, 42);

      // Ones Label (Orange)
      ctx.fillStyle = '#e64a19';
      ctx.textAlign = 'right';
      ctx.fillText(propsRef.current.language === 'ZH' ? '● 個位區 (散件)' : '● Ones Zone (Loose Dots)', LOGICAL_WIDTH - 20, 42);

      // Handle Manual Grouping Basket Mode if auto-group is off
      if (!propsRef.current.autoGroup) {
        // Draw the Magic Grouping Basket in Ones Zone
        ctx.strokeStyle = '#ffb74d';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        
        // Glow effect
        ctx.shadowColor = 'rgba(255, 183, 77, 0.3)';
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.arc(basketCenter.x, basketCenter.y, basketRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]); // Reset
        ctx.shadowBlur = 0; // Reset shadow

        // Soft filled backing for the basket
        ctx.fillStyle = 'rgba(255, 183, 77, 0.08)';
        ctx.beginPath();
        ctx.arc(basketCenter.x, basketCenter.y, basketRadius, 0, Math.PI * 2);
        ctx.fill();

        // Count dots in basket
        const dotsInBasket = dotsRef.current.filter(d => d.state === 'loose' && isInsideBasket(d.x, d.y));
        
        ctx.fillStyle = '#ff8f00';
        ctx.font = 'bold 18px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          propsRef.current.language === 'ZH' ? `合十籃 (${dotsInBasket.length}/10)` : `Basket (${dotsInBasket.length}/10)`,
          basketCenter.x,
          basketCenter.y - 14
        );

        ctx.font = 'bold 13px "Inter", sans-serif';
        ctx.fillStyle = '#ffb300';
        ctx.fillText(
          propsRef.current.language === 'ZH' ? '放10個球自動變圓圈' : 'Drop 10 here to group!',
          basketCenter.x,
          basketCenter.y + 18
        );

        // If 10 dots are in the basket, trigger grouping!
        if (dotsInBasket.length >= 10) {
          triggerGroupAnimation(dotsInBasket.slice(0, 10));
        }
      }

      // Draw Lasso Sparkle points if active
      if (isLassoActiveRef.current && lassoPointsRef.current.length > 1) {
        ctx.strokeStyle = 'rgba(255, 235, 59, 0.8)';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#fff176';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(lassoPointsRef.current[0].x, lassoPointsRef.current[0].y);
        for (let i = 1; i < lassoPointsRef.current.length; i++) {
          ctx.lineTo(lassoPointsRef.current[i].x, lassoPointsRef.current[i].y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Handle Sequential Animation Queue Updates
      // We catch up visualValueRef to targetValueRef step by step
      if (visualValueRef.current !== targetValueRef.current && !isAnimatingQueueRef.current) {
        const now = Date.now();
        if (now - queueTimerRef.current > 180) { // Sequential addition speed
          queueTimerRef.current = now;

          if (visualValueRef.current < targetValueRef.current) {
            // Push all existing loose dots leftwards when we start a fresh addition batch
            const hasNewDots = dotsRef.current.some(d => d.isNew);
            if (!hasNewDots) {
              dotsRef.current.forEach(d => {
                if (d.state === 'loose') {
                  d.isNew = false;
                  // Strong gentle push to the left part of the Ones Zone
                  d.vx = -2.5 - Math.random() * 2.5;
                  d.vy = (Math.random() - 0.5) * 1.5;
                }
              });
            }

            // Increment logic
            visualValueRef.current += 1;
            synth.setEnabled(propsRef.current.soundEffects);
            synth.playTick();

            // Spawn 1 loose dot in Ones Zone with a cute bounce-in from far right
            const startX = LOGICAL_WIDTH * 0.92;
            const startY = LOGICAL_HEIGHT * 0.5;
            const id = `dot_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
            
            dotsRef.current.push({
              id,
              x: startX,
              y: startY,
              // Target is specifically the right part of the Ones Zone to avoid overlapping initially with old dots
              targetX: LOGICAL_WIDTH * 0.72 + Math.random() * (LOGICAL_WIDTH * 0.15),
              targetY: LOGICAL_HEIGHT * 0.25 + Math.random() * (LOGICAL_HEIGHT * 0.5),
              vx: (Math.random() - 0.5) * 2,
              vy: -4 - Math.random() * 2, // shoot upwards
              color: '#ff7043', // gorgeous warm coral orange
              size: 13,
              state: 'loose',
              clusterId: null,
              angleOffset: 0,
              isExploding: false,
              explosionTime: 0,
              spawnTime: Date.now(),
              isNew: true,
            });

            // Speak current visual number
            speak(visualValueRef.current);

            // Auto group check
            checkAutoGroup();

          } else if (visualValueRef.current > targetValueRef.current) {
            // Decrement logic
            const looseOnes = dotsRef.current.filter(d => d.state === 'loose');
            
            if (looseOnes.length > 0) {
              // We have loose dots! Pop 1.
              visualValueRef.current -= 1;
              synth.setEnabled(propsRef.current.soundEffects);
              synth.playPop();

              const dotToPop = looseOnes[looseOnes.length - 1];
              
              // Trigger pop animation for this dot
              dotToPop.isExploding = true;
              dotToPop.explosionTime = Date.now();

              // Spawn bubble sparkles
              for (let i = 0; i < 8; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 1 + Math.random() * 2;
                sparklesRef.current.push({
                  x: dotToPop.x,
                  y: dotToPop.y,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  color: '#ff8a65',
                  size: 2 + Math.random() * 3,
                  alpha: 1,
                  decay: 0.05 + Math.random() * 0.05,
                });
              }

              // Speak current visual number
              speak(visualValueRef.current);

              // Clear the dot immediately from physical references
              dotsRef.current = dotsRef.current.filter(d => d.id !== dotToPop.id);

            } else if (clustersRef.current.length > 0) {
              // No loose ones, but we have Tens rings! We must BORROW!
              const lastCluster = clustersRef.current[clustersRef.current.length - 1];
              triggerBreakAnimation(lastCluster);
            }
          }
        }
      }

      // Update and Draw Tens Clusters
      clustersRef.current.forEach((cluster, index) => {
        // Smoothly update target positions of each cluster dynamically based on its index
        if (!cluster.isBreaking) {
          const col = index % 3;
          const row = Math.floor(index / 3);
          cluster.targetX = 65 + col * 115;
          cluster.targetY = 110 + row * 115;

          // Slide x and y smoothly towards target positions
          cluster.x += (cluster.targetX - cluster.x) * 0.15;
          cluster.y += (cluster.targetY - cluster.y) * 0.15;
        }

        // Draw blue container ring
        ctx.strokeStyle = 'rgba(79, 195, 247, 0.7)';
        ctx.lineWidth = 4;
        
        ctx.shadowColor = 'rgba(3, 169, 244, 0.2)';
        ctx.shadowBlur = 8;

        ctx.beginPath();
        ctx.arc(cluster.x, cluster.y, 35 * cluster.scale, 0, Math.PI * 2);
        ctx.stroke();

        ctx.shadowBlur = 0; // Reset

        // Draw soft inner ring filling
        ctx.fillStyle = 'rgba(3, 169, 244, 0.06)';
        ctx.beginPath();
        ctx.arc(cluster.x, cluster.y, 35 * cluster.scale, 0, Math.PI * 2);
        ctx.fill();

        // Draw center numeric badge "10"
        ctx.fillStyle = '#0288d1';
        ctx.font = `bold ${Math.round(20 * cluster.scale)}px "Inter", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('10', cluster.x, cluster.y);
        ctx.textBaseline = 'alphabetic'; // Reset

        // Draw flare effect if merging
        if (cluster.glowProgress > 0.01) {
          ctx.strokeStyle = `rgba(255, 215, 0, ${cluster.glowProgress})`;
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(cluster.x, cluster.y, (35 + 20 * (1 - cluster.glowProgress)) * cluster.scale, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      // Update and Draw Dots
      const currentLooseDots = dotsRef.current.filter(d => d.state === 'loose');

      // First apply soft repulsion force between all loose dots to prevent overlapping
      for (let j = 0; j < currentLooseDots.length; j++) {
        for (let k = j + 1; k < currentLooseDots.length; k++) {
          const d1 = currentLooseDots[j];
          const d2 = currentLooseDots[k];
          
          // Skip if being dragged
          if (d1.id === draggedDotIdRef.current || d2.id === draggedDotIdRef.current) continue;

          // Skip repulsion if either dot is resting inside the basket in Basket Mode to let them stay there
          if (!autoGroup && (isInsideBasket(d1.x, d1.y) || isInsideBasket(d2.x, d2.y))) continue;

          const dx = d2.x - d1.x;
          const dy = d2.y - d1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = d1.size + d2.size + 4; // Touch boundary with safe gap

          if (dist < minDist && dist > 0.1) {
            const overlap = minDist - dist;
            // Push vector
            const pushX = (dx / dist) * overlap * 0.1;
            const pushY = (dy / dist) * overlap * 0.1;

            d1.vx -= pushX;
            d1.vy -= pushY;
            d2.vx += pushX;
            d2.vy += pushY;
          }
        }
      }

      dotsRef.current.forEach((dot) => {
        // If the dot is grouped in a cluster, snap to its circular ring target
        if (dot.state === 'grouped' && dot.clusterId) {
          const cluster = clustersRef.current.find(c => c.id === dot.clusterId);
          if (cluster) {
            const angle = dot.angleOffset;
            const ringRadius = 35 * cluster.scale;
            dot.targetX = cluster.x + Math.cos(angle) * ringRadius;
            dot.targetY = cluster.y + Math.sin(angle) * ringRadius;

            // Smooth spring snap
            dot.x += (dot.targetX - dot.x) * 0.18;
            dot.y += (dot.targetY - dot.y) * 0.18;
          }
        } else if (dot.state === 'transitioning' || dot.state === 'subtracted') {
          // Transitioning or subtracted dots are managed manually by custom animation loops
        } else {
          // If loose dot
          if (dot.id === draggedDotIdRef.current) {
            // Velocity computed during dragging, handled in mousemove
          } else {
            // Apply air resistance/friction
            dot.vx *= 0.92;
            dot.vy *= 0.92;

            const inBasket = !autoGroup && isInsideBasket(dot.x, dot.y);
            if (inBasket) {
              // Settle quickly to rest inside the basket and ignore breezes
              dot.vx *= 0.4;
              dot.vy *= 0.4;
            } else {
              // Apply slight random walk breeze to make them float nicely
              dot.vx += (Math.random() - 0.5) * 0.14;
              dot.vy += (Math.random() - 0.5) * 0.14;

              // If the dot is old (not new), we gently guide its drift towards the left part of the Ones Zone!
              if (!dot.isNew && dot.state === 'loose') {
                const targetDriftX = TENS_DIVIDER_X + 90 + (dot.size * 1.5);
                dot.vx += (targetDriftX - dot.x) * 0.005;
              }
            }

            // Speed limit
            const speed = Math.sqrt(dot.vx * dot.vx + dot.vy * dot.vy);
            const maxSpeed = 1.6;
            if (speed > maxSpeed) {
              dot.vx = (dot.vx / speed) * maxSpeed;
              dot.vy = (dot.vy / speed) * maxSpeed;
            }

            dot.x += dot.vx;
            dot.y += dot.vy;

            // Soft boundaries on Ones Zone
            const margin = dot.size + 6;
            const minX = TENS_DIVIDER_X + margin;
            const maxX = LOGICAL_WIDTH - margin;
            const minY = 65 + margin;
            const maxY = LOGICAL_HEIGHT - margin;

            if (dot.x < minX) {
              dot.x = minX;
              dot.vx = -dot.vx * 0.5;
            }
            if (dot.x > maxX) {
              dot.x = maxX;
              dot.vx = -dot.vx * 0.5;
            }
            if (dot.y < minY) {
              dot.y = minY;
              dot.vy = -dot.vy * 0.5;
            }
            if (dot.y > maxY) {
              dot.y = maxY;
              dot.vy = -dot.vy * 0.5;
            }
          }
        }

        // Calculate alpha based on spawn timing for fade-in effect of new dots
        let alpha = 1.0;
        if (dot.isNew && dot.spawnTime) {
          const age = Date.now() - dot.spawnTime;
          if (age < 1200) {
            alpha = 0.4 + (0.6 * Math.min(1, Math.max(0, (age - 700) / 500)));
          } else {
            dot.isNew = false; // Finished adding
          }
        }

        ctx.save();
        ctx.globalAlpha = alpha;

        // DRAW DOT: Draw cute, highly stylized early-childhood candy dot
        ctx.shadowColor = 'rgba(230, 74, 25, 0.15)';
        ctx.shadowBlur = 6;

        ctx.fillStyle = dot.color;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0; // Reset

        // Visual gloss highlight (cute bubble effect)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(dot.x - dot.size * 0.3, dot.y - dot.size * 0.3, dot.size * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // DRAW CARTOON FACE: Two tiny eyes and a happy little smile! (Extremely cute for 4-year-olds)
        ctx.fillStyle = '#4e342e'; // warm brown for soft facial features
        
        // Eyes
        const eyeOffsetX = dot.size * 0.3;
        const eyeOffsetY = -dot.size * 0.05;
        const eyeSize = dot.size * 0.12;
        ctx.beginPath();
        ctx.arc(dot.x - eyeOffsetX, dot.y + eyeOffsetY, eyeSize, 0, Math.PI * 2);
        ctx.arc(dot.x + eyeOffsetX, dot.y + eyeOffsetY, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // Happy smiling mouth
        ctx.strokeStyle = '#4e342e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y + dot.size * 0.15, dot.size * 0.35, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();

        ctx.restore();
      });

      // Update and Draw Sparkle Particles
      sparklesRef.current.forEach((spark, index) => {
        spark.x += spark.vx;
        spark.y += spark.vy;
        spark.alpha -= spark.decay;

        if (spark.alpha <= 0) {
          sparklesRef.current.splice(index, 1);
          return;
        }

        ctx.save();
        ctx.globalAlpha = spark.alpha;
        ctx.fillStyle = spark.color;
        
        // Draw star or circle
        ctx.beginPath();
        ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Auto-group if enabled, not currently animating an action, and no dot is being dragged
      if (propsRef.current.autoGroup && !isAnimatingQueueRef.current && draggedDotIdRef.current === null) {
        checkAutoGroup();
      }

      // Synchronize the parent numeric and physical states dynamically
      // Calculate true visual physical representation count
      const looseOnesCount = dotsRef.current.filter(d => d.state === 'loose' || d.state === 'transitioning').length;
      const physicalTensCount = clustersRef.current.length;
      
      if (physicalTensCount !== lastEmittedTensRef.current || looseOnesCount !== lastEmittedOnesRef.current) {
        lastEmittedTensRef.current = physicalTensCount;
        lastEmittedOnesRef.current = looseOnesCount;
        onPhysicalCountsChange(physicalTensCount, looseOnesCount);
      }

      // Loop
      animationId = requestAnimationFrame(updateAndRender);
    };

    updateAndRender();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);


  // Touch / Mouse Event Handlers (Support both tap-breaks, dragging, and lasso grouping)
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Scale client touch/mouse coordinates strictly to logical 800x420 bounds
    const x = ((clientX - rect.left) / rect.width) * LOGICAL_WIDTH;
    const y = ((clientY - rect.top) / rect.height) * LOGICAL_HEIGHT;
    return { x, y };
  };

  const handleStart = (clientX: number, clientY: number) => {
    const { x, y } = getCanvasCoords(clientX, clientY);

    // 1. Check if we tapped a Tens cluster to break it!
    const clickedCluster = clustersRef.current.find((cluster) => {
      const dx = cluster.x - x;
      const dy = cluster.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 40; // ring tap radius
    });

    if (clickedCluster) {
      triggerBreakAnimation(clickedCluster);
      
      // Update parent value: subtract 1 instead of 10!
      // This means 1 dot is "dragged away" (popped/subtracted), and 9 dots fly into the Ones Zone.
      onValueChange(value - 1);
      return;
    }

    // 2. Check if we tapped a loose dot to drag it!
    const looseDots = dotsRef.current.filter(d => d.state === 'loose');
    const clickedDot = looseDots.find((dot) => {
      const dx = dot.x - x;
      const dy = dot.y - y;
      return Math.sqrt(dx * dx + dy * dy) < dot.size + 15; // friendly larger hit target for kids
    });

    if (clickedDot) {
      draggedDotIdRef.current = clickedDot.id;
      dragOffsetRef.current = {
        x: clickedDot.x - x,
        y: clickedDot.y - y,
      };
      
      // Clear velocities
      clickedDot.vx = 0;
      clickedDot.vy = 0;
    } else {
      // 3. Otherwise, activate magic rainbow lasso trail drawing!
      isLassoActiveRef.current = true;
      lassoPointsRef.current = [{ x, y }];
    }
  };

  const handleMove = (clientX: number, clientY: number) => {
    const { x, y } = getCanvasCoords(clientX, clientY);

    if (draggedDotIdRef.current) {
      // Dragging a loose dot
      const draggedDot = dotsRef.current.find(d => d.id === draggedDotIdRef.current);
      if (draggedDot) {
        const prevX = draggedDot.x;
        const prevY = draggedDot.y;

        draggedDot.x = x + dragOffsetRef.current.x;
        draggedDot.y = y + dragOffsetRef.current.y;

        // Keep inside bounds during dragging
        const margin = draggedDot.size;
        draggedDot.x = Math.max(margin, Math.min(LOGICAL_WIDTH - margin, draggedDot.x));
        draggedDot.y = Math.max(margin, Math.min(LOGICAL_HEIGHT - margin, draggedDot.y));

        // Smooth physical momentum on drag release
        draggedDot.vx = draggedDot.x - prevX;
        draggedDot.vy = draggedDot.y - prevY;

        // Leave cute magic trail sparkles when dragging!
        if (Math.random() < 0.25) {
          sparklesRef.current.push({
            x: draggedDot.x,
            y: draggedDot.y,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            color: '#ffd54f', // sparkles yellow
            size: 1.5 + Math.random() * 2,
            alpha: 1,
            decay: 0.04,
          });
        }
      }
    } else if (isLassoActiveRef.current) {
      // Drawing magic lasso trail
      lassoPointsRef.current.push({ x, y });

      // Spawn colorful rainbow sparkles on the lasso cursor trail
      const colors = ['#f48fb1', '#ce93d8', '#90caf9', '#80cbc4', '#ffe082'];
      const randColor = colors[Math.floor(Math.random() * colors.length)];
      sparklesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 1,
        vy: (Math.random() - 0.5) * 1,
        color: randColor,
        size: 2 + Math.random() * 3,
        alpha: 1.0,
        decay: 0.03,
      });

      if (lassoPointsRef.current.length > 30) {
        lassoPointsRef.current.shift(); // keep trail length short
      }
    }
  };

  const handleEnd = () => {
    draggedDotIdRef.current = null;
    isLassoActiveRef.current = false;
    lassoPointsRef.current = [];
  };

  return (
    <div className="relative w-full h-full bg-white rounded-[32px] overflow-hidden border-2 border-[#E5E1DA] shadow-sm touch-none">
      <canvas
        id="math-game-canvas"
        ref={canvasRef}
        width={LOGICAL_WIDTH}
        height={LOGICAL_HEIGHT}
        className="w-full h-full block cursor-crosshair select-none"
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={(e) => {
          if (e.touches.length > 0) handleStart(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchMove={(e) => {
          if (e.touches.length > 0) handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchEnd={handleEnd}
      />
    </div>
  );
});

MathCanvas.displayName = 'MathCanvas';
