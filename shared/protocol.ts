import type { MatchState } from "./types";

export interface LobbySeat {
  name: string;
  character: string | null;
  ready: boolean;
}

export type RoomPhase = "select" | "fight" | "match";

export type ClientMsg =
  | { type: "create"; name: string }
  | { type: "join"; code: string; name: string }
  | { type: "pick"; character: string }
  | { type: "ready"; ready: boolean }
  | { type: "input"; mask: number }
  | { type: "rematch" }
  | { type: "reselect" }
  | { type: "leave" }
  | { type: "ping"; t: number };

export type ServerMsg =
  | {
      type: "lobby";
      code: string;
      slot: 0 | 1;
      phase: RoomPhase;
      players: (LobbySeat | null)[];
      rematch: [boolean, boolean];
      reselect: [boolean, boolean];
    }
  | { type: "state"; epoch: number; state: MatchState }
  | { type: "pong"; t: number }
  | { type: "error"; message: string }
  | { type: "bye"; message: string };
