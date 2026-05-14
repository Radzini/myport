const backgrounds = ['background.png', 'background2.png'];

// === PAGE FLASH ===
(function initFlash() {
    const flash = document.getElementById('page-flash');
    if (!flash) return;
    setTimeout(() => {
        flash.classList.add('fade-out');
        setTimeout(() => flash.remove(), 600);
    }, 80);
})();

// === BACKGROUND ROTATION ===
(function initBackgrounds() {
    const bg1 = document.getElementById('bg1');
    const bg2 = document.getElementById('bg2');
    let idx1 = Math.floor(Math.random() * backgrounds.length);
    let idx2;
    do { idx2 = Math.floor(Math.random() * backgrounds.length); } while (idx2 === idx1);
    let active = 0;

    bg1.style.backgroundImage = `url(${backgrounds[idx1]})`;
    bg2.style.backgroundImage = `url(${backgrounds[idx2]})`;
    bg2.style.opacity = '0';

    setInterval(() => {
        const nextImg = Math.floor(Math.random() * backgrounds.length);
        const nextLayer = active === 0 ? 1 : 0;
        document.getElementById('bg' + (nextLayer + 1)).style.backgroundImage = `url(${backgrounds[nextImg]})`;
        document.getElementById('bg' + (active + 1)).style.opacity = '0';
        document.getElementById('bg' + (nextLayer + 1)).style.opacity = '1';
        active = nextLayer;
    }, 30000);
})();

// === PARTICLE SYSTEM ===
(function initParticles() {
    const canvas = document.getElementById('particles');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animId;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2.5 + 1;
            this.speedX = (Math.random() - 0.5) * 0.3;
            this.speedY = (Math.random() - 0.5) * 0.3;
            this.opacity = Math.random() * 0.4 + 0.1;
            const colors = ['168,85,247', '192,132,252', '236,72,153', '216,180,254'];
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.pulseSpeed = Math.random() * 0.02 + 0.005;
            this.pulsePhase = Math.random() * Math.PI * 2;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.pulsePhase += this.pulseSpeed;
            if (this.x < -10) this.x = canvas.width + 10;
            if (this.x > canvas.width + 10) this.x = -10;
            if (this.y < -10) this.y = canvas.height + 10;
            if (this.y > canvas.height + 10) this.y = -10;
        }
        draw() {
            const pulseOpacity = this.opacity * (0.6 + 0.4 * Math.sin(this.pulsePhase));
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color},${pulseOpacity})`;
            ctx.shadowBlur = this.size * 4;
            ctx.shadowColor = `rgba(${this.color},${pulseOpacity * 0.8})`;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    function init() {
        const count = Math.min(Math.floor((canvas.width * canvas.height) / 8000), 80);
        particles = [];
        for (let i = 0; i < count; i++) {
            particles.push(new Particle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        animId = requestAnimationFrame(animate);
    }

    init();
    animate();

    window.addEventListener('resize', () => {
        resize();
        init();
    });
})();

// === MUSIC PLAYER ===
(function initMusic() {
    const audio = new Audio('song.mp3');
    audio.loop = true;

    const icon = document.querySelector('.volume-icon');
    const cs = document.getElementById('custom-slider');
    const fill = document.getElementById('slider-fill');
    const thumb = document.getElementById('slider-thumb');
    let isDragging = false;
    let currentVolume = 45;
    let started = false;

    function setVolume(val) {
        const v = Math.max(0, Math.min(100, Number(val)));
        currentVolume = v;
        const pct = v + '%';
        audio.volume = v / 100;
        if (fill) fill.style.height = pct;
        if (thumb) thumb.style.bottom = pct;
        icon.textContent = v === 0 ? '🔇' : v < 50 ? '🔉' : '🔊';
    }

    function getPct(clientY) {
        const rect = cs.getBoundingClientRect();
        const y = clientY - rect.top;
        return Math.max(0, Math.min(100, (1 - y / rect.height) * 100));
    }

    function startPlayback() {
        if (started) return;
        started = true;
        icon.classList.remove('needs-play');
        audio.play().catch(() => {});
    }

    cs.addEventListener('mousedown', (e) => {
        isDragging = true;
        setVolume(getPct(e.clientY));
        startPlayback();
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) setVolume(getPct(e.clientY));
    });

    document.addEventListener('mouseup', () => { isDragging = false; });

    cs.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isDragging = true;
        setVolume(getPct(e.touches[0].clientY));
        startPlayback();
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (isDragging) setVolume(getPct(e.touches[0].clientY));
    });

    document.addEventListener('touchend', () => { isDragging = false; });

    setVolume(45);

    // Try autoplay — if blocked, show pulsing cue
    audio.play().then(() => {
        started = true;
    }).catch(() => {
        icon.classList.add('needs-play');
    });

    // Any click/touch will start playback
    document.addEventListener('click', startPlayback);
    document.addEventListener('touchstart', startPlayback, { passive: true });

    icon.addEventListener('click', (e) => {
        e.stopPropagation();
        if (audio.paused) {
            startPlayback();
            setVolume(currentVolume);
        } else {
            audio.pause();
            icon.textContent = '🔇';
        }
    });
})();

// === MARKDOWN PARSER ===
function parseMarkdown(text) {
    const lines = text.trim().split('\n');
    let html = '';
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('### ')) {
            html += `<h3>${parseInline(escHtml(trimmed.slice(4)))}</h3>`;
        } else if (trimmed.startsWith('## ')) {
            html += `<h2>${parseInline(escHtml(trimmed.slice(3)))}</h2>`;
        } else if (trimmed.startsWith('# ')) {
            html += `<h1>${parseInline(escHtml(trimmed.slice(2)))}</h1>`;
        } else if (trimmed === '') {
            html += '<br>';
        } else {
            html += `<p>${parseInline(escHtml(trimmed))}</p>`;
        }
    }
    return html;
}

function escHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function parseInline(str) {
    return str
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.+?)__/g, '<u>$1</u>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

// === SPA NAVIGATION ===
(function initNav() {
    const contentBox = document.getElementById('content-box');
    const navBtns = document.querySelectorAll('.nav-btn');

    function loadPage(page) {
        const template = document.getElementById('page-' + page);
        if (!template) return;
        const raw = template.innerHTML;
        contentBox.innerHTML = parseMarkdown(raw);

        navBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });
    }

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            window.location.hash = page;
            loadPage(page);
        });
    });

    function onHashChange() {
        const hash = window.location.hash.replace('#', '') || 'home';
        loadPage(hash);
    }

    window.addEventListener('hashchange', onHashChange);
    onHashChange();
})();

// === DISCORD COPY ===
(function initDiscord() {
    const btn = document.getElementById('discord-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
        navigator.clipboard.writeText('calyxnova').then(() => {
            let toast = document.getElementById('toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'toast';
                document.body.appendChild(toast);
            }
            toast.textContent = 'copied: calyxnova';
            toast.classList.add('show');
            clearTimeout(toast._hide);
            toast._hide = setTimeout(() => toast.classList.remove('show'), 1500);
        });
    });
})();
