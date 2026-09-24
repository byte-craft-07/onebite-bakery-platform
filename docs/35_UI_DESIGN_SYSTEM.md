# 35 — UI Design System

## 1. Purpose & Brand Identity

The **Onebite Bakery Platform** design system establishes a warm, artisanal, yet modern and high-converting visual identity. It bridges the sensory delight of freshly baked cakes, pastries, and artisanal breads with a seamless, luxury digital shopping experience.

---

## 2. Color Palette & Dark Mode Strategy

### 2.1 Primary Brand Colors
- **Warm Vanilla / Crème (Background)**: `#FFFBF5`
- **Artisanal Caramel / Amber (Primary Action)**: `#E67E22` (Hover: `#D35400`)
- **Deep Espresso / Dark Roast (Primary Text)**: `#2C1E16`
- **Rose Gold / Berry Accent (Secondary Accent)**: `#C0392B`
- **Pistachio Green (Success & Availability)**: `#27AE60`

### 2.2 Neutral & Surface Colors
- **Surface Card**: `#FFFFFF`
- **Surface Muted**: `#F9F6F0`
- **Border Default**: `#E8E2D9`
- **Text Secondary**: `#6E5D4F`
- **Text Muted**: `#9C8C7E`

### 2.3 Dark Mode Strategy (Future)
- Neutral inversion mapping: Background `#120E0B`, Surface `#1E1713`, Surface Muted `#281F1A`, Primary Text `#F9F6F0`.

---

## 3. Typography Hierarchy

- **Display & Headings**: *Outfit* or *Playfair Display* (Serif / Premium Warm Display)
- **Body & Controls**: *Inter* or *Plus Jakarta Sans* (Clean, legible Sans-Serif)

| Level | Size | Weight | Line Height | Tracking |
|---|---|---|---|---|
| Hero Display | 48px / 3.0rem | 700 (Bold) | 1.15 | -0.02em |
| Heading 1 (H1) | 36px / 2.25rem | 700 (Bold) | 1.2 | -0.01em |
| Heading 2 (H2) | 28px / 1.75rem | 600 (SemiBold) | 1.25 | 0em |
| Heading 3 (H3) | 22px / 1.375rem | 600 (SemiBold) | 1.3 | 0em |
| Body Large | 18px / 1.125rem | 400 / 500 | 1.5 | 0em |
| Body Base | 16px / 1.0rem | 400 (Regular) | 1.5 | 0em |
| Small / Label | 14px / 0.875rem | 500 (Medium) | 1.4 | 0.01em |
| Micro / Badge | 12px / 0.75rem | 600 (SemiBold) | 1.3 | 0.02em |

---

## 4. Spacing Scale & Elevation

### Spacing Token Scale
- `2xs`: 4px
- `xs`: 8px
- `sm`: 12px
- `md`: 16px
- `lg`: 24px
- `xl`: 32px
- `2xl`: 48px
- `3xl`: 64px

### Elevation & Glassmorphism
- **Shadow Subtly**: `0 2px 8px rgba(44, 30, 22, 0.05)`
- **Shadow Card**: `0 4px 16px rgba(44, 30, 22, 0.08)`
- **Shadow Hover**: `0 12px 32px rgba(44, 30, 22, 0.12)`
- **Glass Panel**: `backdrop-filter: blur(12px); background: rgba(255, 251, 245, 0.85); border: 1px solid rgba(232, 226, 217, 0.6);`

---

## 5. Iconography & Imagery Rules

- **Icon Set**: Lucide Icons or Heroicons (Outline style, 2px stroke width).
- **Photography Rules**: Warm ambient lighting, high contrast food styling, natural crumbs and frosting textures. No generic stock placeholders.
