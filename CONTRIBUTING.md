# Contributing

The game is a browser client plus one Node process that hosts rooms. Both sides share the fight rules in `shared/`, so a change to damage or movement has to land there or the online match will disagree with the screen.

## Run it

```bash
npm install
npm run dev
```

Open http://127.0.0.1:43123. The dev server proxies `/ws` to the match process on port 43124.

Before you open a pull request:

```bash
npm test
npm run typecheck
```

## Where things live

| Path | What to change |
| --- | --- |
| `shared/sim.ts` | Movement, hits, rounds, and the timer |
| `shared/characters.ts` | Roster, stats, and move data |
| `shared/protocol.ts` | Messages between the browser and the server |
| `server/index.ts` | Rooms, match sockets, and static files in production |
| `src/main.ts` | Screens and online flow |
| `src/render.ts` | Stage and in-match drawing |
| `src/selectart.ts`, `src/ui.ts`, `src/style.css` | Front page, character select, and menus |
| `src/sprites.ts` | Which painted pose file each action uses |
| `public/title/front.jpg` | Front-page wallpaper |
| `public/select/globe.jpg` | Character-select wallpaper |
| `public/fighters/<id>/` | Portrait and fight poses |
| `tests/` | Simulation and server tests |

## Add or replace a pose

Put a transparent PNG in `public/fighters/<id>/`. Poses the game asks for are `portrait`, `idle`, `punch`, `kick`, `jump`, `special`, and `crouch`. If one picture covers several actions, point those actions at the file in `FILE_ALIAS` inside `src/sprites.ts`.

Tune how tall that pose stands in `PAINT_HEIGHT` in `src/render.ts`. The bottom of the image sits on the floor, so trim empty space under the feet.

## Suggest a change

Open an issue with what you want to improve and which screen it affects. A pull request should do one thing, and the tests above should pass.

By opening a pull request you agree the project can keep and change your contribution. Do not add Capcom sprites, logos, or other files you do not have rights to.
