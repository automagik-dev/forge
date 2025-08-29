# Automagik-Forge Customizations

This directory contains all customizations specific to automagik-forge that are not in the upstream vibe-kanban repository.

## Structure

```
customizations/
├── README.md           # This file
├── config.ts          # Feature flags and configuration
├── themes/            # Custom themes
│   ├── dracula.css    # Dracula theme
│   └── index.ts       # Theme exports
├── fonts/             # Custom fonts
│   ├── Blanka.otf     # Blanka font file
│   └── fonts.css      # Font declarations
├── components/        # Custom components
│   └── AnimatedAnvil.tsx
└── assets/           # Custom assets
    ├── logo.svg
    └── favicon.svg
```

## Usage

All customizations are controlled via feature flags in `config.ts`. This allows us to:
1. Keep customizations isolated from upstream code
2. Easily toggle features on/off
3. Maintain clean separation for easier merging

## Principles

1. **Minimal Intrusion**: Only modify upstream files where absolutely necessary
2. **Feature Flags**: All customizations should be toggleable
3. **CSS Variables**: Use CSS custom properties for theming
4. **Conditional Imports**: Only load custom assets when features are enabled
5. **Fallback to Defaults**: Always provide fallback to upstream defaults