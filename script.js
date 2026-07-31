/* ==========================================================
   KUSHAGRA SHRIVASTAVA — VIRAL 3D PORTFOLIO SCRIPT
   Three.js + Custom 3D Canvas + All Animations
   ========================================================== */

'use strict';

// Device/Performance detection helper
const isMobileDevice = () => window.innerWidth < 768 || ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

// ─────────────────────────────────────────────────────────────
// 1. PRELOADER
// ─────────────────────────────────────────────────────────────
const preloader = document.getElementById('preloader');
const preloaderFill = document.getElementById('preloaderFill');
const preloaderText = document.getElementById('preloaderText');

const loadingSteps = [
    'Booting up...',
    'Loading shaders...',
    'Spinning up 3D engine...',
    'Polishing pixels...',
    'Almost there...',
    'Welcome!'
];

let progress = 0;
const stepInterval = setInterval(() => {
    progress += Math.random() * 22 + 8;
    if (progress >= 100) {
        progress = 100;
        clearInterval(stepInterval);
        setTimeout(() => {
            preloader.classList.add('done');
            document.body.style.overflow = '';
            initHeroAnimations();
        }, 400);
    }
    preloaderFill.style.width = progress + '%';
    const stepIdx = Math.floor((progress / 100) * (loadingSteps.length - 1));
    preloaderText.textContent = loadingSteps[stepIdx];
}, 180);

document.body.style.overflow = 'hidden';

