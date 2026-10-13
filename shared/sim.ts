import { CHARACTERS } from "./characters";
import { emptyInput } from "./mask";
import type {
  Action,
  Combatant,
  Fighter,
  Input,
  Level,
  MatchState,
  Move,
  Rect,
  SoundName,
  SparkKind,
} from "./types";
import {
  BODY_W,
  CROUCH_H,
  GRAVITY,
  GROUND_Y,
  PUSH_DIST,
  ROUND_TIME,
  STAGE_PAD,
  STAGE_W,
  STAND_H,
  WINS_TO_TAKE,
} from "./types";

const ATTACKS = new Set<Action>([
  "punch",
  "crouchPunch",
  "airPunch",
  "kick",
  "crouchKick",
  "airKick",
  "special",
]);

const NEUTRAL = new Set<Action>(["idle", "walk", "crouch"]);

export function isAttack(action: Action): boolean {
  return ATTACKS.has(action);
}

export function moveFor(f: Fighter): Move | null {
  const ch = CHARACTERS[f.charId];
  if (!ch) return null;
  switch (f.action) {
    case "punch":
      return ch.moves.punch;
    case "crouchPunch":
      return ch.moves.crouchPunch;
    case "airPunch":
      return ch.moves.airPunch;
    case "kick":
      return ch.moves.kick;
    case "crouchKick":
      return ch.moves.crouchKick;
    case "airKick":
      return ch.moves.airKick;
    case "special":
      return f.airSpec ? (ch.moves.airSpecial ?? ch.moves.special) : ch.moves.special;
    default:
      return null;
  }
}

export function windup(f: Fighter): number {
  const move = moveFor(f);
  if (!move) return 0;
  const activeEnd = move.startup + move.active;
  if (f.frame < move.startup) return move.startup === 0 ? 1 : f.frame / move.startup;
  if (f.frame < activeEnd) return 1;
  const rec = move.recovery || 1;
  return Math.max(0, 1 - (f.frame - activeEnd) / rec);
}

export function bodyBox(f: Fighter): Rect | null {
  if (f.invuln > 0 || f.action === "down" || f.action === "ko") return null;
  const h = f.crouched ? CROUCH_H : STAND_H;
  return { x: f.x - BODY_W / 2, y: f.y - h, w: BODY_W, h };
}

export function attackBox(f: Fighter): Rect | null {
  const move = moveFor(f);
  if (!move || move.bolt) return null;
  if (f.frame < move.startup || f.frame >= move.startup + move.active) return null;
  const window = move.multi > 1 && f.frame >= move.startup + move.split ? 1 : 0;
  if (f.hitsLanded > window) return null;
  if (move.around) {
    return { x: f.x - move.w / 2, y: f.y - move.lift - move.h / 2, w: move.w, h: move.h };
  }
  const near = 24;
  const x = f.facing === 1 ? f.x + near : f.x - near - move.w;
  return { x, y: f.y - move.lift - move.h / 2, w: move.w, h: move.h };
}

export function overlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function makeFighter(slot: 0 | 1, who: Combatant, wins = 0): Fighter {
  const ch = CHARACTERS[who.charId] ?? CHARACTERS.vesper;
  return {
    slot,
    name: who.name,
    charId: ch.id,
    x: slot === 0 ? 620 : 1060,
    y: GROUND_Y,
    vx: 0,
    vy: 0,
    facing: slot === 0 ? 1 : -1,
    hp: ch.maxHp,
    maxHp: ch.maxHp,
    wins,
    action: "idle",
    frame: 0,
    stun: 0,
    onGround: true,
    landFall: 0,
    crouched: false,
    airUsed: false,
    airSpec: false,
    hitsLanded: 0,
    spawned: false,
    combo: 0,
    specialCd: 0,
    invuln: 0,
    flash: 0,
    bufP: 0,
    bufK: 0,
    bufS: 0,
    bufJ: 0,
    hold: emptyInput(),
  };
}

