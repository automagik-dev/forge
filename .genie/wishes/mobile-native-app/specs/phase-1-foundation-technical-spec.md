# Phase 1: Foundation - Technical Specification

**Timeline:** Weeks 1-2  
**Goal:** Mobile-first component library + navigation infrastructure  
**Status:** 📋 Planning Complete, Ready for Implementation

---

## Overview

Phase 1 establishes the foundational mobile infrastructure that all subsequent phases will build upon. This includes Capacitor setup for native features, core navigation components, gesture handling, and mobile-optimized theming.

---

## 1. Capacitor Setup (Android)

### 1.1 Installation & Configuration

**Dependencies to Add:**
```json
{
  "dependencies": {
    "@capacitor/core": "^6.0.0",
    "@capacitor/cli": "^6.0.0",
    "@capacitor/android": "^6.0.0",
    "@capacitor/camera": "^6.0.0",
    "@capacitor/push-notifications": "^6.0.0",
    "@capacitor/share": "^6.0.0",
    "@capacitor/haptics": "^6.0.0",
    "@capacitor/status-bar": "^6.0.0",
    "@capacitor/keyboard": "^6.0.0",
    "@capacitor/app": "^6.0.0"
  }
}
```

**Capacitor Configuration:**
```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ai.namastex.forge',
  appName: 'Automagik Forge',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    hostname: 'forge.local',
    // Development: Allow localhost backend
    cleartext: true,
    allowNavigation: ['localhost', '127.0.0.1']
  },
  android: {
    buildOptions: {
      keystorePath: undefined, // Set in CI/CD
      keystoreAlias: undefined,
      keystorePassword: undefined,
      releaseType: 'APK'
    }
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: false
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000'
    },
    Keyboard: {
      resize: 'native',
      style: 'dark'
    }
  }
};

export default config;
```

**Android Manifest Additions:**
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest>
  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.CAMERA" />
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
  <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
  <uses-permission android:name="android.permission.VIBRATE" />
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
  
  <application
    android:usesCleartextTraffic="true"
    android:networkSecurityConfig="@xml/network_security_config">
    <!-- ... -->
  </application>
</manifest>
```

**Build Commands:**
```bash
# Initial setup
npm install
npx cap init

# Add Android platform
npx cap add android

# Sync web assets to native project
npx cap sync

# Open in Android Studio
npx cap open android

# Build APK
cd android && ./gradlew assembleDebug
```

### 1.2 Platform Detection & Utilities

**File:** `frontend/src/lib/platform.ts`

```typescript
import { Capacitor } from '@capacitor/core';

export const Platform = {
  /**
   * Check if running as native app
   */
  isNative(): boolean {
    return Capacitor.isNativePlatform();
  },

  /**
   * Check if running on Android
   */
  isAndroid(): boolean {
    return Capacitor.getPlatform() === 'android';
  },

  /**
   * Check if running on iOS
   */
  isIOS(): boolean {
    return Capacitor.getPlatform() === 'ios';
  },

  /**
   * Check if running in web browser
   */
  isWeb(): boolean {
    return Capacitor.getPlatform() === 'web';
  },

  /**
   * Get platform name
   */
  getPlatform(): 'web' | 'android' | 'ios' {
    return Capacitor.getPlatform() as 'web' | 'android' | 'ios';
  },

  /**
   * Check if plugin is available
   */
  isPluginAvailable(pluginName: string): boolean {
    return Capacitor.isPluginAvailable(pluginName);
  }
};

/**
 * Hook for platform detection
 */
