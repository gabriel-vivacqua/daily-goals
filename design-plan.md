# Design Plan — Daily Goals Tracker

## 1. Inspiration Summary

Pulling from the three references:

- **UI Design Journal (warm/dark card grid):** dark charcoal background,
  warm amber/orange accent, rounded-rectangle cards laid out in an
  asymmetric grid, bold display type over the cards.
- **"unlock the Unexpected" (tacto):** minimal off-white background,
  oversized editorial headline type, generous whitespace, small
  diagonal-arrow nav links (↘ Who We Are / What We Do), understated
  serif-free typography — feels calm and confident, not busy.
- **Sweater Weather (coffee brand):** clean black-and-white layout,
  strong grid alignment, product cards with dark backgrounds and light
  labels, simple sans-serif hierarchy, plenty of negative space between
  sections.

**Synthesized direction:** a calm, editorial, minimal light UI (like tacto
and Sweater Weather) as the primary theme, with dark charcoal cards and a
warm accent (like the UI Journal) reserved for emphasis — goal cards,
active states, and the calendar's color system. Big, confident headline
type for section titles ("Today's Goals," "Calendar"); small caps or
uppercase micro-labels for metadata (points, dates, usernames), similar to
tacto's "A / T / S" label pattern.

---

## 2. Visual Language

### Typography
- Headline font: a bold grotesk/sans (e.g. Inter, General Sans, or
  Neue Montreal) at large sizes (32–56px) for page titles — mirrors the
  oversized "unlock" and "UI DESIGN JOURNAL" wordmarks.
- Body/UI font: same family, regular weight, 14–16px.
- Micro-labels (points, dates, usernames): uppercase, letter-spaced,
  11–12px — echoes tacto's "Who We Are / What We Do" nav labels.

### Color Palette
- Background (light mode default): off-white `#F5F4F1` (tacto/Sweater Weather feel)
- Primary text: near-black `#1A1A1A`
- Card surface (dark accent cards, e.g. today's goal panel): charcoal
  `#211C19` to warm dark brown `#2B221D` gradient, echoing the UI Journal
  cards
- Accent (buttons, active states, progress fills): warm amber/terracotta
  `#D98E4A` → `#E8A868`
- Grade color system: **continuous gradient, not fixed buckets** (see §4)

### Layout
- Strong grid, generous margins, sections separated by whitespace rather
  than heavy borders (Sweater Weather / tacto).
- Cards with soft rounded corners (12–16px radius), thin 1px borders in
  low-contrast tone, similar to the UI Journal's outlined mock-up frames.
- Dashboard-style module grid on desktop; single-column stacked cards on
  mobile.

### Components
- **Goal card:** dark charcoal card, task title in bold, points value as
  a small pill top-right, checkbox row inside. For counted goals (e.g.
  "Solve LeetCode problems ×5"), render N small circular check-nodes in a
  horizontal row inside the card, each one filling with the accent color
  as it's completed — visually similar to the small square/rectangle
  accents in the UI Journal cards.
- **Progress ring/bar:** amber gradient fill showing points earned vs.
  possible for the day, shown at the top of the Daily Goals tab.
- **Calendar cell:** rounded square per day, background color driven by
  the continuous grade gradient (§4), with the numeric grade shown in
  small text on hover/tap.

---

## 3. Layout Reference Mapping

| Reference element | Applied to |
|---|---|
| tacto's oversized headline + arrow nav | Page headers ("Today's Goals ↘", "Calendar ↘") |
| tacto's News list w/ dates on the left | Activity log / recent completions list |
| UI Journal's card grid of mockup frames | Goal cards grid on the Daily Goals tab |
| UI Journal's amber accent on dark cards | Points pills, progress fills, active checkmarks |
| Sweater Weather's product card grid | "People" view — one card per user showing avatar, today's grade, mini calendar preview |
| Sweater Weather's clean footer nav | Bottom tab bar (mobile) / footer links (desktop) |

---

## 4. Calendar Grade Coloring — Continuous Gradient

Grades are **not** bucketed into fixed colors (e.g. "green if ≥90%").
Since a grade can be any float (e.g. 73.4%, 91.2%), the color must be
computed on a continuous scale so two close grades (89% vs 91%) look
visually close too, not jump between color classes.

### Approach: interpolate through a 3-stop gradient in HSL space

Define the gradient using hue rather than blending separate named colors —
this avoids muddy in-between tones:

- 0% → Hue 0 (red), `hsl(0, 70%, 50%)`
- 50% → Hue 45 (amber/orange), `hsl(45, 80%, 50%)`
- 100% → Hue 130 (green), `hsl(130, 60%, 42%)`

```js
function gradeToColor(grade) {
  // grade: float 0–100
  const g = Math.max(0, Math.min(100, grade));

  let hue, saturation, lightness;
  if (g <= 50) {
    // interpolate red (0) -> amber (45)
    const t = g / 50;
    hue = lerp(0, 45, t);
    saturation = lerp(70, 80, t);
    lightness = lerp(50, 50, t);
  } else {
    // interpolate amber (45) -> green (130)
    const t = (g - 50) / 50;
    hue = lerp(45, 130, t);
    saturation = lerp(80, 60, t);
    lightness = lerp(50, 42, t);
  }
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
```

- This makes every possible float grade (0.0–100.0) map to a unique point
  along a smooth red→amber→green ramp — no hard cutoffs, no banding.
- A day with no goals logged uses a neutral gray (`#E2E0DC`) rather than
  a position on the gradient, so "no data" is visually distinct from
  "0%."
- Calendar cell background = `gradeToColor(grade)` at reduced opacity
  (e.g. 85%) over the off-white base, with the day number in dark text on
  light grades and white text once lightness drops below ~48% (auto
  contrast check) for readability.

### Legend
Show a small horizontal gradient bar under the calendar (red → amber →
green) with "0%" and "100%" labels at each end, so users understand the
scale is continuous rather than tiered.

---

## 5. Dark Mode (optional, phase 2)

Given the UI Journal reference leans dark, offer a dark theme where the
base background becomes charcoal (`#171412`) and cards become the
off-white surface instead — an inversion of the light theme, keeping the
same amber accent and the same continuous grade-gradient logic for
calendar cells (gradient colors stay the same; only surrounding chrome
inverts).

---

## 6. Next Steps

1. Build a small style-guide page/artifact with the palette, type scale,
   goal card, and calendar cell (with the gradient function) so the look
   can be validated before wiring up real data.
2. Once approved, apply this system to the pages defined in `plan.md`
   (Daily Goals tab, Calendar view, People view).
