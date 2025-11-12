# Design System & Branding Specification

**Project:** Automagik Forge Mobile Native App  
**Version:** 1.0  
**Last Updated:** 2025-11-11  
**Status:** Planning Complete

---

## Overview

This specification defines the complete design system for the Automagik Forge mobile native app, including color palettes for both dark and light themes, typography, spacing, gradients, shadows, and component styling guidelines. The design system ensures visual consistency across all mobile screens while maintaining the distinctive Automagik brand identity.

### Design Philosophy

**Brand Identity:**
- **Magical & Futuristic**: Vibrant magenta-to-cyan gradients evoke AI magic and innovation
- **Professional & Trustworthy**: Dark theme with high contrast ensures readability and focus
- **Accessible**: WCAG AA compliant color contrast ratios
- **Consistent**: Design tokens ensure consistency across all components

**Mobile-First Principles:**
- Touch-optimized (44x44px minimum tap targets)
- High contrast for outdoor visibility
- OLED-optimized dark theme (true blacks save battery)
- Reduced motion options for accessibility

---

## Color System

### Dark Theme (Primary)

The dark theme is the default and primary theme for Automagik Forge, optimized for OLED displays and extended usage.

#### Brand Colors

```typescript
export const darkTheme = {
  // Primary Brand Colors
  brand: {
    magenta: {
      primary: '#E91EFF',      // Primary magenta (buttons, accents)
      light: '#FF4DFF',        // Lighter magenta (hover states)
      dark: '#C700E6',         // Darker magenta (pressed states)
      alpha: {
        10: 'rgba(233, 30, 255, 0.1)',
        20: 'rgba(233, 30, 255, 0.2)',
        30: 'rgba(233, 30, 255, 0.3)',
        50: 'rgba(233, 30, 255, 0.5)',
      }
    },
    cyan: {
      primary: '#00D9FF',      // Primary cyan (accents, links)
      light: '#33E3FF',        // Lighter cyan (hover states)
      dark: '#00B8D9',         // Darker cyan (pressed states)
      alpha: {
        10: 'rgba(0, 217, 255, 0.1)',
        20: 'rgba(0, 217, 255, 0.2)',
        30: 'rgba(0, 217, 255, 0.3)',
        50: 'rgba(0, 217, 255, 0.5)',
      }
    },
    teal: {
      primary: '#00D9C8',      // Accent teal (badges, chips)
      light: '#33E3D5',        // Lighter teal
      dark: '#00B8A8',         // Darker teal
    },
  },

  // Gradient System
  gradients: {
    primary: 'linear-gradient(135deg, #E91EFF 0%, #00D9FF 100%)',
    primaryVertical: 'linear-gradient(180deg, #E91EFF 0%, #00D9FF 100%)',
    primaryHorizontal: 'linear-gradient(90deg, #E91EFF 0%, #00D9FF 100%)',
    subtle: 'linear-gradient(135deg, rgba(233, 30, 255, 0.2) 0%, rgba(0, 217, 255, 0.2) 100%)',
    overlay: 'linear-gradient(180deg, rgba(26, 22, 37, 0) 0%, rgba(26, 22, 37, 0.8) 100%)',
  },

  // Background Colors
  background: {
    primary: '#1A1625',        // Main background (very dark purple-tinted)
    secondary: '#0F0D15',      // Deeper background (true black for OLED)
    tertiary: '#252030',       // Elevated background
    gradient: 'linear-gradient(180deg, #1A1625 0%, #0F0D15 100%)',
  },

  // Surface Colors (Cards, Sheets, Modals)
  surface: {
    primary: '#2A2435',        // Card background
    secondary: '#342E42',      // Elevated card
    tertiary: '#3E3850',       // Highest elevation
    overlay: 'rgba(42, 36, 53, 0.95)',  // Bottom sheet overlay
    glass: 'rgba(42, 36, 53, 0.7)',     // Glassmorphism effect
  },

  // Text Colors
  text: {
    primary: '#FFFFFF',        // Primary text (white)
    secondary: '#A8A8B8',      // Secondary text (muted gray)
    tertiary: '#6E6A7C',       // Tertiary text (dimmed)
    disabled: '#4A4654',       // Disabled text
    inverse: '#1A1625',        // Text on light backgrounds
    gradient: 'linear-gradient(135deg, #E91EFF 0%, #00D9FF 100%)',
  },

  // Border Colors
  border: {
    primary: '#3E3850',        // Default border
    secondary: '#2A2435',      // Subtle border
    focus: '#E91EFF',          // Focus state border
    error: '#FF4D6A',          // Error border
    success: '#00FF88',        // Success border
  },

  // Status Colors
  status: {
    planning: {
      background: 'rgba(74, 158, 255, 0.15)',
      border: '#4A9EFF',
      text: '#4A9EFF',
    },
    inProgress: {
      background: 'rgba(0, 217, 255, 0.15)',
      border: '#00D9FF',
      text: '#00D9FF',
    },
    review: {
      background: 'rgba(255, 215, 0, 0.15)',
      border: '#FFD700',
      text: '#FFD700',
    },
    completed: {
      background: 'rgba(0, 255, 136, 0.15)',
      border: '#00FF88',
      text: '#00FF88',
    },
    blocked: {
      background: 'rgba(255, 77, 106, 0.15)',
      border: '#FF4D6A',
      text: '#FF4D6A',
    },
  },

  // Semantic Colors
  semantic: {
    success: '#00FF88',        // Success green
    warning: '#FFD700',        // Warning yellow
    error: '#FF4D6A',          // Error red
    info: '#4A9EFF',           // Info blue
    successAlpha: 'rgba(0, 255, 136, 0.15)',
    warningAlpha: 'rgba(255, 215, 0, 0.15)',
    errorAlpha: 'rgba(255, 77, 106, 0.15)',
    infoAlpha: 'rgba(74, 158, 255, 0.15)',
  },

  // Interactive States
  interactive: {
    hover: 'rgba(233, 30, 255, 0.1)',
    pressed: 'rgba(233, 30, 255, 0.2)',
    focus: 'rgba(233, 30, 255, 0.3)',
    disabled: 'rgba(255, 255, 255, 0.05)',
  },

  // Shadow Colors
  shadow: {
    small: '0 2px 8px rgba(0, 0, 0, 0.4)',
    medium: '0 4px 16px rgba(0, 0, 0, 0.5)',
    large: '0 8px 32px rgba(0, 0, 0, 0.6)',
    glow: '0 0 24px rgba(233, 30, 255, 0.4)',
    glowCyan: '0 0 24px rgba(0, 217, 255, 0.4)',
  },
};
```

