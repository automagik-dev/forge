# Component API Contracts & TypeScript Interfaces

**Purpose:** Define all TypeScript interfaces, types, and API contracts for mobile-specific components  
**Status:** 📋 Planning Complete  
**Last Updated:** 2025-11-11

---

## Table of Contents

1. [Core Mobile Types](#core-mobile-types)
2. [Navigation Components](#navigation-components)
3. [Bottom Sheet Components](#bottom-sheet-components)
4. [Gesture System](#gesture-system)
5. [Mobile Layout Components](#mobile-layout-components)
6. [Mobile-Optimized Views](#mobile-optimized-views)
7. [Native Feature Interfaces](#native-feature-interfaces)
8. [State Management](#state-management)

---

## 1. Core Mobile Types

### Platform Detection

```typescript
/**
 * Platform information
 */
export type PlatformType = 'web' | 'android' | 'ios';

export interface PlatformInfo {
  /** Current platform */
  platform: PlatformType;
  /** Is running as native app */
  isNative: boolean;
  /** Is running on Android */
  isAndroid: boolean;
  /** Is running on iOS */
  isIOS: boolean;
  /** Is running in web browser */
  isWeb: boolean;
  /** Check if plugin is available */
  isPluginAvailable: (pluginName: string) => boolean;
}
```

### Viewport & Screen

```typescript
/**
 * Viewport dimensions
 */
export interface ViewportDimensions {
  width: number;
  height: number;
  /** Dynamic viewport height (accounts for browser chrome) */
  dvh: number;
}

/**
 * Safe area insets (for notch/Dynamic Island)
 */
export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Screen orientation
 */
export type ScreenOrientation = 'portrait' | 'landscape';

export interface ScreenInfo {
  orientation: ScreenOrientation;
  dimensions: ViewportDimensions;
  safeArea: SafeAreaInsets;
  /** Pixel density ratio */
  pixelRatio: number;
}
```

### Touch & Gesture

```typescript
/**
 * Touch point
 */
export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

/**
 * Swipe direction
 */
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

/**
 * Gesture velocity
 */
export interface GestureVelocity {
  x: number;
  y: number;
}
```

---

## 2. Navigation Components

### Bottom Navigation

```typescript
/**
 * Bottom navigation tab configuration
 */
export interface BottomNavTab {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Icon component (default state) */
  icon: React.ReactNode;
  /** Icon component (active state) */
  activeIcon?: React.ReactNode;
  /** Navigation path (if using React Router) */
  path?: string;
  /** Custom click handler (if not using path) */
  onClick?: () => void;
  /** Badge content (number or string) */
  badge?: number | string;
  /** Disabled state */
  disabled?: boolean;
  /** Accessibility label */
  ariaLabel?: string;
}

/**
 * Bottom navigation component props
 */
export interface BottomNavigationProps {
  /** Array of tabs to display */
  tabs: BottomNavTab[];
  /** Additional CSS classes */
  className?: string;
  /** Callback when tab changes */
  onTabChange?: (tabId: string) => void;
  /** Show labels (default: true) */
  showLabels?: boolean;
  /** Compact mode (smaller height) */
  compact?: boolean;
}

/**
 * Bottom navigation state
 */
export interface BottomNavigationState {
  /** Currently active tab ID */
  activeTab: string;
  /** Is navigation visible */
  visible: boolean;
  /** Badge counts per tab */
  badges: Record<string, number | string>;
}
```

### Top Bar (Mobile Header)

```typescript
/**
 * Mobile header action button
 */
export interface MobileHeaderAction {
  /** Unique identifier */
  id: string;
  /** Icon component */
  icon: React.ReactNode;
  /** Click handler */
  onClick: () => void;
  /** Accessibility label */
  ariaLabel: string;
  /** Disabled state */
  disabled?: boolean;
  /** Badge content */
  badge?: number | string;
}

/**
 * Mobile header props
 */
export interface MobileHeaderProps {
  /** Page title */
  title?: string;
  /** Subtitle */
  subtitle?: string;
  /** Show back button */
  showBack?: boolean;
  /** Custom back handler */
  onBack?: () => void;
  /** Right-side actions */
  actions?: MobileHeaderAction[];
  /** Additional CSS classes */
  className?: string;
  /** Transparent background */
  transparent?: boolean;
  /** Sticky header */
  sticky?: boolean;
}
```

---

## 3. Bottom Sheet Components

### Base Bottom Sheet

```typescript
/**
 * Bottom sheet snap point (percentage of viewport height)
 */
export type SnapPoint = number; // 0-100

/**
 * Bottom sheet props
 */
export interface BottomSheetProps {
  /** Is sheet open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Sheet content */
  children: React.ReactNode;
  /** Sheet title */
  title?: string;
  /** Sheet description */
  description?: string;
  /** Snap points (percentages) */
  snapPoints?: SnapPoint[];
  /** Initial snap point index */
  initialSnap?: number;
  /** Can be dismissed by user */
  dismissible?: boolean;
  /** Show drag handle */
  showHandle?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Content area CSS classes */
  contentClassName?: string;
  /** Callback when snap point changes */
  onSnapChange?: (snapIndex: number) => void;
  /** Prevent backdrop click dismiss */
  preventBackdropDismiss?: boolean;
}

/**
 * Bottom sheet state
 */
export interface BottomSheetState {
  /** Current snap point index */
  currentSnap: number;
  /** Is user dragging */
  isDragging: boolean;
  /** Current Y position during drag */
  dragY: number;
}
```

### Action Sheet

```typescript
/**
 * Action sheet action
 */
export interface ActionSheetAction {
  /** Action label */
  label: string;
  /** Action icon */
  icon?: React.ReactNode;
  /** Click handler */
  onClick: () => void;
  /** Action variant */
  variant?: 'default' | 'destructive' | 'primary';
  /** Disabled state */
  disabled?: boolean;
  /** Show loading spinner */
  loading?: boolean;
}

/**
 * Action sheet props
 */
export interface ActionSheetProps extends Omit<BottomSheetProps, 'children'> {
  /** Array of actions */
  actions: ActionSheetAction[];
  /** Show cancel button */
  showCancel?: boolean;
  /** Cancel button label */
  cancelLabel?: string;
}
```

### Selection Sheet

```typescript
/**
 * Selection option
 */
export interface SelectionOption<T = string> {
  /** Option value */
  value: T;
  /** Display label */
  label: string;
  /** Optional description */
  description?: string;
  /** Option icon */
  icon?: React.ReactNode;
  /** Disabled state */
  disabled?: boolean;
  /** Custom metadata */
  metadata?: Record<string, any>;
}

/**
 * Selection sheet props
 */
export interface SelectionSheetProps<T = string> 
  extends Omit<BottomSheetProps, 'children'> {
  /** Available options */
  options: SelectionOption<T>[];
  /** Current value(s) */
  value?: T | T[];
  /** Allow multiple selection */
  multiple?: boolean;
  /** Change handler */
  onChange: (value: T | T[]) => void;
  /** Enable search */
  searchable?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Empty state message */
  emptyMessage?: string;
  /** Show checkmarks for selected items */
  showCheckmarks?: boolean;
}
```

### Form Sheet

```typescript
/**
 * Form field configuration
 */
export interface FormSheetField {
  /** Field name */
  name: string;
  /** Field label */
  label: string;
  /** Field type */
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file';
  /** Placeholder text */
  placeholder?: string;
  /** Required field */
  required?: boolean;
  /** Validation rules */
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    custom?: (value: any) => string | null; // Returns error message or null
  };
  /** Options (for select/radio) */
  options?: SelectionOption[];
  /** Default value */
  defaultValue?: any;
}

/**
 * Form sheet props
 */
export interface FormSheetProps extends Omit<BottomSheetProps, 'children'> {
  /** Form fields */
  fields: FormSheetField[];
  /** Submit handler */
  onSubmit: (values: Record<string, any>) => void | Promise<void>;
  /** Submit button label */
  submitLabel?: string;
  /** Show cancel button */
  showCancel?: boolean;
  /** Cancel button label */
  cancelLabel?: string;
  /** Initial form values */
  initialValues?: Record<string, any>;
  /** Is submitting */
  loading?: boolean;
}
```

---

## 4. Gesture System

### Swipe Gestures

```typescript
/**
 * Swipe gesture configuration
 */
export interface SwipeGestureConfig {
  /** Swipe left handler */
  onSwipeLeft?: () => void;
  /** Swipe right handler */
  onSwipeRight?: () => void;
  /** Swipe up handler */
  onSwipeUp?: () => void;
  /** Swipe down handler */
  onSwipeDown?: () => void;
  /** Minimum distance to trigger (pixels) */
  threshold?: number;
  /** Enable haptic feedback */
  haptic?: boolean;
  /** Prevent default browser behavior */
  preventDefault?: boolean;
}

/**
 * Swipe gesture state
 */
export interface SwipeGestureState {
  /** Is currently swiping */
  isSwiping: boolean;
  /** Swipe direction */
  direction: SwipeDirection | null;
  /** Distance swiped */
  distance: number;
  /** Swipe velocity */
  velocity: GestureVelocity;
}
```

### Long Press

```typescript
/**
 * Long press configuration
 */
export interface LongPressConfig {
  /** Long press handler */
  onLongPress: () => void;
  /** Delay before triggering (ms) */
  delay?: number;
  /** Enable haptic feedback */
  haptic?: boolean;
  /** Show visual feedback */
  showFeedback?: boolean;
}

/**
 * Long press state
 */
export interface LongPressState {
  /** Is currently pressing */
  isPressing: boolean;
  /** Time elapsed (ms) */
  elapsed: number;
  /** Has triggered */
  triggered: boolean;
}
```

### Pull to Refresh

```typescript
/**
 * Pull to refresh configuration
 */
export interface PullToRefreshConfig {
  /** Refresh handler */
  onRefresh: () => Promise<void>;
  /** Pull distance threshold (pixels) */
  threshold?: number;
  /** Enable haptic feedback */
  haptic?: boolean;
  /** Custom loading indicator */
  loadingIndicator?: React.ReactNode;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Pull to refresh state
 */
export interface PullToRefreshState {
  /** Is currently pulling */
  isPulling: boolean;
  /** Is refreshing */
  isRefreshing: boolean;
  /** Pull distance */
  pullDistance: number;
  /** Pull progress (0-1) */
  progress: number;
}
```

### Pinch to Zoom

```typescript
/**
 * Pinch zoom configuration
 */
export interface PinchZoomConfig {
  /** Minimum scale */
  minScale?: number;
  /** Maximum scale */
  maxScale?: number;
  /** Initial scale */
  initialScale?: number;
  /** Zoom change handler */
  onZoomChange?: (scale: number) => void;
  /** Enable haptic feedback */
  haptic?: boolean;
}

/**
 * Pinch zoom state
 */
export interface PinchZoomState {
  /** Current scale */
  scale: number;
  /** Is currently pinching */
  isPinching: boolean;
  /** Zoom center point */
  center: TouchPoint;
}
```

---

## 5. Mobile Layout Components

### Mobile Container

```typescript
/**
 * Mobile container props
 */
export interface MobileContainerProps {
  /** Container content */
  children: React.ReactNode;
  /** Show header */
  showHeader?: boolean;
  /** Header props */
  header?: MobileHeaderProps;
  /** Show bottom navigation */
  showBottomNav?: boolean;
  /** Bottom navigation props */
  bottomNav?: BottomNavigationProps;
  /** Additional CSS classes */
  className?: string;
  /** Padding configuration */
  padding?: {
    top?: boolean;
    bottom?: boolean;
    left?: boolean;
    right?: boolean;
  };
  /** Safe area configuration */
  safeArea?: {
    top?: boolean;
    bottom?: boolean;
    left?: boolean;
    right?: boolean;
  };
}
```

### Floating Action Button (FAB)

```typescript
/**
 * FAB position
 */
export type FABPosition = 
  | 'bottom-right' 
  | 'bottom-center' 
  | 'bottom-left'
  | 'top-right'
  | 'top-left';

/**
 * FAB props
 */
export interface FABProps {
  /** Click handler */
  onClick: () => void;
  /** Button icon */
  icon: React.ReactNode;
  /** Button label (optional) */
  label?: string;
  /** Position on screen */
  position?: FABPosition;
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'destructive';
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Hide on scroll down */
  hideOnScroll?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Accessibility label */
  ariaLabel: string;
}

/**
 * FAB state
 */
export interface FABState {
  /** Is visible */
  visible: boolean;
  /** Is expanded (showing label) */
  expanded: boolean;
}
```

### Mobile Card

```typescript
/**
 * Mobile card props
 */
export interface MobileCardProps {
  /** Card content */
  children: React.ReactNode;
  /** Card title */
  title?: string;
  /** Card subtitle */
  subtitle?: string;
  /** Leading icon/image */
  leading?: React.ReactNode;
  /** Trailing icon/action */
  trailing?: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Swipe actions */
  swipeActions?: {
    left?: ActionSheetAction[];
    right?: ActionSheetAction[];
  };
  /** Additional CSS classes */
  className?: string;
  /** Elevated style */
  elevated?: boolean;
  /** Selected state */
  selected?: boolean;
}
```

---

## 6. Mobile-Optimized Views

### Mobile Kanban

```typescript
/**
 * Kanban column (mobile)
 */
export interface MobileKanbanColumn {
  /** Column ID */
  id: string;
  /** Column title */
  title: string;
  /** Column color */
  color?: string;
  /** Task count */
  count: number;
  /** Is collapsed */
  collapsed?: boolean;
}

/**
 * Mobile kanban props
 */
export interface MobileKanbanProps {
  /** Columns configuration */
  columns: MobileKanbanColumn[];
  /** Current active column */
  activeColumn: string;
  /** Column change handler */
  onColumnChange: (columnId: string) => void;
  /** Task cards */
  children: React.ReactNode;
  /** Pull to refresh handler */
  onRefresh?: () => Promise<void>;
  /** Additional CSS classes */
  className?: string;
}
```

### Mobile Chat

```typescript
/**
 * Chat message type
 */
export type ChatMessageType = 
  | 'user' 
  | 'assistant' 
  | 'system' 
  | 'tool' 
  | 'error';

/**
 * Chat message
 */
export interface ChatMessage {
  /** Message ID */
  id: string;
  /** Message type */
  type: ChatMessageType;
  /** Message content */
  content: string;
  /** Timestamp */
  timestamp: Date;
  /** Sender name */
  sender?: string;
  /** Sender avatar */
  avatar?: string;
  /** Attachments */
  attachments?: ChatAttachment[];
  /** Is collapsed */
  collapsed?: boolean;
  /** Metadata */
  metadata?: Record<string, any>;
}

/**
 * Chat attachment
 */
export interface ChatAttachment {
  /** Attachment ID */
  id: string;
  /** Attachment type */
  type: 'image' | 'file' | 'code' | 'diff';
  /** File name */
  name: string;
  /** File URL */
  url: string;
  /** File size (bytes) */
  size?: number;
  /** MIME type */
  mimeType?: string;
  /** Thumbnail URL */
  thumbnail?: string;
}

/**
 * Mobile chat props
 */
export interface MobileChatProps {
  /** Chat messages */
  messages: ChatMessage[];
  /** Is loading more messages */
  loading?: boolean;
  /** Load more handler */
  onLoadMore?: () => void;
  /** Message click handler */
  onMessageClick?: (message: ChatMessage) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Chat input props
 */
export interface ChatInputProps {
  /** Input value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Submit handler */
  onSubmit: () => void;
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Show voice input */
  showVoice?: boolean;
  /** Voice input handler */
  onVoiceInput?: () => void;
  /** Show attachments */
  showAttachments?: boolean;
  /** Attachment handler */
  onAttachment?: () => void;
  /** Current attachments */
  attachments?: ChatAttachment[];
  /** Remove attachment handler */
  onRemoveAttachment?: (id: string) => void;
  /** Additional CSS classes */
  className?: string;
}
```

### Mobile Diff Viewer

```typescript
/**
 * Diff file
 */
export interface DiffFile {
  /** File path */
  path: string;
  /** Old path (if renamed) */
  oldPath?: string;
  /** Change type */
  changeType: 'added' | 'modified' | 'deleted' | 'renamed';
  /** Additions count */
  additions: number;
  /** Deletions count */
  deletions: number;
  /** Diff hunks */
  hunks: DiffHunk[];
}

/**
 * Diff hunk
 */
export interface DiffHunk {
  /** Hunk header */
  header: string;
  /** Old start line */
  oldStart: number;
  /** Old line count */
  oldLines: number;
  /** New start line */
  newStart: number;
  /** New line count */
  newLines: number;
  /** Diff lines */
  lines: DiffLine[];
}

/**
 * Diff line
 */
export interface DiffLine {
  /** Line type */
  type: 'context' | 'addition' | 'deletion';
  /** Line content */
  content: string;
  /** Old line number */
  oldLineNumber?: number;
  /** New line number */
  newLineNumber?: number;
}

/**
 * Mobile diff viewer props
 */
export interface MobileDiffViewerProps {
  /** Diff files */
  files: DiffFile[];
  /** Current file index */
  currentFile: number;
  /** File change handler */
  onFileChange: (index: number) => void;
  /** Line click handler (for comments) */
  onLineClick?: (file: DiffFile, line: DiffLine) => void;
  /** Additional CSS classes */
  className?: string;
}
```

---

## 7. Native Feature Interfaces

### Camera

```typescript
/**
 * Camera photo options
 */
export interface CameraPhotoOptions {
  /** Photo quality (0-100) */
  quality?: number;
  /** Allow editing */
  allowEditing?: boolean;
  /** Result type */
  resultType?: 'uri' | 'base64' | 'dataUrl';
  /** Save to gallery */
  saveToGallery?: boolean;
  /** Camera direction */
  direction?: 'rear' | 'front';
  /** Photo width */
  width?: number;
  /** Photo height */
  height?: number;
}

/**
 * Camera photo result
 */
export interface CameraPhoto {
  /** Photo data (based on resultType) */
  data: string;
  /** Photo format */
  format: string;
  /** Photo path (if saved) */
  path?: string;
  /** Exif data */
  exif?: Record<string, any>;
}
```

### Haptics

```typescript
/**
 * Haptic impact style
 */
export type HapticImpactStyle = 'light' | 'medium' | 'heavy';

/**
 * Haptic notification type
 */
export type HapticNotificationType = 'success' | 'warning' | 'error';

/**
 * Haptics interface
 */
export interface HapticsInterface {
  /** Trigger impact feedback */
  impact: (style: HapticImpactStyle) => Promise<void>;
  /** Trigger notification feedback */
  notification: (type: HapticNotificationType) => Promise<void>;
  /** Trigger selection feedback */
  selection: () => Promise<void>;
  /** Vibrate for duration */
  vibrate: (duration?: number) => Promise<void>;
}
```

### Push Notifications

```typescript
/**
 * Push notification
 */
export interface PushNotification {
  /** Notification ID */
  id: string;
  /** Notification title */
  title: string;
  /** Notification body */
  body: string;
  /** Notification data */
  data?: Record<string, any>;
  /** Badge count */
  badge?: number;
  /** Sound */
  sound?: string;
}

/**
 * Push notification registration
 */
export interface PushNotificationRegistration {
  /** Device token */
  token: string;
  /** Platform */
  platform: 'android' | 'ios';
}

/**
 * Push notifications interface
 */
export interface PushNotificationsInterface {
  /** Request permission */
  requestPermission: () => Promise<boolean>;
  /** Register for notifications */
  register: () => Promise<PushNotificationRegistration>;
  /** Get delivered notifications */
  getDelivered: () => Promise<PushNotification[]>;
  /** Remove delivered notification */
  removeDelivered: (id: string) => Promise<void>;
  /** Remove all delivered */
  removeAllDelivered: () => Promise<void>;
}
```

### Share

```typescript
/**
 * Share options
 */
export interface ShareOptions {
  /** Title */
  title?: string;
  /** Text content */
  text?: string;
  /** URL to share */
  url?: string;
  /** Files to share */
  files?: string[];
  /** Dialog title (Android) */
  dialogTitle?: string;
}

/**
 * Share result
 */
export interface ShareResult {
  /** Activity type (iOS) */
  activityType?: string;
}

/**
 * Share interface
 */
export interface ShareInterface {
  /** Share content */
  share: (options: ShareOptions) => Promise<ShareResult>;
  /** Can share */
  canShare: () => Promise<boolean>;
}
```

---

## 8. State Management

### Mobile App State

```typescript
/**
 * Mobile app state
 */
export interface MobileAppState {
  /** Platform info */
  platform: PlatformInfo;
  /** Screen info */
  screen: ScreenInfo;
  /** Is keyboard visible */
  keyboardVisible: boolean;
  /** Keyboard height */
  keyboardHeight: number;
  /** Network status */
  networkStatus: NetworkStatus;
  /** App state */
  appState: AppState;
}

/**
 * Network status
 */
export interface NetworkStatus {
  /** Is connected */
  connected: boolean;
  /** Connection type */
  connectionType: 'wifi' | 'cellular' | 'none' | 'unknown';
  /** Is fast connection */
  fastConnection: boolean;
}

/**
 * App state
 */
export type AppState = 'active' | 'background' | 'inactive';
```

### Mobile Navigation State

```typescript
/**
 * Mobile navigation state
 */
export interface MobileNavigationState {
  /** Current route */
  currentRoute: string;
  /** Navigation history */
  history: string[];
  /** Can go back */
  canGoBack: boolean;
  /** Bottom nav visible */
  bottomNavVisible: boolean;
  /** Active bottom nav tab */
  activeTab: string;
}
```

### Mobile UI State

```typescript
/**
 * Mobile UI state
 */
export interface MobileUIState {
  /** Active bottom sheet */
  activeSheet: string | null;
  /** Active modal */
  activeModal: string | null;
  /** Toast messages */
  toasts: ToastMessage[];
  /** Loading states */
  loading: Record<string, boolean>;
  /** FAB visible */
  fabVisible: boolean;
}

/**
 * Toast message
 */
export interface ToastMessage {
  /** Toast ID */
  id: string;
  /** Toast message */
  message: string;
  /** Toast type */
  type: 'info' | 'success' | 'warning' | 'error';
  /** Duration (ms) */
  duration?: number;
  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

---

## Usage Examples

### Example 1: Bottom Navigation

```typescript
import { BottomNavigation, BottomNavTab } from '@/components/mobile';

const tabs: BottomNavTab[] = [
  {
    id: 'tasks',
    label: 'Tasks',
    icon: <LayoutGrid />,
    activeIcon: <LayoutGrid strokeWidth={2.5} />,
    path: '/tasks',
    badge: 5
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: <MessageSquare />,
    path: '/chat'
  }
];

function App() {
  return (
    <BottomNavigation 
      tabs={tabs}
      onTabChange={(id) => console.log('Tab changed:', id)}
    />
  );
}
```

### Example 2: Bottom Sheet

```typescript
import { BottomSheet, useBottomSheet } from '@/components/mobile';

function MyComponent() {
  const sheet = useBottomSheet();
  
  return (
    <>
      <button onClick={sheet.open}>Open Sheet</button>
      
      <BottomSheet
        open={sheet.isOpen}
        onClose={sheet.close}
        title="Select Option"
        snapPoints={[50, 90]}
      >
        <div>Sheet content here</div>
      </BottomSheet>
    </>
  );
}
```

### Example 3: Swipe Gesture

```typescript
import { useSwipeGesture } from '@/lib/gestures';

function SwipeableCard() {
  const bind = useSwipeGesture({
    onSwipeLeft: () => console.log('Swiped left'),
    onSwipeRight: () => console.log('Swiped right'),
    threshold: 100,
    haptic: true
  });
  
  return (
    <div {...bind()}>
      Swipe me!
    </div>
  );
}
```

---

## Type Guards

```typescript
/**
 * Type guard for platform
 */
export function isPlatform(platform: unknown): platform is PlatformType {
  return ['web', 'android', 'ios'].includes(platform as string);
}

/**
 * Type guard for swipe direction
 */
export function isSwipeDirection(dir: unknown): dir is SwipeDirection {
  return ['left', 'right', 'up', 'down'].includes(dir as string);
}

/**
 * Type guard for chat message
 */
export function isChatMessage(msg: unknown): msg is ChatMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'id' in msg &&
    'type' in msg &&
    'content' in msg
  );
}
```

---

## Validation Schemas (Zod)

```typescript
import { z } from 'zod';

/**
 * Bottom nav tab schema
 */
export const bottomNavTabSchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.any(),
  activeIcon: z.any().optional(),
  path: z.string().optional(),
  onClick: z.function().optional(),
  badge: z.union([z.number(), z.string()]).optional(),
  disabled: z.boolean().optional()
});

/**
 * Chat message schema
 */
export const chatMessageSchema = z.object({
  id: z.string(),
  type: z.enum(['user', 'assistant', 'system', 'tool', 'error']),
  content: z.string(),
  timestamp: z.date(),
  sender: z.string().optional(),
  avatar: z.string().optional(),
  attachments: z.array(z.any()).optional(),
  collapsed: z.boolean().optional(),
  metadata: z.record(z.any()).optional()
});
```

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-11  
**Status:** ✅ Complete
