import { emptyInput } from "./mask";
import { isAttack } from "./sim";
import type { Input, MatchState } from "./types";

function roll(tick: number, slot: number, salt: number): number {
  return (tick * 17 + slot * 31 + salt * 13) % 100;
}

/** A readable opponent. It walks in, blocks obvious swings, and throws attacks in range. */
export function cpuInput(state: MatchState, slot: 0 | 1): Input {
  const input = emptyInput();
  if (state.phase !== "fight") return input;
  const me = state.fighters[slot];
  const opp = state.fighters[1 - slot];
  const dist = opp.x - me.x;
  const abs = Math.abs(dist);
  const towardRight = dist >= 0;
  const n = roll(state.tick, slot, me.charId.length);

  const startup = isAttack(opp.action) && opp.frame < 12;
  if (startup && abs < 170 && me.onGround && me.action !== "special") {
    if (me.facing === 1) input.left = true;
    else input.right = true;
    const low = opp.action === "crouchKick" || (opp.action === "special" && opp.charId === "kite" && opp.onGround);
    if (low) input.down = true;
    if (n === 4) input.special = me.specialCd <= 0;
    return input;
  }

  if (!me.onGround) {
    if (abs < 120 && n % 9 === 0) input.kick = true;
    else if (n % 13 === 0) input.punch = true;
    else if (n === 3 && me.specialCd <= 0) input.special = true;
    return input;
  }

  if (abs > 120) {
    input.right = towardRight;
    input.left = !towardRight;
    if (abs > 340 && n === 1) input.up = true;
    if (abs > 220 && abs < 560 && n === 6 && me.specialCd <= 0) input.special = true;
    return input;
  }

  if (n === 0 || n === 1) input.punch = true;
  else if (n === 2 || n === 15) input.kick = true;
  else if (n === 7) {
    input.down = true;
    input.kick = true;
  } else if (n === 11 && me.specialCd <= 0) input.special = true;
  else if (n === 19) input.up = true;
  else if (n === 23) input.down = true;
  else if (abs > 78) {
    input.right = towardRight;
    input.left = !towardRight;
  }
  return input;
}
