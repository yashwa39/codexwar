const STORAGE_KEY = "holocronData";
const moods = {
  dark: ["RAGE", "POWER", "OBSESSION", "GRIEF", "AMBITION"],
  jedi: ["SERENITY", "WISDOM", "COURAGE", "HOPE", "GRATITUDE"],
};
const tracks = {
  duel: { id: "D_2bluVPsb0", name: "Duel of the Fates" },
  binary: { id: "1gpXMGit4P8", name: "Binary Sunset (Force Theme)" },
  across: { id: "7wMiMDBHnJ0", name: "Across the Stars" },
  imperial: { id: "vsMWVW4xtwI", name: "The Imperial March" },
  rey: { id: "65As1V0vQDM", name: "Rey's Theme" },
  heroes: { id: "FHuD5y-PZM0", name: "Battle of the Heroes" },
};
let ytPlayer;
let currentTrack = "binary";
let idleTimer;
let starClickTimes = [];
let konami = [];
const konamiCode = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function initialData() {
  const now = new Date().toISOString();
  return { entries: [], goals: [], firstVisit: now, introPlayed: false, forceSide: "balanced" };
}

function readData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || initialData();
  } catch {
    return initialData();
  }
}

function writeData(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

function renderMoods(target, side) {
  const wrap = document.getElementById(target);
  wrap.innerHTML = "";
  moods[side].forEach((m, i) => {
    const b = document.createElement("button");
    b.textContent = m;
    if (i === 0) b.classList.add("active");
    b.onclick = () => {
      [...wrap.children].forEach((n) => n.classList.remove("active"));
      b.classList.add("active");
    };
    wrap.appendChild(b);
  });
}

function activeMood(id) {
  const active = document.querySelector(`#${id} button.active`);
  return active ? active.textContent : "";
}

function saveEntry(section) {
  const title = document.getElementById(`${section}Title`).value.trim() || "Untitled Fragment";
  const content = document.getElementById(`${section}Content`).value.trim();
  if (!content) return showToast("The Force is dormant. Begin encoding.");
  const data = readData();
  const entry = {
    id: uuid(),
    section,
    title,
    content,
    mood: section === "dream" ? "VISION" : activeMood(`${section}Moods`),
    timestamp: new Date().toISOString(),
    dreamInterpretation: null,
  };
  data.entries.unshift(entry);
  writeData(data);
  document.getElementById(`${section}Content`).value = "";
  renderAll();
  showToast("FRAGMENT ENCODED IN THE FORCE");
  pulseEditor(section);
}

function pulseEditor(section) {
  const el = document.getElementById(`${section}Content`);
  el.style.boxShadow = "0 0 0 2px rgba(139,0,0,0.75)";
  setTimeout(() => (el.style.boxShadow = ""), 120);
}

function renderEntries(section, target) {
  const data = readData();
  const list = data.entries.filter((e) => e.section === section);
  const box = document.getElementById(target);
  box.innerHTML = "";
  if (!list.length) {
    box.innerHTML = `<div class="entry-card">The Force is dormant. Begin encoding.</div>`;
    return;
  }
  list.forEach((e) => {
    const card = document.createElement("article");
    card.className = `entry-card ${section === "dark" ? "dark" : section === "dream" ? "dream" : ""}`;
    card.innerHTML = `<h3>${e.title}</h3><p>${e.content}</p><small>${new Date(e.timestamp).toLocaleString()}</small><br/><small>${e.mood}</small>`;
    if (section === "dream") {
      const btn = document.createElement("button");
      btn.className = "ghost-btn";
      btn.textContent = "Dream Decoder";
      btn.onclick = () => decodeDream(e.id);
      card.appendChild(document.createElement("br"));
      card.appendChild(btn);
      if (e.dreamInterpretation) {
        const res = document.createElement("p");
        res.textContent = e.dreamInterpretation;
        card.appendChild(res);
      }
    }
    box.appendChild(card);
  });
}

async function decodeDream(entryId) {
  const data = readData();
  const item = data.entries.find((e) => e.id === entryId);
  if (!item) return;
  const fallback = "Visions ripple through the Living Force. Your dream reflects a crossroads like Luke on Dagobah: fear and hope both call you. Trust the quiet current, and the kyber within will answer.";
  try {
    const apiKey = window.ANTHROPIC_API_KEY || "";
    if (!apiKey) throw new Error("No API key");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 220,
        messages: [{
          role: "user",
          content: `Interpret this dream through the lens of Star Wars mythology and the Force. What does it mean for this Force-sensitive traveler? Be poetic, mystical, and reference actual Star Wars lore.\n\nDream:\n${item.content}`,
        }],
      }),
    });
    const json = await res.json();
    item.dreamInterpretation = json.content?.[0]?.text || fallback;
  } catch {
    item.dreamInterpretation = fallback;
  }
  writeData(data);
  renderEntries("dream", "dreamEntries");
}

