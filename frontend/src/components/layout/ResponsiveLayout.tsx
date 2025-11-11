import { Outlet } from 'react-router-dom';
import { useIsMobile, MobileLayout } from '@/components/mobile/MobileLayout';
import { NormalLayout } from './NormalLayout';

/**
 * ResponsiveLayout switches between mobile and desktop layouts based on viewport width.
 * - Mobile (< 768px): Uses MobileLayout with bottom navigation (no desktop navbar/DevBanner)
 * - Desktop (>= 768px): Uses NormalLayout with top navbar
 * 
 * This prevents the "Frankenstein" hybrid of showing both layouts simultaneously.
 */
export function ResponsiveLayout() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <MobileLayout>
        <Outlet />
      </MobileLayout>
    );
  }

  return <NormalLayout />;
}
