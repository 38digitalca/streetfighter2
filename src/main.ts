import { cpuInput } from "../shared/ai";
import { CHARACTERS } from "../shared/characters";
import { cleanCode, cleanName } from "../shared/names";
import type { ServerMsg } from "../shared/protocol";
import { createMatch, step } from "../shared/sim";
import type { MatchState } from "../shared/types";
import { VIEW_H, VIEW_W } from "../shared/types";
import type { Floater } from "./render";
import { Sfx } from "./audio";
import { Controls } from "./input";
import { Link } from "./net";
import { render } from "./render";
import { paintBusts, renderAtlas } from "./selectart";
import { fightHtml, lobbyHtml, onlineHtml, setupHtml, titleHtml } from "./ui";

type Mode = "online" | "local" | "practice";
type Screen = "title" | "online" | "setup" | "lobby" | "fight";

class Game {
  private screen: Screen = "title";
  private mode: Mode | null = null;
  private match: MatchState | null = null;
  private slot: 0 | 1 = 0;
  private link: Link | null = null;
  private controls: Controls;
  private sfx = new Sfx();
  private lastSound = 0;
  private epoch = 0;
  private ping = 0;
  private lastPing = 0;
  private error = "";
  private busy = false;
  private copied = false;
  private leaving = false;
  private debug = false;
  private touchOn = window.matchMedia("(pointer: coarse)").matches;
  private reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  private dpr = 1;
  private names: [string, string] = ["Player 1", "Player 2"];
  private picks: [string, string] = ["vesper", "brass"];
  private invited = "";
  private lobby: Extract<ServerMsg, { type: "lobby" }> | null = null;
  private chip: [number, number] = [100, 114];
  private floaters: Floater[] = [];
  private last = performance.now();
  private acc = 0;
  private defaulted = false;