export function usePlatform() {
  return {
    isNative: Platform.isNative(),
    isAndroid: Platform.isAndroid(),
    isIOS: Platform.isIOS(),
    isWeb: Platform.isWeb(),
    platform: Platform.getPlatform()
  };
}
```

---

## 2. Mobile Breakpoints Configuration

### 2.1 Tailwind Configuration Updates

**File:** `frontend/tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  // ... existing config
  theme: {
    extend: {
      screens: {
        // Mobile-first breakpoints
        'xs': '375px',   // Small phones (iPhone SE)
        'sm': '640px',   // Large phones
        'md': '768px',   // Tablets (portrait)
        'lg': '1024px',  // Tablets (landscape)
        'xl': '1280px',  // Desktop
        '2xl': '1536px', // Large desktop
        
        // Custom mobile breakpoints
        'mobile': { 'max': '767px' },      // Mobile only
        'tablet': { 'min': '768px', 'max': '1023px' }, // Tablet only
        'desktop': { 'min': '1024px' },    // Desktop and up
        
        // Height breakpoints for mobile
        'h-sm': { 'raw': '(max-height: 667px)' },  // Short screens
        'h-md': { 'raw': '(min-height: 668px) and (max-height: 844px)' },
        'h-lg': { 'raw': '(min-height: 845px)' }   // Tall screens
      },
      
      // Mobile-optimized spacing
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      
      // Mobile-optimized heights
      height: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
        'dvh': '100dvh', // Dynamic viewport height
      },
      
      // Touch-friendly sizes
      minHeight: {
        'touch': '44px', // iOS minimum touch target
      },
      minWidth: {
        'touch': '44px',
      }
    }
  }
};
```

### 2.2 CSS Variables for Mobile

**File:** `frontend/src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Safe area insets (for notch/Dynamic Island) */
    --sat: env(safe-area-inset-top);
    --sab: env(safe-area-inset-bottom);
    --sal: env(safe-area-inset-left);
    --sar: env(safe-area-inset-right);
    
    /* Mobile-specific spacing */
    --mobile-header-height: 56px;
    --mobile-bottom-nav-height: 64px;
    --mobile-input-bar-height: 56px;
    
    /* Touch target sizes */
    --touch-target-min: 44px;
    --touch-target-comfortable: 48px;
    
    /* Mobile typography scale */
    --mobile-text-xs: 12px;
    --mobile-text-sm: 14px;
    --mobile-text-base: 16px;
    --mobile-text-lg: 18px;
    --mobile-text-xl: 20px;
    --mobile-text-2xl: 24px;
    
    /* Mobile z-index scale */
    --z-mobile-content: 1;
    --z-mobile-header: 10;
    --z-mobile-bottom-nav: 20;
    --z-mobile-fab: 30;
    --z-mobile-sheet: 40;
    --z-mobile-modal: 50;
    --z-mobile-toast: 60;
  }
  
  /* Prevent text size adjustment on orientation change */
  html {
    -webkit-text-size-adjust: 100%;
    -moz-text-size-adjust: 100%;
    text-size-adjust: 100%;
  }
  
  /* Mobile viewport height fix */
  @supports (height: 100dvh) {
    .h-screen-mobile {
      height: 100dvh;
    }
  }
  
  /* Disable pull-to-refresh on mobile (we'll implement custom) */
  body {
    overscroll-behavior-y: contain;
  }
  
  /* Touch-friendly scrolling */
  .mobile-scroll {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
  }
}

@layer utilities {
  /* Safe area utilities */
  .pt-safe {
    padding-top: env(safe-area-inset-top);
  }
  
  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom);
  }
  
  .pl-safe {
    padding-left: env(safe-area-inset-left);
  }
  
  .pr-safe {
    padding-right: env(safe-area-inset-right);
  }
  
  /* Touch target utilities */
  .touch-target {
    min-width: var(--touch-target-min);
    min-height: var(--touch-target-min);
  }
  
  .touch-target-comfortable {
    min-width: var(--touch-target-comfortable);
    min-height: var(--touch-target-comfortable);
  }
  
  /* Mobile-specific utilities */
  .mobile-header {
    height: var(--mobile-header-height);
  }
  
  .mobile-bottom-nav {
    height: var(--mobile-bottom-nav-height);
  }
  
  /* Disable text selection on mobile UI elements */
  .no-select-mobile {
    -webkit-user-select: none;
    -moz-user-select: none;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
}
```

---

## 3. Bottom Navigation Component

### 3.1 Component Structure

**File:** `frontend/src/components/mobile/BottomNavigation.tsx`

```typescript
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Platform } from '@/lib/platform';

export interface BottomNavTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  path?: string;
  onClick?: () => void;
  badge?: number | string;
  disabled?: boolean;
}

export interface BottomNavigationProps {
  tabs: BottomNavTab[];
  className?: string;
  onTabChange?: (tabId: string) => void;
}

