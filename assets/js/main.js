"use strict";

(() => {
  const menuToggle = document.querySelector(".menu-toggle");
  const navigation = document.querySelector("#site-navigation");
  const narrowScreen = window.matchMedia("(max-width: 760px)");

  function setMenu(open, returnFocus = false) {
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.querySelector(".menu-label").textContent = open ? "닫기" : "메뉴";
    navigation.hidden = narrowScreen.matches && !open;
    if (returnFocus) menuToggle.focus();
  }

  menuToggle.addEventListener("click", () => {
    setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  navigation.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link) return;
    setMenu(false);
    const destination = document.querySelector(link.hash);
    destination.setAttribute("tabindex", "-1");
    destination.focus({ preventScroll: true });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (menuToggle.getAttribute("aria-expanded") === "true") setMenu(false, true);
  });

  narrowScreen.addEventListener("change", () => setMenu(false));
  setMenu(false);
})();

(() => {
  const surface = document.querySelector("#experience-surface");
  const canvas = document.querySelector("#sedimentCanvas");
  const context = canvas.getContext("2d");
  const motionButton = document.querySelector("#motion-toggle");
  const clearButton = document.querySelector("#clear-scene");
  const status = document.querySelector("#scene-status");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const colors = ["#d1f568", "#a2b9f3", "#e8edf0", "#7f96a6"];
  const particles = [];
  const cursor = { x: 0, y: 0 };
  let width = 0;
  let height = 0;
  let running = !reducedMotion.matches;
  let visible = false;
  let frame = 0;
  let previousTime = 0;
  let lastPointerTime = 0;

  if (!context) {
    motionButton.disabled = true;
    clearButton.disabled = true;
    status.textContent = "이 브라우저에서는 장면을 그릴 수 없습니다.";
    return;
  }

  function draw() {
    context.clearRect(0, 0, width, height);

    // 배경 지층은 고정해 두어 움직임을 줄인 환경에서도 체험의 의미를 전한다.
    for (let layer = 0; layer < 4; layer++) {
      const baseline = height - 95 + layer * 22;
      context.beginPath();
      context.moveTo(0, height);
      for (let x = 0; x <= width + 12; x += 12) {
        const wave = Math.sin(x / 130 + layer * 1.2) * 14;
        context.lineTo(x, baseline + wave);
      }
      context.lineTo(width, height);
      context.closePath();
      context.fillStyle = ["#344650", "#3d525b", "#4b6266", "#5a7471"][layer];
      context.fill();
    }

    for (const particle of particles) {
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fillStyle = particle.color;
      context.fill();
    }
  }

  function resize() {
    const previousWidth = width;
    const previousHeight = height;
    width = surface.clientWidth;
    height = surface.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    // 회전·창 크기 변경으로 사용자가 남긴 장면을 지우지 않고 위치를 비례 조정한다.
    if (previousWidth && previousHeight) {
      for (const particle of particles) {
        particle.x *= width / previousWidth;
        particle.y *= height / previousHeight;
        particle.floor *= height / previousHeight;
      }
      cursor.x *= width / previousWidth;
      cursor.y *= height / previousHeight;
    } else {
      cursor.x = width / 2;
      cursor.y = height / 2;
    }
    draw();
  }

  function addMoment(x, y, count = 5) {
    for (let index = 0; index < count; index++) {
      particles.push({
        x: Math.max(4, Math.min(width - 4, x + (Math.random() - .5) * 25)),
        y: Math.max(4, Math.min(height - 4, y + (Math.random() - .5) * 20)),
        vx: (Math.random() - .5) * 8,
        vy: 9 + Math.random() * 16,
        radius: 1.5 + Math.random() * 3,
        floor: height - 10 - Math.random() * 42,
        settled: false,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    if (particles.length > 420) particles.splice(0, particles.length - 420);
    draw();
  }

  function animate(time) {
    frame = 0;
    const delta = previousTime ? Math.min((time - previousTime) / 1000, .05) : 0;
    previousTime = time;

    for (const particle of particles) {
      if (particle.settled) continue;
      particle.x = Math.max(4, Math.min(width - 4, particle.x + particle.vx * delta));
      particle.y += particle.vy * delta;
      if (particle.y >= particle.floor) {
        particle.y = particle.floor;
        particle.settled = true;
      }
    }
    draw();
    if (running && visible && !document.hidden) frame = requestAnimationFrame(animate);
  }

  function syncAnimation() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    if (running && visible && !document.hidden) frame = requestAnimationFrame(animate);
  }

  function updateMotionButton() {
    motionButton.setAttribute("aria-pressed", String(!running));
    motionButton.replaceChildren();
    motionButton.append(running ? "움직임 멈추기 " : "이어가기 ");
    const symbol = document.createElement("span");
    symbol.setAttribute("aria-hidden", "true");
    symbol.textContent = running ? "Ⅱ" : "▷";
    motionButton.append(symbol);
  }

  surface.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const rect = surface.getBoundingClientRect();
    cursor.x = event.clientX - rect.left;
    cursor.y = event.clientY - rect.top;
    addMoment(cursor.x, cursor.y, 12);
  });

  surface.addEventListener("pointermove", (event) => {
    if (event.timeStamp - lastPointerTime < 35) return;
    lastPointerTime = event.timeStamp;
    const rect = surface.getBoundingClientRect();
    cursor.x = event.clientX - rect.left;
    cursor.y = event.clientY - rect.top;
    addMoment(cursor.x, cursor.y);
  });

  surface.addEventListener("keydown", (event) => {
    const directions = {
      ArrowUp: [0, -18], ArrowDown: [0, 18],
      ArrowLeft: [-18, 0], ArrowRight: [18, 0]
    };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    cursor.x = Math.max(12, Math.min(width - 12, cursor.x + direction[0]));
    cursor.y = Math.max(12, Math.min(height - 12, cursor.y + direction[1]));
    addMoment(cursor.x, cursor.y, 8);
  });

  motionButton.addEventListener("click", () => {
    running = !running;
    status.textContent = running ? "움직임을 이어갑니다." : "움직임을 멈췄습니다.";
    updateMotionButton();
    syncAnimation();
  });

  clearButton.addEventListener("click", () => {
    particles.length = 0;
    status.textContent = "장면을 비웠습니다.";
    draw();
  });

  reducedMotion.addEventListener("change", (event) => {
    if (!event.matches) return;
    running = false;
    status.textContent = "기기의 움직임 줄이기 설정을 적용했습니다.";
    updateMotionButton();
    syncAnimation();
  });

  new ResizeObserver(resize).observe(surface);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    syncAnimation();
  }).observe(surface);
  document.addEventListener("visibilitychange", syncAnimation);
  resize();
  updateMotionButton();
  if (reducedMotion.matches) status.textContent = "움직임을 줄인 상태로 시작합니다.";
})();
