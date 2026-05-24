// -------------------------------------------------------------------------
// 0. DIAGNOSTIC LOGGER (Writes to console)
// -------------------------------------------------------------------------
function logDebug(msg) {
    console.log(msg);
}

logDebug("js/script.js loaded successfully.");
if (window.location.protocol === 'file:') {
    console.warn("⚠️ WARNING: Running via file:// protocol. Browsers block model-viewer from loading local files under file:// due to CORS policies. Please open via http://localhost/ProjectWebAppJs/index.html instead.");
} else {
    logDebug(`Running via protocol: ${window.location.protocol} (host: ${window.location.host})`);
}

document.addEventListener('DOMContentLoaded', () => {
    logDebug("DOMContentLoaded fired.");
    // -------------------------------------------------------------------------
    // 1. SETUP STATE VARIABLES & DOM CACHE
    // -------------------------------------------------------------------------
    let targetScrollY = 0;
    let currentScrollY = 0;
    const lerpFactor = 0.08; // Momentum smoothing factor (lower = smoother)
    let maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    let scrollPercent = 0;
    let lastScrollPercent = -1;
    let currentSkew = 0;

    const body = document.body;
    const header = document.getElementById('main-header');
    const progressBar = document.getElementById('progressBar');
    const studioBg = document.getElementById('studioBg');
    const studioShadows = document.getElementById('studioShadows');
    const spotlight = document.getElementById('spotlight');
    const preloaderOverlay = document.getElementById('preloaderOverlay');
    const preloadProgressBar = document.getElementById('preloadProgressBar');
    const preloadStatusText = document.getElementById('preloadStatusText');
    const preloadCounter = document.getElementById('preloadCounter');

    // Dynamic loader progress interval (ticks up to 85% while downloading PrinceCenter)
    let progressVal = 0;
    const progressInterval = setInterval(() => {
        if (progressVal < 85) {
            progressVal += Math.floor(Math.random() * 8) + 2; // increments of 2 to 10
            if (progressVal > 85) progressVal = 85;
            if (preloadProgressBar) preloadProgressBar.style.width = `${progressVal}%`;
            if (preloadCounter) preloadCounter.innerText = `${progressVal}%`;
        }
    }, 150);

    const heroPrince = document.getElementById('hero-prince');

    const phases = [
        document.getElementById('phase1'),
        document.getElementById('phase2'),
        document.getElementById('phase3'),
        document.getElementById('phase4')
    ];

    // Dispersion coordinates mapping (family photo -> zero gravity -> randomly spread on-screen framing in vw/vh)
    // startX/Y: Original element-relative percentage values (%) from CSS layout
    // endX/Y & peakX/Y: Viewport-relative units (vw/vh) for zoom resilience
    const dispersionConfig = [
        { id: 'hirono-1', scaleCorrection: 0.90, startX: -78, startY: -48, startScale: 0.72, endX: -34, endY: -35, endScale: 0.70, peakX: -36, peakY: -33, peakScale: 0.75, startRot: -6, endRot: 8, peakRot: -2, spinY: -360, blur: 4, swayDuration: 6 },
        { id: 'hirono-2', scaleCorrection: 0.90, startX: -22, startY: -48, startScale: 0.72, endX: 34, endY: -35, endScale: 0.70, peakX: 36, peakY: -33, peakScale: 0.75, startRot: 6, endRot: -8, peakRot: 2, spinY: 360, blur: 3, swayDuration: 7 },
        { id: 'hirono-3', scaleCorrection: 0.85, startX: -105, startY: -68, startScale: 0.78, endX: -22, endY: -8, endScale: 0.55, peakX: -24, peakY: -6, peakScale: 0.60, startRot: -10, endRot: 12, peakRot: -3, spinY: -360, blur: 5, swayDuration: 8 },
        { id: 'hirono-4', scaleCorrection: 0.88, startX: -36, startY: -92, startScale: 0.78, endX: -4, endY: -42, endScale: 0.45, peakX: -3, peakY: -40, peakScale: 0.50, startRot: 3, endRot: -3, peakRot: 0, spinY: 360, blur: 3, swayDuration: 9 },
        { id: 'hirono-5', scaleCorrection: 0.85, startX: 5, startY: -68, startScale: 0.78, endX: 22, endY: -8, endScale: 0.55, peakX: 24, peakY: -6, peakScale: 0.60, startRot: 10, endRot: -12, peakRot: 3, spinY: 360, blur: 4, swayDuration: 7.5 },
        { id: 'hirono-6', scaleCorrection: 0.72, startX: -140, startY: -58, startScale: 0.95, endX: -38, endY: 8, endScale: 0.85, peakX: -40, peakY: 12, peakScale: 0.90, startRot: -8, endRot: 10, peakRot: -4, spinY: -360, blur: 5, swayDuration: 10 },
        { id: 'hirono-7', scaleCorrection: 0.72, startX: -112, startY: -35, startScale: 0.95, endX: -24, endY: 32, endScale: 0.60, peakX: -26, peakY: 34, peakScale: 0.65, startRot: -5, endRot: 8, peakRot: -3, spinY: -360, blur: 3, swayDuration: 8.5 },
        { id: 'hirono-8', scaleCorrection: 0.72, startX: 40, startY: -58, startScale: 0.95, endX: 38, endY: 8, endScale: 0.85, peakX: 40, peakY: 12, peakScale: 0.90, startRot: 8, endRot: -10, peakRot: 4, spinY: 360, blur: 3, swayDuration: 9.5 },
        { id: 'hirono-9', scaleCorrection: 0.72, startX: 12, startY: -35, startScale: 0.95, endX: 24, endY: 32, endScale: 0.60, peakX: 26, peakY: 34, peakScale: 0.65, startRot: 5, endRot: -8, peakRot: 3, spinY: 360, blur: 4, swayDuration: 11 }
    ];

    // Cache elements for 9 floating models and attach listeners
    const floatingModels = dispersionConfig.map(c => {
        const model = document.getElementById(c.id);
        if (model) {
            model.addEventListener('load', () => {
                logDebug(`SUCCESS: Model ${c.id} loaded.`);
                model.classList.add('fully-loaded');
            });
            model.addEventListener('error', (err) => {
                let detailStr = 'no detail';
                if (err && err.detail) {
                    detailStr = `type=${err.detail.type || 'N/A'}, url=${err.detail.url || 'N/A'}`;
                }
                logDebug(`ERROR: Model ${c.id} failed to load. Detail: ${detailStr}`);
            });

            // --- Hover interactivity: +5% scale boost ---
            model.addEventListener('mouseenter', () => {
                if (!model.classList.contains('fully-loaded')) return;
                model._hoverBoost = true;
            });
            model.addEventListener('mouseleave', () => {
                model._hoverBoost = false;
            });
        }
        return model;
    });

    // -------------------------------------------------------------------------
    // 2. STAGGERED LAZY LOADING OPTIMIZATION
    // -------------------------------------------------------------------------
    body.style.overflow = 'hidden'; // Lock scrolling during initial load
    logDebug("Scrolling locked. Setup load listeners.");

    function startExhibition() {
        logDebug("startExhibition() triggered.");
        clearInterval(progressInterval); // Clear the fake loader interval
        if (preloadProgressBar) preloadProgressBar.style.width = '100%';
        if (preloadCounter) preloadCounter.innerText = '100%';
        if (preloadStatusText) preloadStatusText.innerText = 'Entering Exhibition...';

        setTimeout(() => {
            logDebug("Preloader fading out. Scroll unlocked.");
            if (preloaderOverlay) {
                preloaderOverlay.classList.add('fade-out');
            }
            body.style.overflow = 'auto'; // Unlock scrolling
            updateScrollScene(0); // Run initial layout update
            updateIdleScene(0, 0);
            
            // Staggered loading: Wait 1000ms after preloader starts fading to ensure no lag,
            // and space out model loads by 400ms to give WebGL compiler room.
            setTimeout(() => {
                floatingModels.forEach((model, index) => {
                    if (model) {
                        const dataSrc = model.getAttribute('data-src');
                        if (dataSrc) {
                            setTimeout(() => {
                                logDebug(`Loading background model: ${model.id} (${dataSrc})`);
                                model.setAttribute('src', dataSrc);
                            }, 400 * index);
                        } else {
                            logDebug(`WARNING: No data-src found on ${model.id}`);
                        }
                    }
                });
            }, 1000);
        }, 600);
    }

    // Hero-First load: Track ONLY the hero model to unlock the screen ASAP
    if (heroPrince) {
        logDebug(`heroPrince found. loaded state: ${heroPrince.loaded}`);
        if (heroPrince.loaded) {
            logDebug("Hero already loaded (cached). Starting exhibition.");
            heroPrince.classList.add('fully-loaded');
            startExhibition();
        } else {
            logDebug("Waiting for Hero model 'load' or 'error' event.");
            heroPrince.addEventListener('load', () => {
                logDebug("Hero Prince 'load' event fired successfully.");
                heroPrince.classList.add('fully-loaded');
                startExhibition();
            });
            heroPrince.addEventListener('error', (err) => {
                let detailStr = 'no detail';
                if (err && err.detail) {
                    detailStr = `type=${err.detail.type || 'N/A'}, url=${err.detail.url || 'N/A'}`;
                }
                logDebug(`Hero Prince 'error' event fired. Detail: ${detailStr}`);
                startExhibition();
            });
        }
    } else {
        logDebug("ERROR: heroPrince element not found!");
        startExhibition();
    }

    // Backup safety timeout
    setTimeout(() => {
        if (body.style.overflow === 'hidden') {
            logDebug("Safety load timeout triggered (4 seconds). Unlocking.");
            startExhibition();
        }
    }, 4000);

    // -------------------------------------------------------------------------
    // 3. EVENT LISTENERS
    // -------------------------------------------------------------------------
    window.addEventListener('scroll', () => {
        targetScrollY = window.scrollY;
    });

    // Debounced window resize handler (prevents excessive recalculations during window resizing)
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            logDebug(`Resize recalibrated maxScroll: ${maxScroll}`);
        }, 150);
    });

    // Helper: Opacity calculation bounds
    function calculateOpacity(progress, fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd) {
        if (progress < fadeInStart) return 0;
        if (progress < fadeInEnd) {
            return (progress - fadeInStart) / (fadeInEnd - fadeInStart);
        }
        if (progress < fadeOutStart) return 1;
        if (progress < fadeOutEnd) {
            return 1 - ((progress - fadeOutStart) / (fadeOutEnd - fadeOutStart));
        }
        return 0;
    }

    // Helper to get normalized scroll progress within a specific phase range
    function getPhaseProgress(progress, start, end) {
        if (progress < start) return 0;
        if (progress > end) return 1;
        return (progress - start) / (end - start);
    }

    // -------------------------------------------------------------------------
    // 4. ANIMATION UPDATE LOOP (Drives zero-gravity dispersal and peaking)
    // -------------------------------------------------------------------------

    // Idle sway: compute a subtle per-model float offset based on elapsed time
    const startTime = performance.now();

    function getSwayOffset(elapsedMs, duration) {
        const t = (elapsedMs / 1000) % duration / duration; // 0..1 normalized cycle
        const yOff = Math.sin(t * Math.PI * 2) * 0.8; // ±0.8vh vertical sway
        const xOff = Math.cos(t * Math.PI * 2 + 0.5) * 0.4; // ±0.4vw horizontal drift
        return { x: xOff, y: yOff };
    }

    // 4.1 Update Scroll-Dependent Elements (Only run when scrollPercent changes)
    function updateScrollScene(percent) {
        // --- Header Glassmorphic Transition ---
        if (currentScrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // --- Scroll Progress Bar ---
        if (progressBar) progressBar.style.width = `${percent * 100}%`;

        // --- Ambient Background Vignette & Spotlight ---
        let shadowOpacity = 0.95;
        let ambientSpotlight = 0.05;

        if (percent <= 0.3) {
            const p = percent / 0.3;
            shadowOpacity = 0.95 - (p * 0.6); // dims vignette
            ambientSpotlight = 0.05 + (p * 0.25); // brightens spotlight
        } else if (percent <= 0.8) {
            shadowOpacity = 0.35;
            ambientSpotlight = 0.30;
        } else {
            const p = (percent - 0.8) / 0.2;
            shadowOpacity = 0.35 + (p * 0.25); // returns vignette slightly
            ambientSpotlight = 0.30 - (p * 0.15); // dims spotlight
        }
        if (studioShadows) studioShadows.style.opacity = shadowOpacity;
        if (spotlight) spotlight.style.opacity = ambientSpotlight;

        // Background Grid Parallax
        if (studioBg) studioBg.style.transform = `scale(${1 + percent * 0.05})`;
        const gridElement = document.querySelector('.studio-grid');
        if (gridElement) {
            gridElement.style.transform = `translate3d(0, ${percent * 40}px, 0) rotate(${percent * 1.5}deg)`;
        }

        // --- Hero Model (PrinceCenter) Animating & Visibility Throttling ---
        let heroScale = 1.15; // Boosted base scale for hero dominance
        let heroAngle = 90; // Start at 90deg (facing front)
        
        if (percent <= 0.8) {
            const t = percent / 0.8;
            heroScale = 1.15 + 0.55 * t; // Scale up to 1.70
            heroAngle = 90 + t * 360;   // Full 360-degree Y rotation starting from 90deg
        } else {
            const fadeProgress = (percent - 0.8) / 0.2;
            heroScale = 1.70 - 0.55 * fadeProgress; // Scale back down to 1.15
            heroAngle = 450;                        // Locked facing front (450deg = 90deg + 360deg)
        }

        if (heroPrince) {
            const isLoaded = heroPrince.classList.contains('fully-loaded');
            heroPrince.style.opacity = isLoaded ? 1 : 0;
            heroPrince.style.visibility = isLoaded ? 'visible' : 'hidden';
            heroPrince.style.pointerEvents = isLoaded ? 'auto' : 'none';
            if (isLoaded) {
                heroPrince.style.transform = `translate(-50%, -50%) scale(calc(${heroScale} * var(--hirono-scale-multiplier)))`;
                heroPrince.setAttribute('camera-orbit', `${heroAngle}deg 75deg 105%`);
            }
        }

        // --- Story Text Reveals ---
        // Helper to apply dynamic text effects (skew and shimmer)
        function applyTextEffects(phaseIndex, op, y, startP, endP) {
            const phase = phases[phaseIndex];
            if (!phase) return;

            // Set opacity
            phase.style.opacity = op;
            
            // Set translation and skew variables (controlled dynamically by velocity skew)
            phase.style.setProperty('--y', `${y}px`);
            phase.style.setProperty('--skew', `${currentSkew}deg`);

            // Gold Shimmer Sweep: position moves from 200% (hidden right) to 0% (swept left)
            const p = getPhaseProgress(percent, startP, endP);
            const shimmerPos = 200 - p * 200;
            phase.style.setProperty('--shimmer-pos', `${shimmerPos}%`);
        }

        // Phase 1 (0% to 20%)
        const op1 = calculateOpacity(percent, 0.0, 0.05, 0.15, 0.2);
        const y1 = (1 - op1) * 30;
        applyTextEffects(0, op1, y1, 0.0, 0.2);

        // Phase 2 (20% to 50%)
        const op2 = calculateOpacity(percent, 0.2, 0.25, 0.45, 0.5);
        const y2 = (1 - op2) * 30;
        applyTextEffects(1, op2, y2, 0.2, 0.5);

        // Phase 3 (50% to 80%)
        const op3 = calculateOpacity(percent, 0.5, 0.55, 0.75, 0.8);
        const y3 = (1 - op3) * 30;
        applyTextEffects(2, op3, y3, 0.5, 0.8);

        // Phase 4 (80% to 100% - CTA)
        const op4 = calculateOpacity(percent, 0.8, 0.86, 1.1, 1.1);
        let y4 = (1 - op4) * 45;
        if (percent > 0.85) {
            const shiftP = (percent - 0.85) / 0.15;
            y4 -= shiftP * 65; // Lift CTA upwards as footer enters from the bottom
        }
        applyTextEffects(3, op4, y4, 0.8, 1.0);
    }

    // 4.2 Update Idle-Dependent Elements (Runs on every frame for float animation)
    function updateIdleScene(elapsed, percent) {
        dispersionConfig.forEach(config => {
            const modelEl = document.getElementById(config.id);
            if (!modelEl) return;

            // Only update transform if the model has fully loaded
            const isLoaded = modelEl.classList.contains('fully-loaded');
            if (!isLoaded) {
                modelEl.style.opacity = 0;
                modelEl.style.visibility = 'hidden';
                modelEl.style.pointerEvents = 'none';
                return;
            }

            let posX, posY;
            let currentScale = 1.0;
            let currentOpacity = 1.0;
            let currentBlur = 0;
            let currentTilt = 0;
            let currentAngle = 90; // Start facing front

            const sway = getSwayOffset(elapsed, config.swayDuration || 8);

            if (percent <= 0.8) {
                // Scroll 0% -> 80%: Zero-gravity explosion and drift (hybrid percentage to vw/vh)
                const t = percent / 0.8;
                posX = `calc((1 - ${t}) * ${config.startX}% + ${t} * (-50% + ${config.endX}vw) + ${sway.x}vw)`;
                posY = `calc((1 - ${t}) * ${config.startY}% + ${t} * (-50% + ${config.endY}vh) + ${sway.y}vh)`;
                currentScale = config.startScale + (config.endScale - config.startScale) * t;
                currentTilt = config.startRot + (config.endRot - config.startRot) * t;
                currentAngle = 90 + (config.spinY || 0) * t;
                currentOpacity = 1.0;
                currentBlur = 0; // Focus sharp
            } else {
                // Scroll 80% -> 100%: Drift into peaking positions framing the CTA (pure vw/vh)
                const t = (percent - 0.8) / 0.2; // 0 to 1
                let posXVal = config.endX + (config.peakX - config.endX) * t;
                let posYVal = config.endY + (config.peakY - config.endY) * t;
                posXVal += sway.x;
                posYVal += sway.y;
                
                posX = `calc(-50% + ${posXVal}vw)`;
                posY = `calc(-50% + ${posYVal}vh)`;
                currentScale = config.endScale + (config.peakScale - config.endScale) * t;
                currentTilt = config.endRot + (config.peakRot - config.endRot) * t;
                currentAngle = 90 + (config.spinY || 0); // Maintain final front-facing rotation

                // Fade to soft peaking opacity & apply blur for depth framing (0.50 target opacity)
                currentOpacity = 1.0 - (0.50 * t); // fades from 1.0 down to 0.50
                currentBlur = config.blur * t;     // blurs up to target blur
            }

            // Apply per-model bounding-box scale correction
            currentScale *= (config.scaleCorrection || 1.0);

            // Apply hover boost (+5% scale)
            const hoverMultiplier = modelEl._hoverBoost ? 1.05 : 1.0;
            currentScale *= hoverMultiplier;

            // Apply translate, responsive scale, organic Z-tilt, and hover glow
            modelEl.style.visibility = 'visible';
            modelEl.style.pointerEvents = 'auto';
            modelEl.style.opacity = currentOpacity;
            modelEl.style.transform = `translate(${posX}, ${posY}) scale(calc(${currentScale} * var(--hirono-scale-multiplier))) rotate(${currentTilt}deg)`;
            modelEl.setAttribute('camera-orbit', `${currentAngle}deg 75deg 105%`);
            
            if (currentBlur > 0.1) {
                modelEl.style.filter = `blur(${currentBlur}px)`;
            } else if (!modelEl._hoverBoost) {
                modelEl.style.filter = 'none';
            }
        });
    }

    // -------------------------------------------------------------------------
    // 5. SMOOTH SCROLL RENDERING ENGINE (LERP Loop)
    // -------------------------------------------------------------------------
    function smoothScrollLoop() {
        currentScrollY += (targetScrollY - currentScrollY) * lerpFactor;

        // Prevent micro-float calculations
        if (Math.abs(targetScrollY - currentScrollY) < 0.05) {
            currentScrollY = targetScrollY;
        }

        // Calculate scroll velocity (smooth scroll delta)
        const delta = targetScrollY - currentScrollY;
        // Normalize delta to [-1, 1] range based on a 300px threshold
        const normVelocity = Math.max(-1, Math.min(1, delta / 300));
        currentSkew = normVelocity * 5; // Skew angle in degrees (-5deg to 5deg)

        // Map scroll position to percentage [0.0 to 1.0]
        scrollPercent = Math.max(0, Math.min(1, currentScrollY / maxScroll));

        // Update view components if preloader is hidden
        if (body.style.overflow !== 'hidden') {
            // 5.1 Scroll-linked updates (Only run if scroll percentage has changed)
            if (scrollPercent !== lastScrollPercent) {
                updateScrollScene(scrollPercent);
                lastScrollPercent = scrollPercent;
            }
            // 5.2 Continuously animate idle floats
            updateIdleScene(performance.now() - startTime, scrollPercent);
        }

        requestAnimationFrame(smoothScrollLoop);
    }

    // Start rendering loops
    requestAnimationFrame(smoothScrollLoop);
});
