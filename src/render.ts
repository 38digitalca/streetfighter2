import { CHARACTERS } from "../shared/characters";
import { attackBox, bodyBox, createMatch, moveFor, windup } from "../shared/sim";
import type { BodyShape, Character, Fighter, Hair, MatchState } from "../shared/types";
import { GROUND_Y, STAGE_W, VIEW_H, VIEW_W } from "../shared/types";
import { fighterSprite, isPainted, type Pose as FighterPose } from "./sprites";

export interface Floater {
  x: number;
  y: number;
  text: string;
  life: number;
  max: number;
  color: string;
}

export interface RenderOpts {
  dpr: number;
  debug: boolean;
  reduced: boolean;
  localSlot: 0 | 1 | null;
  chip: [number, number];
  hud: boolean;
  floaters: Floater[];
}

interface Pose {
  bob: number;
  drop: number;
  lean: number;
  legF: number;
  legB: number;
  legLen: number;
  armF: number;
  armB: number;
  armLen: number;
}

function cameraX(state: MatchState): number {
  const mid = (state.fighters[0].x + state.fighters[1].x) / 2;
  return Math.max(0, Math.min(STAGE_W - VIEW_W, mid - VIEW_W / 2));
}

function poseOf(f: Fighter, tick: number): Pose {
  const pose: Pose = {
    bob: Math.sin(tick / 10) * 1.2,
    drop: 0,
    lean: 0,
    legF: 0.22,
    legB: -0.18,
    legLen: 44,
    armF: 0.95,
    armB: 0.35,
    armLen: 30,
  };
  if (f.action === "walk") {
    const s = Math.sin(tick / 3.4);
    pose.legF = 0.55 * s;
    pose.legB = -0.55 * s;
    pose.armF = 0.7 - 0.35 * s;
    pose.armB = 0.15 + 0.35 * s;
    pose.bob = Math.abs(s) * 1.6;
  } else if (f.crouched || f.action === "crouchPunch" || f.action === "crouchKick") {
    pose.drop = 36;
    pose.legF = 1.15;
    pose.legB = -1.05;
    pose.legLen = 30;
    pose.bob = 0;
    pose.armF = 1.05;
    pose.armB = 0.45;
  } else if (f.action === "jump" || f.action === "airPunch" || f.action === "airKick") {
    pose.legF = 2.15;
    pose.legB = 2.45;
    pose.legLen = 34;
    pose.armF = 2.4;
    pose.armB = 2.15;
    pose.bob = 0;
  } else if (f.action === "block") {
    pose.armF = 1.85;
    pose.armB = 1.55;
    pose.armLen = 26;
    pose.lean = -0.08;
    if (f.crouched) {
      pose.drop = 32;
      pose.legF = 1.1;
      pose.legB = -1.0;
      pose.legLen = 30;
    }
  } else if (f.action === "hit") {
    pose.lean = 0.22;
    pose.armF = 2.2;
    pose.armB = 2.6;
    pose.legF = 0.15;
    pose.legB = -0.4;
  } else if (f.action === "launch") {
    pose.lean = 0.35;
    pose.armF = 2.4;
    pose.armB = 2.8;
    pose.legF = 1.8;
    pose.legB = 2.2;
    pose.legLen = 36;
  } else if (f.action === "win") {
    pose.armF = 2.75;
    pose.armLen = 40;
    pose.armB = 0.4;
    pose.legF = 0.2;
    pose.legB = -0.28;
    pose.bob = Math.sin(tick / 8) * 1.5;
  } else if (f.action === "getup") {
    pose.drop = 22;
    pose.lean = 0.18;
    pose.legF = 0.8;
    pose.legB = -0.7;
  } else if (f.action === "down" || (f.action === "ko" && f.onGround)) {
    pose.armF = 0.4;
    pose.armB = -0.4;
    pose.legF = 0.3;
    pose.legB = -0.2;
  }

  const move = moveFor(f);
  if (move && (f.action === "punch" || f.action === "crouchPunch" || f.action === "airPunch")) {
    const e = windup(f);
    pose.armF = 0.7 + 0.95 * e;
    pose.armLen = 28 + 26 * e;
  } else if (move && (f.action === "kick" || f.action === "crouchKick" || f.action === "airKick")) {
    const e = windup(f);
    pose.legF = 0.2 + 1.35 * e;
    pose.legLen = 42 + 18 * e;
  } else if (f.action === "special") {
    const kind = CHARACTERS[f.charId]?.specialKind;
    const e = windup(f);
    if (kind === "dart") {
      pose.armF = 0.4 + 1.2 * e;
      pose.armLen = 32 + 14 * e;
      pose.lean = -0.06;
    } else if (kind === "riser") {
      pose.armF = 2.6;
      pose.armLen = 42;
      pose.lean = -0.2;
      pose.legF = 0.8;
      pose.legB = 0.2;
    } else if (kind === "dive") {
      pose.legF = 1.5;
      pose.legLen = 58;
      pose.lean = 0.4;
    } else if (kind === "flare") {
      pose.armF = 2.2;
      pose.armB = 2.45;
      pose.armLen = 38;
    }
  }
  return pose;
}

