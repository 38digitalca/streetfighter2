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

function key(id: string, pose: Pose): string {
  return `${id}:${pose}`;
}

export function isPainted(id: string): boolean {
  return (PAINTED as readonly string[]).includes(id);
}

export function loadFighterArt(): Promise<void> {
  const jobs = PAINTED.flatMap((id) =>
    POSES.map(
      (pose) =>
        new Promise<void>((resolve) => {
          const file = FILE_ALIAS[id]?.[pose] ?? pose;
          const img = new Image();
          img.onload = () => {
            images.set(key(id, pose), img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = `/fighters/${id}/${file}.png`;
        }),
    ),
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