function renderGoals() {
  const data = readData();
  const list = document.getElementById("goalsList");
  list.innerHTML = "";
  if (!data.goals.length) {
    list.innerHTML = `<div class="goal-card">The Force is dormant. Begin encoding.</div>`;
    return;
  }
  data.goals.forEach((g) => {
    const card = document.createElement("div");
    card.className = "goal-card";
    card.innerHTML = `<strong>${g.title}</strong><div>${g.priority} • ${g.status}</div>
      <div class="bar"><span style="width:${g.progress}%"></span></div>`;
    const plus = document.createElement("button");
    plus.textContent = "+10%";
    plus.onclick = () => updateGoal(g.id, Math.min(g.progress + 10, 100), g.status);
    const complete = document.createElement("button");
    complete.textContent = "COMPLETE";
    complete.onclick = () => updateGoal(g.id, 100, "COMPLETE");
    const abandon = document.createElement("button");
    abandon.textContent = "ABANDON";
    abandon.onclick = () => updateGoal(g.id, g.progress, "ABANDONED");
    card.append(plus, complete, abandon);
    list.appendChild(card);
  });
}

function updateGoal(id, progress, status) {
  const data = readData();
  const g = data.goals.find((x) => x.id === id);
  if (!g) return;
  g.progress = progress;
  g.status = status;
  if (status === "COMPLETE") showToast("THE FORCE IS STRONG WITH THIS ONE");
  if (status === "ABANDONED") showToast("PATHWAY TO MANY ABILITIES SOME CONSIDER UNNATURAL");
  writeData(data);
  renderAll();
  if (data.goals.length && data.goals.every((x) => x.status === "COMPLETE")) triggerOrder66Averted();
}

function addGoal() {
  const title = document.getElementById("goalTitle").value.trim();
  if (!title) return;
  const priority = document.getElementById("goalPriority").value;
  const data = readData();
  data.goals.unshift({
    id: uuid(),
    title,
    priority,
    progress: 0,
    status: "ACTIVE",
    created: new Date().toISOString(),
  });
  writeData(data);
  document.getElementById("goalTitle").value = "";
  renderGoals();
  showToast("MISSION OBJECTIVE ENCODED");
}

function renderHud() {
  const data = readData();
  const dark = data.entries.filter((e) => e.section === "dark").length;
  const jedi = data.entries.filter((e) => e.section === "jedi").length;
  const total = dark + jedi || 1;
  const darkPct = Math.round((dark / total) * 100);
  const days = Math.max(1, Math.ceil((Date.now() - new Date(data.firstVisit).getTime()) / 86400000));
  document.getElementById("forceHud").innerHTML = `ALIGNMENT: ${darkPct}% SITH | ENTRIES: ${data.entries.length} | DAYS AS PADAWAN: ${days}`;
  document.getElementById("alignmentMeter").innerHTML = `
    <div>JEDI ${100 - darkPct}% ⚖ SITH ${darkPct}%</div>
    <div class="bar"><span style="width:${darkPct}%; background: linear-gradient(90deg,#4fc3f7,#8b0000)"></span></div>
  `;
}

function renderAll() {
  renderEntries("dark", "darkEntries");
  renderEntries("jedi", "jediEntries");
  renderEntries("dream", "dreamEntries");
  renderGoals();
  renderHud();
}

function setActivePanel(id) {
  document.querySelectorAll(".section-panel").forEach((p) => p.classList.remove("active"));
  const panel = document.getElementById(id);
  if (panel) panel.classList.add("active");
}

function setupNavigation() {
  const radial = document.getElementById("radialMenu");
  document.getElementById("navCore").onclick = () => radial.classList.toggle("open");
  radial.querySelectorAll("button").forEach((b) => {
    b.onmouseenter = () => uiBeep();
    b.onclick = () => {
      setActivePanel(b.dataset.target);
      playTrack(b.dataset.track);
      radial.classList.remove("open");
    };
  });
}