export function BottomNavigation({ 
  tabs, 
  className,
  onTabChange 
}: BottomNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleTabClick = async (tab: BottomNavTab) => {
    if (tab.disabled) return;
    
    // Haptic feedback on native
    if (Platform.isNative()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
    
    // Navigate or execute custom action
    if (tab.path) {
      navigate(tab.path);
    } else if (tab.onClick) {
      tab.onClick();
    }
    
    // Notify parent
    onTabChange?.(tab.id);
  };
  
  const isTabActive = (tab: BottomNavTab): boolean => {
    if (!tab.path) return false;
    return location.pathname.startsWith(tab.path);
  };
  
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-[var(--z-mobile-bottom-nav)]',
        'bg-background border-t border-border',
        'pb-safe', // Safe area for home indicator
        className
      )}
    >
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = isTabActive(tab);
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              disabled={tab.disabled}
              className={cn(
                'flex flex-col items-center justify-center',
                'flex-1 h-full',
                'touch-target-comfortable',
                'transition-colors duration-200',
                'no-select-mobile',
                isActive && 'text-primary',
                !isActive && 'text-muted-foreground',
                tab.disabled && 'opacity-50 cursor-not-allowed'
              )}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Icon */}
              <div className="relative">
                <div className={cn(
                  'w-6 h-6 flex items-center justify-center',
                  'transition-transform duration-200',
                  isActive && 'scale-110'
                )}>
                  {isActive && tab.activeIcon ? tab.activeIcon : tab.icon}
                </div>
                
                {/* Badge */}
                {tab.badge !== undefined && (
                  <div className={cn(
                    'absolute -top-1 -right-1',
                    'min-w-[16px] h-4 px-1',
                    'flex items-center justify-center',
                    'bg-destructive text-destructive-foreground',
                    'text-[10px] font-semibold',
                    'rounded-full'
                  )}>
                    {typeof tab.badge === 'number' && tab.badge > 99 
                      ? '99+' 
                      : tab.badge
                    }
                  </div>
                )}
              </div>
              
              {/* Label */}
              <span className={cn(
                'text-xs font-medium mt-1',
                'transition-all duration-200',
                isActive && 'font-semibold'
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Hook to manage bottom navigation state
 */
export function useBottomNavigation() {
  const location = useLocation();
  
  const getCurrentTab = (): string => {
    const path = location.pathname;
    
    if (path.includes('/tasks')) return 'tasks';
    if (path.includes('/chat')) return 'chat';
    if (path.includes('/settings') || path.includes('/profile')) return 'me';
    
    return 'tasks'; // Default
  };
  
  return {
    currentTab: getCurrentTab()
  };
}
```

### 3.2 Bottom Navigation Icons

**File:** `frontend/src/components/mobile/BottomNavigationIcons.tsx`

```typescript
import React from 'react';
import { 
  LayoutGrid, 
  MessageSquare, 
  PlusCircle, 
  User,
  Search
} from 'lucide-react';

export const BottomNavIcons = {
  Tasks: {
    default: <LayoutGrid className="w-6 h-6" />,
    active: <LayoutGrid className="w-6 h-6" strokeWidth={2.5} />
  },
  Chat: {
    default: <MessageSquare className="w-6 h-6" />,
    active: <MessageSquare className="w-6 h-6" strokeWidth={2.5} />
  },
  New: {
    default: <PlusCircle className="w-6 h-6" />,
    active: <PlusCircle className="w-6 h-6" strokeWidth={2.5} />
  },
  Search: {
    default: <Search className="w-6 h-6" />,
    active: <Search className="w-6 h-6" strokeWidth={2.5} />
  },
  Me: {
    default: <User className="w-6 h-6" />,
    active: <User className="w-6 h-6" strokeWidth={2.5} />
  }
};
```

### 3.3 Usage Example

```typescript
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { BottomNavIcons } from '@/components/mobile/BottomNavigationIcons';

function MobileLayout() {
  const tabs = [
    {
      id: 'tasks',
      label: 'Tasks',
      icon: BottomNavIcons.Tasks.default,
      activeIcon: BottomNavIcons.Tasks.active,
      path: '/projects/:projectId/tasks'
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: BottomNavIcons.Chat.default,
      activeIcon: BottomNavIcons.Chat.active,
      path: '/chat',
      badge: 3 // Unread messages
    },
    {
      id: 'new',
      label: 'New',
      icon: BottomNavIcons.New.default,
      activeIcon: BottomNavIcons.New.active,
      onClick: () => {
        // Open bottom sheet for quick create
      }
    },
    {
      id: 'me',
      label: 'Me',
      icon: BottomNavIcons.Me.default,
      activeIcon: BottomNavIcons.Me.active,
      path: '/settings'
    }
  ];
  
  return (
    <div className="h-screen-mobile flex flex-col">
      {/* Main content */}
      <main className="flex-1 overflow-auto pb-16">
        {/* Content here */}
      </main>
      
      {/* Bottom navigation */}
      <BottomNavigation tabs={tabs} />
    </div>
  );
}
```

---

## 4. Bottom Sheet Component

### 4.1 Core Bottom Sheet

**File:** `frontend/src/components/mobile/BottomSheet.tsx`

```typescript
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Platform } from '@/lib/platform';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  snapPoints?: number[]; // Percentages: [25, 50, 90]
  initialSnap?: number; // Index of snapPoints
  dismissible?: boolean;
  showHandle?: boolean;
  className?: string;
  contentClassName?: string;
}

