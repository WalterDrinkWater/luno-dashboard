---
name: Celestial Void
colors:
  surface: "#0b141e"
  surface-dim: "#0b141e"
  surface-bright: "#313a45"
  surface-container-lowest: "#060f18"
  surface-container-low: "#131c26"
  surface-container: "#18202a"
  surface-container-high: "#222b35"
  surface-container-highest: "#2d3540"
  on-surface: "#dae3f1"
  on-surface-variant: "#c6c6cb"
  inverse-surface: "#dae3f1"
  inverse-on-surface: "#28313c"
  outline: "#909095"
  outline-variant: "#45474b"
  surface-tint: "#c4c6ce"
  primary: "#c4c6ce"
  on-primary: "#2d3037"
  primary-container: "#1a1d23"
  on-primary-container: "#82858c"
  inverse-primary: "#5c5e65"
  secondary: "#c6c6cc"
  on-secondary: "#2f3035"
  secondary-container: "#47494e"
  on-secondary-container: "#b7b8be"
  tertiary: "#c1c7d3"
  on-tertiary: "#2b313b"
  tertiary-container: "#171d26"
  on-tertiary-container: "#7f8591"
  error: "#ffb4ab"
  on-error: "#690005"
  error-container: "#93000a"
  on-error-container: "#ffdad6"
  primary-fixed: "#e1e2ea"
  primary-fixed-dim: "#c4c6ce"
  on-primary-fixed: "#191c22"
  on-primary-fixed-variant: "#44474d"
  secondary-fixed: "#e2e2e8"
  secondary-fixed-dim: "#c6c6cc"
  on-secondary-fixed: "#1a1c20"
  on-secondary-fixed-variant: "#45474b"
  tertiary-fixed: "#dde2f0"
  tertiary-fixed-dim: "#c1c7d3"
  on-tertiary-fixed: "#161c25"
  on-tertiary-fixed-variant: "#414752"
  background: "#0b141e"
  on-background: "#dae3f1"
  surface-variant: "#2d3540"
typography:
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: "600"
    lineHeight: "1.2"
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: "600"
    lineHeight: "1.3"
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "400"
    lineHeight: "1.6"
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "400"
    lineHeight: "1.5"
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: "500"
    lineHeight: "1"
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: "600"
    lineHeight: "1.2"
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-sm: 16px
  margin-md: 32px
  margin-lg: 48px
  max-width: 1440px
---

## Brand & Style

This design system is built for high-stakes institutional trading environments where focus and clarity are paramount. The brand personality is stoic, precise, and atmospheric. It utilizes a **Minimalist** approach with subtle **Glassmorphism** to create a sense of depth without distraction.

The aesthetic is defined by "The Void"—a deep, dark canvas that recedes into the background, allowing critical financial data to occupy the foreground. The emotional response is one of calm authority and sophisticated precision. Visual interest is generated through soft, radial luminance and micro-interactions rather than vibrant color or complex geometry.

## Colors

The palette is rooted in the "Celestial Void" concept, utilizing a range of dark blues and blacks that mimic deep space.

- **Primary & Secondary:** These are reserved for deep surface layers and container backgrounds, providing a subtle tonal shift from the absolute black background.
- **Accents:** Muted, desaturated steel blues are used for interactive states and focus indicators, avoiding any high-vibrancy "neon" effects.
- **Luminance:** A soft, radial gradient (Center: `#0D121F` to Outer: `#050505`) should be applied to the primary dashboard canvas to provide a sense of atmospheric lighting.
- **Semantic Colors:** For trading data, use desaturated "Institutional Green" (#4ADE80 at 70% opacity) and "Institutional Red" (#F87171 at 70% opacity) to maintain the premium, muted aesthetic.

## Typography

The typography system balances modern elegance with technical utility.

- **Manrope** is used for headlines to provide a refined, balanced look that feels contemporary yet trustworthy.
- **Inter** serves as the workhorse for all body copy and UI elements, chosen for its exceptional legibility in data-dense interfaces.
- **JetBrains Mono** is utilized for "Label-Mono" roles, specifically for ticker symbols, price action, and timestamps, reinforcing the technical nature of the trading platform.

All text should utilize high-contrast white (#FFFFFF) for primary information and a muted silver (#8E97A4) for secondary metadata.

## Layout & Spacing

This design system employs a **Fixed Grid** model for the central trading console, centered within a fluid atmospheric void.

- **Grid:** A 12-column grid with 16px gutters is used for desktop.
- **Density:** High density is preferred. Use a 4px base unit for all padding and margins to allow for complex data arrangements without excessive scrolling.
- **Breakpoints:**
  - **Desktop (1200px+):** Full 12-column dashboard.
  - **Tablet (768px - 1199px):** 8-column layout, sidebars collapse into drawers.
  - **Mobile (Under 768px):** Single-column stack with 16px horizontal safe-margins.

## Elevation & Depth

Depth is communicated through **Tonal Layers** and **Subtle Outlines** rather than traditional shadows.

1. **Base Layer:** Absolute Black (#050505) or the central radial glow.
2. **Container Layer:** Dark Navy (#0F1115) with a 1px solid border (#1A1D23).
3. **Floating/Active Layer:** Slightly lighter surface (#1A1D23) with a soft, 0% to 10% opacity white inner-stroke to simulate a "beveled glass" edge.

Shadows, when used for modals, should be extremely large and diffused (60px blur) with 40% opacity, using a deep blue-black tint (#000000) to maintain the "Void" aesthetic.

## Shapes

The shape language is "Soft" yet disciplined. While the environment is dark and atmospheric, the UI elements remain grounded with precise corners.

- **Standard Elements:** Buttons and input fields use a 0.25rem (4px) radius.
- **Large Containers:** Dashboard widgets and cards use a 0.5rem (8px) radius.
- **Interactive Triggers:** Small toggles and chips use a 0.75rem (12px) radius to distinguish them from structural data containers.

## Components

- **Buttons:** Primary buttons use a subtle dark-to-light gradient (Bottom: #1A1D23 to Top: #2D333D) with white text. Ghost buttons use a 1px border of #2D333D.
- **Input Fields:** Darker than the container surface, utilizing a "hollow" look with a subtle 1px border. Focus state is indicated by a brightening of the border to #3E4C5F.
- **Trading Cards/Widgets:** Minimalist headers with "Label-Mono" typography. Borders are 1px and strictly limited to #1A1D23.
- **Status Chips:** Small, desaturated pills. Success: Dark green background with light green text. Danger: Dark red background with light red text.
- **Data Tables:** Zebra striping is discouraged. Use 1px horizontal dividers in #1A1D23 for row separation. High-density JetBrains Mono text for numerical data.
- **Gradients:** Only use radial "glow" gradients behind main containers to lift them off the absolute black background. No linear gradients on text or icons.
