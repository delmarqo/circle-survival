// Circle Survival Game
// This script implements the circle survival game described by the user.
// Survive each level for 30 seconds by clicking circles before they grow too large.
// Circles grow over time and spawn at an accelerating rate. Level 2 introduces
// armored circles requiring two clicks; Level 3 introduces drifting circles.

(() => {
    const gameArea = document.getElementById('game-area');
    const startBtn = document.getElementById('start-btn');
    const resumeBtn = document.getElementById('resume-btn');
    const restartBtn = document.getElementById('restart-btn');
    const resetProgressBtn = document.getElementById('reset-progress-btn');
    const levelSpan = document.getElementById('level');
    const scoreSpan = document.getElementById('score');
    const bestSpan = document.getElementById('best');
    const timerBar = document.getElementById('timer-bar');
    const timeLabel = document.getElementById('time-label');
    const overlay = document.getElementById('level-overlay');
    const overlayTitle = document.getElementById('overlay-title');
    const overlayDesc = document.getElementById('overlay-desc');
    const startLevelIndexSpan = document.getElementById('start-level-index');

    // Help elements
    const helpBtn = document.getElementById('help-btn');
    const helpOverlay = document.getElementById('help-overlay');
    const closeHelpBtn = document.getElementById('close-help-btn');
    // Track whether the game should resume automatically after closing help
    let resumeAfterHelp = false;

    let circles = [];
    let spawnTimeoutId = null;
    let animationFrameId = null;
    let gameRunning = false;
    let paused = false;
    let currentLevel = 1;
    let timeLeft = 30;
    let spawnInterval = 2000; // milliseconds until next spawn
    let spawnAcceleration = 0.9; // factor applied to spawn interval after each spawn
    let lastUpdateTime = 0;
    let score = 0;

    const BASE_SPAWN_INTERVAL = 2000;
    const MIN_SPAWN_INTERVAL = 300;

    // Start or continue the game when start button is clicked
    startBtn.addEventListener('click', () => {
        // hide overlay and start current level
        overlay.classList.add('hidden');
        startLevel();
    });

    // Open help overlay when the help button is clicked
    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            openHelp();
        });
    }

    // Close help overlay when X button clicked
    if (closeHelpBtn) {
        closeHelpBtn.addEventListener('click', () => {
            closeHelp();
        });
    }

    // Pause/resume toggle for resumeBtn
    resumeBtn.addEventListener('click', () => {
        if (!gameRunning) return;
        paused = !paused;
        resumeBtn.textContent = paused ? 'Resume' : 'Pause';
        if (paused) {
            clearTimeout(spawnTimeoutId);
            cancelAnimationFrame(animationFrameId);
        } else {
            lastUpdateTime = performance.now();
            spawnNext();
            animationFrameId = requestAnimationFrame(update);
        }
    });

    // Restart the current level
    restartBtn.addEventListener('click', () => {
        if (!gameRunning) return;
        restartLevel();
    });

    // Reset progress: clear best level and reset game state
    if (resetProgressBtn) {
        resetProgressBtn.addEventListener('click', () => {
            localStorage.removeItem('bestLevel');
            bestSpan.textContent = '0';
            // reset game state completely
            gameRunning = false;
            paused = false;
            clearTimeout(spawnTimeoutId);
            cancelAnimationFrame(animationFrameId);
            resetGame();
            currentLevel = 1;
            score = 0;
            // update overlay for starting level
            startLevelIndexSpan.textContent = currentLevel.toString();
            overlayTitle.textContent = 'Ready?';
            overlayDesc.textContent = 'Click circles before they grow too large. Survive\u00a030\u00a0seconds.';
            overlay.classList.remove('hidden');
        });
    }

    /**
     * Show the help overlay and pause the game if necessary.
     */
    function openHelp() {
        if (!helpOverlay) return;
        helpOverlay.classList.remove('hidden');
        // If the game is running and not currently paused, pause it and remember to resume after help
        if (gameRunning && !paused) {
            resumeAfterHelp = true;
            paused = true;
            resumeBtn.textContent = 'Resume';
            clearTimeout(spawnTimeoutId);
            cancelAnimationFrame(animationFrameId);
        } else {
            resumeAfterHelp = false;
        }
    }

    /**
     * Hide the help overlay and resume the game if it was paused by help.
     */
    function closeHelp() {
        if (!helpOverlay) return;
        helpOverlay.classList.add('hidden');
        if (resumeAfterHelp && gameRunning && paused) {
            paused = false;
            resumeBtn.textContent = 'Pause';
            lastUpdateTime = performance.now();
            spawnNext();
            animationFrameId = requestAnimationFrame(update);
        }
        resumeAfterHelp = false;
    }

    // Reset all game variables and clear circles
    function resetGame() {
        // remove existing circles
        circles.forEach(c => c.element.remove());
        circles = [];
        timeLeft = 30;
        // set spawnInterval based on current level (accelerates each level)
        spawnInterval = BASE_SPAWN_INTERVAL * Math.pow(0.9, currentLevel - 1);
        spawnAcceleration = 0.9;
        updateUI();
    }

    // Spawn the next circle after current spawnInterval
    function spawnNext() {
        spawnTimeoutId = setTimeout(() => {
            spawnCircle();
            // accelerate spawn interval for faster spawning
            spawnInterval *= spawnAcceleration;
            spawnInterval = Math.max(spawnInterval, 300); // cap minimum interval
            spawnNext();
        }, spawnInterval);
    }

    // Create a new circle and add it to the game area
    function spawnCircle() {
        const rect = gameArea.getBoundingClientRect();
        // initial radius
        const initialRadius = 15;
        // random position within game area boundaries
        const x = Math.random() * (rect.width - initialRadius * 2) + initialRadius;
        const y = Math.random() * (rect.height - initialRadius * 2) + initialRadius;
        const elem = document.createElement('div');
        // base class for all circles; mark as normal by default
        elem.className = 'circle normal';
        // circle properties
        const circle = {
            element: elem,
            x,
            y,
            radius: initialRadius,
            growth: 20, // pixels per second
            clicks: 1,
            driftX: 0,
            driftY: 0
        };
        // Level 2: some circles are armored and require two clicks
        if (currentLevel >= 2 && Math.random() < 0.2) {
            circle.clicks = 2;
            elem.classList.add('armored');
        }
        // Level 3: some circles drift
        if (currentLevel >= 3 && Math.random() < 0.5) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 40; // pixels per second
            circle.driftX = Math.cos(angle) * speed;
            circle.driftY = Math.sin(angle) * speed;
            // add drifter class for styling
            elem.classList.add('drifter');
        }
        // set initial size and position
        updateCircleStyle(circle);
        // click handler to remove or damage circle
        elem.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!gameRunning || paused) return;
            if (circle.clicks > 1) {
                circle.clicks--;
                elem.classList.add('damaged');
            } else {
                removeCircle(circle);
                // increment score for each circle popped
                score++;
                updateUI();
            }
        });
        gameArea.appendChild(elem);
        circles.push(circle);
    }

    // Update circle DOM element properties based on its data
    function updateCircleStyle(circle) {
        const el = circle.element;
        el.style.width = circle.radius * 2 + 'px';
        el.style.height = circle.radius * 2 + 'px';
        el.style.left = circle.x - circle.radius + 'px';
        el.style.top = circle.y - circle.radius + 'px';
    }

    // Remove circle from game and DOM
    function removeCircle(circle) {
        const idx = circles.indexOf(circle);
        if (idx >= 0) {
            circles.splice(idx, 1);
        }
        circle.element.remove();
    }

    // Main update loop using requestAnimationFrame
    function update(timestamp) {
        if (!gameRunning) return;
        if (paused) {
            animationFrameId = requestAnimationFrame(update);
            return;
        }
        const dt = (timestamp - lastUpdateTime) / 1000;
        lastUpdateTime = timestamp;
        // update timer
        timeLeft -= dt;
        if (timeLeft <= 0) {
            levelComplete();
            return;
        }
        // update each circle
        const rect = gameArea.getBoundingClientRect();
        const maxR = Math.min(rect.width, rect.height) / 2;
        for (const circle of circles) {
            // grow radius
            circle.radius += circle.growth * dt;
            // move if drifting
            circle.x += circle.driftX * dt;
            circle.y += circle.driftY * dt;
            // bounce off walls if drifting
            if (circle.driftX !== 0 || circle.driftY !== 0) {
                if (circle.x - circle.radius < 0) {
                    circle.x = circle.radius;
                    circle.driftX = Math.abs(circle.driftX);
                } else if (circle.x + circle.radius > rect.width) {
                    circle.x = rect.width - circle.radius;
                    circle.driftX = -Math.abs(circle.driftX);
                }
                if (circle.y - circle.radius < 0) {
                    circle.y = circle.radius;
                    circle.driftY = Math.abs(circle.driftY);
                } else if (circle.y + circle.radius > rect.height) {
                    circle.y = rect.height - circle.radius;
                    circle.driftY = -Math.abs(circle.driftY);
                }
            }
            // update its DOM element
            updateCircleStyle(circle);
            // check for game over
            if (circle.radius >= maxR) {
                gameOver();
                return;
            }
        }
        updateUI();
        animationFrameId = requestAnimationFrame(update);
    }

    // Update UI elements for level, time and best score
    function updateUI() {
        levelSpan.textContent = currentLevel.toString();
        scoreSpan.textContent = score.toString();
        // update best level stored in localStorage
        let best = parseInt(localStorage.getItem('bestLevel') || '0', 10);
        if (currentLevel > best) {
            localStorage.setItem('bestLevel', currentLevel.toString());
            best = currentLevel;
        }
        bestSpan.textContent = best.toString();
        // update time display and timer bar
        timeLabel.textContent = Math.max(0, Math.ceil(timeLeft)).toString();
        timerBar.style.width = ((timeLeft / 30) * 100) + '%';
    }

    // Handle completing a level
    function levelComplete() {
        clearTimeout(spawnTimeoutId);
        cancelAnimationFrame(animationFrameId);
        // clean up circles
        circles.forEach(c => c.element.remove());
        circles = [];
        const completedLevel = currentLevel;
        // increment level and reset timer for next level
        currentLevel++;
        timeLeft = 30;
        score = 0;
        // adjust spawn interval for next level (slightly faster each level)
        spawnInterval = BASE_SPAWN_INTERVAL * Math.pow(0.9, currentLevel - 1);
        spawnAcceleration = 0.9;
        updateUI();
        // prepare overlay for next level
        if (overlay) {
            overlayTitle.textContent = `Level ${completedLevel} complete!`;
            overlayDesc.textContent = 'Get ready for the next level.';
            startLevelIndexSpan.textContent = currentLevel.toString();
            overlay.classList.remove('hidden');
        } else {
            // fallback: automatically continue if overlay is missing
            startLevel();
        }
    }

    // End the game on failure
    function gameOver() {
        gameRunning = false;
        clearTimeout(spawnTimeoutId);
        cancelAnimationFrame(animationFrameId);
        // remove all circles
        circles.forEach(c => c.element.remove());
        circles = [];
        alert('Game Over! You reached level ' + currentLevel);
        // reset buttons
        resumeBtn.textContent = 'Pause';
        resumeBtn.disabled = true;
        restartBtn.disabled = true;
    }

    // Optional: clicking on empty game area has no effect
    gameArea.addEventListener('click', () => {
        // no op; could add feedback if desired
    });

    /**
     * Start the current level. Resets state and begins spawning circles.
     */
    function startLevel() {
        resetGame();
        gameRunning = true;
        paused = false;
        score = 0;
        // enable controls
        resumeBtn.disabled = false;
        restartBtn.disabled = false;
        resumeBtn.textContent = 'Pause';
        // begin spawning and animation
        lastUpdateTime = performance.now();
        spawnNext();
        animationFrameId = requestAnimationFrame(update);
    }

    /**
     * Restart the current level without changing the currentLevel counter.
     */
    function restartLevel() {
        clearTimeout(spawnTimeoutId);
        cancelAnimationFrame(animationFrameId);
        paused = false;
        score = 0;
        resetGame();
        resumeBtn.textContent = 'Pause';
        lastUpdateTime = performance.now();
        gameRunning = true;
        spawnNext();
        animationFrameId = requestAnimationFrame(update);
    }

})();