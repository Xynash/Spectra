"use client";
import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial, Float } from "@react-three/drei";

function FreshSingularity() {
  const mesh = useRef();
  useFrame((state) => {
    const { clock } = state;
    if (mesh.current) {
      mesh.current.distort = 0.3 + Math.sin(clock.getElapsedTime()) * 0.1;
    }
  });

  return (
    <Float speed={5} rotationIntensity={2} floatIntensity={2}>
      <Sphere args={[1, 128, 128]} scale={1.5}>
        <MeshDistortMaterial
          ref={mesh}
          color="#10b981"
          roughness={0.1}
          metalness={0.5}
          distort={0.3}
          speed={2}
        />
      </Sphere>
    </Float>
  );
}

export default function Sentinel() {
  return (
    <div className="h-full w-full">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={1} />
        <pointLight position={[10, 10, 10]} intensity={2} color="#fbbf24" />
        <FreshSingularity />
      </Canvas>
    </div>
  );
}