function uiBeep(freq = 680, duration = 0.04) {
  const ctx = window.__audioCtx || (window.__audioCtx = new AudioContext());
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.value = 0.02;
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function requestTransmission() {
  const prompts = [
    "On Mustafar, what part of your soul still burns, and what refuses to turn to ash?",
    "If Yoda visited your dreams tonight, what one unfinished lesson would he refuse to leave unsaid?",
    "At the edge of the Dune Sea, what memory follows you like a twin sunset?",
    "Write the message you would hide inside an old Jedi holocron for your future self.",
    "Which fear in you sounds most like Vader breathing in a silent corridor?",
    "If the Force gave you one vision on Ahch-To, what truth would it show first?",
    "Describe a promise you made in the dark that now asks to be redeemed in the light.",
    "What part of your life feels like an uncharted hyperlane waiting for courage?",
    "If Leia handed you command of hope for one day, what would you protect first?",
    "What did you lose at Geonosis within yourself, and what can still be rebuilt?",
  ];
  const grid = document.getElementById("echoGrid");
  grid.innerHTML = "";
  prompts.forEach((p) => {
    const c = document.createElement("article");
    c.className = "entry-card";
    const txt = document.createElement("p");
    typewriter(txt, p);
    const use = document.createElement("button");
    use.className = "ghost-btn";
    use.textContent = "USE THIS PROMPT";
    use.onclick = () => {
      setActivePanel("jediPanel");
      document.getElementById("jediContent").value = p;
      playTrack("binary");
    };
    c.append(txt, use);
    grid.appendChild(c);
  });
}

function typewriter(el, text) {
  el.textContent = "";
  let i = 0;
  const timer = setInterval(() => {
    el.textContent += text[i] || "";
    if (i % 8 === 0) uiBeep(880, 0.02);
    i += 1;
    if (i >= text.length) clearInterval(timer);
  }, 15);
}

function setupIntro() {
  const data = readData();
  const intro = document.getElementById("introSequence");
  if (data.introPlayed) return (intro.style.display = "none");
  const line = document.getElementById("introLine");
  const crawl = document.getElementById("crawl");
  const holocron = document.getElementById("introHolocron");
  gsap.timeline({
    onComplete: () => {
      intro.style.display = "none";
      const d = readData();
      d.introPlayed = true;
      writeData(d);
      lightsaberIgnition();
    },
  })
    .to(line, { opacity: 1, duration: 1.2 })
    .to(line, { opacity: 0, duration: 0.7, delay: 0.8 })
    .to(crawl, { opacity: 1, duration: 0.8 })
    .to(crawl, { opacity: 0, duration: 0.7, delay: 2.2 })
    .to(holocron, { opacity: 1, duration: 0.9 })
    .to(holocron, { scale: 2.2, opacity: 0, duration: 0.8, ease: "power2.in" });
  document.getElementById("skipIntro").onclick = () => {
    intro.style.display = "none";
    data.introPlayed = true;
    writeData(data);
  };
}

function lightsaberIgnition() {
  const ctx = window.__audioCtx || (window.__audioCtx = new AudioContext());
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(90, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(270, ctx.currentTime + 0.25);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.5);
}

function setupAudioPanel() {
  const panel = document.getElementById("audioPanel");
  document.getElementById("audioToggle").onclick = () => panel.classList.toggle("hidden");
  document.getElementById("silenceBtn").onclick = () => fadeVolume(0);
  document.getElementById("volumeControl").oninput = (e) => {
    const v = Number(e.target.value);
    if (ytPlayer && ytPlayer.setVolume) ytPlayer.setVolume(v);
  };
}

function playTrack(name) {
  currentTrack = name;
  const t = tracks[name] || tracks.binary;
  document.getElementById("trackName").textContent = t.name;
  if (ytPlayer && ytPlayer.loadVideoById) {
    ytPlayer.loadVideoById(t.id);
    ytPlayer.playVideo();
  }
}

function fadeVolume(target) {
  if (!ytPlayer || !ytPlayer.getVolume) return;
  let vol = ytPlayer.getVolume();
  const step = target > vol ? 2 : -2;
  const timer = setInterval(() => {
    vol += step;
    ytPlayer.setVolume(Math.max(0, Math.min(100, vol)));
    if ((step > 0 && vol >= target) || (step < 0 && vol <= target)) clearInterval(timer);
  }, 40);
}

window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
  ytPlayer = new YT.Player("ytPlayer", {
    height: "0",
    width: "0",
    videoId: tracks.binary.id,
    playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0, playsinline: 1 },
    events: {
      onReady: (e) => {
        e.target.setVolume(40);
        e.target.playVideo();
      },
    },
  });
};

