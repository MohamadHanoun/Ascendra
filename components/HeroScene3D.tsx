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
    groupRef.current.position.z += delta * 0.25;
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

function SignalBeams() {
  const geometry = useMemo(() => {
    const positions = [
      -18, -1.9, -14, 18, -1.9, -14,
      -16, -0.4, -12, 15, 2.4, -8,
      -14, 2.8, -13, 14, 0.1, -7,
      -12, 4.4, -15, 10, 4.0, -6,
      2, -2.6, -16, 12, 5.6, -9,
    ];

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, []);

  useEffect(() => {
    return () => { geometry.dispose(); };
  }, [geometry]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        color="#e8c66a"
        transparent
        opacity={0.055}
        depthWrite={false}
      />
    </lineSegments>
  );
}

function EnergyGate({ paused }: { paused: boolean }) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    if (paused || !groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.rotation.z = Math.sin(t * 0.22) * 0.045;
    groupRef.current.position.y = 2.3 + Math.sin(t * 0.36) * 0.16;
  });

  return (
    <group ref={groupRef} position={[7.4, 2.3, -10.2]} rotation={[0, 0, -0.08]}>
      <mesh scale={[1.22, 0.54, 1]}>
        <torusGeometry args={[3.05, 0.018, 8, 96]} />
        <meshBasicMaterial color="#e8c66a" transparent opacity={0.12} depthWrite={false} />
      </mesh>
      <mesh scale={[0.88, 0.38, 1]}>
        <torusGeometry args={[3.05, 0.014, 8, 96]} />
        <meshBasicMaterial color="#9c6f33" transparent opacity={0.13} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, -0.03]} scale={[1.02, 0.46, 1]}>
        <ringGeometry args={[2.74, 2.76, 64]} />
        <meshBasicMaterial color="#f2d47a" transparent opacity={0.055} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Crystal({
  position,
  scale,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  scale: number;
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation} scale={scale}>
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
      <pointLight position={[8, 14, 6]} intensity={1.45} color="#e8c66a" />
      <pointLight position={[-12, 5, -3]} intensity={0.35} color="#5a5143" />

      <ScanGrid paused={paused} />
      <SignalBeams />
      <EnergyGate paused={paused} />

      <Crystal position={[-7.5, 1.5, -5]} rotation={[0.35, 0.4, 0.1]} scale={1.1} />
      <Crystal position={[8.5, 2.5, -7]} rotation={[0.2, 0.7, 0.32]} scale={0.85} />
      <Crystal position={[4.5, 4.2, -13]} rotation={[0.52, 0.1, 0.4]} scale={1.25} />
      <Crystal position={[-5.5, 0.9, -14]} rotation={[0.1, 0.55, 0.2]} scale={0.9} />

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
        dpr={1}
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
