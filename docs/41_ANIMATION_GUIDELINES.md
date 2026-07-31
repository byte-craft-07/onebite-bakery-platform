# 41 — Animation & Motion Guidelines

## 1. Timing & Easing Curves

- **Fast Micro-interactions (Buttons, Badges)**: `150ms cubic-bezier(0.4, 0.0, 0.2, 1)`
- **Medium Transitions (Modals, Drawers, Cards)**: `300ms cubic-bezier(0.16, 1, 0.3, 1)` (Spring-like deceleration)
- **Page Transitions & Route Shifts**: `250ms ease-out`

---

## 2. Micro-Interactions Specification

### 2.1 Product Card Hover
- Image scales smoothly (`scale(1.05)` over 300ms).
- Shadow elevates from `shadow-card` to `shadow-hover` (`translateY(-4px)`).
- Quick Add button translates upward from opacity 0 to opacity 1.

### 2.2 Add to Cart Trigger
- Cart icon shakes subtly or scales `scale(1.2)` for 150ms.
- Cart Drawer slides in from right (`translateX(100%)` ➔ `translateX(0)`).
- Badge counter animates with a pulse pop.

### 2.3 Modal & Toast Animations
- Modals fade in backdrop (`opacity: 0` ➔ `1`) and scale content (`scale(0.95)` ➔ `scale(1)`).
- Toast messages slide up from bottom right with spring bounce.
