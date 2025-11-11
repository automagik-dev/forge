# Automagik Forge Unified Design System
**Version:** 1.0.0  
**Date:** 2025-11-11  
**Status:** Production-Ready

---

## Overview

This design system unifies the visual language across the entire Automagik Forge application (mobile AND desktop, native AND web). It is inspired by the automagik-ui proof-of-concept but refined for production use with performance, accessibility, and cross-platform compatibility as core priorities.

**Design Philosophy:**
- **Magical by Default**: Glassmorphism and subtle animations create a premium, modern feel
- **Performance First**: Optimized blur effects and animations for mobile devices
- **Universal**: Works seamlessly in native apps (Capacitor) and mobile web browsers
- **Accessible**: WCAG 2.1 AA compliant with proper contrast ratios and touch targets
- **Consistent**: Same visual language across all viewports and platforms

---

## Design Tokens

### Typography

#### Font Families

**Primary Font: Alegreya Sans**
- Usage: Headings, UI labels, buttons
- Weights: 300 (Light), 400 (Regular), 500 (Medium), 700 (Bold), 800 (ExtraBold)
- Fallback: system-ui, -apple-system, sans-serif
- CSS Variable: `--font-primary`

**Secondary Font: Manrope**
- Usage: Body text, descriptions, long-form content
- Weights: 300 (Light), 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)
- Fallback: system-ui, -apple-system, sans-serif
- CSS Variable: `--font-secondary`

**Monospace Font: Chivo Mono**
- Usage: Code blocks, terminal output, technical content
- Weights: 400 (Regular), 500 (Medium), 700 (Bold)
- Fallback: 'Courier New', monospace
- CSS Variable: `--font-mono`

#### Type Scale

**Desktop Scale:**
- xs: 12px / 0.75rem
- sm: 14px / 0.875rem
- base: 16px / 1rem
- lg: 18px / 1.125rem
- xl: 20px / 1.25rem
- 2xl: 24px / 1.5rem
- 3xl: 30px / 1.875rem
- 4xl: 36px / 2.25rem

**Mobile Scale (optimized for readability):**
- xs: 12px / 0.75rem
- sm: 14px / 0.875rem
- base: 16px / 1rem (minimum for body text)
- lg: 18px / 1.125rem
- xl: 20px / 1.25rem
- 2xl: 24px / 1.5rem

**Line Heights:**
- Tight: 1.25 (headings)
- Normal: 1.5 (body text)
- Relaxed: 1.75 (long-form content)

---

### Color System

#### Brand Colors

**Primary Magenta:**
- Hex: `#E91EFF`
- HSL: `hsl(293, 100%, 56%)`
- Usage: Primary actions, active states, brand accents
- CSS Variable: `--color-brand-magenta`

**Accent Cyan:**
- Hex: `#00D9FF`
- HSL: `hsl(189, 100%, 50%)`
- Usage: Secondary actions, highlights, interactive elements
- CSS Variable: `--color-brand-cyan`

#### Dark Theme (Primary)

**Backgrounds:**
- Primary: `#1A1625` - `hsl(277, 28%, 13%)` - Main background
- Surface: `#2A2435` - `hsl(277, 20%, 18%)` - Cards, panels
- Elevated: `#342E42` - `hsl(264, 19%, 22%)` - Elevated surfaces
- Overlay: `#252030` - `hsl(277, 23%, 16%)` - Modals, sheets

**Borders:**
- Default: `#3E3850` - `hsl(264, 17%, 28%)`
- Subtle: `rgba(255, 255, 255, 0.1)`
- Prominent: `rgba(255, 255, 255, 0.2)`

**Text:**
- Primary: `#FFFFFF` - `hsl(0, 0%, 100%)`
- Secondary: `#A8A8B8` - `hsl(240, 11%, 69%)`
- Muted: `#6E6E7E` - `hsl(240, 8%, 46%)`
- Disabled: `#4E4E5E` - `hsl(240, 9%, 34%)`

**Status Colors:**
- Success: `#00FF88` - `hsl(153, 100%, 50%)`
- Warning: `#FFD700` - `hsl(51, 100%, 50%)`
- Error: `#FF4D6A` - `hsl(349, 100%, 65%)`
- Info: `#4A9EFF` - `hsl(214, 100%, 65%)`

#### Service Colors (from automagik-ui)

- Automagik: `#14B8A6` - Teal
- Workflows: `#22C55E` - Green
- Omni: `#A855F7` - Purple
- Spark: `#F59E0B` - Orange
- Tools: `#6B7280` - Gray
- Integrations: `#3B82F6` - Blue

---

### Spacing Scale

**Base Unit:** 4px (0.25rem)

