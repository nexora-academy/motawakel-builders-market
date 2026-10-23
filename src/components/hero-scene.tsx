import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, Lightformer, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { LOGO_POLYGONS, LOGO_VIEWBOX } from "@/lib/logo-geometry";

// ألوان المشهد مطابقة لهوية الموقع (رملي / أسفلت / برتقالي إنشائي)
const AMBER = "#e3a03f";
const ASPHALT = "#2f261f";

function useFoamTexture() {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#f4f2ee";
    ctx.fillRect(0, 0, size, size);
    // حبيبات الفوم (EPS)
    for (let i = 0; i < 2600; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 1.5 + Math.random() * 3.5;
      const shade = 225 + Math.floor(Math.random() * 25);
      ctx.fillStyle = `rgb(${shade},${shade - 2},${shade - 6})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 1);
    return tex;
  }, []);
}

function LogoMesh() {
  const ref = useRef<THREE.Group>(null);
  const geometry = useMemo(() => {
    const shapes = LOGO_POLYGONS.map((poly) => {
      const s = new THREE.Shape();
      poly.forEach(([x, y], i) => {
        // نقلب y عشان SVG بيعد لتحت
        const px = x - LOGO_VIEWBOX.width / 2;
        const py = LOGO_VIEWBOX.height / 2 - y;
        if (i === 0) s.moveTo(px, py);
        else s.lineTo(px, py);
      });
      s.closePath();
      return s;
    });
    const g = new THREE.ExtrudeGeometry(shapes, {
      depth: 70,
      bevelEnabled: true,
      bevelThickness: 6,
      bevelSize: 4,
      bevelSegments: 2,
    });
    g.center();
    return g;
  }, []);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = Math.sin(t * 0.5) * 0.55 + state.pointer.x * 0.35;
    ref.current.rotation.x = -state.pointer.y * 0.15;
    ref.current.position.y += (1.35 - ref.current.position.y) * (1 - Math.exp(-3 * delta));
  });

  return (
    <group ref={ref} position={[0, 1.35, 0]} scale={0.0062}>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial color={ASPHALT} metalness={0.55} roughness={0.32} />
      </mesh>
    </group>
  );
}

function HordiBlock({
  position,
  rotation = 0,
  map,
}: {
  position: [number, number, number];
  rotation?: number;
  map: THREE.Texture;
}) {
  // الهوردي 200×40×25 سم
  return (
    <mesh position={position} rotation-y={rotation} castShadow receiveShadow>
      <boxGeometry args={[3.2, 0.42, 0.64]} />
      <meshStandardMaterial map={map} roughness={0.95} />
    </mesh>
  );
}

function BlockStack() {
  const foam = useFoamTexture();
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += Math.min(delta, 0.05) * 0.12;
  });
  return (
    <group ref={group} position={[0, -1.15, 0]}>
      <HordiBlock map={foam} position={[0, 0, -0.36]} />
      <HordiBlock map={foam} position={[0, 0, 0.36]} />
      <HordiBlock map={foam} position={[0, 0.44, 0]} rotation={Math.PI / 2} />
      <mesh position={[0, -0.24, 0]} receiveShadow>
        <cylinderGeometry args={[2.3, 2.45, 0.06, 48]} />
        <meshStandardMaterial color={AMBER} roughness={0.5} metalness={0.2} />
      </mesh>
    </group>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.6, 7.2], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[4, 6, 5]}
        intensity={2.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-4, 1, 3]} intensity={18} color={AMBER} />
      <Environment resolution={128}>
        <Lightformer intensity={2.2} position={[0, 5, 2]} scale={[10, 4, 1]} />
        <Lightformer intensity={1.4} color={AMBER} position={[-5, 1, 1]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
        <Lightformer intensity={1} position={[5, 0, 2]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} />
      </Environment>
      <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.5}>
        <LogoMesh />
      </Float>
      <BlockStack />
      <ContactShadows position={[0, -1.42, 0]} opacity={0.45} scale={8} blur={2.4} far={3} />
    </Canvas>
  );
}
