const menuButton = document.querySelector('.menu-toggle');
const navigation = document.getElementById('navigation');
function closeMenu(returnFocus = false) {
  navigation.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', '메뉴 열기');
  if (returnFocus) menuButton.focus();
}
menuButton.addEventListener('click', () => {
  const opened = navigation.classList.toggle('is-open');
  menuButton.setAttribute('aria-expanded', String(opened));
  menuButton.setAttribute('aria-label', opened ? '메뉴 닫기' : '메뉴 열기');
});
navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && navigation.classList.contains('is-open')) closeMenu(true); });
window.matchMedia('(min-width:701px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

const canvas = document.getElementById('ink-canvas');
const ctx = canvas.getContext('2d');
const stage = document.querySelector('.ink-stage');
const pauseButton = document.getElementById('pause-button');
const clearButton = document.getElementById('clear-button');
const status = document.getElementById('experience-status');
const reducedMotion = window.matchMedia('(prefers-reduced-motion:reduce)');
let width = 0, height = 0, dots = [], paused = false, frame = 0, previous = 0, lastInput = 0;
let keyboardPoint = { x: .5, y: .45 };
function paint() {
  ctx.clearRect(0, 0, width, height);
  for (let layer = 0; layer < 6; layer++) {
    ctx.beginPath();
    for (let x = 0; x <= width + 8; x += 8) {
      const y = height - 20 - layer * 10 - Math.sin(x / 127 + layer * .6) * (11 + layer * 2) - Math.cos(x / 63 + layer) * 4;
      if (!x) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);ctx.lineTo(0, height);ctx.closePath();
    ctx.fillStyle = `rgba(181,190,162,${.022 + layer * .008})`;ctx.fill();
  }
  for (const dot of dots) {
    const gradient = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, dot.radius);
    gradient.addColorStop(0, `rgba(210,214,189,${dot.opacity})`);
    gradient.addColorStop(.35, `rgba(184,194,161,${dot.opacity * .5})`);
    gradient.addColorStop(1, 'rgba(184,194,161,0)');
    ctx.fillStyle = gradient;ctx.beginPath();ctx.ellipse(dot.x, dot.y, dot.radius, dot.radius * .64, -.35, 0, Math.PI * 2);ctx.fill();
  }
}
function schedule() { if (!frame && !paused && !reducedMotion.matches && dots.some(dot => dot.y < height - 65)) frame = requestAnimationFrame(tick); }
function tick(now) {
  frame = 0;
  const dt = Math.min((now - previous) / 1000 || .016, .04);previous = now;
  for (const dot of dots) { if (dot.y < height - 65) { dot.y = Math.min(height - 65, dot.y + 11 * dt);dot.radius = Math.min(26, dot.radius + dt * .45); } }
  paint();schedule();
}
function addMark(x, y) {
  if (paused) return;
  dots.push({ x, y, radius: 10 + Math.random() * 12, opacity: .14 + Math.random() * .13 });
  if (dots.length > 140) dots.shift();
  stage.classList.add('has-marks');paint();schedule();
}
new ResizeObserver(() => {
  const rect = canvas.getBoundingClientRect();
  const oldWidth = width || rect.width, oldHeight = height || rect.height;
  width = rect.width;height = rect.height;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * ratio);canvas.height = Math.round(height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  dots.forEach(dot => { dot.x *= width / oldWidth;dot.y *= height / oldHeight; });paint();
}).observe(canvas);
canvas.addEventListener('pointermove', event => {
  if (event.pointerType === 'touch' && !event.buttons) return;
  if (performance.now() - lastInput < 35) return;
  lastInput = performance.now();const rect = canvas.getBoundingClientRect();addMark(event.clientX - rect.left, event.clientY - rect.top);
});
canvas.addEventListener('pointerdown', event => {
  const rect = canvas.getBoundingClientRect();addMark(event.clientX - rect.left, event.clientY - rect.top);
});
canvas.addEventListener('keydown', event => {
  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(event.key)) return;
  event.preventDefault();
  if (event.key === 'ArrowUp') keyboardPoint.y -= .05;
  if (event.key === 'ArrowDown') keyboardPoint.y += .05;
  if (event.key === 'ArrowLeft') keyboardPoint.x -= .05;
  if (event.key === 'ArrowRight') keyboardPoint.x += .05;
  keyboardPoint.x = Math.max(.05, Math.min(.95, keyboardPoint.x));keyboardPoint.y = Math.max(.1, Math.min(.8, keyboardPoint.y));
  addMark(keyboardPoint.x * width, keyboardPoint.y * height);
});
pauseButton.addEventListener('click', () => {
  paused = !paused;pauseButton.setAttribute('aria-pressed', String(paused));
  pauseButton.querySelector('span').textContent = paused ? '움직임 이어가기' : '움직임 멈추기';
  pauseButton.querySelector('use').setAttribute('href', paused ? '#icon-play' : '#icon-pause');
  status.textContent = paused ? '흔적을 그대로 머물게 합니다.' : '움직임을 이어갑니다.';
  if (paused) { cancelAnimationFrame(frame);frame = 0; } else { previous = performance.now();schedule(); }
});
clearButton.addEventListener('click', () => {
  dots = [];cancelAnimationFrame(frame);frame = 0;stage.classList.remove('has-marks');paint();
  status.textContent = paused ? '장면을 비웠습니다. 일시정지 상태입니다.' : '장면을 비웠습니다.';
});
reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) { cancelAnimationFrame(frame);frame = 0; } else schedule(); });
document.fonts.ready.then(() => {
  const faces = [];
  document.fonts.forEach(face => faces.push({ family: face.family, status: face.status }));
  document.documentElement.dataset.fontFaces = JSON.stringify(faces);
  document.documentElement.dataset.fontsReady = 'true';
});
