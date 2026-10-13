import type { ClientMsg, ServerMsg } from "../shared/protocol";

export class Link {
  private ws: WebSocket | null = null;
  onMessage: (msg: ServerMsg) => void = () => {};
  onClose: () => void = () => {};

  isOpen(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  open(): Promise<void> {
    if (this.isOpen()) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const proto = location.protocol === "https:" ? "wss" : "ws";
      const ws = new WebSocket(`${proto}://${location.host}/ws`);
      this.ws = ws;
      let settled = false;
      ws.onopen = () => {
        settled = true;
        resolve();
      };
      ws.onerror = () => {
        if (!settled) {
          settled = true;
          reject(new Error("Could not reach the match server."));
        }
      };
      ws.onclose = () => {
        if (!settled) {
          settled = true;
          reject(new Error("Could not reach the match server."));
          return;
        }
        this.onClose();
      };
      ws.onmessage = (event) => {
        try {
          this.onMessage(JSON.parse(String(event.data)) as ServerMsg);
        } catch {
          /* ignore malformed packets */
        }
      };
    });
  }

  send(msg: ClientMsg) {
    if (this.isOpen()) this.ws?.send(JSON.stringify(msg));
  }

  close() {
    this.ws?.close();
    this.ws = null;
  }
}
