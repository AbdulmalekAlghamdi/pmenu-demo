gsap.registerPlugin(ScrollTrigger);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* progress bar */
gsap.to('.tb-progress i', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });

/* count-ups */
function countUp(el) {
  if (el.dataset.done) return;
  el.dataset.done = 1;
  const target = Number(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  const o = { v: 0 };
  gsap.to(o, {
    v: target, duration: 1.8, ease: 'power3.out',
    onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('en-US') + suffix; },
  });
}
$$('[data-count]').forEach((el) => ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => countUp(el) }));

/* intro */
gsap.from('.wordmark span', { yPercent: 110, opacity: 0, stagger: .07, duration: 1.2, ease: 'expo.out', delay: .15 });
gsap.from(['.eyebrow', '.intro-sub'], { y: 24, opacity: 0, duration: 1, stagger: .15, delay: .5, ease: 'power3.out' });
gsap.from('.intro-dot', { scale: 0, duration: 1.4, delay: .4, ease: 'elastic.out(1, .6)' });
gsap.from('.intro-ring', { scale: .6, opacity: 0, duration: 1.6, ease: 'power3.out' });

gsap.timeline({ scrollTrigger: { trigger: '.intro', start: 'top top', end: '+=110%', scrub: 1, pin: true } })
  .to('.intro-copy', { scale: .82, opacity: 0, ease: 'power2.in' }, 0)
  .to('.intro-ring', { scale: 1.6, opacity: 0 }, 0)
  .to('.scroll-hint', { opacity: 0, duration: .2 }, 0)
  .to('.intro-dot', { scale: 26, ease: 'power2.in' }, 0);

/* problem */
gsap.set('.problem-words h2', { opacity: .12 });
gsap.timeline({ scrollTrigger: { trigger: '.problem', start: 'top 55%', end: 'bottom 70%', scrub: 1 } })
  .to('.problem-words h2', { opacity: 1, stagger: .5 })
  .to('.paper', { rotate: -18, y: 60, filter: 'grayscale(1)', opacity: .35 }, 0);