export function createMatch(a: Combatant, b: Combatant): MatchState {
  const state: MatchState = {
    tick: 0,
    phase: "intro",
    phaseTimer: 130,
    round: 1,
    timer: ROUND_TIME,
    timerAcc: 0,
    fighters: [makeFighter(0, a), makeFighter(1, b)],
    bolts: [],
    sparks: [],
    sounds: [],
    soundSeq: 0,
    shake: 0,
    flash: 0,
    banner: "ROUND 1",
    bannerLife: 100,
    roundWinner: -1,
    matchWinner: -1,
    hitstop: 0,
  };
  return state;
}

function cue(state: MatchState, name: SoundName) {
  state.soundSeq += 1;
  state.sounds.push({ id: state.soundSeq, name, born: state.tick });
  if (state.sounds.length > 12) state.sounds.splice(0, state.sounds.length - 12);
}

function spark(state: MatchState, x: number, y: number, kind: SparkKind, life = 14) {
  state.sparks.push({ x, y, life, max: life, kind });
  if (state.sparks.length > 24) state.sparks.splice(0, state.sparks.length - 24);
}

function facingToward(f: Fighter, other: Fighter) {
  if (other.x > f.x + 4) f.facing = 1;
  else if (other.x < f.x - 4) f.facing = -1;
}

function holdingBack(f: Fighter, input: Input): boolean {
  return f.facing === 1 ? input.left : input.right;
}

function canBlock(f: Fighter): boolean {
  return (
    f.onGround &&
    (f.action === "idle" || f.action === "walk" || f.action === "crouch" || f.action === "block")
  );
}

function startMove(state: MatchState, f: Fighter, action: Action, airSpec = false) {
  const ch = CHARACTERS[f.charId];
  f.action = action;
  f.frame = 0;
  f.hitsLanded = 0;
  f.spawned = false;
  f.airSpec = airSpec;
  f.stun = 0;
  if (action === "airPunch" || action === "airKick" || airSpec) f.airUsed = true;
  const move = moveFor(f);
  if (!move || !ch) return;
  if (move.invuln > 0) f.invuln = move.invuln;
  if (action === "special") f.specialCd = move.cooldown;
  if (move.hop !== 0) {
    f.vy = move.hop < 0 ? move.hop : Math.max(f.vy, move.hop);
    f.onGround = false;
  }
  if (move.slide !== 0) f.vx = f.facing * move.slide;
  else if (f.onGround) f.vx = 0;
  cue(state, action === "special" ? "special" : "swing");
}

function tryAttack(state: MatchState, f: Fighter, input: Input) {
  const wantSpecial = f.bufS > 0 && f.specialCd <= 0;
  const wantKick = f.bufK > 0;
  const wantPunch = f.bufP > 0;
  if (!wantSpecial && !wantKick && !wantPunch) return false;
  const down = input.down;
  if (!f.onGround) {
    if (f.airUsed || f.action !== "jump") return false;
    if (wantSpecial) {
      f.bufS = 0;
      startMove(state, f, "special", true);
      return true;
    }
    if (wantKick) {
      f.bufK = 0;
      startMove(state, f, "airKick");
      return true;
    }
    if (wantPunch) {
      f.bufP = 0;
      startMove(state, f, "airPunch");
      return true;
    }
    return false;
  }
  if (wantSpecial) {
    f.bufS = 0;
    startMove(state, f, "special", false);
    return true;
  }
  if (wantKick) {
    f.bufK = 0;
    startMove(state, f, down ? "crouchKick" : "kick");
    return true;
  }
  if (wantPunch) {
    f.bufP = 0;
    startMove(state, f, down ? "crouchPunch" : "punch");
    return true;
  }
  return false;
}

function startJump(f: Fighter, input: Input) {
  const ch = CHARACTERS[f.charId];
  if (!ch) return;
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  f.action = "jump";
  f.frame = 0;
  f.onGround = false;
  f.airUsed = false;
  f.airSpec = false;
  f.vy = ch.jump;
  f.vx = dir * ch.air;
}

