// Visual enhancements are kept separate from the study tools so the tools
// still work when a browser disables motion effects.
const motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const effectPage = document.body.dataset.page;

document.body.insertAdjacentHTML('afterbegin', `
  <div class="sky-dust" aria-hidden="true"></div>
  <div class="scroll-meter" aria-hidden="true"><span></span></div>
  <div class="cursor-halo" aria-hidden="true"></div>
`);

const meter = document.querySelector('.scroll-meter span');
const updateScroll = () => {
  const available = document.documentElement.scrollHeight - innerHeight;
  meter.style.transform = `scaleX(${available > 0 ? Math.min(1, scrollY / available) : 0})`;
};
addEventListener('scroll', updateScroll, {passive: true});
addEventListener('resize', updateScroll);
updateScroll();

if (motionOK && matchMedia('(pointer: fine)').matches) {
  const halo = document.querySelector('.cursor-halo');
  let frame = 0;
  addEventListener('pointermove', event => {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      halo.style.transform = `translate3d(${event.clientX - 200}px, ${event.clientY - 200}px, 0)`;
      halo.style.opacity = '1';
      frame = 0;
    });
  }, {passive: true});
  addEventListener('pointerleave', () => { halo.style.opacity = '0'; });

  document.querySelectorAll('.feature-card, .panel, .method-card, .tool-card, .stat-card').forEach(card => {
    card.classList.add('light-reactive');
    card.addEventListener('pointermove', event => {
      const bounds = card.getBoundingClientRect();
      card.style.setProperty('--light-x', `${event.clientX - bounds.left}px`);
      card.style.setProperty('--light-y', `${event.clientY - bounds.top}px`);
    }, {passive: true});
  });
}

if (effectPage === 'home') {
  const card = document.querySelector('.countdown-card');
  const grid = document.querySelector('.countdown-grid');
  card.insertAdjacentHTML('afterbegin', `
    <div class="countdown-stars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
    <div class="countdown-orbit" aria-hidden="true"></div>
  `);
  grid.insertAdjacentHTML('afterend', `
    <div class="countdown-journey">
      <div class="journey-labels"><span>YOUR 2026 JOURNEY</span><strong id="journey-percent">0% of the way there</strong></div>
      <div class="journey-track" id="journey-track" role="progressbar" aria-label="Progress through the countdown year" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span id="journey-fill"></span><i></i></div>
      <p id="journey-note">Keep going. Every study day counts.</p>
    </div>
  `);

  const updateJourney = () => {
    let chosen;
    try { chosen = JSON.parse(localStorage.getItem('ol-orbit-exam-date')); } catch { chosen = null; }
    const target = new Date(`${chosen || '2026-12-31'}T00:00:00`);
    if (!Number.isFinite(target.getTime())) return;
    const start = new Date(target.getFullYear(), 0, 1);
    const fraction = Math.max(0, Math.min(1, (Date.now() - start.getTime()) / Math.max(1, target.getTime() - start.getTime())));
    const percent = Math.round(fraction * 100);
    document.querySelector('.journey-labels span').textContent = `YOUR ${target.getFullYear()} JOURNEY`;
    document.querySelector('#journey-percent').textContent = `${percent}% of the way there`;
    document.querySelector('#journey-fill').style.width = `${percent}%`;
    document.querySelector('#journey-track').setAttribute('aria-valuenow', String(percent));
    const days = Math.max(0, Math.ceil((target.getTime() - Date.now()) / 86400000));
    document.querySelector('#journey-note').textContent = days === 0
      ? 'Your target day is here. Trust the work you have done.'
      : `${days} ${days === 1 ? 'day' : 'days'} to build confidence, one session at a time.`;
  };
  updateJourney();
  setInterval(updateJourney, 60000);
  new MutationObserver(updateJourney).observe(document.querySelector('#target-label'), {childList: true});

  if (motionOK) {
    document.querySelectorAll('.time-unit strong').forEach(digit => {
      let previous = digit.textContent;
      new MutationObserver(() => {
        if (digit.textContent === previous) return;
        previous = digit.textContent;
        digit.classList.remove('digit-change');
        void digit.offsetWidth;
        digit.classList.add('digit-change');
      }).observe(digit, {childList: true});
    });
  }
}

