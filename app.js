(() => {
  "use strict";

  const PREFIX = "norte-ale:";
  const byId = (id) => document.getElementById(id);
  const store = {
    get(key, fallback = null) {
      try {
        const value = localStorage.getItem(PREFIX + key);
        return value === null ? fallback : JSON.parse(value);
      } catch (_) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; }
      catch (_) { return false; }
    }
  };
  const pad = (number) => String(number).padStart(2, "0");
  const localDayKey = (date = new Date()) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const debounce = (callback, delay = 700) => {
    let timer;
    return (...args) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => callback(...args), delay);
    };
  };

  const viewInfo = {
    homeView: ["AGORA", "Noite lo-fi"],
    journalView: ["DIÁRIO", "Tudo que ficou na cabeça"],
    calmView: ["PAUSA", "Desacelerar"],
    playView: ["PASSATEMPOS", "Jogos sem pressão"],
    memoriesView: ["MEMÓRIAS", "Meu baú visual"],
    animeView: ["UNIVERSOS", "Meus mundos"],
    northView: ["CLAREZA", "Meu norte"]
  };
  const thoughts = [
    "O mundo pode esperar o tempo de uma música.",
    "Nem todo pensamento precisa virar uma decisão.",
    "Hoje já aconteceu o bastante. Agora pode ser devagar.",
    "Você não precisa entender tudo para respirar melhor.",
    "Às vezes a resposta aparece quando a gente para de apertar a pergunta.",
    "Um momento calmo também faz parte do caminho.",
    "Esperar também é uma parte do caminho — não um caminho parado.",
    "Um bloco de cada vez ainda constrói mundos inteiros."
  ];
  const journalPrompts = [
    "Se eu pudesse tirar um peso da cabeça agora, seria…",
    "Uma coisa pequena que me fez bem hoje foi…",
    "O que eu queria que alguém entendesse sem eu precisar explicar?",
    "Qual pensamento é fato e qual parte é só medo?",
    "Se hoje fosse uma música, que clima ela teria?",
    "Do que eu tenho orgulho, mesmo que pareça pequeno?",
    "O que pode ficar para amanhã sem virar culpa?",
    "O que o Ale de daqui a um mês precisaria ouvir?"
  ];
  const animePicks = {
    leve: "Hoje combina com Takagi-san ou Horimiya.",
    calmo: "Tsuki ga Kirei ou Insomniacs After School parecem certos para agora.",
    profundo: "A Voz do Silêncio ou Your Name para sentir e pensar com calma.",
    bonito: "Your Name, Tsuki ga Kirei ou Horimiya para uma noite bonita."
  };
  const gamePicks = [
    "Minecraft: construir uma casa simples e deixar o tempo passar bloco por bloco.",
    "Terraria: escolher uma direção e ver que história aparece no caminho.",
    "Roblox: visitar algo novo sem obrigação de ficar muito tempo.",
    "Palworld: cuidar da base, organizar as coisas e explorar só um pouco.",
    "Honkai: Star Rail: entrar pela história e passear entre paisagens espaciais.",
    "Red Dead Redemption 2: cavalgar devagar e deixar o cenário fazer companhia."
  ];
  const vibeInfo = {
    lofi: { text: "Lo-fi aconchegante combina com a estação Study radio: batida baixa para escrever, jogar ou só existir.", video: "rFZHOHl-L8A" },
    melancolico: { text: "Hoje parece uma noite de música brasileira melancólica, na pegada de VMZ e ‘Travesseiro’. Abre sua playlist favorita e deixa a letra ficar do lado de fora do diário.", video: null },
    foco: { text: "Para colocar uma ideia no lugar sem pressa, a estação 1 A.M. deixa o ambiente mais quieto.", video: "lTRiuFIWV54" },
    noite: { text: "Neon na madrugada pede Synthwave: um pouco de estrada, cidade e céu roxo.", video: "4xDzrJKXOOY" }
  };
  const groundSteps = [
    ["Olha ao redor.", "Perceba cinco coisas que você consegue ver. Não precisa nomear todas depressa."],
    ["Escuta o lugar.", "Encontre quatro sons: perto, longe, contínuo ou quase escondido."],
    ["Volta para o corpo.", "Perceba três pontos de contato: os pés, as mãos, as costas ou a roupa."],
    ["Respira sem corrigir.", "Perceba duas respirações do jeito que elas já estão. Só acompanha."],
    ["Escolhe uma coisa.", "Pensa em uma ação pequena para depois deste minuto. O resto pode esperar."]
  ];

  let currentView = "homeView";
  let currentJournalId = null;
  let currentJournalMood = "";
  let currentJournalFavorite = false;
  let journalTimer;
  let journalDirty = false;
  let pointerFrame = 0;
  let breathing = false;
  let breathTimer;
  let breathEnd = 0;
  let timerMinutes = 5;
  let timerRemaining = 300;
  let timerRunning = false;
  let restTimerInterval;
  let groundIndex = 0;
  let introTimer;
  let gardenColor = "violet";
  let gardenPainting = false;
  let starGameRunning = false;
  let starGameTimer;
  let starGameSeconds = 30;
  let starGameScore = 0;
  let memoryFilter = "all";
  let memoryObjectUrls = [];
  let currentPhotoId = null;
  let currentPhotoUrl = null;
  let animeCoverFile = null;
  let animePreviewUrl = null;
  let animeObjectUrls = [];
  let toastTimer;

  function initPerformanceMode() {
    const enabled = Boolean(store.get("performance-mode", false));
    document.body.classList.toggle("performance-mode", enabled);
    byId("performanceToggle").setAttribute("aria-pressed", String(enabled));
  }
  function closeIntro() {
    const intro = byId("siteIntro");
    if (!intro) return;
    window.clearTimeout(introTimer);
    intro.classList.remove("playing");
  }
  function playIntro() {
    const intro = byId("siteIntro");
    if (!intro) return;
    window.clearTimeout(introTimer);
    intro.classList.remove("playing");
    void intro.offsetWidth;
    intro.classList.add("playing");
    introTimer = window.setTimeout(closeIntro, document.body.classList.contains("performance-mode") ? 2200 : 4300);
  }
  function initIntro() { playIntro(); }
  function updateClock() {
    const now = new Date();
    const hour = now.getHours();
    byId("greeting").textContent = `${hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite"}, Ale.`;
    byId("todayLabel").textContent = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).format(now);
    byId("liveClock").textContent = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(now);
  }
  function showView(id, save = true) {
    if (!viewInfo[id]) return;
    if (currentView === "journalView" && id !== "journalView" && journalDirty) saveCurrentJournal(false, true);
    document.querySelectorAll(".view").forEach((view) => {
      const active = view.id === id;
      view.hidden = !active;
      view.classList.toggle("active", active);
    });
    document.querySelectorAll("[data-view]").forEach((button) => {
      const active = button.dataset.view === id;
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    byId("viewEyebrow").textContent = viewInfo[id][0];
    byId("viewName").textContent = viewInfo[id][1];
    currentView = id;
    document.body.dataset.scene = id;
    document.body.classList.toggle("writing-mode", id === "journalView");
    if (save) store.set("active-view", id);
    window.scrollTo({ top: 0, behavior: document.body.classList.contains("performance-mode") ? "auto" : "smooth" });
  }
  function selectStation(button, save = true) {
    if (!button) return;
    const video = button.dataset.video;
    document.querySelectorAll(".station").forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    byId("trackTitle").textContent = button.dataset.title;
    byId("trackMeta").textContent = button.dataset.meta;
    const nextSource = `https://www.youtube-nocookie.com/embed/${video}?rel=0`;
    if (byId("lofiPlayer").src !== nextSource) byId("lofiPlayer").src = nextSource;
    byId("lofiPlayer").title = button.dataset.title;
    byId("youtubeLink").href = `https://www.youtube.com/watch?v=${video}`;
    if (save) store.set("station", video);
  }
  function nextThought() {
    const current = byId("nightThought").textContent;
    const options = thoughts.filter((item) => item !== current);
    byId("nightThought").textContent = options[Math.floor(Math.random() * options.length)];
    if (!document.body.classList.contains("performance-mode")) {
      byId("nextThought").classList.remove("flash");
      void byId("nextThought").offsetWidth;
      byId("nextThought").classList.add("flash");
    }
  }
  function createStar() {
    const star = document.createElement("i");
    star.className = "made-star";
    star.style.left = `${16 + Math.random() * 76}%`;
    star.style.top = `${16 + Math.random() * 70}%`;
    byId("madeStars").append(star);
    window.setTimeout(() => star.remove(), 3600);
  }

  function renderDailyMoods() {
    const moods = store.get("daily-moods", {});
    const today = localDayKey();
    document.querySelectorAll("[data-day-mood]").forEach((button) => button.classList.toggle("active", moods[today] === button.dataset.dayMood));
    const week = byId("moodWeek");
    week.replaceChildren();
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - offset);
      const mood = moods[localDayKey(date)];
      const dot = document.createElement("i");
      dot.className = `mood-dot${mood ? " filled" : ""}`;
      dot.textContent = mood ? { calmo: "◡", cansado: "–", cheio: "≈", bom: "✦" }[mood] : "·";
      dot.title = `${new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date)}${mood ? ` · ${mood}` : ""}`;
      week.append(dot);
    }
  }
  function saveDailyMood(mood) {
    const moods = store.get("daily-moods", {});
    moods[localDayKey()] = mood;
    store.set("daily-moods", moods);
    byId("moodSaved").textContent = "dia guardado ✓";
    renderDailyMoods();
  }
  function joyItems() { return store.get("joy-jar", []); }
  function renderJoyCount() {
    const count = joyItems().length;
    byId("joyCount").textContent = `${count} ${count === 1 ? "guardada" : "guardadas"}`;
  }
  function saveJoy() {
    const input = byId("joyInput");
    const value = input.value.trim();
    if (!value) return;
    const items = joyItems();
    items.push({ text: value, createdAt: Date.now() });
    store.set("joy-jar", items.slice(-80));
    input.value = "";
    byId("joyResult").textContent = `Guardado: “${value}”`;
    renderJoyCount();
  }
  function randomJoy() {
    const items = joyItems();
    byId("joyResult").textContent = items.length ? `“${items[Math.floor(Math.random() * items.length)].text}”` : "Seu baú ainda está esperando a primeira lembrança boa.";
  }

  function journalPages() { return store.get("journal-pages", []); }
  function saveJournalPages(pages) { store.set("journal-pages", pages); }
  function pageDate(timestamp) {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(timestamp));
  }
  function wordCount(text) { return text.trim() ? text.trim().split(/\s+/u).length : 0; }
  function updateJournalCounts() {
    const body = byId("journalBody").value;
    byId("journalWords").textContent = `${wordCount(body)} palavras`;
    byId("journalCount").textContent = `${body.length} / 12000`;
  }
  function setJournalMood(mood = "") {
    currentJournalMood = mood;
    document.querySelectorAll("[data-journal-mood]").forEach((button) => button.classList.toggle("active", button.dataset.journalMood === mood));
  }
  function setJournalFavorite(value) {
    currentJournalFavorite = Boolean(value);
    byId("favoriteJournal").setAttribute("aria-pressed", String(currentJournalFavorite));
    byId("favoriteJournal").textContent = currentJournalFavorite ? "★" : "☆";
  }
  function renderJournalPages() {
    const container = byId("journalPages");
    const query = byId("journalSearch").value.trim().toLocaleLowerCase("pt-BR");
    const pages = journalPages()
      .filter((page) => !query || `${page.title || ""} ${page.body || ""}`.toLocaleLowerCase("pt-BR").includes(query))
      .sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) || b.updatedAt - a.updatedAt);
    container.replaceChildren();
    if (!pages.length) {
      const empty = document.createElement("div");
      empty.className = "empty-pages";
      empty.textContent = query ? "Nenhuma página encontrou essa palavra." : "Sua primeira página aparece aqui.";
      container.append(empty);
      return;
    }
    pages.forEach((page) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `journal-page${page.id === currentJournalId ? " active" : ""}`;
      const title = document.createElement("strong");
      title.textContent = page.title || "Sem título";
      if (page.favorite) {
        const star = document.createElement("em");
        star.textContent = "★";
        title.append(star);
      }
      const date = document.createElement("small");
      date.textContent = pageDate(page.updatedAt);
      if (page.mood) {
        const mood = document.createElement("b");
        mood.textContent = ` · ${page.mood}`;
        date.append(mood);
      }
      button.append(title, date);
      button.addEventListener("click", () => loadJournalPage(page.id));
      container.append(button);
    });
  }
  function newJournalPage() {
    if (journalDirty) saveCurrentJournal(false, false);
    currentJournalId = null;
    byId("journalTitle").value = "";
    byId("journalBody").value = "";
    byId("journalBody").placeholder = "Escreve do seu jeito. Não precisa corrigir, explicar ou deixar bonito…";
    byId("journalDate").textContent = pageDate(Date.now());
    byId("journalStatus").textContent = "Nova página";
    byId("deleteJournal").disabled = true;
    setJournalMood("");
    setJournalFavorite(false);
    updateJournalCounts();
    renderJournalPages();
    byId("journalTitle").focus();
  }
  function loadJournalPage(id) {
    if (journalDirty) saveCurrentJournal(false, false);
    const page = journalPages().find((item) => item.id === id);
    if (!page) return;
    currentJournalId = page.id;
    byId("journalTitle").value = page.title || "";
    byId("journalBody").value = page.body || "";
    byId("journalDate").textContent = pageDate(page.updatedAt);
    byId("journalStatus").textContent = "Página salva";
    byId("deleteJournal").disabled = false;
    setJournalMood(page.mood || "");
    setJournalFavorite(Boolean(page.favorite));
    updateJournalCounts();
    renderJournalPages();
  }
  function saveCurrentJournal(showStatus = true, refreshList = true) {
    const title = byId("journalTitle").value.trim();
    const body = byId("journalBody").value;
    if (!title && !body.trim()) {
      if (showStatus) byId("journalStatus").textContent = "Escreva alguma coisa primeiro.";
      journalDirty = false;
      return;
    }
    const pages = journalPages();
    const now = Date.now();
    const wasNew = !currentJournalId;
    if (!currentJournalId) currentJournalId = `page-${now.toString(36)}`;
    const existingIndex = pages.findIndex((page) => page.id === currentJournalId);
    const previous = existingIndex >= 0 ? pages[existingIndex] : {};
    const page = { id: currentJournalId, title: title || "Sem título", body, mood: currentJournalMood, favorite: currentJournalFavorite, createdAt: previous.createdAt || now, updatedAt: now };
    if (existingIndex >= 0) pages[existingIndex] = page;
    else pages.push(page);
    const saved = store.set("journal-pages", pages);
    byId("journalStatus").textContent = saved ? "Salvo automaticamente" : "Não foi possível salvar";
    byId("journalDate").textContent = pageDate(now);
    byId("deleteJournal").disabled = false;
    journalDirty = false;
    if (refreshList || wasNew) renderJournalPages();
  }
  function queueJournalSave() {
    updateJournalCounts();
    journalDirty = true;
    byId("journalStatus").textContent = "Escrevendo…";
    window.clearTimeout(journalTimer);
    journalTimer = window.setTimeout(() => saveCurrentJournal(false, false), 1600);
  }
  function deleteCurrentJournal() {
    if (!currentJournalId) return;
    saveJournalPages(journalPages().filter((page) => page.id !== currentJournalId));
    byId("deleteDialog").close();
    newJournalPage();
    byId("journalStatus").textContent = "Página apagada";
  }
  function exportJournal() {
    const pages = journalPages().sort((a, b) => a.updatedAt - b.updatedAt);
    if (!pages.length) { byId("journalStatus").textContent = "Ainda não há páginas para exportar."; return; }
    const content = pages.map((page) => `${page.favorite ? "★ " : ""}${page.title || "Sem título"}\n${pageDate(page.updatedAt)}${page.mood ? ` · ${page.mood}` : ""}\n\n${page.body}`).join("\n\n————————————\n\n");
    const blob = new Blob([`NORTE — Diário do Ale\n\n${content}`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "norte-diario-do-ale.txt";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    byId("journalStatus").textContent = "Diário exportado";
  }
  function migrateOldJournal() {
    if (journalPages().length) return;
    const oldText = store.get("journal", "");
    if (typeof oldText === "string" && oldText.trim()) {
      saveJournalPages([{ id: `page-${Date.now().toString(36)}`, title: "Anotação anterior", body: oldText, mood: "", favorite: false, updatedAt: Date.now() }]);
    }
  }

  function setBreathPhase(cue, instruction, phase, seconds) {
    byId("breathCue").textContent = cue;
    byId("breathInstruction").textContent = instruction;
    byId("breathOrb").className = `breath-orb ${phase}`;
    byId("breathOrb").style.transitionDuration = `${seconds}s`;
  }
  function updateBreathing() {
    const remainingMs = Math.max(0, breathEnd - Date.now());
    const remaining = Math.ceil(remainingMs / 1000);
    byId("breathCount").textContent = String(remaining);
    const phase = (60 - remainingMs / 1000) % 14;
    if (phase < 4) setBreathPhase("INSPIRE", "Puxe o ar devagar pelo nariz.", "inhale", 4);
    else if (phase < 8) setBreathPhase("SEGURE", "Fique parado por alguns segundos.", "hold", 4);
    else setBreathPhase("SOLTE", "Solte o ar lentamente, sem forçar.", "exhale", 6);
    if (remainingMs <= 0) stopBreathing(true);
  }
  function startBreathing() {
    breathing = true;
    breathEnd = Date.now() + 60000;
    byId("breathButton").textContent = "Encerrar pausa";
    updateBreathing();
    breathTimer = window.setInterval(updateBreathing, 200);
  }
  function stopBreathing(completed = false) {
    breathing = false;
    window.clearInterval(breathTimer);
    byId("breathButton").textContent = completed ? "Fazer outra pausa" : "Começar um minuto";
    byId("breathOrb").className = "breath-orb";
    byId("breathOrb").style.transitionDuration = ".4s";
    byId("breathCue").textContent = completed ? "PRONTO" : "PAUSADO";
    byId("breathCount").textContent = completed ? "✓" : "60";
    byId("breathInstruction").textContent = completed ? "Agora escolha somente o próximo passo." : "Quando quiser, pode recomeçar.";
  }
  function releaseThought() {
    const input = byId("releaseText");
    const value = input.value.trim();
    if (!value) return;
    byId("releaseField").querySelector(".release-empty")?.remove();
    const bubble = document.createElement("div");
    bubble.className = "release-bubble";
    bubble.textContent = value;
    byId("releaseField").append(bubble);
    input.value = "";
    window.setTimeout(() => {
      bubble.remove();
      if (!byId("releaseField").children.length) {
        const empty = document.createElement("div");
        empty.className = "release-empty";
        empty.textContent = "o espaço está livre";
        byId("releaseField").append(empty);
      }
    }, 5100);
  }
  function setTimerPreset(minutes) {
    timerMinutes = minutes;
    timerRemaining = minutes * 60;
    timerRunning = false;
    window.clearInterval(restTimerInterval);
    byId("timerButton").textContent = "Começar";
    byId("timerLabel").textContent = minutes === 5 ? "pausa curta" : minutes === 15 ? "tempo para respirar" : "bloco de foco";
    document.querySelectorAll("[data-timer-minutes]").forEach((button) => button.classList.toggle("active", Number(button.dataset.timerMinutes) === minutes));
    updateRestTimer();
  }
  function updateRestTimer() { byId("restTimer").textContent = `${pad(Math.floor(timerRemaining / 60))}:${pad(timerRemaining % 60)}`; }
  function toggleRestTimer() {
    if (timerRemaining <= 0) setTimerPreset(timerMinutes);
    timerRunning = !timerRunning;
    byId("timerButton").textContent = timerRunning ? "Pausar" : "Continuar";
    window.clearInterval(restTimerInterval);
    if (!timerRunning) return;
    restTimerInterval = window.setInterval(() => {
      timerRemaining = Math.max(0, timerRemaining - 1);
      updateRestTimer();
      if (timerRemaining === 0) {
        window.clearInterval(restTimerInterval);
        timerRunning = false;
        byId("timerButton").textContent = "Fazer de novo";
        byId("timerLabel").textContent = "tempo concluído ✓";
      }
    }, 1000);
  }
  function renderGroundStep() {
    const [title, prompt] = groundSteps[groundIndex];
    byId("groundStep").textContent = `PASSO ${groundIndex + 1} DE ${groundSteps.length}`;
    byId("groundTitle").textContent = title;
    byId("groundPrompt").textContent = prompt;
    byId("groundProgress").style.width = `${((groundIndex + 1) / groundSteps.length) * 100}%`;
    byId("groundNext").textContent = groundIndex === groundSteps.length - 1 ? "Recomeçar com calma" : "Próximo passo";
  }

  function showToast(message) {
    const toast = byId("norteToast");
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2800);
  }

  function initMemoryGame() {
    const board = byId("memoryBoard");
    const symbols = ["☾", "✦", "♬", "♢", "✎", "❧"];
    const deck = [...symbols, ...symbols]
      .map((symbol) => ({ symbol, order: Math.random() }))
      .sort((a, b) => a.order - b.order);
    let openCard = null;
    let locked = false;
    let pairs = 0;
    let moves = 0;
    board.replaceChildren();
    byId("memoryGameStatus").textContent = "0 pares encontrados";
    byId("memoryMoves").textContent = "0 movimentos";
    deck.forEach(({ symbol }, index) => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "memory-tile";
      tile.dataset.symbol = symbol;
      tile.setAttribute("aria-label", `Carta ${index + 1} fechada`);
      const face = document.createElement("span");
      face.textContent = symbol;
      tile.append(face);
      tile.addEventListener("click", () => {
        if (locked || tile.classList.contains("flipped") || tile.classList.contains("matched")) return;
        tile.classList.add("flipped");
        tile.setAttribute("aria-label", `Carta ${symbol}`);
        if (!openCard) {
          openCard = tile;
          return;
        }
        moves += 1;
        byId("memoryMoves").textContent = `${moves} ${moves === 1 ? "movimento" : "movimentos"}`;
        if (openCard.dataset.symbol === tile.dataset.symbol) {
          openCard.classList.add("matched");
          tile.classList.add("matched");
          openCard.classList.remove("flipped");
          tile.classList.remove("flipped");
          pairs += 1;
          byId("memoryGameStatus").textContent = `${pairs} ${pairs === 1 ? "par encontrado" : "pares encontrados"}`;
          openCard = null;
          if (pairs === symbols.length) showToast(`Céu completo em ${moves} movimentos ✦`);
          return;
        }
        const previous = openCard;
        openCard = null;
        locked = true;
        window.setTimeout(() => {
          previous.classList.remove("flipped");
          tile.classList.remove("flipped");
          previous.setAttribute("aria-label", "Carta fechada");
          tile.setAttribute("aria-label", "Carta fechada");
          locked = false;
        }, 720);
      });
      board.append(tile);
    });
  }

  function placeGameStar() {
    const field = byId("starField");
    const star = byId("gameStar");
    const maxX = Math.max(8, field.clientWidth - 58);
    const maxY = Math.max(8, field.clientHeight - 58);
    star.style.left = `${8 + Math.random() * (maxX - 8)}px`;
    star.style.top = `${8 + Math.random() * (maxY - 8)}px`;
  }
  function finishStarGame() {
    starGameRunning = false;
    window.clearInterval(starGameTimer);
    byId("gameStar").hidden = true;
    byId("starHint").hidden = false;
    byId("starHint").textContent = starGameScore ? `${starGameScore} luzes. seu céu ficou bonito.` : "sem pressa — tenta quando quiser";
    byId("startStarGame").textContent = "Jogar de novo";
    byId("starTimer").textContent = "fim";
  }
  function startStarGame() {
    window.clearInterval(starGameTimer);
    starGameRunning = true;
    starGameSeconds = 30;
    starGameScore = 0;
    byId("starScore").textContent = "0";
    byId("starTimer").textContent = "30s";
    byId("starHint").hidden = true;
    byId("gameStar").hidden = false;
    byId("startStarGame").textContent = "Recomeçar";
    placeGameStar();
    starGameTimer = window.setInterval(() => {
      starGameSeconds -= 1;
      byId("starTimer").textContent = `${starGameSeconds}s`;
      if (starGameSeconds <= 0) finishStarGame();
    }, 1000);
  }

  function paintGardenCell(cell) {
    cell.className = `garden-cell${gardenColor === "off" ? "" : ` ${gardenColor}`}`;
    cell.dataset.color = gardenColor;
    const colors = [...byId("lightGarden").children].map((item) => item.dataset.color || "off");
    store.set("light-garden", colors);
  }
  function initLightGarden() {
    const garden = byId("lightGarden");
    const saved = store.get("light-garden", []);
    garden.replaceChildren();
    for (let index = 0; index < 72; index += 1) {
      const cell = document.createElement("button");
      const color = ["violet", "wine", "moon", "leaf"].includes(saved[index]) ? saved[index] : "off";
      cell.type = "button";
      cell.className = `garden-cell${color === "off" ? "" : ` ${color}`}`;
      cell.dataset.color = color;
      cell.setAttribute("aria-label", `Luz ${index + 1}`);
      cell.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        gardenPainting = true;
        paintGardenCell(cell);
      });
      cell.addEventListener("pointerenter", () => { if (gardenPainting) paintGardenCell(cell); });
      cell.addEventListener("click", () => paintGardenCell(cell));
      garden.append(cell);
    }
    window.addEventListener("pointerup", () => { gardenPainting = false; });
  }

  const PHOTO_DB_NAME = "norte-ale-gallery";
  const PHOTO_STORE = "photos";
  const ANIME_STORE = "animes";
  let photoDbPromise;
  function openPhotoDb() {
    if (photoDbPromise) return photoDbPromise;
    photoDbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(PHOTO_DB_NAME, 2);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(PHOTO_STORE)) request.result.createObjectStore(PHOTO_STORE, { keyPath: "id" });
        if (!request.result.objectStoreNames.contains(ANIME_STORE)) request.result.createObjectStore(ANIME_STORE, { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Não foi possível abrir o baú."));
    });
    return photoDbPromise;
  }
  async function photoStoreRequest(mode, action) {
    const db = await openPhotoDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PHOTO_STORE, mode);
      const request = action(transaction.objectStore(PHOTO_STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Falha ao acessar o baú."));
    });
  }
  const getAllPhotos = () => photoStoreRequest("readonly", (photos) => photos.getAll());
  const getPhoto = (id) => photoStoreRequest("readonly", (photos) => photos.get(id));
  const putPhoto = (photo) => photoStoreRequest("readwrite", (photos) => photos.put(photo));
  const removePhoto = (id) => photoStoreRequest("readwrite", (photos) => photos.delete(id));
  async function animeStoreRequest(mode, action) {
    const db = await openPhotoDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(ANIME_STORE, mode);
      const request = action(transaction.objectStore(ANIME_STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Falha ao acessar a estante."));
    });
  }
  const getAllAnimes = () => animeStoreRequest("readonly", (animes) => animes.getAll());
  const putAnime = (anime) => animeStoreRequest("readwrite", (animes) => animes.put(anime));
  const removeAnime = (id) => animeStoreRequest("readwrite", (animes) => animes.delete(id));

  function memoryDate(timestamp) {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(timestamp));
  }
  function revokeGalleryUrls() {
    memoryObjectUrls.forEach((url) => URL.revokeObjectURL(url));
    memoryObjectUrls = [];
  }
  async function optimizePhoto(file) {
    if (file.type === "image/gif") {
      if (file.size > 8 * 1024 * 1024) throw new Error("GIF maior que 8 MB");
      return file;
    }
    if (file.size > 20 * 1024 * 1024) throw new Error("imagem maior que 20 MB");
    if (!("createImageBitmap" in window)) return file;
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas.getContext("2d", { alpha: false }).drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close?.();
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", .84));
      return blob || file;
    } catch (_) {
      return file.size <= 8 * 1024 * 1024 ? file : Promise.reject(new Error("não consegui reduzir essa imagem"));
    }
  }
  function emptyMemoryGallery(message = "Seu primeiro momento pode morar aqui.") {
    const empty = document.createElement("div");
    empty.className = "memory-empty";
    const content = document.createElement("div");
    const icon = document.createElement("span");
    icon.textContent = "▣";
    const text = document.createElement("p");
    text.textContent = message;
    content.append(icon, text);
    empty.append(content);
    return empty;
  }
  async function renderMemoryGallery() {
    const gallery = byId("memoryGallery");
    revokeGalleryUrls();
    try {
      const photos = (await getAllPhotos()).sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) || b.createdAt - a.createdAt);
      const totalBytes = photos.reduce((sum, photo) => sum + (photo.size || photo.blob?.size || 0), 0);
      const totalLabel = `${photos.length} ${photos.length === 1 ? "momento" : "momentos"}`;
      byId("memoryStorage").textContent = `${totalLabel} · ${(totalBytes / 1024 / 1024).toFixed(totalBytes > 10485760 ? 0 : 1)} MB`;
      const query = byId("memorySearch").value.trim().toLocaleLowerCase("pt-BR");
      const visible = photos.filter((photo) => (memoryFilter !== "favorite" || photo.favorite) && (!query || `${photo.caption || ""} ${photo.name || ""}`.toLocaleLowerCase("pt-BR").includes(query)));
      gallery.replaceChildren();
      if (!visible.length) {
        gallery.append(emptyMemoryGallery(photos.length ? "Nenhum momento combina com esse filtro." : undefined));
        return;
      }
      visible.forEach((photo) => {
        const url = URL.createObjectURL(photo.blob);
        memoryObjectUrls.push(url);
        const card = document.createElement("article");
        card.className = "memory-card";
        const open = document.createElement("button");
        open.type = "button";
        open.setAttribute("aria-label", `Abrir ${photo.caption || photo.name || "momento"}`);
        const image = document.createElement("img");
        image.src = url;
        image.alt = photo.caption || "Momento guardado";
        image.loading = "lazy";
        open.append(image);
        open.addEventListener("click", () => openPhotoDialog(photo.id));
        const info = document.createElement("div");
        info.className = "memory-card-info";
        const row = document.createElement("div");
        const caption = document.createElement("input");
        caption.value = photo.caption || "";
        caption.maxLength = 100;
        caption.placeholder = "dar um nome a este momento…";
        caption.setAttribute("aria-label", "Legenda da memória");
        const saveCaption = debounce(async () => {
          photo.caption = caption.value.trim();
          await putPhoto(photo);
          byId("memoryStatus").textContent = "Legenda salva no baú.";
        }, 550);
        caption.addEventListener("input", saveCaption);
        const favorite = document.createElement("button");
        favorite.type = "button";
        favorite.className = photo.favorite ? "active" : "";
        favorite.textContent = photo.favorite ? "★" : "☆";
        favorite.setAttribute("aria-label", photo.favorite ? "Remover dos favoritos" : "Adicionar aos favoritos");
        favorite.addEventListener("click", async () => {
          photo.favorite = !photo.favorite;
          await putPhoto(photo);
          renderMemoryGallery();
        });
        const date = document.createElement("small");
        date.textContent = `${memoryDate(photo.createdAt)} · ${(photo.size / 1024 / 1024).toFixed(1)} MB`;
        row.append(caption, favorite);
        info.append(row, date);
        card.append(open, info);
        gallery.append(card);
      });
    } catch (_) {
      gallery.replaceChildren(emptyMemoryGallery("O navegador bloqueou o baú de imagens. Tente abrir o site fora do modo anônimo."));
      byId("memoryStatus").textContent = "Não foi possível acessar o armazenamento de fotos.";
    }
  }
  async function handlePhotoFiles(fileList) {
    const files = [...fileList].filter((file) => file.type.startsWith("image/")).slice(0, 24);
    if (!files.length) { byId("memoryStatus").textContent = "Escolha arquivos de imagem."; return; }
    byId("memoryStatus").textContent = `Preparando ${files.length} ${files.length === 1 ? "momento" : "momentos"}…`;
    let saved = 0;
    const problems = [];
    for (const file of files) {
      try {
        const blob = await optimizePhoto(file);
        const now = Date.now();
        await putPhoto({
          id: crypto.randomUUID ? crypto.randomUUID() : `photo-${now.toString(36)}-${Math.random().toString(36).slice(2)}`,
          name: file.name,
          type: blob.type || file.type,
          blob,
          caption: "",
          favorite: false,
          createdAt: now + saved,
          size: blob.size
        });
        saved += 1;
      } catch (error) { problems.push(`${file.name}: ${error.message}`); }
    }
    byId("memoryUpload").value = "";
    await renderMemoryGallery();
    byId("memoryStatus").textContent = saved ? `${saved} ${saved === 1 ? "momento guardado" : "momentos guardados"}.${problems.length ? ` ${problems.length} não entrou.` : ""}` : "Nenhuma imagem pôde ser guardada.";
    if (saved) showToast(saved === 1 ? "Momento guardado no seu baú ▣" : `${saved} momentos guardados no seu baú ▣`);
  }
  function closePhotoDialog() {
    const dialog = byId("photoDialog");
    if (dialog.open) dialog.close();
    if (currentPhotoUrl) URL.revokeObjectURL(currentPhotoUrl);
    currentPhotoUrl = null;
    currentPhotoId = null;
    byId("photoDialogImage").removeAttribute("src");
  }
  async function openPhotoDialog(id) {
    const photo = await getPhoto(id);
    if (!photo) return;
    if (currentPhotoUrl) URL.revokeObjectURL(currentPhotoUrl);
    currentPhotoId = id;
    currentPhotoUrl = URL.createObjectURL(photo.blob);
    byId("photoDialogImage").src = currentPhotoUrl;
    byId("photoDialogImage").alt = photo.caption || "Memória ampliada";
    byId("photoDialogDate").textContent = memoryDate(photo.createdAt);
    byId("photoDialogCaption").textContent = photo.caption || photo.name || "Momento guardado";
    byId("photoDialog").showModal();
  }
  async function downloadCurrentPhoto() {
    if (!currentPhotoId) return;
    const photo = await getPhoto(currentPhotoId);
    if (!photo) return;
    const url = URL.createObjectURL(photo.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = photo.name || `memoria-${localDayKey()}.webp`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function deleteCurrentPhoto() {
    if (!currentPhotoId || !window.confirm("Apagar esta imagem do baú deste navegador?")) return;
    await removePhoto(currentPhotoId);
    closePhotoDialog();
    await renderMemoryGallery();
    byId("memoryStatus").textContent = "Momento removido do baú.";
  }
  function setAnimeCoverPreview(file = null) {
    const image = byId("animeCoverPreviewImage");
    const placeholder = byId("animeCoverPlaceholder");
    if (animePreviewUrl) URL.revokeObjectURL(animePreviewUrl);
    animePreviewUrl = null;
    animeCoverFile = file;
    if (!file) {
      image.hidden = true;
      image.removeAttribute("src");
      placeholder.hidden = false;
      return;
    }
    animePreviewUrl = URL.createObjectURL(file);
    image.src = animePreviewUrl;
    image.hidden = false;
    placeholder.hidden = true;
  }
  function emptyAnimeLibrary(message = "Sua estante começa com o primeiro anime que você guardar.") {
    const empty = document.createElement("div");
    empty.className = "anime-library-empty";
    const icon = document.createElement("span");
    icon.textContent = "＋";
    const text = document.createElement("p");
    text.textContent = message;
    empty.append(icon, text);
    return empty;
  }
  function revokeAnimeUrls() {
    animeObjectUrls.forEach((url) => URL.revokeObjectURL(url));
    animeObjectUrls = [];
  }
  async function renderAnimeLibrary() {
    const grid = byId("animeLibraryGrid");
    revokeAnimeUrls();
    try {
      const all = (await getAllAnimes()).sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) || b.createdAt - a.createdAt);
      const query = byId("animeLibrarySearch").value.trim().toLocaleLowerCase("pt-BR");
      const visible = all.filter((anime) => !query || `${anime.name || ""} ${anime.note || ""}`.toLocaleLowerCase("pt-BR").includes(query));
      byId("animeLibraryCount").textContent = `${all.length} ${all.length === 1 ? "anime" : "animes"}`;
      grid.replaceChildren();
      if (!visible.length) {
        grid.append(emptyAnimeLibrary(all.length ? "Nenhum anime encontrou essa busca." : undefined));
        return;
      }
      visible.forEach((anime) => {
        const coverUrl = URL.createObjectURL(anime.cover);
        animeObjectUrls.push(coverUrl);
        const card = document.createElement("article");
        card.className = "saved-anime-card";
        const cover = document.createElement("div");
        cover.className = "saved-anime-cover";
        const image = document.createElement("img");
        image.src = coverUrl;
        image.alt = `Capa de ${anime.name}`;
        image.loading = "lazy";
        const favorite = document.createElement("button");
        favorite.type = "button";
        favorite.className = anime.favorite ? "active" : "";
        favorite.textContent = anime.favorite ? "★" : "☆";
        favorite.setAttribute("aria-label", anime.favorite ? `Remover ${anime.name} dos favoritos` : `Favoritar ${anime.name}`);
        favorite.addEventListener("click", async () => {
          anime.favorite = !anime.favorite;
          await putAnime(anime);
          renderAnimeLibrary();
        });
        cover.append(image, favorite);
        const body = document.createElement("div");
        body.className = "saved-anime-body";
        const watched = document.createElement("small");
        watched.textContent = "assistido";
        const title = document.createElement("h3");
        title.textContent = anime.name;
        const note = document.createElement("p");
        note.textContent = anime.note || "Guardado na sua estante.";
        const footer = document.createElement("footer");
        const date = document.createElement("span");
        date.textContent = memoryDate(anime.createdAt);
        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "remover";
        remove.setAttribute("aria-label", `Remover ${anime.name} da estante`);
        remove.addEventListener("click", async () => {
          if (!window.confirm(`Remover “${anime.name}” da sua estante?`)) return;
          await removeAnime(anime.id);
          await renderAnimeLibrary();
          showToast("Anime removido da estante.");
        });
        footer.append(date, remove);
        body.append(watched, title, note, footer);
        card.append(cover, body);
        grid.append(card);
      });
    } catch (_) {
      grid.replaceChildren(emptyAnimeLibrary("O navegador bloqueou a estante. Tente abrir fora do modo anônimo."));
      byId("animeFormStatus").textContent = "Não foi possível acessar o armazenamento da estante.";
    }
  }
  async function saveAnime(event) {
    event.preventDefault();
    const name = byId("animeName").value.trim();
    const note = byId("animeNote").value.trim();
    if (!name) { byId("animeFormStatus").textContent = "Escreva o nome do anime."; byId("animeName").focus(); return; }
    if (!animeCoverFile) { byId("animeFormStatus").textContent = "Escolha uma capa para o anime."; byId("animeCoverInput").click(); return; }
    byId("animeFormStatus").textContent = "Preparando a capa…";
    try {
      const cover = await optimizePhoto(animeCoverFile);
      const now = Date.now();
      await putAnime({
        id: crypto.randomUUID ? crypto.randomUUID() : `anime-${now.toString(36)}-${Math.random().toString(36).slice(2)}`,
        name,
        note,
        cover,
        coverType: cover.type || animeCoverFile.type,
        coverName: animeCoverFile.name,
        favorite: false,
        createdAt: now,
        size: cover.size
      });
      byId("animeForm").reset();
      setAnimeCoverPreview();
      byId("animeFormStatus").textContent = "Anime guardado na sua estante ✓";
      await renderAnimeLibrary();
      showToast(`${name} entrou na sua estante ✦`);
    } catch (error) {
      byId("animeFormStatus").textContent = `Não consegui guardar essa capa: ${error.message}`;
    }
  }
  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }
  function dataUrlToBlob(dataUrl) {
    const [header, data] = dataUrl.split(",");
    const mime = header.match(/data:([^;]+)/)?.[1] || "application/octet-stream";
    const bytes = atob(data);
    const array = new Uint8Array(bytes.length);
    for (let index = 0; index < bytes.length; index += 1) array[index] = bytes.charCodeAt(index);
    return new Blob([array], { type: mime });
  }
  async function exportNorteBackup() {
    if (journalDirty) saveCurrentJournal(false, true);
    byId("memoryStatus").textContent = "Montando seu backup…";
    try {
      const local = {};
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (key?.startsWith(PREFIX)) local[key] = localStorage.getItem(key);
      }
      const photos = await getAllPhotos();
      const portablePhotos = [];
      for (const photo of photos) portablePhotos.push({ ...photo, blob: undefined, dataUrl: await blobToDataUrl(photo.blob) });
      const animes = await getAllAnimes();
      const portableAnimes = [];
      for (const anime of animes) portableAnimes.push({ ...anime, cover: undefined, coverDataUrl: await blobToDataUrl(anime.cover) });
      const backup = { format: "norte-backup", version: 1, exportedAt: new Date().toISOString(), local, photos: portablePhotos, animes: portableAnimes };
      const blob = new Blob([JSON.stringify(backup)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `norte-backup-${localDayKey()}.json`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1200);
      byId("memoryStatus").textContent = "Backup completo baixado. Guarde esse arquivo.";
      showToast("Seu NORTE foi colocado em um arquivo seguro ✓");
    } catch (_) {
      byId("memoryStatus").textContent = "Não consegui criar o backup neste navegador.";
    }
  }
  async function importNorteBackup(file) {
    if (!file) return;
    byId("memoryStatus").textContent = "Lendo o backup…";
    try {
      const backup = JSON.parse(await file.text());
      if (backup.format !== "norte-backup" || backup.version !== 1 || typeof backup.local !== "object" || !Array.isArray(backup.photos)) throw new Error("Arquivo incompatível");
      if (!window.confirm("Restaurar este backup? Dados com o mesmo nome serão atualizados.")) { byId("importNorteBackup").value = ""; return; }
      Object.entries(backup.local).forEach(([key, value]) => {
        if (key.startsWith(PREFIX) && typeof value === "string") localStorage.setItem(key, value);
      });
      for (const photo of backup.photos) {
        if (!photo.id || typeof photo.dataUrl !== "string" || !photo.dataUrl.startsWith("data:image/")) continue;
        const blob = dataUrlToBlob(photo.dataUrl);
        await putPhoto({ id: photo.id, name: photo.name || "memoria.webp", type: blob.type, blob, caption: String(photo.caption || "").slice(0, 100), favorite: Boolean(photo.favorite), createdAt: Number(photo.createdAt) || Date.now(), size: blob.size });
      }
      for (const anime of Array.isArray(backup.animes) ? backup.animes : []) {
        if (!anime.id || typeof anime.coverDataUrl !== "string" || !anime.coverDataUrl.startsWith("data:image/")) continue;
        const cover = dataUrlToBlob(anime.coverDataUrl);
        await putAnime({ id: anime.id, name: String(anime.name || "Anime sem nome").slice(0, 100), note: String(anime.note || "").slice(0, 280), cover, coverType: cover.type, coverName: anime.coverName || "capa.webp", favorite: Boolean(anime.favorite), createdAt: Number(anime.createdAt) || Date.now(), size: cover.size });
      }
      byId("memoryStatus").textContent = "Backup restaurado. Reabrindo seu espaço…";
      showToast("Tudo voltou para o lugar ✓");
      window.setTimeout(() => location.reload(), 900);
    } catch (_) {
      byId("memoryStatus").textContent = "Esse arquivo não parece ser um backup válido do NORTE.";
      byId("importNorteBackup").value = "";
    }
  }

  function showWorldPanel(id) {
    document.querySelectorAll("[data-world-tab]").forEach((button) => button.classList.toggle("active", button.dataset.worldTab === id));
    document.querySelectorAll(".world-panel").forEach((panel) => {
      const active = panel.id === id;
      panel.hidden = !active;
      panel.classList.toggle("active", active);
    });
    store.set("world-tab", id);
  }
  function chooseGame() {
    const current = byId("gamePick").textContent;
    const options = gamePicks.filter((item) => item !== current);
    byId("gamePick").textContent = options[Math.floor(Math.random() * options.length)];
  }
  function chooseVibe(name) {
    const vibe = vibeInfo[name];
    if (!vibe) return;
    document.querySelectorAll("[data-vibe]").forEach((button) => button.classList.toggle("active", button.dataset.vibe === name));
    const result = byId("vibeResult");
    result.replaceChildren(document.createTextNode(vibe.text));
    if (vibe.video) {
      const go = document.createElement("button");
      go.type = "button";
      go.textContent = "levar esta estação para a tela inicial ↗";
      go.addEventListener("click", () => {
        selectStation(document.querySelector(`.station[data-video="${vibe.video}"]`));
        showView("homeView");
      });
      result.append(go);
    }
  }
  function titleItems() { return store.get("my-titles", []); }
  function renderTitleList() {
    const container = byId("titleList");
    const items = titleItems();
    container.replaceChildren();
    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "title-empty";
      empty.textContent = "Sua estante começa com um título.";
      container.append(empty);
      return;
    }
    items.forEach((title, index) => {
      const item = document.createElement("div");
      item.className = "title-item";
      const name = document.createElement("span");
      name.textContent = title;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `Remover ${title}`);
      remove.addEventListener("click", () => {
        const next = titleItems();
        next.splice(index, 1);
        store.set("my-titles", next);
        renderTitleList();
      });
      item.append(name, remove);
      container.append(item);
    });
  }
  function addTitle() {
    const input = byId("titleInput");
    const title = input.value.trim();
    if (!title) return;
    const items = titleItems();
    if (!items.some((item) => item.toLocaleLowerCase("pt-BR") === title.toLocaleLowerCase("pt-BR"))) items.push(title);
    store.set("my-titles", items.slice(-50));
    input.value = "";
    renderTitleList();
  }

  function organizeThought() {
    const fact = byId("factText").value.trim();
    const fear = byId("fearText").value.trim();
    const answer = byId("clarityAnswer");
    if (!fact && !fear) answer.textContent = "Começa com uma frase. Não precisa escrever bonito.";
    else if (!fact) answer.textContent = "Isso parece uma previsão. Agora procure algo que você realmente consiga confirmar.";
    else if (!fear) answer.textContent = "Você encontrou o fato. Agora escolha uma ação pequena que dependa de você.";
    else answer.textContent = "Use o fato para escolher o próximo passo. A previsão pode esperar até você ter mais certeza.";
  }
  function northTaskState() {
    return [...document.querySelectorAll("[data-north-task-text]")].map((input, index) => ({ text: input.value, done: byId("northTasks").querySelector(`[data-north-task-check="${index}"]`).checked }));
  }
  function saveNorthTasks() {
    const tasks = northTaskState();
    store.set("north-tasks", tasks);
    renderNorthProgress(tasks);
  }
  function renderNorthProgress(tasks = northTaskState()) {
    const done = tasks.filter((task) => task.done).length;
    byId("northProgress").style.width = `${(done / tasks.length) * 100}%`;
    byId("northProgressLabel").textContent = `${done} de ${tasks.length}`;
  }
  function loadNorthTasks() {
    const tasks = store.get("north-tasks", null);
    if (Array.isArray(tasks) && tasks.length === 3) {
      tasks.forEach((task, index) => {
        const text = document.querySelector(`[data-north-task-text="${index}"]`);
        const check = document.querySelector(`[data-north-task-check="${index}"]`);
        if (text) text.value = task.text || "";
        if (check) check.checked = Boolean(task.done);
      });
    }
    renderNorthProgress();
  }

  const saveClarity = debounce(() => store.set("clarity", { fact: byId("factText").value, fear: byId("fearText").value }), 650);
  const saveFutureLetter = debounce(() => {
    store.set("future-letter", byId("futureLetter").value);
    byId("futureStatus").textContent = "carta salva neste navegador ✓";
    window.setTimeout(() => { byId("futureStatus").textContent = "privado e salvo neste navegador"; }, 1300);
  }, 900);
  const saveFocus = debounce(() => {
    store.set("main-focus", byId("mainFocus").value);
    byId("focusStatus").textContent = "salvo";
    window.setTimeout(() => { byId("focusStatus").textContent = "privado"; }, 900);
  }, 500);

  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => showView(button.dataset.view)));
  document.querySelectorAll("[data-go-view]").forEach((button) => button.addEventListener("click", () => showView(button.dataset.goView)));
  byId("sideCollapse").addEventListener("click", () => {
    document.body.classList.toggle("side-closed");
    store.set("side-closed", document.body.classList.contains("side-closed"));
  });
  byId("performanceToggle").addEventListener("click", () => {
    const enabled = document.body.classList.toggle("performance-mode");
    byId("performanceToggle").setAttribute("aria-pressed", String(enabled));
    store.set("performance-mode", enabled);
  });
  byId("skipIntro").addEventListener("click", closeIntro);
  byId("replayIntro").addEventListener("click", playIntro);
  document.addEventListener("pointermove", (event) => {
    if (document.body.classList.contains("writing-mode") || document.body.classList.contains("performance-mode") || pointerFrame) return;
    const x = event.clientX;
    const y = event.clientY;
    pointerFrame = window.requestAnimationFrame(() => {
      document.documentElement.style.setProperty("--mouse-x", `${x}px`);
      document.documentElement.style.setProperty("--mouse-y", `${y}px`);
      pointerFrame = 0;
    });
  }, { passive: true });
  document.querySelectorAll(".station").forEach((button) => button.addEventListener("click", () => selectStation(button)));
  byId("nextThought").addEventListener("click", nextThought);
  byId("quietOrbit").addEventListener("click", createStar);
  document.querySelectorAll("[data-day-mood]").forEach((button) => button.addEventListener("click", () => saveDailyMood(button.dataset.dayMood)));
  byId("saveJoy").addEventListener("click", saveJoy);
  byId("randomJoy").addEventListener("click", randomJoy);
  byId("joyInput").addEventListener("keydown", (event) => { if (event.key === "Enter") saveJoy(); });

  byId("newJournalPage").addEventListener("click", newJournalPage);
  byId("journalTitle").addEventListener("input", queueJournalSave);
  byId("journalBody").addEventListener("input", queueJournalSave);
  byId("journalSearch").addEventListener("input", renderJournalPages);
  byId("favoriteJournal").addEventListener("click", () => { setJournalFavorite(!currentJournalFavorite); queueJournalSave(); });
  document.querySelectorAll("[data-journal-mood]").forEach((button) => button.addEventListener("click", () => {
    setJournalMood(button.dataset.journalMood === currentJournalMood ? "" : button.dataset.journalMood);
    queueJournalSave();
  }));
  byId("journalPrompt").addEventListener("click", () => {
    byId("journalBody").placeholder = journalPrompts[Math.floor(Math.random() * journalPrompts.length)];
    byId("journalPrompt").textContent = "Outra pergunta ↻";
    byId("journalBody").focus();
  });
  byId("saveJournal").addEventListener("click", () => saveCurrentJournal(true, true));
  byId("exportJournal").addEventListener("click", exportJournal);
  byId("deleteJournal").addEventListener("click", () => { if (currentJournalId) byId("deleteDialog").showModal(); });
  byId("cancelDelete").addEventListener("click", () => byId("deleteDialog").close());
  byId("confirmDelete").addEventListener("click", deleteCurrentJournal);
  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "s" && currentView === "journalView") {
      event.preventDefault();
      saveCurrentJournal(true, true);
    }
  });

  byId("breathButton").addEventListener("click", () => breathing ? stopBreathing(false) : startBreathing());
  byId("releaseButton").addEventListener("click", releaseThought);
  byId("releaseText").addEventListener("keydown", (event) => { if (event.key === "Enter") releaseThought(); });
  byId("rainRange").addEventListener("input", (event) => {
    document.documentElement.style.setProperty("--rain-opacity", String(event.target.value / 100));
    store.set("rain", Number(event.target.value));
  });
  byId("dimButton").addEventListener("click", () => {
    const dimmed = document.body.classList.toggle("dimmed");
    byId("dimButton").setAttribute("aria-pressed", String(dimmed));
    byId("dimButton").textContent = dimmed ? "Acender um pouco as luzes" : "Apagar um pouco as luzes";
    store.set("dimmed", dimmed);
  });
  document.querySelectorAll("[data-timer-minutes]").forEach((button) => button.addEventListener("click", () => setTimerPreset(Number(button.dataset.timerMinutes))));
  byId("timerButton").addEventListener("click", toggleRestTimer);
  byId("groundNext").addEventListener("click", () => { groundIndex = (groundIndex + 1) % groundSteps.length; renderGroundStep(); });

  byId("resetMemoryGame").addEventListener("click", initMemoryGame);
  byId("startStarGame").addEventListener("click", startStarGame);
  byId("gameStar").addEventListener("click", () => {
    if (!starGameRunning) return;
    starGameScore += 1;
    byId("starScore").textContent = String(starGameScore);
    placeGameStar();
  });
  document.querySelectorAll("[data-garden-color]").forEach((button) => button.addEventListener("click", () => {
    gardenColor = button.dataset.gardenColor;
    document.querySelectorAll("[data-garden-color]").forEach((item) => item.classList.toggle("active", item === button));
  }));
  byId("clearGarden").addEventListener("click", () => {
    [...byId("lightGarden").children].forEach((cell) => { cell.className = "garden-cell"; cell.dataset.color = "off"; });
    store.set("light-garden", Array(72).fill("off"));
  });

  byId("memoryUpload").addEventListener("change", (event) => handlePhotoFiles(event.target.files));
  const memoryDropZone = byId("memoryDropZone");
  ["dragenter", "dragover"].forEach((name) => memoryDropZone.addEventListener(name, (event) => {
    event.preventDefault();
    memoryDropZone.classList.add("dragging");
  }));
  ["dragleave", "drop"].forEach((name) => memoryDropZone.addEventListener(name, (event) => {
    event.preventDefault();
    memoryDropZone.classList.remove("dragging");
  }));
  memoryDropZone.addEventListener("drop", (event) => handlePhotoFiles(event.dataTransfer.files));
  byId("memorySearch").addEventListener("input", debounce(renderMemoryGallery, 220));
  document.querySelectorAll("[data-memory-filter]").forEach((button) => button.addEventListener("click", () => {
    memoryFilter = button.dataset.memoryFilter;
    document.querySelectorAll("[data-memory-filter]").forEach((item) => item.classList.toggle("active", item === button));
    renderMemoryGallery();
  }));
  byId("closePhotoDialog").addEventListener("click", closePhotoDialog);
  byId("photoDialog").addEventListener("click", (event) => { if (event.target === byId("photoDialog")) closePhotoDialog(); });
  byId("downloadPhoto").addEventListener("click", downloadCurrentPhoto);
  byId("deletePhoto").addEventListener("click", deleteCurrentPhoto);
  byId("exportNorteBackup").addEventListener("click", exportNorteBackup);
  byId("importNorteBackup").addEventListener("change", (event) => importNorteBackup(event.target.files[0]));

  document.querySelectorAll("[data-world-tab]").forEach((button) => button.addEventListener("click", () => showWorldPanel(button.dataset.worldTab)));
  byId("animeCoverInput").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file?.type.startsWith("image/")) { setAnimeCoverPreview(); byId("animeFormStatus").textContent = "Escolha um arquivo de imagem."; return; }
    setAnimeCoverPreview(file);
    byId("animeFormStatus").textContent = "Capa pronta. Agora escreve o nome.";
  });
  byId("animeForm").addEventListener("submit", saveAnime);
  byId("animeLibrarySearch").addEventListener("input", debounce(renderAnimeLibrary, 220));
  byId("pickGame").addEventListener("click", chooseGame);
  document.querySelectorAll("[data-vibe]").forEach((button) => button.addEventListener("click", () => chooseVibe(button.dataset.vibe)));
  byId("addTitle").addEventListener("click", addTitle);
  byId("titleInput").addEventListener("keydown", (event) => { if (event.key === "Enter") addTitle(); });

  byId("factText").addEventListener("input", saveClarity);
  byId("fearText").addEventListener("input", saveClarity);
  byId("organizeButton").addEventListener("click", organizeThought);
  byId("mainFocus").addEventListener("input", saveFocus);
  document.querySelectorAll("[data-north-task-text]").forEach((input) => input.addEventListener("input", debounce(saveNorthTasks, 600)));
  document.querySelectorAll("[data-north-task-check]").forEach((input) => input.addEventListener("change", saveNorthTasks));
  byId("futureLetter").addEventListener("input", () => { byId("futureStatus").textContent = "escrevendo…"; saveFutureLetter(); });
  window.addEventListener("beforeunload", () => { if (journalDirty) saveCurrentJournal(false, false); });

  initPerformanceMode();
  initIntro();
  updateClock();
  window.setInterval(updateClock, 30000);
  document.body.classList.toggle("side-closed", Boolean(store.get("side-closed", false)));
  const rain = store.get("rain", 48);
  byId("rainRange").value = String(rain);
  document.documentElement.style.setProperty("--rain-opacity", String(rain / 100));
  const dimmed = Boolean(store.get("dimmed", false));
  document.body.classList.toggle("dimmed", dimmed);
  byId("dimButton").setAttribute("aria-pressed", String(dimmed));
  byId("dimButton").textContent = dimmed ? "Acender um pouco as luzes" : "Apagar um pouco as luzes";
  const stationId = store.get("station", "rFZHOHl-L8A");
  selectStation(document.querySelector(`.station[data-video="${stationId}"]`) || document.querySelector(".station"), false);
  renderDailyMoods();
  renderJoyCount();
  migrateOldJournal();
  renderJournalPages();
  const pages = journalPages().sort((a, b) => b.updatedAt - a.updatedAt);
  if (pages[0]) loadJournalPage(pages[0].id);
  else newJournalPage();
  setTimerPreset(5);
  renderGroundStep();
  initMemoryGame();
  initLightGarden();
  renderMemoryGallery();
  renderAnimeLibrary();
  const savedPanel = store.get("world-tab", "animePanel");
  showWorldPanel(["animePanel", "gamesPanel", "listsPanel"].includes(savedPanel) ? savedPanel : "animePanel");
  renderTitleList();
  const clarity = store.get("clarity", { fact: "", fear: "" });
  byId("factText").value = clarity.fact || "";
  byId("fearText").value = clarity.fear || "";
  byId("mainFocus").value = store.get("main-focus", "");
  loadNorthTasks();
  byId("futureLetter").value = store.get("future-letter", "");
  const savedView = store.get("active-view", "homeView");
  showView(viewInfo[savedView] ? savedView : "homeView", false);
})();