  constructor(private ui: HTMLElement, private canvas: HTMLCanvasElement, private touch: HTMLElement) {
    try {
      this.sfx.muted = localStorage.getItem("cinder-muted") === "1";
    } catch {
      /* storage can be blocked */
    }
    const params = new URLSearchParams(location.search);
    this.invited = cleanCode(params.get("room") ?? "") ?? "";
    if (this.invited) this.screen = "online";
    this.controls = new Controls(this.touch);
    this.ui.addEventListener("click", (event) => {
      const target = (event.target as Element | null)?.closest?.("[data-act]");
      if (!(target instanceof HTMLElement)) return;
      this.onAct(target.dataset.act ?? "", target);
    });
    this.ui.addEventListener("contextmenu", (event) => {
      const target = (event.target as Element | null)?.closest?.("[data-act='pick']");
      if (!(target instanceof HTMLElement) || this.screen !== "setup") return;
      event.preventDefault();
      this.pickSide(target.dataset.arg ?? "", 1);
    });
    this.ui.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || !(event.target instanceof HTMLInputElement)) return;
      if (event.target.id === "code") void this.join();
      if (event.target.id === "n1" && this.screen === "online") void this.create();
    });
    window.addEventListener("keydown", (event) => {
      if (event.target instanceof HTMLInputElement) return;
      if (event.code === "Escape") {
        if (this.screen === "fight" || this.screen === "lobby") this.quit();
        else if (this.screen !== "title") this.back();
      }
      if (event.code === "Backquote") this.debug = !this.debug;
    });
    window.addEventListener("pointerdown", () => this.sfx.unlock());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.controls.clear();
        if (this.mode === "online") this.link?.send({ type: "input", mask: 0 });
      }
    });
    window.addEventListener("resize", () => this.layout());
    this.layout();
    this.renderUi();
    requestAnimationFrame(this.frame);
  }

  private frame = (now: number) => {
    const dt = Math.min(48, now - this.last);
    this.last = now;
    this.acc += dt;
    let steps = 0;
    while (this.acc >= 1000 / 60 && steps < 5) {
      this.acc -= 1000 / 60;
      steps += 1;
      this.simTick();
    }
    if (steps > 0) this.decayFloaters(steps);
    if (this.screen === "fight" && this.mode === "online" && this.link?.isOpen()) {
      this.link.send({ type: "input", mask: this.controls.mask("solo") });
      if (now - this.lastPing > 1000) {
        this.lastPing = now;
        this.link.send({ type: "ping", t: now });
      }
    }
    this.draw();
    if (this.screen === "fight") this.syncResult();
    requestAnimationFrame(this.frame);
  };

  private simTick() {
    if (this.screen === "fight" && this.match && this.mode !== "online") {
      const p1 = this.controls.read("solo");
      const p2 = this.mode === "practice" ? cpuInput(this.match, 1, true) : this.controls.read("p2");
      const left = this.mode === "local" ? this.controls.read("p1") : p1;
      const before: [number, number] = [this.match.fighters[0].hp, this.match.fighters[1].hp];
      step(this.match, [left, p2]);
      this.noteDamage(before, this.match);
      this.playSounds(this.match);
    }
  }

  private noteDamage(before: [number, number], state: MatchState) {
    for (let i = 0; i < 2; i++) {
      const drop = before[i] - state.fighters[i].hp;
      if (drop < 0.5) continue;
      const f = state.fighters[i];
      const blocked = f.action === "block";
      this.floaters.push({
        x: f.x,
        y: f.y - 132,
        text: blocked ? "BLOCK" : String(Math.round(drop)),
        life: 46,
        max: 46,
        color: blocked ? "#f8fafc" : "#ffd36a",
      });
    }
    if (this.floaters.length > 8) this.floaters.splice(0, this.floaters.length - 8);
  }

  private decayFloaters(steps: number) {
    for (const floater of this.floaters) floater.life -= steps;
    if (this.floaters.some((floater) => floater.life <= 0)) {
      this.floaters = this.floaters.filter((floater) => floater.life > 0);
    }
  }

  private draw() {
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;
    if (!(this.screen === "fight" && this.match)) {
      renderAtlas(ctx, this.dpr, this.atlasPicks());
      return;
    }
    const state = this.match;
    if (this.match && this.screen === "fight") {
      for (let i = 0; i < 2; i++) {
        const hp = this.match.fighters[i].hp;
        if (this.chip[i] < hp) this.chip[i] = hp;
        else this.chip[i] = Math.max(hp, this.chip[i] - 0.55);
      }
    }
    const chip: [number, number] = this.screen === "fight" && this.match
      ? this.chip
      : [state.fighters[0].hp, state.fighters[1].hp];
    render(ctx, state, {
      dpr: this.dpr,
      debug: this.debug && this.screen === "fight",
      reduced: this.reduced,
      localSlot: this.screen === "fight" ? this.slot : null,
      chip,
      hud: this.screen === "fight",
      floaters: this.screen === "fight" ? this.floaters : [],
    });
  }

  private atlasPicks(): [string, string] | null {
    if (this.screen === "setup") return this.picks;
    if (this.screen === "lobby" && this.lobby) {
      const a = this.lobby.players[0]?.character || "vesper";
      const b = this.lobby.players[1]?.character || "brass";
      return [a, b];
    }
    return null;
  }

  private pickSide(id: string, side: 0 | 1) {
    if (!CHARACTERS[id] || (this.mode !== "local" && this.mode !== "practice")) return;
    this.rememberNames();
    this.picks[side] = id;
    if (this.mode === "practice" && side === 1) this.names[1] = CHARACTERS[id].name;
    this.renderUi();
  }

  private layout() {
    const app = document.getElementById("app");
    if (!app) return;
    const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
    const cssW = Math.max(320, Math.floor(VIEW_W * scale));
    const cssH = Math.max(180, Math.floor(VIEW_H * scale));
    app.style.width = `${cssW}px`;
    app.style.height = `${cssH}px`;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.floor(VIEW_W * this.dpr);
    this.canvas.height = Math.floor(VIEW_H * this.dpr);
  }

  private renderUi() {
    this.controls.capture = this.screen === "fight";
    const choosing = this.screen === "setup" || this.screen === "lobby";
    this.ui.className = this.screen === "fight" ? "fight" : choosing ? "atlas select" : "atlas";
    if (this.screen === "title") this.ui.innerHTML = titleHtml(this.error);
    else if (this.screen === "online") this.ui.innerHTML = onlineHtml(this.names[0], this.invited, this.error, this.busy);
    else if (this.screen === "setup" && (this.mode === "local" || this.mode === "practice")) {
      this.ui.innerHTML = setupHtml(this.mode, this.names[0], this.names[1], this.picks[0], this.picks[1]);
    } else if (this.screen === "lobby" && this.lobby) {
      this.ui.innerHTML = lobbyHtml({
        code: this.lobby.code,
        link: this.roomLink(this.lobby.code),
        slot: this.lobby.slot,
        players: this.lobby.players,
        copied: this.copied,
        error: this.error,
      });
    } else if (this.screen === "fight" && this.mode) {
      this.ui.innerHTML = fightHtml(this.mode, this.sfx.muted, this.touchOn);
      const net = document.getElementById("netstat");
      if (net && this.mode === "online" && this.ping) net.textContent = `${this.ping} ms`;
    }
    paintBusts(this.ui);
    this.touch.hidden = !(this.screen === "fight" && this.touchOn && this.mode !== "local");
  }

  private onAct(act: string, target: HTMLElement) {
    if (act === "online") {
      this.rememberNames();
      this.screen = "online";
      this.error = "";
      this.renderUi();
    } else if (act === "local" || act === "practice") {
      this.rememberNames();
      this.mode = act;
      this.screen = "setup";
      this.error = "";
      if (act === "practice") this.names[1] = CHARACTERS[this.picks[1]].name;
      this.renderUi();
    } else if (act === "back" || act === "quit") {
      this.quit();
    } else if (act === "create") {
      void this.create();
    } else if (act === "join") {
      void this.join();
    } else if (act === "pick") {
      const id = target.dataset.arg ?? "";
      const side = target.dataset.side === "p2" ? 1 : 0;
      if (!CHARACTERS[id]) return;
      if (this.screen === "lobby") {
        this.link?.send({ type: "pick", character: id });
        return;
      }
      this.pickSide(id, side);
    } else if (act === "start") {
      this.startLocal();
    } else if (act === "ready") {
      const mine = this.lobby?.players[this.slot];
      this.link?.send({ type: "ready", ready: !mine?.ready });
    } else if (act === "copy") {
      void this.copyLink();
    } else if (act === "mute") {
      this.sfx.muted = !this.sfx.muted;
      try {
        localStorage.setItem("cinder-muted", this.sfx.muted ? "1" : "0");
      } catch {
        /* ignore */
      }
      target.textContent = this.sfx.muted ? "Sound off" : "Sound on";
    } else if (act === "touch") {
      this.touchOn = !this.touchOn;
      target.textContent = this.touchOn ? "Touch on" : "Touch";
      this.touch.hidden = !(this.screen === "fight" && this.touchOn && this.mode !== "local");
    } else if (act === "rematch") {
      this.rematch();
    } else if (act === "reselect") {
      this.reselect();
    }
  }

  private rememberNames() {
    const n1 = this.value("n1");
    const n2 = this.value("n2");
    if (n1) this.names[0] = cleanName(n1, this.names[0]);
    if (n2 && this.mode !== "practice") this.names[1] = cleanName(n2, this.names[1]);
  }

  private value(id: string): string {
    const el = document.getElementById(id);
    return el instanceof HTMLInputElement ? el.value : "";
  }

  private roomLink(code: string): string {
    const url = new URL(location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("room", code);
    return url.toString();
  }

  private setQuery(code: string | null) {
    const url = new URL(location.href);
    if (code) url.searchParams.set("room", code);
    else url.searchParams.delete("room");
    history.replaceState(null, "", `${url.pathname}${url.search}`);
  }

  private async ensureLink() {
    if (this.link?.isOpen()) return;
    const link = new Link();
    link.onMessage = (msg) => this.onNet(msg);
    link.onClose = () => this.onSocketClose();
    this.link = link;
    await link.open();
  }

  private fail(err: unknown) {
    this.busy = false;
    this.error = err instanceof Error ? err.message : "Could not connect.";
    this.renderUi();
  }

  private async create() {
    this.rememberNames();
    const name = cleanName(this.names[0], "Player 1");
    this.names[0] = name;
    this.busy = true;
    this.error = "";
    this.mode = "online";
    this.defaulted = false;
    this.renderUi();
    try {
      await this.ensureLink();
      this.link?.send({ type: "create", name });
    } catch (err) {
      this.fail(err);
    }
  }

  private async join() {
    this.rememberNames();
    const code = cleanCode(this.value("code") || this.invited);
    if (!code) {
      this.error = "Enter the four-character room code.";
      this.renderUi();
      return;
    }
    this.invited = code;
    const name = cleanName(this.names[0], "Player 2");
    this.names[0] = name;
    this.busy = true;
    this.error = "";
    this.mode = "online";
    this.defaulted = false;
    this.renderUi();
    try {
      await this.ensureLink();
      this.link?.send({ type: "join", code, name });
    } catch (err) {
      this.fail(err);
    }
  }

  private onNet(msg: ServerMsg) {
    if (msg.type === "lobby") {
      this.busy = false;
      this.lobby = msg;
      this.slot = msg.slot;
      this.error = "";
      this.setQuery(msg.code);
      if (msg.phase === "select") {
        this.screen = "lobby";
        this.match = null;
        this.maybeDefaultPick();
        this.renderUi();
        return;
      }
      if (this.screen !== "fight") {
        this.screen = "lobby";
        this.renderUi();
      }
      return;
    }
    if (msg.type === "state") {
      if (!this.lobby) return;
      const sameRound = msg.epoch === this.epoch && this.match;
      if (msg.epoch !== this.epoch) {
        this.epoch = msg.epoch;
        this.lastSound = 0;
        this.floaters = [];
        this.chip = [msg.state.fighters[0].hp, msg.state.fighters[1].hp];
      } else if (sameRound && this.match) {
        this.noteDamage([this.match.fighters[0].hp, this.match.fighters[1].hp], msg.state);
      }
      this.match = msg.state;
      this.playSounds(msg.state);
      if (this.screen !== "fight") {
        this.screen = "fight";
        this.mode = "online";
        this.renderUi();
      }
      return;
    }
    if (msg.type === "pong") {
      this.ping = Math.max(0, Math.round(performance.now() - msg.t));
      const net = document.getElementById("netstat");
      if (net) net.textContent = `${this.ping} ms`;
      return;
    }
    if (msg.type === "error") {
      this.busy = false;
      this.error = msg.message;
      if (this.screen !== "fight") this.renderUi();
      return;
    }
    if (msg.type === "bye") {
      this.error = msg.message;
      this.screen = "title";
      this.match = null;
      this.lobby = null;
      this.mode = null;
      this.setQuery(null);
      this.renderUi();
    }
  }

  private maybeDefaultPick() {
    const mine = this.lobby?.players[this.slot];
    if (!mine || mine.character || this.defaulted) return;
    this.defaulted = true;
    this.link?.send({ type: "pick", character: this.slot === 0 ? "vesper" : "brass" });
  }

  private onSocketClose() {
    if (this.leaving) {
      this.leaving = false;
      return;
    }
    if (this.screen === "title") return;
    this.error = "Connection lost.";
    this.link = null;
    this.match = null;
    this.lobby = null;
    this.screen = "title";
    this.mode = null;
    this.renderUi();
  }

  private startLocal() {
    this.rememberNames();
    if (this.mode !== "local" && this.mode !== "practice") return;
    const n1 = cleanName(this.names[0], "Player 1");
    const n2 = this.mode === "practice" ? CHARACTERS[this.picks[1]].name : cleanName(this.names[1], "Player 2");
    this.names = [n1, n2];
    this.slot = 0;
    this.lastSound = 0;
    this.match = createMatch({ name: n1, charId: this.picks[0] }, { name: n2, charId: this.picks[1] });
    this.floaters = [];
    this.chip = [this.match.fighters[0].maxHp, this.match.fighters[1].maxHp];
    this.screen = "fight";
    this.renderUi();
  }

  private rematch() {
    if (this.mode === "online") {
      this.link?.send({ type: "rematch" });
      return;
    }
    if (!this.match || (this.mode !== "local" && this.mode !== "practice")) return;
    this.lastSound = 0;
    this.floaters = [];
    this.match = createMatch(
      { name: this.names[0], charId: this.picks[0] },
      { name: this.names[1], charId: this.picks[1] },
    );
    this.chip = [this.match.fighters[0].maxHp, this.match.fighters[1].maxHp];
  }

  private reselect() {
    if (this.mode === "online") {
      this.link?.send({ type: "reselect" });
      return;
    }
    if (this.mode !== "local" && this.mode !== "practice") return;
    this.match = null;
    this.floaters = [];
    this.screen = "setup";
    this.renderUi();
  }

  private quit() {
    if (this.link) {
      this.leaving = true;
      this.link.send({ type: "leave" });
      this.link.close();
    }
    this.link = null;
    this.match = null;
    this.floaters = [];
    this.lobby = null;
    this.mode = null;
    this.screen = "title";
    this.busy = false;
    this.error = "";
    this.controls.clear();
    this.setQuery(null);
    this.renderUi();
  }

  private back() {
    this.screen = "title";
    this.error = "";
    this.renderUi();
  }

  private async copyLink() {
    if (!this.lobby) return;
    const link = this.roomLink(this.lobby.code);
    try {
      await navigator.clipboard.writeText(link);
      this.copied = true;
      this.renderUi();
      window.setTimeout(() => {
        this.copied = false;
        if (this.screen === "lobby") this.renderUi();
      }, 1200);
    } catch {
      const input = document.getElementById("link");
      if (input instanceof HTMLInputElement) input.select();
    }
  }

  private playSounds(state: MatchState) {
    let max = this.lastSound;
    for (const cue of state.sounds) {
      if (cue.id <= this.lastSound) continue;
      max = Math.max(max, cue.id);
      if (!this.sfx.muted) this.sfx.play(cue.name);
    }
    this.lastSound = max;
  }

  private syncResult() {
    const box = document.getElementById("result");
    const state = this.match;
    if (!box || !state) return;
    const show = state.phase === "match";
    box.hidden = !show;
    if (!show) return;
    const title = document.getElementById("result-title");
    const sub = document.getElementById("result-sub");
    const note = document.getElementById("vote-note");
    const copy = this.resultCopy(state);
    if (title) title.textContent = copy.title;
    if (sub) sub.textContent = copy.sub;
    if (note) note.textContent = this.voteNote();
  }

  private resultCopy(state: MatchState): { title: string; sub: string } {
    const score = `Rounds ${state.fighters[0].wins}–${state.fighters[1].wins}`;
    const slot = state.matchWinner;
    if (slot !== 0 && slot !== 1) return { title: "Draw", sub: score };
    const winner = state.fighters[slot];
    if (this.mode === "local") return { title: `${winner.name} wins`, sub: score };
    if (slot === this.slot) return { title: "You win", sub: `${winner.name} takes the alley. ${score}` };
    return { title: "You lose", sub: `${winner.name} takes the alley. ${score}` };
  }

  private voteNote(): string {
    if (this.mode !== "online" || !this.lobby) return "";
    const me = this.slot;
    const them = me === 0 ? 1 : 0;
    if (this.lobby.rematch[me] && !this.lobby.rematch[them]) return "Waiting for a rematch.";
    if (this.lobby.reselect[me] && !this.lobby.reselect[them]) return "Waiting to pick fighters again.";
    if (this.lobby.rematch[them] && !this.lobby.rematch[me]) return "Your rival wants a rematch.";
    if (this.lobby.reselect[them] && !this.lobby.reselect[me]) return "Your rival wants a new fighter.";
    return "";
  }
}

const ui = document.getElementById("ui");
const canvas = document.getElementById("view");
const touch = document.getElementById("touch");
if (ui && canvas instanceof HTMLCanvasElement && touch) new Game(ui, canvas, touch);
