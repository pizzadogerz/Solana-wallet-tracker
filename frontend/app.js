// ================================================================
// Solana Wallet Tracker frontend
// ================================================================

// When Kalachuchi's API Gateway is live, paste its URL here, e.g.
// "https://abc123.execute-api.ap-southeast-1.amazonaws.com"
// While it's empty, the page uses the mock data below (same shape as sample.json).
const API_BASE = "";

const SAMPLE_WALLET = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

const MOCK_DATA = {
  wallet: SAMPLE_WALLET,
  asOf: "2026-09-24T04:00:00Z",
  totalPnlUsd: 140.0,
  holdings: [
    { mint: "So11111111111111111111111111111111111111112", symbol: "SOL", amount: 12.5, avgCostUsd: 145.2, currentPriceUsd: 162.8, unrealizedPnlUsd: 220.0 },
    { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", symbol: "USDC", amount: 350.0, avgCostUsd: 1.0, currentPriceUsd: 1.0, unrealizedPnlUsd: 0.0 },
    { mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", symbol: "JUP", amount: 500.0, avgCostUsd: 0.95, currentPriceUsd: 0.79, unrealizedPnlUsd: -80.0 },
  ],
  history: [
    { date: "2026-09-18", portfolioValueUsd: 2380.15 },
    { date: "2026-09-19", portfolioValueUsd: 2415.6 },
    { date: "2026-09-20", portfolioValueUsd: 2402.9 },
    { date: "2026-09-21", portfolioValueUsd: 2478.35 },
    { date: "2026-09-22", portfolioValueUsd: 2521.75 },
    { date: "2026-09-23", portfolioValueUsd: 2495.2 },
    { date: "2026-09-24", portfolioValueUsd: 2559.75 },
  ],
};

// ---------- Demo wallets (only used while API_BASE is empty) ----------
// Each one is built to land on a different rank title, so you can test every reaction.
const MINTS = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  JUP: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  WIF: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
};
const demoAddr = (name) => ("Demo" + name).padEnd(44, "1"); // fake but valid looking address
const tok = (symbol, amount, avgCostUsd, currentPriceUsd) => ({
  mint: MINTS[symbol], symbol, amount, avgCostUsd, currentPriceUsd,
  unrealizedPnlUsd: +((currentPriceUsd - avgCostUsd) * amount).toFixed(2),
});
function demoHistory(endValue, weekPct) {
  const start = endValue / (1 + weekPct / 100);
  const shape = [0, 0.3, 0.15, 0.55, 0.8, 0.65, 1]; // same zigzag for every demo
  return shape.map((t, i) => ({
    date: new Date(Date.UTC(2026, 8, 18 + i)).toISOString().slice(0, 10),
    portfolioValueUsd: +(start + (endValue - start) * t).toFixed(2),
  }));
}
function demoWallet(name, holdings, weekPct) {
  const value = holdings.reduce((s, h) => s + h.amount * h.currentPriceUsd, 0);
  const pnl = holdings.reduce((s, h) => s + h.unrealizedPnlUsd, 0);
  return {
    wallet: demoAddr(name), asOf: MOCK_DATA.asOf, totalPnlUsd: +pnl.toFixed(2),
    holdings, history: holdings.length ? demoHistory(value, weekPct) : [],
  };
}
const DEMOS = [
  { label: "SOL Maxi", data: MOCK_DATA },
  { label: "W Collector", data: demoWallet("Winner", [tok("SOL", 20, 110, 162.8), tok("JUP", 1000, 0.5, 0.79)], 18) },
  { label: "Bag Holder", data: demoWallet("BagHo1der", [tok("JUP", 3000, 1.4, 0.79), tok("WIF", 400, 3.2, 1.9)], -14) },
  { label: "Stablecoin Andy", data: demoWallet("Stab1ecoinAndy", [tok("USDC", 4000, 1, 1), tok("SOL", 3, 150, 162.8)], 1.2) },
  { label: "Quiet Winner", data: demoWallet("QuietWinner", [tok("SOL", 5, 155, 162.8), tok("JUP", 1500, 0.7, 0.79), tok("USDC", 900, 1, 1)], 4) },
  { label: "Down Bad", data: demoWallet("DownBad", [tok("SOL", 6, 175, 162.8), tok("JUP", 1200, 0.9, 0.79), tok("USDC", 600, 1, 1)], -6) },
  { label: "Balanced", data: demoWallet("Ba1anced", [tok("SOL", 4, 162.8, 162.8), tok("JUP", 1000, 0.79, 0.79), tok("USDC", 500, 1, 1)], 0) },
  { label: "Empty", data: demoWallet("EmptyPockets", [], 0) },
];

// ---------- Meme lines (swap these for your own anytime) ----------
const LINES = {
  idle: ["drop a wallet, gng", "i'm just a dog, brother", "paste it, i don't bite", "who we stalking today gng"],
  poke: ["ayo stop poking me brother", "that tickles gng", "bro really clicked the dog", "i'm working here gng", "one more poke and i'm telling"],
  typing: ["ooh what's this", "keep going brother", "i'm watching gng 👀"],
  valid: ["that looks legit gng", "valid wallet, let's cook", "hit enter brother"],
  invalid: ["that ain't a wallet brother", "gng that's too short", "nah that has weird characters"],
  loading: ["hold up brother, reading the chain", "asking the validators nicely", "counting your bags gng", "almost there, don't refresh"],
  up: ["we eating good gng", "bro is up, respect", "green across the board brother", "cooking fr"],
  flat: ["perfectly balanced, as all things should be", "not up, not down, just vibing gng"],
  down: ["it's joever brother", "gng we gotta talk", "unc the bags are heavy", "it's fine, it's just unrealized"],
  holdingUp: ["this one's carrying the team", "bro bought the dip for real"],
  holdingDown: ["this one owes you money brother", "hold or fold gng"],
  holdingFlat: ["stable like your mom's tupperware", "boring but safe gng"],
  copied: ["copied gng", "address copied brother"],
  error: ["chain said no, brother", "something broke gng"],
};
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ---------- Element shortcuts ----------
const $ = (id) => document.getElementById(id);
const els = {
  searchView: $("searchView"), resultsView: $("resultsView"), loadingView: $("loadingView"),
  form: $("searchForm"), input: $("addr"), hint: $("hint"), bubble: $("bubble"), mascot: $("mascot"),
  holdings: $("holdings"), holdSort: $("holdSort"), historyBody: $("historyBody"), historyEmpty: $("historyEmpty"),
  toast: $("toast"), loadingLine: $("loadingLine"),
};

// ---------- Formatting helpers ----------
const usd = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const signedUsd = (n) => (n > 0 ? "+" : n < 0 ? "-" : "") + usd(Math.abs(n));
const pct = (n) => (n > 0 ? "+" : "") + n.toFixed(2) + "%";
const tone = (n) => (n > 0 ? "up" : n < 0 ? "down" : "");
const shortAddr = (a) => a.slice(0, 4) + "…" + a.slice(-4);
const prettyDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// Solana addresses are base58: no 0, O, I or l, and 32 to 44 characters long
const isValidAddress = (a) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ================================================================
// Themes
// ================================================================
function setTheme(name) {
  document.documentElement.dataset.theme = name;
  document.querySelectorAll("[data-theme-pick]").forEach((b) => {
    b.setAttribute("aria-checked", String(b.dataset.themePick === name));
  });
  try { localStorage.setItem("swt-theme", name); } catch (e) { /* storage blocked, no big deal */ }
  if (chart) renderChart(currentData); // repaint chart in new colors
}
document.querySelectorAll("[data-theme-pick]").forEach((b) => {
  b.addEventListener("click", () => setTheme(b.dataset.themePick));
});

// ================================================================
// Mascot: eyes follow the cursor, moods, speech bubble
// ================================================================
// copy the big blob's drawing into the small one on the results card
const miniMascot = $("miniMascot");
const miniBubble = $("miniBubble");
// (it gets its own gradient id, since the big blob's is hidden on the results screen)
miniMascot.innerHTML = $("blobTpl").innerHTML.replaceAll("blobGrad", "blobGradMini");

document.addEventListener("pointermove", (e) => {
  document.querySelectorAll(".pupil").forEach((p) => {
    if (!p.getBoundingClientRect().width) return; // skip blobs that are hidden
    const eye = p.parentElement.getBoundingClientRect();
    const cx = eye.left + eye.width / 2;
    const cy = eye.top + eye.height / 2;
    const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
    const dist = Math.min(7, Math.hypot(e.clientX - cx, e.clientY - cy) / 20);
    p.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`;
  });
});

const MOUTHS = {
  idle: "M84 124 Q100 136 116 124",
  happy: "M78 118 Q100 146 122 118",
  party: "M76 116 Q100 152 124 116 Z",
  worried: "M84 130 Q92 122 100 130 Q108 138 116 130",
  sad: "M82 134 Q100 118 118 134",
  loading: "M94 126 Q100 132 106 126",
};
function setMood(mood, blob = els.mascot) {
  blob.dataset.mood = mood;
  const mouth = blob.querySelector(".mouth"); // the hero cat has no mouth to redraw
  if (mouth) mouth.setAttribute("d", MOUTHS[mood] || MOUTHS.idle);
}

function say(text, bubble = els.bubble) {
  bubble.textContent = text;
  bubble.classList.remove("pop");
  void bubble.offsetWidth; // restart the animation
  bubble.classList.add("pop");
}

function squish(blob) {
  blob.classList.remove("squish");
  void blob.offsetWidth;
  blob.classList.add("squish");
}

// poking the small blob on the results card
miniMascot.addEventListener("click", () => {
  squish(miniMascot);
  const pnl = currentData?.totalPnlUsd || 0;
  say(pick(pnl > 0 ? LINES.up : pnl < 0 ? LINES.down : LINES.poke), miniBubble);
});

// ---------- Reaction memes on the results card ----------
// Each meme: src, alt, bubble (what it says first), lines (what it says when clicked).
// soft: edges faded instead of cut out, so no glow. credit: shown under it. confetti: on click.
const MEMES = {
  clapCat: {
    src: "assets/clap-cat.webp", alt: "A black cat standing up and clapping", bubble: "W wallet gng 👏", confetti: true,
    lines: ["the cat approves gng", "standing ovation brother", "even the cat is proud of you", "W W W W"],
  },
  goldenDog: {
    src: "assets/w-dog.webp", alt: "A golden retriever standing up and doing a victory dance", bubble: "victory dance gng 🕺", confetti: true,
    lines: ["he's been practicing this for weeks", "bro is up so bad the dog is dancing", "W W W, no L in sight", "certified. collected. dancing."],
  },
  pointDog: {
    src: "assets/w-point-dog.webp", alt: "A dog standing up and pointing at the sky", bubble: "number go up ☝️", confetti: true,
    lines: ["up only brother", "to the moon, and he's pointing at it", "chart said ☝️ so dog said ☝️", "bro called the top. it kept going."],
  },
  quietCat: {
    src: "assets/quiet-cat.webp", alt: "A calico cat dancing with a completely serious face", bubble: "acting like it's nothing",
    lines: ["straight face, green bags", "not bragging, just vibing gng", "she's up and she doesn't care", "silent W brother"],
  },
  andyDog: {
    src: "assets/andy-dog.webp", alt: "A dog lying on its back, lazily clapping", bubble: "safe and comfy gng",
    lines: ["lying down, still winning", "0% stress, 100% USDC", "polite clap for my stablecoins", "andy doesn't get up for less than 1%"],
  },
  maxiKitten: {
    src: "assets/maxi-kitten.webp", alt: "A tiny kitten throwing punches", credit: "clip by @akash_sidhu_123", bubble: "say one bad word about my coin",
    lines: ["one coin, and it will fight you for it", "diversify? never heard of her", "tiny wallet, big loyalty gng", "come at my bag brother"],
  },
  earsMonkey: {
    src: "assets/ears-monkey.webp", alt: "A little monkey covering its ears", bubble: "la la la can't hear the losses",
    lines: ["don't tell me the price brother", "if i don't look, it's not real", "selective hearing, diamond hands", "nope. not listening. holding."],
  },
  cookedDog: {
    src: "assets/cooked-dog.webp", alt: "A dachshund looking down, then up nervously", bubble: "am i cooked?",
    lines: ["lowkey yes brother", "slightly cooked, still edible", "it's giving medium rare gng", "look at me. you're fine. maybe."],
  },
  dazedCat: {
    src: "assets/l-cat.webp", alt: "A dazed cat staring into the camera", bubble: "it's joever brother",
    lines: ["bro saw his portfolio", "this cat has seen things gng", "unrealized loss, realized pain", "we hold. we cry. we hold."],
  },
  thinkCat: {
    src: "assets/think-cat.webp", alt: "A cat with its paw on its chin, thinking", bubble: "buy? sell? ...nah",
    lines: ["perfectly balanced, deeply thinking", "zero PnL needs zero decisions", "the cat is calculating gng", "hmm. hmm. still zero."],
  },
  danceCat: {
    src: "assets/flat-cat.gif", alt: "A cat dancing, unbothered", bubble: "unbothered. moisturized.",
    lines: ["not up, not down, just dancing", "zero PnL, full vibes gng", "the cat doesn't care brother"],
  },
  standDog: {
    src: "assets/stand-dog.webp", alt: "A chihuahua standing up on its back legs, perfectly still", bubble: "zero PnL, full vibes gng",
    lines: ["perfectly balanced, perfectly still", "not up, not down, just standing here", "holding the line at exactly zero", "no moves, no losses brother"],
  },
  carDog: {
    src: "assets/car-dog.webp", alt: "A chihuahua sitting calmly in a car", bubble: "wake me up when it's a bull run",
    lines: ["just cruising on stablecoins gng", "scenic drive, zero volatility", "seatbelt on, risk off", "are we there yet? (no, still 0%)"],
  },
  helloDog: {
    src: "assets/hello-dog.webp", alt: "A golden retriever leaning into the camera like ummm hello", bubble: "ummm hellooo? where's the money",
    lines: ["the wallet is giving air", "knock knock, anybody home?", "bro there's nothing in here", "hellooo? any tokens??"],
  },
  cryingPug: {
    src: "assets/crying-pug.webp", alt: "A pug crying while staring at a phone", bubble: "unrealized loss, realized pain",
    lines: ["he checked the chart again", "stop refreshing brother", "it's fine, they're just tears", "the phone said red. the pug said 😢"],
  },
  thinkMonkey: {
    src: "assets/think-monkey.webp", alt: "A monkey rubbing its chin, deep in thought", bubble: "hmm, where did my coins go",
    lines: ["let me think... nope, still empty", "big brain, empty wallet", "thinking about buying something gng", "the wallet is a mystery brother"],
  },
};

// Memes per rank title. When a title has more than one, a random one shows
// and clicking it swaps to the next. "Maxi" covers SOL Maxi, JUP Maxi, and so on.
const RANK_MEMES = {
  "Certified W Collector": [MEMES.pointDog, MEMES.goldenDog],
  "Quiet Winner": [MEMES.quietCat],
  "Stablecoin Andy": [MEMES.andyDog, MEMES.carDog],
  Maxi: [MEMES.maxiKitten],
  "Professional Bag Holder": [MEMES.earsMonkey, MEMES.cryingPug],
  "Down Bad": [MEMES.cookedDog, MEMES.dazedCat],
  "Perfectly Balanced": [MEMES.thinkCat, MEMES.standDog],
  "Empty Pockets": [MEMES.thinkMonkey, MEMES.helloDog],
};
const memesFor = (title, pnl) =>
  RANK_MEMES[title] || (title.endsWith(" Maxi") ? RANK_MEMES.Maxi : null)
  || (pnl > 0 ? [MEMES.clapCat] : pnl < 0 ? [MEMES.dazedCat] : [MEMES.danceCat]);
let memeSet = [];
let memeIndex = 0;
let memeTone = "flat";

const clapCat = $("clapCat");
function restartGif() {
  const img = clapCat.querySelector("img");
  const src = img.getAttribute("src").split("?")[0];
  img.src = src + "?t=" + Date.now(); // makes the gif play from the start
}
function showMeme(i, talk) {
  memeIndex = i % memeSet.length;
  const m = memeSet[memeIndex];
  const img = clapCat.querySelector("img");
  img.src = m.src;
  img.alt = m.alt;
  restartGif();
  clapCat.classList.toggle("is-soft", !!m.soft); // faded edges, no glow needed
  clapCat.classList.toggle("is-rank", memeTone === "up");
  clapCat.classList.toggle("is-l", memeTone === "down");
  $("memeCredit").textContent = m.credit || "";
  $("memeCredit").hidden = !m.credit;
  if (talk) say(pick(m.lines), miniBubble);
  else miniBubble.textContent = m.bubble;
}
clapCat.addEventListener("click", () => {
  squish(clapCat);
  if (memeSet.length > 1) {
    showMeme(memeIndex + 1, true); // swap to the next meme for this title
  } else {
    restartGif();
    say(pick(memeSet[memeIndex].lines), miniBubble);
  }
  if (memeSet[memeIndex].confetti) burstConfetti();
});

let pokeCount = 0;
els.mascot.addEventListener("click", () => {
  pokeCount++;
  squish(els.mascot);
  if (pokeCount >= 7) {
    say("ok fine, here's the sample wallet gng");
    pokeCount = 0;
    setTimeout(() => runSearch(SAMPLE_WALLET), 700);
  } else {
    say(pick(LINES.poke));
  }
});

// ================================================================
// Search input: live validation with mascot reactions
// ================================================================
// Address x-ray: shows a valid address as tiles, colored by character type
function renderXray(addr) {
  const box = $("xray");
  box.hidden = !addr;
  if (!addr) return;
  const type = (c) => (/[0-9]/.test(c) ? "digit" : /[A-Z]/.test(c) ? "upper" : "lower");
  $("xrayTiles").innerHTML = [...addr]
    .map((c, i) => `<span class="t-${type(c)}" style="animation-delay:${i * 12}ms">${c}</span>`)
    .join("");
  const count = (t) => [...addr].filter((c) => type(c) === t).length;
  $("xrayCounts").innerHTML =
    `${addr.length} characters: <b class="c-digit">${count("digit")} numbers</b>, ` +
    `<b class="c-upper">${count("upper")} capitals</b>, <b>${count("lower")} lowercase</b>`;
}
$("xrayWhyBtn").addEventListener("click", (e) => {
  const why = $("xrayWhy");
  why.hidden = !why.hidden;
  e.currentTarget.setAttribute("aria-expanded", String(!why.hidden));
});

// Husky shows up when a search fails or you submit a bad address
const errorPic = $("errorPic");
function showErrorPic(show) {
  errorPic.hidden = !show;
  els.mascot.hidden = show;
}

function updateValidation() {
  showErrorPic(false); // typing again brings the dog back
  const value = els.input.value.trim();
  if (!isValidAddress(value)) renderXray("");
  els.form.classList.remove("valid", "invalid");
  els.hint.classList.remove("good", "bad");

  if (!value) {
    setMood("idle");
    els.hint.innerHTML = "32 to 44 characters. Press <kbd>/</kbd> anytime to jump here.";
    return false;
  }
  const valid = isValidAddress(value);
  renderXray(valid ? value : "");
  if (valid) {
    els.form.classList.add("valid");
    els.hint.classList.add("good");
    els.hint.textContent = "Looks like a real Solana address.";
    if (els.mascot.dataset.mood !== "happy") say(pick(LINES.valid));
    setMood("happy");
    return true;
  }
  // still typing vs clearly wrong
  if (/[^1-9A-HJ-NP-Za-km-z]/.test(value) || value.length > 44) {
    els.form.classList.add("invalid");
    els.hint.classList.add("bad");
    els.hint.textContent = "Solana addresses don't use 0, O, I, l, spaces or symbols.";
    if (els.mascot.dataset.mood !== "worried") say("nah that has weird characters");
    setMood("worried");
  } else {
    els.hint.textContent = `${value.length} of at least 32 characters.`;
    if (els.mascot.dataset.mood !== "idle") say(pick(LINES.typing));
    setMood("idle");
  }
  return false;
}
els.input.addEventListener("input", updateValidation);

els.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = els.input.value.trim();
  if (isValidAddress(value)) {
    runSearch(value);
  } else {
    els.form.classList.remove("shake");
    void els.form.offsetWidth;
    els.form.classList.add("shake", "invalid");
    setMood("worried");
    if (value) {
      showErrorPic(true);
      say("who gave you this address brother");
    } else {
      say("you gotta paste something first brother");
    }
  }
});

$("pasteBtn").addEventListener("click", async () => {
  try {
    els.input.value = (await navigator.clipboard.readText()).trim();
    updateValidation();
  } catch (e) {
    els.input.focus();
    say("your browser blocked paste, use Ctrl+V gng");
  }
});
// Demo chips under the search bar (hidden once the real API is plugged in)
let demoIndex = 0;
function loadDemo(i) {
  demoIndex = (i + DEMOS.length) % DEMOS.length;
  const addr = DEMOS[demoIndex].data.wallet;
  els.input.value = addr;
  updateValidation();
  runSearch(addr);
}
if (API_BASE) {
  $("demoRow").hidden = true;
} else {
  DEMOS.forEach((d, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = d.label;
    if (i === 0) b.id = "sampleBtn";
    b.addEventListener("click", () => loadDemo(i));
    $("demoChips").appendChild(b);
  });
  $("nextDemoBtn").hidden = false;
  $("nextDemoBtn").addEventListener("click", () => loadDemo(demoIndex + 1));
}

// Keyboard: "/" jumps to search, Escape goes back
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement !== els.input) {
    e.preventDefault();
    showView("search");
    els.input.focus();
  }
  if (e.key === "Escape" && !els.resultsView.hidden) showView("search");
});
$("homeBtn").addEventListener("click", () => showView("search"));
$("newSearchBtn").addEventListener("click", () => { showView("search"); els.input.select(); });

// ================================================================
// Views
// ================================================================
function showView(name) {
  const map = { search: els.searchView, results: els.resultsView, loading: els.loadingView };
  Object.entries(map).forEach(([key, el]) => {
    el.hidden = key !== name;
    if (key === name) {
      el.classList.remove("entering");
      void el.offsetWidth;
      el.classList.add("entering");
    }
  });
  if (name === "search") { setMood(isValidAddress(els.input.value.trim()) ? "happy" : "idle"); }
}

// ================================================================
// Fetching data
// ================================================================
async function fetchWallet(address) {
  if (!API_BASE) {
    await new Promise((r) => setTimeout(r, 1400)); // fake network delay so you can see the loader
    const demo = DEMOS.find((d) => d.data.wallet === address);
    if (demo) demoIndex = DEMOS.indexOf(demo);
    return structuredClone(demo ? demo.data : { ...MOCK_DATA, wallet: address });
  }
  const res = await fetch(`${API_BASE}/wallet/${encodeURIComponent(address)}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || `Request failed (${res.status})`);
  return body;
}

let loadingTimer;
async function runSearch(address) {
  showView("loading");
  els.loadingLine.textContent = pick(LINES.loading);
  loadingTimer = setInterval(() => { els.loadingLine.textContent = pick(LINES.loading); }, 1100);
  try {
    const data = await fetchWallet(address);
    clearInterval(loadingTimer);
    renderResults(data);
    showView("results");
  } catch (err) {
    clearInterval(loadingTimer);
    showView("search");
    setMood("sad");
    showErrorPic(true);
    say(pick(LINES.error));
    els.hint.classList.add("bad");
    els.hint.textContent = `Couldn't load this wallet: ${err.message}. Check the address and try again.`;
  }
}

// ================================================================
// Rendering results
// ================================================================
let currentData = null;
let chart = null;

function renderResults(data) {
  currentData = data;
  const history = data.history || [];
  const holdings = data.holdings || [];
  const pnl = data.totalPnlUsd || 0;

  // Verdict
  const verdict = $("verdict");
  verdict.classList.remove("is-up", "is-down");
  if (pnl > 0) verdict.classList.add("is-up");
  if (pnl < 0) verdict.classList.add("is-down");

  $("walletChip").textContent = shortAddr(data.wallet) + "  copy";
  $("walletChip").onclick = () => copyText(data.wallet);

  const pnlEl = $("pnlValue");
  pnlEl.className = "pnl " + tone(pnl);
  countUp(pnlEl, pnl);
  $("verdictLine").textContent = holdings.length
    ? pick(pnl > 0 ? LINES.up : pnl < 0 ? LINES.down : LINES.flat)
    : pick(["no bags to check, brother", "this wallet is giving air gng", "fresh wallet, who dis"]);
  // Pick the reaction meme for this wallet's rank (random one if the title has several)
  memeSet = memesFor(getRank(data).title, pnl);
  memeTone = pnl > 0 ? "up" : pnl < 0 ? "down" : "flat";
  clapCat.hidden = false;
  miniMascot.hidden = true;
  showMeme(Math.floor(Math.random() * memeSet.length), false);
  $("asOf").textContent = (data.asOf ? "Updated " + new Date(data.asOf).toLocaleString() : "")
    + (API_BASE ? "" : ". Demo data, not live from the chain.");
  startSlotClock(data.asOf);

  const first = history[0]?.portfolioValueUsd || 0;
  const last = history[history.length - 1]?.portfolioValueUsd || 0;
  $("pfValue").textContent = usd(last);
  const change = first ? ((last - first) / first) * 100 : 0;
  $("pfChange").textContent = pct(change);
  $("pfChange").className = tone(change);
  $("pfDays").textContent = history.length;

  renderRank(data);
  renderSolLab(data);
  renderChart(data);
  renderHoldings();
  renderHistory();

  // no confetti for the calm ones: quiet winners stay quiet, and Andy is napping
  if (pnl > 0 && !["Quiet Winner", "Stablecoin Andy"].includes(getRank(data).title)) burstConfetti();
}

// ---------- Wallet rank ----------
// Gives the wallet a title based on its stats. Checked top to bottom, first match wins.
const STABLES = ["USDC", "USDT", "PYUSD"];

function getRank(data) {
  const holdings = (data.holdings || []).map((h) => ({ ...h, value: h.amount * h.currentPriceUsd }));
  const pnl = data.totalPnlUsd || 0;
  if (!holdings.length) {
    return { title: "Empty Pockets", why: "No tokens in here at all. <strong>Fresh start gng.</strong>" };
  }
  const total = holdings.reduce((s, h) => s + h.value, 0) || 1;
  const costBasis = holdings.reduce((s, h) => s + h.amount * h.avgCostUsd, 0) || 1;
  const pnlPct = (pnl / costBasis) * 100;
  const stableShare = (holdings.filter((h) => STABLES.includes(h.symbol)).reduce((s, h) => s + h.value, 0) / total) * 100;
  const top = holdings.reduce((a, b) => (b.value > a.value ? b : a));
  const topShare = (top.value / total) * 100;
  const pctTxt = (n) => n.toFixed(1) + "%";

  if (pnlPct >= 20) return { title: "Certified W Collector", why: `Up <strong>${pctTxt(pnlPct)}</strong> on what you paid. The cat stays clapping brother.` };
  if (pnlPct <= -20) return { title: "Professional Bag Holder", why: `Down <strong>${pctTxt(Math.abs(pnlPct))}</strong> and still holding. Respect the grip gng.` };
  if (stableShare >= 60) return { title: "Stablecoin Andy", why: `<strong>${pctTxt(stableShare)}</strong> of this wallet is stablecoins. Playing it safe brother.` };
  if (topShare >= 70) return { title: `${top.symbol} Maxi`, why: `<strong>${pctTxt(topShare)}</strong> of the bag is ${top.symbol}. One coin, no fear gng.` };
  if (pnl > 0) return { title: "Quiet Winner", why: `Up <strong>${pctTxt(pnlPct)}</strong>. Not loud about it, just winning.` };
  if (pnl < 0) return { title: "Down Bad", why: `Down <strong>${pctTxt(Math.abs(pnlPct))}</strong>. It's only a loss if you sell brother.` };
  return { title: "Perfectly Balanced", why: "Not up, not down. <strong>Zen mode gng.</strong>" };
}

const rankBtn = $("rankBtn");
const rankWhy = $("rankWhy");
rankBtn.addEventListener("click", () => {
  const open = rankWhy.hidden;
  rankWhy.hidden = !open;
  rankBtn.setAttribute("aria-expanded", String(open));
});

function renderRank(data) {
  const rank = getRank(data);
  $("rankTitle").textContent = rank.title;
  rankWhy.innerHTML = rank.why;
  rankWhy.hidden = true;
  rankBtn.setAttribute("aria-expanded", "false");
  rankBtn.title = "Click to see why";
  // replay the stamp animation each time
  rankBtn.style.animation = "none";
  void rankBtn.offsetWidth;
  rankBtn.style.animation = "";
}

// ---------- Slot clock: how many ~0.4s blocks since this data was taken ----------
let slotClockTimer;
function startSlotClock(asOf) {
  clearInterval(slotClockTimer);
  const el = $("slotClock");
  const t = asOf ? new Date(asOf).getTime() : NaN;
  if (isNaN(t) || t > Date.now()) { el.textContent = ""; return; }
  const tick = () => {
    const blocks = Math.floor((Date.now() - t) / 400);
    el.innerHTML = `About <strong>${blocks.toLocaleString()}</strong> Solana blocks ago`;
  };
  tick();
  slotClockTimer = setInterval(tick, 400);
}

// ---------- What your SOL can do ----------
const LAMPORTS_PER_SOL = 1_000_000_000;
const FEE_LAMPORTS = 5_000;
const solSlider = $("solSlider");
let labPrice = 0;

function renderSolLab(data) {
  const sol = (data.holdings || []).find((h) => h.symbol === "SOL");
  $("solLab").hidden = !sol || !sol.amount;
  if (!sol || !sol.amount) return;
  labPrice = sol.currentPriceUsd;
  solSlider.max = sol.amount;
  solSlider.step = sol.amount / 200;
  solSlider.value = sol.amount;
  updateSolLab();
}

function updateSolLab() {
  const sol = Number(solSlider.value);
  const lamports = Math.round(sol * LAMPORTS_PER_SOL);
  const txs = Math.floor(lamports / FEE_LAMPORTS);
  $("labSol").textContent = sol.toLocaleString(undefined, { maximumFractionDigits: 3 });
  $("labLamports").textContent = lamports.toLocaleString();
  $("labUsd").textContent = usd(sol * labPrice);
  $("labTx").textContent = txs.toLocaleString();

  // turn the tx count into "one tx every second for how long"
  let quip;
  if (txs === 0) quip = "zero SOL, zero txs. drag it up brother";
  else if (txs < 60) quip = `that's ${txs} seconds of sending one tx per second gng`;
  else if (txs < 3600) quip = `one tx every second for ${Math.round(txs / 60)} minutes straight`;
  else if (txs < 86400) quip = `one tx every second for ${(txs / 3600).toFixed(1)} hours straight`;
  else quip = `one tx every second for ${(txs / 86400).toFixed(1)} days straight. no sleep brother`;
  $("labQuip").textContent = quip;
}
solSlider.addEventListener("input", updateSolLab);

// Number counts up from 0 once, when results appear
function countUp(el, target) {
  if (reduceMotion) { el.textContent = signedUsd(target); return; }
  const start = performance.now();
  const dur = 900;
  function frame(now) {
    const t = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = signedUsd(target * eased);
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ---------- Chart ----------
function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

function renderChart(data) {
  if (!data || typeof Chart === "undefined") return;
  const history = data.history || [];
  const ctx = $("pfChart").getContext("2d");
  if (chart) chart.destroy();

  const a1 = cssVar("--a1"), a2 = cssVar("--a2"), muted = cssVar("--muted"), line = cssVar("--line");
  const grad = ctx.createLinearGradient(0, 0, 0, 260);
  grad.addColorStop(0, a1 + "66");
  grad.addColorStop(1, a1 + "00");
  const stroke = ctx.createLinearGradient(0, 0, ctx.canvas.clientWidth || 600, 0);
  stroke.addColorStop(0, a1);
  stroke.addColorStop(1, a2);

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: history.map((h) => prettyDate(h.date).replace(/, \d{4}$/, "")),
      datasets: [{
        data: history.map((h) => h.portfolioValueUsd),
        borderColor: stroke, backgroundColor: grad, fill: true, tension: 0.35,
        borderWidth: 3, pointRadius: 0, pointHoverRadius: 7,
        pointHoverBackgroundColor: a2, pointHoverBorderColor: cssVar("--bg"), pointHoverBorderWidth: 3,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: reduceMotion ? false : { duration: 900 },
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: cssVar("--text"), titleColor: cssVar("--bg"), bodyColor: cssVar("--bg"),
          padding: 10, displayColors: false, cornerRadius: 10,
          callbacks: { label: (c) => usd(c.parsed.y) },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: muted }, border: { color: line } },
        y: { grid: { color: line }, ticks: { color: muted, callback: (v) => "$" + v.toLocaleString() }, border: { display: false } },
      },
    },
  });
}

// ---------- Holdings ----------
els.holdSort.addEventListener("change", renderHoldings);
// copy buttons inside the expanded holdings
els.holdings.addEventListener("click", (e) => {
  const btn = e.target.closest(".copy-mini");
  if (btn) copyText(btn.dataset.copy);
});

function renderHoldings() {
  if (!currentData) return;
  const list = (currentData.holdings || []).map((h) => ({ ...h, value: h.amount * h.currentPriceUsd }));
  const total = list.reduce((s, h) => s + h.value, 0) || 1;

  const by = els.holdSort.value;
  list.sort((a, b) =>
    by === "symbol" ? a.symbol.localeCompare(b.symbol)
    : by === "pnl" ? b.unrealizedPnlUsd - a.unrealizedPnlUsd
    : b.value - a.value
  );

  els.holdings.innerHTML = "";
  if (!list.length) {
    els.holdings.innerHTML = `<li class="empty">No tokens in this wallet yet.</li>`;
    return;
  }

  list.forEach((h) => {
    const share = (h.value / total) * 100;
    const pnlPct = h.avgCostUsd ? ((h.currentPriceUsd - h.avgCostUsd) / h.avgCostUsd) * 100 : 0;
    const quip = pick(h.unrealizedPnlUsd > 0 ? LINES.holdingUp : h.unrealizedPnlUsd < 0 ? LINES.holdingDown : LINES.holdingFlat);
    const li = document.createElement("li");
    li.className = "holding";
    li.innerHTML = `
      <button type="button" class="holding-row" aria-expanded="false">
        <span class="token-dot" aria-hidden="true">${h.symbol.slice(0, 3)}</span>
        <span>
          <span class="holding-name">${h.symbol}</span>
          <span class="alloc" title="${share.toFixed(1)}% of wallet"><span data-w="${share}"></span></span>
        </span>
        <span class="holding-val">${usd(h.value)}<small class="${tone(h.unrealizedPnlUsd)}">${signedUsd(h.unrealizedPnlUsd)}</small></span>
      </button>
      <div class="holding-detail"><div><dl>
        <dt>Amount</dt><dd>${h.amount.toLocaleString()} ${h.symbol}</dd>
        <dt>Avg cost</dt><dd>${usd(h.avgCostUsd)}</dd>
        <dt>Price now</dt><dd>${usd(h.currentPriceUsd)}</dd>
        <dt>Change</dt><dd class="${tone(pnlPct)}">${pct(pnlPct)}</dd>
        <dt>Share of wallet</dt><dd>${share.toFixed(1)}%</dd>
        <dt>Mint address</dt><dd class="mint-row"><span title="${h.mint}">${shortAddr(h.mint)}</span><button type="button" class="copy-mini" data-copy="${h.mint}">Copy</button></dd>
        <p class="quip">${quip}</p>
      </dl></div></div>`;
    const row = li.querySelector(".holding-row");
    row.addEventListener("click", () => {
      const open = li.classList.toggle("open");
      row.setAttribute("aria-expanded", String(open));
    });
    els.holdings.appendChild(li);
  });

  // animate allocation bars after they're on the page
  requestAnimationFrame(() => {
    els.holdings.querySelectorAll(".alloc span").forEach((s) => { s.style.width = s.dataset.w + "%"; });
  });
}

// ---------- History table ----------
const historyState = { filter: "all", sort: "date", dir: "desc" };

document.querySelectorAll("[data-filter]").forEach((b) => {
  b.addEventListener("click", () => {
    historyState.filter = b.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    renderHistory();
  });
});
document.querySelectorAll("[data-sort]").forEach((b) => {
  b.addEventListener("click", () => {
    if (historyState.sort === b.dataset.sort) {
      historyState.dir = historyState.dir === "asc" ? "desc" : "asc";
    } else {
      historyState.sort = b.dataset.sort;
      historyState.dir = "desc";
    }
    renderHistory();
  });
});

function renderHistory() {
  if (!currentData) return;
  // work out each day's change vs the day before
  let rows = (currentData.history || []).map((h, i, arr) => {
    const prev = i > 0 ? arr[i - 1].portfolioValueUsd : null;
    return { date: h.date, value: h.portfolioValueUsd, change: prev === null ? 0 : h.portfolioValueUsd - prev, first: prev === null };
  });

  if (historyState.filter === "up") rows = rows.filter((r) => r.change > 0);
  if (historyState.filter === "down") rows = rows.filter((r) => r.change < 0);

  const k = historyState.sort;
  const dir = historyState.dir === "asc" ? 1 : -1;
  rows.sort((a, b) => (k === "date" ? a.date.localeCompare(b.date) : a[k] - b[k]) * dir);

  document.querySelectorAll("[data-sort]").forEach((b) => {
    if (b.dataset.sort === k) b.dataset.dir = historyState.dir;
    else delete b.dataset.dir;
  });

  els.historyBody.innerHTML = rows.map((r) => `
    <tr>
      <td>${prettyDate(r.date)}</td>
      <td class="num">${usd(r.value)}</td>
      <td class="num ${r.first ? "" : tone(r.change)}">${r.first ? "first day" : signedUsd(r.change)}</td>
    </tr>`).join("");
  els.historyEmpty.textContent = (currentData.history || []).length
    ? "No days match this filter. Try All days."
    : "No history yet for this wallet.";
  els.historyEmpty.hidden = rows.length > 0;
}

// ================================================================
// Little extras: copy toast, confetti
// ================================================================
let toastTimer;
function toast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), 1800);
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast(pick(LINES.copied)); }
  catch (e) { toast("Couldn't copy, select it manually"); }
}

