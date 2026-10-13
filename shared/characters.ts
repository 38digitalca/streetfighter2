import type { Character, Move } from "./types";

function mv(
  partial: Partial<Move> &
    Pick<Move, "startup" | "active" | "recovery" | "damage" | "w" | "lift">,
): Move {
  return {
    hitstun: 16,
    blockstun: 10,
    push: 6,
    h: 28,
    level: "mid",
    launch: 0,
    slide: 0,
    hop: 0,
    invuln: 0,
    cooldown: 0,
    multi: 1,
    split: 4,
    around: false,
    bolt: null,
    ...partial,
  };
}

const CORE: Record<string, Character> = {
  vesper: {
    id: "vesper",
    name: "Vesper",
    title: "Night courier",
    blurb: "Fast hands and a crescent dart. Thin health, so she has to leave first.",
    home: { x: 0.5, y: 0.46, label: "LAGOS" },
    specialName: "Crescent Dart",
    specialKind: "dart",
    tempo: "Fleet",
    power: "Light",
    walk: 4.55,
    air: 4.1,
    jump: -13.7,
    maxHp: 100,
    hair: "ponytail",
    body: "slim",
    palette: {
      skin: "#f0c7a4",
      hair: "#2a1844",
      cloth: "#3a2468",
      trim: "#c084fc",
      accent: "#e9d5ff",
      metal: "#ddd6fe",
      sole: "#1e1033",
    },
    moves: {
      punch: mv({ startup: 5, active: 4, recovery: 11, damage: 7, hitstun: 16, blockstun: 9, push: 5, w: 44, h: 24, lift: 96 }),
      crouchPunch: mv({ startup: 4, active: 4, recovery: 9, damage: 6, hitstun: 15, blockstun: 8, push: 4, w: 42, h: 20, lift: 62 }),
      airPunch: mv({ startup: 4, active: 6, recovery: 10, damage: 8, hitstun: 14, blockstun: 10, push: 4, w: 40, h: 30, lift: 78, level: "overhead" }),
      kick: mv({ startup: 8, active: 5, recovery: 14, damage: 12, hitstun: 18, blockstun: 12, push: 8, w: 58, h: 26, lift: 80 }),
      crouchKick: mv({ startup: 7, active: 5, recovery: 15, damage: 11, hitstun: 18, blockstun: 13, push: 9, w: 68, h: 22, lift: 34, level: "low" }),
      airKick: mv({ startup: 6, active: 6, recovery: 12, damage: 13, hitstun: 16, blockstun: 12, push: 6, w: 56, h: 28, lift: 68, level: "overhead", launch: -3 }),
      special: mv({
        startup: 12,
        active: 2,
        recovery: 20,
        damage: 0,
        hitstun: 16,
        blockstun: 12,
        push: 8,
        w: 10,
        h: 10,
        lift: 90,
        cooldown: 78,
        bolt: { speed: 9.2, damage: 11, lift: 92 },
      }),
    },
  },
  brass: {
    id: "brass",
    name: "Brass",
    title: "Dock brawler",
    blurb: "Slow walk, heavy hands, and a rising hook that puts people on the curb.",
    home: { x: 0.18, y: 0.38, label: "HAVANA" },
    specialName: "Rising Hook",
    specialKind: "riser",
    tempo: "Measured",
    power: "Heavy",
    walk: 3.05,
    air: 3.1,
    jump: -12.5,
    maxHp: 114,
    hair: "crop",
    body: "broad",
    palette: {
      skin: "#e0b088",
      hair: "#2a2118",
      cloth: "#6b3a22",
      trim: "#f3d7a1",
      accent: "#f59e0b",
      metal: "#fde68a",
      sole: "#1c1410",
    },
    moves: {
      punch: mv({ startup: 7, active: 4, recovery: 15, damage: 11, hitstun: 18, blockstun: 11, push: 7, w: 48, h: 26, lift: 98 }),
      crouchPunch: mv({ startup: 6, active: 4, recovery: 13, damage: 9, hitstun: 16, blockstun: 10, push: 6, w: 46, h: 22, lift: 60 }),
      airPunch: mv({ startup: 6, active: 5, recovery: 14, damage: 12, hitstun: 16, blockstun: 12, push: 5, w: 48, h: 32, lift: 84, level: "overhead" }),
      kick: mv({ startup: 11, active: 5, recovery: 18, damage: 16, hitstun: 20, blockstun: 14, push: 10, w: 64, h: 28, lift: 78 }),
      crouchKick: mv({ startup: 9, active: 4, recovery: 18, damage: 14, hitstun: 18, blockstun: 14, push: 10, w: 70, h: 24, lift: 36, level: "low" }),
      airKick: mv({ startup: 8, active: 5, recovery: 16, damage: 15, hitstun: 18, blockstun: 12, push: 7, w: 58, h: 30, lift: 70, level: "overhead", launch: -4 }),
      special: mv({
        startup: 4,
        active: 8,
        recovery: 26,
        damage: 19,
        hitstun: 22,
        blockstun: 16,
        push: 8,
        w: 52,
        h: 46,
        lift: 108,
        launch: -11.2,
        slide: 2.5,
        hop: -11,
        invuln: 7,
        cooldown: 100,
      }),
    },
  },
  kite: {
    id: "kite",
    name: "Kite",
    title: "Rooftop runner",
    blurb: "A low slide on the ground and a diving spike from the air. Guess wrong.",
    home: { x: 0.84, y: 0.34, label: "SEOUL" },
    specialName: "Dive Spike",
    specialKind: "dive",
    tempo: "Quick",
    power: "Light",
    walk: 4.2,
    air: 4.4,
    jump: -15,
    maxHp: 94,
    hair: "cap",
    body: "lean",
    palette: {
      skin: "#f3d2b5",
      hair: "#102028",
      cloth: "#155e75",
      trim: "#ecfeff",
      accent: "#22d3ee",
      metal: "#a5f3fc",
      sole: "#082f38",
    },
    moves: {
      punch: mv({ startup: 5, active: 4, recovery: 11, damage: 7, hitstun: 15, blockstun: 9, push: 5, w: 42, h: 24, lift: 94 }),
      crouchPunch: mv({ startup: 4, active: 3, recovery: 10, damage: 6, hitstun: 14, blockstun: 8, push: 4, w: 40, h: 20, lift: 58 }),
      airPunch: mv({ startup: 4, active: 6, recovery: 10, damage: 8, hitstun: 14, blockstun: 10, push: 4, w: 42, h: 28, lift: 76, level: "overhead" }),
      kick: mv({ startup: 8, active: 4, recovery: 14, damage: 11, hitstun: 17, blockstun: 11, push: 7, w: 56, h: 24, lift: 82 }),
      crouchKick: mv({ startup: 6, active: 4, recovery: 14, damage: 10, hitstun: 16, blockstun: 12, push: 8, w: 64, h: 20, lift: 32, level: "low" }),
      airKick: mv({ startup: 5, active: 6, recovery: 12, damage: 12, hitstun: 16, blockstun: 11, push: 5, w: 54, h: 26, lift: 64, level: "overhead", launch: -2 }),
      special: mv({
        startup: 7,
        active: 8,
        recovery: 16,
        damage: 14,
        hitstun: 18,
        blockstun: 14,
        push: 10,
        w: 72,
        h: 22,
        lift: 34,
        level: "low",
        slide: 6.4,
        cooldown: 84,
      }),
      airSpecial: mv({
        startup: 3,
        active: 24,
        recovery: 8,
        damage: 15,
        hitstun: 18,
        blockstun: 14,
        push: 8,
        w: 58,
        h: 34,
        lift: 58,
        level: "overhead",
        launch: -2,
        slide: 5.2,
        hop: 6.5,
        cooldown: 84,
      }),
    },
  },
  moth: {
    id: "moth",
    name: "Moth",
    title: "Lantern duelist",
    blurb: "Even tools and a two-hit flare that fills the space in front of her.",
    home: { x: 0.57, y: 0.4, label: "CAIRO" },
    specialName: "Lantern Flare",
    specialKind: "flare",
    tempo: "Even",
    power: "Medium",
    walk: 3.7,
    air: 3.6,
    jump: -13.3,
    maxHp: 104,
    hair: "bob",
    body: "dancer",
    palette: {
      skin: "#f0c8aa",
      hair: "#4a2038",
      cloth: "#7f1d3a",
      trim: "#fde68a",
      accent: "#fb7185",
      metal: "#fecdd3",
      sole: "#2a1018",
    },
    moves: {
      punch: mv({ startup: 6, active: 4, recovery: 12, damage: 8, hitstun: 16, blockstun: 10, push: 5, w: 44, h: 24, lift: 94 }),
      crouchPunch: mv({ startup: 5, active: 4, recovery: 10, damage: 7, hitstun: 15, blockstun: 9, push: 4, w: 42, h: 20, lift: 60 }),
      airPunch: mv({ startup: 5, active: 5, recovery: 12, damage: 9, hitstun: 15, blockstun: 10, push: 4, w: 42, h: 28, lift: 78, level: "overhead" }),
      kick: mv({ startup: 9, active: 5, recovery: 15, damage: 13, hitstun: 18, blockstun: 12, push: 8, w: 58, h: 26, lift: 80 }),
      crouchKick: mv({ startup: 7, active: 4, recovery: 16, damage: 12, hitstun: 18, blockstun: 13, push: 9, w: 66, h: 22, lift: 34, level: "low" }),
      airKick: mv({ startup: 6, active: 5, recovery: 14, damage: 13, hitstun: 16, blockstun: 12, push: 6, w: 54, h: 28, lift: 66, level: "overhead", launch: -3 }),
      special: mv({
        startup: 9,
        active: 10,
        recovery: 20,
        damage: 8,
        hitstun: 16,
        blockstun: 12,
        push: 3,
        w: 150,
        h: 72,
        lift: 80,
        multi: 2,
        split: 5,
        around: true,
        cooldown: 88,
      }),
    },
  },
};