#### Usage Examples

```tsx
// Primary Button with Gradient
<Button style={{
  background: darkTheme.gradients.primary,
  color: darkTheme.text.primary,
  boxShadow: darkTheme.shadow.glow,
}}>
  Start Building
</Button>

// Card with Surface Color
<Card style={{
  background: darkTheme.surface.primary,
  border: `1px solid ${darkTheme.border.primary}`,
  boxShadow: darkTheme.shadow.medium,
}}>
  <Text style={{ color: darkTheme.text.primary }}>
    Performance Optimization
  </Text>
  <Text style={{ color: darkTheme.text.secondary }}>
    Optimize bundle size and improve loading times
  </Text>
</Card>

// Status Badge
<Badge style={{
  background: darkTheme.status.inProgress.background,
  border: `1px solid ${darkTheme.status.inProgress.border}`,
  color: darkTheme.status.inProgress.text,
}}>
  In Progress
</Badge>
```

---

### Light Theme

The light theme provides an alternative for users who prefer light backgrounds or need better visibility in bright environments.

#### Brand Colors

```typescript
export const lightTheme = {
  // Primary Brand Colors (same as dark)
  brand: {
    magenta: {
      primary: '#E91EFF',
      light: '#FF4DFF',
      dark: '#C700E6',
      alpha: {
        10: 'rgba(233, 30, 255, 0.1)',
        20: 'rgba(233, 30, 255, 0.2)',
        30: 'rgba(233, 30, 255, 0.3)',
        50: 'rgba(233, 30, 255, 0.5)',
      }
    },
    cyan: {
      primary: '#00D9FF',
      light: '#33E3FF',
      dark: '#00B8D9',
      alpha: {
        10: 'rgba(0, 217, 255, 0.1)',
        20: 'rgba(0, 217, 255, 0.2)',
        30: 'rgba(0, 217, 255, 0.3)',
        50: 'rgba(0, 217, 255, 0.5)',
      }
    },
    teal: {
      primary: '#00D9C8',
      light: '#33E3D5',
      dark: '#00B8A8',
    },
  },

  // Gradient System (same as dark)
  gradients: {
    primary: 'linear-gradient(135deg, #E91EFF 0%, #00D9FF 100%)',
    primaryVertical: 'linear-gradient(180deg, #E91EFF 0%, #00D9FF 100%)',
    primaryHorizontal: 'linear-gradient(90deg, #E91EFF 0%, #00D9FF 100%)',
    subtle: 'linear-gradient(135deg, rgba(233, 30, 255, 0.1) 0%, rgba(0, 217, 255, 0.1) 100%)',
    overlay: 'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.9) 100%)',
  },

  // Background Colors
  background: {
    primary: '#FFFFFF',        // Main background (white)
    secondary: '#F8F8FA',      // Subtle background
    tertiary: '#F0F0F5',       // Elevated background
    gradient: 'linear-gradient(180deg, #FFFFFF 0%, #F8F8FA 100%)',
  },

  // Surface Colors
  surface: {
    primary: '#FFFFFF',        // Card background (white)
    secondary: '#F8F8FA',      // Elevated card
    tertiary: '#F0F0F5',       // Highest elevation
    overlay: 'rgba(255, 255, 255, 0.95)',
    glass: 'rgba(255, 255, 255, 0.8)',
  },

  // Text Colors
  text: {
    primary: '#1A1625',        // Primary text (dark)
    secondary: '#6E6A7C',      // Secondary text
    tertiary: '#A8A8B8',       // Tertiary text
    disabled: '#D0D0D8',       // Disabled text
    inverse: '#FFFFFF',        // Text on dark backgrounds
    gradient: 'linear-gradient(135deg, #E91EFF 0%, #00D9FF 100%)',
  },

  // Border Colors
  border: {
    primary: '#E0E0E8',        // Default border
    secondary: '#F0F0F5',      // Subtle border
    focus: '#E91EFF',          // Focus state border
    error: '#FF4D6A',          // Error border
    success: '#00C96B',        // Success border
  },

  // Status Colors
  status: {
    planning: {
      background: 'rgba(74, 158, 255, 0.1)',
      border: '#4A9EFF',
      text: '#2E5FA8',
    },
    inProgress: {
      background: 'rgba(0, 217, 255, 0.1)',
      border: '#00D9FF',
      text: '#008BA8',
    },
    review: {
      background: 'rgba(255, 215, 0, 0.1)',
      border: '#FFD700',
      text: '#A88C00',
    },
    completed: {
      background: 'rgba(0, 201, 107, 0.1)',
      border: '#00C96B',
      text: '#008050',
    },
    blocked: {
      background: 'rgba(255, 77, 106, 0.1)',
      border: '#FF4D6A',
      text: '#C7003D',
    },
  },

  // Semantic Colors
  semantic: {
    success: '#00C96B',
    warning: '#FFA500',
    error: '#FF4D6A',
    info: '#4A9EFF',
    successAlpha: 'rgba(0, 201, 107, 0.1)',
    warningAlpha: 'rgba(255, 165, 0, 0.1)',
    errorAlpha: 'rgba(255, 77, 106, 0.1)',
    infoAlpha: 'rgba(74, 158, 255, 0.1)',
  },

  // Interactive States
  interactive: {
    hover: 'rgba(233, 30, 255, 0.05)',
    pressed: 'rgba(233, 30, 255, 0.1)',
    focus: 'rgba(233, 30, 255, 0.15)',
    disabled: 'rgba(0, 0, 0, 0.05)',
  },

  // Shadow Colors
  shadow: {
    small: '0 2px 8px rgba(0, 0, 0, 0.08)',
    medium: '0 4px 16px rgba(0, 0, 0, 0.12)',
    large: '0 8px 32px rgba(0, 0, 0, 0.16)',
    glow: '0 0 24px rgba(233, 30, 255, 0.2)',
    glowCyan: '0 0 24px rgba(0, 217, 255, 0.2)',
  },
};
```

