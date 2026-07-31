# 40 — Responsive System Specification

## 1. Breakpoint Grid

| Device Class | Breakpoint | Container Width | Columns | Gutter |
|---|---|---|---|---|
| Mobile (Portrait) | `< 640px` (`sm`) | 100% (-32px padding) | 4 | 16px |
| Tablet / Small Screen | `640px - 767px` | 600px | 8 | 20px |
| Laptop / Medium | `768px - 1023px` (`md`) | 720px / 960px | 12 | 24px |
| Desktop / Large | `1024px - 1279px` (`lg`) | 1140px | 12 | 24px |
| Ultra-wide | `>= 1280px` (`xl`) | 1280px / 1440px | 12 | 32px |

---

## 2. Layout Patterns
- **Navigation**: Full horizontal navbar on Desktop (`lg`); Off-canvas slide drawer menu and bottom navigation bar on Mobile (`sm`).
- **Product Grid**: 1 column on Mobile (`xs`), 2 columns on Mobile Large (`sm`), 3 columns on Tablet (`md`), 4 columns on Desktop (`lg`).
- **Checkout Layout**: 2-column split (Form Left, Summary Right) on Desktop; Single stacked column (Summary Sticky Top) on Mobile.