function tune(base: Character, patch: Partial<Character> & Pick<Character, "id" | "name" | "title" | "blurb" | "home">): Character {
  const moves = structuredClone(base.moves);
  return {
    ...base,
    ...patch,
    palette: { ...base.palette, ...patch.palette },
    moves: patch.moves ?? moves,
  };
}

const reedMoves = structuredClone(CORE.vesper.moves);
if (reedMoves.special.bolt) reedMoves.special.bolt = { speed: 7.6, damage: 13, lift: 96 };
reedMoves.special.cooldown = 92;

const junoMoves = structuredClone(CORE.brass.moves);
junoMoves.special.damage = 16;
junoMoves.special.cooldown = 92;
junoMoves.special.launch = -10;

const coilMoves = structuredClone(CORE.kite.moves);
coilMoves.special.slide = 7.2;
coilMoves.special.damage = 13;

const ashMoves = structuredClone(CORE.moth.moves);
ashMoves.special.damage = 9;
ashMoves.special.cooldown = 96;

export const CHARACTERS: Record<string, Character> = {
  ...CORE,
  reed: tune(CORE.vesper, {
    id: "reed",
    name: "Reed",
    title: "High collar",
    blurb: "A heavier dart and a longer coat. She wins the firefight and loses the sprint.",
    home: { x: 0.44, y: 0.28, label: "LISBON" },
    specialName: "Long Dart",
    hair: "bun",
    body: "slim",
    walk: 3.85,
    maxHp: 108,
    palette: { skin: "#e8c4a4", hair: "#1c140e", cloth: "#1f3d32", trim: "#d6c4a1", accent: "#86efac", metal: "#bbf7d0", sole: "#102018" },
    moves: reedMoves,
  }),
  juno: tune(CORE.brass, {
    id: "juno",
    name: "Juno",
    title: "Gold gloves",
    blurb: "Walks in, plants, and lets the rising hook finish the conversation.",
    home: { x: 0.22, y: 0.26, label: "OTTAWA" },
    specialName: "Gold Hook",
    hair: "mane",
    body: "broad",
    walk: 3.35,
    maxHp: 110,
    palette: { skin: "#c68642", hair: "#1a120c", cloth: "#111111", trim: "#f5d76e", accent: "#fbbf24", metal: "#fde68a", sole: "#1c1408" },
    moves: junoMoves,
  }),
  coil: tune(CORE.kite, {
    id: "coil",
    name: "Coil",
    title: "Hooded slide",
    blurb: "Hood up. A longer low slide, and the same dive if you jump away.",
    home: { x: 0.78, y: 0.46, label: "MANILA" },
    specialName: "Hood Slide",
    hair: "hood",
    body: "lean",
    walk: 4.35,
    maxHp: 96,
    palette: { skin: "#f0d0b0", hair: "#101820", cloth: "#14532d", trim: "#d9f99d", accent: "#84cc16", metal: "#ecfccb", sole: "#052e16" },
    moves: coilMoves,
  }),
  ash: tune(CORE.moth, {
    id: "ash",
    name: "Ash",
    title: "Cold flare",
    blurb: "Takes one step and fills the lane with a two-hit flare.",
    home: { x: 0.4, y: 0.2, label: "REYKJAVIK" },
    specialName: "Cold Flare",
    hair: "braid",
    body: "dancer",
    walk: 3.45,
    maxHp: 110,
    palette: { skin: "#f3d5c4", hair: "#d7dde8", cloth: "#334155", trim: "#e2e8f0", accent: "#93c5fd", metal: "#f8fafc", sole: "#0f172a" },
    moves: ashMoves,
  }),
};

export const ROSTER = ["vesper", "juno", "coil", "reed", "brass", "moth", "ash", "kite"] as const;

export function getCharacter(id: string): Character | null {
  return CHARACTERS[id] ?? null;
}

export function isCharacterId(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(CHARACTERS, id);
}
