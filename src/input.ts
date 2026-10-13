import { emptyInput, inputToMask } from "../shared/mask";
import type { Input } from "../shared/types";

const P1: Record<string, keyof Input> = {
  KeyA: "left",
  KeyD: "right",
  KeyW: "up",
  KeyS: "down",
  KeyF: "punch",
  KeyG: "kick",
  KeyH: "special",
  KeyJ: "punch",
  KeyK: "kick",
  KeyL: "special",
};

const P2: Record<string, keyof Input> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  KeyU: "punch",
  KeyI: "kick",
  KeyO: "special",
};

const CAPTURE = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Space",
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
]);

function typing(): boolean {
  const el = document.activeElement;
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
}

function fromKeys(keys: Set<string>, map: Record<string, keyof Input>): Input {
  const input = emptyInput();
  for (const code of keys) {
    const field = map[code];
    if (field) input[field] = true;
  }
  return input;
}

function merge(a: Input, b: Input): Input {
  return {
    left: a.left || b.left,
    right: a.right || b.right,
    up: a.up || b.up,
    down: a.down || b.down,
    punch: a.punch || b.punch,
    kick: a.kick || b.kick,
    special: a.special || b.special,
  };
}

export class Controls {
  private keys = new Set<string>();
  private pointers = new Map<number, keyof Input>();
  private touch = emptyInput();
  capture = false;

  constructor(root: HTMLElement) {
    window.addEventListener("keydown", (event) => {
      if (typing()) return;
      this.keys.add(event.code);
      if (this.capture && CAPTURE.has(event.code)) event.preventDefault();
    });
    window.addEventListener("keyup", (event) => {
      this.keys.delete(event.code);
    });
    window.addEventListener("blur", () => this.clear());
    root.addEventListener("pointerdown", (event) => this.hold(event, true));
    root.addEventListener("pointerup", (event) => this.hold(event, false));
    root.addEventListener("pointercancel", (event) => this.hold(event, false));
  }

  private hold(event: PointerEvent, down: boolean) {
    const button = (event.target as Element | null)?.closest?.("[data-hold]");
    if (!(button instanceof HTMLElement)) return;
    const field = button.dataset.hold as keyof Input | undefined;
    if (!field) return;
    event.preventDefault();
    if (down) {
      button.setPointerCapture?.(event.pointerId);
      this.pointers.set(event.pointerId, field);
      button.classList.add("is-down");
    } else {
      this.pointers.delete(event.pointerId);
      button.classList.remove("is-down");
    }
    const next = emptyInput();
    for (const key of this.pointers.values()) next[key] = true;
    this.touch = next;
  }

  read(side: "p1" | "p2" | "solo"): Input {
    if (side === "p2") return fromKeys(this.keys, P2);
    if (side === "p1") return merge(fromKeys(this.keys, P1), this.touch);
    return merge(merge(fromKeys(this.keys, P1), fromKeys(this.keys, P2)), this.touch);
  }

  mask(side: "p1" | "p2" | "solo"): number {
    return inputToMask(this.read(side));
  }

  clear() {
    this.keys.clear();
    this.pointers.clear();
    this.touch = emptyInput();
  }
}
