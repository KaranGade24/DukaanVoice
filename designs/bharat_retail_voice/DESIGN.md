---
name: Bharat Retail Voice
colors:
  surface: '#f0fdf3'
  surface-dim: '#d0ddd4'
  surface-bright: '#f0fdf3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eaf7ed'
  surface-container: '#e4f1e7'
  surface-container-high: '#dfebe2'
  surface-container-highest: '#d9e6dc'
  on-surface: '#131e18'
  on-surface-variant: '#3f4940'
  inverse-surface: '#28332d'
  inverse-on-surface: '#e7f4ea'
  outline: '#6f7a6f'
  outline-variant: '#becabd'
  surface-tint: '#006d37'
  primary: '#006935'
  on-primary: '#ffffff'
  primary-container: '#168447'
  on-primary-container: '#edffec'
  inverse-primary: '#77db94'
  secondary: '#136c39'
  on-secondary: '#ffffff'
  secondary-container: '#a0f5b4'
  on-secondary-container: '#1c733f'
  tertiary: '#515d57'
  on-tertiary: '#ffffff'
  tertiary-container: '#6a766f'
  on-tertiary-container: '#f1fef4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#93f8ae'
  primary-fixed-dim: '#77db94'
  on-primary-fixed: '#00210d'
  on-primary-fixed-variant: '#005228'
  secondary-fixed: '#a0f5b4'
  secondary-fixed-dim: '#85d89a'
  on-secondary-fixed: '#00210c'
  on-secondary-fixed-variant: '#005228'
  tertiary-fixed: '#d9e6dd'
  tertiary-fixed-dim: '#bdcac1'
  on-tertiary-fixed: '#131e19'
  on-tertiary-fixed-variant: '#3e4943'
  background: '#f0fdf3'
  on-background: '#131e18'
  surface-variant: '#d9e6dc'
  surface-canvas: '#FFFFFF'
  surface-subtle: '#F7F9F7'
  surface-mint: '#F3FAF5'
  border-subtle: '#E5EAE6'
  border-primary: '#CDE8D5'
  text-primary: '#202B25'
  text-secondary: '#66736B'
  text-muted: '#96A19A'
  control-disabled: '#C9D1CB'
  status-warning: '#D97706'
  status-warning-bg: '#FFF5E5'
  status-danger: '#DC2626'
  status-danger-bg: '#FEECEC'
  status-info: '#2563EB'
  status-info-bg: '#EFF6FF'
typography:
  display:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Noto Sans
    fontSize: 15px
    fontWeight: '500'
    lineHeight: 22px
  body-md:
    fontFamily: Noto Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Noto Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-nav:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

The design system is structured for non-technical Indian retail shopkeepers, general merchants, and Kirana store owners who demand rapid, trustworthy operations in fast-paced retail environments. The visual atmosphere projects stability, extreme clarity, and warm accessibility. By blending utilitarian modern retail SaaS principles with high-contrast tactile elements, the interface removes cognitive friction and ensures that any shop action—from logging an 80kg sugar purchase to querying daily profit via vernacular voice commands—can be parsed and confirmed within seconds.

A light-only operational aesthetic reinforces openness and legibility under direct sunlight or harsh fluorescent shop lighting. Clean white and light-mint container surfaces establish a clean, hygienic digital counter. Vibrant emerald green accents signal financial vitality, precision, and forward momentum, while intentional warning ambers and critical stock rubies give shop owners immediate visual triage over inventory health without deciphering dense data sheets.

## Colors

The color palette centers around chromatic clarity and high tonal discipline, running strictly in light mode. Primary emerald `#168447` drives confirmed states, main call-to-action buttons, and the active microphone visual. Secondary deep green `#106B38` serves as the tactile active/pressed state for controls and headers requiring high contrast against light surfaces.

Tonal surface support is managed through tertiary mint `#E8F5EC` and canvas mint `#F3FAF5`, providing soft separation between cards, item rows, and summary metrics without relying on heavy borders or intrusive drop shadows. Semantic alerts rely on strict pair combinations:
- In-stock and positive balances use `#168447` on `#E8F5EC`.
- Low-stock and pending receivables use `#D97706` on `#FFF5E5`.
- Out-of-stock, critical returns, and destructive triggers use `#DC2626` on `#FEECEC`.
- System alerts and informational tags use `#2563EB` on `#EFF6FF`.

Never convey inventory status or operational success through color alone; every semantic indicator must combine color fills with explicit textual labels and iconography.

## Typography

The typographic hierarchy accommodates Latin numeric financial tables alongside Indic non-Latin scripts (Hindi, Marathi, Gujarati, Bengali, Tamil, Telugu, Kannada, Malayalam, and Punjabi). While Inter drives primary numeric data, dashboard headers, metrics, and interactive labels, Noto Sans provides reliable rendering for multilingual script conjuncts and vowel marks without glyph clipping or vertical truncation.

Key rules:
- Format Indian Rupee values with the currency symbol (₹) using uniform figure spacing (`₹45,280.00`).
- Headings must default to sentence case; uppercase styling is restricted to SKUs and tax tokens.
- All body and label text containers must allocate flexible vertical expansion (1.3x to 1.5x) to accommodate Indic language translations without line-clamp truncation.

## Layout & Spacing

Layout geometry is rooted in an 8-point baseline rhythm tailored for portrait mobile screens (defaulting to the 390 × 844 viewport, scaling down gracefully to 320px). All layout distances ensure thumb-accessible zones across daily handheld shopkeeper workflows.

