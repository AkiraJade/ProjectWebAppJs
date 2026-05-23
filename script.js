/**
 * Little Mono Hirono 3D Landing Page Engine
 * Uses Vanilla JS, lerp interpolation, and Google <model-viewer> library
 */

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------------------
    // 1. SETUP STATE VARIABLES & DOM CACHE
    // -------------------------------------------------------------------------
    let targetScrollY = 0;
    let currentScrollY = 0;
    const lerpFactor = 0.08; // Momentum smoothing factor (lower = smoother)
    let maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    let scrollPercent = 0;
    let isAnimating = false;

    const body = document.body;
    const header = document.getElementById('main-header');
    const progressBar = document.getElementById('progressBar');
    const studioBg = document.getElementById('studioBg');
    const studioShadows = document.getElementById('studioShadows');
    const spotlight = document.getElementById('spotlight');
    const heroPrince = document.getElementById('hero-prince');

    const phases = [
        document.getElementById('phase1'),
        document.getElementById('phase2'),
        document.getElementById('phase3'),
        document.getElementById('phase4')
    ];

    // Dispersion configuration for the 9 background models (V-Cluster -> edge peaking in %)
    const dispersionConfig = [
        // hirono-1: Top-Left peaking (Layer 3)
        { id: 'hirono-1', startX: -80, startY: -45, startScale: 0.85, endX: -140, endY: -110, endScale: 0.65, blur: 4, finalOpacity: 0.50, tilt: -12 },
        // hirono-2: Top-Right peaking (Layer 3)
        { id: 'hirono-2', startX: -20, startY: -45, startScale: 0.85, endX: 40, endY: -115, endScale: 0.70, blur: 3, finalOpacity: 0.45, tilt: 8 },
        // hirono-3: Mid-Left peaking (Layer 2)
        { id: 'hirono-3', startX: -105, startY: -60, startScale: 0.90, endX: -155, endY: -50, endScale: 0.85, blur: 4, finalOpacity: 0.60, tilt: -8 },
        // hirono-4: Mid-Right peaking (Layer 2)
        { id: 'hirono-4', startX: -50, startY: -75, startScale: 0.90, endX: 55, endY: -50, endScale: 0.80, blur: 4, finalOpacity: 0.60, tilt: 15 },
        // hirono-5: Bottom-Left peaking (Layer 2)
        { id: 'hirono-5', startX: 5, startY: -60, startScale: 0.90, endX: -130, endY: 15, endScale: 0.60, blur: 3, finalOpacity: 0.60, tilt: -10 },
        // hirono-6: Bottom-Right peaking (Layer 1)
        { id: 'hirono-6', startX: -145, startY: -50, startScale: 1.25, endX: 30, endY: 10, endScale: 0.65, blur: 5, finalOpacity: 0.45, tilt: -15 },
        // hirono-7: Top-Center peaking (Layer 1)
        { id: 'hirono-7', startX: -115, startY: -30, startScale: 1.25, endX: -50, endY: -130, endScale: 0.68, blur: 3, finalOpacity: 0.50, tilt: 10 },
        // hirono-8: Bottom-Center peaking (Layer 1)
        { id: 'hirono-8', startX: 45, startY: -50, startScale: 1.25, endX: -50, endY: 45, endScale: 0.70, blur: 3, finalOpacity: 0.50, tilt: -5 },
        // hirono-9: Bottom-Left Outer peaking (Layer 1)
        { id: 'hirono-9', startX: 15, startY: -30, startScale: 1.25, endX: -110, endY: 40, endScale: 0.75, blur: 4, finalOpacity: 0.50, tilt: 12 }
    ];

    // Cache background model DOM elements to avoid repeated querying
    dispersionConfig.forEach(config => {
        config.element = document.getElementById(config.id);
    });

    // -------------------------------------------------------------------------
    // 2. PRELOADER & STAGGERED INJECTION SYSTEM
    // -------------------------------------------------------------------------
    const preloader = document.getElementById('preloader');

    function startStaggeredLoad() {
        const backgroundModels = [
            { id: 'hirono-1', src: 'assets/model1.glb' },
            { id: 'hirono-2', src: 'assets/model2.glb' },
            { id: 'hirono-3', src: 'assets/model3.glb' },
            { id: 'hirono-4', src: 'assets/model4.glb' },
            { id: 'hirono-5', src: 'assets/model5.glb' },
            { id: 'hirono-6', src: 'assets/model6.glb' },
            { id: 'hirono-7', src: 'assets/model7.glb' },
            { id: 'hirono-8', src: 'assets/model8.glb' },
            { id: 'hirono-9', src: 'assets/model9.glb' }
        ];

        backgroundModels.forEach((model, index) => {
            setTimeout(() => {
                const el = document.getElementById(model.id);
                if (el) {
                    el.setAttribute('src', model.src);
                }
            }, index * 200); // 200ms spacing between background models
        });
    }

    let preloaderDismissed = false;
    const dismissPreloader = () => {
        if (preloaderDismissed) return;
        preloaderDismissed = true;
        if (preloader) {
            preloader.classList.add('fade-out');
        }
        startStaggeredLoad();
        startAnimationLoop(); // Run animation to display loaded models smoothly
    };

    // Safety timeout in case load event does not fire (4 seconds maximum)
    const safetyTimeout = setTimeout(dismissPreloader, 4000);

    if (heroPrince) {
        heroPrince.addEventListener('load', () => {
            clearTimeout(safetyTimeout);
            dismissPreloader();
        });

        // Safety fallback: if model is already loaded in cache
        if (heroPrince.loaded) {
            clearTimeout(safetyTimeout);
            dismissPreloader();
        }
    }

    // Trigger initial layout immediately
    window.scrollTo(0, 0);
    setTimeout(() => {
        updateScene(0);
    }, 100);

    // -------------------------------------------------------------------------
    // 3. EVENT LISTENERS
    // -------------------------------------------------------------------------
    window.addEventListener('scroll', () => {
        targetScrollY = window.scrollY;
        startAnimationLoop();
    });

    window.addEventListener('resize', () => {
        maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        startAnimationLoop();
    });

    // Helper: Opacity calculate based on scroll window bounds
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

    // -------------------------------------------------------------------------
    // 4. ANIMATION UPDATE LOOP (Drives zero-gravity dispersal)
    // -------------------------------------------------------------------------
    function updateScene(percent) {
        // --- 4.1 Update Header Glassmorphic Transition ---
        if (currentScrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // --- 4.2 Scroll Progress Bar ---
        progressBar.style.width = `${percent * 100}%`;

        // --- 4.3 Ambient Background Vignette & Spotlight ---
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
        studioShadows.style.opacity = shadowOpacity;
        spotlight.style.opacity = ambientSpotlight;

        // Background Grid Parallax
        studioBg.style.transform = `scale(${1 + percent * 0.05})`;
        const gridElement = document.querySelector('.studio-grid');
        if (gridElement) {
            gridElement.style.transform = `translate3d(0, ${percent * 40}px, 0) rotate(${percent * 1.5}deg)`;
        }

        // --- 4.4 Hero Model (PrinceCenter) Animating ---
        let heroScale = 1.0;
        let heroAngle = 90; // Start at 90deg offset so model faces forward
        let heroY = -15;    // Start sitting lower at -15%
        
        if (percent <= 0.8) {
            const t = percent / 0.8;
            heroScale = 1.0 + 0.65 * t; // Scale up to 1.65
            heroAngle = 90 + t * 360;  // Full 360-degree Y rotation (90deg to 450deg)
            heroY = -15 - 35 * t;      // Interpolate Y from -15% to -50%
        } else {
            const fadeProgress = (percent - 0.8) / 0.2;
            heroScale = 1.65 - 0.65 * fadeProgress; // Scale back down to 1.0
            heroAngle = 450;                        // Locked facing forward (450deg is identical to 90deg)
            heroY = -50 + 35 * fadeProgress;        // Return Y from -50% to -15%
        }

        if (heroPrince) {
            heroPrince.style.opacity = 1;
            heroPrince.style.transform = `translate3d(-50%, ${heroY}%, 0px) scale(calc(${heroScale} * var(--hirono-scale-multiplier)))`;
            heroPrince.setAttribute('camera-orbit', `${heroAngle}deg 75deg 105%`);
        }

        // --- 4.5 9 Floating Models Dispersion ---
        dispersionConfig.forEach(config => {
            const modelEl = config.element || document.getElementById(config.id);
            if (!modelEl) return;

            let t = 0;
            let currentOpacity = 1.0;
            let currentBlur = 0;
            let currentTilt = 0;

            if (percent <= 0.8) {
                t = percent / 0.8;
                currentOpacity = 1.0 + (config.finalOpacity - 1.0) * t;
                currentBlur = config.blur * t;
                currentTilt = config.tilt * t;
            } else {
                t = 1.0;
                currentOpacity = config.finalOpacity;
                currentBlur = config.blur;
                currentTilt = config.tilt;
            }

            const currentX = config.startX + (config.endX - config.startX) * t;
            const currentY = config.startY + (config.endY - config.startY) * t;
            const currentScale = config.startScale + (config.endScale - config.startScale) * t;

            // Apply 2D tilt roll, offset coordinates, and scale
            modelEl.style.transform = `translate3d(${currentX}%, ${currentY}%, 0px) scale(calc(${currentScale} * var(--hirono-scale-multiplier))) rotate(${currentTilt}deg)`;
            modelEl.style.opacity = currentOpacity;
            modelEl.style.visibility = 'visible'; // Keep visible to frame the CTA screen
            
            if (currentBlur > 0.1) {
                modelEl.style.filter = `blur(${currentBlur}px)`;
            } else {
                modelEl.style.filter = 'none';
            }
        });

        // --- 4.6 Story Text Reveals ---
        // Phase 1 (0% to 20%)
        const op1 = calculateOpacity(percent, 0.0, 0.05, 0.15, 0.2);
        const y1 = (1 - op1) * 30;
        phases[0].style.opacity = op1;
        phases[0].style.transform = `translate3d(0, ${y1}px, 0)`;

        // Phase 2 (20% to 50%)
        const op2 = calculateOpacity(percent, 0.2, 0.25, 0.45, 0.5);
        const y2 = (1 - op2) * 30;
        phases[1].style.opacity = op2;
        phases[1].style.transform = `translate3d(0, ${y2}px, 0)`;

        // Phase 3 (50% to 80%)
        const op3 = calculateOpacity(percent, 0.5, 0.55, 0.75, 0.8);
        const y3 = (1 - op3) * 30;
        phases[2].style.opacity = op3;
        phases[2].style.transform = `translate3d(0, ${y3}px, 0)`;

        // Phase 4 (80% to 100%)
        const op4 = calculateOpacity(percent, 0.8, 0.86, 1.1, 1.1);
        let y4 = (1 - op4) * 45;
        if (percent > 0.85) {
            const shiftP = (percent - 0.85) / 0.15;
            y4 -= shiftP * 65; // Lift CTA upwards as footer enters from the bottom
        }
        phases[3].style.opacity = op4;
        phases[3].style.transform = `translate3d(0, ${y4}px, 0)`;
    }

    // -------------------------------------------------------------------------
    // 5. SMOOTH SCROLL RENDERING ENGINE (Lerp)
    // -------------------------------------------------------------------------
    function startAnimationLoop() {
        if (isAnimating) return;
        isAnimating = true;
        requestAnimationFrame(smoothScrollLoop);
    }

    function smoothScrollLoop() {
        if (!isAnimating) return;

        currentScrollY += (targetScrollY - currentScrollY) * lerpFactor;

        // Prevent micro-float calculations and pause loop when settled
        if (Math.abs(targetScrollY - currentScrollY) < 0.01) {
            currentScrollY = targetScrollY;
            isAnimating = false;
        }

        // Map scroll position to percentage [0.0 to 1.0]
        scrollPercent = Math.max(0, Math.min(1, currentScrollY / maxScroll));

        // Update view components directly
        updateScene(scrollPercent);

        if (isAnimating) {
            requestAnimationFrame(smoothScrollLoop);
        }
    }

    // Start rendering loops
    startAnimationLoop();
});
