# Tens & Ones Math Explorer (十位與個位數學探索器)

An interactive, highly tactile, and gamified mathematical learning tool designed for young toddlers and children (ages 4+) to intuitively master the concept of the base-10 number system (**Tens/十位** and **Ones/個位**). 

This application uses smooth visual physics, micro-interactions, delightful sound synthesizers, and friendly native voiceovers to make place-value regrouping concrete and fun!

---

## 🌟 Key Features

### 1. Dual-Zone Interactive Canvas
* **Tens Zone (十位)**: Located on the left side. It holds structured circles grouped into columns of 10.
* **Ones Zone (個位)**: Located on the right side. It holds individual, loose interactive dots.
* **Seamless Dragging & Dropping**: Children can touch and drag dots freely between zones.

### 2. Playful Regrouping & Splitting Mechanics
* **Dynamic Auto-Grouping (合十)**: When 10 or more individual dots accumulate in the Ones zone, they gracefully animate, gravitate toward each other, and automatically merge into a column of 10 inside the Tens zone.
* **Tactile Splitting (拆十 / 借位)**: If a child drags or clicks on a column of 10 inside the Tens zone, the app models a **subtraction of 1** (instead of 10). It subtracts 1 dot immediately, and the remaining 9 dots playfully disperse and fly across the divider back into the Ones zone. This offers a powerful mental model for regrouping and "borrowing".

### 3. Toddler-Friendly Audio & Speech
* **Friendly Voiceovers**: Supports multi-dialect audio readouts whenever numbers change, spoken slowly and with a cute, slightly high-pitched, encouraging tone designed for young ears.
* **Language Support**:
  * **English (en-US)**
  * **Hong Kong Cantonese (香港廣東話 - zh-HK)**
  * **Mandarin (普通話 - zh-TW / zh-CN)**
* **Sound Synthesizers**: Delightful retro "pop" sound effects built natively with the Web Audio API (no external heavy sound assets needed!).

### 4. Custom Learning Settings
* **Adjustable Steps**: Increment or decrement numbers using steps from $+1$ to $+10$.
* **Toggle Auto-Grouping**: Turn automatic grouping on or off to allow manual sorting.
* **Sound & Voice Toggles**: Enable or disable background pop-effects or verbal readouts.

---

## 🛠️ Technology Stack

* **Frontend Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Build Tool**: [Vite](https://vitejs.dev/)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **Rendering Engine**: HTML5 **Canvas API** for buttery-smooth 60fps floating animations, spring-based attraction physics, dragging states, and splash effects.
* **Audio Engine**: Native **Web Audio API** (Custom Web Synthesizer) & **Web Speech Synthesis API** (for local text-to-speech).
* **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your system (v18+ recommended).

### Installation

1. Clone or download the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install the project dependencies:
   ```bash
   npm install
   ```

### Development Server

To launch the local development server with hot-reloading:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:3000` to start playing!

### Build for Production

To compile and bundle the application into optimized static assets (`dist/` directory):

```bash
npm run build
```

---

## 🎨 Visual Design Philosophy

* **Contrast & Negative Space**: Styled with a gorgeous slate-colored minimalist layout. High-contrast indicators ensure optimal accessibility and visual focus for young children.
* **Micro-Animations**: Uses gentle spring physics for moving dots, making them feel like physical objects rather than rigid grid items.
* **Tactile Feedback**: Subtle active visual rings expand around objects when they are clicked, dragged, or grouped.
