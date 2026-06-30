📖 Overview:

NimbuPlay was built to recreate the feel of a classic browser arcade — a single hub where users can browse available games and jump straight into playing, with zero downloads or installs.

The project currently features:


A dynamic landing page with an animated starfield background and a game catalog
A fully functional Mario-style platformer game with real-time HUD tracking
A "Coming Soon" section previewing future titles (Zelda, Pac-Man, Tetris)


The goal was twofold: build a landing page strong enough to feel like a real product, and prove the underlying architecture could support an actual playable game — not just a static demo.

✨ Features:

🌌 Animated starfield background rendered on Canvas with twinkling stars
🕹️ Playable platformer game with movement, jumping, and collision detection
📊 Real-time HUD — tracks score, coins, world, time, and lives
🎨 Canvas-based previews for hero section and game cards, consistent visual style across the platform
🧩 Two-page architecture — clear separation between platform UI and game runtime
📱 Responsive layout for different screen sizes

🛠️ Tech Stack

Technology  Purposes 
HTML5       Page structure
CSS3        Styling and Layout
JavaScript  Game logic, DOM updates, animations
Canvas API  Rendering — starfield, previews, and the game itself

No frameworks, no build step, no dependencies — runs directly in the browser.

🎯 How the Game Works


A central game state object in game.js tracks score, coins, world, time, and lives — the single source of truth for the session.
The game loop runs via requestAnimationFrame, targeting 60fps for smooth rendering and updates.
Collision detection handles player interactions with platforms, coins, and obstacles.
The HUD is updated by reading from the game state object whenever a relevant event occurs (e.g. collecting a coin, taking damage), keeping rendering logic and UI updates decoupled.
The timer runs on setInterval (1-second ticks) rather than the animation frame, so the countdown stays accurate regardless of frame rate.

📁 Project Structure

NimbuPlay/
│
├── index.html          # Landing page — hero section, game catalog, "Coming Soon"
├── game.html            # Game runtime page — canvas, HUD, controls
├── style.css             # Shared styling for landing page and HUD
├── script.js             # Landing page logic (starfield, card previews, navigation)
├── game.js               # Core game logic — game loop, state, rendering, input
└── assets/                # Sprites, icons, and other static assets



