import assert from "node:assert/strict";
import { test } from "node:test";
import { cpuInput } from "../shared/ai";
import { CHARACTERS } from "../shared/characters";
import { emptyInput } from "../shared/mask";
import { attackBox, bodyBox, createMatch, moveFor, overlap, step } from "../shared/sim";
import type { Action, Input, MatchState } from "../shared/types";
import { GROUND_Y, PUSH_DIST, STAGE_PAD, STAGE_W } from "../shared/types";

function blank(): Input {
  return emptyInput();
}

function hold(partial: Partial<Input>): Input {
  return { ...emptyInput(), ...partial };
}

function fresh(): MatchState {
  return createMatch(
    { name: "Vesper", charId: "vesper" },
    { name: "Brass", charId: "brass" },
  );
}

function place(state: MatchState, dist = PUSH_DIST) {
  state.phase = "fight";
  state.hitstop = 0;
  state.timer = 99;
  state.timerAcc = 0;
  state.bolts = [];
  state.sparks = [];
  state.fighters[0].x = 700;
  state.fighters[1].x = 700 + dist;
  for (const f of state.fighters) {
    f.y = GROUND_Y;
    f.vx = 0;
    f.vy = 0;
    f.onGround = true;
    f.landFall = 0;
    f.action = "idle";
    f.frame = 0;
    f.stun = 0;
    f.invuln = 0;
    f.hp = f.maxHp;
    f.crouched = false;
    f.hitsLanded = 0;
    f.spawned = false;
    f.airSpec = false;
    f.specialCd = 0;
    f.combo = 0;
    f.bufP = 0;
    f.bufK = 0;
    f.bufS = 0;
    f.bufJ = 0;
    f.hold = emptyInput();
    f.flash = 0;
  }
  state.fighters[0].facing = 1;
  state.fighters[1].facing = -1;
}

function arm(state: MatchState, action: Action) {
  const a = state.fighters[0];
  a.action = action;
  a.airSpec = action === "airKick" || action === "airPunch";
  const move = moveFor(a);
  assert.ok(move, "missing move");
  a.frame = move.startup;
  a.hitsLanded = 0;
  a.spawned = false;
}

test("a punch in range deals damage", () => {
  const state = fresh();
  place(state);
  arm(state, "punch");
  const before = attackBox(state.fighters[0]);
  const body = bodyBox(state.fighters[1]);
  assert.ok(before && body && overlap(before, body), "punch should overlap");
  const hp = state.fighters[1].hp;
  step(state, [blank(), blank()]);
  assert.equal(state.fighters[1].hp, hp - 7);
  assert.equal(state.fighters[1].action, "hit");
});

test("holding back blocks a mid punch", () => {
  const state = fresh();
  place(state);
  arm(state, "punch");
  const hp = state.fighters[1].hp;
  step(state, [blank(), hold({ right: true })]);
  assert.equal(state.fighters[1].hp, hp);
  assert.equal(state.fighters[1].action, "block");
});

test("a low kick beats a standing block and loses to down-back", () => {
  const stand = fresh();
  place(stand);
  arm(stand, "crouchKick");
  step(stand, [blank(), hold({ right: true })]);
  assert.equal(stand.fighters[1].action, "hit");
  assert.ok(stand.fighters[1].hp < stand.fighters[1].maxHp);

  const crouch = fresh();
  place(crouch);
  arm(crouch, "crouchKick");
  const hp = crouch.fighters[1].hp;
  step(crouch, [blank(), hold({ right: true, down: true })]);
  assert.equal(crouch.fighters[1].hp, hp);
  assert.equal(crouch.fighters[1].action, "block");
});

test("a jumping kick is an overhead", () => {
  const crouched = fresh();
  place(crouched);
  arm(crouched, "airKick");
  step(crouched, [blank(), hold({ right: true, down: true })]);
  assert.ok(crouched.fighters[1].hp < crouched.fighters[1].maxHp);
  assert.notEqual(crouched.fighters[1].action, "block");

  const standing = fresh();
  place(standing);
  arm(standing, "airKick");
  const hp = standing.fighters[1].hp;
  step(standing, [blank(), hold({ right: true })]);
  assert.equal(standing.fighters[1].hp, hp);
  assert.equal(standing.fighters[1].action, "block");
});

test("vesper's dart travels and hits", () => {
  const state = fresh();
  place(state, 520);
  state.fighters[0].action = "special";
  state.fighters[0].frame = CHARACTERS.vesper.moves.special.startup;
  const hp = state.fighters[1].hp;
  for (let i = 0; i < 80; i++) step(state, [blank(), blank()]);
  assert.ok(state.fighters[1].hp < hp);
  assert.equal(state.bolts.length, 0);
});

