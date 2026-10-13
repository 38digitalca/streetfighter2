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

function card(id: string, selected: boolean, side: "p1" | "p2"): string {
  const fighter = CHARACTERS[id];
  return `<button type="button" class="card${selected ? " is-on" : ""}" style="--accent:${fighter.palette.accent}" data-act="pick" data-side="${side}" data-arg="${id}">
    <canvas class="portrait" data-char="${id}" width="240" height="264"></canvas>
    <span class="card-name">${esc(fighter.name)}</span>
    <span class="card-title">${esc(fighter.title)}</span>
    <span class="card-special">${esc(fighter.specialName)}</span>
  </button>`;
}

function roster(selected: string, side: "p1" | "p2"): string {
  return `<div class="roster">${ROSTER.map((id) => card(id, id === selected, side)).join("")}</div>`;
}

export function titleHtml(error: string): string {
  return `<section class="title">
    <p class="kicker">Original two-player fighter</p>
    <h1>Cinder<br>Alley</h1>
    <p class="lede">Best of three on a wet street. Block high, block low, and do not eat the dart.</p>
    <div class="menu">
      <button type="button" class="primary" data-act="online">Fight online</button>
      <button type="button" data-act="local">Same keyboard</button>
      <button type="button" data-act="practice">Practice</button>
    </div>
    <ul class="rules">
      <li>Hold the direction away from your rival to block.</li>
      <li>Down-back stops low kicks. Standing block stops jump-ins.</li>
      <li>First fighter to win two rounds takes the alley.</li>
    </ul>
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
  const left = CHARACTERS[c1];
  const right = CHARACTERS[c2];
  return `<section class="panel wide">
    <p class="kicker">${practice ? "Practice" : "Same keyboard"}</p>
    <h2>${practice ? "Pick your fight" : "Who's on which side"}</h2>
    <div class="split">
      <div>
        <label>${practice ? "Your name" : "Left fighter"} <input id="n1" maxlength="16" value="${esc(n1)}" /></label>
        ${roster(c1, "p1")}
        <p class="blurb">${esc(left.blurb)}</p>
      </div>
      <div>
        <label>${practice ? "Practice partner" : "Right fighter"} <input id="n2" maxlength="16" value="${esc(n2)}" ${practice ? "disabled" : ""} /></label>
        ${roster(c2, "p2")}
        <p class="blurb">${esc(right.blurb)}</p>
      </div>
    </div>
    <p class="status">${practice
      ? "You use A D to move, W to jump, S to crouch, J punch, K kick, L special."
      : "Left uses A D, W, S, and F G H. Right uses the arrow keys and U I O."}</p>
    <div class="row">
      <button type="button" data-act="back">Back</button>
      <button type="button" class="primary" data-act="start">${practice ? "Start practice" : "Start bout"}</button>
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
  const you = opts.players[opts.slot];
  const them = opts.players[opts.slot === 0 ? 1 : 0];
  const fallback = opts.slot === 0 ? "vesper" : "brass";
  const yours = you?.character && CHARACTERS[you.character] ? you.character : fallback;
  const rival = them?.character && CHARACTERS[them.character]
    ? `<canvas class="portrait" data-char="${them.character}" width="240" height="264"></canvas>
       <strong>${esc(them.name)}</strong>
       <span class="card-title">${esc(CHARACTERS[them.character].title)}</span>
       <span class="status">${them.ready ? "Ready" : "Choosing"}</span>
       <p class="blurb">${esc(CHARACTERS[them.character].blurb)}</p>`
    : `<p class="lede">${them ? `${esc(them.name)} is choosing a fighter.` : "Share the code. The other fighter opens the link and joins this room."}</p>`;
  return `<section class="panel wide">
    <div class="roomline">
      <div>
        <p class="kicker">Room</p>
        <p class="code">${esc(opts.code)}</p>
      </div>
      <button type="button" data-act="copy">${opts.copied ? "Copied" : "Copy link"}</button>
    </div>
    <input class="linkbox" id="link" readonly value="${esc(opts.link)}" />
    <div class="split">
      <div>
        <h3>You · ${esc(you?.name || "You")}</h3>
        ${roster(yours, "p1")}
        <div class="row">
          <button type="button" class="primary" data-act="ready">${you?.ready ? "Cancel ready" : "Ready"}</button>
        </div>
      </div>
      <div class="rival">
        <h3>Rival</h3>
        ${rival}
      </div>
    </div>
    <div class="row"><button type="button" data-act="back">Leave</button></div>
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
