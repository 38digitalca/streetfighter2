import assert from "node:assert/strict";
import { test } from "node:test";
import { WebSocket } from "ws";
import { startServer } from "../server/index";

function once<T>(ws: WebSocket, pred: (msg: T) => boolean, ms = 2500): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      ws.off("message", on);
      reject(new Error("timed out waiting for a server message"));
    }, ms);
    function on(data: unknown) {
      const msg = JSON.parse(String(data)) as T;
      if (!pred(msg)) return;
      clearTimeout(timer);
      ws.off("message", on);
      resolve(msg);
    }
    ws.on("message", on);
  });
}

function open(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.once("open", () => resolve(ws));
    ws.once("error", reject);
  });
}

test("two browsers can create, join, and start a synced match", async () => {
  const server = await startServer(0);
  try {
    const health = await fetch(`http://127.0.0.1:${server.port}/health`);
    assert.equal(health.status, 200);
    const url = `ws://127.0.0.1:${server.port}/ws`;
    const host = await open(url);
    const guest = await open(url);
    const stranger = await open(url);

    host.send(JSON.stringify({ type: "create", name: "Ada" }));
    const created = await once<{ type: string; code: string; slot: number }>(
      host,
      (msg) => msg.type === "lobby" && msg.slot === 0,
    );
    assert.equal(created.code.length, 4);

    stranger.send(JSON.stringify({ type: "join", code: "NOPE", name: "Nope" }));
    const missing = await once<{ type: string; message: string }>(stranger, (msg) => msg.type === "error");
    assert.match(missing.message, /No match/);

    guest.send(JSON.stringify({ type: "join", code: created.code, name: "Bea" }));
    const joined = await once<{ type: string; players: ({ name: string } | null)[] }>(
      guest,
      (msg) => msg.type === "lobby" && msg.players[0] !== null && msg.players[1] !== null,
    );
    assert.equal(joined.players[0]?.name, "Ada");
    assert.equal(joined.players[1]?.name, "Bea");

    stranger.send(JSON.stringify({ type: "join", code: created.code, name: "Cy" }));
    const full = await once<{ type: string; message: string }>(stranger, (msg) => msg.type === "error");
    assert.match(full.message, /two fighters/);

    host.send(JSON.stringify({ type: "pick", character: "vesper" }));
    host.send(JSON.stringify({ type: "ready", ready: true }));
    guest.send(JSON.stringify({ type: "pick", character: "moth" }));
    guest.send(JSON.stringify({ type: "ready", ready: true }));

    const started = await once<{ type: string; epoch: number; state: { phase: string; fighters: { name: string; charId: string }[] } }>(
      guest,
      (msg) => msg.type === "state",
    );
    assert.equal(started.state.phase, "intro");
    assert.equal(started.state.fighters[0].charId, "vesper");
    assert.equal(started.state.fighters[1].name, "Bea");
    assert.ok(started.epoch >= 1);

    host.send(JSON.stringify({ type: "input", mask: 1 }));
    const later = await once<{ type: string; state: { tick: number } }>(
      host,
      (msg) => msg.type === "state" && msg.state.tick > 3,
    );
    assert.ok(later.state.tick > 3);

    host.close();
    guest.close();
    stranger.close();
  } finally {
    await server.close();
  }
});
