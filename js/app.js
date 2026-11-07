/**
 * Our Nikah Memories - Main Application Engine
 * Pure Vanilla JavaScript (ES6+)
 * Handles golden particles, audio synthesis, toasts, navigation, and modal logic
 */

// Sound Synthesizer via Web Audio API (No external sound files required)
class AudioFX {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Golden Chime Sound (harmonious dual sine wave)
  playChime() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Golden chord)
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 1.25);
      });
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Camera Shutter Click Sound
  playShutter() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.06);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Silent catch
    }
  }
}

export const soundFX = new AudioFX();

// Toast Notifications
export function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconSvg = type === 'error'
    ? `<svg width="20" height="20" fill="none" stroke="#EF4444" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="12" stroke-width="2"/><line x1="12" y1="16" x2="12.01" y2="16" stroke-width="2"/></svg>`
    : type === 'success'
    ? `<svg width="20" height="20" fill="none" stroke="#10B981" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><path d="M8 12l2.5 2.5L16 9" stroke-width="2"/></svg>`
    : `<svg width="20" height="20" fill="none" stroke="#D4AF37" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><line x1="12" y1="16" x2="12" y2="12" stroke-width="2"/><line x1="12" y1="8" x2="12.01" y2="8" stroke-width="2"/></svg>`;

  toast.innerHTML = `
    <span>${iconSvg}</span>
    <div style="flex-grow: 1;">${message}</div>
    <button style="background:none; border:none; color:var(--color-text-muted); cursor:pointer; font-size:1.1rem;" onclick="this.parentElement.remove()">×</button>
  `;

  container.appendChild(toast);

  if (type === 'success') {
    soundFX.playChime();
  }

  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(15px)';
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}

// Modal Management
export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Canvas Floating Golden Dust Particles
export function initGoldParticles(canvasId = 'goldParticlesCanvas') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = (canvas.width = canvas.offsetWidth || window.innerWidth);
  let height = (canvas.height = canvas.offsetHeight || window.innerHeight);

  window.addEventListener('resize', () => {
    if (!canvas) return;
    width = canvas.width = canvas.offsetWidth || window.innerWidth;
    height = canvas.height = canvas.offsetHeight || window.innerHeight;
  });

  const particles = [];
  const particleCount = Math.min(45, Math.floor(width / 25));

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.2 + 0.6,
      speedY: -(Math.random() * 0.4 + 0.15),
      speedX: (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.6 + 0.2,
      alphaChange: (Math.random() - 0.5) * 0.015,
      color: Math.random() > 0.3 ? '#D4AF37' : '#F5D77F',
    });
  }

  function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    particles.forEach((p) => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.alpha += p.alphaChange;

      if (p.alpha <= 0.15 || p.alpha >= 0.85) {
        p.alphaChange = -p.alphaChange;
      }

      if (p.y < -10) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;

      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.shadowBlur = p.radius * 3;
      ctx.shadowColor = '#D4AF37';
      ctx.fill();
      ctx.restore();
    });

    requestAnimationFrame(render);
  }

  render();
}

// Global DOM Initialization
document.addEventListener('DOMContentLoaded', () => {
  // 1. Header scroll effect
  const header = document.querySelector('.top-header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 30) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // 2. Mobile drawer toggling
  const navToggle = document.getElementById('mobileNavToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const drawerBackdrop = document.getElementById('mobileDrawerBackdrop');
  const closeDrawerBtn = document.getElementById('closeMobileDrawer');

  if (navToggle && mobileDrawer && drawerBackdrop) {
    navToggle.addEventListener('click', () => {
      mobileDrawer.classList.add('open');
      drawerBackdrop.classList.add('active');
    });

    const closeDrawer = () => {
      mobileDrawer.classList.remove('open');
      drawerBackdrop.classList.remove('active');
    };

    if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
    drawerBackdrop.addEventListener('click', closeDrawer);
  }

  // 3. Scroll Reveal Observer
  const revealElements = document.querySelectorAll('.reveal-fade-up');
  if (revealElements.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    revealElements.forEach((el) => observer.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add('is-revealed'));
  }

  // 4. Initialize particles on canvas if present
  initGoldParticles('goldParticlesCanvas');
});

// Select folder and begin verification flow
export function selectFolder(folderId) {
  sessionStorage.setItem('selectedFolderId', folderId);
  window.location.href = `/pages/verify.html?folder=${folderId}`;
}

window.selectFolder = selectFolder;
window.showToast = showToast;
window.openModal = openModal;
window.closeModal = closeModal;
