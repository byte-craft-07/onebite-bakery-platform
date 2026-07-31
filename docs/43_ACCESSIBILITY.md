# 43 — Accessibility & WCAG Guidelines

## 1. Contrast & Focus Standards
- **Contrast Ratio**: Minimum 4.5:1 for normal body text against background; 3:1 for large display headers (WCAG 2.1 AA Compliance).
- **Focus Rings**: High-contrast focus outline (`2px solid #E67E22; offset 2px`) visible on all interactive controls (`a`, `button`, `input`, `select`).

---

## 2. Keyboard Navigation & ARIA Rules
- **Logical Tab Order**: Skip link (`Skip to main content`) provided at top of body.
- **Modals & Drawers**: Focus trapped inside dialogs when active (`FocusTrap`); `Escape` key closes overlay and restores focus to triggering element.
- **ARIA Attributes**: `aria-expanded`, `aria-controls`, `aria-live="polite"` for cart drawers and status alerts.
- **Touch Targets**: Minimum 44x44px clickable target size on mobile devices.