function updateBuffers(f: Fighter, input: Input, freeze: boolean) {
  const tap = (now: boolean, was: boolean) => now && !was;
  if (tap(input.punch, f.hold.punch)) f.bufP = 8;
  else if (!freeze) f.bufP = Math.max(0, f.bufP - 1);
  if (tap(input.kick, f.hold.kick)) f.bufK = 8;
  else if (!freeze) f.bufK = Math.max(0, f.bufK - 1);
  if (tap(input.special, f.hold.special)) f.bufS = 8;
  else if (!freeze) f.bufS = Math.max(0, f.bufS - 1);
  if (tap(input.up, f.hold.up)) f.bufJ = 8;
  else if (!freeze) f.bufJ = Math.max(0, f.bufJ - 1);
}

function steerAttack(f: Fighter) {
  const move = moveFor(f);
  if (!move) return;
  if (move.slide !== 0) f.vx = f.facing * move.slide;
  else if (f.onGround) f.vx = 0;
}

function updateFighter(state: MatchState, f: Fighter, other: Fighter, input: Input) {
  const ch = CHARACTERS[f.charId];
  if (!ch) return;
  f.crouched = input.down && f.onGround && f.action !== "launch" && f.action !== "ko" && f.action !== "jump";

  if (f.action === "ko" || f.action === "win") {
    f.vx = 0;
    return;
  }
  if (f.action === "hit" || f.action === "block" || f.action === "down" || f.action === "getup") {
    f.vx *= 0.8;
    return;
  }
  if (f.action === "launch") {
    f.vx *= 0.99;
    return;
  }
  if (isAttack(f.action)) {
    steerAttack(f);
    return;
  }
  if (!f.onGround && NEUTRAL.has(f.action)) f.action = "jump";
  if (!f.onGround && f.action === "jump") {
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (dir !== 0) f.vx = dir * ch.air;
    else f.vx *= 0.94;
    tryAttack(state, f, input);
    return;
  }
  if (!NEUTRAL.has(f.action)) return;

  facingToward(f, other);
  if (tryAttack(state, f, input)) return;
  if (f.bufJ > 0 && !input.down) {
    f.bufJ = 0;
    startJump(f, input);
    return;
  }
  if (input.down) {
    f.action = "crouch";
    f.vx = 0;
    f.crouched = true;
    return;
  }
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (dir !== 0) {
    f.action = "walk";
    f.vx = dir * ch.walk;
  } else {
    f.action = "idle";
    f.vx = 0;
  }
}

function integrate(f: Fighter) {
  f.landFall = 0;
  if (!f.onGround) {
    f.vy += GRAVITY;
    if (f.vy > 16) f.vy = 16;
  }
  f.x += f.vx;
  f.y += f.vy;
  if (f.y >= GROUND_Y) {
    const fall = f.vy;
    f.y = GROUND_Y;
    f.vy = 0;
    if (!f.onGround) f.landFall = Math.max(0.01, fall);
    f.onGround = true;
  } else {
    f.onGround = false;
  }
}

function land(state: MatchState, f: Fighter, fall: number) {
  f.airUsed = false;
  if (fall > 6) cue(state, "land");
  if (f.hp <= 0 || f.action === "ko") {
    f.action = "ko";
    f.vx = 0;
    return;
  }
  if (f.action === "launch") {
    f.action = "down";
    f.frame = 0;
    f.stun = 30;
    f.vx = 0;
    return;
  }
  if (f.action === "jump") {
    f.action = "idle";
    f.frame = 0;
    f.vx *= 0.4;
    return;
  }
  if (isAttack(f.action) || f.action === "hit") {
    f.action = "getup";
    f.frame = 0;
    f.stun = 10;
    f.vx = 0;
  }
}

function clampStage(f: Fighter, other: Fighter) {
  const min = STAGE_PAD;
  const max = STAGE_W - STAGE_PAD;
  if (f.x < min) {
    const over = min - f.x;
    f.x = min;
    other.x += over;
  } else if (f.x > max) {
    const over = f.x - max;
    f.x = max;
    other.x -= over;
  }
}

function pushable(f: Fighter): boolean {
  return NEUTRAL.has(f.action) || f.action === "block" || f.action === "hit" || f.action === "walk";
}

