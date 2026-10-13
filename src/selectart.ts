import { CHARACTERS, ROSTER } from "../shared/characters";
import type { Character, Hair } from "../shared/types";
import { VIEW_H, VIEW_W } from "../shared/types";

const LAND: number[][][] = [
  [[6, 34], [14, 16], [26, 14], [34, 22], [36, 38], [28, 52], [18, 56], [12, 48], [8, 40]],
  [[20, 58], [30, 54], [34, 70], [28, 92], [22, 88], [16, 72]],
  [[40, 22], [48, 16], [56, 18], [58, 30], [50, 36], [42, 32]],
  [[44, 38], [56, 36], [62, 48], [58, 78], [48, 84], [42, 64], [42, 48]],
  [[56, 18], [70, 12], [86, 16], [92, 28], [88, 46], [74, 48], [62, 38], [58, 28]],
  [[78, 62], [90, 58], [94, 74], [80, 78], [74, 68]],
];

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function hairPixels(ctx: CanvasRenderingContext2D, style: Hair, p: Character["palette"]) {
  if (style === "ponytail") {
    px(ctx, 6, 2, 14, 6, p.hair);
    px(ctx, 1, 6, 5, 12, p.hair);
  } else if (style === "crop") {
    px(ctx, 6, 2, 13, 4, p.hair);
  } else if (style === "cap") {
    px(ctx, 4, 1, 16, 5, p.cloth);
    px(ctx, 2, 5, 18, 2, p.cloth);
    px(ctx, 16, 2, 5, 2, p.accent);
  } else if (style === "bun") {
    px(ctx, 6, 2, 13, 4, p.hair);
    px(ctx, 2, 1, 6, 6, p.hair);
  } else if (style === "mane") {
    px(ctx, 3, 1, 18, 12, p.hair);
    px(ctx, 1, 8, 5, 10, p.hair);
  } else if (style === "braid") {
    px(ctx, 5, 2, 14, 5, p.hair);
    px(ctx, 2, 8, 3, 12, p.hair);
    px(ctx, 1, 19, 5, 2, p.trim);
  } else if (style === "hood") {
    px(ctx, 3, 0, 18, 16, p.cloth);
    px(ctx, 7, 5, 11, 10, p.skin);
  } else {
    px(ctx, 4, 2, 16, 14, p.hair);
    px(ctx, 8, 6, 10, 8, p.skin);
  }
}

export function drawBust(ctx: CanvasRenderingContext2D, id: string, face: 1 | -1) {
  const canvas = ctx.canvas;
  const scale = 4;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const ch = CHARACTERS[id];
  ctx.fillStyle = face === 1 ? "#163884" : "#1c4a96";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!ch) {
    ctx.fillStyle = "#f4f7ff";
    ctx.font = "700 42px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", canvas.width / 2, canvas.height / 2);
    return;
  }
  const p = ch.palette;
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2 + 4);
  ctx.scale(face * scale, scale);
  ctx.translate(-12, -15);
  px(ctx, 0, 18, 24, 12, p.cloth);
  px(ctx, 4, 18, 14, 3, p.trim);
  px(ctx, 9, 15, 5, 5, p.skin);
  if (ch.hair !== "hood" && ch.hair !== "bob" && ch.hair !== "mane") px(ctx, 6, 5, 13, 12, p.skin);
  hairPixels(ctx, ch.hair, p);
  if (ch.hair === "hood" || ch.hair === "bob" || ch.hair === "mane") px(ctx, 8, 6, 10, 9, p.skin);
  px(ctx, 15, 9, 2, 2, "#1a120c");
  px(ctx, 14, 8, 3, 1, "#fffaf2");
  px(ctx, 14, 14, 3, 1, "#8a4030");
  ctx.restore();
}

function continent(ctx: CanvasRenderingContext2D, poly: number[][], w: number, h: number) {
  ctx.beginPath();
  poly.forEach(([x, y], i) => {
    const pxn = (x / 100) * w;
    const pyn = (y / 100) * h;
    if (i === 0) ctx.moveTo(pxn, pyn);
    else ctx.lineTo(pxn, pyn);
  });
  ctx.closePath();
  ctx.fillStyle = "#e6d3a1";
  ctx.fill();
  ctx.strokeStyle = "#f7f1e4";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = "#b08958";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function flag(ctx: CanvasRenderingContext2D, x: number, y: number, ch: Character, hot: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(2, 16, 22, 4);
  ctx.fillStyle = "#f4f7ff";
  ctx.fillRect(0, 0, 3, 18);
  ctx.fillStyle = ch.palette.cloth;
  ctx.fillRect(3, 0, 18, 12);
  ctx.fillStyle = ch.palette.accent;
  ctx.fillRect(3, 0, 18, 4);
  ctx.fillStyle = ch.palette.trim;
  ctx.fillRect(3, 8, 18, 4);
  ctx.strokeStyle = hot ? "#ffe14a" : "#0b1c3a";
  ctx.lineWidth = hot ? 2 : 1;
  ctx.strokeRect(3, 0, 18, 12);
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#0b1c3a";
  ctx.strokeText(ch.home.label, 0, 20);
  ctx.fillStyle = hot ? "#ffe14a" : "#f7f4ea";
  ctx.fillText(ch.home.label, 0, 20);
  ctx.restore();
}

export function renderAtlas(ctx: CanvasRenderingContext2D, dpr: number, selected: [string, string] | null) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.fillStyle = "#3c86d4";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const wash = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  wash.addColorStop(0, "#6eb0ea");
  wash.addColorStop(1, "#2a6cb8");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for (let x = 40; x < VIEW_W; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, VIEW_H);
    ctx.stroke();
  }
  for (const poly of LAND) continent(ctx, poly, VIEW_W, VIEW_H * 0.7);
  const chosen = new Set(selected ?? []);
  for (const id of ROSTER) {
    const ch = CHARACTERS[id];
    const x = ch.home.x * VIEW_W;
    const y = 70 + ch.home.y * (VIEW_H * 0.34);
    if (y > VIEW_H * 0.46) continue;
    flag(ctx, x, y, ch, chosen.has(id));
  }
}

export function paintBusts(root: ParentNode) {
  for (const canvas of root.querySelectorAll("canvas.bust")) {
    if (!(canvas instanceof HTMLCanvasElement)) continue;
    const ctx = canvas.getContext("2d");
    const face = canvas.dataset.face === "-1" ? -1 : 1;
    if (!ctx) continue;
    drawBust(ctx, canvas.dataset.char ?? "", face);
  }
}