**Scale:**
- 0: 0px
- 1: 4px / 0.25rem
- 2: 8px / 0.5rem
- 3: 12px / 0.75rem
- 4: 16px / 1rem
- 5: 20px / 1.25rem
- 6: 24px / 1.5rem
- 8: 32px / 2rem
- 10: 40px / 2.5rem
- 12: 48px / 3rem
- 16: 64px / 4rem
- 20: 80px / 5rem

**Mobile-Specific:**
- Touch Target Min: 44px (iOS guideline)
- Touch Target Comfortable: 48px (Material Design)
- Safe Area Insets: `env(safe-area-inset-*)` for notches/home indicators

---

### Border Radius

**Scale:**
- none: 0px
- sm: 4px / 0.25rem
- md: 8px / 0.5rem (default)
- lg: 12px / 0.75rem
- xl: 16px / 1rem
- 2xl: 24px / 1.5rem
- full: 9999px (pills, circles)

**Usage:**
- Buttons: md (8px)
- Cards: lg (12px)
- Modals/Sheets: xl (16px)
- Pills/Badges: full

---

### Shadows & Elevation

**Shadow Scale:**

**sm:**
```css
box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
```

**md:**
```css
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
```

**lg:**
```css
box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
```

**xl:**
```css
box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
```

**Magical Glow (Magenta):**
```css
box-shadow: 0 0 15px 2px rgba(233, 30, 255, 0.3);
```

**Magical Glow (Cyan):**
```css
box-shadow: 0 0 15px 2px rgba(0, 217, 255, 0.3);
```

---

### Glassmorphism Effects

**Philosophy:** Refined glassmorphism with performance optimization for mobile devices.

#### Glass Variants

**Light Glass:**
- Backdrop Filter: `blur(4px) saturate(120%)`
- Background: `rgba(255, 255, 255, 0.08)`
- Border: `1px solid rgba(255, 255, 255, 0.1)`
- Usage: Subtle overlays, tooltips

**Medium Glass (Default):**
- Backdrop Filter: `blur(6px) saturate(140%)`
- Background: `rgba(255, 255, 255, 0.1)`
- Border: `1px solid rgba(255, 255, 255, 0.15)`
- Usage: Cards, panels, navigation

**Heavy Glass:**
- Backdrop Filter: `blur(8px) saturate(150%)`
- Background: `rgba(255, 255, 255, 0.12)`
- Border: `1px solid rgba(255, 255, 255, 0.2)`
- Usage: Modals, prominent surfaces

**Performance Notes:**
- Mobile devices: Use light/medium glass only
- During scroll: Disable blur, restore on scroll-end
- Low-end devices: Fallback to solid backgrounds with opacity

#### Magical Gradients

**Primary Gradient (Magenta → Cyan):**
```css
background: linear-gradient(135deg, 
  rgba(233, 30, 255, 0.2) 0%, 
  rgba(0, 217, 255, 0.2) 100%
);
```

**Subtle Gradient (for glass surfaces):**
```css
background: linear-gradient(135deg,
  rgba(255, 255, 255, 0.1) 0%,
  rgba(255, 255, 255, 0.05) 100%
);
```

---

### Motion & Animation

**Easing Curves:**
- Default: `cubic-bezier(0.4, 0, 0.2, 1)` - Smooth, natural
- Entrance: `cubic-bezier(0, 0, 0.2, 1)` - Deceleration
- Exit: `cubic-bezier(0.4, 0, 1, 1)` - Acceleration
- Spring: `cubic-bezier(0.34, 1.56, 0.64, 1)` - Bouncy

**Durations:**
- Instant: 100ms
- Fast: 200ms
- Normal: 300ms
- Slow: 500ms
- Slower: 700ms

**Animation Principles:**
- Prefer `transform` and `opacity` (GPU-accelerated)
- Avoid animating `box-shadow` on mobile
- Use `will-change` sparingly
- Respect `prefers-reduced-motion`

**Common Animations:**

**Hover Lift:**
```css
transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
transform: translateY(-2px);
```

**Scale:**
```css
transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
transform: scale(1.02);
```

**Glow Appear:**
```css
transition: box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1);
box-shadow: 0 0 20px rgba(233, 30, 255, 0.4);
```

---

## Component Specifications

### GlassSurface Component

**Purpose:** Reusable glassmorphic surface component for cards, panels, and overlays.

**Props:**
- `intensity`: 'light' | 'medium' | 'heavy' (default: 'medium')
- `border`: 'none' | 'subtle' | 'prominent' (default: 'subtle')
- `shadow`: 'none' | 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
- `radius`: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full' (default: 'lg')
- `hover`: boolean (default: true)
- `glow`: 'none' | 'magenta' | 'cyan' | 'both' (default: 'none')