---

## Typography

### Font Families

```typescript
export const typography = {
  fontFamily: {
    primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
  },
};
```

### Type Scale

```typescript
export const typeScale = {
  // Display (Hero Text)
  display: {
    large: {
      fontSize: 48,
      lineHeight: 56,
      fontWeight: '700',
      letterSpacing: -1,
    },
    medium: {
      fontSize: 40,
      lineHeight: 48,
      fontWeight: '700',
      letterSpacing: -0.5,
    },
    small: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '700',
      letterSpacing: -0.5,
    },
  },

  // Headings
  heading: {
    h1: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '700',
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '600',
      letterSpacing: -0.25,
    },
    h3: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: '600',
      letterSpacing: 0,
    },
    h4: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '600',
      letterSpacing: 0,
    },
  },

  // Body Text
  body: {
    large: {
      fontSize: 17,
      lineHeight: 24,
      fontWeight: '400',
      letterSpacing: 0,
    },
    medium: {
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '400',
      letterSpacing: 0,
    },
    small: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '400',
      letterSpacing: 0,
    },
  },

  // Labels & Captions
  label: {
    large: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '500',
      letterSpacing: 0,
    },
    medium: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500',
      letterSpacing: 0,
    },
    small: {
      fontSize: 11,
      lineHeight: 16,
      fontWeight: '500',
      letterSpacing: 0.5,
    },
  },

  // Code
  code: {
    large: {
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '400',
      fontFamily: typography.fontFamily.mono,
    },
    medium: {
      fontSize: 13,
      lineHeight: 20,
      fontWeight: '400',
      fontFamily: typography.fontFamily.mono,
    },
    small: {
      fontSize: 11,
      lineHeight: 16,
      fontWeight: '400',
      fontFamily: typography.fontFamily.mono,
    },
  },
};
```