function burstConfetti() {
  if (reduceMotion) return;
  const canvas = $("confetti");
  const ctx = canvas.getContext("2d");
  canvas.width = innerWidth; canvas.height = innerHeight;
  const colors = [cssVar("--a1"), cssVar("--a2"), cssVar("--text")];
  const bits = Array.from({ length: 90 }, () => ({
    x: innerWidth / 2, y: innerHeight / 3,
    vx: (Math.random() - 0.5) * 16, vy: Math.random() * -14 - 4,
    size: 6 + Math.random() * 6, rot: Math.random() * 6, color: pick(colors),
  }));
  let frames = 0;
  (function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    bits.forEach((b) => {
      b.vy += 0.45; b.x += b.vx; b.y += b.vy; b.rot += 0.2;
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot);
      ctx.fillStyle = b.color; ctx.fillRect(-b.size / 2, -b.size / 4, b.size, b.size / 2);
      ctx.restore();
    });
    if (++frames < 110) requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  })();
}

// ================================================================
// Solana speed run: a fake block every ~400ms, send a pretend tx
// ================================================================
const SLOT_MS = 400;                 // Solana's target time per block
const BASE_FEE_SOL = 0.000005;       // 5,000 lamports, the base fee per signature
const SOL_PRICE = MOCK_DATA.holdings.find((h) => h.symbol === "SOL").currentPriceUsd;
const TX_LINES = ["faster than your crush replying gng", "blink and you missed it brother", "the bank is still loading lol", "confirmed before you finished clicking"];

