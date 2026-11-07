# Modern Tournament Broadcast Arena & Interactive Evaluation Graph

Upgrade the frontend interface of **W Chess** into a premier tournament broadcast experience (inspired by FIDE World Championship and Champions Chess Tour broadcasts). The upgrade introduces an interactive centipawn momentum evaluation graph showing the flow of advantage over time, refined dark arena aesthetics with emerald and brilliant teal accents, broadcast-grade player telemetry cards, and synchronized move timeline scrubbing.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following directions have been confirmed and will guide the frontend overhaul:
> - **Aesthetic Focus**: Modern Tournament Broadcast Arena with high visual polish, zero generic AI slop, and clean hairline boundaries.
> - **Visual Palette**: Dark tournament arena (`#161512` canvas, `#211f1c` surfaces, `#2b2723` cards) accented with sharp emerald (`#81b64c`) and brilliant teal (`#26c2a3`).
> - **Momentum Graph**: An interactive evaluation timeline graph plotted per move (centipawn advantage +4 to -4 and mate flags) that allows clicking directly on any move's data point to preview that board position instantly.

---

## 1. Overview & Core Concept

- **What It Does**: Transforms the chess board view from a basic bot interface into an immersive grandmaster broadcast suite. Players can see live evaluation swings in real time via an interactive SVG momentum graph, review critical turning points (inaccuracies, mistakes, blunders, and brilliant moves), and enjoy broadcast-grade presentation.
- **Target Audience**: Competitive chess players, casual learners, and viewers who want tournament-level feedback, clean board visuals, and clear move evaluation charts without visual clutter.
- **Key Value**: Immediate visual comprehension of game momentum, rapid tactical review through clickable graph nodes, and broadcast-quality typography and piece presentation.

---

## 2. User Experience & Visual Design

### A. Top Navigation Bar (Strict One-Row Contract)
- **Zone 1 (Brand)**: Single wordmark `W Chess` with a subtle geometric knight emblem and `Tournament Edition` subtitle in muted unboxed text.
- **Zone 2 (Mode Switcher)**: Clean segmented control for `vs Computer`, `Pass & Play`, and `Analysis Board` with smooth tab transitions.
- **Zone 3 (Actions)**: Quick settings trigger and full-screen / focus board toggle.

### B. Broadcast Arena Board & Player Headers
- **Player HUD Cards**:
  - Broadcast-style player banners with national/rating badges, captured pieces with net material calculation (e.g. `+3`), active move indicators, and digital countdown clocks with red low-time pulse alerts ($\le 20\text{s}$).
  - Clean hairline framing (`border border-neutral-800/80`) and subtle dark surface contrast ($<10\%$ delta) avoiding thick card shadows.
- **Board Framing**:
  - Precise coordinate labels (files `a-h`, ranks `1-8`) with optical contrast on both light and dark squares.
  - Sleek, semi-transparent best-move engine arrow with tapered arrowhead.
  - Brilliant move celebration aura with smooth `@keyframes brilliantGlow`.

### C. Interactive Centipawn Momentum Evaluation Graph
- **Real-Time Advantage Curve**:
  - Rendered beneath the move list or within the Engine tab as an interactive SVG area/line graph.
  - Horizontal baseline at 0.0 (even game); upper area shaded in White's advantage (`#e2e8f0`/emerald), lower area shaded in Black's advantage (`#262421`/dark teal).
  - Plotted points for every ply (half-move) with color-coded classification pings for Blunders (red `??`), Mistakes (orange `?`), Inaccuracies (yellow `?!`), and Brilliant moves (teal `!!`).
  - **Scrubbing & Click-to-Jump**: Hovering displays a popover card showing the move notation, centipawn score, and evaluation delta. Clicking any point jumps the board directly to that position.