export function BottomSheet({
  open,
  onClose,
  children,
  title,
  description,
  snapPoints = [90],
  initialSnap = 0,
  dismissible = true,
  showHandle = true,
  className,
  contentClassName
}: BottomSheetProps) {
  const [currentSnap, setCurrentSnap] = useState(initialSnap);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  
  const snapHeight = snapPoints[currentSnap];
  const translateY = isDragging ? currentY - startY : 0;
  
  useEffect(() => {
    if (open) {
      // Prevent body scroll when sheet is open
      document.body.style.overflow = 'hidden';
      
      // Haptic feedback
      if (Platform.isNative()) {
        Haptics.impact({ style: ImpactStyle.Medium });
      }
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!dismissible) return;
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentY(e.touches[0].clientY);
  };
  
  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const dragDistance = currentY - startY;
    const threshold = 100; // pixels
    
    if (dragDistance > threshold) {
      // Dragged down significantly - close
      onClose();
    } else if (dragDistance < -threshold) {
      // Dragged up - snap to next point
      const nextSnap = Math.min(currentSnap + 1, snapPoints.length - 1);
      setCurrentSnap(nextSnap);
    }
    
    setCurrentY(0);
    setStartY(0);
  };
  
  const handleBackdropClick = () => {
    if (dismissible) {
      onClose();
    }
  };
  
  if (!open) return null;
  
  return createPortal(
    <div className="fixed inset-0 z-[var(--z-mobile-sheet)]">
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black/50',
          'transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0'
        )}
        onClick={handleBackdropClick}
      />
      
      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'absolute bottom-0 left-0 right-0',
          'bg-background rounded-t-3xl',
          'shadow-2xl',
          'transition-transform duration-300 ease-out',
          isDragging && 'transition-none',
          className
        )}
        style={{
          height: `${snapHeight}vh`,
          transform: `translateY(${Math.max(0, translateY)}px)`
        }}
      >
        {/* Drag Handle */}
        {showHandle && (
          <div
            className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
          </div>
        )}
        
        {/* Header */}
        {(title || description) && (
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {title && (
                  <h2 className="text-lg font-semibold">{title}</h2>
                )}
                {description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {description}
                  </p>
                )}
              </div>
              
              {dismissible && (
                <button
                  onClick={onClose}
                  className="ml-4 p-2 -mr-2 touch-target"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Content */}
        <div className={cn(
          'overflow-auto',
          'pb-safe',
          contentClassName
        )}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Hook to manage bottom sheet state
 */
export function useBottomSheet() {
  const [isOpen, setIsOpen] = useState(false);
  
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(prev => !prev);
  
  return {
    isOpen,
    open,
    close,
    toggle
  };
}
```

### 4.2 Bottom Sheet Variants

**File:** `frontend/src/components/mobile/BottomSheetVariants.tsx`

```typescript
import React from 'react';
import { BottomSheet, BottomSheetProps } from './BottomSheet';
import { Button } from '@/components/ui/button';

/**
 * Action Sheet - Quick actions list
 */
export interface ActionSheetAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
}

export interface ActionSheetProps extends Omit<BottomSheetProps, 'children'> {
  actions: ActionSheetAction[];
  showCancel?: boolean;
}

export function ActionSheet({ 
  actions, 
  showCancel = true,
  onClose,
  ...props 
}: ActionSheetProps) {
  return (
    <BottomSheet {...props} onClose={onClose} snapPoints={[50]}>
      <div className="p-4 space-y-2">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant === 'destructive' ? 'destructive' : 'ghost'}
            className="w-full justify-start h-14 text-base"
            onClick={() => {
              action.onClick();
              onClose();
            }}
            disabled={action.disabled}
          >
            {action.icon && (
              <span className="mr-3">{action.icon}</span>
            )}
            {action.label}
          </Button>
        ))}
        
        {showCancel && (
          <>
            <div className="h-2" />
            <Button
              variant="outline"
              className="w-full h-14 text-base font-semibold"
              onClick={onClose}
            >
              Cancel
            </Button>
          </>
        )}
      </div>
    </BottomSheet>
  );
}