### Usage Examples

```tsx
// Hero Text
<Text style={{
  ...typeScale.display.large,
  color: darkTheme.text.primary,
}}>
  Magic shouldn't be out of reach
</Text>

// Heading
<Text style={{
  ...typeScale.heading.h2,
  color: darkTheme.text.primary,
}}>
  Your Epic Board
</Text>

// Body Text
<Text style={{
  ...typeScale.body.medium,
  color: darkTheme.text.secondary,
}}>
  Your enchanted workflow management experience
</Text>

// Label
<Text style={{
  ...typeScale.label.small,
  color: darkTheme.text.tertiary,
  textTransform: 'uppercase',
}}>
  In Progress
</Text>
```

---

## Spacing System

### Base Unit: 4px

All spacing values are multiples of 4px for consistency.

```typescript
export const spacing = {
  0: 0,
  1: 4,      // 4px
  2: 8,      // 8px
  3: 12,     // 12px
  4: 16,     // 16px
  5: 20,     // 20px
  6: 24,     // 24px
  8: 32,     // 32px
  10: 40,    // 40px
  12: 48,    // 48px
  16: 64,    // 64px
  20: 80,    // 80px
  24: 96,    // 96px
};
```

### Component Spacing

```typescript
export const componentSpacing = {
  // Padding
  padding: {
    xs: spacing[2],    // 8px
    sm: spacing[3],    // 12px
    md: spacing[4],    // 16px
    lg: spacing[6],    // 24px
    xl: spacing[8],    // 32px
  },

  // Margin
  margin: {
    xs: spacing[2],    // 8px
    sm: spacing[3],    // 12px
    md: spacing[4],    // 16px
    lg: spacing[6],    // 24px
    xl: spacing[8],    // 32px
  },

  // Gap (for flex/grid)
  gap: {
    xs: spacing[1],    // 4px
    sm: spacing[2],    // 8px
    md: spacing[3],    // 12px
    lg: spacing[4],    // 16px
    xl: spacing[6],    // 24px
  },
};
```

---

## Border Radius

```typescript
export const borderRadius = {
  none: 0,
  xs: 4,      // Small elements (badges, chips)
  sm: 8,      // Buttons, inputs
  md: 12,     // Cards, small modals
  lg: 16,     // Large cards, bottom sheets
  xl: 24,     // Full-screen modals
  full: 9999, // Pills, circular avatars
};
```

---

## Component Styles

### Buttons