Mobile layout structure:
- **Canvas Margins:** Fixed 16px (`1rem`) horizontal screen padding across list views, forms, and product grids.
- **Section Rhythm:** 24px (`1.5rem`) vertical spacing separating distinct data groupings (e.g., metric cards, sales charts, supplier lists).
- **Component Padding:** Standard card interior padding is pinned at 16px (`1rem`), with condensed list tiles adopting 12px (`0.75rem`).
- **Touch Envelopes:** All clickable controls, bottom tab navigation items, and voice trigger elements maintain a minimum hit boundary of 48 × 48px to prevent input errors on greasy or dust-exposed mobile screens.
- **Bottom Navigation Dock:** Fixed height of 64px to 72px, offset strictly above the device system navigation bar or iOS Home Indicator safe area inset.

## Elevation & Depth

Visual depth follows a low-contrast planar strategy rather than heavy blur shadows, maintaining screen clarity on budget mobile displays.

Hierarchy tiers:
- **Canvas Base (Level 0):** Pure `#FFFFFF` and `#F7F9F7` background surfaces.
- **Card Tier (Level 1):** Solid `#FFFFFF` surfaces bounded by crisp 1px borders in `#E5EAE6`. No drop shadows; cards rely on crisp border contrast and `#F3FAF5` section tinting.
- **Floating Controls & Action Buttons (Level 2):** Elevated floating triggers (such as the central microphone button or floating checkout tray) use a subtle, diffused drop shadow: `box-shadow: 0px 4px 12px rgba(22, 132, 71, 0.15)`.
- **Modals & Action Sheets (Level 3):** Modal overlays deploy a soft dark scrim (`rgba(32, 43, 37, 0.4)`) paired with `#FFFFFF` bottom sheets featuring a 1px border at their top edge and a faint ambient shadow: `box-shadow: 0px -4px 20px rgba(0, 0, 0, 0.08)`.

## Shapes

The design system maintains a balanced, tactile geometry with a standardized roundedness scale (`roundedness: 2`). This keeps functional interactive elements soft and approachable without looking playful or unprofessional:

- **Buttons & Input Fields:** 10px corner radius (`rounded-md`), establishing visual unity across form inputs, text fields, and primary execution buttons.
- **Cards & Summary Panels:** 14px corner radius (`rounded-lg`), providing soft, contained card modules in multi-column inventory grids and dashboard lists.
- **Chips & Status Badges:** 8px corner radius (`rounded-sm`), delivering compact tags that do not compete with larger card structures.
- **Bottom Sheets:** 20px top-left and top-right corner radius (`rounded-xl`), creating a distinct presentation for contextual actions and voice confirmation panels.
- **Microphone Voice Trigger:** Fully circular (50% radius / pill form), clearly signaling voice interaction as the primary differentiator of the application.

## Components

### Buttons
- **Primary Action:** Solid `#168447` fill, `#FFFFFF` text, 10px radius, 48–52px height. Active/pressed state shifts to `#106B38`. Spans full width inside bottom sheets and transaction footers.
- **Secondary Action:** `#FFFFFF` fill, 1.5px solid `#168447` border, `#168447` text, 48px height.
- **Destructive Action:** `#FEECEC` fill, `#DC2626` text and border for non-final prompts; solid `#DC2626` with `#FFFFFF` text for confirmed deletions.
- **Voice FAB:** Minimum 64 × 64px circular trigger, elevated with emerald ambient glow. Features pulsing concentric ripple rings during the active listening state.

### Input Fields & Controls
- **Form Inputs:** 48–52px height, 10px radius, `#FFFFFF` background with 1px `#E5EAE6` border. Focus state switches border to 1.5px `#168447` with no heavy outline rings.
- **Currency Inputs:** Prefixed with static `₹` symbol in `#202B25`, displaying large `title-md` or `headline-sm` numeric entry.
- **Checkboxes & Radios:** 22 × 22px touch targets with a 48px hit zone. Checked states display `#168447` with a white checkmark icon.

### Chips & Stock Status Badges
- **In Stock:** `#E8F5EC` background, `#168447` text, 8px radius, accompanied by an filled circle status dot.
- **Low Stock:** `#FFF5E5` background, `#D97706` text.
- **Out of Stock:** `#FEECEC` background, `#DC2626` text.
- **Category Filter Chips:** 36px height, 8px radius, horizontal scrolling strip. Unselected chips use `#F7F9F7` with `#66736B` text; selected chips use `#168447` with `#FFFFFF` text.

### Cards & Feed Items
- **Metric Summary Cards:** 2-column grid layout, `#FFFFFF` surface, 1px `#E5EAE6` border, 14px radius, 16px internal padding. Displays metric title (`label-sm`), prominent metric value (`headline-sm`), and change indicator pill.
- **Product Row Card:** 14px radius, horizontal orientation featuring an 64 × 64px rounded (10px) product thumbnail on the left, followed by title, SKU, current stock count, selling price, and a quick-action add/adjust button.

### Voice Confirmation Panel
A dedicated bottom sheet appearing immediately following voice input:
- Shows the transcribed vernacular voice command at the top in `#66736B`.
- Features an interpreted data preview card in `#F3FAF5` bordered with `#CDE8D5` (e.g., Action: Record Sale | Product: Sugar | Qty: 10 kg | Amount: ₹450).
- Explicit dual confirmation buttons: "Confirm (पुष्टी करा / पुष्टि करें)" in primary green and "Edit / Cancel" in neutral outline.