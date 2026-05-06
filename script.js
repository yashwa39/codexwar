const STORAGE_KEY = "holocronJournalEntries";
const prompts = [
  "What memory in you feels like twin suns setting?",
  "If you had one lesson from Yoda tonight, what would it be?",
  "What fear still sounds like Vader breathing down a corridor?",
  "Where in your life are you still choosing between light and rage?",
];

const fleet = [
  { name: "Millennium Falcon", text: "Fastest hunk of junk in the galaxy." },
  { name: "Death Star", text: "Moon-sized terror and symbol of oppression." },
  { name: "TIE Fighter", text: "Imperial interceptor with screaming engines." },
  { name: "X-Wing", text: "Rebel precision starfighter, icon of hope." },
  { name: "R2-D2", text: "Loyal astromech carrying rebellions in memory." },
  { name: "C-3PO", text: "Protocol droid with anxiety and golden diplomacy." },
  { name: "Lightsaber", text: "The elegant weapon of the Jedi legacy." },
];

function q(id) { return document.getElementById(id); }

function drawStars() {
  const canvas = q("stars");
  const ctx = canvas.getContext("2d");
  let stars = [];
  const resize = () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    stars = Array.from({ length: 300 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      s: Math.random() * 1.8 + 0.2,
      v: Math.random() * 0.16 + 0.03,
    }));
  };
  const tick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach((s) => {
      s.x += s.v;
      if (s.x > canvas.width + 2) s.x = -2;
      ctx.fillStyle = "rgba(255,255,255,.8)";
      ctx.fillRect(s.x, s.y, s.s, s.s);
    });
    requestAnimationFrame(tick);
  };
  resize(); tick();
  addEventListener("resize", resize);
}

function loadEntries() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function entryArtByMood(mood) {
  const map = {
    Hope: "linear-gradient(145deg, rgba(83,181,255,.65), rgba(245,210,143,.55))",
    Conflict: "linear-gradient(145deg, rgba(255,54,95,.65), rgba(83,181,255,.5))",
    "Dark Side": "linear-gradient(145deg, rgba(255,54,95,.75), rgba(76,17,24,.9))",
    Adventure: "linear-gradient(145deg, rgba(245,210,143,.75), rgba(83,181,255,.5))",
    Legacy: "linear-gradient(145deg, rgba(200,170,255,.65), rgba(83,181,255,.55))",
  };
  return map[mood] || map.Legacy;
}

function renderEntries() {
  const grid = q("entryGrid");
  const tpl = q("entryTemplate");
  grid.innerHTML = "";
  loadEntries().forEach((e) => {
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.querySelector("h3").textContent = e.title;
    node.querySelector(".mood").textContent = e.mood;
    node.querySelector(".body").textContent = e.text;
    node.querySelector(".entry-art").style.background = entryArtByMood(e.mood);
    node.onmousemove = (ev) => {
      const r = node.getBoundingClientRect();
      const dx = (ev.clientX - r.left) / r.width - 0.5;
      const dy = (ev.clientY - r.top) / r.height - 0.5;
      node.style.transform = `rotateX(${dy * -7}deg) rotateY(${dx * 9}deg)`;
    };
    node.onmouseleave = () => { node.style.transform = ""; };
    grid.appendChild(node);
  });
}

