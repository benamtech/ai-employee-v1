import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";

export interface HyperSceneNode {
  id: string;
  label: string;
  role: "page" | "prototype" | "feature" | "neighbor";
  position: readonly [number, number, number];
  size: number;
  colorToken: "red" | "blue" | "cyan" | "green" | "ink";
}

export interface HyperSceneEdge {
  id: string;
  source: string;
  target: string;
  strength: number;
}

export interface HyperSceneContract {
  id: string;
  pageId: string;
  label: string;
  description: string;
  posterSvg: string;
  nodes: HyperSceneNode[];
  edges: HyperSceneEdge[];
  interaction: { requiresUserActivation: true; keyboardEquivalent: true; reducedMotionMode: "static"; frameloop: "demand" };
  performance: {
    maxDpr: number;
    mobileMaxDpr: number;
    maxDrawCalls: number;
    desktopTriangleBudget: number;
    mobileTriangleBudget: number;
    postprocessing: false;
    wasm: "disabled-until-benchmark-win";
  };
  contentPolicy: { canonicalContentInsideScene: false; fallbackContainsEquivalentMeaning: true };
  contractHash: string;
}

export interface HyperSceneIslandProps {
  contract: HyperSceneContract;
  active: boolean;
  className?: string;
  onPerformanceFallback?: () => void;
}

const COLORS: Record<HyperSceneNode["colorToken"], string> = {
  red: "#E11D2A",
  blue: "#2563EB",
  cyan: "#DFF6FF",
  green: "#168A57",
  ink: "#111111",
};

export function HyperSceneIsland({ contract, active, className, onPerformanceFallback }: HyperSceneIslandProps) {
  const reducedMotion = useReducedMotion();
  const [dpr, setDpr] = useState(() => Math.min(contract.performance.maxDpr, 1.25));
  const poster = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(contract.posterSvg)}`;
  if (!active || reducedMotion) {
    return <img className={className} src={poster} alt={contract.label} width={800} height={440} decoding="async" />;
  }
  return (
    <div className={className} role="img" aria-label={contract.label}>
      <Canvas
        frameloop="demand"
        dpr={dpr}
        camera={{ position: [0, 0, 9], fov: 42, near: 0.1, far: 60 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        performance={{ min: 0.5, max: 1, debounce: 250 }}
        fallback={<img src={poster} alt={contract.label} width={800} height={440} />}
      >
        <PerformanceMonitor
          flipflops={3}
          onIncline={() => setDpr((current) => Math.min(contract.performance.maxDpr, current + 0.25))}
          onDecline={() => setDpr((current) => Math.max(1, current - 0.25))}
          onFallback={() => {
            setDpr(1);
            onPerformanceFallback?.();
          }}
        />
        <Suspense fallback={null}>
          <ambientLight intensity={1.8} />
          <directionalLight position={[4, 6, 8]} intensity={2.2} />
          <NodeInstances nodes={contract.nodes} />
          <EdgeSegments nodes={contract.nodes} edges={contract.edges} />
          <OrbitControls enablePan={false} enableZoom={false} enableDamping={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI * 2 / 3} />
        </Suspense>
      </Canvas>
    </div>
  );
}

function NodeInstances({ nodes }: { nodes: readonly HyperSceneNode[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(0.34, 1), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05, vertexColors: true }), []);
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    nodes.forEach((node, index) => {
      matrix.compose(new THREE.Vector3(...node.position), new THREE.Quaternion(), new THREE.Vector3(node.size, node.size, node.size));
      mesh.setMatrixAt(index, matrix);
      mesh.setColorAt(index, color.set(COLORS[node.colorToken]));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [nodes]);
  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);
  return <instancedMesh ref={ref} args={[geometry, material, nodes.length]} frustumCulled />;
}

function EdgeSegments({ nodes, edges }: { nodes: readonly HyperSceneNode[]; edges: readonly HyperSceneEdge[] }) {
  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const positions = useMemo(() => {
    const values: number[] = [];
    for (const edge of edges) {
      const source = nodeById.get(edge.source);
      const target = nodeById.get(edge.target);
      if (!source || !target) continue;
      values.push(...source.position, ...target.position);
    }
    return new Float32Array(values);
  }, [edges, nodeById]);
  const geometry = useMemo(() => {
    const value = new THREE.BufferGeometry();
    value.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return value;
  }, [positions]);
  const material = useMemo(() => new THREE.LineBasicMaterial({ color: COLORS.blue, transparent: true, opacity: 0.3 }), []);
  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);
  return <lineSegments geometry={geometry} material={material} />;
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}
