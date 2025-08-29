# Automagik-Forge Customization Strategy

## Overview
This document outlines our modular approach to adding custom features while maintaining easy synchronization with upstream vibe-kanban.

## Core Principles

### 1. **Isolation**
All customizations live in `/frontend/src/customizations/` directory:
```
customizations/
├── config.ts           # Feature flags
├── themes/            # Custom themes (Dracula)
├── fonts/             # Custom fonts (Blanka)
├── components/        # Custom components (AnimatedAnvil)
├── assets/           # Custom assets (logos, favicons)
└── integration-guide.md
```

### 2. **Feature Flags**
Every customization is controlled by a feature flag in `config.ts`:
```typescript
export const AUTOMAGIK_FEATURES = {
  enableDraculaTheme: true,
  enableBlankaFont: true,
  enableAnimatedAnvil: true,
  enableCustomLogo: true,
  // ... more features
};
```

### 3. **Minimal Intrusion**
Changes to upstream files are kept to absolute minimum:
- **App.tsx**: 1-2 lines to import and wrap with CustomThemeWrapper
- **Settings.tsx**: Conditional theme option
- **Components**: Conditional classes or component swaps

### 4. **CSS-First Approach**
Many customizations are pure CSS:
- Dracula theme uses CSS custom properties
- Blanka font uses @font-face and conditional classes
- No JavaScript changes needed for most visual customizations

## Implementation Status

### ✅ Completed
1. **Modular Structure**: `/customizations` directory created
2. **Dracula Theme**: Complete CSS theme with proper color mapping
3. **Blanka Font**: Font declarations and conditional loading
4. **Animated Anvil**: Custom loading component
5. **Custom Assets**: Logo and favicon variants
6. **Feature Flags**: Configuration system for all features

### 🔄 Integration Points (Minimal)

#### App.tsx (2 lines)
```tsx
import { CustomThemeWrapper } from '@/customizations';
// ... wrap ThemeProvider children
```

#### Settings.tsx (conditional)
```tsx
{CUSTOM_THEMES.dracula.enabled && (
  <option value="dracula">Dracula</option>
)}
```

#### Components (conditional)
```tsx
const loader = AUTOMAGIK_FEATURES.enableAnimatedAnvil ? 
  <AnimatedAnvil /> : <DefaultLoader />;
```

## Upstream Sync Strategy

### When pulling from upstream:

1. **Before Pull**:
   - Note any modified upstream files
   - Keep list of our integration points

2. **During Merge**:
   - Accept upstream changes first
   - Re-add our minimal hooks after

3. **After Merge**:
   - Test with features disabled (should work like vanilla vibe-kanban)
   - Test with features enabled (should show customizations)

### Conflict Resolution Priority:
1. **Always keep upstream logic intact**
2. **Our changes are additive only**
3. **If conflict, prefer upstream and re-add our wrapper**

## Benefits of This Approach

### ✅ **Easy Upstream Sync**
- 99% of code is isolated in `/customizations`
- Only 3-4 files have minimal changes
- Conflicts are rare and easy to resolve

### ✅ **Toggle-able Features**
- Can disable all customizations instantly
- Test upstream compatibility anytime
- Ship different configurations easily

### ✅ **Clean Separation**
- Clear boundary between upstream and custom code
- Easy to see what's ours vs theirs
- New developers can understand quickly

### ✅ **Future-Proof**
- New features go in `/customizations`
- Upstream can evolve independently
- We can add features without touching core

## Next Steps

1. **Environment Variables**: Add build-time configuration
2. **Dynamic Theme Loading**: Load themes on-demand
3. **Plugin System**: Make customizations truly pluggable
4. **Documentation**: Maintain list of all integration points

## Testing Checklist

- [ ] Run with all features disabled (should match upstream)
- [ ] Run with all features enabled (should show customizations)
- [ ] Pull latest upstream and verify merge is clean
- [ ] Check theme switching works
- [ ] Verify fonts load correctly
- [ ] Test animated components
- [ ] Validate custom assets display

---

**Remember**: The goal is to keep customizations so isolated that we can pull from upstream daily without conflicts!