import { CHARACTERS, ROSTER } from "../shared/characters";
import type { LobbySeat } from "../shared/protocol";
import { drawPortrait } from "./render";

export function esc(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    if (ch === "&") return "&amp;";
    if (ch === "<") return "&lt;";
    if (ch === ">") return "&gt;";
    if (ch === '"') return "&quot;";
    return "&#39;";
  });
}

function face(id: string, p1: string, p2: string): string {
  const on = `${id === p1 ? " is-p1" : ""}${id === p2 ? " is-p2" : ""}`;
  return `<button type="button" class="face${on}" data-act="pick" data-side="p1" data-arg="${id}" aria-label="${esc(CHARACTERS[id].name)}">
    <canvas class="bust" data-char="${id}" data-face="1" width="96" height="120"></canvas>
  </button>`;
}

function plate(side: "1" | "2", id: string | null): string {
  const faceDir = side === "1" ? "1" : "-1";
  const name = id && CHARACTERS[id] ? CHARACTERS[id].name.toUpperCase() : "WAITING";
  return `<figure class="plate plate-${side}">
    <canvas class="bust" data-char="${id ?? ""}" data-face="${faceDir}" width="96" height="120"></canvas>
    <figcaption class="nameplate"><span class="who">${side}P</span><span class="fname">${esc(name)}</span></figcaption>
  </figure>`;
}

export function titleHtml(error: string): string {
  return `<section class="title pixel">
    <p class="kicker">World Warrior</p>
    <h1>STREET<br>FIGHTER II</h1>
    <div class="menu">
      <button type="button" class="primary" data-act="online">Fight online</button>
      <button type="button" data-act="local">Versus</button>
      <button type="button" data-act="practice">Practice</button>
    </div>
    <p class="error">${esc(error)}</p>
  </section>`;
}

export function onlineHtml(name: string, code: string, error: string, busy: boolean): string {
  return `<section class="panel">
    <p class="kicker">Online</p>
    <h2>Find a rival</h2>
    <p class="lede">Create a room and send the link, or punch in a code from a friend.</p>
    <label>Your name <input id="n1" maxlength="16" value="${esc(name)}" autocomplete="nickname" /></label>
    <div class="row">
      <button type="button" class="primary" data-act="create" ${busy ? "disabled" : ""}>Create match</button>
    </div>
    <p class="or">or join</p>
    <label>Room code <input id="code" maxlength="4" value="${esc(code)}" autocapitalize="characters" /></label>
    <div class="row">
      <button type="button" data-act="join" ${busy ? "disabled" : ""}>Join match</button>
      <button type="button" data-act="back">Back</button>
    </div>
    <p class="error">${esc(error)}</p>
  </section>`;
}

export function setupHtml(mode: "local" | "practice", n1: string, n2: string, c1: string, c2: string): string {
  const practice = mode === "practice";
  const blurb = CHARACTERS[c1]?.blurb ?? "";
  return `<section class="select">
    <h2 class="select-title">PLAYER SELECT</h2>
    ${plate("1", c1)}
    ${plate("2", c2)}
    <div class="faces">${ROSTER.map((id) => face(id, c1, c2)).join("")}</div>
    <div class="select-bar">
      <button type="button" data-act="back">Back</button>
      <label class="pixel-field">1P <input id="n1" maxlength="16" value="${esc(n1)}" /></label>
      ${practice ? "" : `<label class="pixel-field">2P <input id="n2" maxlength="16" value="${esc(n2)}" /></label>`}
      <p class="blurb">${esc(blurb)} Click a portrait for 1P. Right-click for 2P.</p>
      <button type="button" class="primary" data-act="start">${practice ? "Start" : "Start"}</button>
    </div>
  </section>`;
}

export function lobbyHtml(opts: {
  code: string;
  link: string;
  slot: 0 | 1;
  players: (LobbySeat | null)[];
  copied: boolean;
  error: string;
}): string {
  const p1 = opts.players[0];
  const p2 = opts.players[1];
  const c1 = p1?.character && CHARACTERS[p1.character] ? p1.character : "";
  const c2 = p2?.character && CHARACTERS[p2.character] ? p2.character : "";
  const mine = opts.players[opts.slot];
  const blurb = (mine?.character && CHARACTERS[mine.character]?.blurb) || "Pick a fighter, then ready.";
  return `<section class="select">
    <h2 class="select-title">PLAYER SELECT</h2>
    <p class="room-flag">ROOM ${esc(opts.code)}</p>
    ${plate("1", c1 || null)}
    ${plate("2", c2 || null)}
    <div class="faces">${ROSTER.map((id) => face(id, c1, c2)).join("")}</div>
    <div class="select-bar">
      <button type="button" data-act="back">Leave</button>
      <button type="button" data-act="copy">${opts.copied ? "Copied" : "Copy link"}</button>
      <input class="linkbox" id="link" readonly value="${esc(opts.link)}" />
      <p class="blurb">${esc(blurb)}</p>
      <button type="button" class="primary" data-act="ready">${mine?.ready ? "Cancel" : "Ready"}</button>
    </div>
    <p class="error">${esc(opts.error)}</p>
  </section>`;
}

export function fightHtml(mode: "online" | "local" | "practice", muted: boolean, touchOn: boolean): string {
  const hint = mode === "local"
    ? "Left: A D · W jump · S crouch · F punch · G kick · H special. Right: arrows · U punch · I kick · O special."
    : "Move A D or arrows · W jump · S crouch · J punch · K kick · L special. Hold away to block.";
  return `<div class="fight-ui">
    <div class="topbar">
      <span id="netstat"></span>
      <div class="top-actions">
        <button type="button" data-act="mute">${muted ? "Sound off" : "Sound on"}</button>
        ${mode === "local" ? "" : `<button type="button" data-act="touch">${touchOn ? "Touch on" : "Touch"}</button>`}
        <button type="button" data-act="quit">Quit</button>
      </div>
    </div>
    <p class="hint">${hint}</p>
    <div id="result" hidden>
      <h2 id="result-title"></h2>
      <p id="result-sub"></p>
      <div class="row">
        <button type="button" class="primary" data-act="rematch">Rematch</button>
        <button type="button" data-act="reselect">Fighter select</button>
        <button type="button" data-act="quit">Leave</button>
      </div>
      <p id="vote-note" class="status"></p>
    </div>
  </div>`;
}

export function paintPortraits(root: ParentNode) {
  for (const canvas of root.querySelectorAll("canvas.portrait")) {
    if (!(canvas instanceof HTMLCanvasElement)) continue;
    const id = canvas.dataset.char;
    const ctx = canvas.getContext("2d");
    if (!id || !ctx || !CHARACTERS[id]) continue;
    drawPortrait(ctx, id);
  }
}