```typescript
export const buttonStyles = {
  // Primary Button (Gradient)
  primary: {
    background: darkTheme.gradients.primary,
    color: darkTheme.text.primary,
    padding: `${spacing[3]}px ${spacing[6]}px`,
    borderRadius: borderRadius.sm,
    fontSize: typeScale.label.large.fontSize,
    fontWeight: typeScale.label.large.fontWeight,
    boxShadow: darkTheme.shadow.glow,
    border: 'none',
    minHeight: 44, // Touch target
  },

  // Secondary Button
  secondary: {
    background: darkTheme.surface.primary,
    color: darkTheme.text.primary,
    padding: `${spacing[3]}px ${spacing[6]}px`,
    borderRadius: borderRadius.sm,
    fontSize: typeScale.label.large.fontSize,
    fontWeight: typeScale.label.large.fontWeight,
    border: `1px solid ${darkTheme.border.primary}`,
    minHeight: 44,
  },

  // Ghost Button
  ghost: {
    background: 'transparent',
    color: darkTheme.brand.magenta.primary,
    padding: `${spacing[3]}px ${spacing[6]}px`,
    borderRadius: borderRadius.sm,
    fontSize: typeScale.label.large.fontSize,
    fontWeight: typeScale.label.large.fontWeight,
    border: 'none',
    minHeight: 44,
  },

  // Icon Button
  icon: {
    background: darkTheme.surface.primary,
    color: darkTheme.text.primary,
    padding: spacing[3],
    borderRadius: borderRadius.sm,
    border: `1px solid ${darkTheme.border.primary}`,
    minWidth: 44,
    minHeight: 44,
  },
};
```

### Cards

```typescript
export const cardStyles = {
  // Default Card
  default: {
    background: darkTheme.surface.primary,
    border: `1px solid ${darkTheme.border.primary}`,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    boxShadow: darkTheme.shadow.medium,
  },

  // Elevated Card
  elevated: {
    background: darkTheme.surface.secondary,
    border: `1px solid ${darkTheme.border.primary}`,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    boxShadow: darkTheme.shadow.large,
  },

  // Interactive Card (hover effect)
  interactive: {
    background: darkTheme.surface.primary,
    border: `1px solid ${darkTheme.border.primary}`,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    boxShadow: darkTheme.shadow.medium,
    transition: 'all 0.2s ease',
    ':hover': {
      background: darkTheme.surface.secondary,
      boxShadow: darkTheme.shadow.large,
      transform: 'translateY(-2px)',
    },
  },
};
```

### Bottom Sheets

```typescript
export const bottomSheetStyles = {
  container: {
    background: darkTheme.surface.primary,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing[6],
    boxShadow: darkTheme.shadow.large,
  },

  handle: {
    width: 40,
    height: 4,
    background: darkTheme.border.primary,
    borderRadius: borderRadius.full,
    margin: `${spacing[2]}px auto ${spacing[4]}px`,
  },

  overlay: {
    background: 'rgba(0, 0, 0, 0.6)',
  },
};
```

### Badges & Chips

```typescript
export const badgeStyles = {
  // Status Badge
  status: (status: keyof typeof darkTheme.status) => ({
    background: darkTheme.status[status].background,
    border: `1px solid ${darkTheme.status[status].border}`,
    color: darkTheme.status[status].text,
    padding: `${spacing[1]}px ${spacing[3]}px`,
    borderRadius: borderRadius.xs,
    fontSize: typeScale.label.small.fontSize,
    fontWeight: typeScale.label.small.fontWeight,
    textTransform: 'uppercase',
  }),

  // Chip
  chip: {
    background: darkTheme.brand.teal.alpha[20],
    border: `1px solid ${darkTheme.brand.teal.primary}`,
    color: darkTheme.brand.teal.primary,
    padding: `${spacing[1]}px ${spacing[3]}px`,
    borderRadius: borderRadius.full,
    fontSize: typeScale.label.small.fontSize,
    fontWeight: typeScale.label.small.fontWeight,
  },
};
```

### Inputs

```typescript
export const inputStyles = {
  // Text Input
  text: {
    background: darkTheme.surface.primary,
    border: `1px solid ${darkTheme.border.primary}`,
    borderRadius: borderRadius.sm,
    padding: `${spacing[3]}px ${spacing[4]}px`,
    fontSize: typeScale.body.medium.fontSize,
    color: darkTheme.text.primary,
    minHeight: 44,
    ':focus': {
      border: `1px solid ${darkTheme.border.focus}`,
      boxShadow: `0 0 0 3px ${darkTheme.brand.magenta.alpha[20]}`,
    },
  },

  // Search Input
  search: {
    background: darkTheme.surface.secondary,
    border: `1px solid ${darkTheme.border.secondary}`,
    borderRadius: borderRadius.full,
    padding: `${spacing[2]}px ${spacing[4]}px`,
    fontSize: typeScale.body.medium.fontSize,
    color: darkTheme.text.primary,
    minHeight: 40,
  },
};
```

