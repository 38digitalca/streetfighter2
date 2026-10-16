import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { WebSocketServer, type RawData, type WebSocket } from "ws";
import { isCharacterId } from "../shared/characters";
import { maskToInput } from "../shared/mask";
import { cleanCode, cleanName } from "../shared/names";
import type { ClientMsg, LobbySeat, RoomPhase, ServerMsg } from "../shared/protocol";
import { createMatch, step } from "../shared/sim";
import type { Input, MatchState } from "../shared/types";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist");
const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TICK_MS = 1000 / 60;
const MAX_ROOMS = 80;

interface Client {
  ws: WebSocket;
  name: string;
  character: string | null;
  ready: boolean;
  input: Input;
  room: Room | null;
  slot: 0 | 1 | null;
  alive: boolean;
}

interface Room {
  code: string;
  players: [Client | null, Client | null];
  state: MatchState | null;
  epoch: number;
  timer: ReturnType<typeof setInterval> | null;
  rematch: [boolean, boolean];
  reselect: [boolean, boolean];
}

const rooms = new Map<string, Room>();
const clients = new Set<Client>();

function send(client: Client, msg: ServerMsg) {
  if (client.ws.readyState === client.ws.OPEN) client.ws.send(JSON.stringify(msg));
}

function roomPhase(room: Room): RoomPhase {
  if (!room.state) return "select";
  if (room.state.phase === "match") return "match";
  return "fight";
}

function seat(client: Client): LobbySeat {
  return { name: client.name, character: client.character, ready: client.ready };
}

function broadcastLobby(room: Room) {
  const players = room.players.map((p) => (p ? seat(p) : null)) as (LobbySeat | null)[];
  for (const player of room.players) {
    if (!player || player.slot === null) continue;
    send(player, {
      type: "lobby",
      code: room.code,
      slot: player.slot,
      phase: roomPhase(room),
      players,
      rematch: [...room.rematch],
      reselect: [...room.reselect],
    });
  }
}

function destroyRoom(room: Room) {
  if (room.timer) clearInterval(room.timer);
  room.timer = null;
  rooms.delete(room.code);
  for (const player of room.players) {
    if (!player) continue;
    player.room = null;
    player.slot = null;
  }
  room.players = [null, null];
  room.state = null;
}

function detach(client: Client, reason: string) {
  const room = client.room;
  if (!room || client.slot === null) return;
  const others = room.players.filter((p) => p && p !== client) as Client[];
  destroyRoom(room);
  for (const other of others) send(other, { type: "bye", message: reason });
}

function makeCode(): string {
  let code = "";
  for (let i = 0; i < 4; i++) code += ALPHA[Math.floor(Math.random() * ALPHA.length)];
  return rooms.has(code) ? makeCode() : code;
}

function makeRoom(): Room | null {
  if (rooms.size >= MAX_ROOMS) return null;
  const room: Room = {
    code: makeCode(),
    players: [null, null],
    state: null,
    epoch: 1,
    timer: null,
    rematch: [false, false],
    reselect: [false, false],
  };
  rooms.set(room.code, room);
  return room;
}

function tick(room: Room) {
  if (!room.state) return;
  const inputs: [Input, Input] = [
    room.players[0]?.input ?? maskToInput(0),
    room.players[1]?.input ?? maskToInput(0),
  ];
  step(room.state, inputs);
  const payload = JSON.stringify({ type: "state", epoch: room.epoch, state: room.state } satisfies ServerMsg);
  for (const player of room.players) {
    if (player && player.ws.readyState === player.ws.OPEN) player.ws.send(payload);
  }
}

function startMatch(room: Room) {
  const [a, b] = room.players;
  if (!a || !b || !a.character || !b.character) return;
  room.epoch += 1;
  room.rematch = [false, false];
  room.reselect = [false, false];
  a.ready = true;
  b.ready = true;
  a.input = maskToInput(0);
  b.input = maskToInput(0);
  room.state = createMatch({ name: a.name, charId: a.character }, { name: b.name, charId: b.character });
  if (!room.timer) room.timer = setInterval(() => tick(room), TICK_MS);
  broadcastLobby(room);
}

function maybeStart(room: Room) {
  if (room.state) return;
  const [a, b] = room.players;
  if (!a || !b || !a.ready || !b.ready || !a.character || !b.character) return;
  startMatch(room);
}

function sit(room: Room, client: Client, slot: 0 | 1) {
  room.players[slot] = client;
  client.room = room;
  client.slot = slot;
  client.ready = false;
  client.character = null;
  client.input = maskToInput(0);
}