if (effectPage === 'study') {
  const card = document.querySelector('.timer-card');
  const face = document.querySelector('.timer-face');
  card.insertAdjacentHTML('afterbegin', `
    <div class="timer-atmosphere" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span></div>
  `);
  document.querySelector('.timer-top').insertAdjacentHTML('afterend', `
    <div class="timer-intro"><span class="timer-eyebrow">A MOMENT FOR YOUR MIND</span><h2>Let the world <em>fade away.</em></h2><p>Choose a rhythm, set one intention, and begin.</p></div>
  `);
  face.insertAdjacentHTML('afterbegin', '<div class="timer-orbit" aria-hidden="true"><i></i><i></i><i></i></div>');
  document.querySelector('.timer-controls').insertAdjacentHTML('afterend', `
    <div class="focus-steps" aria-label="Study flow"><span class="step-current">01 <b>INTENTION</b></span><i></i><span>02 <b>FOCUS</b></span><i></i><span>03 <b>RECHARGE</b></span></div>
    <div class="session-count"><span class="session-count-icon">✳</span><span><strong id="session-count-value">0</strong> focus sessions completed</span></div>
  `);

  const updateCount = () => {
    try {
      const sessions = JSON.parse(localStorage.getItem('ol-orbit-sessions')) || [];
      document.querySelector('#session-count-value').textContent = String(sessions.length).padStart(2, '0');
    } catch { document.querySelector('#session-count-value').textContent = '00'; }
  };
  updateCount();

  let lastStatus = '';
  const updateTimerLook = () => {
    const status = document.querySelector('#timer-status').textContent;
    if (status === lastStatus) return;
    lastStatus = status;
    const isRunning = status.includes('FLOW');
    card.classList.toggle('is-running', isRunning);
    card.classList.toggle('is-paused', status.includes('PAUSED'));
    const steps = document.querySelectorAll('.focus-steps span');
    steps.forEach(step => step.classList.remove('step-current'));
    steps[isRunning ? 1 : 0].classList.add('step-current');
    document.querySelector('.timer-center > span').textContent = isRunning ? 'IN YOUR FOCUS ZONE' : 'TIME TO FOCUS';
  };
  new MutationObserver(updateTimerLook).observe(document.querySelector('#timer-status'), {childList: true});
  updateTimerLook();

  const updateModeLook = () => {
    const mode = document.querySelector('.mode.active')?.dataset.mode || 'focus';
    card.dataset.visualMode = mode;
    document.querySelector('.timer-eyebrow').textContent = mode === 'focus' ? 'A MOMENT FOR YOUR MIND' : 'TAKE A MOMENT TO RECHARGE';
    document.querySelector('.timer-intro h2').innerHTML = mode === 'focus' ? 'Let the world <em>fade away.</em>' : 'Give yourself <em>room to breathe.</em>';
  };
  document.querySelectorAll('.mode').forEach(mode => mode.addEventListener('click', updateModeLook));
  updateModeLook();

  const subject = document.querySelector('#session-subject');
  face.insertAdjacentHTML('afterend', '<div class="timer-subject">CURRENT FOCUS <b id="timer-subject-name"></b></div>');
  const updateSubject = () => { document.querySelector('#timer-subject-name').textContent = subject.value; };
  subject.addEventListener('change', updateSubject);
  updateSubject();

  const toast = document.querySelector('.toast');
  new MutationObserver(() => {
    if (!toast.textContent.includes('Focus session complete!')) return;
    updateCount();
    if (!motionOK) return;
    card.classList.remove('session-celebration');
    void card.offsetWidth;
    card.classList.add('session-celebration');
    const burst = document.createElement('div');
    burst.className = 'celebration-burst';
    burst.setAttribute('aria-hidden', 'true');
    for (let index = 0; index < 18; index++) {
      const bit = document.createElement('i');
      bit.style.setProperty('--angle', `${index * 20}deg`);
      bit.style.setProperty('--distance', `${130 + (index % 4) * 30}px`);
      bit.style.setProperty('--color', ['#d8ff74','#a694ff','#80c7ff'][index % 3]);
      burst.append(bit);
    }
    face.append(burst);
    setTimeout(() => { burst.remove(); card.classList.remove('session-celebration'); }, 1800);
  }).observe(toast, {childList: true});
}