### D. Typography & Zero-Pill Restraint
- **Display Face**: Clean neo-grotesque sans (`Plus Jakarta Sans` / `Outfit`) for bold tournament headings and player names.
- **Body & Move Text**: Tabular monospace numbers (`tabular-nums font-mono`) for move history, clock digits, and centipawn values.
- **Metadata**: Clean unboxed inline text with typographic separators (`·` or `/`); zero static candy pills or badge sandwiches.

---

## 3. Key Product Decisions & Trade-Offs

- **Vector SVG Momentum Graph vs Heavy Charting Libraries**:
  - *Decision*: Build a custom, zero-dependency, lightweight SVG momentum curve directly in React.
  - *Rationale*: Zero bundle overhead, instant load time, pixel-perfect theme color synchronization, and complete interactive control over hover scrubbers and click-to-jump events.
- **Integrated Sidebar vs Split Modal**:
  - *Decision*: Keep the graph embedded cleanly in the sidebar and provide a collapsible expand drawer when in analysis mode.
  - *Rationale*: Keeps the chessboard large and dominant without shifting layout geometry during gameplay.

---

## 4. Technical Architecture & Component Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Top Navigation Header                    │
│   [ W Chess ]  ───  [ vs AI | Pass & Play | Analysis ] ───  │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        ▼                                           ▼
┌───────────────────────────────┐   ┌───────────────────────────────┐
│         Board Column          │   │         Sidebar Panel         │
│ ┌───────────────────────────┐ │   │ ┌───────────────────────────┐ │
│ │ Top Player Card (Black)   │ │   │ │ Moves | Engine | Setup    │ │
│ ├───────┬───────────────────┤ │   │ ├───────────────────────────┤ │
│ │ Eval  │                   │ │   │ │ Opening Book Card         │ │
│ │ Bar   │   Chess Board     │ │   │ ├───────────────────────────┤ │
│ │       │   (8x8 Grid +     │ │   │ │ Move List Table with      │ │
│ │       │    Engine Arrow)  │ │   │ │ Standard Chess Symbols    │ │
│ ├───────┴───────────────────┤ │   │ ├───────────────────────────┤ │
│ │ Bottom Player Card (White)│ │   │ │ Momentum Evaluation Graph │ │
│ └───────────────────────────┘ │   │ │ (Interactive SVG Curve)   │ │
└───────────────────────────────┘   └───────────────────────────────┘
                                                    │
                                     [ Click plot point jumps board ]
```

### Proposed State & Component Extensions:
1. `src/components/EvalGraph.tsx`:
   - Interactive SVG evaluation curve rendering centipawn advantage from move 1 to current move.
   - Hover crosshair with tooltip displaying move number, SAN, evaluation (e.g. `+1.85`), and annotation symbol.
   - Click handler calling `onJumpToMove(moveIndex)`.
2. `src/components/PlayerBox.tsx`:
   - Enhanced tournament broadcast layout with cleaner typography, smooth clock state animations, and distinct material difference counters.
3. `src/components/Sidebar.tsx`:
   - Integration of `EvalGraph` within the Engine tab and expandable mini-momentum ribbon within the Moves tab.
4. `src/components/ChessBoard.tsx`:
   - Micro-polished square transitions, coordinates, and streamlined engine recommendation arrow.

---

## 5. Verification Plan

1. **Unit Tests**: Run `npx --yes tsx --test src/lib/chess.test.ts` to ensure engine math, opening detector, and symbol classifications remain unbroken.
2. **Interactive Momentum Graph Verification**:
   - Make consecutive moves (e.g., `1. e4 e5 2. Nf3 Nc6`) and verify the momentum curve renders new points dynamically.
   - Hover over graph points and verify evaluation tooltip appears.
   - Click on an earlier graph point and verify the board rewinds to that historical position.
3. **Tournament Broadcast Aesthetics**:
   - Inspect desktop (1440x900) layout via Playwright screenshot to verify dark arena styling, crisp hairline borders, and zero layout overflow.
   - Verify mobile viewport (390x844) responsiveness and touch target ergonomics.
