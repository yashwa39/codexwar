const TITLES = [
  "Mustafar Corridor Clash",
  "Twilight On Bespin",
  "Temple Of Embers",
  "Last Master Standing",
  "Shadows In The Throne Room",
  "Blue Steel Vow",
  "Ashfall Duel",
  "Revenge In Silence",
  "Across The Ruins",
  "Final Crossing",
];

const MOODS = [
  "Silhouette duel beneath burning haze.",
  "Breath, steel, and fate in one frame.",
  "A mythic clash of red and blue.",
  "Quiet tension before violent motion.",
];

let paletteIndex = 0;

function rand(max) {
  return Math.floor(Math.random() * max);
}

function drawBackground() {
  const canvas = document.getElementById("bgCanvas");
  const ctx = canvas.getContext("2d");
  let stars = [];

  const resize = () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    stars = Array.from({ length: 260 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      s: Math.random() * 2 + 0.4,
      a: Math.random() * 0.7 + 0.2,
    }));
  };

  const tick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach((st) => {
      st.x += st.s * 0.06;
      if (st.x > canvas.width + 3) st.x = -3;
      ctx.fillStyle = `rgba(255,255,255,${st.a})`;
      ctx.fillRect(st.x, st.y, st.s, st.s);
    });
    requestAnimationFrame(tick);
  };

  resize();
  tick();
  addEventListener("resize", resize);
}

function palette(i) {
  const sets = [
    ["#190910", "#5f0f2b", "#17284f"],
    ["#0f101e", "#213f75", "#702015"],
    ["#160a0a", "#642211", "#1a2240"],
  ];
  const p = sets[i % sets.length];
  return [p[0], p[1], p[2]];
}

function makeSilhouettePattern(seed = 0) {
  const x = 15 + (seed * 11) % 70;
  const y = 18 + (seed * 7) % 50;
  return `radial-gradient(circle at ${x}% ${y}%, rgba(255,120,70,0.46), transparent 35%),
          linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.45)),
          linear-gradient(140deg, rgba(255,20,70,0.45), rgba(18,34,74,0.65))`;
}

function renderScenes() {
  const grid = document.getElementById("sceneGrid");
  const tpl = document.getElementById("sceneCard");
  const [c1, c2, c3] = palette(paletteIndex);
  grid.innerHTML = "";

  for (let i = 0; i < 16; i += 1) {
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.querySelector("h3").textContent = TITLES[i % TITLES.length];
    node.querySelector("p").textContent = MOODS[rand(MOODS.length)];
    const art = node.querySelector(".card-art");
    art.style.backgroundImage = `${makeSilhouettePattern(i)}, linear-gradient(165deg, ${c1}, ${c2}, ${c3})`;
    art.style.transform = `scale(${1 + (i % 4) * 0.01})`;
    node.onmousemove = (e) => {
      const r = node.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5;
      const dy = (e.clientY - r.top) / r.height - 0.5;
      node.style.transform = `rotateX(${dy * -6}deg) rotateY(${dx * 8}deg)`;
    };
    node.onmouseleave = () => {
      node.style.transform = "";
    };
    grid.appendChild(node);
  }
}

function wireActions() {
  document.getElementById("regenScenes").onclick = () => renderScenes();
  document.getElementById("shufflePalette").onclick = () => {
    paletteIndex += 1;
    renderScenes();
  };
}

drawBackground();
wireActions();
renderScenes();