function torsoWidth(body: BodyShape): number {
  if (body === "broad") return 46;
  if (body === "slim" || body === "lean") return 30;
  return 36;
}

function limb(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  len: number,
  girth: number,
  color: string,
  boot: string | null,
  hand: string | null,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.strokeStyle = "#160e0b";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-girth / 2, 0, girth, len, girth / 2);
  ctx.fill();
  ctx.stroke();
  if (boot) {
    ctx.fillStyle = boot;
    ctx.fillRect(-girth / 2 - 3, len - 7, girth + 8, 8);
  }
  if (hand) {
    ctx.fillStyle = hand;
    ctx.beginPath();
    ctx.arc(0, len + 1, girth * 0.48, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function hair(ctx: CanvasRenderingContext2D, style: Hair, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.strokeStyle = "#160e0b";
  ctx.lineWidth = 3;
  if (style === "ponytail") {
    ctx.beginPath();
    ctx.ellipse(-2, y - 8, 16, 12, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-16, y + 8, 7, 16, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (style === "crop") {
    ctx.beginPath();
    ctx.ellipse(0, y - 6, 16, 11, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (style === "cap" || style === "hood") {
    ctx.fillStyle = style === "hood" ? color : "#102028";
    ctx.beginPath();
    ctx.ellipse(0, y - 8, 17, 10, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-16, y - 10, 34, 6);
    if (style === "cap") {
      ctx.fillStyle = color;
      ctx.fillRect(12, y - 8, 12, 4);
    }
    ctx.strokeRect(-16, y - 10, 34, 6);
  } else if (style === "bun") {
    ctx.beginPath();
    ctx.ellipse(0, y - 6, 16, 11, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-12, y - 10, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (style === "mane") {
    ctx.beginPath();
    ctx.ellipse(0, y, 18, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-18, y, 10, 22);
    ctx.stroke();
  } else if (style === "braid") {
    ctx.beginPath();
    ctx.ellipse(0, y - 6, 16, 11, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-18, y, 6, 26);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.ellipse(0, y + 2, 18, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function paintLocal(ctx: CanvasRenderingContext2D, f: Fighter, tick: number) {
  const ch = CHARACTERS[f.charId];
  if (!ch) return;
  const pose = poseOf(f, tick);
  const flash = f.flash > 0;
  const cloth = flash ? "#fff6ee" : ch.palette.cloth;
  const skin = flash ? "#fff6ee" : ch.palette.skin;
  const tw = torsoWidth(ch.body);
  const hand = ch.id === "ken" || ch.id === "honda" ? ch.palette.metal : skin;

  ctx.save();
  if (f.action === "down" || (f.action === "ko" && f.onGround)) ctx.rotate(-1.2);
  else if (f.action === "ko" || f.action === "launch") ctx.rotate(Math.sin(f.frame / 2.4) * 0.45);
  if (f.action === "hit") ctx.scale(1.06, 0.94);
  ctx.rotate(pose.lean);

  if (ch.id === "chunli") {
    ctx.fillStyle = cloth;
    ctx.beginPath();
    ctx.moveTo(-tw / 2, -70 + pose.drop);
    ctx.lineTo(-tw / 2 - 10, -8);
    ctx.lineTo(-4, -20);
    ctx.fill();
  }

  limb(ctx, -8, -6, pose.legB, pose.legLen, 11, cloth, ch.palette.sole, null);
  limb(ctx, -2, -78 + pose.drop, pose.armB, 30, 8, cloth, null, skin);
  ctx.fillStyle = cloth;
  ctx.strokeStyle = "#160e0b";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -98 + pose.drop, tw, 62, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = ch.palette.trim;
  ctx.fillRect(-4, -90 + pose.drop, 7, 42);

  const hy = -112 + pose.drop + pose.bob;
  hair(ctx, ch.hair, hy, ch.palette.hair);
  ctx.fillStyle = skin;
  ctx.strokeStyle = "#160e0b";
  ctx.beginPath();
  ctx.arc(2, hy, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#1a120c";
  ctx.fillRect(8, hy - 2, 3, 3);

  limb(ctx, 6, -6, pose.legF, pose.legLen, 12, cloth, ch.palette.sole, null);
  limb(ctx, 6, -80 + pose.drop, pose.armF, pose.armLen, 9, cloth, null, hand);

  if (ch.id === "ryu") {
    ctx.fillStyle = ch.palette.trim;
    ctx.fillRect(-10, hy - 6, 22, 4);
  }
  if (ch.id === "honda") {
    ctx.fillStyle = ch.palette.hair;
    ctx.beginPath();
    ctx.arc(-2, hy - 18, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  if (ch.id === "blanka") {
    ctx.save();
    ctx.shadowColor = ch.palette.accent;
    ctx.shadowBlur = 12;
    ctx.fillStyle = ch.palette.accent;
    ctx.beginPath();
    ctx.arc(-tw / 2, -40 + pose.drop, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

type SpritePose = Exclude<FighterPose, "portrait">;

function paintedPose(f: Fighter): SpritePose {
  if (f.action === "special") return "special";
  if (f.action === "jump" || f.action === "airPunch" || f.action === "airKick") return "jump";
  if (f.action === "punch" || f.action === "crouchPunch") return "punch";
  if (f.action === "kick" || f.action === "crouchKick") return "kick";
  if (f.crouched) return "crouch";
  return "idle";
}

const PAINT_HEIGHT: Record<string, Partial<Record<SpritePose, number>>> = {
  ryu: { crouch: 118, jump: 156, idle: 168 },
  honda: { crouch: 128, jump: 150, special: 146, idle: 180 },
};

function paintHeight(id: string, pose: SpritePose): number {
  const table = PAINT_HEIGHT[id];
  return table?.[pose] ?? table?.idle ?? 168;
}

const flashCanvas = typeof document === "undefined" ? null : document.createElement("canvas");

function drawPainted(ctx: CanvasRenderingContext2D, f: Fighter, tick: number): boolean {
  if (!isPainted(f.charId)) return false;
  const pose = paintedPose(f);
  const img = fighterSprite(f.charId, pose);
  if (!img) return false;
  const height = paintHeight(f.charId, pose);
  const scale = height / img.height;
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.save();
  if (f.onGround && f.action !== "jump") {
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.beginPath();
    ctx.ellipse(0, -3, f.charId === "honda" ? 42 : pose === "crouch" ? 36 : 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (f.action === "walk") ctx.translate(0, -Math.abs(Math.sin(tick / 3.4)) * 4);
  if (f.action === "hit") ctx.rotate(-0.22);
  else if (f.action === "launch") ctx.rotate(0.45);
  else if (f.action === "down" || (f.action === "ko" && f.onGround)) ctx.rotate(-1.15);
  else if (f.action === "ko") ctx.rotate(0.35);
  ctx.imageSmoothingEnabled = true;
  const x = -w / 2;
  const y = -h;
  if (f.flash > 0 && flashCanvas) {
    flashCanvas.width = img.width;
    flashCanvas.height = img.height;
    const g = flashCanvas.getContext("2d");
    if (g) {
      g.clearRect(0, 0, img.width, img.height);
      g.drawImage(img, 0, 0);
      g.globalCompositeOperation = "source-atop";
      g.fillStyle = `rgba(255,246,238,${Math.min(0.8, f.flash / 8)})`;
      g.fillRect(0, 0, img.width, img.height);
      ctx.drawImage(flashCanvas, x, y, w, h);
    } else ctx.drawImage(img, x, y, w, h);
  } else {
    ctx.drawImage(img, x, y, w, h);
  }
  ctx.restore();
  return true;
}

function drawFighter(ctx: CanvasRenderingContext2D, f: Fighter, cam: number, tick: number) {
  ctx.save();
  ctx.translate(f.x - cam, f.y);
  ctx.scale(f.facing * 1.12, 1.12);
  if (!drawPainted(ctx, f, tick)) paintLocal(ctx, f, tick);
  ctx.restore();
}

function skyline(ctx: CanvasRenderingContext2D, cam: number) {
  const shift = cam * 0.32;
  ctx.fillStyle = "#120c16";
  const blocks: [number, number, number][] = [
    [40, 210, 180],
    [200, 150, 150],
    [340, 190, 120],
    [470, 120, 210],
    [690, 170, 160],
    [860, 130, 180],
    [1040, 200, 140],
    [1180, 150, 200],
    [1390, 180, 160],
    [1540, 140, 180],
  ];
  for (const [x, top, w] of blocks) {
    const sx = x - shift;
    ctx.fillRect(sx, top, w, GROUND_Y - top);
    ctx.fillStyle = "#f0a05a";
    for (let wy = top + 16; wy < GROUND_Y - 20; wy += 22) {
      for (let wx = sx + 12; wx < sx + w - 12; wx += 18) {
        if ((wx + wy) % 36 < 16) ctx.fillRect(wx, wy, 6, 8);
      }
    }
    ctx.fillStyle = "#120c16";
  }
}

function drawWorld(ctx: CanvasRenderingContext2D, state: MatchState, cam: number) {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  g.addColorStop(0, "#07060d");
  g.addColorStop(0.5, "#1c1230");
  g.addColorStop(0.82, "#3d1d28");
  g.addColorStop(1, "#6a3424");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  ctx.save();
  ctx.fillStyle = "#f4e7c8";
  ctx.shadowColor = "#f4e7c8";
  ctx.shadowBlur = 28;
  ctx.beginPath();
  ctx.arc(790, 78, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#fff6df";
  for (let i = 0; i < 42; i++) {
    const sx = ((i * 113 - cam * 0.12) % VIEW_W + VIEW_W) % VIEW_W;
    const sy = (i * 47) % 200 + 10;
    ctx.globalAlpha = 0.25 + (i % 5) * 0.12;
    ctx.fillRect(sx, sy, i % 4 === 0 ? 2 : 1.4, i % 4 === 0 ? 2 : 1.4);
  }
  ctx.globalAlpha = 1;

  skyline(ctx, cam);

  const signX = 760 - cam;
  ctx.save();
  ctx.font = '700 26px "Archivo Black", Impact, sans-serif';
  ctx.fillStyle = "#ff4d2e";
  ctx.shadowColor = "#ff4d2e";
  ctx.shadowBlur = 10 + Math.sin(state.tick / 7) * 5;
  ctx.fillText("CINDER", signX, 168);
  ctx.restore();

  const lampX = 250 - cam;
  const glow = ctx.createRadialGradient(lampX, GROUND_Y - 150, 8, lampX, GROUND_Y - 40, 230);
  glow.addColorStop(0, "rgba(255, 190, 96, 0.32)");
  glow.addColorStop(1, "rgba(255, 190, 96, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(lampX - 240, 40, 480, VIEW_H);

  ctx.strokeStyle = "#2a211c";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(lampX, GROUND_Y);
  ctx.lineTo(lampX, GROUND_Y - 168);
  ctx.stroke();
  ctx.fillStyle = "#f6d48a";
  ctx.fillRect(lampX - 10, GROUND_Y - 176, 28, 10);

  ctx.fillStyle = "#3a2a24";
  const crateX = 1180 - cam;
  ctx.fillRect(crateX, GROUND_Y - 46, 54, 46);
  ctx.strokeStyle = "#1a100c";
  ctx.strokeRect(crateX, GROUND_Y - 46, 54, 46);
  ctx.beginPath();
  ctx.moveTo(crateX, GROUND_Y - 23);
  ctx.lineTo(crateX + 54, GROUND_Y - 23);
  ctx.moveTo(crateX + 27, GROUND_Y - 46);
  ctx.lineTo(crateX + 27, GROUND_Y);
  ctx.stroke();

  ctx.fillStyle = "#2c2422";
  ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
  ctx.fillStyle = "#4a3b36";
  ctx.fillRect(0, GROUND_Y, VIEW_W, 8);
  ctx.fillStyle = "rgba(255, 196, 140, 0.06)";
  ctx.fillRect(0, GROUND_Y + 22, VIEW_W, 12);
}

function drawBolt(ctx: CanvasRenderingContext2D, x: number, y: number, cam: number, hadoken = false) {
  ctx.save();
  ctx.translate(x - cam, y);
  ctx.strokeStyle = hadoken ? "#e7fbff" : "#f3e8ff";
  ctx.fillStyle = hadoken ? "#7ee7ff" : "#d8b4fe";
  ctx.lineWidth = 3;
  ctx.shadowColor = hadoken ? "#3ec8ff" : "#c084fc";
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0.5, Math.PI - 0.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-2, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSpark(ctx: CanvasRenderingContext2D, x: number, y: number, life: number, max: number, kind: string, cam: number) {
  const t = life / max;
  ctx.save();
  ctx.translate(x - cam, y);
  ctx.globalAlpha = Math.max(0, t);
  ctx.strokeStyle = kind === "block" ? "#f8fafc" : kind === "clash" ? "#e9d5ff" : "#ffb020";
  ctx.fillStyle = kind === "ko" ? "#ff4d2e" : "#fff4d6";
  ctx.lineWidth = 2;
  const n = kind === "ko" ? 12 : 8;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + life * 0.2;
    const len = 10 + (1 - t) * 26;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 3, Math.sin(a) * 3);
    ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, 3 + (1 - t) * 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function diamond(ctx: CanvasRenderingContext2D, x: number, y: number, on: boolean) {
  ctx.beginPath();
  ctx.moveTo(x, y - 6);
  ctx.lineTo(x + 6, y);
  ctx.lineTo(x, y + 6);
  ctx.lineTo(x - 6, y);
  ctx.closePath();
  ctx.fillStyle = on ? "#f2c14e" : "#3a2c24";
  ctx.strokeStyle = "#f2c14e";
  ctx.lineWidth = 1.5;
  ctx.fill();
  ctx.stroke();
}

function bar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, hp: number, chip: number, max: number, align: "left" | "right") {
  ctx.fillStyle = "#07080c";
  ctx.fillRect(x - 3, y - 3, w + 6, 22);
  ctx.strokeStyle = "#f4f1e8";
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 3, y - 3, w + 6, 22);
  const pct = Math.max(0, hp / max);
  const chipPct = Math.max(pct, chip / max);
  const chipX = align === "left" ? x : x + w * (1 - chipPct);
  const hpX = align === "left" ? x : x + w * (1 - pct);
  ctx.fillStyle = "#c4322a";
  ctx.fillRect(chipX, y, w * chipPct, 16);
  ctx.fillStyle = pct < 0.3 ? "#ff5a3c" : "#ffe14a";
  ctx.fillRect(hpX, y, w * pct, 16);
}

function drawHud(ctx: CanvasRenderingContext2D, state: MatchState, opt: RenderOpts) {
  ctx.textBaseline = "top";
  const y = 78;
  const w = 300;
  for (const side of [0, 1] as const) {
    const f = state.fighters[side];
    const ch = CHARACTERS[f.charId];
    const x = side === 0 ? 36 : VIEW_W - 36 - w;
    ctx.font = '10px "Press Start 2P", Impact, sans-serif';
    ctx.fillStyle = "#f4f7ff";
    ctx.textAlign = side === 0 ? "left" : "right";
    const nameX = side === 0 ? x : x + w;
    const plate = (ch?.name ?? f.name).toUpperCase();
    ctx.fillText(plate, nameX, y - 16);
    if (opt.localSlot === side) {
      ctx.fillStyle = "#ffe14a";
      ctx.font = '8px "Press Start 2P", Impact, sans-serif';
      ctx.fillText("YOU", nameX, y - 30);
    }
    bar(ctx, x, y, w, f.hp, opt.chip[side], f.maxHp, side === 0 ? "left" : "right");
    const pipY = y + 8;
    const pipStart = side === 0 ? x + w + 16 : x - 16;
    diamond(ctx, pipStart, pipY, f.wins > 0);
    diamond(ctx, pipStart + (side === 0 ? 16 : -16), pipY, f.wins > 1);
    if (ch) {
      const ready = 1 - f.specialCd / (ch.moves.special.cooldown || 1);
      ctx.fillStyle = ready >= 1 ? ch.palette.accent : "#3a2e28";
      const meterW = w * Math.max(0, Math.min(1, ready));
      const mx = side === 0 ? x : x + w - meterW;
      ctx.fillRect(mx, y + 20, meterW, 4);
      if (ready >= 1) {
        ctx.font = "700 10px Outfit, sans-serif";
        ctx.fillStyle = ch.palette.accent;
        ctx.textAlign = side === 0 ? "left" : "right";
        ctx.fillText(ch.specialName.toUpperCase(), nameX, y + 26);
      }
    }
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#07080c";
  ctx.fillRect(VIEW_W / 2 - 36, 58, 72, 40);
  ctx.strokeStyle = "#ffe14a";
  ctx.lineWidth = 3;
  ctx.strokeRect(VIEW_W / 2 - 36, 58, 72, 40);
  ctx.fillStyle = state.timer <= 10 ? "#ff5a3c" : "#ffe14a";
  ctx.font = '16px "Press Start 2P", Impact, sans-serif';
  ctx.textBaseline = "middle";
  ctx.fillText(String(state.timer).padStart(2, "0"), VIEW_W / 2, 80);

  for (const f of state.fighters) {
    if (f.combo < 2) continue;
    ctx.font = '400 18px "Archivo Black", Impact, sans-serif';
    ctx.fillStyle = "#f2c14e";
    ctx.strokeStyle = "#140c0a";
    ctx.lineWidth = 4;
    const x = f.x - cameraX(state);
    const yText = f.y - 168;
    ctx.strokeText(`${f.combo} HITS`, x, yText);
    ctx.fillText(`${f.combo} HITS`, x, yText);
  }

  if (state.banner && state.bannerLife > 0) {
    const big = state.banner === "FIGHT" || state.banner === "KO" || state.banner === "DOUBLE KO";
    ctx.save();
    ctx.translate(VIEW_W / 2, big ? 230 : 210);
    const pop = 1 + Math.min(0.16, state.bannerLife / 220);
    ctx.scale(pop, pop);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `400 ${big ? 78 : 54}px "Archivo Black", Impact, sans-serif`;
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#140c0a";
    ctx.strokeText(state.banner, 0, 0);
    ctx.fillStyle = state.banner === "KO" || state.banner === "DOUBLE KO" ? "#ff4d2e" : "#f6efe6";
    ctx.fillText(state.banner, 0, 0);
    ctx.restore();
  }
}

export function render(ctx: CanvasRenderingContext2D, state: MatchState, opt: RenderOpts) {
  ctx.setTransform(opt.dpr, 0, 0, opt.dpr, 0, 0);
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.save();
  if (!opt.reduced && state.shake > 0.4) {
    ctx.translate((Math.random() - 0.5) * state.shake * 1.7, (Math.random() - 0.5) * state.shake * 1.7);
  }
  const cam = cameraX(state);
  drawWorld(ctx, state, cam);

  for (const f of state.fighters) {
    const lift = Math.max(0, GROUND_Y - f.y);
    const scale = Math.max(0.35, 1 - lift / 220);
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.beginPath();
    ctx.ellipse(f.x - cam, GROUND_Y + 4, 26 * scale, 7 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const bolt of state.bolts) {
    const owner = state.fighters[bolt.owner];
    const hadoken = owner?.charId === "ryu";
    if (hadoken && owner && (bolt.x - owner.x) * owner.facing < 128) continue;
    drawBolt(ctx, bolt.x, bolt.y, cam, hadoken);
  }
  const order = [...state.fighters].sort((a, b) => a.x - b.x);
  for (const f of order) drawFighter(ctx, f, cam, state.tick);
  for (const spark of state.sparks) drawSpark(ctx, spark.x, spark.y, spark.life, spark.max, spark.kind, cam);
  drawFloaters(ctx, opt.floaters, cam);

  if (opt.debug) {
    ctx.lineWidth = 1;
    for (const f of state.fighters) {
      const body = bodyBox(f);
      if (body) {
        ctx.strokeStyle = "#22d3ee";
        ctx.strokeRect(body.x - cam, body.y, body.w, body.h);
      }
      const hit = attackBox(f);
      if (hit) {
        ctx.strokeStyle = "#ef4444";
        ctx.strokeRect(hit.x - cam, hit.y, hit.w, hit.h);
      }
    }
  }

  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255, 244, 230, ${state.flash})`;
    ctx.fillRect(-20, -20, VIEW_W + 40, VIEW_H + 40);
  }
  const vignette = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 180, VIEW_W / 2, VIEW_H / 2, 560);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.restore();
  if (opt.hud) drawHud(ctx, state, opt);
}

function drawFloaters(ctx: CanvasRenderingContext2D, floaters: Floater[], cam: number) {
  if (floaters.length === 0) return;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '400 22px "Archivo Black", Impact, sans-serif';
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#140c0a";
  for (const floater of floaters) {
    const t = Math.max(0, floater.life / floater.max);
    const rise = (1 - t) * 42;
    ctx.globalAlpha = Math.min(1, t * 1.6);
    ctx.fillStyle = floater.color;
    ctx.strokeText(floater.text, floater.x - cam, floater.y - rise);
    ctx.fillText(floater.text, floater.x - cam, floater.y - rise);
  }
  ctx.restore();
}

export function drawPortrait(ctx: CanvasRenderingContext2D, charId: string) {
  const ch: Character | undefined = CHARACTERS[charId];
  const canvas = ctx.canvas;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!ch) return;
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, "#241610");
  g.addColorStop(1, "#100c0a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = ch.palette.accent;
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height * 0.72, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  const match = createMatch({ name: ch.name, charId }, { name: "Rival", charId: "ken" });
  const f = match.fighters[0];
  const scale = canvas.width / 150;
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height - 16);
  ctx.scale(scale, scale);
  paintLocal(ctx, f, 8);
  ctx.restore();
}
