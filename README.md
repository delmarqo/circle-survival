# Circle Survival

Circle Survival is a simple browser game built with plain HTML, CSS and JavaScript. Your goal is to survive each 30‑second round by clicking on growing circles before any one of them fills the play area. As you progress through levels the challenge increases:

1. **Level 1:** Circles spawn and grow at a moderate rate.
2. **Level 2:** Some circles are *armored* and require two clicks to destroy.
3. **Level 3:** Some circles drift across the screen, bouncing off the edges.
4. **Levels 4+** become progressively harder by increasing the spawn rate and making earlier mechanics more frequent.

## Playing the game

Open `index.html` in a web browser. Click **Start** to begin. Circles will start spawning and growing. Click each circle before it reaches the boundary of the play area. Survive the full 30 seconds to advance to the next level. If a circle reaches the edge, the game ends. Your best level is saved locally in `localStorage` and displayed alongside the current level and time.

The **Pause** button toggles pausing and resuming. The **Restart** button resets the current game.

## Deploying to Netlify

You can deploy this game to Netlify without any build step since all files are static. After committing the project to a GitHub repository:

1. Log into Netlify and click **Add new site → Import from Git**.
2. Choose your GitHub account and select the repository containing these files.
3. Since this is a static site, leave the build command blank and set the publish directory to the repository root (or `.`).
4. Deploy the site. Netlify will host your game and provide a shareable URL.

Enjoy testing your reflexes and see how many levels you can beat!