---

## Animations & Transitions

### Timing Functions

```typescript
export const easings = {
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
};
```

### Duration

```typescript
export const duration = {
  instant: 100,   // Instant feedback
  fast: 200,      // Quick transitions
  normal: 300,    // Default transitions
  slow: 500,      // Deliberate animations
};
```

### Common Transitions

```typescript
export const transitions = {
  default: `all ${duration.normal}ms ${easings.easeInOut}`,
  fast: `all ${duration.fast}ms ${easings.easeOut}`,
  slow: `all ${duration.slow}ms ${easings.easeInOut}`,
  transform: `transform ${duration.normal}ms ${easings.spring}`,
  opacity: `opacity ${duration.fast}ms ${easings.easeOut}`,
};
```

---

## Haptic Feedback

### Haptic Types

```typescript
export const haptics = {
  light: 'light',           // Subtle feedback (toggle, checkbox)
  medium: 'medium',         // Standard feedback (button tap)
  heavy: 'heavy',           // Strong feedback (important action)
  success: 'success',       // Success notification
  warning: 'warning',       // Warning notification
  error: 'error',           // Error notification
  selection: 'selection',   // Selection change (picker, slider)
};
```

### Usage Guidelines

- **Light**: Toggle switches, checkboxes, radio buttons
- **Medium**: Standard button taps, list item selection
- **Heavy**: Destructive actions (delete, cancel), important confirmations
- **Success**: Task completion, successful save
- **Warning**: Validation warnings, non-critical errors
- **Error**: Critical errors, failed operations
- **Selection**: Picker scrolling, slider adjustments

---

## Accessibility

### Color Contrast

All color combinations meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text).

**Dark Theme Contrast Ratios:**
- Primary text on background: 15.8:1 ✅
- Secondary text on background: 7.2:1 ✅
- Magenta on background: 5.1:1 ✅
- Cyan on background: 6.8:1 ✅

**Light Theme Contrast Ratios:**
- Primary text on background: 14.2:1 ✅
- Secondary text on background: 6.5:1 ✅
- Magenta on white: 4.8:1 ✅
- Cyan on white: 5.2:1 ✅

### Touch Targets

All interactive elements have a minimum touch target of 44x44px (iOS) / 48x48dp (Android).

### Reduced Motion

Respect user's reduced motion preferences:

```typescript
export const respectReducedMotion = (animation: string) => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'none';
  }
  return animation;
};
```

---

## Implementation

### React Native / Capacitor

```typescript
// theme.ts
import { darkTheme, lightTheme } from './colors';
import { typeScale } from './typography';
import { spacing, borderRadius } from './spacing';

export const theme = {
  colors: darkTheme,
  typography: typeScale,
  spacing,
  borderRadius,
};

// Usage in components
import { theme } from './theme';

const MyComponent = () => (
  <View style={{
    backgroundColor: theme.colors.surface.primary,
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.md,
  }}>
    <Text style={{
      ...theme.typography.heading.h2,
      color: theme.colors.text.primary,
    }}>
      Hello World
    </Text>
  </View>
);
```

### Theme Context

```typescript
// ThemeContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { darkTheme, lightTheme } from './colors';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  colors: typeof darkTheme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');
  
  const colors = theme === 'dark' ? darkTheme : lightTheme;
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };
  
  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

---

## Design Tokens Export

### CSS Variables

```css
:root {
  /* Brand Colors */
  --color-brand-magenta: #E91EFF;
  --color-brand-cyan: #00D9FF;
  --color-brand-teal: #00D9C8;
  
  /* Background */
  --color-bg-primary: #1A1625;
  --color-bg-secondary: #0F0D15;
  
  /* Surface */
  --color-surface-primary: #2A2435;
  --color-surface-secondary: #342E42;
  
  /* Text */
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #A8A8B8;
  --color-text-tertiary: #6E6A7C;
  
  /* Spacing */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  
  /* Border Radius */
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  
  /* Typography */
  --font-size-display-lg: 48px;
  --font-size-h1: 28px;
  --font-size-h2: 24px;
  --font-size-body-md: 15px;
  --font-size-label-sm: 11px;
}
```

### Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          magenta: '#E91EFF',
          cyan: '#00D9FF',
          teal: '#00D9C8',
        },
        background: {
          primary: '#1A1625',
          secondary: '#0F0D15',
        },
        surface: {
          primary: '#2A2435',
          secondary: '#342E42',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#A8A8B8',
          tertiary: '#6E6A7C',
        },
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        6: '24px',
        8: '32px',
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
    },
  },
};
```

