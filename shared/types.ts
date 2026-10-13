export const VIEW_W = 960;
export const VIEW_H = 540;
export const STAGE_W = 1680;
export const GROUND_Y = 456;
export const PUSH_DIST = 64;
export const BODY_W = 44;
export const STAND_H = 136;
export const CROUCH_H = 86;
export const STAGE_PAD = 50;
export const GRAVITY = 0.64;
export const ROUND_TIME = 99;
export const WINS_TO_TAKE = 2;

export interface Input {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  punch: boolean;
  kick: boolean;
  special: boolean;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Level = "low" | "mid" | "overhead";
export type SpecialKind = "dart" | "riser" | "dive" | "flare";
export type Hair = "ponytail" | "crop" | "cap" | "bob" | "bun" | "mane" | "braid" | "hood";
export type BodyShape = "slim" | "broad" | "lean" | "dancer";

export interface BoltSpec {
  speed: number;
  damage: number;
  lift: number;
}

export interface Move {
  startup: number;
  active: number;
  recovery: number;
  damage: number;
  hitstun: number;
  blockstun: number;
  push: number;
  w: number;
  h: number;
  lift: number;
  level: Level;
  launch: number;
  slide: number;
  hop: number;
  invuln: number;
  cooldown: number;
  multi: number;
  split: number;
  around: boolean;
  bolt: BoltSpec | null;
}

export interface Palette {
  skin: string;
  hair: string;
  cloth: string;
  trim: string;
  accent: string;
  metal: string;
  sole: string;
}

export interface Home {
  x: number;
  y: number;
  label: string;
}

export interface Character {
  id: string;
  name: string;
  title: string;
  blurb: string;
  home: Home;
  specialName: string;
  specialKind: SpecialKind;
  tempo: string;
  power: string;
  walk: number;
  air: number;
  jump: number;
  maxHp: number;
  hair: Hair;
  body: BodyShape;
  palette: Palette;
  moves: {
    punch: Move;
    crouchPunch: Move;
    airPunch: Move;
    kick: Move;
    crouchKick: Move;
    airKick: Move;
    special: Move;
    airSpecial?: Move;
  };
}

export type Action =
  | "idle"
  | "walk"
  | "crouch"
  | "jump"
  | "punch"
  | "crouchPunch"
  | "airPunch"
  | "kick"
  | "crouchKick"
  | "airKick"
  | "special"
  | "hit"
  | "block"
  | "launch"
  | "down"
  | "getup"
  | "ko"
  | "win";

export type Phase = "intro" | "fight" | "ko" | "time" | "match";

export interface Fighter {
  slot: 0 | 1;
  name: string;
  charId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  wins: number;
  action: Action;
  frame: number;
  stun: number;
  onGround: boolean;
  landFall: number;
  crouched: boolean;
  airUsed: boolean;
  airSpec: boolean;
  hitsLanded: number;
  spawned: boolean;
  combo: number;
  specialCd: number;
  invuln: number;
  flash: number;
  bufP: number;
  bufK: number;
  bufS: number;
  bufJ: number;
  hold: Input;
}

export interface Bolt {
  owner: 0 | 1;
  x: number;
  y: number;
  vx: number;
  life: number;
  damage: number;
  hitstun: number;
  blockstun: number;
  push: number;
  w: number;
  h: number;
  dead: boolean;
}

export type SparkKind = "hit" | "block" | "ko" | "clash";

export interface Spark {
  x: number;
  y: number;
  life: number;
  max: number;
  kind: SparkKind;
}

export type SoundName =
  | "swing"
  | "hit"
  | "block"
  | "special"
  | "ko"
  | "land"
  | "fight"
  | "round"
  | "clash"
  | "win";

export interface SoundCue {
  id: number;
  name: SoundName;
  born: number;
}

export interface MatchState {
  tick: number;
  phase: Phase;
  phaseTimer: number;
  round: number;
  timer: number;
  timerAcc: number;
  fighters: [Fighter, Fighter];
  bolts: Bolt[];
  sparks: Spark[];
  sounds: SoundCue[];
  soundSeq: number;
  shake: number;
  flash: number;
  banner: string;
  bannerLife: number;
  roundWinner: -1 | 0 | 1;
  matchWinner: -1 | 0 | 1;
  hitstop: number;
}

export interface Combatant {
  name: string;
  charId: string;
}
