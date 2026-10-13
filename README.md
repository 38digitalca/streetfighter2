# Cinder Alley

An original two-player fighter for the browser. Create a room and send the link, play both fighters on one keyboard, or spar a practice partner.

Cinder Alley borrows the rhythm of 1990s one-on-one arcade fighters: three rounds, a timer, specials, and a block that cares whether you are standing or crouching. The fighters, stage, and sounds are original.

## Play

```bash
npm install
npm run dev
```

Open http://127.0.0.1:43123. For a production build:

```bash
npm run build
npm start
```

`npm start` serves the built site and the match server on port 43123 (override with `PORT`).

## Online matches

One player chooses **Fight online** and creates a match. The other opens the room link, or types the four-character code. Each of you picks a fighter and hits Ready. The server runs the match and both screens show the same result, so a slow connection adds delay instead of desyncing the fight.

The game feels best on a low-latency link. It uses delay-based netcode: your inputs go to the server, and the server sends back the official positions.

## Controls

| | Move | Jump | Crouch | Punch | Kick | Special |
| --- | --- | --- | --- | --- | --- | --- |
| One player (online or practice) | A D or arrows | W or ↑ | S or ↓ | J | K | L |
| Left fighter (same keyboard) | A D | W | S | F | G | H |
| Right fighter (same keyboard) | arrows | ↑ | ↓ | U | I | O |

Hold the direction away from your rival to block. Add down to block low kicks. A standing block stops jump-ins. Crouching does not.

On a phone, turn on **Touch** during a fight for a pad and three attack buttons.

Press `` ` `` during a fight to show hitboxes. Escape leaves the match.

## Fighters

- **Vesper** — fast, with a Crescent Dart.
- **Juno** — gold gloves and a rising hook.
- **Coil** — a long low slide, and a dive from the air.
- **Reed** — a heavier, slower dart.
- **Brass** — slow and heavy, with a Rising Hook that launches.
- **Moth** — even tools and a two-hit Lantern Flare.
- **Ash** — a wider, colder flare.
- **Kite** — a low slide on the ground and a Dive Spike from the air.

On the player select screen, click a portrait for 1P and right-click for 2P. The world map marks each fighter's home.

First to two rounds wins. A double KO gives the round to neither fighter. When time runs out, the healthier fighter takes the round.

## Tests

```bash
npm test
npm run typecheck
```
