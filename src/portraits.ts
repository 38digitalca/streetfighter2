export interface Sprite {
  rows: string[];
  colors: Record<string, string>;
}

const skin = {
  s: "#f0c09a",
  S: "#c88860",
  e: "#fff8f0",
  i: "#1a120c",
  m: "#b05040",
  o: "#140c08",
};

function pad(rows: string[]): string[] {
  const w = Math.max(...rows.map((row) => row.length));
  return rows.map((row) => row.padEnd(w, "."));
}

function sprite(rows: string[], colors: Record<string, string>): Sprite {
  return { rows: pad(rows), colors: { ...skin, ...colors, ".": "" } };
}

export const PORTRAITS: Record<string, Sprite> = {
  ryu: sprite(
    [
      ".....kkkkkk",
      "...kkkkkkkkkk",
      "..kbbbbbbbbbk",
      ".kkssssssssskk",
      ".kssseeeessseesk",
      ".ksssiissiissisk",
      ".ksssssssssssssk",
      ".kssssmmmmsssssk",
      "..ksssssssssssk",
      "...wwwwwwwwww",
      "..wwwwwrrwwwwww",
      ".wwwwwwwwwwwwwww",
      "wwwwwwwwwwwwwwww",
      "wwwwwwwwwwwwwwww",
    ],
    { k: "#1a120c", b: "#e02028", w: "#f3f3f6", r: "#d01820" },
  ),
  ken: sprite(
    [
      "....yyyyyyyy",
      "..yyyyyyyyyyyy",
      ".yyysssssssssy",
      ".yysseeeessseey",
      ".yyssiissiissiy",
      ".yysssssssssssy",
      ".yysssmmmmssssy",
      "..yyyssssssyyy",
      "...rrrrrrrrrr",
      "..rrrrrrrrrrrrr",
      ".rrrrrrwwrrrrrr",
      "rrrrrrrrrrrrrrrr",
      "rrrrrrrrrrrrrrrr",
      "rrrrrrrrrrrrrrrr",
    ],
    { y: "#f0d060", Y: "#c89820", r: "#d41820", w: "#f4f4f6" },
  ),
  honda: sprite(
    [
      "......kkkk",
      ".....kkkkkk",
      "....kssssssk",
      "...kssssssssk",
      "..kssseeeesssk",
      "..kssiissiissk",
      "..kssssssssssk",
      "..ksssmmmmsssk",
      "...kssssssssk",
      "..ssssssssssss",
      ".ssssssssssssss",
      "ssssrrrrrrsssss",
      "sssssssssssssss",
      ".bbbbbbbbbbbbb",
      "..bbbbbbbbbbb",
    ],
    { k: "#1a120c", b: "#2456c8", r: "#c01018" },
  ),
  blanka: sprite(
    [
      "...oooooooooo",
      "..osssssssssso",
      ".ooosssssssssoo",
      ".oosseeessseeso",
      ".oossiissiisso",
      ".oosssssssssso",
      ".oosssffssssso",
      "..oosssssssso",
      "...ggggggggg",
      "..gggggggggggg",
      ".gggggggggggggg",
      "ggggyyyyggggggg",
      "ggggggggggggggg",
    ],
    { o: "#f08a14", g: "#6aaa30", f: "#f4f4f4", y: "#ffe14a", s: "#8ed04a", S: "#5a9828" },
  ),
  guile: sprite(
    [
      "..YYYYYYYYYYYY",
      "..yyyyyyyyyyyy",
      "...yssssssssy",
      "..ysseeeesssey",
      "..yssiissiissiy",
      "..yssssssssssy",
      "..ysssmmsssssy",
      "...ysssssssy",
      "....gggggggg",
      "...ggggggggggg",
      "..ggggwwwwgggg",
      ".gggggggggggggg",
      "uuuuuuuuuuuuuu",
      "uuuuuuuuuuuuuu",
    ],
    { y: "#f0d060", Y: "#e8c040", g: "#2f6b32", w: "#f4f4f6", u: "#c8a060" },
  ),
  chunli: sprite(
    [
      "..kk......kk",
      ".kkkk....kkkk",
      ".kksssssssskk",
      "kkssseeeesssskk",
      "kkssiissiissskk",
      ".ksssssssssssk",
      ".ksssmmmmssssk",
      "..ksssssssssk",
      "...bbbbbbbb",
      "..bbbbwbbbbbb",
      ".bbbbbbbbbbbbb",
      "bbbbbbbbbbbbbbb",
      ".wwwwwwwwwwwww",
      "..wwwwwwwwwww",
    ],
    { k: "#1a120c", b: "#2456c8", w: "#f4f4f6" },
  ),
  zangief: sprite(
    [
      "......rrrr",
      ".....rrrrrr",
      "....rssssssr",
      "...rssseeeessr",
      "...rssiissiisr",
      "...rsssssssssr",
      "...rssmmmmsssr",
      "....rsssssssr",
      "...sssssssssss",
      "..sssssssssssss",
      ".sssrrrrrrsssss",
      "sssssssssssssss",
      "sssssssssssssss",
      ".rrrrrrrrrrrrr",
    ],
    { r: "#c01018", s: "#e0a070", S: "#c08050" },
  ),
  dhalsim: sprite(
    [
      "....ssssssss",
      "...ssssssssss",
      "..ssseeeessss",
      "..ssiissiisss",
      "..sssssssssss",
      "..sssrmmrssss",
      "...sssssssss",
      "....sssssss",
      ".....nnnnn",
      "....yyyyyyy",
      "...yyyyyyyyy",
      "..yyyyyyyyyyy",
      ".yyyyrrryyyyy",
      "yyyyyyyyyyyyy",
    ],
    { n: "#e8c090", y: "#f0d060", r: "#e02028", s: "#c68642", S: "#a06830" },
  ),
};

export function blitPortrait(
  ctx: CanvasRenderingContext2D,
  id: string,
  face: 1 | -1,
  x: number,
  y: number,
  scale: number,
) {
  const sprite = PORTRAITS[id];
  if (!sprite) return;
  const h = sprite.rows.length;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(x, y);
  ctx.scale(face * scale, scale);
  for (let row = 0; row < h; row++) {
    const line = sprite.rows[row] ?? "";
    for (let col = 0; col < line.length; col++) {
      const color = sprite.colors[line[col] ?? ""];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(col, row, 1, 1);
    }
  }
  ctx.restore();
}