const belt = $("belt");
let blockCount = 0;
let pendingTx = null; // time the button was clicked, waiting for the next block

function addBlock() {
  // only run while the search screen is visible
  if (els.searchView.hidden) return;
  blockCount++;
  $("blockCount").textContent = blockCount.toLocaleString();

  const block = document.createElement("div");
  block.className = "block";
  belt.appendChild(block);
  while (belt.children.length > 14) belt.firstElementChild.remove(); // keep it light

  if (pendingTx !== null) {
    const secs = (performance.now() - pendingTx) / 1000;
    pendingTx = null;
    block.classList.add("has-tx", "just-landed");
    const feeUsd = BASE_FEE_SOL * SOL_PRICE;
    const result = $("txResult");
    result.className = "ok";
    result.textContent = `Landed in ${secs.toFixed(2)}s for about $${feeUsd.toFixed(4)} in fees. ${pick(TX_LINES)}`;
    $("sendTx").disabled = false;
    say(pick(TX_LINES));
  }
}
setInterval(addBlock, SLOT_MS);

$("sendTx").addEventListener("click", () => {
  if (pendingTx !== null) return;
  pendingTx = performance.now();
  $("sendTx").disabled = true;
  $("txResult").className = "";
  $("txResult").textContent = "Sending...";
  const dot = document.createElement("span");
  dot.className = "tx-pending";
  $("conveyor").appendChild(dot);
  setTimeout(() => dot.remove(), 500);
});

// ================================================================
// Start up
// ================================================================
(function init() {
  let saved = null;
  try { saved = localStorage.getItem("swt-theme"); } catch (e) { /* ignore */ }
  setTheme(saved || "classic-dark");
  setMood("idle");
  // blob says something random every so often while you're on the search screen
  setInterval(() => {
    if (!els.searchView.hidden && !els.input.value && document.activeElement !== els.input) say(pick(LINES.idle));
  }, 9000);
})();

// people who turned on "reduce motion" get a still dog instead of a dancing one
// (the hero dog is an animated image now, the reduce-motion CSS rule already stops its bounce)
