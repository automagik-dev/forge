# Integration Guide

## Minimal Integration Points

To integrate automagik-forge customizations with minimal changes to upstream files:

### 1. App.tsx - Add Custom Theme Wrapper (1 line change)
```tsx
import { CustomThemeWrapper } from '@/customizations';

// Wrap ThemeProvider children:
<ThemeProvider initialTheme={config?.theme || ThemeMode.SYSTEM}>
  <CustomThemeWrapper theme={config?.theme}>
    {/* existing children */}
  </CustomThemeWrapper>
</ThemeProvider>
```

### 2. Settings.tsx - Add Dracula Theme Option (conditional)
```tsx
import { CUSTOM_THEMES } from '@/customizations';

// In theme options, conditionally add:
{CUSTOM_THEMES.dracula.enabled && (
  <option value="dracula">Dracula</option>
)}
```

### 3. Loader Component - Use AnimatedAnvil (conditional)
```tsx
import { AnimatedAnvil, AUTOMAGIK_FEATURES } from '@/customizations';

// Replace loader conditionally:
{AUTOMAGIK_FEATURES.enableAnimatedAnvil ? (
  <AnimatedAnvil />
) : (
  <DefaultLoader />
)}
```

### 4. ProjectCard - Add Blanka Font (conditional class)
```tsx
import { AUTOMAGIK_FEATURES } from '@/customizations';

// Add conditional class:
<div className={`project-card ${AUTOMAGIK_FEATURES.enableBlankaFont ? 'automagik-project-card' : ''}`}>
```

## Build-time Configuration

You can also control features via environment variables:

```bash
# .env.local
REACT_APP_AUTOMAGIK=true
REACT_APP_ENABLE_DRACULA=true
REACT_APP_ENABLE_CUSTOM_FONTS=true
```

## Upstream Sync Strategy

1. **Never modify core logic** - Only add conditional wrappers
2. **Use feature flags** - All customizations should be toggleable
3. **CSS-only when possible** - Many customizations can be pure CSS
4. **Separate directories** - Keep all custom code in `/customizations`
5. **Document changes** - Track any upstream file modifications

## Conflict Resolution

When pulling from upstream:

1. Most conflicts will be in App.tsx, Settings.tsx
2. Our changes are minimal (1-2 lines per file)
3. Always keep upstream logic, just re-add our wrapper calls
4. Test with features disabled to ensure upstream compatibility