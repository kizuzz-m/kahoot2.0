/**
 * Quizwerk Relay – minimaler WebSocket-Server für den lokalen Betrieb ohne Supabase.
 *
 * Jeder Client verbindet sich mit  ws://<host>:3001/?room=<SPIELCODE>
 * Nachrichten werden unverändert an alle anderen Clients desselben Raums weitergeleitet.
 * Die gesamte Spiellogik läuft beim Host im Browser – der Relay kennt keine Antworten.
 */
import { WebSocketServer } from "ws";
import os from "node:os";

const PORT = Number(process.env.RELAY_PORT || 3001);
const MAX_MESSAGE_BYTES = 512 * 1024;

/** @type {Map<string, Set<import("ws").WebSocket>>} */
const rooms = new Map();

const wss = new WebSocketServer({ port: PORT, maxPayload: MAX_MESSAGE_BYTES });

wss.on("connection", (socket, req) => {
  const url = new URL(req.url ?? "/", "http://relay");
  const room = (url.searchParams.get("room") || "").replace(/[^0-9A-Za-z_-]/g, "").slice(0, 32);
  if (!room) {
    socket.close(4000, "room fehlt");
    return;
  }

  let peers = rooms.get(room);
  if (!peers) rooms.set(room, (peers = new Set()));
  peers.add(socket);
  socket.isAlive = true;

  socket.on("pong", () => (socket.isAlive = true));

  socket.on("message", (data, isBinary) => {
    if (isBinary) return;
    for (const peer of peers) {
      if (peer !== socket && peer.readyState === peer.OPEN) peer.send(data.toString());
    }
  });

  socket.on("close", () => {
    peers.delete(socket);
    if (peers.size === 0) rooms.delete(room);
  });

  socket.on("error", () => socket.terminate());
});

// Tote Verbindungen regelmäßig entfernen
const interval = setInterval(() => {
  for (const socket of wss.clients) {
    if (socket.isAlive === false) {
      socket.terminate();
      continue;
    }
    socket.isAlive = false;
    socket.ping();
  }
}, 15000);
wss.on("close", () => clearInterval(interval));

const lanAddresses = Object.values(os.networkInterfaces())
  .flat()
  .filter((i) => i && i.family === "IPv4" && !i.internal)
  .map((i) => i.address);

console.log(`[relay] Quizwerk-Relay läuft auf ws://localhost:${PORT}`);
for (const ip of lanAddresses) console.log(`[relay] im Netzwerk erreichbar: ws://${ip}:${PORT}`);
