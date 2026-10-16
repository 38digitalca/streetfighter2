export type Pose = "portrait" | "idle" | "punch" | "kick" | "jump" | "special" | "crouch";

const POSES: Pose[] = ["portrait", "idle", "punch", "kick", "jump", "special", "crouch"];

export const PAINTED = ["ryu", "ken", "honda", "chunli", "blanka", "guile", "zangief", "dhalsim"] as const;

const FILE_ALIAS: Record<string, Partial<Record<Pose, string>>> = {
  ryu: { special: "hadoken" },
  ken: { idle: "special", punch: "special", kick: "special", jump: "special", crouch: "special" },
  blanka: { idle: "roll", punch: "roll", kick: "roll", jump: "roll", special: "roll", crouch: "roll" },
  chunli: { punch: "idle", crouch: "idle", jump: "kick", special: "kick" },
  guile: { punch: "idle", crouch: "idle", special: "idle", jump: "kick" },
  zangief: { kick: "idle", crouch: "idle", punch: "lariat", jump: "lariat", special: "pile" },
  dhalsim: { punch: "idle", kick: "idle", crouch: "idle", jump: "special" },
};

const images = new Map<string, HTMLImageElement>();
let ready = false;
const waiters: Array<() => void> = [];

export function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    let tries = 0;
    const start = () => {
      tries += 1;
      img.onload = () => resolve(img.naturalWidth > 0 ? img : null);
      img.onerror = () => {
        if (tries < 3) window.setTimeout(start, 300 * tries);
        else resolve(null);
      };
      img.src = tries === 1 ? src : `${src}${src.includes("?") ? "&" : "?"}try=${tries}`;
    };
    start();
  });
}

function key(id: string, pose: Pose): string {
  return `${id}:${pose}`;
}

export function isPainted(id: string): boolean {
  return (PAINTED as readonly string[]).includes(id);
}

export function loadFighterArt(): Promise<void> {
  const jobs = PAINTED.flatMap((id) =>
    POSES.map(async (pose) => {
      const file = FILE_ALIAS[id]?.[pose] ?? pose;
      const img = await loadImage(`/fighters/${id}/${file}.png`);
      if (img) images.set(key(id, pose), img);
    }),
  );
  return Promise.all(jobs).then(() => {
    ready = true;
    for (const fn of waiters.splice(0)) fn();
  });
}

export function whenFighterArtReady(fn: () => void): void {
  if (ready) fn();
  else waiters.push(fn);
}

export function fighterSprite(id: string, pose: Pose): HTMLImageElement | null {
  const img = images.get(key(id, pose));
  if (!img || !img.naturalWidth) return null;
  return img;
}