/* reveal helper for copy blocks */
$$('.sec-copy, .themes-head').forEach((el) => {
  gsap.from(el.children, { y: 40, opacity: 0, stagger: .1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 80%' } });
});

const mm = gsap.matchMedia();

/* DNA: logo -> colors -> phone */
mm.add({ desk: '(min-width: 761px)', mob: '(max-width: 760px)' }, (ctx) => {
  const desk = ctx.conditions.desk;
  const R = desk ? 200 : 140;
  const sw = $$('.dna-sw');
  gsap.set(sw, { scale: 0 });
  gsap.set('.dna-phone', { scale: .85, opacity: 0 });
  const tl = gsap.timeline({
    scrollTrigger: desk
      ? { trigger: '.dna', start: 'top top', end: '+=170%', scrub: 1, pin: true }
      : { trigger: '.dna-stage', start: 'top 75%', end: 'bottom 30%', scrub: 1 },
  });
  tl.to(sw, {
    scale: 1, stagger: .06,
    x: (i) => Math.cos((i / sw.length) * Math.PI * 2 - Math.PI / 2) * R,
    y: (i) => Math.sin((i / sw.length) * Math.PI * 2 - Math.PI / 2) * R,
    rotate: (i) => (i % 2 ? 12 : -12), ease: 'back.out(1.6)',
  })
    .to(sw, { x: (i) => (i - 2) * (desk ? 78 : 62), y: desk ? 210 : 170, rotate: 0, stagger: .03 }, '+=.2')
    .to('.dna-logo', { y: desk ? -200 : -170, scale: .7 }, '<')
    .to('.dna-phone', { opacity: 1, scale: 1, ease: 'power2.out' }, '+=.1')
    .to(sw, { x: 0, y: 0, scale: .2, opacity: 0, stagger: .03 }, '<')
    .to('.dna-logo', { y: 0, scale: .3, opacity: 0 }, '<');
});

/* THEMES: one theme, everything changes */
const THEMES = {
  wekad: { word: 'وِكاد', name: 'وِكاد الكلاسيك', tag: 'قهوة مختصة · الدمام', banner: 'أهلاً فيك في وِكاد', ftag: 'توقيع وِكاد' },
  founding: { word: 'يوم التأسيس', name: 'يوم التأسيس', tag: 'يوم بدينا', banner: 'قائمة التأسيس متوفرة لين ٢٢ فبراير', ftag: 'إصدار التأسيس' },
  ramadan: { word: 'رمضان كريم', name: 'رمضان', tag: 'رمضان كريم', banner: 'باقي على الإفطار ٠٢:١٤:٣٧', ftag: 'سفرة الإفطار' },
  national: { word: 'يوم الوطن ٩٦', name: 'اليوم الوطني', tag: 'هي لنا دار', banner: 'قائمة الوطني متوفرة لين ٢٣ سبتمبر', ftag: 'إصدار الوطني' },
  pink: { word: 'أكتوبر الوردي', name: 'أكتوبر الوردي', tag: 'أكتوبر شهر التوعية', banner: 'من كل طلب وردي.. ريال للتوعية', ftag: 'إصدار أكتوبر' },
};
const KEYS = Object.keys(THEMES);
const themesEl = $('.themes');
let current = 'wekad';
let iftar = 2 * 3600 + 14 * 60 + 37;
const pad = (n) => String(n).padStart(2, '0');
setInterval(() => {
  iftar = Math.max(0, iftar - 1);
  if (current === 'ramadan') $('.js-banner').textContent = 'باقي على الإفطار ' + pad(Math.floor(iftar / 3600)) + ':' + pad(Math.floor((iftar % 3600) / 60)) + ':' + pad(iftar % 60);
}, 1000);

function setTheme(k) {
  if (k === current) return;
  current = k;
  const t = THEMES[k];
  themesEl.dataset.theme = k;
  $('.season-word').textContent = t.word;
  $('.js-theme-name').textContent = t.name;
  $('.js-tag').textContent = t.tag;
  $('.js-banner').textContent = t.banner;
  $('.js-ftag').textContent = t.ftag;
  $$('.theme-picker button').forEach((b) => b.classList.toggle('on', b.dataset.pick === k));
  if (reduce) return;
  gsap.fromTo('.phone', { scale: .95, rotate: -2 }, { scale: 1, rotate: 0, duration: .9, ease: 'elastic.out(1, .5)' });
  gsap.fromTo('.season-word', { y: 60, opacity: 0 }, { y: 0, opacity: .1, duration: .8, ease: 'power3.out', overwrite: true });
  gsap.fromTo(['.st-dash', '.st-qr', '.st-google'], { y: 16 }, { y: 0, duration: .7, stagger: .08, ease: 'back.out(2)' });
}
$$('.theme-picker button').forEach((b) => b.addEventListener('click', () => setTheme(b.dataset.pick)));
$('.theme-picker button[data-pick="wekad"]').classList.add('on');

ScrollTrigger.create({
  trigger: '.themes', start: 'top top', end: '+=420%', pin: true,
  onUpdate: (self) => setTheme(KEYS[Math.min(KEYS.length - 1, Math.floor(self.progress * KEYS.length))]),
});
gsap.from(['.st-dash', '.phone', '.st-side'], { y: 80, opacity: 0, stagger: .12, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: '.themes', start: 'top 60%' } });

/* QR dots */
(function buildQR() {
  const grid = $('.qr-grid');
  const N = 21;
  let seed = 5;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const finder = (r, c) => {
    for (const [pr, pc] of [[0, 0], [0, N - 7], [N - 7, 0]]) {
      const y = r - pr, x = c - pc;
      if (y >= 0 && y < 7 && x >= 0 && x < 7) return (y === 0 || y === 6 || x === 0 || x === 6 || (y >= 2 && y <= 4 && x >= 2 && x <= 4)) ? 1 : 0;
      if (y >= -1 && y <= 7 && x >= -1 && x <= 7) return 0;
    }
    return -1;
  };
  const frag = document.createDocumentFragment();
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const f = finder(r, c);
    const i = document.createElement('i');
    if (!(f === -1 ? rnd() > .5 : f === 1)) i.className = 'off';
    frag.appendChild(i);
  }
  grid.appendChild(frag);
})();