function setupCanvasStars() {
  const canvas = document.getElementById("starfield");
  const ctx = canvas.getContext("2d");
  let stars = [];
  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    stars = Array.from({ length: 850 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      z: Math.random() * 4 + 0.5, // Parallax depth
      a: Math.random(),
      tw: Math.random() * 0.02 + 0.005,
      color: Math.random() > 0.9 ? "#4fc3f7" : "#e8e8ff",
    }));
  }
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const speed = document.getElementById("dreamPanel").classList.contains("active") ? 0.6 : 0.15;
    stars.forEach((s) => {
      s.a += s.tw;
      if (s.a > 1 || s.a < 0.2) s.tw *= -1;
      
      // Moving at different speeds based on 'z' depth
      s.x += speed * s.z;
      if (s.x > canvas.width) s.x = 0;
      
      const size = s.z * 0.6;
      ctx.fillStyle = s.color;
      ctx.globalAlpha = s.a;
      ctx.fillRect(s.x, s.y, size, size);
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  resize();
  draw();
  addEventListener("resize", resize);
  canvas.addEventListener("click", () => {
    const now = Date.now();
    starClickTimes = [...starClickTimes, now].filter((x) => now - x < 1200);
    if (starClickTimes.length >= 5) hyperspaceJump();
  });
}

function hyperspaceJump() {
  const canvas = document.getElementById("starfield");
  canvas.style.transition = "transform 0.15s linear, filter 0.15s linear";
  canvas.style.transform = "scaleX(1.4)";
  canvas.style.filter = "blur(2px)";
  setTimeout(() => {
    canvas.style.transform = "";
    canvas.style.filter = "";
  }, 2000);
}

function setupEasterEggs() {
  document.addEventListener("keydown", (e) => {
    konami.push(e.key);
    konami = konami.slice(-konamiCode.length);
    if (konami.join(",").toLowerCase() === konamiCode.join(",").toLowerCase()) {
      playTrack("imperial");
      showToast("YOU HAVE JOINED THE EMPIRE");
      document.body.style.filter = "hue-rotate(320deg) saturate(130%)";
      setTimeout(() => (document.body.style.filter = ""), 10000);
    }
    detectNoTry(e);
  });
  setupIdle();
}

let typedBuffer = "";
function detectNoTry(e) {
  if (e.key.length !== 1) return;
  typedBuffer = (typedBuffer + e.key).toUpperCase().slice(-16);
  if (typedBuffer.includes("THERE IS NO TRY")) {
    showToast('Do. Or do not. There is no try.');
    document.querySelectorAll("textarea").forEach((t) => {
      t.style.boxShadow = "0 0 0 2px #39FF14, 0 0 16px #39FF14";
      setTimeout(() => (t.style.boxShadow = ""), 1200);
    });
  }
}

function setupIdle() {
  const ping = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      uiBeep(520, 0.06);
      const r2 = document.createElement("div");
      r2.textContent = "🤖";
      r2.style.cssText = "position:fixed;bottom:6px;left:-30px;z-index:120;font-size:22px;transition:left 5s linear;";
      document.body.appendChild(r2);
      requestAnimationFrame(() => (r2.style.left = "105vw"));
      setTimeout(() => r2.remove(), 5200);
    }, 180000);
  };
  ["mousemove", "keydown", "click", "scroll"].forEach((ev) => addEventListener(ev, ping));
  ping();
}

function triggerOrder66Averted() {
  showToast("Order 66 Averted");
  for (let i = 0; i < 70; i += 1) {
    const p = document.createElement("div");
    p.style.cssText = `position:fixed;left:${Math.random()*100}vw;top:-10px;width:8px;height:12px;background:${
      ["#f04848", "#ffffff", "#ff9f1a"][i % 3]
    };z-index:130;animation:fall 2.8s linear forwards;`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 3000);
  }
}

function setupHallucinationMode() {
  document.getElementById("hallucination").onchange = (e) => {
    document.getElementById("dreamPanel").style.filter = e.target.checked
      ? "hue-rotate(90deg) saturate(200%) blur(0.5px)"
      : "";
  };
}

function setupBlurTitle() {
  setInterval(() => {
    if (document.hidden) {
      document.title = document.title.includes("Holocron") ? "✨ The Force Awaits" : "🌌 Holocron Codex";
    }
  }, 4000);
}

function galacticClock() {
  setInterval(() => {
    const now = new Date();
    const t = now.toLocaleTimeString();
    const brand = document.querySelector(".brand");
    brand.textContent = `THE HOLOCRON CODEX :: ${t.replaceAll(":", " • ")}`;
  }, 1000);
}

function init() {
  renderMoods("darkMoods", "dark");
  renderMoods("jediMoods", "jedi");
  renderAll();
  setActivePanel("jediPanel");
  setupNavigation();
  setupIntro();
  setupAudioPanel();
  setupCanvasStars();
  setupEasterEggs();
  setupHallucinationMode();
  setupBlurTitle();
  galacticClock();

  document.getElementById("saveDark").onclick = () => saveEntry("dark");
  document.getElementById("saveJedi").onclick = () => saveEntry("jedi");
  document.getElementById("saveDream").onclick = () => saveEntry("dream");
  document.getElementById("addGoal").onclick = addGoal;
  document.getElementById("requestTransmission").onclick = requestTransmission;

  document.querySelectorAll("textarea").forEach((t) => {
    t.addEventListener("input", () => {
      if (t.id.includes("dark")) pulseEditor("dark");
      if (t.id.includes("jedi")) pulseEditor("jedi");
    });
  });
}

const style = document.createElement("style");
style.textContent = "@keyframes fall {to {transform:translateY(105vh) rotate(360deg); opacity:0.7;}}";
document.head.appendChild(style);
init();
