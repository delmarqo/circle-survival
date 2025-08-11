// Circle Survival Game
// This script implements the circle survival game described by the user.
// Survive each level for 30 seconds by clicking circles before they grow too large.
// Circles grow over time and spawn at an accelerating rate. Level 2 introduces
// armored circles requiring two clicks; Level 3 introduces drifting circles.

(() => {
    const gameArea = document.getElementById('game-area');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const restartBtn = document.getElementById('restart-btn');
    const levelSpan = document.getElementById('level');
    const timeSpan = document.getElementById('time');
    const bestSpan = document.getElementById('best');

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

    // Start the game when start button is clicked
    startBtn.addEventListener('click', () => {
        if (gameRunning) return;
        resetGame();
        gameRunning = true;
        paused = false;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        restartBtn.disabled = false;
        lastUpdateTime = performance.now();
        // start spawn cycle and animation loop
        spawnNext();
        animationFrameId = requestAnimationFrame(update);
    });

    // Pause/resume toggle
    pauseBtn.addEventListener('click', () => {
        if (!gameRunning) return;
        paused = !paused;
        pauseBtn.textContent = paused ? 'Resume' : 'Pause';
        if (paused) {
            clearTimeout(spawnTimeoutId);
            cancelAnimationFrame(animationFrameId);
        } else {
            lastUpdateTime = performance.now();
            spawnNext();
            animationFrameId = requestAnimationFrame(update);
        }
    });

    // Restart the game completely
    restartBtn.addEventListener('click', () => {
        if (!gameRunning) return;
        clearTimeout(spawnTimeoutId);
        cancelAnimationFrame(animationFrameId);
        gameRunning = false;
        paused = false;
        pauseBtn.textContent = 'Pause';
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        restartBtn.disabled = true;
        resetGame();
    });

    // Reset all game variables and clear circles
    function resetGame() {
        // remove existing circles
        circles.forEach(c => c.element.remove());
        circles = [];
        timeLeft = 30;
        currentLevel = 1;
        spawnInterval = 2000;
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
        elem.className = 'circle';
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
        timeSpan.textContent = Math.ceil(timeLeft).toString();
        // update best level stored in localStorage
        let best = parseInt(localStorage.getItem('bestLevel') || '0', 10);
        if (currentLevel > best) {
            localStorage.setItem('bestLevel', currentLevel.toString());
            best = currentLevel;
        }
        bestSpan.textContent = best.toString();
    }

    // Handle completing a level
    function levelComplete() {
        clearTimeout(spawnTimeoutId);
        cancelAnimationFrame(animationFrameId);
        // clean up circles
        circles.forEach(c => c.element.remove());
        circles = [];
        currentLevel++;
        timeLeft = 30;
        // adjust spawn interval for next level (slightly faster each level)
        spawnInterval = 2000 * Math.pow(0.9, currentLevel - 1);
        spawnAcceleration = 0.9;
        updateUI();
        // continue to next level automatically
        lastUpdateTime = performance.now();
        spawnNext();
        animationFrameId = requestAnimationFrame(update);
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
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        restartBtn.disabled = true;
        pauseBtn.textContent = 'Pause';
    }

    // Optional: clicking on empty game area has no effect
    gameArea.addEventListener('click', () => {
        // no op; could add feedback if desired
    });
})();