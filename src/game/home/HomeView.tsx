import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Environment, Html, Lightformer, OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Group } from "three";
import { ACTIONS, DEFAULT_AVATAR, DEFAULT_FURNITURE } from "../catalog";
import { avatarDims, parseChat, planCommand, type MovePlan } from "../logic";
import { useGame } from "../store";
import type { AvatarCommand, AvatarConfig, FurnitureItem, Pose } from "../types";
import { AvatarModel } from "./Avatar3D";
import { Furniture3D } from "./Furniture3D";
import { AvatarPanel, ChatPanel, InventoryPanel, StubPanel } from "../ui/HomePanels";

type Cmd = AvatarCommand & { id: number };

function useWoodTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = 512; c.height = 512;
    const g = c.getContext("2d")!;
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? "#d9b48a" : "#e3c199";
      g.fillRect(0, i * 64, 512, 64);
      g.fillStyle = "rgba(120,80,40,0.12)";
      g.fillRect(((i * 197) % 400), i * 64, 2, 64);
      for (let k = 0; k < 6; k++) {
        g.fillStyle = "rgba(140,95,55,0.07)";
        g.fillRect(0, i * 64 + 8 + k * 9, 512, 2);
      }
    }
    const t = new CanvasTexture(c);
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(3, 3);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, []);
}

function Room({ onFloor }: { onFloor: (e: ThreeEvent<MouseEvent>) => void }) {
  const wood = useWoodTexture();
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={onFloor}>
        <planeGeometry args={[12, 10]} />
        <meshStandardMaterial map={wood} color="#ffffff" roughness={0.75} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.5, 0.005, 0.5]} receiveShadow>
        <circleGeometry args={[2.2, 48]} />
        <meshStandardMaterial color="#f3e2c4" roughness={1} />
      </mesh>
      <mesh position={[0, 1.6, -5]} receiveShadow>
        <boxGeometry args={[12, 3.2, 0.15]} />
        <meshStandardMaterial color="#f5ede0" roughness={0.9} />
      </mesh>
      <mesh position={[-6, 1.6, 0]} receiveShadow>
        <boxGeometry args={[0.15, 3.2, 10]} />
        <meshStandardMaterial color="#eadfcd" roughness={0.9} />
      </mesh>
      {/* 窓 */}
      <mesh position={[-2.5, 1.9, -4.9]}>
        <planeGeometry args={[2.2, 1.4]} />
        <meshStandardMaterial color="#bfe3f5" emissive="#bfe3f5" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[-2.5, 1.9, -4.89]}>
        <planeGeometry args={[0.06, 1.4]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-2.5, 1.9, -4.89]}>
        <planeGeometry args={[2.2, 0.06]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* 壁の絵 */}
      <mesh position={[-5.9, 1.9, 1]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.4, 1]} />
        <meshStandardMaterial color="#8fc6c0" />
      </mesh>
      <mesh position={[0, 0.06, -4.9]}>
        <boxGeometry args={[12, 0.12, 0.05]} />
        <meshStandardMaterial color="#c9925e" />
      </mesh>
    </group>
  );
}

function AvatarController({ cmd, items, config, onArrive }: { cmd: Cmd | null; items: FurnitureItem[]; config: AvatarConfig; onArrive?: () => void }) {
  const g = useRef<Group>(null);
  const plan = useRef<MovePlan | null>(null);
  const [pose, setPose] = useState<Pose>("stand");
  const [say, setSay] = useState<string | null>("ここが私の部屋！");
  const dims = useMemo(() => avatarDims(config), [config]);

  useEffect(() => {
    if (!cmd || !g.current) return;
    plan.current = planCommand(cmd, items, dims.legLen);
    g.current.position.y = 0;
    setPose("walk");
    setSay(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmd?.id]);

  useEffect(() => {
    if (!say) return;
    const t = setTimeout(() => setSay(null), 5000);
    return () => clearTimeout(t);
  }, [say]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const p = plan.current;
    const grp = g.current;
    if (!p || !grp) return;
    const dx = p.approach[0] - grp.position.x;
    const dz = p.approach[1] - grp.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.05) {
      grp.position.set(...p.pos);
      grp.rotation.y = p.rotY;
      setPose(p.pose);
      setSay(p.say ?? null);
      plan.current = null;
      onArrive?.();
    } else {
      const step = Math.min(dist, 1.8 * dt);
      grp.position.x += (dx / dist) * step;
      grp.position.z += (dz / dist) * step;
      grp.rotation.y = Math.atan2(dx, dz);
    }
  });

  const bubbleY = pose === "sleep" ? 0.9 : dims.H + 0.35;
  return (
    <group ref={g} position={[0.5, 0, 3]}>
      <AvatarModel config={config} pose={pose} />
      {say && (
        <Html position={[0, bubbleY, 0]} center zIndexRange={[20, 0]}>
          <div className="bubble -translate-y-1/2">{say}</div>
        </Html>
      )}
    </group>
  );
}

