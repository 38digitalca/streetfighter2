import { emptyInput } from "./mask";
import { isAttack } from "./sim";
import type { Input, MatchState } from "./types";

function roll(tick: number, slot: number, salt: number): number {
  return (tick * 17 + slot * 31 + salt * 13) % 100;
}

/**
 * A readable opponent. It walks in, sometimes blocks, and throws one attack at a time.
 * Gentle mode (practice) leaves bigger gaps so a new player can land a hit.
 */
export function cpuInput(state: MatchState, slot: 0 | 1, gentle = false): Input {
  const input = emptyInput();
  if (state.phase !== "fight") return input;
  const me = state.fighters[slot];
  const opp = state.fighters[1 - slot];
  const dist = opp.x - me.x;
  const abs = Math.abs(dist);
  const towardRight = dist >= 0;
  const n = roll(state.tick, slot, me.charId.length);
  const period = gentle ? 54 : 28;
  const attacking = state.tick % period === 0;

  const startup = isAttack(opp.action) && opp.frame < 14;
  const shouldBlock = startup && abs < 160 && me.onGround && n > (gentle ? 55 : 18);
  if (shouldBlock) {
    if (me.facing === 1) input.left = true;
    else input.right = true;
    const low = opp.action === "crouchKick" || (opp.action === "special" && opp.charId === "kite" && opp.onGround);
    if (low) input.down = true;
    return input;
  }

  if (!me.onGround) {
    if (!gentle && abs < 110 && n % 17 === 0) input.kick = true;
    return input;
  }

  const reach = gentle ? 78 : 110;
  if (abs > reach) {
    input.right = towardRight;
    input.left = !towardRight;
    if (!gentle && abs > 360 && n === 1) input.up = true;
    return input;
  }

  if (!attacking) return input;
  if (n < 40) input.punch = true;
  else if (n < 62) input.kick = true;
  else if (n < 74) {
    input.down = true;
    input.kick = true;
  } else if (n < (gentle ? 82 : 88) && me.specialCd <= 0) input.special = true;
  else if (!gentle && n > 96) input.up = true;
  return input;
}
