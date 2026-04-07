/**
 * ═══════════════════════════════════════════════
 * BLACKBOX — Main JavaScript
 * Loader · Cursor · Nav · Reveal · Counter ·
 * Waitlist · Modal · Social Links
 * ═══════════════════════════════════════════════
 */

/* ─── CONSTANTS ─── */
const JOINED_KEY   = 'blackbox_joined';
const COUNTER_DEFAULT = 127; // fallback / first-time init value

/* ─── FIREBASE CONFIG ─── */
const firebaseConfig = {
  apiKey:            "AIzaSyDxoGHnw2P4KYXiIbcG1c_WPkq4s41IcG0",
  authDomain:        "blackbox-55faa.firebaseapp.com",
  projectId:         "blackbox-55faa",
  storageBucket:     "blackbox-55faa.firebasestorage.app",
  messagingSenderId: "340795394064",
  appId:             "1:340795394064:web:91c4f8ad0b5b5ce6d5a295"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  console.log('[BlackBox] Firebase initialized ✅');
}
const db         = firebase.firestore();
const counterRef = db.collection('counter').doc('main');
console.log('[BlackBox] Firestore connected ✅');

/* ─── LOADER ─── */
const loader   = document.getElementById('loader');
let loaderDone = false;

function hideLoader() {
  if (loaderDone) return;
  loaderDone = true;
  loader.classList.add('done');
  document.body.classList.remove('loading');
  setTimeout(runReveal, 80);
}

document.body.classList.add('loading');
window.addEventListener('load', () => setTimeout(hideLoader, 1600));
setTimeout(hideLoader, 2400); // fallback

/* ─── CUSTOM CURSOR ─── */
const cursor      = document.getElementById('cursor');
const cursorTrail = document.getElementById('cursor-trail');
const isTouchDevice = window.matchMedia('(hover: none)').matches;

let mouseX = 0, mouseY = 0, trailX = 0, trailY = 0;

if (!isTouchDevice) {
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top  = mouseY + 'px';
  });

  (function animateTrail() {
    trailX += (mouseX - trailX) * 0.1;
    trailY += (mouseY - trailY) * 0.1;
    cursorTrail.style.left = trailX + 'px';
    cursorTrail.style.top  = trailY + 'px';
    requestAnimationFrame(animateTrail);
  })();

  document.querySelectorAll('a, button, .about-card, .gallery-placeholder').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });

  document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; cursorTrail.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; cursorTrail.style.opacity = '0.5'; });
} else {
  cursor.style.display      = 'none';
  cursorTrail.style.display = 'none';
  document.body.style.cursor = 'auto';
}

/* ─── NAVBAR SCROLL ─── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

/* ─── MOBILE HAMBURGER ─── */
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

hamburger.addEventListener('click', () => {
  const isOpen = hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', String(isOpen));
  mobileMenu.setAttribute('aria-hidden', String(!isOpen));
});

mobileMenu.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
  });
});

/* ─── SCROLL REVEAL ─── */
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
);

function runReveal() {
  revealEls.forEach(el => revealObserver.observe(el));
}

/* ─── SMOOTH SCROLL ─── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = navbar.offsetHeight + 16;
      const top    = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

/* ─── LIVE COUNTER (Firestore) ─── */
const counterEl = document.getElementById('counter-value');