export function HomeView() {
  const s = useGame();
  const readOnly = !!s.visiting;
  const items = readOnly ? DEFAULT_FURNITURE : s.furniture;
  const avatar = readOnly ? { ...DEFAULT_AVATAR, gender: "male" as const, hair: "spiky" as const, outfit: "#3fa39a" } : s.avatar;
  const [cmd, setCmd] = useState<Cmd | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [panel, setPanel] = useState<null | "chat" | "avatar" | "items" | "cloth" | "motion">(null);
  const [chatTarget, setChatTarget] = useState<string | undefined>();
  const [selected, setSelected] = useState<string | null>(null);
  const [log, setLog] = useState<{ who: "me" | "avatar"; text: string }[]>([]);
  const editMode = panel === "items";

  const run = (c: AvatarCommand) => {
    const target = items.find((i) => i.uid === c.targetUid);
    let say = c.say;
    if (target?.type === "plant" && c.pose === "look" && !readOnly) say = s.checkPlant();
    setCmd({ ...c, say, id: Date.now() });
    return say ?? "";
  };

  const onFurniture = (e: ThreeEvent<MouseEvent>, it: FurnitureItem) => {
    e.stopPropagation();
    if (e.delta > 6) return;
    if (readOnly) return s.notify("閲覧専用モードです（操作・編集はできません）");
    if (editMode) return setSelected(it.uid);
    setMenu(it.uid);
  };
  const onFloor = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return;
    setMenu(null);
    if (editMode && selected) s.moveItem(selected, e.point.x, e.point.z);
  };

  const menuItem = items.find((i) => i.uid === menu);
  const placed = items.filter((i) => i.placed);

  return (
    <div className="absolute inset-0">
      <Canvas shadows camera={{ position: [8, 8, 10], fov: 45 }} dpr={[1, 2]}>
        <color attach="background" args={["#f6ecdc"]} />
        <ambientLight intensity={0.5} />
        <directionalLight castShadow position={[6, 10, 6]} intensity={1.6} shadow-mapSize={[1024, 1024]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} />
        <Environment resolution={64}>
          <Lightformer intensity={2} position={[0, 5, 0]} scale={[10, 10, 1]} />
          <Lightformer intensity={1} color="#ffd9b0" position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1, 1]} />
        </Environment>
        <Room onFloor={onFloor} />
        {placed.map((it) => (
          <group key={it.uid} position={[it.x, 0, it.z]} rotation={[0, it.rotY, 0]} onClick={(e) => onFurniture(e, it)}>
            <Furniture3D item={it} plantScale={readOnly ? 1.4 : s.plant.scale} selected={editMode && selected === it.uid} />
          </group>
        ))}
        {menuItem && (
          <Html position={[menuItem.x, 1.6, menuItem.z]} center zIndexRange={[30, 0]}>
            <div className="panel flex flex-col gap-1 p-2 w-max">
              <div className="px-1 text-xs font-bold text-muted-foreground">{menuItem.name}</div>
              {ACTIONS[menuItem.type].map((a) => (
                <button key={a.id} className="btn btn-primary btn-sm" onClick={() => { setMenu(null); run({ targetUid: menuItem.uid, pose: a.pose, say: undefined }); }}>
                  {a.label}
                </button>
              ))}
              <button className="btn btn-sm" onClick={() => { setMenu(null); setChatTarget(menuItem.uid); setPanel("chat"); }}>
                その他（チャットで指示）
              </button>
            </div>
          </Html>
        )}
        <AvatarController cmd={cmd} items={items} config={avatar} />
        <OrbitControls target={[0, 0.8, 0]} minDistance={4} maxDistance={20} maxPolarAngle={1.4} enablePan={false} />
      </Canvas>

      {readOnly && (
        <div className="absolute left-1/2 top-3 -translate-x-1/2 chip bg-gold text-gold-foreground shadow-soft">
          👀 {s.visiting?.ownerName}さんの家（閲覧専用モード）
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-3">
        {panel === "chat" && <ChatPanel log={log} onClose={() => setPanel(null)} onSend={(t) => {
          const c = parseChat(t, items, chatTarget);
          const say = run(c);
          setLog((l) => [...l, { who: "me", text: t }, { who: "avatar", text: say }]);
        }} />}
        {panel === "avatar" && <AvatarPanel onClose={() => setPanel(null)} />}
        {panel === "items" && <InventoryPanel selected={selected} onSelect={setSelected} onClose={() => { setPanel(null); setSelected(null); }} />}
        {panel === "cloth" && <StubPanel kind="cloth" onClose={() => setPanel(null)} />}
        {panel === "motion" && <StubPanel kind="motion" onClose={() => setPanel(null)} />}
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          <button className="btn btn-accent" onClick={s.exitHome}>← 街へ戻る</button>
          {!readOnly && (
            <>
              <button className="btn" onClick={() => { setChatTarget(undefined); setPanel(panel === "chat" ? null : "chat"); }}>💬 チャット</button>
              <button className="btn" onClick={() => setPanel(panel === "items" ? null : "items")}>🛋 家具配置</button>
              <button className="btn" onClick={() => setPanel(panel === "avatar" ? null : "avatar")}>🧍 アバター</button>
              <button className="btn" onClick={() => setPanel("cloth")}>👕 服デザイン</button>
              <button className="btn" onClick={() => setPanel("motion")}>🎬 モーション作成部屋（仮）</button>
              <button className="btn btn-gold" onClick={s.generateSpecial}>✨ テスト：AI特殊家具を生成</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
