'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

const HeroScene3D = dynamic(() => import('@/components/HeroScene3D'), { ssr: false });

export default function HeroScene3DWrapper() {
  // Default true so no canvas is created during SSR or on first paint.
  // After mount, the actual viewport width is checked and the canvas
  // is enabled only on desktop (>768px).
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  if (isMobile) return null;
  return <HeroScene3D />;
}