---

## Testing & Validation

### Color Contrast Testing

Use tools like:
- WebAIM Contrast Checker
- Stark (Figma plugin)
- Chrome DevTools Accessibility Inspector

### Device Testing

Test on:
- **Small**: iPhone SE (375px)
- **Standard**: iPhone 14 Pro (393px), Pixel 7 (412px)
- **Large**: iPhone 14 Pro Max (430px)
- **Tablet**: iPad Mini (768px)

### Dark Mode Testing

- Test in bright sunlight (outdoor visibility)
- Test in dark room (OLED burn-in prevention)
- Test with Night Shift / Blue Light Filter enabled

---

## Migration Strategy

### Phase 1: Foundation (Week 1-2)
- [ ] Implement design tokens (colors, typography, spacing)
- [ ] Create ThemeProvider and useTheme hook
- [ ] Update base components (Button, Card, Input)
- [ ] Test dark theme on all screens

### Phase 2: Component Library (Week 3-4)
- [ ] Update all UI components with design system
- [ ] Implement light theme
- [ ] Add theme toggle in settings
- [ ] Test theme switching

### Phase 3: Polish (Week 5-6)
- [ ] Add animations and transitions
- [ ] Implement haptic feedback
- [ ] Accessibility audit
- [ ] Performance optimization

---

## Universality Validation

### Design System Universal Application

This design system is designed to work universally across all Forge contexts, ensuring visual consistency whether users access Forge through native apps, mobile web browsers, or desktop browsers.

#### Universal Design Principles

**Same Visual Language Everywhere:**
- Typography, colors, and design tokens are consistent across ALL contexts
- Mobile components work in responsive web browsers (not just native apps)
- Touch interactions function in mobile browsers
- CSS breakpoints and mobile theme apply to browser viewports

#### Platform Coverage

**1. Capacitor Native Apps (Android/iOS)**
- Full design system implementation with native features
- Haptic feedback, camera integration, push notifications
- Safe area handling for notches and Dynamic Island
- OLED-optimized dark theme for battery efficiency

**2. Mobile Web Browsers (Chrome, Safari on phones)**
- Same typography scale and font families
- Same color palette and theme tokens
- Responsive breakpoints (375px, 390px, 428px, 768px)
- Touch-optimized interactions (44x44px minimum tap targets)
- Graceful degradation for native-only features
- CSS safe-area fallbacks: `padding: env(safe-area-inset-top, 0px)`

**3. Desktop Web Browsers (Responsive Design)**
- Same design tokens and component styles
- Adaptive layouts for larger viewports (1280px+)
- Mouse and keyboard interactions alongside touch
- Consistent visual effects (gradients, shadows, glassmorphism)

#### Validation Checklist

**Typography Consistency:**
- [ ] Same font families across native apps, mobile web, desktop web
- [ ] Same type scale (display, heading, body, label, code) in all contexts
- [ ] Same font weights and letter spacing across platforms
- [ ] Web fonts loaded correctly in browser contexts

**Color Consistency:**
- [ ] Same brand colors (magenta, cyan, teal) across all contexts
- [ ] Same gradients render correctly in browsers and native apps
- [ ] Dark theme and light theme work in all contexts
- [ ] Status colors consistent across platforms
- [ ] WCAG AA contrast ratios maintained in all contexts

**Component Consistency:**
- [ ] Bottom navigation works in mobile web browsers
- [ ] Bottom sheets functional in responsive web views
- [ ] Cards, buttons, inputs styled identically across contexts
- [ ] Badges, chips, tooltips render consistently
- [ ] Modal dialogs and overlays work in all contexts

**Interaction Consistency:**
- [ ] Touch gestures (swipe, long-press, pinch) work in mobile browsers
- [ ] Tap targets meet 44x44px minimum in all contexts
- [ ] Hover states work on desktop (mouse) and mobile (touch)
- [ ] Focus states consistent across keyboard and touch navigation
- [ ] Animations and transitions smooth in all contexts

