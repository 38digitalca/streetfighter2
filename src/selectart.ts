import { CHARACTERS } from "../shared/characters";
import { VIEW_H, VIEW_W } from "../shared/types";
import { blitPortrait, PORTRAITS } from "./portraits";

const LAND: number[][][] = [
  [[4, 28], [12, 16], [22, 14], [32, 20], [34, 36], [26, 48], [16, 52], [8, 44], [4, 36]],
  [[18, 54], [28, 50], [32, 68], [26, 88], [18, 84], [14, 66]],
  [[40, 20], [48, 16], [56, 20], [54, 32], [46, 34], [40, 28]],
  [[44, 36], [54, 34], [60, 50], [56, 76], [46, 82], [42, 58]],
  [[56, 16], [68, 12], [84, 16], [92, 28], [88, 44], [74, 46], [62, 36], [56, 26]],
  [[76, 58], [88, 56], [92, 70], [80, 74], [74, 64]],
];

const GREEN: number[][][] = [
  [[10, 30], [20, 24], [24, 36], [14, 40]],
  [[46, 24], [52, 22], [52, 30], [46, 30]],
  [[48, 48], [54, 44], [56, 60], [48, 64]],
  [[64, 22], [78, 18], [80, 34], [66, 36]],
];

interface Flag {
  x: number;
  y: number;
  label: string;
  paint: (ctx: CanvasRenderingContext2D) => void;
  ids: string[];
}

function stripes(ctx: CanvasRenderingContext2D, colors: string[]) {
  colors.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, i * 4, 22, 4);
  });
}

const FLAGS: Flag[] = [
  { x: 0.15, y: 0.22, label: "U.S.A.", ids: ["ken", "guile"], paint: (ctx) => stripes(ctx, ["#b22234", "#fff", "#b22234", "#3c3b6e"]) },
  { x: 0.28, y: 0.4, label: "BRAZIL", ids: ["blanka"], paint: (ctx) => stripes(ctx, ["#009c3b", "#ffdf00", "#009c3b"]) },
  { x: 0.45, y: 0.24, label: "SPAIN", ids: [], paint: (ctx) => stripes(ctx, ["#c60b1e", "#ffc400", "#c60b1e"]) },
  { x: 0.54, y: 0.16, label: "U.S.S.R.", ids: ["zangief"], paint: (ctx) => stripes(ctx, ["#de1a1a", "#de1a1a", "#de1a1a"]) },
  { x: 0.63, y: 0.32, label: "INDIA", ids: ["dhalsim"], paint: (ctx) => stripes(ctx, ["#ff9933", "#ffffff", "#138808"]) },
  { x: 0.72, y: 0.24, label: "CHINA", ids: ["chunli"], paint: (ctx) => stripes(ctx, ["#de2910", "#de2910", "#ffde00"]) },
  {
    x: 0.82,
    y: 0.3,
    label: "JAPAN",
    ids: ["ryu", "honda"],
    paint: (ctx) => {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, 22, 14);
      ctx.fillStyle = "#bc002d";
      ctx.beginPath();
      ctx.arc(11, 7, 4, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  { x: 0.66, y: 0.44, label: "THAI", ids: [], paint: (ctx) => stripes(ctx, ["#a51931", "#fff", "#2d2a4a", "#fff", "#a51931"]) },
];

function continent(ctx: CanvasRenderingContext2D, poly: number[][], w: number, h: number, fill: string) {
  ctx.beginPath();
  poly.forEach(([x, y], i) => {
    const pxn = (x / 100) * w;
    const pyn = (y / 100) * h;
    if (i === 0) ctx.moveTo(pxn, pyn);
    else ctx.lineTo(pxn, pyn);
  });
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = "#f7f3e8";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawFlag(ctx: CanvasRenderingContext2D, flag: Flag, hot: boolean) {
  const x = flag.x * VIEW_W;
  const y = flag.y * VIEW_H;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(3, 16, 20, 3);
  ctx.fillStyle = "#f7f4ea";
  ctx.fillRect(-1, 0, 3, 18);
  flag.paint(ctx);
  ctx.strokeStyle = hot ? "#ffe14a" : "#102040";
  ctx.lineWidth = hot ? 2 : 1;
  ctx.strokeRect(0, 0, 22, 14);
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#102040";
  ctx.strokeText(flag.label, 0, 18);
  ctx.fillStyle = hot ? "#ffe14a" : "#f7f4ea";
  ctx.fillText(flag.label, 0, 18);
  ctx.restore();
}

export function drawBust(ctx: CanvasRenderingContext2D, id: string, face: 1 | -1) {
  const canvas = ctx.canvas;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const sprite = PORTRAITS[id];
  if (!sprite) {
    ctx.fillStyle = "#d8e4f8";
    ctx.font = "700 42px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", canvas.width / 2, canvas.height / 2);
    return;
  }
  const w = sprite.rows[0]?.length ?? 1;
  const h = sprite.rows.length;
  const scale = Math.min(canvas.width / w, canvas.height / h);
  const dx = (canvas.width - w * scale) / 2;
  const dy = (canvas.height - h * scale) / 2;
  blitPortrait(ctx, id, face, face === 1 ? dx : dx + w * scale, dy, scale);
}

export function renderAtlas(ctx: CanvasRenderingContext2D, dpr: number, selected: [string, string] | null) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
  const wash = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  wash.addColorStop(0, "#7ec0f0");
  wash.addColorStop(1, "#2f78c4");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const mapH = VIEW_H * 0.72;
  for (const poly of LAND) continent(ctx, poly, VIEW_W, mapH, "#e7d7a4");
  for (const poly of GREEN) continent(ctx, poly, VIEW_W, mapH, "#7da85a");
  const chosen = new Set(selected ?? []);
  for (const flag of FLAGS) {
    const owns = flag.ids.some((id) => chosen.has(id));
    drawFlag(ctx, flag, owns && CHARACTERS[flag.ids[0] ?? ""] !== undefined);
  }
}

export function paintBusts(root: ParentNode) {
  for (const canvas of root.querySelectorAll("canvas.bust")) {
    if (!(canvas instanceof HTMLCanvasElement)) continue;
    const g = canvas.getContext("2d");
    const face = canvas.dataset.face === "-1" ? -1 : 1;
    if (!g) continue;
    drawBust(g, canvas.dataset.char ?? "", face);
  }
}
