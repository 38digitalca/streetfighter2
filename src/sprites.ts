export type RyuPose = "portrait" | "idle" | "punch" | "kick" | "jump" | "hadoken" | "crouch";

const POSES: RyuPose[] = ["portrait", "idle", "punch", "kick", "jump", "hadoken", "crouch"];

const images = new Map<RyuPose, HTMLImageElement>();
let ready = false;
const waiters: Array<() => void> = [];

export function loadRyuArt(): Promise<void> {
  return Promise.all(
    POSES.map(
      (pose) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            images.set(pose, img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = `/fighters/ryu/${pose}.png`;
        }),
    ),
  ).then(() => {
    ready = true;
    for (const fn of waiters.splice(0)) fn();
  });
}

export function whenRyuArtReady(fn: () => void): void {
  if (ready) fn();
  else waiters.push(fn);
}

export function ryuSprite(pose: RyuPose): HTMLImageElement | null {
  const img = images.get(pose);
  if (!img || !img.naturalWidth) return null;
  return img;
}
