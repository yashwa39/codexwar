const TRACKS = { ambient: "iotqjyuoi-Y", dark: "vsMWVW4xtwI" };
let ytPlayer;
let currentView = "personnel";
let viewStart = Date.now();
let idleSince = Date.now();
let typed = "";
let rapid = [];

const characters = [
  { name: "Luke Skywalker", side: "jedi", home: "Tatooine", faction: "Rebel Alliance" },
  { name: "Darth Vader", side: "sith", home: "Tatooine", faction: "Galactic Empire" },
  { name: "Leia Organa", side: "neutral", home: "Alderaan", faction: "Rebel Alliance" },
  { name: "Obi-Wan Kenobi", side: "jedi", home: "Stewjon", faction: "Jedi Order" },
  { name: "Palpatine", side: "sith", home: "Naboo", faction: "Sith/Empire" },
];

function tone(freq = 440, duration = 0.06, gainVal = 0.018) {
  const ctx = window.__aCtx || (window.__aCtx = new AudioContext());
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = freq;
  gain.gain.value = gainVal;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2400);
}

function setupStarfield() {
  const canvas = document.getElementById("starCanvas");
  const ctx = canvas.getContext("2d");
  let stars = [];
  const resize = () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    stars = Array.from({ length: 900 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      z: Math.random() * 2 + 0.5,
      s: Math.random() * 0.25 + 0.05,
    }));
  };
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach((st) => {
      st.x += st.s * st.z;
      if (st.x > canvas.width + 2) st.x = -2;
      ctx.fillStyle = `rgba(232,232,255,${0.15 + st.z / 3})`;
      ctx.fillRect(st.x, st.y, st.z, st.z);
    });
    requestAnimationFrame(draw);
  };
  resize();
  draw();
  addEventListener("resize", resize);
}

function setupBoot() {
  const boot = document.getElementById("boot");
  const line = document.getElementById("bootLine");
  const text = "> DECRYPTING WHILLS DATACORE...";
  let i = 0;
  const timer = setInterval(() => {
    line.textContent += text[i] || "";
    tone(760, 0.02, 0.01);
    i += 1;
    if (i >= text.length) {
      clearInterval(timer);
      animateBootSphere();
      setTimeout(() => {
        document.getElementById("flash").classList.add("on");
        setTimeout(() => { boot.style.display = "none"; }, 300);
      }, 1600);
    }
  }, 35);
  document.getElementById("skipBoot").onclick = () => { boot.style.display = "none"; };
}

function animateBootSphere() {
  const c = document.getElementById("deathStarBoot");
  const ctx = c.getContext("2d");
  let t = 0;
  const draw = () => {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#1ceb58";
    for (let i = 0; i < 24; i += 1) {
      const a = (i / 24) * Math.PI * 2 + t;
      const r = 65 + Math.sin(t * 2 + i) * 5;
      const x = c.width / 2 + Math.cos(a) * r;
      const y = c.height / 2 + Math.sin(a) * r * 0.6;
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.stroke();
    }
    t += 0.03;
    if (document.getElementById("boot").style.display !== "none") requestAnimationFrame(draw);
  };
  draw();
}

function setView(id) {
  document.querySelectorAll(".viewport").forEach((v) => v.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelector(`.nav-btn[data-view="${id}"]`).classList.add("active");
  currentView = id;
  viewStart = Date.now();
  if (id === "census") setTimeout(() => { if (currentView === "census") playTrack("dark"); }, 30000);
  else playTrack("ambient");
}

function renderPersonnel() {
  const grid = document.getElementById("personnelGrid");
  grid.innerHTML = "";
  characters.forEach((c) => {
    const card = document.createElement("article");
    card.className = "datacard";
    card.innerHTML = `<div class="portrait"></div><h3>${c.name}</h3><small>${c.faction}</small>`;
    card.onclick = () => openPersonnel(c);
    grid.appendChild(card);
  });
}

function openPersonnel(c) {
  document.getElementById("overlayName").textContent = c.name;
  document.getElementById("overlayMeta").textContent = `${c.home} • ${c.faction}`;
  document.getElementById("overlayLore").textContent =
    `${c.name} remains a volatile force in galactic memory. Rebel analysts describe this figure as a fracture point between myth and propaganda, where private choices reshape public history.`;
  document.getElementById("personnelOverlay").classList.remove("hidden");
}

function setupBloodlines() {
  const svg = d3.select("#bloodlineGraph");
  const nodes = [
    { id: "Anakin", side: "sith" }, { id: "Padme", side: "neutral" }, { id: "Luke", side: "jedi" },
    { id: "Leia", side: "jedi" }, { id: "Palpatine", side: "sith" },
  ];
  const links = [{ source: "Anakin", target: "Luke" }, { source: "Anakin", target: "Leia" }, { source: "Padme", target: "Luke" }, { source: "Padme", target: "Leia" }, { source: "Palpatine", target: "Anakin" }];
  const sim = d3.forceSimulation(nodes).force("link", d3.forceLink(links).id((d) => d.id).distance(130)).force("charge", d3.forceManyBody().strength(-250)).force("center", d3.forceCenter(450, 210));
  const link = svg.selectAll(".link").data(links).join("line").attr("class", "link");
  link.on("click", () => { tone(120, 0.2, 0.03); tone(90, 0.2, 0.02); toast("I am your father."); });
  const node = svg.selectAll(".node").data(nodes).join("g").attr("class", "node").call(d3.drag().on("start", (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }).on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; }).on("end", (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));
  node.append("circle").attr("r", 18).attr("fill", (d) => (d.side === "sith" ? "#ff2a2a" : d.side === "jedi" ? "#00ffff" : "#eaddcd"));
  node.append("text").attr("dy", 4).attr("text-anchor", "middle").attr("fill", "#001300").text((d) => d.id);
  sim.on("tick", () => {
    link.attr("x1", (d) => d.source.x).attr("y1", (d) => d.source.y).attr("x2", (d) => d.target.x).attr("y2", (d) => d.target.y);
    node.attr("transform", (d) => `translate(${d.x},${d.y})`);
  });
}

