const STORE = "kyberArchiveData";
const TRACKS = {
  ambient: { id: "iotqjyuoi-Y", name: "Analog Drone Loop" },
  battle: { id: "FHuD5y-PZM0", name: "Battle Signal" },
};
let ytPlayer;
let idleSince = Date.now();

function initialData() {
  return { pages: [], transmissions: [], booted: false };
}

function getData() {
  try {
    return JSON.parse(localStorage.getItem(STORE)) || initialData();
  } catch {
    return initialData();
  }
}

function setData(next) {
  localStorage.setItem(STORE, JSON.stringify(next));
}

function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2400);
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function typeLine(node, text, speed = 32, done) {
  node.textContent = "";
  let i = 0;
  const t = setInterval(() => {
    node.textContent += text[i] || "";
    typeClack();
    i += 1;
    if (i >= text.length) {
      clearInterval(t);
      if (done) done();
    }
  }, speed);
}

function analogWhine() {
  const ctx = window.__audioCtx || (window.__audioCtx = new AudioContext());
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(110, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.7);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.85);
}

function typeClack() {
  const ctx = window.__audioCtx || (window.__audioCtx = new AudioContext());
  const noise = ctx.createBufferSource();
  const buffer = ctx.createBuffer(1, 600, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * 0.17;
  noise.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = 0.02;
  noise.connect(gain);
  gain.connect(ctx.destination);
  noise.start();
}

function tapeHiss(volume = 0.008, len = 0.08) {
  const ctx = window.__audioCtx || (window.__audioCtx = new AudioContext());
  const noise = ctx.createBufferSource();
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * 0.4;
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 4000;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start();
}

function setupBoot() {
  const data = getData();
  const boot = document.getElementById("boot");
  if (data.booted) {
    boot.style.display = "none";
    return;
  }
  typeLine(document.getElementById("bootLine"), "> MOUNTING TAPE VOLUME: WHILLS_ARCHIVE.DAT...", 42, () => {
    analogWhine();
    setTimeout(() => {
      document.getElementById("flash").classList.add("on");
      setTimeout(() => {
        boot.style.display = "none";
        const d = getData();
        d.booted = true;
        setData(d);
      }, 360);
    }, 2200);
  });
  document.getElementById("skipBoot").onclick = () => {
    boot.style.display = "none";
    data.booted = true;
    setData(data);
  };
}

function switchView(id) {
  document.querySelectorAll(".viewport").forEach((v) => v.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelector(`.nav-btn[data-view="${id}"]`).classList.add("active");
  playTrack(id === "schematics" ? "battle" : "ambient");
}

function setupNav() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("mouseenter", () => tapeHiss(0.015, 0.1));
    btn.onclick = () => switchView(btn.dataset.view);
  });
}

function saveMythosPage() {
  const title = document.getElementById("mythosTitle").value.trim() || "Untitled Page";
  const text = document.getElementById("mythosText").value.trim();
  if (!text) return toast("Archive page requires text.");
  const data = getData();
  data.pages.unshift({ id: uid(), title, text, created: new Date().toISOString() });
  setData(data);
  document.getElementById("mythosTitle").value = "";
  document.getElementById("mythosText").value = "";
  renderPages();
  toast("PAGE STAMPED TO ARCHIVE");
}

function renderPages() {
  const data = getData();
  const wrap = document.getElementById("mythosPages");
  wrap.innerHTML = "";
  if (!data.pages.length) {
    wrap.innerHTML = `<article class="page">No pages yet. Start the legend.</article>`;
    return;
  }
  data.pages.forEach((p) => {
    const card = document.createElement("article");
    card.className = "page";
    card.innerHTML = `<h3>${p.title}</h3><p>${p.text}</p><small>${new Date(p.created).toLocaleString()}</small>`;
    wrap.appendChild(card);
  });
}

function setupSchematics() {
  const info = document.getElementById("partInfo");
  document.querySelectorAll("#shipSvg [data-part]").forEach((part) => {
    part.addEventListener("mouseenter", () => {
      info.textContent = part.dataset.part;
      info.classList.add("glitch");
      setTimeout(() => info.classList.remove("glitch"), 130);
      tapeHiss(0.012, 0.06);
    });
  });
}

