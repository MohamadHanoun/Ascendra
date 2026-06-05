'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useRef, useMemo, useEffect } from 'react';
import { useReducedMotion } from 'motion/react';
import * as THREE from 'three';

function ScanGrid({ paused }: { paused: boolean }) {
  const groupRef = useRef<THREE.Group>(null!);
  const STEP = 2.5;
  const SIZE = 50;
  const HALF = SIZE / 2;

  const geometry = useMemo(() => {
    const positions: number[] = [];

    for (let x = -HALF; x <= HALF; x += STEP) {
      positions.push(x, 0, -SIZE, x, 0, SIZE);
    }
    for (let z = -SIZE; z <= SIZE; z += STEP) {
      positions.push(-HALF, 0, z, HALF, 0, z);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, []);

  useEffect(() => {
    return () => { geometry.dispose(); };
  }, [geometry]);

  useFrame((_, delta) => {
    if (paused || !groupRef.current) return;
    groupRef.current.position.z += delta * 0.5;
    if (groupRef.current.position.z > STEP) {
      groupRef.current.position.z -= STEP;
    }
  });

  return (
    <group ref={groupRef} position={[0, -3.2, 0]}>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial color="#c9a24a" transparent opacity={0.065} depthWrite={false} />
      </lineSegments>
    </group>
  );
}

function Crystal({
  position,
  speed,
  rotSpeed,
  scale,
  paused,
}: {
  position: [number, number, number];
  speed: number;
  rotSpeed: number;
  scale: number;
  paused: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const initY = position[1];

  useFrame(({ clock }) => {
    if (paused || !meshRef.current) return;
    const t = clock.elapsedTime;
    meshRef.current.position.y = initY + Math.sin(t * speed) * 0.38;
    meshRef.current.rotation.x += rotSpeed * 0.28;
    meshRef.current.rotation.y += rotSpeed;
    meshRef.current.rotation.z += rotSpeed * 0.14;
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <octahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial
        color="#c9a24a"
        transparent
        opacity={0.08}
        wireframe
        depthWrite={false}
      />
    </mesh>
  );
}

function AccentCrystal({
  position,
  paused,
}: {
  position: [number, number, number];
  paused: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const initY = position[1];

  useFrame(({ clock }) => {
    if (paused || !groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.position.y = initY + Math.sin(t * 0.38) * 0.42;
    groupRef.current.rotation.x = t * 0.045;
    groupRef.current.rotation.y = t * 0.085;
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh scale={2.1}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshPhongMaterial
          color="#e8c66a"
          transparent
          opacity={0.13}
          shininess={90}
          emissive="#4a3814"
          emissiveIntensity={0.5}
          depthWrite={false}
        />
      </mesh>
      <mesh scale={2.35}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial
          color="#c9a24a"
          transparent
          opacity={0.055}
          wireframe
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function Scene({ paused }: { paused: boolean }) {
  return (
    <>
      <ambientLight intensity={0.4} color="#d8d6d2" />
      <pointLight position={[8, 14, 6]} intensity={2} color="#e8c66a" />
      <pointLight position={[-12, 5, -3]} intensity={0.6} color="#4a4a52" />

      <ScanGrid paused={paused} />

      <Crystal position={[-7.5, 1.5, -5]} speed={0.27} rotSpeed={0.004} scale={1.1} paused={paused} />
      <Crystal position={[8.5, 2.5, -7]} speed={0.21} rotSpeed={0.003} scale={0.85} paused={paused} />
      <Crystal position={[-3.5, 3.2, -11]} speed={0.34} rotSpeed={0.005} scale={0.65} paused={paused} />
      <Crystal position={[11.5, 0.5, -4]} speed={0.31} rotSpeed={0.004} scale={1.15} paused={paused} />
      <Crystal position={[4.5, 4.2, -13]} speed={0.18} rotSpeed={0.003} scale={1.4} paused={paused} />
      <Crystal position={[-10.5, 2.2, -6]} speed={0.40} rotSpeed={0.003} scale={0.62} paused={paused} />
      <Crystal position={[2.5, 1.2, -3]} speed={0.26} rotSpeed={0.006} scale={0.42} paused={paused} />
      <Crystal position={[-5.5, 0.9, -14]} speed={0.35} rotSpeed={0.002} scale={1.05} paused={paused} />

      <AccentCrystal position={[9.5, 3.2, -8.5]} paused={paused} />
    </>
  );
}

export default function HeroScene3D() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 2,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        camera={{ position: [0, 6, 14], fov: 58, near: 0.1, far: 100 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Scene paused={!!shouldReduceMotion} />
        </Suspense>
      </Canvas>
    </div>
  );
}