**CSS Classes:**
- `.glass-surface` - Base class
- `.glass-light` - Light variant
- `.glass-medium` - Medium variant
- `.glass-heavy` - Heavy variant
- `.glass-hover` - Hover effects enabled
- `.glass-glow-magenta` - Magenta glow on hover
- `.glass-glow-cyan` - Cyan glow on hover

**Usage Example:**
```tsx
<GlassSurface 
  intensity="medium" 
  radius="lg" 
  hover={true}
  glow="magenta"
>
  <div className="p-6">
    Card content
  </div>
</GlassSurface>
```

---

### Mobile Components

#### BottomNavigation

**Visual Specs:**
- Height: 64px + safe-area-inset-bottom
- Background: Glass medium variant
- Active indicator: Magical gradient pill
- Touch targets: 48px minimum
- Icons: 24px with 2px stroke
- Labels: 12px, font-secondary, medium weight

**States:**
- Default: Secondary text color, no background
- Active: Primary text color, gradient pill background, magenta glow
- Hover (web): Subtle scale (1.05)
- Disabled: Muted text color, 50% opacity

**Accessibility:**
- ARIA labels on all tabs
- Active state announced
- Keyboard navigation support (web)

#### BottomSheet

**Visual Specs:**
- Background: Glass heavy variant
- Drag handle: 4px × 32px, rounded-full, muted color
- Backdrop: rgba(0, 0, 0, 0.4) with blur(4px) on high-perf devices
- Border radius: xl (16px) on top corners only
- Safe area: padding-bottom for home indicator

**Animation:**
- Drag: Spring physics with velocity tracking
- Snap: 300ms cubic-bezier(0.4, 0, 0.2, 1)
- Backdrop fade: 200ms

**Snap Points:**
- Collapsed: 25% viewport height
- Half: 50% viewport height
- Expanded: 90% viewport height

#### PersistentChatInput

**Visual Specs:**
- Height: 56px base (auto-expand to 144px max)
- Background: Glass medium variant
- Border: Prominent (rgba(255, 255, 255, 0.2))
- Border radius: xl (16px)
- Safe area: padding-bottom: max(16px, env(safe-area-inset-bottom))

**Interactive Elements:**
- Input field: font-secondary, base size (16px)
- Icon buttons: 44px touch targets, 24px icons
- Send button: Gradient background (magenta → cyan), glow on hover
- Attachment icons: Secondary color, scale on tap

---

### Desktop Components

#### Sidebar Navigation

**Visual Specs:**
- Width: 240px (collapsed: 64px)
- Background: Surface color with glass-light overlay
- Border: Subtle (rgba(255, 255, 255, 0.1))
- Items: 40px height, 8px padding, md radius

**States:**
- Default: Transparent background
- Hover: Glass-light background, lift effect
- Active: Gradient background (subtle), magenta glow
- Collapsed: Icon only, tooltip on hover

#### Task Cards

**Visual Specs:**
- Background: Glass medium variant
- Border radius: lg (12px)
- Padding: 16px
- Shadow: md (default), xl (hover)
- Drag handle: Visible on hover, muted color

**States:**
- Default: Medium glass, md shadow
- Hover: Lift (-2px), xl shadow, subtle glow
- Dragging: Heavy glass, xl shadow, magenta glow
- Selected: Prominent border, cyan glow

#### Modals

**Visual Specs:**
- Background: Glass heavy variant
- Border radius: xl (16px)
- Max width: 600px (desktop), 90vw (mobile)
- Backdrop: rgba(0, 0, 0, 0.5) with blur(6px)
- Padding: 24px (desktop), 16px (mobile)

**Animation:**
- Enter: Scale from 0.95 + fade in (300ms)
- Exit: Scale to 0.95 + fade out (200ms)
- Backdrop: Fade in/out (200ms)

---

## Implementation Guidelines

### CSS Architecture

**File Structure:**
```
frontend/src/styles/
├── index.css                 # Main entry, Tailwind imports
├── tokens.css                # Design token CSS variables
├── glass.css                 # Glassmorphism utilities
├── animations.css            # Animation utilities
└── mobile.css                # Mobile-specific utilities
```

**Naming Conventions:**
- CSS Variables: `--{category}-{property}-{variant}`
  - Example: `--color-brand-magenta`, `--spacing-touch-target`
- Utility Classes: `.{property}-{variant}`
  - Example: `.glass-medium`, `.glow-magenta`
- Component Classes: `.{component}-{element}-{modifier}`
  - Example: `.bottom-nav-item-active`

### Tailwind Configuration

