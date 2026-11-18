// ポーズ → VRM正規化ボーン回転（React/three非依存の純粋計算）
import type { Pose } from "../types";

export interface PoseAngles {
  rootY: number; rootRX: number;
  lt: number; rt: number; lk: number; rk: number;
  la: number; ra: number; laz: number; raz: number;
  hx: number; tz: number;
}

export function poseAngles(pose: Pose, t: number): PoseAngles {
  let rootY = 0, rootRX = 0;
  let lt = 0, rt = 0, lk = 0, rk = 0, la = 0, ra = 0, laz = 0.08, raz = -0.08, hx = 0, tz = 0;
  const breathe = Math.sin(t * 2) * 0.02;
  switch (pose) {
    case "walk": {
      const s = Math.sin(t * 8);
      lt = s * 0.55; rt = -s * 0.55; lk = Math.max(0, -s) * 0.6; rk = Math.max(0, s) * 0.6;
      la = -s * 0.5; ra = s * 0.5; rootY = Math.abs(Math.cos(t * 8)) * 0.03;
      break;
    }
    case "sit":
      lt = rt = -Math.PI / 2; lk = rk = Math.PI / 2; la = ra = -0.5; hx = 0.05 + breathe; break;
    case "sleep":
      rootRX = -Math.PI / 2; laz = 0.15; raz = -0.15; break;
    case "burn":
      rootY = Math.abs(Math.sin(t * 14)) * 0.12;
      la = ra = -2.7 + Math.sin(t * 30) * 0.25; laz = 0.4; raz = -0.4; hx = -0.2;
      lt = Math.sin(t * 14) * 0.3; rt = -lt; break;
    case "look":
      hx = 0.35; la = ra = -0.25; break;
    case "wave":
      ra = -2.8; raz = -0.3 + Math.sin(t * 9) * 0.45; hx = breathe; break;
    case "dance":
      rootY = Math.abs(Math.sin(t * 6)) * 0.08; tz = Math.sin(t * 6) * 0.15;
      la = -2.4 + Math.sin(t * 6) * 0.5; ra = -2.4 - Math.sin(t * 6) * 0.5;
      lt = Math.sin(t * 6) * 0.3; rt = -lt; break;
    default:
      hx = breathe; la = Math.sin(t * 1.5) * 0.04; ra = -la;
  }
  return { rootY, rootRX, lt, rt, lk, rk, la, ra, laz, raz, hx, tz };
}

/** Tポーズの腕を下ろすZ回転（左腕は+X側なので負方向） */
export const ARM_DROP = 1.25;

/** 身長・体重からVRMのスケール。naturalHeight はモデル本来の身長(m) */
export function vrmScale(heightCm: number, widthFactor: number, naturalHeight: number) {
  const y = heightCm / 100 / Math.max(0.1, naturalHeight);
  const w = 0.7 + widthFactor * 0.3;
  return { x: y * w, y, z: y * w };
}