/**
 * Selection Sheet - Single/multi select
 */
export interface SelectionSheetOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SelectionSheetProps extends Omit<BottomSheetProps, 'children'> {
  options: SelectionSheetOption[];
  value?: string | string[];
  multiple?: boolean;
  onChange: (value: string | string[]) => void;
  searchable?: boolean;
}

export function SelectionSheet({
  options,
  value,
  multiple = false,
  onChange,
  searchable = false,
  onClose,
  ...props
}: SelectionSheetProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const filteredOptions = searchable
    ? options.filter(opt => 
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;
  
  const isSelected = (optionValue: string) => {
    if (multiple && Array.isArray(value)) {
      return value.includes(optionValue);
    }
    return value === optionValue;
  };
  
  const handleSelect = (optionValue: string) => {
    if (multiple && Array.isArray(value)) {
      const newValue = isSelected(optionValue)
        ? value.filter(v => v !== optionValue)
        : [...value, optionValue];
      onChange(newValue);
    } else {
      onChange(optionValue);
      if (!multiple) {
        onClose();
      }
    }
  };
  
  return (
    <BottomSheet {...props} onClose={onClose} snapPoints={[70]}>
      <div className="flex flex-col h-full">
        {/* Search */}
        {searchable && (
          <div className="p-4 border-b border-border">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-muted rounded-lg"
            />
          </div>
        )}
        
        {/* Options */}
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {filteredOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              disabled={option.disabled}
              className={cn(
                'w-full flex items-center p-4 rounded-lg',
                'transition-colors',
                'touch-target-comfortable',
                isSelected(option.value)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80',
                option.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {option.icon && (
                <span className="mr-3">{option.icon}</span>
              )}
              <div className="flex-1 text-left">
                <div className="font-medium">{option.label}</div>
                {option.description && (
                  <div className="text-sm opacity-80 mt-1">
                    {option.description}
                  </div>
                )}
              </div>
              {isSelected(option.value) && (
                <span className="ml-3">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}
```

---

## 5. Gesture Library Setup

### 5.1 Dependencies

```json
{
  "dependencies": {
    "@use-gesture/react": "^10.3.0",
    "react-spring": "^9.7.3"
  }
}
```

### 5.2 Gesture Utilities

**File:** `frontend/src/lib/gestures.ts`

```typescript
import { useGesture } from '@use-gesture/react';
import { useSpring, config } from 'react-spring';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Platform } from './platform';

export interface SwipeGestureConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // pixels
  haptic?: boolean;
}

/**
 * Hook for swipe gestures
 */
export function useSwipeGesture(config: SwipeGestureConfig) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    haptic = true
  } = config;
  
  const bind = useGesture({
    onDrag: ({ movement: [mx, my], direction: [dx, dy], velocity, last }) => {
      if (!last) return;
      
      const absX = Math.abs(mx);
      const absY = Math.abs(my);
      
      // Determine if horizontal or vertical swipe
      if (absX > absY && absX > threshold) {
        // Horizontal swipe
        if (dx > 0 && onSwipeRight) {
          if (haptic && Platform.isNative()) {
            Haptics.impact({ style: ImpactStyle.Light });
          }
          onSwipeRight();
        } else if (dx < 0 && onSwipeLeft) {
          if (haptic && Platform.isNative()) {
            Haptics.impact({ style: ImpactStyle.Light });
          }
          onSwipeLeft();
        }
      } else if (absY > absX && absY > threshold) {
        // Vertical swipe
        if (dy > 0 && onSwipeDown) {
          if (haptic && Platform.isNative()) {
            Haptics.impact({ style: ImpactStyle.Light });
          }
          onSwipeDown();
        } else if (dy < 0 && onSwipeUp) {
          if (haptic && Platform.isNative()) {
            Haptics.impact({ style: ImpactStyle.Light });
          }
          onSwipeUp();
        }
      }
    }
  });
  
  return bind;
}

/**
 * Hook for long press gesture
 */
export interface LongPressConfig {
  onLongPress: () => void;
  delay?: number; // milliseconds
  haptic?: boolean;
}

export function useLongPress(config: LongPressConfig) {
  const { onLongPress, delay = 500, haptic = true } = config;
  
  const bind = useGesture({
    onDrag: ({ tap, elapsedTime }) => {
      if (tap && elapsedTime > delay) {
        if (haptic && Platform.isNative()) {
          Haptics.impact({ style: ImpactStyle.Medium });
        }
        onLongPress();
      }
    }
  });
  
  return bind;
}

/**
 * Hook for pull-to-refresh gesture
 */
export interface PullToRefreshConfig {
  onRefresh: () => Promise<void>;
  threshold?: number;
  haptic?: boolean;
}

export function usePullToRefresh(config: PullToRefreshConfig) {
  const { onRefresh, threshold = 80, haptic = true } = config;
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  
  const [{ y }, api] = useSpring(() => ({ y: 0 }));
  
  const bind = useGesture({
    onDrag: async ({ movement: [, my], velocity, last, direction: [, dy] }) => {
      // Only allow pull down from top
      if (my < 0) return;
      
      if (last) {
        if (my > threshold && dy > 0) {
          // Trigger refresh
          setIsRefreshing(true);
          
          if (haptic && Platform.isNative()) {
            Haptics.impact({ style: ImpactStyle.Medium });
          }
          
          api.start({ y: threshold });
          await onRefresh();
          api.start({ y: 0 });
          setIsRefreshing(false);
        } else {
          // Snap back
          api.start({ y: 0 });
        }
      } else {
        // Follow finger
        api.start({ y: my, immediate: true });
      }
    }
  });
  
  return { bind, y, isRefreshing };
}

/**
 * Hook for pinch-to-zoom gesture
 */
export interface PinchZoomConfig {
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
  onZoomChange?: (scale: number) => void;
}

export function usePinchZoom(config: PinchZoomConfig = {}) {
  const {
    minScale = 0.5,
    maxScale = 3,
    initialScale = 1,
    onZoomChange
  } = config;
  
  const [{ scale }, api] = useSpring(() => ({ 
    scale: initialScale,
    config: config.default
  }));
  
  const bind = useGesture({
    onPinch: ({ offset: [s], last }) => {
      const newScale = Math.max(minScale, Math.min(maxScale, s));
      api.start({ scale: newScale });
      
      if (last && onZoomChange) {
        onZoomChange(newScale);
      }
    }
  });
  
  return { bind, scale };
}
```

---

## 6. Mobile Theme Configuration

### 6.1 Theme Variables

**File:** `frontend/src/styles/mobile-theme.css`

```css
@layer base {
  .mobile-theme {
    /* Mobile-optimized colors */
    --mobile-bg-primary: hsl(0 0% 0%); /* True black for OLED */
    --mobile-bg-elevated: hsl(0 0% 11%);
    --mobile-bg-overlay: hsl(0 0% 15%);
    
    --mobile-text-primary: hsl(0 0% 92%);
    --mobile-text-secondary: hsl(0 0% 56%);
    --mobile-text-tertiary: hsl(0 0% 40%);
    
    --mobile-border-subtle: hsl(0 0% 17%);
    --mobile-border-default: hsl(0 0% 24%);
    
    /* Mobile-specific accent colors */
    --mobile-accent-blue: hsl(211 100% 50%);
    --mobile-accent-green: hsl(142 76% 36%);
    --mobile-accent-orange: hsl(28 100% 52%);
    --mobile-accent-red: hsl(4 90% 58%);
    
    /* Touch feedback */
    --mobile-touch-highlight: hsla(211 100% 50% / 0.1);
    --mobile-touch-active: hsla(211 100% 50% / 0.2);
    
    /* Shadows for mobile */
    --mobile-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
    --mobile-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
    --mobile-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5);
    --mobile-shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.6);
  }
  
  /* Apply mobile theme on small screens */
  @media (max-width: 767px) {
    :root {
      --background: var(--mobile-bg-primary);
      --foreground: var(--mobile-text-primary);
      --muted: var(--mobile-bg-elevated);
      --muted-foreground: var(--mobile-text-secondary);
      --border: var(--mobile-border-default);
    }
  }
}
```

### 6.2 Typography Scale

**File:** `frontend/src/styles/mobile-typography.css`

```css
@layer base {
  /* Mobile typography scale */
  .mobile-text-xs { font-size: 12px; line-height: 16px; }
  .mobile-text-sm { font-size: 14px; line-height: 20px; }
  .mobile-text-base { font-size: 16px; line-height: 24px; }
  .mobile-text-lg { font-size: 18px; line-height: 28px; }
  .mobile-text-xl { font-size: 20px; line-height: 28px; }
  .mobile-text-2xl { font-size: 24px; line-height: 32px; }
  .mobile-text-3xl { font-size: 30px; line-height: 36px; }
  
  /* Mobile font weights */
  .mobile-font-regular { font-weight: 400; }
  .mobile-font-medium { font-weight: 500; }
  .mobile-font-semibold { font-weight: 600; }
  .mobile-font-bold { font-weight: 700; }
  
  /* Mobile-optimized line heights */
  @media (max-width: 767px) {
    body {
      font-size: 16px; /* Prevent zoom on input focus */
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    /* Headings */
    h1 { font-size: 24px; line-height: 32px; font-weight: 700; }
    h2 { font-size: 20px; line-height: 28px; font-weight: 600; }
    h3 { font-size: 18px; line-height: 28px; font-weight: 600; }
    h4 { font-size: 16px; line-height: 24px; font-weight: 600; }
    
    /* Paragraphs */
    p { font-size: 16px; line-height: 24px; }
    
    /* Code */
    code {
      font-size: 14px;
      line-height: 20px;
      font-family: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace;
    }
  }
}
```

---

## 7. Safe Area Handling

### 7.1 Safe Area Component

**File:** `frontend/src/components/mobile/SafeArea.tsx`

```typescript
import React from 'react';
import { cn } from '@/lib/utils';

export interface SafeAreaProps {
  children: React.ReactNode;
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
  className?: string;
}

/**
 * Component that adds safe area padding for notch/Dynamic Island
 */
export function SafeArea({
  children,
  top = false,
  bottom = false,
  left = false,
  right = false,
  className
}: SafeAreaProps) {
  return (
    <div className={cn(
      top && 'pt-safe',
      bottom && 'pb-safe',
      left && 'pl-safe',
      right && 'pr-safe',
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Hook to get safe area insets
 */
export function useSafeArea() {
  const [insets, setInsets] = React.useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  });
  
  React.useEffect(() => {
    const updateInsets = () => {
      const style = getComputedStyle(document.documentElement);
      
      setInsets({
        top: parseInt(style.getPropertyValue('--sat') || '0'),
        bottom: parseInt(style.getPropertyValue('--sab') || '0'),
        left: parseInt(style.getPropertyValue('--sal') || '0'),
        right: parseInt(style.getPropertyValue('--sar') || '0')
      });
    };
    
    updateInsets();
    window.addEventListener('resize', updateInsets);
    
    return () => window.removeEventListener('resize', updateInsets);
  }, []);
  
  return insets;
}
```

---

## 8. Testing Strategy

### 8.1 Component Tests

**File:** `frontend/src/components/mobile/__tests__/BottomNavigation.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BottomNavigation } from '../BottomNavigation';

describe('BottomNavigation', () => {
  const mockTabs = [
    {
      id: 'tasks',
      label: 'Tasks',
      icon: <span>📋</span>,
      path: '/tasks'
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: <span>💬</span>,
      path: '/chat',
      badge: 3
    },
    {
      id: 'new',
      label: 'New',
      icon: <span>➕</span>,
      onClick: vi.fn()
    }
  ];
  
  it('renders all tabs', () => {
    render(
      <BrowserRouter>
        <BottomNavigation tabs={mockTabs} />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
  });
  
  it('shows badge on tab', () => {
    render(
      <BrowserRouter>
        <BottomNavigation tabs={mockTabs} />
      </BrowserRouter>
    );
    
    expect(screen.getByText('3')).toBeInTheDocument();
  });
  
  it('calls onClick when tab is clicked', () => {
    const onTabChange = vi.fn();
    
    render(
      <BrowserRouter>
        <BottomNavigation tabs={mockTabs} onTabChange={onTabChange} />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByText('New'));
    expect(mockTabs[2].onClick).toHaveBeenCalled();
    expect(onTabChange).toHaveBeenCalledWith('new');
  });
  
  it('disables tab when disabled prop is true', () => {
    const disabledTabs = [
      ...mockTabs,
      {
        id: 'disabled',
        label: 'Disabled',
        icon: <span>🚫</span>,
        disabled: true
      }
    ];
    
    render(
      <BrowserRouter>
        <BottomNavigation tabs={disabledTabs} />
      </BrowserRouter>
    );
    
    const disabledButton = screen.getByText('Disabled').closest('button');
    expect(disabledButton).toBeDisabled();
  });
});
```

### 8.2 Device Testing Matrix

| Device | Screen Size | Test Scenarios |
|--------|-------------|----------------|
| **iPhone SE** | 375x667 | Small screen, safe area (notch) |
| **iPhone 14 Pro** | 393x852 | Dynamic Island, standard size |
| **Pixel 7** | 412x915 | Android, standard size |
| **iPad Mini** | 768x1024 | Tablet, landscape mode |

### 8.3 Manual Testing Checklist

**Bottom Navigation:**
- [ ] All tabs render correctly
- [ ] Active tab is highlighted
- [ ] Badge displays correctly
- [ ] Haptic feedback works (native only)
- [ ] Navigation works on tap
- [ ] Safe area padding applied
- [ ] Disabled state works

**Bottom Sheet:**
- [ ] Opens with animation
- [ ] Drag handle works
- [ ] Swipe down to dismiss
- [ ] Backdrop dismisses sheet
- [ ] Snap points work correctly
- [ ] Content scrolls properly
- [ ] Safe area padding applied

**Gestures:**
- [ ] Swipe left/right works
- [ ] Long press triggers
- [ ] Pull to refresh works
- [ ] Pinch to zoom works
- [ ] Haptic feedback on gestures

---

## 9. Performance Targets

### 9.1 Bundle Size

| Asset | Target | Maximum |
|-------|--------|---------|
| **Initial JS** | <200KB | 250KB |
| **Initial CSS** | <30KB | 50KB |
| **Total (gzipped)** | <300KB | 500KB |

### 9.2 Runtime Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| **First Paint** | <1.0s | Lighthouse |
| **Time to Interactive** | <1.5s | Lighthouse |
| **Frame Rate** | 60fps | Chrome DevTools |
| **Animation Jank** | <5% | Chrome DevTools |

### 9.3 Monitoring

```typescript
// Performance monitoring utility
export function measurePerformance(name: string, fn: () => void) {
  const start = performance.now();
  fn();
  const end = performance.now();
  
  console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
  
  // Send to analytics in production
  if (import.meta.env.PROD) {
    // analytics.track('performance', { name, duration: end - start });
  }
}
```

---

## 10. Deliverables Checklist

### Week 1
- [ ] Capacitor installed and configured
- [ ] Android project created
- [ ] Platform detection utilities
- [ ] Mobile breakpoints configured
- [ ] CSS variables for mobile
- [ ] Safe area handling

### Week 2
- [ ] Bottom navigation component
- [ ] Bottom sheet component
- [ ] Action sheet variant
- [ ] Selection sheet variant
- [ ] Gesture library integrated
- [ ] Mobile theme applied
- [ ] Component tests written
- [ ] Device testing completed

---

## 11. Next Steps

After Phase 1 completion:
1. **Phase 2 Planning** - Core views (Kanban, Chat, Diffs, Preview)
2. **Design Review** - Validate mobile components with design team
3. **User Testing** - Test foundation with 3-5 users
4. **Performance Audit** - Measure bundle size and runtime performance

---

## Appendix

### A. Useful Commands

```bash
# Development
npm run dev                    # Start dev server
npx cap sync                   # Sync web assets to native
npx cap open android           # Open in Android Studio

# Building
npm run build                  # Build web assets
cd android && ./gradlew assembleDebug  # Build APK

# Testing
npm run test                   # Run unit tests
npm run test:e2e              # Run E2E tests (if configured)

# Debugging
npx cap run android --livereload  # Run with live reload
adb logcat                     # View Android logs
```

### B. Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [use-gesture Documentation](https://use-gesture.netlify.app/)
- [React Spring Documentation](https://www.react-spring.dev/)
- [Material Design Guidelines](https://m3.material.io/)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-11  
**Status:** ✅ Ready for Implementation