function setupArmory() {
  const layers = [...document.querySelectorAll(".hilt-layer")];
  gsap.fromTo(layers, { x: -120, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.1, duration: 0.6 });
  document.querySelectorAll(".crystal").forEach((c) => {
    c.onclick = () => {
      const mode = c.dataset.crystal;
      const lore = { green: "Consular. Harmony. Focus.", purple: "Mace Windu. Balance at the edge.", red: "Bled crystal. Pain. Subjugation." };
      document.getElementById("crystalLore").textContent = lore[mode];
      document.body.classList.toggle("red-alert", mode === "red");
      tone(mode === "red" ? 90 : 380, 0.12, 0.03);
    };
  });
}

function renderCensus() {
  const wrap = document.getElementById("factionCarousel");
  ["Galactic Republic", "Sith Empire", "Mandalorians", "Wookiees", "Twi'leks", "Rebel Alliance", "Galactic Empire"].forEach((f) => {
    const card = document.createElement("article");
    card.className = "poster";
    card.innerHTML = `<div class="mock"></div><h3>${f}</h3><p>Socio-political archive briefing.</p>`;
    wrap.appendChild(card);
  });
  document.getElementById("order66Btn").onclick = () => {
    document.querySelectorAll(".datacard").forEach((card) => {
      if (card.textContent.includes("Luke") || card.textContent.includes("Obi-Wan")) {
        card.style.transition = "all 0.5s ease";
        card.style.opacity = "0";
        card.style.transform = "scale(0.6) translateY(30px)";
      }
    });
    toast("Order 66 Protocol executed.");
  };
}

function renderTapes() {
  const shelf = document.getElementById("tapeShelf");
  ["I", "II", "III", "IV", "V", "VI"].forEach((ep) => {
    const card = document.createElement("article");
    card.className = "poster";
    card.innerHTML = `<div class="mock"></div><h3>Episode ${ep}</h3>`;
    card.onclick = () => openModal(`Episode ${ep}`, "Crawl summary, key conflicts, and legacy impact.");
    shelf.appendChild(card);
  });
}

function openModal(title, body) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").textContent = body;
  document.getElementById("modal").classList.remove("hidden");
  tone(180, 0.1, 0.03);
}

function setupGlobal() {
  document.getElementById("closeModal").onclick = () => document.getElementById("modal").classList.add("hidden");
  document.getElementById("closeOverlay").onclick = () => document.getElementById("personnelOverlay").classList.add("hidden");
  document.querySelectorAll(".nav-btn").forEach((b) => { b.onclick = () => setView(b.dataset.view); b.onmouseenter = () => tone(640, 0.03, 0.01); });
  document.getElementById("loadPersonnel").onclick = renderPersonnel;
  document.getElementById("personnelQuery").addEventListener("input", () => tone(720, 0.02, 0.008));
  addEventListener("keydown", (e) => {
    typed = (typed + e.key).toUpperCase().slice(-10);
    if (typed.includes("REVAN")) { document.body.classList.toggle("misprint"); toast("Old Republic archive unlocked."); }
  });
  addEventListener("click", () => {
    rapid = [...rapid, Date.now()].filter((x) => Date.now() - x < 1200);
    if (rapid.length >= 5) { document.getElementById("burn").classList.add("active"); setTimeout(() => document.getElementById("burn").classList.remove("active"), 2000); rapid = []; }
  });
  ["mousemove", "click", "keydown", "scroll"].forEach((ev) => addEventListener(ev, () => { idleSince = Date.now(); document.getElementById("reels").classList.remove("idle"); }));
  setInterval(() => { if (Date.now() - idleSince > 5000) document.getElementById("reels").classList.add("idle"); }, 1000);
}

window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
  ytPlayer = new YT.Player("ytPlayer", {
    height: "0", width: "0", videoId: TRACKS.ambient,
    playerVars: { autoplay: 1, controls: 0, rel: 0, playsinline: 1 },
    events: { onReady: (e) => { e.target.setVolume(28); e.target.playVideo(); } },
  });
};
function playTrack(name) {
  if (ytPlayer && ytPlayer.loadVideoById) ytPlayer.loadVideoById(TRACKS[name] || TRACKS.ambient);
}

function init() {
  setupStarfield();
  setupBoot();
  renderPersonnel();
  setupBloodlines();
  setupArmory();
  renderCensus();
  renderTapes();
  setupGlobal();
}

init();