test("opposing darts erase each other", () => {
  const state = createMatch(
    { name: "Vesper", charId: "vesper" },
    { name: "Vesper", charId: "vesper" },
  );
  place(state, 760);
  for (const f of state.fighters) {
    f.action = "special";
    f.frame = CHARACTERS.vesper.moves.special.startup;
    f.spawned = false;
  }
  state.fighters[0].facing = 1;
  state.fighters[1].facing = -1;
  for (let i = 0; i < 50; i++) step(state, [blank(), blank()]);
  assert.equal(state.fighters[0].hp, state.fighters[0].maxHp);
  assert.equal(state.fighters[1].hp, state.fighters[1].maxHp);
  assert.equal(state.bolts.length, 0);
});

test("a rising hook launches", () => {
  const state = createMatch(
    { name: "Brass", charId: "brass" },
    { name: "Kite", charId: "kite" },
  );
  place(state);
  state.fighters[0].action = "special";
  state.fighters[0].frame = CHARACTERS.brass.moves.special.startup;
  step(state, [blank(), blank()]);
  assert.equal(state.fighters[1].action, "launch");
  assert.equal(state.fighters[1].onGround, false);
  assert.ok(state.fighters[1].vy < 0);
});

test("ko gives a round and two rounds win the match", () => {
  const state = fresh();
  place(state);
  arm(state, "punch");
  state.fighters[1].hp = 1;
  step(state, [blank(), blank()]);
  assert.equal(state.phase, "ko");
  assert.equal(state.fighters[0].wins, 1);
  let guard = 0;
  while (state.phase === "ko" && guard++ < 400) step(state, [blank(), blank()]);
  assert.equal(state.phase, "intro");
  assert.equal(state.round, 2);

  place(state);
  arm(state, "punch");
  state.fighters[1].hp = 1;
  step(state, [blank(), blank()]);
  assert.equal(state.fighters[0].wins, 2);
  guard = 0;
  while (state.phase === "ko" && guard++ < 400) step(state, [blank(), blank()]);
  assert.equal(state.phase, "match");
  assert.equal(state.matchWinner, 0);
});

test("double ko awards no round", () => {
  const state = fresh();
  place(state);
  arm(state, "punch");
  state.fighters[1].action = "punch";
  state.fighters[1].frame = CHARACTERS.brass.moves.punch.startup;
  state.fighters[0].hp = 1;
  state.fighters[1].hp = 1;
  step(state, [blank(), blank()]);
  assert.equal(state.phase, "ko");
  assert.equal(state.banner, "DOUBLE KO");
  assert.equal(state.fighters[0].wins, 0);
  assert.equal(state.fighters[1].wins, 0);
});

test("time favors the healthier fighter and draws when even", () => {
  const draw = fresh();
  place(draw, 400);
  draw.timer = 1;
  draw.timerAcc = 59;
  draw.fighters[0].hp = 40;
  draw.fighters[1].hp = 40;
  step(draw, [blank(), blank()]);
  assert.equal(draw.phase, "time");
  assert.equal(draw.roundWinner, -1);
  assert.equal(draw.fighters[0].wins, 0);

  const win = fresh();
  place(win, 400);
  win.timer = 1;
  win.timerAcc = 59;
  win.fighters[0].hp = 50;
  win.fighters[1].hp = 20;
  step(win, [blank(), blank()]);
  assert.equal(win.phase, "time");
  assert.equal(win.roundWinner, 0);
  assert.equal(win.fighters[0].wins, 1);
});

test("intro ignores punches", () => {
  const state = fresh();
  const hp = state.fighters[1].hp;
  for (let i = 0; i < 20; i++) step(state, [hold({ punch: true, right: true }), blank()]);
  assert.equal(state.phase, "intro");
  assert.equal(state.fighters[1].hp, hp);
});

test("a jump leaves the ground and comes back down", () => {
  const state = fresh();
  place(state, 300);
  step(state, [hold({ up: true }), blank()]);
  assert.ok(state.fighters[0].y < GROUND_Y);
  assert.equal(state.fighters[0].onGround, false);
  for (let i = 0; i < 90; i++) step(state, [blank(), blank()]);
  assert.equal(state.fighters[0].onGround, true);
  assert.equal(state.fighters[0].y, GROUND_Y);
});

test("walkers cannot pass through each other", () => {
  const state = fresh();
  place(state, 280);
  for (let i = 0; i < 240; i++) {
    step(state, [hold({ right: true }), hold({ left: true })]);
  }
  const [a, b] = state.fighters;
  assert.ok(Math.abs(a.x - b.x) >= PUSH_DIST - 0.2);
  assert.ok(a.x >= STAGE_PAD - 0.2 && a.x <= STAGE_W - STAGE_PAD + 0.2);
  assert.ok(b.x >= STAGE_PAD - 0.2 && b.x <= STAGE_W - STAGE_PAD + 0.2);
});

test("cpu versus cpu stays finite", () => {
  const state = fresh();
  for (let i = 0; i < 2400; i++) step(state, [cpuInput(state, 0), cpuInput(state, 1)]);
  for (const f of state.fighters) {
    assert.ok(Number.isFinite(f.x) && Number.isFinite(f.y));
    assert.ok(f.hp >= 0 && f.hp <= f.maxHp);
  }
});