function handle(client: Client, msg: ClientMsg) {
  if (msg.type === "ping") {
    if (typeof msg.t === "number") send(client, { type: "pong", t: msg.t });
    return;
  }
  if (msg.type === "leave") {
    detach(client, "Your rival left the alley.");
    return;
  }
  if (msg.type === "create") {
    detach(client, "Your rival left the alley.");
    const room = makeRoom();
    if (!room) {
      send(client, { type: "error", message: "The alley is full. Try again in a minute." });
      return;
    }
    client.name = cleanName(msg.name, "Player 1");
    sit(room, client, 0);
    broadcastLobby(room);
    return;
  }
  if (msg.type === "join") {
    const code = cleanCode(msg.code);
    const room = code ? rooms.get(code) : undefined;
    if (!room) {
      send(client, { type: "error", message: "No match under that code." });
      return;
    }
    if (client.room === room) return;
    if (room.players[0] && room.players[1]) {
      send(client, { type: "error", message: "That match already has two fighters." });
      return;
    }
    if (room.state) {
      send(client, { type: "error", message: "That match has already started." });
      return;
    }
    detach(client, "Your rival left the alley.");
    client.name = cleanName(msg.name, "Player 2");
    sit(room, client, room.players[0] ? 1 : 0);
    broadcastLobby(room);
    return;
  }
  const room = client.room;
  const slot = client.slot;
  if (!room || slot === null) {
    send(client, { type: "error", message: "You are not in a match." });
    return;
  }
  if (msg.type === "pick") {
    if (room.state && room.state.phase !== "match") return;
    if (typeof msg.character !== "string" || !isCharacterId(msg.character)) {
      send(client, { type: "error", message: "Unknown fighter." });
      return;
    }
    client.character = msg.character;
    client.ready = false;
    broadcastLobby(room);
    return;
  }
  if (msg.type === "ready") {
    if (room.state) return;
    if (!client.character) {
      send(client, { type: "error", message: "Pick a fighter first." });
      return;
    }
    client.ready = Boolean(msg.ready);
    broadcastLobby(room);
    maybeStart(room);
    return;
  }
  if (msg.type === "input") {
    if (typeof msg.mask === "number" && Number.isFinite(msg.mask)) client.input = maskToInput(msg.mask);
    return;
  }
  if (msg.type === "rematch") {
    if (room.state?.phase !== "match") return;
    room.rematch[slot] = true;
    room.reselect[slot] = false;
    broadcastLobby(room);
    if (room.rematch[0] && room.rematch[1]) startMatch(room);
    return;
  }
  if (msg.type === "reselect") {
    if (room.state?.phase !== "match") return;
    room.reselect[slot] = true;
    room.rematch[slot] = false;
    if (room.reselect[0] && room.reselect[1]) {
      if (room.timer) clearInterval(room.timer);
      room.timer = null;
      room.state = null;
      room.rematch = [false, false];
      room.reselect = [false, false];
      for (const player of room.players) if (player) player.ready = false;
    }
    broadcastLobby(room);
  }
}

function parse(data: RawData): ClientMsg | null {
  const text = typeof data === "string" ? data : data.toString();
  if (text.length > 4000) return null;
  try {
    const msg = JSON.parse(text) as ClientMsg;
    if (!msg || typeof msg !== "object" || typeof (msg as { type?: unknown }).type !== "string") return null;
    return msg;
  } catch {
    return null;
  }
}

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".map": "application/json",
};

async function serveStatic(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  const requested = decodeURIComponent(url.pathname);
  const rel = requested === "/" ? "index.html" : requested.replace(/^\/+/, "");
  const full = path.normalize(path.join(distDir, rel));
  if (!full.startsWith(distDir)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const info = await stat(full);
    if (!info.isFile()) throw new Error("not a file");
    const body = await readFile(full);
    res.writeHead(200, { "content-type": MIME[path.extname(full)] ?? "application/octet-stream", "cache-control": "no-cache" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

export interface Running {
  port: number;
  close: () => Promise<void>;
}

export function startServer(port: number, host = "127.0.0.1"): Promise<Running> {
  const isProd = process.env.NODE_ENV === "production";
  const server = createServer((req, res) => {
    const url = req.url ?? "/";
    if (url === "/health" || url.startsWith("/health?")) {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, rooms: rooms.size }));
      return;
    }
    if (isProd) {
      void serveStatic(req, res);
      return;
    }
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    res.end("Cinder Alley match server. Open the game through the dev site.");
  });
  const wss = new WebSocketServer({ server, path: "/ws" });
  const pulse = setInterval(() => {
    for (const client of clients) {
      if (!client.alive) {
        client.ws.terminate();
        continue;
      }
      client.alive = false;
      client.ws.ping();
    }
  }, 20000);

  wss.on("connection", (ws) => {
    const client: Client = {
      ws,
      name: "Player",
      character: null,
      ready: false,
      input: maskToInput(0),
      room: null,
      slot: null,
      alive: true,
    };
    clients.add(client);
    ws.on("pong", () => {
      client.alive = true;
    });
    ws.on("message", (data) => {
      const msg = parse(data);
      if (msg) handle(client, msg);
    });
    ws.on("close", () => {
      clients.delete(client);
      detach(client, "Your rival disconnected.");
    });
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      const address = server.address();
      const actual = typeof address === "object" && address ? address.port : port;
      resolve({
        port: actual,
        close: () =>
          new Promise((done, fail) => {
            clearInterval(pulse);
            for (const room of [...rooms.values()]) destroyRoom(room);
            for (const client of clients) client.ws.close();
            clients.clear();
            wss.close();
            server.close((err) => (err ? fail(err) : done()));
          }),
      });
    });
  });
}

const invoked = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invoked) {
  const prod = process.env.NODE_ENV === "production";
  const port = Number(process.env.PORT) || (prod ? 43123 : 43124);
  const host = process.env.HOST || (prod ? "0.0.0.0" : "127.0.0.1");
  void startServer(port, host).then((running) => {
    console.log(`Cinder Alley match server on http://${host}:${running.port}`);
  });
}
