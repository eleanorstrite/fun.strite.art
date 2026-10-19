# Sidequest

A static game playground for GitHub Pages. Includes Knights and Dragons (a 2D knight-and-dragon maze), a shared character studio, a wallet, and character/environment/equipment upgrades. No runtime dependencies, bundler, account, or backend required.

## Run locally

Run `python3 -m http.server 8000` in this directory, then open http://localhost:8000. Serve over HTTP rather than opening the HTML file directly because the app uses JavaScript modules. Fonts load optionally from Google Fonts; local fallback fonts work offline.

## Run with the VS Code button

Open this folder in VS Code and install the recommended **Python** and **Python Debugger** extensions when prompted (one-time setup). In **Run and Debug**, select **Run Sidequest** and click the green play button, or press **F5**. The Python server starts on port 8000 and your browser opens automatically. Use the red Stop button to stop the server. Python 3 must be installed and selected as the VS Code interpreter.

For a server without the debugger extension, choose **Terminal → Run Task → Run Sidequest server**, then open http://127.0.0.1:8000. Stop it with the terminal's trash button. Run only one server at a time; if port 8000 is already in use, stop the existing server first.

## Git workflow

`AGENTS.md` requires Codex to follow `skills/commit-and-push/SKILL.md` after completed changes: validate, make a meaningful commit, and push the current branch to GitHub. This is an agent workflow instruction, not a background watcher that commits every editor save. Changes to `main` also trigger the existing GitHub Pages workflow.

## Publish to GitHub Pages

Push these files to the `main` branch. In the repository's **Settings → Pages → Build and deployment**, select **GitHub Actions**. The included workflow tests the shared progression system and deploys only the static website files. You can also run it from the Actions tab. Relative asset paths support both a project URL such as `https://eleanorstrite.github.io/fun.strite.art/` and a custom domain. No custom domain is assumed; configure DNS and the domain in GitHub Pages separately if desired.

## How the shared system works

- `src/system.js`: versioned save validation, character settings, a single wallet, upgrade catalog, per-game statistics, import/export, and single-settlement game sessions. `modifiers()` supplies shared gameplay effects.
- `src/games.js`: the game registry and preview dispatch for adding future 2D or 3D games. Knights and Dragons ends when all gems are collected or all three lives are lost. Closing an active game settles the coins collected so far. Pausing or hiding the tab freezes gameplay.
- `src/knight-maze.js`: original pixel sprites, connected stone maze, buffered movement, dragon pathfinding, three lives, four swords granting 10 seconds of power each, and testable simulation rules. Gems earn one coin and defeated dragons earn ten; dragons respawn after eight seconds. New swords refresh the timer to 10 seconds. Keyboard, swipe, and on-screen direction buttons are supported. Three smiley faces below the maze track lives. Getting eaten removes one face and pauses the world for 1.5 seconds before respawning (or showing game over). Synthesized arcade sounds mark gems, swords, dragon defeats, losing a life, and victory; the Sound on/off button mutes them. Winning plays a 7.5-second animated ending: a chest springs open, colorful gems burst out, and your knight waves its sword beneath a “You win!” speech bubble. Supported browsers also speak the line when sound is on. Tap or press Enter to skip to rewards; pausing or hiding the tab freezes the ending. Reduced-motion settings simplify the movement. Audio begins after a user interaction and is optional when Web Audio is unavailable. The shared color becomes the knight’s cape and plume. Boots increase speed, the magnet collects adjacent corridor gems, and the garden adds blooming moss to the dungeon.
- `src/app.js`: hub UI, shared character station, shop, save tools, and game modal. The Character studio button inside every game opens the shared station. Character changes and newly purchased upgrades apply when entering a game.
- `styles.css`: responsive design and CSS character artwork.

The shop currently offers faster movement (40 coins), a blooming environment (60), and increased pickup range (80). These affect Knights and Dragons and are available for future games to support. You begin with zero coins and earn progress through play.

## Add a game or simulation

1. Add a renderer module and import its factory in `src/games.js`.
2. Add a `GAMES` entry with a unique lowercase hyphenated `id`, `name`, `dimension` (`2D` or `3D`), `genre`, `description`, `tone`, and `create` factory. Supply a `preview` function for the new game's artwork.
3. The factory receives `{ canvas, game, character, modifiers, onHud, onFinish }`. Return `start()`, `pause(boolean)`, and `destroy()`. `start()` begins or resets a round, `onHud({ remaining, earned })` updates the status, and `onFinish(integerCoins, optionalResult)` settles the reward; `optionalResult` can contain `title` and `detail`. `onHud({ text })` supports custom status text. Registry entries may set `mode`, `instructions`, canvas `width` / `height`, and a `preview(canvas, character, modifiers)` function. Games with `directional: true` expose `input(direction)` to use the on-screen controls. The host creates the shared session and protects against duplicate settlement. Rewards must be integers from 0 to 1000 per session.
4. Release animation loops and event handlers in `destroy()`. If a game ends on exit, call `onFinish` there. Honor the passed character and shared modifiers; keep wallet writes in the shared system. Adapt the host's timer/instructions UI for games with other session rules.
5. Add new global upgrade definitions in `UPGRADES`, implement their effects in `modifiers()`, and consume those effects in each renderer. Game-specific upgrades can be added by extending the save schema with a migration.

A future Three.js/WebGL renderer can use the same contract without replacing character/progression storage.

## Saves and limitations

Progress is stored under `sidequest.save.v1` in localStorage for this browser and origin. Export/import transfers saves between browsers. Imports replace current progress after confirmation. There is no account sync, multiplayer, server verification, or cross-tab merge. Avoid playing in multiple tabs at once. Static hosting cannot prevent players from editing local saves; coins have no monetary value. If storage is unavailable, play still works in memory and the UI recommends exporting.

## Verification

With Node.js 22 or later installed, run `npm test` (or `node --test tests/*.test.js`). Tests cover maze connectivity, sword duration/refresh, movement, dragon defeats/respawns, lives, victory, pause/hidden-tab behavior, shared rewards, duplicate settlement, purchases, persistence, validation, and storage failures. GitHub Actions runs these before deployment. Manually check desktop keyboard play, touch/pointer play, the modal's Escape/close behavior, the maze, all upgrades, and export/import on supported browsers.

## Knights and Dragons artwork

The knight and dragon are original code-drawn pixel sprites inspired by the supplied armored-knight and winged-dragon references. The reference GIFs are not bundled. The maze is an original layout rather than the supplied Pac-Man board.