// Smoothly animate the counter display (UI only — no storage)
function animateCountTo(target, duration = 800) {
  const start     = parseInt(counterEl.textContent.replace(/,/g, ''), 10) || 0;
  const startTime = performance.now();
  const range     = target - start;

  function step(now) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    counterEl.textContent = Math.round(start + range * eased).toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// Load counter from Firestore on page load
counterRef.get().then((doc) => {
  if (doc.exists) {
    const val = doc.data().count;
    console.log('[BlackBox] Counter loaded: ' + val + ' ✅');
    animateCountTo(val, 1200);
  } else {
    // First time setup — create document with default
    console.log('[BlackBox] No counter doc found — initializing with ' + COUNTER_DEFAULT);
    counterRef.set({ count: COUNTER_DEFAULT }).then(() => {
      animateCountTo(COUNTER_DEFAULT, 1200);
    }).catch((err) => {
      console.error('[BlackBox] Failed to initialize counter:', err);
    });
  }
}).catch((err) => {
  // Firestore unreachable — keep whatever is currently displayed, never reset
  console.error('[BlackBox] Firestore load error:', err);
});

// Increment Firestore counter atomically, then update UI
function incrementCounter() {
  counterRef.update({
    count: firebase.firestore.FieldValue.increment(1)
  }).then(() => {
    return counterRef.get();
  }).then((doc) => {
    if (doc.exists) {
      const val = doc.data().count;
      console.log('[BlackBox] Counter updated: ' + val + ' ✅');
      animateCountTo(val, 500);
    }
  }).catch((err) => {
    // Silently fail — UI stays at last known value, never resets to 0
    console.error('[BlackBox] Counter increment error:', err);
  });
}

/* ─── WAITLIST LOGIC ─── */
const heroJoinBtn     = document.getElementById('hero-join-btn');
const navJoinBtn      = document.getElementById('nav-join-btn');
const waitlistMainBtn = document.getElementById('waitlist-main-btn');
const waitlistConfirm = document.getElementById('waitlist-confirm');
const wlConfirm       = document.getElementById('wl-confirm');

function handleWaitlistJoin(btn) {
  // Prevent double-join
  if (localStorage.getItem(JOINED_KEY)) {
    showAlreadyJoined(btn);
    return;
  }

  // Animate button
  const origText = btn.querySelector('span') ? btn.querySelector('span').textContent : btn.textContent;
  btn.disabled   = true;
  if (btn.querySelector('span')) btn.querySelector('span').textContent = 'Adding you…';

  setTimeout(() => {
    // Mark joined + update counter
    localStorage.setItem(JOINED_KEY, '1');
    incrementCounter();

    // Restore button
    if (btn.querySelector('span')) btn.querySelector('span').textContent = '✓ You\'re in!';
    btn.style.opacity = '0.7';

    // Show confirmations
    if (waitlistConfirm) waitlistConfirm.hidden = false;
    if (wlConfirm)       wlConfirm.hidden = false;

    // Smooth scroll to waitlist section to reveal confirm message
    const wlSection = document.getElementById('waitlist');
    if (wlSection && btn !== waitlistMainBtn) {
      const offset = navbar.offsetHeight + 16;
      const top = wlSection.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, 900);
}

function showAlreadyJoined(btn) {
  if (btn.querySelector('span')) btn.querySelector('span').textContent = '✓ Already joined!';
  btn.disabled    = true;
  btn.style.opacity = '0.6';
  if (waitlistConfirm) waitlistConfirm.hidden = false;
  if (wlConfirm)       wlConfirm.hidden = false;
}

// Check if already joined on load
if (localStorage.getItem(JOINED_KEY)) {
  [heroJoinBtn, navJoinBtn, waitlistMainBtn].forEach(btn => {
    if (!btn) return;
    if (btn.tagName === 'A') {
      btn.textContent = '✓ Already joined';
    } else {
      if (btn.querySelector('span')) btn.querySelector('span').textContent = '✓ Already joined';
      btn.disabled    = true;
      btn.style.opacity = '0.6';
    }
  });
  if (waitlistConfirm) waitlistConfirm.hidden = false;
  if (wlConfirm)       wlConfirm.hidden = false;
}

if (heroJoinBtn) {
  heroJoinBtn.addEventListener('click', () => handleWaitlistJoin(heroJoinBtn));
}

if (waitlistMainBtn) {
  waitlistMainBtn.addEventListener('click', () => handleWaitlistJoin(waitlistMainBtn));
}

// nav CTA — scroll to waitlist section and trigger join
if (navJoinBtn) {
  navJoinBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (localStorage.getItem(JOINED_KEY)) {
      const wlSection = document.getElementById('waitlist');
      if (wlSection) {
        const offset = navbar.offsetHeight + 16;
        const top = wlSection.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
      return;
    }
    handleWaitlistJoin(waitlistMainBtn || heroJoinBtn);
    const wlSection = document.getElementById('waitlist');
    if (wlSection) {
      const offset = navbar.offsetHeight + 16;
      const top = wlSection.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
}

/* ─── WAY TO BLACKBOX MODAL ─── */
const wayBtn      = document.getElementById('way-btn');
const modalOverlay = document.getElementById('modal-overlay');
const modalClose  = document.getElementById('modal-close');

function openModal() {
  modalOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
  modalClose.focus();
}

function closeModal() {
  modalOverlay.hidden = true;
  document.body.style.overflow = '';
  if (wayBtn) wayBtn.focus();
}

if (wayBtn) {
  wayBtn.addEventListener('click', openModal);
}

if (modalClose) {
  modalClose.addEventListener('click', closeModal);
}

if (modalOverlay) {
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
}

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modalOverlay.hidden) closeModal();
});

/* ─── PARALLAX ON GLOW ORBS (subtle) ─── */
let rafPending = false;
window.addEventListener('scroll', () => {
  if (!rafPending) {
    requestAnimationFrame(() => {
      const sy   = window.scrollY;
      const orb1 = document.querySelector('.orb-1');
      const orb2 = document.querySelector('.orb-2');
      if (orb1) orb1.style.transform = `translateY(${sy * 0.12}px)`;
      if (orb2) orb2.style.transform = `translateY(${-sy * 0.08}px)`;
      rafPending = false;
    });
    rafPending = true;
  }
}, { passive: true });

/* ─── ACTIVE NAV LINK HIGHLIGHT ─── */
const sections    = document.querySelectorAll('section[id]');
const navLinksAll = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinksAll.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  },
  { threshold: 0.4 }
);

sections.forEach(s => sectionObserver.observe(s));

/* ─── CONSOLE CREDIT ─── */
console.log(
  '%cBlackBox 🖤\n%cA safe, anonymous space to speak freely.',
  'font-size: 1.4rem; font-weight: bold; color: #fff;',
  'font-size: 0.9rem; color: #888;'
);