function resolvePush(a: Fighter, b: Fighter) {
  if (!a.onGround || !b.onGround) return;
  const dx = b.x - a.x;
  const dist = Math.abs(dx);
  if (dist >= PUSH_DIST) return;
  const dir = dx === 0 ? 1 : Math.sign(dx);
  const overlapAmt = PUSH_DIST - dist;
  const aToward = a.vx * dir > 0.4;
  const bToward = b.vx * -dir > 0.4;
  if (aToward && !bToward && pushable(b)) {
    b.x += dir * overlapAmt;
  } else if (bToward && !aToward && pushable(a)) {
    a.x -= dir * overlapAmt;
  } else {
    a.x -= dir * overlapAmt * 0.5;
    b.x += dir * overlapAmt * 0.5;
  }
}

function hardClamp(f: Fighter) {
  if (f.x < STAGE_PAD) f.x = STAGE_PAD;
  if (f.x > STAGE_W - STAGE_PAD) f.x = STAGE_W - STAGE_PAD;
}

interface Strike {
  damage: number;
  hitstun: number;
  blockstun: number;
  push: number;
  level: Level;
  launch: number;
  chip: boolean;
  x: number;
  y: number;
  attacker: Fighter;
  melee: boolean;
}

function resetComboIfOpen(state: MatchState) {
  for (let i = 0; i < 2; i++) {
    const defender = state.fighters[1 - i];
    if (NEUTRAL.has(defender.action) || defender.action === "jump") {
      state.fighters[i].combo = 0;
    }
  }
}

function applyStrike(state: MatchState, defender: Fighter, input: Input, strike: Strike) {
  const attacker = strike.attacker;
  const back = holdingBack(defender, input);
  const down = input.down || defender.crouched;
  let blocked = false;
  if (canBlock(defender) && back) {
    if (strike.level === "low") blocked = down;
    else if (strike.level === "overhead") blocked = !down;
    else blocked = true;
  }
  const dir = Math.sign(defender.x - strike.x) || -attacker.facing;
  const sparkY = strike.level === "low" ? defender.y - 36 : defender.y - 84;

  if (blocked) {
    const chip = strike.chip ? 2 : 0;
    defender.hp = Math.max(0, defender.hp - chip);
    defender.action = "block";
    defender.frame = 0;
    defender.stun = strike.blockstun;
    defender.vx = dir * 1.4;
    defender.x += dir * strike.push;
    attacker.combo = 0;
    spark(state, defender.x - dir * 10, sparkY, "block", 10);
    cue(state, "block");
    state.hitstop = Math.max(state.hitstop, 6);
    state.shake = Math.max(state.shake, 4);
    if (strike.melee) attacker.hitsLanded += 1;
    return;
  }

  const step = attacker.combo;
  const scale = step <= 0 ? 1 : step === 1 ? 0.88 : step === 2 ? 0.74 : 0.62;
  const dmg = Math.max(1, Math.round(strike.damage * scale));
  defender.hp = Math.max(0, defender.hp - dmg);
  attacker.combo += 1;
  defender.flash = 8;
  const airborne = !defender.onGround || strike.launch < -1;
  const juggle = defender.action === "launch" || defender.action === "jump" || defender.action === "airPunch" || defender.action === "airKick";
  if (airborne || juggle) {
    const already = defender.action === "launch" || defender.action === "hit" && !defender.onGround;
    defender.action = "launch";
    defender.onGround = false;
    defender.vy = already ? 3.5 : strike.launch < -1 ? strike.launch : -7.2;
    defender.vx = dir * 2.2;
    defender.frame = 0;
  } else {
    defender.action = "hit";
    defender.frame = 0;
    defender.stun = strike.hitstun;
    defender.vx = dir * 2.4;
    defender.vy = 0;
  }
  defender.x += dir * strike.push * 0.45;
  spark(state, defender.x - dir * 8, sparkY, "hit", strike.launch < -1 ? 18 : 14);
  cue(state, "hit");
  state.hitstop = Math.max(state.hitstop, strike.launch < -1 ? 14 : 9);
  state.shake = Math.max(state.shake, strike.launch < -1 ? 12 : 7);
  if (strike.melee) attacker.hitsLanded += 1;
}

