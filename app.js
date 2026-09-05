(() => {
  "use strict";

  const PREFIX = "norte-ale:";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const read = (key, fallback) => {
    try {
      const value = localStorage.getItem(PREFIX + key);
      return value === null ? fallback : JSON.parse(value);
    } catch (_) { return fallback; }
  };
  const write = (key, value) => {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (_) { /* storage unavailable */ }
  };
  try { localStorage.removeItem(PREFIX + "north-tasks"); } catch (_) { /* dado antigo indisponível */ }
  const formatTime = seconds => {
    const safe = Math.max(0, Math.floor(seconds));
    return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
  };

  let toastTimer;
  const toast = message => {
    const el = $("#toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2500);
  };

  /* Navegação e entrada */
  const views = $$(".view");
  const viewAliases = { calmView: "rainView", animeView: "libraryView" };
  let currentView = "homeView";

  function showView(requested, remember = true) {
    const id = viewAliases[requested] || requested;
    const target = document.getElementById(id) || $("#homeView");
    currentView = target.id;
    views.forEach(view => {
      const active = view === target;
      view.hidden = !active;
      view.classList.toggle("active", active);
    });
    $$(".main-nav [data-view]").forEach(button => button.classList.toggle("active", button.dataset.view === currentView || (currentView === "homeView" && button.dataset.view === "aquariumView")));
    $$("details[open]").forEach(item => item.removeAttribute("open"));
    if (remember) write("active-view", currentView);
    if (currentView === "aquariumView") startFishLoop(); else stopFishLoop();
    if (currentView === "journalView") renderJournalList();
    if (currentView === "libraryView") renderAnimeShelf();
    if (currentView === "memoriesView") renderMemories();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  $$('[data-view]').forEach(button => button.addEventListener("click", () => showView(button.dataset.view)));

  const entry = $("#entryScreen");
  const dismissEntry = () => {
    entry.classList.add("done");
    write("entry-seen", true);
    setTimeout(() => entry.hidden = true, 750);
  };
  $("#skipEntry").addEventListener("click", dismissEntry);
  $("#replayEntry").addEventListener("click", () => {
    entry.hidden = false;
    requestAnimationFrame(() => entry.classList.remove("done"));
    setTimeout(dismissEntry, 2700);
  });
  setTimeout(dismissEntry, read("entry-seen", false) ? 1900 : 3100);

  const lightMode = $("#lightMode");
  function setLightMode(active) {
    document.body.classList.toggle("performance-mode", active);
    lightMode.setAttribute("aria-pressed", String(active));
    lightMode.lastChild.textContent = active ? " Modo vivo" : " Modo leve";
    write("performance-mode", active);
  }
  setLightMode(read("performance-mode", false));
  lightMode.addEventListener("click", () => setLightMode(!document.body.classList.contains("performance-mode")));

  /* Atmosfera */
  function makeAtmosphere() {
    const rain = $("#globalRain");
    const particles = $("#ambientParticles");
    for (let i = 0; i < 34; i += 1) {
      const drop = document.createElement("i");
      drop.style.left = `${Math.random() * 100}%`;
      drop.style.animationDelay = `${-Math.random() * 2}s`;
      drop.style.animationDuration = `${.9 + Math.random() * .9}s`;
      rain.append(drop);
    }
    for (let i = 0; i < 14; i += 1) {
      const mote = document.createElement("i");
      mote.style.left = `${Math.random() * 100}%`;
      mote.style.top = `${15 + Math.random() * 80}%`;
      mote.style.animationDelay = `${-Math.random() * 8}s`;
      particles.append(mote);
    }
  }

  function makeLivingHome() {
    const bubbles = $("#heroBubbles");
    for (let i = 0; i < 15; i += 1) {
      const bubble = document.createElement("i");
      bubble.style.cssText = `left:${Math.random()*100}%;--s:${2+Math.random()*6}px;--d:${4+Math.random()*5}s;--delay:${-Math.random()*8}s`;
      bubbles.append(bubble);
    }
    const fish = $("#heroFish");
    [{ col:2,row:0,y:18,size:26,speed:15,delay:-3,dir:-1 },{ col:1,row:0,y:56,size:31,speed:19,delay:-11,dir:-1 },{ col:0,row:1,y:35,size:25,speed:22,delay:-16,dir:-1 }].forEach(item => {
      const swimmer = document.createElement("i");
      swimmer.style.cssText = `--fish-col:${item.col};--fish-row:${item.row};--y:${item.y}px;--size:${item.size}px;--speed:${item.speed}s;--delay:${item.delay}s;--dir:${item.dir}`;
      fish.append(swimmer);
    });
    const sky = $("#mapSky");
    for (let i = 0; i < 7; i += 1) {
      const star = document.createElement("i");
      star.style.cssText = `--left:${8+Math.random()*75}%;--delay:${-Math.random()*8}s`;
      sky.append(star);
    }
  }

  const phaseLabel = hour => hour < 6 ? "dawn" : hour < 12 ? "morning" : hour < 18 ? "afternoon" : "night";
  function updateClock() {
    const now = new Date();
    $("#clock").textContent = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    $("#date").textContent = now.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
    const phase=phaseLabel(now.getHours());
    document.body.dataset.phase = phase;
    $("#phaseMessage").textContent = ({dawn:"A madrugada deixa tudo mais quieto.",morning:"Um começo leve para o seu dia.",afternoon:"Uma pausa também cabe na tarde.",night:"Dias assim também são bonitos."})[phase];
  }
  updateClock();
  setInterval(updateClock, 15000);

  const calmMessages = [
    "Você está exatamente onde precisa estar.",
    "Respira. Você chegou no seu cantinho.",
    "Cuide da sua paz, um minuto de cada vez.",
    "Nem todo momento precisa ser produtivo.",
    "Hoje também pode terminar com calma."
  ];
  const quotes = [
    "“Um cantinho tranquilo, em algum lugar, sempre será um bom plano.”",
    "“Coisas bonitas também crescem devagar.”",
    "“A noite fica menor quando a gente acende uma luz.”",
    "“Respirar fundo também é seguir em frente.”",
    "“Há dias em que descansar já é suficiente.”"
  ];
  let messageIndex = 0;
  let quoteIndex = 0;
  $("#nextMessage").addEventListener("click", () => {
    messageIndex = (messageIndex + 1) % calmMessages.length;
    $("#calmMessage").textContent = calmMessages[messageIndex];
  });
  $("#nextQuote").addEventListener("click", () => {
    quoteIndex = (quoteIndex + 1) % quotes.length;
    $("#quoteText").textContent = quotes[quoteIndex];
  });
  $("#secretStar").addEventListener("click", event => {
    event.currentTarget.classList.add("burst");
    toast("Uma estrela cadente passou pelo seu cantinho ✦");
    setTimeout(() => event.currentTarget.classList.remove("burst"), 700);
  });
  $("#sleepingCat").addEventListener("click", event => {
    event.currentTarget.classList.add("awake");
    $("#catMessage").textContent = "mrrp… ele abriu um olhinho";
    setTimeout(() => {
      event.currentTarget.classList.remove("awake");
      $("#catMessage").textContent = "psiu… ele voltou a dormir";
    }, 2300);
  });
  $("#lakeSecret").addEventListener("click", () => {
    $("#mapWhisper").textContent = "uma estrela riscou o lago — segredo encontrado ✦";
    $("#mapSky").animate([{ opacity:.3 },{ opacity:1 },{ opacity:.3 }],{ duration:1400,easing:"ease-out" });
    toast("Você encontrou o lago secreto da noite.");
  });
  $("#shootingStar").addEventListener("click",()=>{
    const star=document.createElement("i");
    star.style.setProperty("--top",`${12+Math.random()*28}%`);
    $("#lakeStars").append(star);
    setTimeout(()=>star.remove(),1500);
    toast("Um pedido ficou guardado na noite ✦");
  });
  const heroScene=$(".aquarium-feature");
  heroScene.addEventListener("pointermove",event=>{
    if(document.body.classList.contains("performance-mode"))return;
    const box=heroScene.getBoundingClientRect();
    const x=(event.clientX-box.left)/box.width-.5;
    const y=(event.clientY-box.top)/box.height-.5;
    $(".hero-water").style.transform=`translate(${x*8}px,${y*5}px)`;
    $(".hero-fish").style.transform=`translate(${x*-6}px,${y*-4}px)`;
  });
  heroScene.addEventListener("pointerleave",()=>{$(".hero-water").style.transform="";$(".hero-fish").style.transform="";});

  /* Música */
  const tracks = [
    { id: "rFZHOHl-L8A", name: "Luzes da Cidade", meta: "lofi · 2 AM", duration: 216 },
    { id: "5yx6BWlEVcY", name: "Chillhop da Janela", meta: "jazzhop · noite", duration: 240 },
    { id: "4xDzrJKXOOY", name: "Estrada Neon", meta: "synthwave · madrugada", duration: 250 },
    { id: "lTRiuFIWV54", name: "1 A.M. Study", meta: "foco · chuva", duration: 270 }
  ];
  let trackIndex = Math.max(0, tracks.findIndex(track => track.id === read("music-station", read("station", tracks[0].id))));
  let trackPlaying = false;
  let trackElapsed = 0;
  let trackTimer = null;
  let repeatTrack = read("music-repeat", false);
  let shuffleTrack = read("music-shuffle", false);
  let favoriteTracks = read("favorite-tracks", []);
  const playerFrame = $("#youtubePlayer");
  const youtubeCommand = (func, args = []) => playerFrame.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");

  function buildPlaylist() {
    $("#playlist").innerHTML = "";
    tracks.forEach((track, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = index === trackIndex ? "active" : "";
      button.innerHTML = `<b>${String(index + 1).padStart(2, "0")}</b><span><strong>${track.name}</strong><small>${track.meta} · ${formatTime(track.duration)}</small></span>`;
      button.addEventListener("click", () => loadTrack(index, true));
      $("#playlist").append(button);
    });
  }
  function updateMusicUI() {
    const track = tracks[trackIndex];
    $("#trackName").textContent = track.name;
    $("#trackStyle").textContent = track.meta;
    $("#trackDuration").textContent = formatTime(track.duration);
    $("#trackCurrent").textContent = formatTime(trackElapsed);
    $("#trackProgress").style.width = `${(trackElapsed / track.duration) * 100}%`;
    $("#playTrack").textContent = trackPlaying ? "Ⅱ" : "▶";
    $("#musicPageTitle").textContent = track.name;
    $("#musicPageMeta").textContent = track.meta;
    $$('[data-player-action="toggle"]').forEach(button => button.textContent = trackPlaying ? "Ⅱ pausar" : "▶ tocar");
    $(".vinyl").classList.toggle("playing", trackPlaying);
    $("#favoriteTrack").textContent = favoriteTracks.includes(track.id) ? "♥" : "♡";
    $("#favoriteTrack").classList.toggle("active", favoriteTracks.includes(track.id));
    $("#repeatTrack").classList.toggle("active", repeatTrack);
    $("#shuffleTrack").classList.toggle("active", shuffleTrack);
    $$("#playlist button").forEach((button, index) => button.classList.toggle("active", index === trackIndex));
  }
  function loadTrack(index, autoplay = false) {
    trackIndex = (index + tracks.length) % tracks.length;
    trackElapsed = 0;
    write("music-station", tracks[trackIndex].id);
    playerFrame.src = `https://www.youtube-nocookie.com/embed/${tracks[trackIndex].id}?enablejsapi=1&rel=0`;
    buildPlaylist();
    updateMusicUI();
    if (autoplay) setTimeout(() => setTrackPlaying(true), 650);
  }
  function nextMusic() {
    const next = shuffleTrack ? Math.floor(Math.random() * tracks.length) : trackIndex + 1;
    loadTrack(next, trackPlaying);
  }
  function setTrackPlaying(active) {
    trackPlaying = active;
    youtubeCommand(active ? "playVideo" : "pauseVideo");
    if(active)youtubeCommand("setVolume",[Number($('[data-mix-volume="music"]')?.value||42)]);
    clearInterval(trackTimer);
    if (active) {
      trackTimer = setInterval(() => {
        trackElapsed += 1;
        if (trackElapsed >= tracks[trackIndex].duration) {
          if (repeatTrack) loadTrack(trackIndex, true);
          else nextMusic();
        }
        updateMusicUI();
      }, 1000);
    }
    updateMusicUI();
    syncSoundButtons("music");
  }
  $("#playTrack").addEventListener("click", () => setTrackPlaying(!trackPlaying));
  $("#nextTrack").addEventListener("click", nextMusic);
  $("#previousTrack").addEventListener("click", () => loadTrack(trackIndex - 1, trackPlaying));
  $("#repeatTrack").addEventListener("click", () => { repeatTrack = !repeatTrack; write("music-repeat", repeatTrack); updateMusicUI(); });
  $("#shuffleTrack").addEventListener("click", () => { shuffleTrack = !shuffleTrack; write("music-shuffle", shuffleTrack); updateMusicUI(); });
  $("#favoriteTrack").addEventListener("click", () => {
    const id = tracks[trackIndex].id;
    favoriteTracks = favoriteTracks.includes(id) ? favoriteTracks.filter(item => item !== id) : [...favoriteTracks, id];
    write("favorite-tracks", favoriteTracks);
    updateMusicUI();
  });
  $$('[data-player-action]').forEach(button => button.addEventListener("click", () => {
    if (button.dataset.playerAction === "toggle") setTrackPlaying(!trackPlaying);
    if (button.dataset.playerAction === "next") nextMusic();
    if (button.dataset.playerAction === "previous") loadTrack(trackIndex - 1, trackPlaying);
  }));
  buildPlaylist();
  updateMusicUI();

  /* Diário sem atraso durante a digitação */
  let journalPages = read("journal-pages", []);
  if (!Array.isArray(journalPages)) journalPages = [];
  let activeNoteId = journalPages[0]?.id || null;
  let journalTimer;
  const noteTitle = note => note.title?.trim() || note.body?.trim().split(/\n/)[0].slice(0, 32) || "Página sem título";
  const noteDate = value => new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  function activeNote() { return journalPages.find(note => note.id === activeNoteId); }
  function updateWordCount() {
    const text = $("#journalBody").value.trim();
    $("#journalWords").textContent = `${text ? text.split(/\s+/).length : 0} palavras`;
  }
  function syncLatestNote() {
    const note = [...journalPages].sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
    $("#latestNote").textContent = note?.body?.trim() ? `“${note.body.trim().slice(0, 110)}${note.body.trim().length > 110 ? "…" : ""}”` : "“Hoje foi um dia tranquilo. E isso já é o suficiente.”";
    $("#latestNoteDate").textContent = note ? noteDate(note.updatedAt) : "Seu diário espera por você";
  }
  function saveNote(render = false) {
    const body = $("#journalBody").value;
    const title = $("#journalTitle").value;
    if (!activeNoteId && !body.trim() && !title.trim()) return;
    let note = activeNote();
    if (!note) {
      note = { id: uid(), title: "", body: "", mood: "", favorite: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      journalPages.unshift(note);
      activeNoteId = note.id;
    }
    note.title = title;
    note.body = body;
    note.updatedAt = new Date().toISOString();
    write("journal-pages", journalPages);
    $("#journalStatus").textContent = "Salvo agora";
    syncLatestNote();
    if (render) renderJournalList();
  }
  function queueNoteSave() {
    updateWordCount();
    $("#journalStatus").textContent = "Salvando…";
    clearTimeout(journalTimer);
    journalTimer = setTimeout(() => saveNote(false), 380);
  }
  function openNote(id) {
    saveNote(false);
    activeNoteId = id;
    const note = activeNote();
    $("#journalTitle").value = note?.title || "";
    $("#journalBody").value = note?.body || "";
    $("#journalFavorite").textContent = note?.favorite ? "★" : "☆";
    $("#journalDate").textContent = note ? noteDate(note.createdAt) : "Nova página";
    $$("[data-mood]").forEach(button => button.classList.toggle("active", button.dataset.mood === note?.mood));
    $("#journalStatus").textContent = note ? "Tudo salvo" : "Nova página";
    updateWordCount();
    renderJournalList();
  }
  function renderJournalList() {
    const list = $("#journalPages");
    const query = $("#journalSearch").value.trim().toLowerCase();
    list.innerHTML = "";
    const filtered = journalPages.filter(note => `${note.title} ${note.body}`.toLowerCase().includes(query)).sort((a,b) => Number(b.favorite) - Number(a.favorite) || new Date(b.updatedAt) - new Date(a.updatedAt));
    if (!filtered.length) list.innerHTML = '<p class="empty-state">Nenhuma página por aqui ainda.</p>';
    filtered.forEach(note => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `journal-page${note.id === activeNoteId ? " active" : ""}`;
      button.innerHTML = `<strong>${note.favorite ? "★ " : ""}${escapeHTML(noteTitle(note))}</strong><small>${noteDate(note.updatedAt)}</small>`;
      button.addEventListener("click", () => openNote(note.id));
      list.append(button);
    });
  }
  function newNote() {
    saveNote(false);
    activeNoteId = null;
    $("#journalTitle").value = "";
    $("#journalBody").value = "";
    $("#journalFavorite").textContent = "☆";
    $("#journalDate").textContent = "Nova página";
    $$("[data-mood]").forEach(button => button.classList.remove("active"));
    updateWordCount();
    renderJournalList();
    $("#journalBody").focus();
  }
  function escapeHTML(value = "") {
    return String(value).replace(/[&<>'"]/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[char]));
  }
  $("#journalBody").addEventListener("input", queueNoteSave);
  $("#journalTitle").addEventListener("input", queueNoteSave);
  $("#journalSearch").addEventListener("input", renderJournalList);
  $("#newNote").addEventListener("click", newNote);
  $("#saveNote").addEventListener("click", () => { saveNote(true); toast("Página guardada no seu diário."); });
  $("#journalFavorite").addEventListener("click", () => {
    saveNote(false);
    const note = activeNote();
    if (!note) return;
    note.favorite = !note.favorite;
    $("#journalFavorite").textContent = note.favorite ? "★" : "☆";
    write("journal-pages", journalPages);
    renderJournalList();
  });
  $$("[data-mood]").forEach(button => button.addEventListener("click", () => {
    saveNote(false);
    const note = activeNote();
    if (!note) { $("#journalBody").value = " "; saveNote(false); $("#journalBody").value = ""; }
    const current = activeNote();
    current.mood = current.mood === button.dataset.mood ? "" : button.dataset.mood;
    write("journal-pages", journalPages);
    $$("[data-mood]").forEach(item => item.classList.toggle("active", item.dataset.mood === current.mood));
  }));
  $("#deleteNote").addEventListener("click", () => {
    if (!activeNoteId) return;
    if (!confirm("Apagar esta página do diário?")) return;
    journalPages = journalPages.filter(note => note.id !== activeNoteId);
    write("journal-pages", journalPages);
    activeNoteId = journalPages[0]?.id || null;
    openNote(activeNoteId);
    syncLatestNote();
    toast("Página apagada.");
  });
  openNote(activeNoteId);
  syncLatestNote();

  /* Arquivos locais: biblioteca e memórias */
  let databasePromise;
  function openDatabase() {
    if (databasePromise) return databasePromise;
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open("norte-ale-gallery", 2);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains("photos")) database.createObjectStore("photos", { keyPath: "id" });
        if (!database.objectStoreNames.contains("animes")) database.createObjectStore("animes", { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return databasePromise;
  }
  async function dbGetAll(storeName) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const request = db.transaction(storeName, "readonly").objectStore(storeName).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async function dbPut(storeName, value) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const request = db.transaction(storeName, "readwrite").objectStore(storeName).put(value);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  async function dbDelete(storeName, id) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const request = db.transaction(storeName, "readwrite").objectStore(storeName).delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  async function optimizeImage(file, maxSize = 1200, quality = .82) {
    const bitmap = await createImageBitmap(file);
    const ratio = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * ratio);
    canvas.height = Math.round(bitmap.height * ratio);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return new Promise(resolve => canvas.toBlob(resolve, "image/webp", quality));
  }

  let animeCoverBlob = null;
  let animePreviewURL = null;
  $("#animeCover").addEventListener("change", async event => {
    const file = event.target.files[0];
    if (!file) return;
    animeCoverBlob = await optimizeImage(file, 900, .85);
    if (animePreviewURL) URL.revokeObjectURL(animePreviewURL);
    animePreviewURL = URL.createObjectURL(animeCoverBlob);
    $("#animePreview").src = animePreviewURL;
    $("#animePreview").hidden = false;
    $("#coverPlaceholder").hidden = true;
  });
  $("#animeForm").addEventListener("submit", async event => {
    event.preventDefault();
    const name = $("#animeName").value.trim();
    if (!name || !animeCoverBlob) { toast("Escolha uma capa e escreva o nome."); return; }
    $("#animeStatus").textContent = "Guardando na estante…";
    await dbPut("animes", { id: uid(), name, note: $("#animeNote").value.trim(), cover: animeCoverBlob, favorite: false, createdAt: Date.now() });
    event.currentTarget.reset();
    animeCoverBlob = null;
    $("#animePreview").hidden = true;
    $("#coverPlaceholder").hidden = false;
    $("#animeStatus").textContent = "Guardado neste navegador.";
    renderAnimeShelf();
  });
  $("#animeSearch").addEventListener("input", renderAnimeShelf);
  async function renderAnimeShelf() {
    const grid = $("#animeGrid");
    const query = $("#animeSearch").value.trim().toLowerCase();
    try {
      const items = (await dbGetAll("animes")).filter(item => `${item.name} ${item.note}`.toLowerCase().includes(query)).sort((a,b) => Number(b.favorite) - Number(a.favorite) || b.createdAt - a.createdAt);
      grid.innerHTML = "";
      $("#animeCount").textContent = `${items.length} ${items.length === 1 ? "história" : "histórias"}`;
      if (!items.length) grid.innerHTML = '<p class="empty-state">Sua estante está esperando a primeira história.</p>';
      items.forEach(item => {
        const card = document.createElement("article");
        card.className = "anime-card";
        const url = URL.createObjectURL(item.cover);
        card.innerHTML = `<img src="${url}" alt="Capa de ${escapeHTML(item.name)}"><div><h3>${escapeHTML(item.name)}</h3><p>${escapeHTML(item.note || "Uma história guardada com carinho.")}</p></div><footer><button class="fav${item.favorite ? " active" : ""}" type="button">${item.favorite ? "♥" : "♡"} favorito</button><button class="remove" type="button">apagar</button></footer>`;
        $(".fav", card).addEventListener("click", async () => { item.favorite = !item.favorite; await dbPut("animes", item); renderAnimeShelf(); });
        $(".remove", card).addEventListener("click", async () => { if (confirm(`Apagar ${item.name} da estante?`)) { await dbDelete("animes", item.id); renderAnimeShelf(); } });
        grid.append(card);
      });
    } catch (_) { grid.innerHTML = '<p class="empty-state">Não foi possível abrir a estante neste navegador.</p>'; }
  }

  $("#memoryUpload").addEventListener("change", async event => {
    const files = [...event.target.files].slice(0, 12);
    if (!files.length) return;
    $("#memoryStatus").textContent = `Guardando ${files.length} momento(s)…`;
    for (const file of files) {
      const blob = await optimizeImage(file, 1400, .82);
      await dbPut("photos", { id: uid(), image: blob, name: file.name, createdAt: Date.now() });
    }
    event.target.value = "";
    $("#memoryStatus").textContent = "Momentos guardados neste navegador.";
    renderMemories();
  });
  async function renderMemories() {
    const grid = $("#memoryGrid");
    try {
      const items = (await dbGetAll("photos")).sort((a,b) => b.createdAt - a.createdAt);
      grid.innerHTML = items.length ? "" : '<p class="empty-state">Seu baú ainda está vazio.</p>';
      items.forEach(item => {
        const card = document.createElement("article");
        card.className = "memory-card";
        const url = URL.createObjectURL(item.image || item.blob);
        card.innerHTML = `<img src="${url}" alt="${escapeHTML(item.name || "Momento guardado")}"><button type="button" aria-label="Apagar">×</button>`;
        $("button", card).addEventListener("click", async () => { if (confirm("Apagar este momento?")) { await dbDelete("photos", item.id); renderMemories(); } });
        grid.append(card);
      });
    } catch (_) { grid.innerHTML = '<p class="empty-state">Não foi possível abrir o baú neste navegador.</p>'; }
  }

  /* Aquário */
  const fishTypes = {
    betta: { col: 0, row: 0, size: 72 }, palhaco: { col: 1, row: 0, size: 65 }, neon: { col: 2, row: 0, size: 55 },
    dourado: { col: 0, row: 1, size: 67 }, koi: { col: 1, row: 1, size: 76 }, lua: { col: 2, row: 1, size: 64 }
  };
  let selectedFish = "betta";
  let fishState = read("aquarium-fish", []);
  if (!Array.isArray(fishState)) fishState = [];
  fishState = fishState.slice(0, 10).map((fish, index) => ({
    id: fish.id || uid(), type: fish.type || fish.species || Object.keys(fishTypes)[index % 6],
    x: clamp(Number(fish.x) || 20 + Math.random() * 60, 5, 95), y: clamp(Number(fish.y) || 20 + Math.random() * 55, 8, 90),
    vx: Number(fish.vx) ? Math.sign(Number(fish.vx)) * clamp(Math.abs(Number(fish.vx)) > 2 ? Math.abs(Number(fish.vx)) / 5 : Math.abs(Number(fish.vx)), .5, 1.6) : .8 + Math.random() * .6,
    vy: clamp(Number(fish.vy) || (Math.random() - .5) * .25, -.55, .55)
  }));
  if (!fishState.length) ["neon", "palhaco", "betta", "dourado"].forEach((type, i) => fishState.push({ id: uid(), type, x: 22 + i * 17, y: 30 + (i % 2) * 27, vx: .75 + i * .12, vy: (i % 2 ? .12 : -.1) }));
  let fishRAF = 0;
  let lastFishFrame = 0;
  function renderFish() {
    const layer = $("#fishLayer");
    layer.innerHTML = "";
    fishState.forEach(fish => {
      const type = fishTypes[fish.type] || fishTypes.betta;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "fish";
      button.dataset.id = fish.id;
      button.style.cssText = `--fish-col:${type.col};--fish-row:${type.row};--size:${type.size}px;--dir:${fish.vx >= 0 ? -1 : 1};left:${fish.x}%;top:${fish.y}%`;
      button.innerHTML = "<i></i>";
      button.addEventListener("click", () => { button.classList.add("hungry"); $("#aquariumMessage").textContent = "Ele veio dizer oi."; setTimeout(() => button.classList.remove("hungry"), 1200); });
      layer.append(button);
    });
    $("#fishCount").textContent = `${fishState.length} ${fishState.length === 1 ? "peixe" : "peixes"}`;
    write("aquarium-fish", fishState);
  }
  function fishLoop(time) {
    if (!lastFishFrame) lastFishFrame = time;
    const delta = Math.min(2, (time - lastFishFrame) / 16.7);
    lastFishFrame = time;
    fishState.forEach(fish => {
      fish.x += fish.vx * .035 * delta;
      fish.y += fish.vy * .018 * delta;
      if (fish.x > 96 || fish.x < 4) { fish.vx *= -1; fish.x = clamp(fish.x, 4, 96); }
      if (fish.y > 90 || fish.y < 8) { fish.vy *= -1; fish.y = clamp(fish.y, 8, 90); }
      const node = $(`[data-id="${fish.id}"]`, $("#fishLayer"));
      if (node) { node.style.left = `${fish.x}%`; node.style.top = `${fish.y}%`; node.style.setProperty("--dir", fish.vx >= 0 ? -1 : 1); }
    });
    fishRAF = requestAnimationFrame(fishLoop);
  }
  function startFishLoop() { if (!fishRAF) { lastFishFrame = 0; fishRAF = requestAnimationFrame(fishLoop); } }
  function stopFishLoop() { cancelAnimationFrame(fishRAF); fishRAF = 0; write("aquarium-fish", fishState); }
  function buildBubbles() {
    const layer = $("#bubbleLayer");
    for (let i = 0; i < 25; i += 1) {
      const bubble = document.createElement("i");
      bubble.style.cssText = `left:${Math.random()*100}%;--s:${3+Math.random()*9}px;--d:${5+Math.random()*8}s;--delay:${-Math.random()*12}s`;
      layer.append(bubble);
    }
  }
  $$('[data-fish]').forEach(button => button.addEventListener("click", () => {
    selectedFish = button.dataset.fish;
    $$('[data-fish]').forEach(item => item.classList.toggle("active", item === button));
    $("#aquariumMessage").textContent = `${button.textContent.trim()} escolhido para o aquário.`;
  }));
  $("#addFish").addEventListener("click", () => {
    if (fishState.length >= 10) { toast("O aquário já está cheio e tranquilo."); return; }
    fishState.push({ id: uid(), type: selectedFish, x: 18 + Math.random() * 60, y: 22 + Math.random() * 50, vx: .7 + Math.random() * .7, vy: (Math.random() - .5) * .3 });
    renderFish();
    $("#aquariumMessage").textContent = "Um novo morador chegou.";
  });
  $("#feedFish").addEventListener("click", () => {
    const layer = $("#foodLayer");
    for (let i = 0; i < 18; i += 1) { const food = document.createElement("i"); food.style.left = `${20 + Math.random()*60}%`; food.style.animationDelay = `${Math.random()*.8}s`; layer.append(food); setTimeout(() => food.remove(), 5000); }
    $$(".fish").forEach(fish => { fish.classList.add("hungry"); setTimeout(() => fish.classList.remove("hungry"), 1800); });
    $("#aquariumMessage").textContent = "Hora do lanchinho — eles perceberam.";
  });
  $("#tapGlass").addEventListener("click", () => {
    fishState.forEach(fish => { fish.vx *= -1.25; fish.vy = (Math.random() - .5) * .55; });
    $("#aquariumShell").animate([{ filter:"brightness(1)" }, { filter:"brightness(1.18)" }, { filter:"brightness(1)" }], { duration: 450 });
    $("#aquariumMessage").textContent = "toc toc… todos olharam para você.";
  });
  const lightModes = ["blue", "moon", "rose"];
  let lightIndex = 0;
  $("#aquariumLight").addEventListener("click", () => { lightIndex = (lightIndex + 1) % lightModes.length; $("#aquariumShell").dataset.light = lightModes[lightIndex]; });
  $("#fullscreenAquarium").addEventListener("click", async () => {
    try {
      if(document.fullscreenElement) await document.exitFullscreen();
      else await $("#aquariumShell").requestFullscreen();
    } catch (_) { toast("A tela cheia não está disponível neste navegador."); }
  });
  buildBubbles();
  renderFish();

  /* Jardim */
  const seedTypes = ["lavanda", "morango", "girassol", "flor-lua"];
  let selectedSeed = "lavanda";
  let garden = read("pixel-garden", Array(6).fill(null));
  if (!Array.isArray(garden)) garden = Array(6).fill(null);
  garden = [...garden.slice(0,6), ...Array(6).fill(null)].slice(0,6).map(item => item ? { type: item.type || item.seed || "lavanda", stage: clamp(Number(item.stage) || 0, 0, 3), water: Number(item.water) || 0 } : null);
  function renderGarden() {
    const plots = $("#gardenPlots");
    plots.innerHTML = "";
    garden.forEach((plant, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "plot";
      button.setAttribute("aria-label", plant ? `${plant.type}, estágio ${plant.stage + 1}` : "Canteiro vazio");
      if (plant) button.innerHTML = `<i class="plant" style="--plant-stage:${plant.stage};--plant-row:${seedTypes.indexOf(plant.type)}"></i>`;
      button.addEventListener("click", () => tendPlant(index, button));
      plots.append(button);
    });
    $("#bloomCount").textContent = `${garden.filter(plant => plant?.stage === 3).length} / 6`;
    write("pixel-garden", garden);
  }
  function tendPlant(index, button) {
    if (!garden[index]) {
      garden[index] = { type: selectedSeed, stage: 0, water: 0 };
      $("#gardenMessage").textContent = "Uma sementinha encontrou seu lugar.";
    } else {
      garden[index].water += 1;
      if (garden[index].water % 2 === 0 && garden[index].stage < 3) garden[index].stage += 1;
      $("#gardenMessage").textContent = garden[index].stage === 3 ? "Ela floresceu. Valeu a espera." : "A terra bebeu a água devagar.";
    }
    button?.classList.add("wet");
    renderGarden();
  }
  $$('[data-seed]').forEach(button => button.addEventListener("click", () => { selectedSeed = button.dataset.seed; $$('[data-seed]').forEach(item => item.classList.toggle("active", item === button)); }));
  $$('[data-garden-time]').forEach(button => button.addEventListener("click", () => {
    $("#gardenShell").dataset.time = button.dataset.gardenTime;
    $$('[data-garden-time]').forEach(item => item.classList.toggle("active", item === button));
    write("garden-time", button.dataset.gardenTime);
  }));
  $("#waterAll").addEventListener("click", () => {
    garden.forEach((plant, index) => { if (plant) { plant.water += 1; if (plant.water % 2 === 0 && plant.stage < 3) plant.stage += 1; $$(".plot")[index]?.classList.add("wet"); } });
    renderGarden();
    $("#gardenMessage").textContent = "O jardim inteiro ganhou uma chuva mansa.";
  });
  $("#butterfly").addEventListener("click", () => {
    const butterfly = document.createElement("i");
    butterfly.textContent = "◇";
    butterfly.style.cssText = "position:absolute;z-index:9;left:18%;top:45%;color:#ffc0d9;font-size:24px;text-shadow:0 0 12px #ff78b7;pointer-events:none";
    $("#gardenShell").append(butterfly);
    butterfly.animate([{ transform:"translate(0,0) rotate(-15deg)" }, { transform:"translate(55vw,-25vh) rotate(18deg)" }], { duration: 5500, easing:"ease-in-out" }).onfinish = () => butterfly.remove();
    $("#gardenMessage").textContent = "Uma borboleta veio visitar as flores.";
  });
  function buildGardenAir() {
    const layer = $("#fireflies");
    for (let i=0;i<22;i+=1){const fly=document.createElement("i");fly.style.cssText=`left:${10+Math.random()*80}%;top:${22+Math.random()*57}%;--d:${3+Math.random()*6}s;--delay:${-Math.random()*7}s`;layer.append(fly)}
    setInterval(() => {
      if (currentView !== "gardenView" || document.body.classList.contains("performance-mode")) return;
      const leaf=document.createElement("i");leaf.textContent="◆";leaf.style.cssText=`left:${Math.random()*90}%;--d:${6+Math.random()*5}s`;$("#leafLayer").append(leaf);setTimeout(()=>leaf.remove(),11000);
    }, 2100);
  }
  $("#gardenShell").dataset.time = read("garden-time", "night");
  $$('[data-garden-time]').forEach(item => item.classList.toggle("active", item.dataset.gardenTime === $("#gardenShell").dataset.time));
  buildGardenAir();
  renderGarden();

  /* Lareira */
  let fireState = read("pixel-fireplace", { wood: 3, level: 55, on: true });
  fireState = { wood: clamp(Number(fireState.wood) || 0, 0, 20), level: clamp(Number(fireState.level) || 0, 0, 100), on: fireState.on !== false };
  function renderFire() {
    const shell = $("#fireplaceShell");
    shell.style.setProperty("--fire-strength", fireState.on ? fireState.level / 100 : 0);
    shell.classList.toggle("off", !fireState.on || fireState.level === 0);
    $("#woodCount").textContent = fireState.wood;
    $("#heatValue").textContent = `${fireState.on ? fireState.level : 0}%`;
    $("#heatBar").style.width = `${fireState.on ? fireState.level : 0}%`;
    $("#toggleFire").textContent = fireState.on ? "○ apagar" : "● acender";
    write("pixel-fireplace", fireState);
  }
  function makeEmbers(count = 7) {
    const layer = $("#embers");
    for (let i=0;i<count;i+=1){const ember=document.createElement("i");ember.style.cssText=`left:${30+Math.random()*40}%;--x:${-25+Math.random()*50}px;--d:${1+Math.random()*1.8}s`;layer.append(ember);setTimeout(()=>ember.remove(),3000)}
  }
  $("#chopWood").addEventListener("click", event => {
    if (fireState.wood >= 20) { toast("A caixa de lenha já está cheia."); return; }
    event.currentTarget.classList.remove("chopping"); void event.currentTarget.offsetWidth; event.currentTarget.classList.add("chopping");
    for(let i=0;i<8;i+=1){const chip=document.createElement("i");chip.style.cssText=`--x:${-55+Math.random()*110}px;--y:${-25+Math.random()*70}px`;$("#woodChips").append(chip);setTimeout(()=>chip.remove(),900)}
    fireState.wood += 1;
    renderFire();
    $("#fireMessage").textContent = "Mais uma tora pronta para a noite.";
  });
  $("#addWood").addEventListener("click", () => {
    if (!fireState.wood) { toast("Corte uma tora primeiro."); return; }
    fireState.wood -= 1; fireState.on = true; fireState.level = clamp(fireState.level + 18, 0, 100); renderFire(); makeEmbers(12); $("#fireMessage").textContent = "O fogo cresceu e a sala ficou dourada.";
  });
  $("#lowerFire").addEventListener("click", () => { fireState.level = clamp(fireState.level - 15, 0, 100); if (!fireState.level) fireState.on=false; renderFire(); $("#fireMessage").textContent="Agora o fogo está bem baixinho."; });
  $("#toggleFire").addEventListener("click", () => { fireState.on = !fireState.on; if (fireState.on && !fireState.level) fireState.level=35; renderFire(); $("#fireMessage").textContent=fireState.on?"A cabana voltou a ficar quentinha.":"Só o brilho das brasas ficou."; });
  setInterval(() => { if (currentView === "fireplaceView" && fireState.on && fireState.level > 0) makeEmbers(2); }, 1900);
  renderFire();

  /* Sons ambiente gerados no navegador */
  let audioContext;
  const ambience = {};
  function context() { audioContext ||= new (window.AudioContext || window.webkitAudioContext)(); return audioContext; }
  function noiseLoop(kind, volume) {
    const ctx = context();
    const length = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i=0;i<length;i+=1) {
      const white=Math.random()*2-1;
      if (kind === "rain") last = last*.78 + white*.22;
      else if (kind === "night") last = last*.988 + white*.012;
      else if (kind === "water") last = last*.94 + white*.045;
      else last = Math.random() < .003 ? white * (.45 + Math.random()*.45) : last*.84 + white*.025;
      data[i]=last;
    }
    const source=ctx.createBufferSource(); const filter=ctx.createBiquadFilter(); const gain=ctx.createGain();
    source.buffer=buffer;source.loop=true;
    filter.type=kind==="rain"?"highpass":kind==="fire"?"bandpass":"lowpass";
    filter.frequency.value=kind==="rain"?850:kind==="fire"?1750:kind==="water"?520:640;
    filter.Q.value=kind==="fire"?.8:.35;
    gain.gain.value=volume;source.connect(filter).connect(gain).connect(ctx.destination);source.start();
    return { source, gain };
  }
  const ambientKinds = { rain:"rain", fire:"fire", water:"water", night:"night" };
  function mixVolume(name) {
    return Number($(`[data-mix-volume="${name}"]`)?.value || 30);
  }
  function syncSoundButtons(name) {
    const active = name === "music" ? trackPlaying : Boolean(ambience[name]);
    const mixButton = $(`[data-mix-toggle="${name}"]`);
    if (mixButton) { mixButton.setAttribute("aria-pressed",String(active)); mixButton.textContent=active?"●":"○"; }
    const pageButton = name === "water" ? $("#waterSound") : name === "fire" ? $("#fireSound") : name === "rain" ? $("#rainSound") : name === "night" ? $("#lakeSound") : null;
    if (pageButton) {
      pageButton.dataset.offText ||= pageButton.textContent;
      pageButton.setAttribute("aria-pressed",String(active));
      pageButton.textContent=active?"Ⅱ silenciar":pageButton.dataset.offText;
    }
    const anyActive = trackPlaying || Object.keys(ambience).length > 0;
    $("#openMixer").classList.toggle("sounding", anyActive);
    $("#openMixer").setAttribute("aria-label", anyActive ? "Abrir sons do ambiente — há sons tocando" : "Abrir sons do ambiente");
  }
  function startSound(name) {
    if (name === "music") { setTrackPlaying(true); youtubeCommand("setVolume",[mixVolume("music")]); syncSoundButtons("music"); return; }
    if (!ambience[name]) ambience[name]=noiseLoop(ambientKinds[name],mixVolume(name)/900);
    ambience[name].gain.gain.value=mixVolume(name)/900;
    syncSoundButtons(name);
  }
  function stopSound(name) {
    if (name === "music") { setTrackPlaying(false); syncSoundButtons("music"); return; }
    if (ambience[name]) { ambience[name].source.stop(); delete ambience[name]; }
    syncSoundButtons(name);
  }
  function toggleSound(name) { if (name === "music" ? trackPlaying : ambience[name]) stopSound(name); else startSound(name); }
  $("#waterSound").addEventListener("click",()=>toggleSound("water"));
  $("#fireSound").addEventListener("click",()=>toggleSound("fire"));
  $("#rainSound").addEventListener("click",()=>toggleSound("rain"));
  $("#lakeSound").addEventListener("click",()=>toggleSound("night"));
  $("#rainVolume").addEventListener("input", event => {
    const mix = $('[data-mix-volume="rain"]');
    if (mix) mix.value=event.target.value;
    if(ambience.rain) ambience.rain.gain.gain.value=Number(event.target.value)/900;
  });
  $$('[data-mix-toggle]').forEach(button=>button.addEventListener("click",event=>{event.preventDefault();toggleSound(button.dataset.mixToggle)}));
  $$('[data-mix-volume]').forEach(input=>input.addEventListener("input",()=>{
    const name=input.dataset.mixVolume;
    write(`mix-${name}`,Number(input.value));
    if(name==="music") youtubeCommand("setVolume",[Number(input.value)]);
    else if(ambience[name]) ambience[name].gain.gain.value=Number(input.value)/900;
    if(name==="rain") $("#rainVolume").value=input.value;
  }));
  $$('[data-mix-volume]').forEach(input=>{input.value=read(`mix-${input.dataset.mixVolume}`,Number(input.value));});
  $("#rainVolume").value=$('[data-mix-volume="rain"]').value;
  function openMixer(active) {
    $("#ambientMixer").classList.toggle("open",active);
    $("#ambientMixer").setAttribute("aria-hidden",String(!active));
    $("#ambientMixer").toggleAttribute("inert",!active);
    $("#mixerBackdrop").hidden=!active;
    $("#openMixer").classList.toggle("active",active);
    $("#openMixer").setAttribute("aria-expanded",String(active));
  }
  $("#openMixer").addEventListener("click",()=>openMixer(true));
  $("#closeMixer").addEventListener("click",()=>openMixer(false));
  $("#mixerBackdrop").addEventListener("click",()=>openMixer(false));
  $("#mixerFocus").addEventListener("click",()=>openMixer(false));
  $("#muteAll").addEventListener("click",()=>{
    ["music","rain","fire","water","night"].forEach(stopSound);
    toast("Todos os sons ficaram em silêncio.");
  });
  document.addEventListener("keydown",event=>{if(event.key==="Escape")openMixer(false)});

  /* Chuva */
  let rainStrength = 55;
  function buildRoomRain() {
    const layer=$("#windowRain");layer.innerHTML="";
    const count=Math.round(18+rainStrength*.65);
    for(let i=0;i<count;i+=1){const drop=document.createElement("i");drop.style.cssText=`left:${Math.random()*100}%;--h:${30+Math.random()*75}px;--d:${.55+Math.random()*1.1}s;--delay:${-Math.random()*2}s`;layer.append(drop)}
    $("#globalRain").style.opacity=String(.035+rainStrength/900);
  }
  $$('[data-rain]').forEach(button => button.addEventListener("click",()=>{rainStrength=Number(button.dataset.rain);$$('[data-rain]').forEach(item=>item.classList.toggle("active",item===button));buildRoomRain();$("#weatherText").textContent=rainStrength<30?"☂ Garoando lá fora":rainStrength>70?"☂ Chuva forte lá fora":"☂ Chovendo lá fora";}));
  buildRoomRain();

  /* Clima de todo o mundo */
  const weatherData = {
    rain:{icon:"☂",label:"chuva",message:"☂ Chovendo lá fora"},
    clear:{icon:"☾",label:"limpo",message:"☾ Céu limpo lá fora"},
    fog:{icon:"≋",label:"neblina",message:"≋ Neblina sobre a cidade"},
    storm:{icon:"ϟ",label:"tempestade",message:"ϟ Tempestade bem distante"}
  };
  let weatherMode = read("weather-mode","rain");
  let randomWeatherTimer;
  function applyWeather(weather) {
    const selected=weatherData[weather]?weather:"rain";
    document.body.dataset.weather=selected;
    $("#weatherIcon").textContent=weatherData[selected].icon;
    $("#weatherLabel").textContent=weatherMode==="random"?"surpresa":weatherData[selected].label;
    $("#weatherText").textContent=weatherData[selected].message;
  }
  function setWeatherMode(mode,persist=true) {
    weatherMode=mode;
    clearInterval(randomWeatherTimer);
    $$('[data-weather-choice]').forEach(button=>button.classList.toggle("active",button.dataset.weatherChoice===mode));
    if(mode==="random") {
      const choices=Object.keys(weatherData);
      applyWeather(choices[Math.floor(Math.random()*choices.length)]);
      randomWeatherTimer=setInterval(()=>applyWeather(choices[Math.floor(Math.random()*choices.length)]),90000);
    } else applyWeather(mode);
    if(persist)write("weather-mode",mode);
    $(".weather-menu").removeAttribute("open");
  }
  $$('[data-weather-choice]').forEach(button=>button.addEventListener("click",()=>setWeatherMode(button.dataset.weatherChoice)));
  function scheduleLightning() {
    setTimeout(()=>{
      if(document.body.dataset.weather==="storm"&&!document.body.classList.contains("performance-mode")){
        $("#softLightning").classList.remove("flash");void $("#softLightning").offsetWidth;$("#softLightning").classList.add("flash");
      }
      scheduleLightning();
    },18000+Math.random()*22000);
  }
  setWeatherMode(weatherMode,false);
  scheduleLightning();

  /* Foco */
  let focusMinutes = 25;
  let focusRemaining = focusMinutes * 60;
  let focusRunning = false;
  let focusTimer;
  function renderFocus() {
    $("#focusClock").textContent=formatTime(focusRemaining);
    $("#focusToggle").textContent=focusRunning?"Pausar":"Começar";
    $("#focusBar").style.width=`${100-(focusRemaining/(focusMinutes*60))*100}%`;
  }
  function stopFocus(){focusRunning=false;clearInterval(focusTimer);renderFocus()}
  $("#focusToggle").addEventListener("click",()=>{focusRunning=!focusRunning;clearInterval(focusTimer);if(focusRunning)focusTimer=setInterval(()=>{focusRemaining-=1;if(focusRemaining<=0){focusRemaining=0;stopFocus();toast("Esse momento terminou. Respira e descansa um pouco.")}renderFocus()},1000);renderFocus()});
  $("#focusReset").addEventListener("click",()=>{stopFocus();focusRemaining=focusMinutes*60;renderFocus()});
  $$('[data-focus]').forEach(button=>button.addEventListener("click",()=>{focusMinutes=Number(button.dataset.focus);focusRemaining=focusMinutes*60;stopFocus();$$('[data-focus]').forEach(item=>item.classList.toggle("active",item===button));$("#focusLabel").textContent=focusMinutes===5?"Uma pausa também faz parte.":"Só você e esse momento.";}));
  renderFocus();

  makeAtmosphere();
  makeLivingHome();
  renderAnimeShelf();
  const savedView = read("active-view", "homeView");
  showView(document.getElementById(savedView) ? savedView : "homeView", false);
})();
