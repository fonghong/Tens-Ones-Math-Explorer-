/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'ENG' | 'ZH';

export type ChineseDialect = 'cantonese' | 'mandarin';

export type IncrementStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface Dot {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  state: 'loose' | 'grouped' | 'transitioning' | 'subtracted';
  clusterId: string | null;
  angleOffset: number; // For circular ring layout
  isExploding: boolean;
  explosionTime: number; // for particle decay
  spawnTime?: number;    // Timestamp when the dot was created
  isNew?: boolean;       // Flag if this dot is recently added
  snappedCellIndex?: number | null; // For school ten frame snapping
}

export interface Cluster {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  scale: number; // For pulsing / scale-in animation
  isBreaking: boolean;
  glowProgress: number; // For magnetic merging flare effect
}

export interface GameSettings {
  language: Language;
  step: IncrementStep;
  autoGroup: boolean; // Auto group loose ones when they reach >= 10
  voiceover: boolean; // Text-to-speech toggle
  soundEffects: boolean; // Web Audio synth toggle
}