// ─────────────────────────────────────────────────────────────
// 2. THREE.JS BACKGROUND CANVAS
// ─────────────────────────────────────────────────────────────
(function initThreeBackground() {
    const canvas = document.getElementById('bgCanvas');
    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    // WebGL Context
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl || isMobileDevice()) {
        // Fallback: CSS gradient background
        canvas.style.display = 'none';
        return;
    }

    canvas.width = W();
    canvas.height = H();

    // Vertex shader
    const vsSource = `
        attribute vec2 a_position;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

    // Fragment shader — animated aurora mesh
    const fsSource = `
        precision highp float;
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec2 u_mouse;

        #define PI 3.14159265358979

        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i + vec2(0,0)), hash(i + vec2(1,0)), u.x),
                       mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
        }

        float fbm(vec2 p) {
            float val = 0.0;
            float amp = 0.5;
            float freq = 1.0;
            for (int i = 0; i < 6; i++) {
                val += amp * noise(p * freq);
                amp *= 0.5;
                freq *= 2.0;
            }
            return val;
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;
            vec2 mouse = u_mouse / u_resolution;
            
            float t = u_time * 0.25;
            
            // Warped UV
            vec2 warpedUV = uv + 0.15 * vec2(
                sin(uv.y * 3.0 + t),
                cos(uv.x * 2.5 + t * 0.8)
            );
            
            // FBM noise
            float n1 = fbm(warpedUV * 2.5 + t * 0.3);
            float n2 = fbm(warpedUV * 1.8 - t * 0.2 + vec2(3.4, 2.1));
            float n3 = fbm(warpedUV * 3.0 + n1 * 0.8 + t * 0.1);
            
            // Mouse influence
            float mouseDist = length(uv - mouse);
            float mouseInfluence = smoothstep(0.4, 0.0, mouseDist) * 0.4;
            
            // Colors — deep space palette
            vec3 col1 = vec3(0.04, 0.08, 0.22);   // deep indigo
            vec3 col2 = vec3(0.08, 0.03, 0.18);   // deep purple
            vec3 col3 = vec3(0.02, 0.06, 0.12);   // dark navy
            vec3 accent1 = vec3(0.2, 0.3, 1.0);   // blue glow
            vec3 accent2 = vec3(0.5, 0.2, 0.9);   // purple glow
            vec3 accent3 = vec3(0.0, 0.7, 0.8);   // cyan glow

            // Mix base colors
            vec3 base = mix(col1, col2, n1);
            base = mix(base, col3, n2 * 0.5);
            
            // Add aurora accents
            float aurora1 = smoothstep(0.4, 0.7, n3) * (0.12 + mouseInfluence);
            float aurora2 = smoothstep(0.5, 0.8, n1 * n2) * 0.1;
            float aurora3 = smoothstep(0.45, 0.75, fbm(warpedUV * 2.0 - t * 0.15)) * 0.06;
            
            base += accent1 * aurora1;
            base += accent2 * aurora2;
            base += accent3 * aurora3;
            
            // Vignette
            float vignette = 1.0 - smoothstep(0.4, 1.5, length(uv - 0.5) * 1.5);
            base *= vignette;
            
            // Subtle gradient overlay (top brighter)
            base += vec3(0.0, 0.01, 0.04) * (1.0 - uv.y);
            
            gl_FragColor = vec4(base, 1.0);
        }
    `;

    function createShader(type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.warn('Shader error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    function createProgram(vs, fs) {
        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.warn('Program error:', gl.getProgramInfoLog(program));
            return null;
        }
        return program;
    }

    const vertShader = createShader(gl.VERTEX_SHADER, vsSource);
    const fragShader = createShader(gl.FRAGMENT_SHADER, fsSource);

    if (!vertShader || !fragShader) {
        canvas.style.display = 'none';
        return;
    }

    const program = createProgram(vertShader, fragShader);

    // Full-screen quad
    const positions = new Float32Array([-1,-1, 1,-1, -1,1, 1,1]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'a_position');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uRes = gl.getUniformLocation(program, 'u_resolution');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');

    let mouseX = W() / 2, mouseY = H() / 2;
    let targetMouseX = mouseX, targetMouseY = mouseY;

    document.addEventListener('mousemove', e => {
        targetMouseX = e.clientX;
        targetMouseY = H() - e.clientY;
    });

    let startTime = performance.now();
    let animId;

    function render() {
        const now = (performance.now() - startTime) / 1000;

        // Smooth mouse
        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.useProgram(program);

        gl.enableVertexAttribArray(posLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        gl.uniform1f(uTime, now);
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform2f(uMouse, mouseX, mouseY);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        animId = requestAnimationFrame(render);
    }

    render();

    window.addEventListener('resize', () => {
        canvas.width = W();
        canvas.height = H();
    });
})();

// ─────────────────────────────────────────────────────────────
// 4. NAVBAR
// ─────────────────────────────────────────────────────────────
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
    });
});

// Optimized IntersectionObserver for active section highlight (removes scroll-thrashing offsetTop checks)
(function initActiveNavObserver() {
    const sections = document.querySelectorAll('section[id]');
    const navLinksList = document.querySelectorAll('.nav-link');

    const activeNavObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const current = entry.target.id;
                navLinksList.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === '#' + current);
                });
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '-25% 0px -40% 0px'
    });

    sections.forEach(s => activeNavObserver.observe(s));
})();

// ─────────────────────────────────────────────────────────────
// 5. TYPED TEXT EFFECT (Hero)
// ─────────────────────────────────────────────────────────────
const typedElement = document.getElementById('typedText');
const phrases = [
    'pixel-perfect frontends',
    'scalable backends',
    'AI-powered applications',
    'clean, maintainable code',
    'real-world solutions'
];

let phraseIndex = 0, charIndex = 0, isDeleting = false;

function typeEffect() {
    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
        typedElement.textContent = currentPhrase.slice(0, --charIndex);
    } else {
        typedElement.textContent = currentPhrase.slice(0, ++charIndex);
    }

    let delay = isDeleting ? 45 : 80;

    if (!isDeleting && charIndex === currentPhrase.length) {
        delay = 2000;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        delay = 400;
    }

    setTimeout(typeEffect, delay);
}

// ─────────────────────────────────────────────────────────────
// 6. COUNT UP ANIMATION
// ─────────────────────────────────────────────────────────────
function countUp(el) {
    const target = parseInt(el.dataset.target);
    let current = 0;
    const step = target / 40;
    const interval = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = Math.floor(current);
        if (current >= target) clearInterval(interval);
    }, 35);
}

// ─────────────────────────────────────────────────────────────
// 7. SCROLL REVEAL (IntersectionObserver)
// ─────────────────────────────────────────────────────────────
const revealEls = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
const countEls = document.querySelectorAll('.count-up');

const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObs.unobserve(entry.target);
        }
    });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

revealEls.forEach(el => revealObs.observe(el));

const countObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            countUp(entry.target);
            countObs.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

countEls.forEach(el => countObs.observe(el));

// ─────────────────────────────────────────────────────────────
// 8. MAGNETIC BUTTON EFFECT
// ─────────────────────────────────────────────────────────────
if (!isMobileDevice()) {
    document.querySelectorAll('.magnetic-btn').forEach(btn => {
        btn.addEventListener('mousemove', e => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
            btn.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            setTimeout(() => { btn.style.transition = ''; }, 400);
        });
    });
}

// ─────────────────────────────────────────────────────────────
// 9. 3D PROFILE CARD TILT
// ─────────────────────────────────────────────────────────────
const profileCard = document.getElementById('profileCard');
const profile3d = document.getElementById('profile3d');

if (profile3d && !isMobileDevice()) {
    profile3d.addEventListener('mousemove', e => {
        const rect = profile3d.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
        const y = (e.clientY - rect.top - rect.height / 2) / rect.height;

        const rotateY = x * 25;
        const rotateX = -y * 25;

        if (profileCard) {
            profileCard.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            profileCard.style.transition = 'transform 0.1s ease';
        }
    });

    profile3d.addEventListener('mouseleave', () => {
        if (profileCard) {
            profileCard.style.transform = 'perspective(800px) rotateX(0) rotateY(0)';
            profileCard.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        }
    });
}

// ─────────────────────────────────────────────────────────────
// 10. 3D PROJECT CARD TILT
// ─────────────────────────────────────────────────────────────
if (!isMobileDevice()) {
    document.querySelectorAll('.project-card-3d').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
            const y = (e.clientY - rect.top - rect.height / 2) / rect.height;

            card.style.setProperty('--tilt-x', (-y * 10) + 'deg');
            card.style.setProperty('--tilt-y', (x * 10) + 'deg');
            card.style.transform = `perspective(1200px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) translateY(-12px) scale(1.02)`;
            card.style.transition = 'transform 0.1s ease';

            // Dynamic shine
            const shine = card.querySelector('.project-visual-wrap');
            if (shine) {
                shine.style.background = `radial-gradient(circle at ${((x + 0.5) * 100)}% ${((y + 0.5) * 100)}%, rgba(255,255,255,0.08) 0%, transparent 60%)`;
            }
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
            const shine = card.querySelector('.project-visual-wrap');
            if (shine) shine.style.background = '';
        });
    });
}

// ─────────────────────────────────────────────────────────────
// 11. SKILL BOX TILT
// ─────────────────────────────────────────────────────────────
if (!isMobileDevice()) {
    document.querySelectorAll('.skill-box-3d').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
            const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
            card.style.transform = `perspective(800px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg) translateY(-10px)`;
            card.style.transition = 'transform 0.1s ease';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        });
    });
}

// ─────────────────────────────────────────────────────────────
// 12. CONTACT FORM
// ─────────────────────────────────────────────────────────────
const contactForm = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');

if (contactForm) {
    contactForm.addEventListener('submit', e => {
        e.preventDefault();

        const name = document.getElementById('formName').value;
        const email = document.getElementById('formEmail').value;
        const subject = document.getElementById('formSubject').value;
        const message = document.getElementById('formMessage').value;

        const body = `Name: ${name}%0AEmail: ${email}%0A%0A${message}`;
        window.location.href = `mailto:shrivastavakushagra22@gmail.com?subject=${encodeURIComponent(subject)}&body=${body}`;

        // Success animation
        submitBtn.querySelector('.submit-text').innerHTML = '<i class="fas fa-check"></i> Message Sent!';
        submitBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';

        setTimeout(() => {
            submitBtn.querySelector('.submit-text').innerHTML = '<i class="far fa-paper-plane"></i> Send Message';
            submitBtn.style.background = '';
            contactForm.reset();
        }, 3000);
    });
}

// ─────────────────────────────────────────────────────────────
// 13. SMOOTH SCROLL FOR NAV LINKS
// ─────────────────────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ─────────────────────────────────────────────────────────────
// 14. PARALLAX FLOAT TAGS ON MOUSE MOVE
// ─────────────────────────────────────────────────────────────
if (!isMobileDevice()) {
    const floatTags = document.querySelectorAll('.float-tag');
    document.addEventListener('mousemove', e => {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const dx = (e.clientX - cx) / cx;
        const dy = (e.clientY - cy) / cy;

        floatTags.forEach((tag, i) => {
            const depth = (i + 1) * 8;
            tag.style.transform = `translate(${dx * depth}px, ${dy * depth}px)`;
        });
    });
}

// ─────────────────────────────────────────────────────────────
// 15. ACHIEVEMENT CARDS TILT
// ─────────────────────────────────────────────────────────────
if (!isMobileDevice()) {
    document.querySelectorAll('.ach-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
            const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
            card.style.transform = `perspective(600px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) translateY(-8px)`;
            card.style.transition = 'transform 0.1s ease';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        });
    });
}

// ─────────────────────────────────────────────────────────────
// 16. INIT HERO ANIMATIONS (called after preloader)
// ─────────────────────────────────────────────────────────────
function initHeroAnimations() {
    // Start typed text
    setTimeout(typeEffect, 500);

    // Reveal hero elements sequentially
    const heroEls = document.querySelectorAll('.hero .reveal-up, .hero .reveal-left, .hero .reveal-right');
    heroEls.forEach((el, i) => {
        setTimeout(() => el.classList.add('revealed'), i * 120 + 100);
    });
}

// ─────────────────────────────────────────────────────────────
// 17. PARTICLES (floating dots layered on top of canvas)
// ─────────────────────────────────────────────────────────────
(function initParticleDots() {
    if (isMobileDevice()) return;
    const container = document.createElement('div');
    container.style.cssText = `
        position: fixed; inset: 0; pointer-events: none; z-index: 1; overflow: hidden;
    `;
    document.body.appendChild(container);

    const DOTS = 40;
    const dots = [];

    for (let i = 0; i < DOTS; i++) {
        const dot = document.createElement('div');
        const size = Math.random() * 3 + 1;
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const opacity = Math.random() * 0.4 + 0.1;
        const hue = Math.random() > 0.5 ? '220' : '270';

        dot.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: hsl(${hue}, 80%, 70%);
            border-radius: 50%;
            left: ${x}%;
            top: ${y}%;
            opacity: ${opacity};
        `;
        container.appendChild(dot);

        dots.push({
            el: dot,
            x,
            y,
            vx: (Math.random() - 0.5) * 0.02,
            vy: (Math.random() - 0.5) * 0.015,
            opacity
        });
    }

    function animateDots() {
        dots.forEach(d => {
            d.x += d.vx;
            d.y += d.vy;
            if (d.x < 0 || d.x > 100) d.vx *= -1;
            if (d.y < 0 || d.y > 100) d.vy *= -1;
            d.el.style.left = d.x + '%';
            d.el.style.top = d.y + '%';
        });
        requestAnimationFrame(animateDots);
    }

    animateDots();
})();