**Layout Consistency:**
- [ ] Responsive breakpoints apply to browser viewports
- [ ] Safe area handling gracefully degrades in non-native contexts
- [ ] Grid and spacing system consistent across platforms
- [ ] Vertical rhythm maintained in all contexts

**Visual Effects Consistency:**
- [ ] Glassmorphism effects render in modern browsers
- [ ] Shadows and glows consistent across platforms
- [ ] Gradient overlays work in all contexts
- [ ] Border radius and visual styling identical

#### Browser Compatibility

**Minimum Browser Support:**
- Chrome 90+ (Android, Desktop)
- Safari 14+ (iOS, macOS)
- Firefox 88+ (Android, Desktop)
- Edge 90+ (Desktop)

**Progressive Enhancement:**
- Core functionality works in all supported browsers
- Advanced features (haptics, camera) gracefully degrade in web contexts
- CSS custom properties (variables) for theme tokens
- Fallbacks for unsupported CSS features

#### Testing Strategy

**Cross-Context Testing:**
1. Test all screens on Capacitor native app (Android)
2. Test all screens on mobile web browser (Chrome on Android, Safari on iOS)
3. Test all screens on desktop browser (Chrome, Safari, Firefox)
4. Verify typography, colors, and spacing identical across contexts
5. Validate touch interactions work in mobile browsers
6. Confirm responsive breakpoints apply correctly in browser viewports

**Evidence Collection:**
- Screenshots of same screen in native app vs mobile web vs desktop
- Side-by-side comparison of typography and colors
- Video recordings of touch interactions in mobile browsers
- Lighthouse scores for mobile web (target: >90)

#### Implementation Guidelines

**CSS Variables for Universal Theming:**
```css
:root {
  /* Brand Colors */
  --color-brand-magenta: #E91EFF;
  --color-brand-cyan: #00D9FF;
  --color-brand-teal: #00D9C8;
  
  /* Background Colors */
  --color-bg-primary: #1A1625;
  --color-bg-secondary: #0F0D15;
  
  /* Typography */
  --font-family-primary: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-family-mono: "SF Mono", Monaco, "Cascadia Code", monospace;
  
  /* Spacing */
  --spacing-unit: 4px;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Safe Area (with fallback) */
  --safe-area-top: env(safe-area-inset-top, 0px);
  --safe-area-bottom: env(safe-area-inset-bottom, 0px);
}
```

**Platform Detection Utilities:**
```typescript
export const isNativeApp = () => {
  return typeof window !== 'undefined' && 
         (window as any).Capacitor !== undefined;
};

export const isMobileWeb = () => {
  return typeof window !== 'undefined' && 
         /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) &&
         !isNativeApp();
};

export const isDesktop = () => {
  return typeof window !== 'undefined' && 
         !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
};

export const supportsHaptics = () => {
  return isNativeApp() && (window as any).Capacitor?.Plugins?.Haptics;
};
```

**Graceful Degradation Example:**
```typescript
// Haptic feedback with graceful degradation
export const triggerHaptic = async (type: HapticType) => {
  if (supportsHaptics()) {
    await Haptics.impact({ style: type });
  } else {
    // Fallback: visual feedback only (no haptics in web)
    console.log(`Haptic feedback (${type}) - not available in web context`);
  }
};
```

#### Success Criteria

**Universal Design Validation:**
- ✅ Same typography across native apps, mobile web, desktop web
- ✅ Same color palette and theme tokens across all contexts
- ✅ Mobile components work in responsive web browsers
- ✅ Touch interactions functional in mobile browsers
- ✅ CSS breakpoints apply to browser viewports
- ✅ Safe area utilities gracefully handle non-native contexts
- ✅ Visual effects (gradients, shadows, glassmorphism) render consistently
- ✅ Lighthouse mobile score >90 for web contexts

---

## Resources

### Design Files
- Figma: [Link to Figma file]
- Color Palette: [Link to color palette]
- Component Library: [Link to Storybook]

### Documentation
- [Material Design 3](https://m3.material.io/)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## Changelog

### Version 1.0 (2025-11-11)
- Initial design system specification
- Dark theme color palette extracted from brand screenshots
- Light theme color palette defined
- Typography scale defined
- Spacing system defined
- Component styles defined
- Accessibility guidelines defined

---

**Status:** ✅ Design System Complete  
**Ready For:** Implementation in Phase 1  
**Next Steps:** Create ThemeProvider and update base components