function renderPosters() {
  const grid = document.getElementById("posterGrid");
  const posters = [
    "Twin Suns Broadcast",
    "Rebel Signal Over Scarif",
    "The Last Squadron",
    "Myth of the Kyber Heart",
    "Empire in Vermilion",
    "Jakku Wind Chronicle",
  ];
  posters.forEach((title) => {
    const item = document.createElement("article");
    item.className = "poster";
    item.innerHTML = `<div class="mock"></div><h3>${title}</h3>`;
    grid.appendChild(item);
  });
}

function createTransmission() {
  const seeds = [
    "Yavin rain carries static and prophecy in equal measure.",
    "The archive reports a red moon over Jedha and an uneasy silence.",
    "A pilot swears hyperspace smells like old paper and ion fire.",
    "In the bunker, hope sounds like reels turning in the dark.",
    "A cracked helmet reflects twin suns and a forgotten oath.",
  ];
  const choice = seeds[Math.floor(Math.random() * seeds.length)];
  const data = getData();
  data.transmissions.unshift({ id: uid(), text: choice, created: new Date().toISOString() });
  data.transmissions = data.transmissions.slice(0, 10);
  setData(data);
  renderTransmissions();
}

function renderTransmissions() {
  const data = getData();
  const wrap = document.getElementById("transmissionList");
  wrap.innerHTML = "";
  data.transmissions.forEach((t) => {
    const card = document.createElement("article");
    card.className = "page";
    card.innerHTML = `<p>${t.text}</p><small>${new Date(t.created).toLocaleTimeString()}</small>`;
    wrap.appendChild(card);
  });
}

function trackingGlitch() {
  const desk = document.getElementById("desk");
  desk.style.transform = `skewX(${(Math.random() - 0.5) * 2}deg)`;
  setTimeout(() => { desk.style.transform = ""; }, 50);
}

function setupInteractionIdle() {
  const reels = document.getElementById("reels");
  const ping = () => {
    idleSince = Date.now();
    reels.classList.remove("idle");
  };
  ["mousemove", "keydown", "click", "scroll"].forEach((ev) => addEventListener(ev, ping));
  setInterval(() => {
    if (Date.now() - idleSince > 5000) reels.classList.add("idle");
  }, 1000);
}

function setupEasterEggs() {
  let rapid = [];
  addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "p") {
      document.body.classList.toggle("misprint");
      toast("MISPRINT MODE TOGGLED");
    }
  });
  addEventListener("click", () => {
    const now = Date.now();
    rapid = [...rapid, now].filter((n) => now - n < 1200);
    if (rapid.length >= 5) {
      document.getElementById("burn").classList.add("active");
      setTimeout(() => document.getElementById("burn").classList.remove("active"), 2200);
      toast("CRT OVERLOAD");
      rapid = [];
    }
  });
}

window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
  ytPlayer = new YT.Player("ytPlayer", {
    height: "0",
    width: "0",
    videoId: TRACKS.ambient.id,
    playerVars: { autoplay: 1, controls: 0, rel: 0, playsinline: 1 },
    events: { onReady: (e) => { e.target.setVolume(28); e.target.playVideo(); } },
  });
};

function playTrack(name) {
  const t = TRACKS[name] || TRACKS.ambient;
  if (ytPlayer && ytPlayer.loadVideoById) ytPlayer.loadVideoById(t.id);
}

function init() {
  setupBoot();
  setupNav();
  setupSchematics();
  renderPosters();
  renderPages();
  renderTransmissions();
  setupInteractionIdle();
  setupEasterEggs();
  document.getElementById("saveMythos").onclick = saveMythosPage;
  document.getElementById("genTransmission").onclick = createTransmission;
  document.querySelectorAll("textarea").forEach((ta) => {
    ta.addEventListener("input", typeClack);
  });
  addEventListener("scroll", trackingGlitch, { passive: true });
}

init();
