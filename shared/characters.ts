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
  ryu: {
    id: "ryu",
    name: "Ryu",
    title: "Wandering warrior",
    blurb: "Hadoken from a distance.",
    home: { x: 0.8, y: 0.34, label: "JAPAN" },
    specialName: "Hadoken",
    specialKind: "dart",
    tempo: "Fleet",
    power: "Light",
    walk: 4.55,
    air: 4.1,
    jump: -13.7,
    maxHp: 100,
    hair: "crop",
    body: "slim",
    palette: {
      skin: "#f0c09a",
      hair: "#1a120c",
      cloth: "#f4f4f6",
      trim: "#e02028",
      accent: "#e02028",
      metal: "#f2f2f2",
      sole: "#1a120c",
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
  ken: {
    id: "ken",
    name: "Ken",
    title: "American master",
    blurb: "Same fireball school, but the Shoryuken is the round ender.",
    home: { x: 0.16, y: 0.28, label: "U.S.A." },
    specialName: "Shoryuken",
    specialKind: "riser",
    tempo: "Measured",
    power: "Heavy",
    walk: 3.05,
    air: 3.1,
    jump: -12.5,
    maxHp: 114,
    hair: "mane",
    body: "broad",
    palette: {
      skin: "#f0c09a",
      hair: "#f0d060",
      cloth: "#d41820",
      trim: "#f0d060",
      accent: "#ffd24a",
      metal: "#f4f4f4",
      sole: "#1a120c",
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
  honda: {
    id: "honda",
    name: "E. Honda",
    title: "Sumo",
    blurb: "Hundred-hand slap on the ground, and a diving headbutt from the air.",
    home: { x: 0.78, y: 0.3, label: "JAPAN" },
    specialName: "Headbutt",
    specialKind: "dive",
    tempo: "Quick",
    power: "Light",
    walk: 4.2,
    air: 4.4,
    jump: -15,
    maxHp: 94,
    hair: "bun",
    body: "broad",
    palette: {
      skin: "#f0c09a",
      hair: "#1a120c",
      cloth: "#f4f4f6",
      trim: "#2456c8",
      accent: "#2456c8",
      metal: "#f0c09a",
      sole: "#1a120c",
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
  blanka: {
    id: "blanka",
    name: "Blanka",
    title: "Wild beast",
    blurb: "The electric shock hits twice and fills the space in front of him.",
    home: { x: 0.3, y: 0.42, label: "BRAZIL" },
    specialName: "Electricity",
    specialKind: "flare",
    tempo: "Even",
    power: "Medium",
    walk: 3.7,
    air: 3.6,
    jump: -13.3,
    maxHp: 104,
    hair: "mane",
    body: "broad",
    palette: {
      skin: "#7dba3a",
      hair: "#f08a14",
      cloth: "#f08a14",
      trim: "#ffe14a",
      accent: "#ffe14a",
      metal: "#7dba3a",
      sole: "#1a4010",
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

const reedMoves = structuredClone(CORE.ryu.moves);
if (reedMoves.special.bolt) reedMoves.special.bolt = { speed: 7.6, damage: 13, lift: 96 };
reedMoves.special.cooldown = 92;

const junoMoves = structuredClone(CORE.ken.moves);
junoMoves.special.damage = 16;
junoMoves.special.cooldown = 92;
junoMoves.special.launch = -10;

const coilMoves = structuredClone(CORE.honda.moves);
coilMoves.special.slide = 7.2;
coilMoves.special.damage = 13;

const ashMoves = structuredClone(CORE.blanka.moves);
ashMoves.special.damage = 9;
ashMoves.special.cooldown = 96;

export const CHARACTERS: Record<string, Character> = {
  ...CORE,
  guile: tune(CORE.ryu, {
    id: "guile",
    name: "Guile",
    title: "Air force",
    blurb: "Sonic Boom travels slower and hits harder. Flash Kick is not this build.",
    home: { x: 0.2, y: 0.24, label: "U.S.A." },
    specialName: "Sonic Boom",
    hair: "crop",
    body: "broad",
    walk: 3.85,
    maxHp: 108,
    palette: { skin: "#f0c09a", hair: "#f0d060", cloth: "#2f6b32", trim: "#f4f4f6", accent: "#2456c8", metal: "#d8d8d8", sole: "#1a120c" },
    moves: reedMoves,
  }),
  zangief: tune(CORE.ken, {
    id: "zangief",
    name: "Zangief",
    title: "Red cyclone",
    blurb: "Walks in and ends the round with a spinning pile driver.",
    home: { x: 0.55, y: 0.2, label: "U.S.S.R." },
    specialName: "Screw Pile",
    hair: "crop",
    body: "broad",
    walk: 3.15,
    maxHp: 118,
    palette: { skin: "#e0a070", hair: "#c01018", cloth: "#c01018", trim: "#f0d060", accent: "#c01018", metal: "#e8c090", sole: "#1a120c" },
    moves: junoMoves,
  }),
  chunli: tune(CORE.honda, {
    id: "chunli",
    name: "Chun-Li",
    title: "Interpol",
    blurb: "A long low slide, and a diving kick if you try to jump out.",
    home: { x: 0.7, y: 0.32, label: "CHINA" },
    specialName: "Spinning Bird",
    hair: "bun",
    body: "dancer",
    walk: 4.35,
    maxHp: 96,
    palette: { skin: "#f0c09a", hair: "#1a120c", cloth: "#2456c8", trim: "#f4f4f6", accent: "#f0d060", metal: "#f4f4f6", sole: "#f4f4f6" },
    moves: coilMoves,
  }),
  dhalsim: tune(CORE.blanka, {
    id: "dhalsim",
    name: "Dhalsim",
    title: "Yoga master",
    blurb: "Yoga Flame covers the space in front of him. Stay out, or get in after it ends.",
    home: { x: 0.62, y: 0.38, label: "INDIA" },
    specialName: "Yoga Flame",
    hair: "crop",
    body: "lean",
    walk: 3.45,
    maxHp: 100,
    palette: { skin: "#c68642", hair: "#1a120c", cloth: "#f0d060", trim: "#e02028", accent: "#f08a14", metal: "#e8c090", sole: "#1a120c" },
    moves: ashMoves,
  }),
};

export const ROSTER = ["ryu", "honda", "blanka", "guile", "ken", "chunli", "zangief", "dhalsim"] as const;

export function getCharacter(id: string): Character | null {
  return CHARACTERS[id] ?? null;
}

export function isCharacterId(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(CHARACTERS, id);
}
