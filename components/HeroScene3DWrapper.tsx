'use client';

import dynamic from 'next/dynamic';

const HeroScene3D = dynamic(() => import('@/components/HeroScene3D'), { ssr: false });

export default function HeroScene3DWrapper() {
  return <HeroScene3D />;
}