// ─────────────────────────────────────────────────────────────
// 18. GLITCH EFFECT ON NAME HOVER
// ─────────────────────────────────────────────────────────────
const heroName = document.getElementById('heroName');
if (heroName) {
    heroName.addEventListener('mouseenter', () => {
        heroName.style.animation = 'none';
        heroName.style.filter = 'blur(1px)';
        setTimeout(() => {
            heroName.style.filter = '';
            heroName.style.animation = '';
        }, 200);
    });
}

// ─────────────────────────────────────────────────────────────
// 19. PAGE VISIBILITY - PAUSE HEAVY ANIMATIONS
// ─────────────────────────────────────────────────────────────
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        document.title = '(Paused) Kushagra Shrivastava';
    } else {
        document.title = 'Kushagra Shrivastava | Full Stack Developer';
    }
});

// ─────────────────────────────────────────────────────────────
// 20. UNIFIED THROTTLED SCROLL EVENTS (Navbar scroll state & Progress bar)
// ─────────────────────────────────────────────────────────────
(function initScrollEffects() {
    const bar = document.createElement('div');
    bar.style.cssText = `
        position: fixed; top: 0; left: 0; height: 2px; width: 0%;
        background: linear-gradient(90deg, #3b82f6, #8b5cf6, #22c55e);
        z-index: 10001; transition: width 0.1s linear;
        box-shadow: 0 0 8px rgba(139, 92, 246, 0.8);
    `;
    document.body.appendChild(bar);

    let scrollTicking = false;

    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            window.requestAnimationFrame(() => {
                const scrollTop = window.scrollY;
                
                // Toggle navbar scrolled class
                if (navbar) {
                    navbar.classList.toggle('scrolled', scrollTop > 60);
                }

                // Update progress bar
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                if (docHeight > 0) {
                    const pct = (scrollTop / docHeight) * 100;
                    bar.style.width = pct + '%';
                }
                
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    }, { passive: true });
})();

// ─────────────────────────────────────────────────────────────
// Console easter egg
// ─────────────────────────────────────────────────────────────
console.log('%c👋 Hey Developer!', 'font-size:2rem; font-weight:bold; color:#8b5cf6;');
console.log('%cYou found the console! I\'m Kushagra — let\'s connect!', 'font-size:1rem; color:#3b82f6;');
console.log('%c📧 shrivastavakushagra22@gmail.com', 'font-size:0.9rem; color:#22c55e;');