/* SMART: temperature reorders the menu */
const ORDERS = {
  cold: { list: ['thra', 'latte', 'cake', 'iced', 'cold'], chip: 'الجو بارد.. دفّي نفسك', badge: { thra: 'يدفّي', latte: 'يدفّي' }, bg: 'linear-gradient(180deg, #E4EEF8, #F6F4EF)', color: '#2F6FB8' },
  mild: { list: ['latte', 'iced', 'cake', 'thra', 'cold'], chip: 'الأكثر طلباً الحين', badge: { latte: 'الأكثر طلباً' }, bg: 'linear-gradient(180deg, #F3F1EA, #F6F4EF)', color: '#9A6700' },
  hot: { list: ['iced', 'cold', 'cake', 'latte', 'thra'], chip: 'يوم حار.. هذي تبرّد عليك', badge: { iced: 'منعش للحر', cold: 'منعش للحر' }, bg: 'linear-gradient(180deg, #FFE6D6, #F6F4EF)', color: '#E2540F' },
};
const spItems = Object.fromEntries($$('.sp-item').map((el) => [el.dataset.k, el]));
let mode = null;
function setMode(m) {
  if (m === mode) return;
  mode = m;
  const o = ORDERS[m];
  $('.sp-chip').textContent = o.chip;
  $('.smart').style.background = o.bg;
  $('.temp-num').style.color = o.color;
  o.list.forEach((k, i) => {
    const el = spItems[k];
    el.querySelector('small').textContent = o.badge[k] || '';
    gsap.to(el, { y: i * 80, duration: reduce ? 0 : .7, ease: 'power3.inOut' });
  });
}
setMode('cold');
mm.add({ desk: '(min-width: 761px)', mob: '(max-width: 760px)' }, (ctx) => {
  ScrollTrigger.create({
    trigger: ctx.conditions.desk ? '.smart' : '.smart-phone',
    start: ctx.conditions.desk ? 'top top' : 'top 70%',
    end: ctx.conditions.desk ? '+=200%' : 'bottom 20%',
    pin: ctx.conditions.desk,
    onUpdate: (self) => {
      const t = Math.round(18 + self.progress * 28);
      $('.temp-num').textContent = t;
      gsap.set('.temp-bar i', { scaleX: 1 - self.progress });
      setMode(t >= 38 ? 'hot' : t >= 26 ? 'mild' : 'cold');
    },
  });
});

/* PULSE */
const line = $('.chart-line');
const len = line.getTotalLength();
gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
gsap.set('.chart-area', { opacity: 0 });
gsap.timeline({ scrollTrigger: { trigger: '.pulse-grid', start: 'top 75%', end: 'center 45%', scrub: 1 } })
  .to(line, { strokeDashoffset: 0, ease: 'none' })
  .to('.chart-area', { opacity: 1 }, '-=.3');