function spawnBolts(state: MatchState) {
  for (const f of state.fighters) {
    if (f.action !== "special" || f.spawned) continue;
    const move = moveFor(f);
    if (!move?.bolt) continue;
    if (f.frame !== move.startup) continue;
    if (state.bolts.some((b) => b.owner === f.slot && !b.dead)) continue;
    f.spawned = true;
    state.bolts.push({
      owner: f.slot,
      x: f.x + f.facing * 48,
      y: f.y - move.bolt.lift,
      vx: f.facing * move.bolt.speed,
      life: 80,
      damage: move.bolt.damage,
      hitstun: move.hitstun,
      blockstun: move.blockstun,
      push: move.push,
      w: 36,
      h: 28,
      dead: false,
    });
  }
}

function moveBolts(state: MatchState) {
  for (const b of state.bolts) {
    b.x += b.vx;
    b.life -= 1;
    if (b.life <= 0 || b.x < -40 || b.x > STAGE_W + 40) b.dead = true;
  }
  for (let i = 0; i < state.bolts.length; i++) {
    for (let j = i + 1; j < state.bolts.length; j++) {
      const a = state.bolts[i];
      const c = state.bolts[j];
      if (a.dead || c.dead || a.owner === c.owner) continue;
      const ar = { x: a.x - a.w / 2, y: a.y - a.h / 2, w: a.w, h: a.h };
      const cr = { x: c.x - c.w / 2, y: c.y - c.h / 2, w: c.w, h: c.h };
      if (overlap(ar, cr)) {
        a.dead = true;
        c.dead = true;
        spark(state, (a.x + c.x) / 2, (a.y + c.y) / 2, "clash", 16);
        cue(state, "clash");
      }
    }
  }
}

function resolveHits(state: MatchState, inputs: [Input, Input]) {
  const bodies = state.fighters.map((f) => bodyBox(f));
  const boxes = state.fighters.map((f) => attackBox(f));
  const pending: { defender: 0 | 1; strike: Strike }[] = [];

  for (const slot of [0, 1] as const) {
    const box = boxes[slot];
    const other = (1 - slot) as 0 | 1;
    const body = bodies[other];
    if (!box || !body || !overlap(box, body)) continue;
    const move = moveFor(state.fighters[slot]);
    if (!move) continue;
    pending.push({
      defender: other,
      strike: {
        damage: move.damage,
        hitstun: move.hitstun,
        blockstun: move.blockstun,
        push: move.push,
        level: move.level,
        launch: move.launch,
        chip: state.fighters[slot].action === "special",
        x: state.fighters[slot].x,
        y: state.fighters[slot].y - move.lift,
        attacker: state.fighters[slot],
        melee: true,
      },
    });
  }

  for (const bolt of state.bolts) {
    if (bolt.dead) continue;
    const box = { x: bolt.x - bolt.w / 2, y: bolt.y - bolt.h / 2, w: bolt.w, h: bolt.h };
    const other = (1 - bolt.owner) as 0 | 1;
    const body = bodies[other];
    if (!body || !overlap(box, body)) continue;
    bolt.dead = true;
    pending.push({
      defender: other,
      strike: {
        damage: bolt.damage,
        hitstun: bolt.hitstun,
        blockstun: bolt.blockstun,
        push: bolt.push,
        level: "mid",
        launch: 0,
        chip: true,
        x: bolt.x,
        y: bolt.y,
        attacker: state.fighters[bolt.owner],
        melee: false,
      },
    });
  }

  for (const hit of pending) {
    if (hit.strike.damage <= 0) continue;
    applyStrike(state, state.fighters[hit.defender], inputs[hit.defender], hit.strike);
  }
  state.bolts = state.bolts.filter((b) => !b.dead);
}