**Custom Utilities:**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        primary: ['var(--font-primary)', 'system-ui', 'sans-serif'],
        secondary: ['var(--font-secondary)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'Courier New', 'monospace'],
      },
      colors: {
        brand: {
          magenta: 'var(--color-brand-magenta)',
          cyan: 'var(--color-brand-cyan)',
        },
        // ... other colors
      },
      backdropBlur: {
        'glass-light': '4px',
        'glass-medium': '6px',
        'glass-heavy': '8px',
      },
    },
  },
  plugins: [
    require('./plugins/glass-utilities'),
    require('./plugins/mobile-utilities'),
  ],
}
```

### Performance Optimization

**Mobile Devices:**
1. Detect device capabilities on load
2. Reduce blur intensity on mid/low-tier devices
3. Disable blur during scroll (restore on scroll-end)
4. Use `will-change` only during animations
5. Prefer `transform` and `opacity` for animations

**Device Detection:**
```typescript
const getDeviceTier = (): 'high' | 'mid' | 'low' => {
  const memory = (navigator as any).deviceMemory;
  const cores = navigator.hardwareConcurrency;
  
  if (memory >= 8 && cores >= 8) return 'high';
  if (memory >= 4 && cores >= 4) return 'mid';
  return 'low';
};
```

**Blur Degradation:**
```typescript
const getBlurIntensity = (tier: DeviceTier, variant: GlassVariant) => {
  const baseBlur = { light: 4, medium: 6, heavy: 8 };
  const multiplier = { high: 1, mid: 0.75, low: 0 };
  return baseBlur[variant] * multiplier[tier];
};
```

### Accessibility

**Contrast Ratios:**
- Text on background: Minimum 4.5:1 (WCAG AA)
- Large text (18px+): Minimum 3:1
- Interactive elements: Minimum 3:1

**Touch Targets:**
- Minimum: 44px × 44px (iOS guideline)
- Comfortable: 48px × 48px (Material Design)
- Spacing between targets: 8px minimum

**Keyboard Navigation:**
- All interactive elements focusable
- Focus indicators: 2px solid magenta outline with 2px offset
- Skip links for main content
- Logical tab order

**Screen Readers:**
- ARIA labels on all icons
- ARIA live regions for dynamic content
- Semantic HTML (nav, main, article, etc.)
- Alt text for images

**Reduced Motion:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Migration Strategy

### Phase 1: Foundation (Week 1)
1. Add font imports (Alegreya Sans, Manrope)
2. Create design token CSS variables
3. Implement glassmorphism utilities
4. Create GlassSurface component
5. Update Tailwind configuration

### Phase 2: Mobile Components (Week 2)
1. Apply glass effects to BottomNavigation
2. Apply glass effects to BottomSheet
3. Update PersistentChatInput styling
4. Add magical gradient animations
5. Test on mobile devices (native + web)

### Phase 3: Desktop Components (Week 2-3)
1. Update sidebar navigation
2. Update task cards
3. Update modals and dialogs
4. Update panels and surfaces
5. Ensure consistency across all components

### Phase 4: Polish & Optimization (Week 3)
1. Performance testing on device matrix
2. Accessibility audit and fixes
3. Cross-browser testing
4. Documentation and Storybook examples
5. Final QA and deployment

---

## Testing Checklist

### Visual Consistency
- [ ] All components use design tokens
- [ ] Typography is consistent (Alegreya/Manrope)
- [ ] Colors match brand palette
- [ ] Spacing follows scale
- [ ] Border radius is consistent

### Performance
- [ ] Blur effects perform well on mid-tier Android
- [ ] Animations run at 60fps
- [ ] No jank during scroll
- [ ] Graceful degradation on low-end devices
- [ ] Bundle size impact < 50KB

### Accessibility
- [ ] Contrast ratios meet WCAG AA
- [ ] Touch targets ≥ 44px
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Reduced motion respected

### Cross-Platform
- [ ] Works in Capacitor native apps
- [ ] Works in mobile web browsers
- [ ] Works on iOS Safari
- [ ] Works on Android Chrome
- [ ] Works on desktop browsers

### Responsive
- [ ] Mobile (320px - 767px)
- [ ] Tablet (768px - 1023px)
- [ ] Desktop (1024px+)
- [ ] Safe area insets handled
- [ ] Orientation changes handled

---

## Resources

**Design Files:**
- Figma: [Link to be added]
- Storybook: [Link to be added]

**References:**
- automagik-ui POC: `/home/ubuntu/repos/automagik-ui`
- Mobile research: `.genie/wishes/mobile-native-app/research/`
- Component inventory: `.genie/wishes/mobile-native-app/research/forge-frontend-complete-inventory.md`

**External Resources:**
- [Glassmorphism CSS Generator](https://hype4.academy/tools/glassmorphism-generator)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design 3](https://m3.material.io/)

---

**Document Version:** 1.0.0  
**Last Updated:** 2025-11-11  
**Maintained By:** Automagik Forge Team
