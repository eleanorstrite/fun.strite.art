# Sidequest

A static game playground for GitHub Pages. Includes Knights and Dragons (a 2D knight-and-dragon maze), a shared character studio, a wallet, and character/environment/equipment upgrades. No runtime dependencies, bundler, account, or backend required.

## Homepage robot wardrobe

The Character Studio offers a classic robot, hoodie, overalls, space suit, or adventure jacket; a separate clothing color; baseball cap, beanie, or top hat; and mix-and-match glasses, headphones, and backpack. All robot wardrobe choices are free. Changes update both homepage previews and save automatically when a valid explorer name is present. Robot clothing is saved separately from knight equipment inside the character save and transfers with export/import. Older saves default to the classic robot. Pressing Save your explorer queues a short dance for the forest explorer; it starts when you scroll back to it and pauses if it leaves view. Reduced-motion settings use a gentle glow instead.

## Home screen backgrounds

Use **Pick your scenery** at the top of the home screen to choose Countryside, City, Sunset, Starry night, or the original Classic background for free. Northern Lights (200 coins) and Enchanted Forest (350 coins) unlock through the shop. Original SVG scenes are bundled locally. The selection is saved per browser under `sidequest.background.v1`, independently of game saves; purchased background ownership is included in game saves, but the selected scene is not; it does not change the maze or exported progress.

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
- `src/knight-maze.js`: original pixel sprites, connected stone maze, buffered movement, dragon pathfinding, three lives, four swords granting 10 seconds of power each, and testable simulation rules. Collecting all gems earns 30 coins; each defeated dragon adds 2 bonus coins, capped at 10 bonus coins (40 total per run). Partial runs earn the floored proportion of 30 coins for gems collected, plus the same capped dragon bonus; dragons respawn after eight seconds. New swords refresh the timer to 10 seconds. Keyboard, swipe, and on-screen direction buttons are supported. Three smiley faces below the maze track lives. Getting eaten removes one face and pauses the world for 1.5 seconds before respawning (or showing game over). Synthesized arcade sounds mark gems, swords, dragon defeats, losing a life, and victory; the Sound on/off button mutes them. Winning plays a 7.5-second animated ending: a chest springs open, colorful gems burst out, and your knight waves its sword beneath a “You win!” speech bubble. Supported browsers also speak the line when sound is on. Losing all three lives plays an eight-second cartoon ending: the knight waves its sword, a dragon gulps it down with a visible throat bulge, and says “You lose.” A caption is always shown; speech plays when supported and unmuted. Tap or press Enter to skip either ending to results; pausing or hiding the tab freezes the ending. Reduced-motion settings simplify the movement. Audio begins after a user interaction and is optional when Web Audio is unavailable. The shared color becomes the knight’s cape and plume. Boots increase speed and the magnet collects adjacent corridor gems.
- `src/app.js`: hub UI, shared character station, shop, save tools, and game modal. The Character studio button inside every game opens the shared station. A knight customizer below the direction buttons provides a live preview, free armor and cape colors, helmet accessories, cape/shield toggles, and purchased knight and dragon styles. Appearance changes save automatically and update the current game and ending scenes immediately. Focusing the controls pauses an active game; use Resume when ready. Older saves receive the default silver armor and feather plume. Newly purchased upgrades apply when entering a game.
- `styles.css`: responsive design and CSS character artwork.

The shop is split into **Gameplay** (speed and magnet) and **Appearance** (backgrounds, armor, helmets, and dragon colors). It offers Super Speed (800 coins), Gem Magnet (1,000), Northern Lights background (200), Enchanted Forest background (350), Emerald Armor (250), Winged Helmet (300), Ember Dragons (350), and Ice Dragons (500). Cosmetic items are selectable after purchase and do not alter difficulty. Existing free choices remain free. The retired tree/garden upgrade is removed from old saves and its original 60-coin cost is refunded once during save normalization. Existing speed and magnet purchases remain owned at no extra charge. You begin with zero coins and earn progress through play.

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