function duration(f: Fighter): number {
  if (f.action === "hit" || f.action === "block" || f.action === "down" || f.action === "getup") {
    return Math.max(1, f.stun);
  }
  const move = moveFor(f);
  if (!move) return 1;
  return move.startup + move.active + move.recovery;
}

function advanceFrames(f: Fighter, input: Input) {
  if (f.action === "ko" || f.action === "win" || f.action === "launch" || f.action === "jump") return;
  if (!isAttack(f.action) && f.action !== "hit" && f.action !== "block" && f.action !== "down" && f.action !== "getup") {
    return;
  }
  const total = duration(f);
  if (f.frame + 1 < total) {
    f.frame += 1;
    return;
  }
  if (f.action === "down") {
    f.action = "getup";
    f.frame = 0;
    f.stun = 14;
    f.invuln = 14;
    f.vx = 0;
    return;
  }
  if (f.hp <= 0) {
    f.action = "ko";
    f.vx = 0;
    return;
  }
  if (!f.onGround) {
    f.action = "jump";
    f.frame = 0;
    f.stun = 0;
    f.airSpec = false;
    return;
  }
  f.action = input.down ? "crouch" : "idle";
  f.frame = 0;
  f.stun = 0;
  f.vx = 0;
  f.airSpec = false;
}

function enterKo(state: MatchState) {
  const dead0 = state.fighters[0].hp <= 0;
  const dead1 = state.fighters[1].hp <= 0;
  if (!dead0 && !dead1) return;
  state.phase = "ko";
  state.phaseTimer = 170;
  state.hitstop = Math.max(state.hitstop, 16);
  state.shake = Math.max(state.shake, 16);
  state.flash = 0.72;
  cue(state, "ko");
  if (dead0 && dead1) {
    state.banner = "DOUBLE KO";
    state.roundWinner = -1;
  } else if (dead1) {
    state.fighters[0].wins += 1;
    state.banner = "KO";
    state.roundWinner = 0;
    cue(state, "win");
  } else {
    state.fighters[1].wins += 1;
    state.banner = "KO";
    state.roundWinner = 1;
    cue(state, "win");
  }
  state.bannerLife = 110;
  for (const f of state.fighters) {
    if (f.hp <= 0) {
      f.action = "ko";
      f.vx = 0;
      f.vy = -9;
      f.onGround = false;
      spark(state, f.x, f.y - 70, "ko", 22);
    }
  }
}

function enterTime(state: MatchState) {
  state.phase = "time";
  state.phaseTimer = 150;
  const h0 = state.fighters[0].hp;
  const h1 = state.fighters[1].hp;
  state.banner = "TIME";
  state.bannerLife = 110;
  if (h0 === h1) {
    state.roundWinner = -1;
    state.banner = "DRAW";
  } else if (h0 > h1) {
    state.fighters[0].wins += 1;
    state.roundWinner = 0;
    cue(state, "win");
  } else {
    state.fighters[1].wins += 1;
    state.roundWinner = 1;
    cue(state, "win");
  }
}

function resetRound(state: MatchState) {
  const a = state.fighters[0];
  const b = state.fighters[1];
  state.fighters = [
    makeFighter(0, { name: a.name, charId: a.charId }, a.wins),
    makeFighter(1, { name: b.name, charId: b.charId }, b.wins),
  ];
  state.bolts = [];
  state.sparks = [];
  state.hitstop = 0;
  state.timer = ROUND_TIME;
  state.timerAcc = 0;
  state.roundWinner = -1;
  state.shake = 0;
  state.flash = 0;
}

function finishIntermission(state: MatchState) {
  const w0 = state.fighters[0].wins;
  const w1 = state.fighters[1].wins;
  if (w0 >= WINS_TO_TAKE || w1 >= WINS_TO_TAKE || state.round >= 7) {
    state.phase = "match";
    const winner = w0 === w1 ? -1 : w0 > w1 ? 0 : 1;
    state.matchWinner = winner;
    state.banner = winner === 0 || winner === 1 ? state.fighters[winner].name.toUpperCase() : "DRAW";
    state.bannerLife = 999;
    return;
  }
  state.round += 1;
  resetRound(state);
  state.phase = "intro";
  state.phaseTimer = 120;
  state.banner = `ROUND ${state.round}`;
  state.bannerLife = 90;
}

