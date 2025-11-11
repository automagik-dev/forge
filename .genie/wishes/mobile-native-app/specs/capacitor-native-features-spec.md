# Capacitor Native Features Specification

**Purpose:** Detailed configuration and implementation guide for all Capacitor plugins  
**Status:** 📋 Planning Complete  
**Last Updated:** 2025-11-11

---

## Table of Contents

1. [Camera Integration](#camera-integration)
2. [Push Notifications](#push-notifications)
3. [Haptic Feedback](#haptic-feedback)
4. [Share Target](#share-target)
5. [Status Bar & Keyboard](#status-bar--keyboard)
6. [App State & Lifecycle](#app-state--lifecycle)
7. [File System](#file-system)
8. [Network Status](#network-status)
9. [Testing Strategy](#testing-strategy)

---

## 1. Camera Integration

### 1.1 Plugin Configuration

**Package:** `@capacitor/camera@6.0.0`

**Android Permissions:**
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" 
                 android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

<uses-feature android:name="android.hardware.camera" android:required="false" />
<uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
```

**Capacitor Config:**
```typescript
// capacitor.config.ts
{
  plugins: {
    Camera: {
      // Android-specific
      androidxActivityVersion: '1.7.0',
      androidxExifInterfaceVersion: '1.3.6'
    }
  }
}
```

### 1.2 Implementation

**File:** `frontend/src/lib/native/camera.ts`

```typescript
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Platform } from '../platform';

export interface CameraOptions {
  quality?: number; // 0-100
  allowEditing?: boolean;
  resultType?: 'uri' | 'base64' | 'dataUrl';
  source?: 'camera' | 'photos' | 'prompt';
  saveToGallery?: boolean;
  width?: number;
  height?: number;
  correctOrientation?: boolean;
}

export interface CameraPhoto {
  data: string;
  format: string;
  path?: string;
  webPath?: string;
  exif?: any;
}

/**
 * Camera service for taking photos and selecting from gallery
 */
export class CameraService {
  /**
   * Check if camera is available
   */
  static async isAvailable(): Promise<boolean> {
    if (!Platform.isNative()) return false;
    
    try {
      const permissions = await Camera.checkPermissions();
      return permissions.camera !== 'denied';
    } catch {
      return false;
    }
  }

  /**
   * Request camera permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const result = await Camera.requestPermissions({
        permissions: ['camera', 'photos']
      });
      
      return result.camera === 'granted' && result.photos === 'granted';
    } catch (error) {
      console.error('Failed to request camera permissions:', error);
      return false;
    }
  }

  /**
   * Take a photo with camera
   */
  static async takePhoto(options: CameraOptions = {}): Promise<CameraPhoto> {
    const {
      quality = 90,
      allowEditing = false,
      resultType = 'uri',
      saveToGallery = true,
      width,
      height,
      correctOrientation = true
    } = options;

    try {
      const photo = await Camera.getPhoto({
        quality,
        allowEditing,
        resultType: this.mapResultType(resultType),
        source: CameraSource.Camera,
        saveToGallery,
        width,
        height,
        correctOrientation
      });

      return this.mapPhoto(photo, resultType);
    } catch (error) {
      console.error('Failed to take photo:', error);
      throw new Error('Failed to take photo');
    }
  }

  /**
   * Pick photo from gallery
   */
  static async pickPhoto(options: CameraOptions = {}): Promise<CameraPhoto> {
    const {
      quality = 90,
      allowEditing = false,
      resultType = 'uri',
      width,
      height,
      correctOrientation = true
    } = options;

    try {
      const photo = await Camera.getPhoto({
        quality,
        allowEditing,
        resultType: this.mapResultType(resultType),
        source: CameraSource.Photos,
        width,
        height,
        correctOrientation
      });

      return this.mapPhoto(photo, resultType);
    } catch (error) {
      console.error('Failed to pick photo:', error);
      throw new Error('Failed to pick photo');
    }
  }

  /**
   * Prompt user to choose camera or gallery
   */
  static async promptPhoto(options: CameraOptions = {}): Promise<CameraPhoto> {
    const {
      quality = 90,
      allowEditing = false,
      resultType = 'uri',
      saveToGallery = false,
      width,
      height,
      correctOrientation = true
    } = options;

    try {
      const photo = await Camera.getPhoto({
        quality,
        allowEditing,
        resultType: this.mapResultType(resultType),
        source: CameraSource.Prompt,
        saveToGallery,
        width,
        height,
        correctOrientation
      });

      return this.mapPhoto(photo, resultType);
    } catch (error) {
      console.error('Failed to get photo:', error);
      throw new Error('Failed to get photo');
    }
  }

  /**
   * Pick multiple photos from gallery
   */
  static async pickPhotos(options: CameraOptions = {}): Promise<CameraPhoto[]> {
    const {
      quality = 90,
      resultType = 'uri',
      width,
      height,
      correctOrientation = true
    } = options;

    try {
      const result = await Camera.pickImages({
        quality,
        width,
        height,
        correctOrientation
      });

      return result.photos.map(photo => this.mapPhoto(photo, resultType));
    } catch (error) {
      console.error('Failed to pick photos:', error);
      throw new Error('Failed to pick photos');
    }
  }

  private static mapResultType(type: string): CameraResultType {
    switch (type) {
      case 'base64':
        return CameraResultType.Base64;
      case 'dataUrl':
        return CameraResultType.DataUrl;
      default:
        return CameraResultType.Uri;
    }
  }

  private static mapPhoto(photo: Photo, resultType: string): CameraPhoto {
    return {
      data: photo.base64String || photo.dataUrl || photo.webPath || '',
      format: photo.format,
      path: photo.path,
      webPath: photo.webPath,
      exif: photo.exif
    };
  }
}

/**
 * React hook for camera
 */
export function useCamera() {
  const [isAvailable, setIsAvailable] = React.useState(false);
  const [hasPermission, setHasPermission] = React.useState(false);

  React.useEffect(() => {
    CameraService.isAvailable().then(setIsAvailable);
  }, []);

  const requestPermission = async () => {
    const granted = await CameraService.requestPermissions();
    setHasPermission(granted);
    return granted;
  };

  const takePhoto = (options?: CameraOptions) => 
    CameraService.takePhoto(options);

  const pickPhoto = (options?: CameraOptions) => 
    CameraService.pickPhoto(options);

  const pickPhotos = (options?: CameraOptions) => 
    CameraService.pickPhotos(options);

  return {
    isAvailable,
    hasPermission,
    requestPermission,
    takePhoto,
    pickPhoto,
    pickPhotos
  };
}
```

### 1.3 UI Integration

**File:** `frontend/src/components/mobile/ImagePicker.tsx`

```typescript
import React from 'react';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { useCamera } from '@/lib/native/camera';
import { ActionSheet } from './BottomSheet';
import { Button } from '@/components/ui/button';

export interface ImagePickerProps {
  onImageSelected: (image: CameraPhoto) => void;
  multiple?: boolean;
  maxImages?: number;
}

export function ImagePicker({ 
  onImageSelected, 
  multiple = false,
  maxImages = 10 
}: ImagePickerProps) {
  const camera = useCamera();
  const [showSheet, setShowSheet] = React.useState(false);

  const handleTakePhoto = async () => {
    if (!camera.hasPermission) {
      const granted = await camera.requestPermission();
      if (!granted) return;
    }

    try {
      const photo = await camera.takePhoto({
        quality: 85,
        allowEditing: true,
        saveToGallery: true
      });
      onImageSelected(photo);
      setShowSheet(false);
    } catch (error) {
      console.error('Failed to take photo:', error);
    }
  };

  const handlePickPhoto = async () => {
    try {
      if (multiple) {
        const photos = await camera.pickPhotos({
          quality: 85
        });
        photos.slice(0, maxImages).forEach(onImageSelected);
      } else {
        const photo = await camera.pickPhoto({
          quality: 85,
          allowEditing: true
        });
        onImageSelected(photo);
      }
      setShowSheet(false);
    } catch (error) {
      console.error('Failed to pick photo:', error);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setShowSheet(true)}
        disabled={!camera.isAvailable}
      >
        <ImageIcon className="w-4 h-4 mr-2" />
        Add Image
      </Button>

      <ActionSheet
        open={showSheet}
        onClose={() => setShowSheet(false)}
        title="Add Image"
        actions={[
          {
            label: 'Take Photo',
            icon: <Camera className="w-5 h-5" />,
            onClick: handleTakePhoto
          },
          {
            label: multiple ? 'Choose Photos' : 'Choose Photo',
            icon: <ImageIcon className="w-5 h-5" />,
            onClick: handlePickPhoto
          }
        ]}
      />
    </>
  );
}
```

---

## 2. Push Notifications

### 2.1 Plugin Configuration

**Package:** `@capacitor/push-notifications@6.0.0`

**Android Configuration:**

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<application>
  <!-- Firebase Cloud Messaging -->
  <service
    android:name=".MyFirebaseMessagingService"
    android:exported="false">
    <intent-filter>
      <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
  </service>
  
  <!-- Notification icon -->
  <meta-data
    android:name="com.google.firebase.messaging.default_notification_icon"
    android:resource="@drawable/ic_notification" />
  
  <!-- Notification color -->
  <meta-data
    android:name="com.google.firebase.messaging.default_notification_color"
    android:resource="@color/notification_color" />
</application>
```

**Firebase Setup:**
```json
// android/app/google-services.json
// Download from Firebase Console
```

### 2.2 Implementation

**File:** `frontend/src/lib/native/notifications.ts`

```typescript
import { 
  PushNotifications,
  Token,
  PushNotificationSchema,
  ActionPerformed
} from '@capacitor/push-notifications';
import { Platform } from '../platform';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  channelId?: string;
}

/**
 * Push notifications service
 */
export class NotificationsService {
  private static listeners: Array<(notification: PushNotificationSchema) => void> = [];
  private static actionListeners: Array<(action: ActionPerformed) => void> = [];

  /**
   * Initialize push notifications
   */
  static async initialize(): Promise<void> {
    if (!Platform.isNative()) return;

    // Request permission
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') {
      console.warn('Push notification permission not granted');
      return;
    }

    // Register with APNs / FCM
    await PushNotifications.register();

    // Listen for registration
    await PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token:', token.value);
      this.onRegistration(token.value);
    });

    // Listen for registration errors
    await PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Push registration error:', error);
    });

    // Listen for push notifications
    await PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('Push notification received:', notification);
        this.listeners.forEach(listener => listener(notification));
      }
    );

    // Listen for notification actions
    await PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        console.log('Push notification action:', action);
        this.actionListeners.forEach(listener => listener(action));
      }
    );
  }

  /**
   * Register notification listener
   */
  static onNotification(callback: (notification: PushNotificationSchema) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Register action listener
   */
  static onAction(callback: (action: ActionPerformed) => void) {
    this.actionListeners.push(callback);
    return () => {
      this.actionListeners = this.actionListeners.filter(l => l !== callback);
    };
  }

  /**
   * Get delivered notifications
   */
  static async getDelivered(): Promise<PushNotificationSchema[]> {
    const result = await PushNotifications.getDeliveredNotifications();
    return result.notifications;
  }

  /**
   * Remove delivered notification
   */
  static async removeDelivered(id: string): Promise<void> {
    await PushNotifications.removeDeliveredNotifications({
      notifications: [{ id, tag: '' }]
    });
  }

  /**
   * Remove all delivered notifications
   */
  static async removeAllDelivered(): Promise<void> {
    await PushNotifications.removeAllDeliveredNotifications();
  }

  /**
   * Create notification channel (Android 8+)
   */
  static async createChannel(config: {
    id: string;
    name: string;
    description?: string;
    importance?: number;
    sound?: string;
    vibration?: boolean;
    lights?: boolean;
  }): Promise<void> {
    if (!Platform.isAndroid()) return;

    await PushNotifications.createChannel({
      id: config.id,
      name: config.name,
      description: config.description || '',
      importance: config.importance || 3,
      sound: config.sound,
      vibration: config.vibration !== false,
      lights: config.lights !== false
    });
  }

  /**
   * Handle registration (send token to backend)
   */
  private static async onRegistration(token: string): Promise<void> {
    try {
      // Send token to backend
      await fetch('/api/notifications/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          platform: Platform.getPlatform()
        })
      });
    } catch (error) {
      console.error('Failed to register push token:', error);
    }
  }
}

/**
 * React hook for push notifications
 */
export function usePushNotifications() {
  const [initialized, setInitialized] = React.useState(false);
  const [notifications, setNotifications] = React.useState<PushNotificationSchema[]>([]);

  React.useEffect(() => {
    NotificationsService.initialize().then(() => setInitialized(true));

    const unsubscribe = NotificationsService.onNotification((notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    return unsubscribe;
  }, []);

  const clearNotification = (id: string) => {
    NotificationsService.removeDelivered(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    NotificationsService.removeAllDelivered();
    setNotifications([]);
  };

  return {
    initialized,
    notifications,
    clearNotification,
    clearAll
  };
}
```

---

## 3. Haptic Feedback

### 3.1 Plugin Configuration

**Package:** `@capacitor/haptics@6.0.0`

**Android Permissions:**
```xml
<uses-permission android:name="android.permission.VIBRATE" />
```

### 3.2 Implementation

**File:** `frontend/src/lib/native/haptics.ts`

```typescript
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Platform } from '../platform';

/**
 * Haptic feedback service
 */
export class HapticsService {
  /**
   * Trigger light impact
   */
  static async light(): Promise<void> {
    if (!Platform.isNative()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }

  /**
   * Trigger medium impact
   */
  static async medium(): Promise<void> {
    if (!Platform.isNative()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }

  /**
   * Trigger heavy impact
   */
  static async heavy(): Promise<void> {
    if (!Platform.isNative()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }

  /**
   * Trigger success notification
   */
  static async success(): Promise<void> {
    if (!Platform.isNative()) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }

  /**
   * Trigger warning notification
   */
  static async warning(): Promise<void> {
    if (!Platform.isNative()) return;
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }

  /**
   * Trigger error notification
   */
  static async error(): Promise<void> {
    if (!Platform.isNative()) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }

  /**
   * Trigger selection feedback
   */
  static async selection(): Promise<void> {
    if (!Platform.isNative()) return;
    try {
      await Haptics.selectionStart();
      await Haptics.selectionChanged();
      await Haptics.selectionEnd();
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }

  /**
   * Vibrate for duration
   */
  static async vibrate(duration: number = 300): Promise<void> {
    if (!Platform.isNative()) return;
    try {
      await Haptics.vibrate({ duration });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }
}

/**
 * React hook for haptics
 */
export function useHaptics() {
  return {
    light: HapticsService.light,
    medium: HapticsService.medium,
    heavy: HapticsService.heavy,
    success: HapticsService.success,
    warning: HapticsService.warning,
    error: HapticsService.error,
    selection: HapticsService.selection,
    vibrate: HapticsService.vibrate
  };
}
```

---

## 4. Share Target

### 4.1 Plugin Configuration

**Package:** `@capacitor/share@6.0.0`

### 4.2 Implementation

**File:** `frontend/src/lib/native/share.ts`

```typescript
import { Share, ShareOptions, ShareResult } from '@capacitor/share';
import { Platform } from '../platform';

/**
 * Share service
 */
export class ShareService {
  /**
   * Check if sharing is available
   */
  static async canShare(): Promise<boolean> {
    if (!Platform.isNative()) {
      return navigator.share !== undefined;
    }
    return true;
  }

  /**
   * Share text content
   */
  static async shareText(options: {
    title?: string;
    text: string;
    url?: string;
  }): Promise<ShareResult> {
    try {
      return await Share.share({
        title: options.title,
        text: options.text,
        url: options.url,
        dialogTitle: 'Share via'
      });
    } catch (error) {
      console.error('Failed to share:', error);
      throw error;
    }
  }

  /**
   * Share URL
   */
  static async shareUrl(url: string, title?: string): Promise<ShareResult> {
    return this.shareText({ url, title, text: title || url });
  }

  /**
   * Share files
   */
  static async shareFiles(options: {
    files: string[];
    title?: string;
    text?: string;
  }): Promise<ShareResult> {
    try {
      return await Share.share({
        title: options.title,
        text: options.text,
        files: options.files,
        dialogTitle: 'Share files'
      });
    } catch (error) {
      console.error('Failed to share files:', error);
      throw error;
    }
  }

  /**
   * Share task
   */
  static async shareTask(task: {
    title: string;
    description: string;
    url: string;
  }): Promise<ShareResult> {
    return this.shareText({
      title: `Task: ${task.title}`,
      text: `${task.description}\n\nView task: ${task.url}`,
      url: task.url
    });
  }

  /**
   * Share conversation
   */
  static async shareConversation(conversation: {
    title: string;
    messages: string[];
    url: string;
  }): Promise<ShareResult> {
    const text = conversation.messages.join('\n\n');
    return this.shareText({
      title: conversation.title,
      text: `${text}\n\nView conversation: ${conversation.url}`,
      url: conversation.url
    });
  }
}

/**
 * React hook for sharing
 */
export function useShare() {
  const [canShare, setCanShare] = React.useState(false);

  React.useEffect(() => {
    ShareService.canShare().then(setCanShare);
  }, []);

  return {
    canShare,
    shareText: ShareService.shareText,
    shareUrl: ShareService.shareUrl,
    shareFiles: ShareService.shareFiles,
    shareTask: ShareService.shareTask,
    shareConversation: ShareService.shareConversation
  };
}
```

---

## 5. Status Bar & Keyboard

### 5.1 Status Bar

**Package:** `@capacitor/status-bar@6.0.0`

```typescript
import { StatusBar, Style } from '@capacitor/status-bar';
import { Platform } from '../platform';

export class StatusBarService {
  static async setDark(): Promise<void> {
    if (!Platform.isNative()) return;
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#000000' });
  }

  static async setLight(): Promise<void> {
    if (!Platform.isNative()) return;
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
  }

  static async hide(): Promise<void> {
    if (!Platform.isNative()) return;
    await StatusBar.hide();
  }

  static async show(): Promise<void> {
    if (!Platform.isNative()) return;
    await StatusBar.show();
  }
}
```

### 5.2 Keyboard

**Package:** `@capacitor/keyboard@6.0.0`

```typescript
import { Keyboard, KeyboardInfo } from '@capacitor/keyboard';
import { Platform } from '../platform';

export class KeyboardService {
  private static listeners: Array<(info: KeyboardInfo) => void> = [];

  static async initialize(): Promise<void> {
    if (!Platform.isNative()) return;

    await Keyboard.addListener('keyboardWillShow', (info: KeyboardInfo) => {
      this.listeners.forEach(listener => listener(info));
    });

    await Keyboard.addListener('keyboardWillHide', () => {
      this.listeners.forEach(listener => listener({ keyboardHeight: 0 }));
    });
  }

  static onChange(callback: (info: KeyboardInfo) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  static async show(): Promise<void> {
    if (!Platform.isNative()) return;
    await Keyboard.show();
  }

  static async hide(): Promise<void> {
    if (!Platform.isNative()) return;
    await Keyboard.hide();
  }
}

export function useKeyboard() {
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    KeyboardService.initialize();

    const unsubscribe = KeyboardService.onChange((info) => {
      setKeyboardHeight(info.keyboardHeight);
      setIsVisible(info.keyboardHeight > 0);
    });

    return unsubscribe;
  }, []);

  return {
    keyboardHeight,
    isVisible,
    show: KeyboardService.show,
    hide: KeyboardService.hide
  };
}
```

---

## 6. App State & Lifecycle

**Package:** `@capacitor/app@6.0.0`

```typescript
import { App, AppState } from '@capacitor/app';
import { Platform } from '../platform';

export class AppLifecycleService {
  private static stateListeners: Array<(state: AppState) => void> = [];

  static async initialize(): Promise<void> {
    if (!Platform.isNative()) return;

    await App.addListener('appStateChange', (state: AppState) => {
      console.log('App state changed:', state);
      this.stateListeners.forEach(listener => listener(state));
    });

    await App.addListener('backButton', () => {
      console.log('Back button pressed');
      // Handle back button
      window.history.back();
    });
  }

  static onStateChange(callback: (state: AppState) => void) {
    this.stateListeners.push(callback);
    return () => {
      this.stateListeners = this.stateListeners.filter(l => l !== callback);
    };
  }

  static async getInfo() {
    return await App.getInfo();
  }
}

export function useAppState() {
  const [state, setState] = React.useState<AppState>({ isActive: true });

  React.useEffect(() => {
    AppLifecycleService.initialize();

    const unsubscribe = AppLifecycleService.onStateChange(setState);

    return unsubscribe;
  }, []);

  return {
    isActive: state.isActive,
    isBackground: !state.isActive
  };
}
```

---

## 7. File System

**Package:** `@capacitor/filesystem@6.0.0`

```typescript
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

export class FileSystemService {
  static async writeFile(options: {
    path: string;
    data: string;
    directory?: Directory;
    encoding?: Encoding;
  }): Promise<void> {
    await Filesystem.writeFile({
      path: options.path,
      data: options.data,
      directory: options.directory || Directory.Data,
      encoding: options.encoding || Encoding.UTF8
    });
  }

  static async readFile(options: {
    path: string;
    directory?: Directory;
    encoding?: Encoding;
  }): Promise<string> {
    const result = await Filesystem.readFile({
      path: options.path,
      directory: options.directory || Directory.Data,
      encoding: options.encoding || Encoding.UTF8
    });
    return result.data as string;
  }

  static async deleteFile(options: {
    path: string;
    directory?: Directory;
  }): Promise<void> {
    await Filesystem.deleteFile({
      path: options.path,
      directory: options.directory || Directory.Data
    });
  }

  static async mkdir(options: {
    path: string;
    directory?: Directory;
    recursive?: boolean;
  }): Promise<void> {
    await Filesystem.mkdir({
      path: options.path,
      directory: options.directory || Directory.Data,
      recursive: options.recursive !== false
    });
  }

  static async readdir(options: {
    path: string;
    directory?: Directory;
  }): Promise<string[]> {
    const result = await Filesystem.readdir({
      path: options.path,
      directory: options.directory || Directory.Data
    });
    return result.files.map(f => f.name);
  }
}
```

---

## 8. Network Status

**Package:** `@capacitor/network@6.0.0`

```typescript
import { Network, ConnectionStatus } from '@capacitor/network';

export class NetworkService {
  private static listeners: Array<(status: ConnectionStatus) => void> = [];

  static async initialize(): Promise<void> {
    await Network.addListener('networkStatusChange', (status) => {
      console.log('Network status changed:', status);
      this.listeners.forEach(listener => listener(status));
    });
  }

  static onChange(callback: (status: ConnectionStatus) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  static async getStatus(): Promise<ConnectionStatus> {
    return await Network.getStatus();
  }
}

export function useNetwork() {
  const [status, setStatus] = React.useState<ConnectionStatus>({
    connected: true,
    connectionType: 'wifi'
  });

  React.useEffect(() => {
    NetworkService.initialize();
    NetworkService.getStatus().then(setStatus);

    const unsubscribe = NetworkService.onChange(setStatus);

    return unsubscribe;
  }, []);

  return {
    isOnline: status.connected,
    connectionType: status.connectionType,
    isWifi: status.connectionType === 'wifi',
    isCellular: status.connectionType === 'cellular'
  };
}
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

```typescript
// Example: Camera service tests
describe('CameraService', () => {
  it('should check availability', async () => {
    const available = await CameraService.isAvailable();
    expect(typeof available).toBe('boolean');
  });

  it('should request permissions', async () => {
    const granted = await CameraService.requestPermissions();
    expect(typeof granted).toBe('boolean');
  });
});
```

### 9.2 Integration Tests

Test on real devices:
- Camera: Take photo, pick from gallery
- Notifications: Receive, display, tap
- Haptics: All feedback types
- Share: Text, URL, files
- Keyboard: Show/hide, height changes
- Network: Online/offline transitions

### 9.3 Testing Checklist

**Camera:**
- [ ] Take photo works
- [ ] Pick from gallery works
- [ ] Multiple photo selection works
- [ ] Image editing works
- [ ] Permissions handled correctly
- [ ] Error states handled

**Push Notifications:**
- [ ] Registration works
- [ ] Receive notifications
- [ ] Tap notification opens app
- [ ] Badge updates
- [ ] Notification channels work (Android)

**Haptics:**
- [ ] All impact styles work
- [ ] Notification types work
- [ ] Selection feedback works
- [ ] Vibration works

**Share:**
- [ ] Share text works
- [ ] Share URL works
- [ ] Share files works
- [ ] Share sheet appears correctly

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-11  
**Status:** ✅ Complete