function shipSvg(name) {
  const yellow = "#f5d28f";
  const blue = "#53b5ff";
  const red = "#ff365f";
  if (name.includes("Falcon")) return `<svg viewBox="0 0 200 90"><circle cx="70" cy="45" r="28" fill="none" stroke="${yellow}" stroke-width="4"/><rect x="90" y="37" width="55" height="16" fill="none" stroke="${yellow}" stroke-width="4"/><circle cx="54" cy="45" r="5" fill="${blue}"/></svg>`;
  if (name.includes("Death")) return `<svg viewBox="0 0 200 90"><circle cx="100" cy="45" r="30" fill="none" stroke="${red}" stroke-width="4"/><circle cx="112" cy="35" r="8" fill="${red}"/><line x1="72" y1="45" x2="130" y2="45" stroke="${red}" stroke-width="3"/></svg>`;
  if (name.includes("TIE")) return `<svg viewBox="0 0 200 90"><rect x="35" y="22" width="30" height="46" fill="none" stroke="${blue}" stroke-width="4"/><circle cx="100" cy="45" r="15" fill="none" stroke="${blue}" stroke-width="4"/><rect x="135" y="22" width="30" height="46" fill="none" stroke="${blue}" stroke-width="4"/></svg>`;
  if (name.includes("X-Wing")) return `<svg viewBox="0 0 200 90"><line x1="30" y1="20" x2="100" y2="45" stroke="${yellow}" stroke-width="4"/><line x1="30" y1="70" x2="100" y2="45" stroke="${yellow}" stroke-width="4"/><line x1="170" y1="20" x2="100" y2="45" stroke="${yellow}" stroke-width="4"/><line x1="170" y1="70" x2="100" y2="45" stroke="${yellow}" stroke-width="4"/></svg>`;
  if (name.includes("R2")) return `<svg viewBox="0 0 200 90"><rect x="78" y="28" width="45" height="36" rx="6" fill="none" stroke="${blue}" stroke-width="4"/><path d="M84 28 Q100 10 117 28" fill="none" stroke="${blue}" stroke-width="4"/><circle cx="100" cy="40" r="5" fill="${blue}"/></svg>`;
  if (name.includes("C-3PO")) return `<svg viewBox="0 0 200 90"><circle cx="100" cy="28" r="12" fill="none" stroke="${yellow}" stroke-width="4"/><rect x="86" y="41" width="28" height="22" fill="none" stroke="${yellow}" stroke-width="4"/></svg>`;
  return `<svg viewBox="0 0 200 90"><line x1="70" y1="20" x2="120" y2="70" stroke="${blue}" stroke-width="6"/><line x1="130" y1="20" x2="80" y2="70" stroke="${red}" stroke-width="6"/></svg>`;
}

function renderFleet() {
  const grid = q("fleetGrid");
  const tpl = q("fleetTemplate");
  grid.innerHTML = "";
  fleet.forEach((f) => {
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.querySelector("h3").textContent = f.name;
    node.querySelector("p").textContent = f.text;
    node.querySelector(".fleet-art").innerHTML = shipSvg(f.name);
    grid.appendChild(node);
  });
}

function renderTimeline() {
  const wrap = q("duelTimeline");
  const items = [
    "Obi-Wan vs Vader",
    "Luke vs Vader (Bespin)",
    "Duel of the Fates",
    "Anakin vs Obi-Wan (Mustafar)",
    "Luke vs Vader (Death Star II)",
  ];
  wrap.innerHTML = items.map((x, i) => `<div class="rounded-xl border border-zinc-700 bg-zinc-900/65 px-4 py-3"><p class="text-xs uppercase tracking-widest text-zinc-400">Scene ${i + 1}</p><p class="font-medium">${x}</p></div>`).join("");
}

function switchTab(target) {
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active-tab", b.dataset.tab === target));
  q("journalTab").classList.toggle("hidden", target !== "journal");
  q("fleetTab").classList.toggle("hidden", target !== "fleet");
  q("duelTab").classList.toggle("hidden", target !== "duel");
}

function bind() {
  document.querySelectorAll(".tab-btn").forEach((b) => b.onclick = () => switchTab(b.dataset.tab));
  q("saveEntry").onclick = () => {
    const title = q("entryTitle").value.trim() || "Untitled Fragment";
    const text = q("entryText").value.trim();
    const mood = q("entryMood").value;
    if (!text) return;
    const entries = loadEntries();
    entries.unshift({ title, text, mood, ts: Date.now() });
    saveEntries(entries.slice(0, 24));
    q("entryTitle").value = "";
    q("entryText").value = "";
    renderEntries();
  };
  q("randomPrompt").onclick = () => { q("entryText").value = prompts[Math.floor(Math.random() * prompts.length)]; };
  q("sparkVisual").onclick = () => {
    q("heroArt").classList.add("animate-pulse");
    setTimeout(() => q("heroArt").classList.remove("animate-pulse"), 1200);
  };
}

drawStars();
renderEntries();
renderFleet();
renderTimeline();
bind();