function poseWinners(state: MatchState) {
  for (const f of state.fighters) {
    if (!f.onGround) {
      f.vy += GRAVITY;
      f.y += f.vy;
      f.frame += 1;
      if (f.y >= GROUND_Y) {
        f.y = GROUND_Y;
        f.vy = 0;
        f.onGround = true;
        f.vx = 0;
      }
      continue;
    }
    if (f.hp <= 0) {
      f.action = "ko";
      f.vx = 0;
    } else if (state.roundWinner === f.slot || (state.phase === "time" && state.roundWinner === f.slot)) {
      f.action = "win";
      f.vx = 0;
      f.frame += 1;
    } else if (state.roundWinner === -1) {
      f.action = "idle";
    }
  }
}

function stepInner(state: MatchState, inputs: [Input, Input]) {
  state.tick += 1;
  state.bannerLife = Math.max(0, state.bannerLife - 1);
  if (state.flash > 0) state.flash = Math.max(0, state.flash - 0.04);
  for (const f of state.fighters) if (f.flash > 0) f.flash -= 1;
  state.sounds = state.sounds.filter((s) => state.tick - s.born < 24);

  if (state.phase === "intro") {
    state.phaseTimer -= 1;
    if (state.phaseTimer === 88) cue(state, "round");
    if (state.phaseTimer === 36) {
      state.banner = "FIGHT";
      state.bannerLife = 48;
      cue(state, "fight");
    }
    if (state.phaseTimer <= 0) state.phase = "fight";
    return;
  }

  if (state.phase === "ko" || state.phase === "time") {
    poseWinners(state);
    for (const s of state.sparks) s.life -= 1;
    state.sparks = state.sparks.filter((s) => s.life > 0);
    state.phaseTimer -= 1;
    if (state.phaseTimer <= 0) finishIntermission(state);
    return;
  }

  if (state.phase === "match") return;

  for (let i = 0; i < 2; i++) updateBuffers(state.fighters[i], inputs[i], state.hitstop > 0);
  if (state.hitstop > 0) {
    state.hitstop -= 1;
    return;
  }

  if (state.shake > 0) {
    state.shake *= 0.84;
    if (state.shake < 0.3) state.shake = 0;
  }
  for (const s of state.sparks) s.life -= 1;
  state.sparks = state.sparks.filter((s) => s.life > 0);

  state.timerAcc += 1;
  if (state.timerAcc >= 60) {
    state.timerAcc = 0;
    state.timer -= 1;
    if (state.timer <= 0) {
      enterTime(state);
      return;
    }
  }

  resetComboIfOpen(state);
  updateFighter(state, state.fighters[0], state.fighters[1], inputs[0]);
  updateFighter(state, state.fighters[1], state.fighters[0], inputs[1]);
  integrate(state.fighters[0]);
  integrate(state.fighters[1]);
  resolvePush(state.fighters[0], state.fighters[1]);
  clampStage(state.fighters[0], state.fighters[1]);
  clampStage(state.fighters[1], state.fighters[0]);
  hardClamp(state.fighters[0]);
  hardClamp(state.fighters[1]);

  for (const f of state.fighters) {
    if (f.specialCd > 0) f.specialCd -= 1;
  }

  spawnBolts(state);
  moveBolts(state);
  resolveHits(state, inputs);
  for (const f of state.fighters) {
    if (f.invuln > 0) f.invuln -= 1;
  }
  for (const f of state.fighters) {
    if (f.landFall > 0) land(state, f, f.landFall);
  }
  advanceFrames(state.fighters[0], inputs[0]);
  advanceFrames(state.fighters[1], inputs[1]);
  enterKo(state);
}

export function step(state: MatchState, inputs: [Input, Input]) {
  stepInner(state, inputs);
  state.fighters[0].hold = { ...inputs[0] };
  state.fighters[1].hold = { ...inputs[1] };
}