ScrollTrigger.create({ trigger: '.pc-top', start: 'top 85%', once: true, onEnter: () => $$('.bar i').forEach((b) => b.style.setProperty('--s', 1)) });
gsap.from('.pc', { y: 60, opacity: 0, stagger: .1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.pulse-grid', start: 'top 80%' } });
setInterval(() => {
  const el = $('.js-live');
  if (!el.dataset.done) return;
  const v = Math.max(28, Math.min(52, Number(el.textContent) + Math.round(Math.random() * 4 - 2)));
  el.textContent = v;
}, 2200);

/* ADVISOR: why not ordered + price index */
ScrollTrigger.create({
  trigger: '.adv-grid', start: 'top 72%', once: true,
  onEnter: () => {
    gsap.to('.fn i em', { scaleX: 1, duration: 1.4, stagger: .25, ease: 'power3.out' });
    gsap.from('.rs', { x: -40, opacity: 0, stagger: .18, delay: .9, duration: .7, ease: 'back.out(1.6)' });
    gsap.from('.pidx strong', { scale: .4, opacity: 0, duration: 1, ease: 'elastic.out(1, .6)', delay: .2 });
    $$('.pdot').forEach((d, i) => gsap.to(d, { left: getComputedStyle(d).getPropertyValue('--x').trim(), duration: 1.4, delay: .5 + i * .2, ease: 'elastic.out(1, .7)' }));
  },
});
gsap.from('.adv-card', { y: 70, opacity: 0, stagger: .15, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.adv-grid', start: 'top 85%' } });

/* WHATSAPP: messages update the menu */
const wms = $$('.wm');
let waStep = -1;
function setWa(step) {
  if (step === waStep) return;
  waStep = step;
  wms.forEach((m, i) => gsap.to(m, { opacity: i < step ? 1 : 0, y: i < step ? 0 : 12, duration: reduce ? 0 : .35, overwrite: true }));
  $('.wa-status').textContent = step < wms.length && step % 2 === 1 ? 'يكتب…' : 'متصل';
  $('.wprice').textContent = step >= 2 ? '20' : '18';
  $('.wlatte').classList.toggle('flash', step >= 2 && step < 4);
  gsap.to('.wnew', { height: step >= 4 ? 120 : 0, opacity: step >= 4 ? 1 : 0, duration: reduce ? 0 : .6, ease: 'power3.out', overwrite: true });
}
setWa(0);
mm.add({ desk: '(min-width: 761px)', mob: '(max-width: 760px)' }, (ctx) => {
  const desk = ctx.conditions.desk;
  ScrollTrigger.create({
    trigger: desk ? '.wa' : '.wa-stage',
    start: desk ? 'top top' : 'top 75%',
    end: desk ? '+=180%' : 'bottom 25%',
    pin: desk,
    onUpdate: (self) => setWa(Math.min(wms.length, Math.floor(self.progress * (wms.length + 1)))),
  });
});

/* CAMPAIGNS */
gsap.from('.camp-chips span', { y: 30, opacity: 0, scale: .8, stagger: .08, duration: .7, ease: 'back.out(2)', scrollTrigger: { trigger: '.camp-chips', start: 'top 85%' } });
gsap.from('.camp-card', { y: 80, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.camp-card', start: 'top 85%' } });
gsap.to('.cc-chart i', { scaleY: 1, stagger: .09, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: '.cc-chart', start: 'top 80%' } });

/* GOOGLE: typing -> result -> pin drop */
ScrollTrigger.create({
  trigger: '.gwin', start: 'top 70%', once: true,
  onEnter: () => {
    const text = 'تشيز كيك مانجو الدمام';
    const out = $('.gtype');
    let i = 0;
    const iv = setInterval(() => {
      out.textContent = text.slice(0, ++i);
      if (i >= text.length) {
        clearInterval(iv);
        gsap.timeline()
          .fromTo('.gresult', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .7, ease: 'power3.out', delay: .25 })
          .fromTo('.gmap', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .6 }, '-=.2')
          .fromTo('.gpin', { y: -140, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'bounce.out' }, '-=.1');
      }
    }, reduce ? 0 : 70);
  },
});
gsap.from('.gwin', { y: 80, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.gwin', start: 'top 85%' } });

/* STUDIO: before/after wipe */
mm.add({ desk: '(min-width: 761px)', mob: '(max-width: 760px)' }, (ctx) => {
  const desk = ctx.conditions.desk;
  gsap.timeline({
    scrollTrigger: desk
      ? { trigger: '.studio', start: 'top top', end: '+=130%', scrub: 1, pin: true }
      : { trigger: '.ba', start: 'top 70%', end: 'bottom 30%', scrub: 1 },
  })
    .fromTo('.ba-after', { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none' }, 0)
    .fromTo('.ba-line', { right: '0%' }, { right: '100%', ease: 'none' }, 0);
});

/* BUSINESS + CTA */
gsap.from('.bz', { y: 70, opacity: 0, stagger: .12, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.biz-grid', start: 'top 80%' } });
gsap.from('.biz h2', { y: 60, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.biz', start: 'top 70%' } });
gsap.from('.cta-dot', { scale: 0, duration: 1.4, ease: 'elastic.out(1, .6)', scrollTrigger: { trigger: '.cta', start: 'top 70%' } });
gsap.from(['.cta h2', '.cta-btns', '.cta-foot'], { y: 50, opacity: 0, stagger: .15, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.cta', start: 'top 60%' } });

window.addEventListener('load', () => ScrollTrigger.refresh());
