/* ============================================================
   VERITAS dApp - genlayer-js integration (studionet)
   Forensic light-table UI: docket -> select -> evidence + verdict bench
   ============================================================ */
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const CONFIG = {
  address: "0x6894EA0d3e554dD5EE87Be079386F99B2CD02c80",
  explorer: "https://studio.genlayer.com",
};

const STATUS = { OPEN: 0, JUDGED: 1, SETTLED: 2 };
const SIDE = { NONE: 0, REAL: 1, FAKE: 2 };
const ONE_GEN = 10n ** 18n;

const state = {
  readClient: null,
  writeClient: null,
  account: null,
  cases: [],
  filter: "all",
  owner: null,
  selectedId: null,
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const short = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "-");

function genToWei(v) {
  const s = String(v ?? "0").trim();
  if (!s || isNaN(Number(s))) return 0n;
  const [whole, frac = ""] = s.split(".");
  const fracPad = (frac + "0".repeat(18)).slice(0, 18);
  return BigInt(whole || "0") * ONE_GEN + BigInt(fracPad || "0");
}
function weiToGen(wei, dp = 2) {
  const w = BigInt(wei ?? 0);
  const whole = w / ONE_GEN;
  const frac = (w % ONE_GEN).toString().padStart(18, "0").slice(0, dp).replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : `${whole}`;
}
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}
function sideName(s) { return s === SIDE.REAL ? "REAL" : s === SIDE.FAKE ? "FAKE" : "-"; }

/* ---- toasts ---- */
let toastId = 0;
function toast(title, msg = "", kind = "info", { sticky = false } = {}) {
  const el = document.createElement("div");
  el.className = `toast ${kind}`;
  el.id = `toast-${++toastId}`;
  el.innerHTML = `
    ${kind === "pending" ? '<div class="spinner"></div>' : ""}
    <div><div class="t-title">${title}</div>${msg ? `<div class="t-msg">${msg}</div>` : ""}</div>`;
  $("#toasts").appendChild(el);
  if (!sticky) setTimeout(() => el.remove(), 5200);
  return {
    update: (t, m, k) => {
      el.className = `toast ${k}`;
      el.innerHTML = `${k === "pending" ? '<div class="spinner"></div>' : ""}<div><div class="t-title">${t}</div>${m ? `<div class="t-msg">${m}</div>` : ""}</div>`;
    },
    close: () => el.remove(),
  };
}

/* ---- clients ---- */
function ensureReadClient() {
  if (!state.readClient) state.readClient = createClient({ chain: studionet });
  return state.readClient;
}
async function read(functionName, args = []) {
  return ensureReadClient().readContract({ address: CONFIG.address, functionName, args, stateStatus: "accepted" });
}

async function connectMetaMask() {
  if (!window.ethereum) { toast("No wallet found", "Install MetaMask, or use a private key.", "error"); return; }
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  const addr = accounts[0];
  state.writeClient = createClient({ chain: studionet, account: addr, provider: window.ethereum });
  try { await state.writeClient.connect("studionet"); } catch (e) { console.warn("connect():", e); }
  state.account = addr;
  onConnected();
}
function connectPrivateKey() { /* removed: a dApp must never ask for a private key. */ }
function onConnected() {
  $("#acct-pill").classList.remove("hidden");
  $("#acct-text").textContent = short(state.account);
  $("#connect-btn").innerHTML = '<i class="ph-bold ph-check-circle"></i> Connected';
  $("#connect-btn").classList.replace("btn-primary", "btn-ghost");
  closeModal("#connect-modal");
  toast("Wallet connected", short(state.account), "success");
  renderBench();
}
function requireWallet() { if (!state.writeClient) { openModal("#connect-modal"); return false; } return true; }

/* ---- write flow ---- */
async function send(label, functionName, args, value = 0n) {
  if (!requireWallet()) return null;
  const t = toast(`${label}…`, "Submitting transaction", "pending", { sticky: true });
  try {
    const hash = await state.writeClient.writeContract({ address: CONFIG.address, functionName, args, value });
    t.update(`${label}…`, "Waiting for consensus", "pending");
    await state.readClient.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED });
    t.close();
    toast(`${label} confirmed`, `tx ${short(hash)}`, "success");
    await refresh();
    return true;
  } catch (err) {
    t.close();
    const msg = (err?.message || String(err)).replace(/^Error:\s*/, "");
    toast(`${label} failed`, msg.slice(0, 180), "error");
    console.error(err);
    return null;
  }
}

/* ---- data load ---- */
async function refresh() {
  try {
    const [stats, cases, owner] = await Promise.all([
      read("get_stats"),
      read("list_cases"),
      read("get_owner").catch(() => null),
    ]);
    state.owner = owner ? String(owner).toLowerCase() : null;
    renderStats(stats);
    state.cases = Array.isArray(cases) ? cases : [];
    if (state.selectedId == null && state.cases.length) state.selectedId = Math.max(...state.cases.map((c) => Number(c.id)));
    renderDocket();
    renderBench();
  } catch (e) {
    console.error(e);
    $("#cases-loading").textContent = "Could not reach studionet. Is the contract deployed?";
    toast("Load failed", (e?.message || String(e)).slice(0, 160), "error");
  }
}

function animateNum(el, to) {
  if (!el) return;
  const target = Number(to) || 0;
  if (!window.gsap) { el.textContent = target; return; }
  const o = { v: Number(el.textContent) || 0 };
  gsap.to(o, { v: target, duration: .8, ease: "power2.out", onUpdate: () => { el.textContent = Math.round(o.v); } });
}
function renderStats(s) {
  if (!s) return;
  animateNum($("#st-cases"), s.total_cases ?? 0);
  $("#st-pot").textContent = weiToGen(s.total_pot ?? 0, 2);
  animateNum($("#st-open"), s.open ?? 0);
  animateNum($("#st-judged"), s.judged ?? 0);
  animateNum($("#st-real"), s.real ?? 0);
  animateNum($("#st-fake"), s.fake ?? 0);
}

/* ---- docket (left list of cards) ---- */
function statusBadge(c) {
  if (c.voided) return `<span class="status-badge s-voided">voided</span>`;
  const map = { [STATUS.OPEN]: ["s-open", "open"], [STATUS.JUDGED]: ["s-judged", "judged"], [STATUS.SETTLED]: ["s-settled", "settled"] };
  const [cls, label] = map[c.status] || ["s-settled", "?"];
  return `<span class="status-badge ${cls}">${label}</span>`;
}
function thumb(c) {
  if (c.image_url) {
    return `<img src="${escapeHtml(c.image_url)}" alt="" loading="lazy"
      onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'noimg',textContent:'no preview'}))"/>`;
  }
  return `<div class="noimg">no resource</div>`;
}
function caseCard(c) {
  const active = Number(c.id) === Number(state.selectedId) ? " active" : "";
  return `
    <article class="card${active}" data-select="${c.id}">
      <div class="card-thumb">
        ${thumb(c)}
        <span class="card-id mono">CASE #${c.id}</span>
        ${statusBadge(c)}
      </div>
      <div class="card-body">
        <p class="caption">"${escapeHtml(c.caption)}"</p>
        <div class="claimant">claimant <b>${short(c.claimant)}</b> · ${c.stake_count ?? 0} backer(s)</div>
      </div>
    </article>`;
}
function renderDocket() {
  const wrap = $("#cases");
  $("#cases-loading").classList.add("hidden");
  let list = state.cases.slice().sort((a, b) => b.id - a.id);
  if (state.filter !== "all") list = list.filter((c) => String(c.status) === state.filter);
  if (!list.length) { wrap.innerHTML = ""; $("#cases-empty").classList.remove("hidden"); return; }
  $("#cases-empty").classList.add("hidden");
  wrap.innerHTML = list.map(caseCard).join("");
}

/* ---- bench (evidence viewer + verdict) ---- */
function selectedCase() { return state.cases.find((c) => Number(c.id) === Number(state.selectedId)) || null; }

function looksLikeImage(url) {
  return /\.(png|jpe?g|gif|webp|avif|bmp|svg)(\?|#|$)/i.test(url || "");
}
function domainOf(url) { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url || ""; } }

function showViewerImage(url) {
  const img = $("#viewer-img"), empty = $("#viewer-empty"), page = $("#viewer-page");
  empty.classList.add("hidden"); page.classList.add("hidden");
  img.classList.remove("hidden");
  img.src = url;
  img.onerror = () => { img.classList.add("hidden"); showViewerPage(url); };
}
function showViewerPage(url) {
  const img = $("#viewer-img"), empty = $("#viewer-empty"), page = $("#viewer-page");
  img.classList.add("hidden"); empty.classList.add("hidden");
  page.classList.remove("hidden");
  const dom = domainOf(url);
  $("#vp-domain").textContent = dom;
  // favicon via google's service (no key, reliable)
  const fav = $("#vp-favicon");
  fav.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(dom)}&sz=64`;
  fav.onerror = () => { fav.style.display = "none"; };
  fav.style.display = "";
  // No third-party screenshot dependency (those rate-limit/403). Show a clean
  // archival "web exhibit" plate: large globe glyph over a grid.
  $("#vp-shot-img").style.display = "none";
  $("#vp-fallback").classList.remove("hidden");
}
function showViewerEmpty(msg) {
  const img = $("#viewer-img"), empty = $("#viewer-empty"), page = $("#viewer-page");
  img.classList.add("hidden"); page.classList.add("hidden");
  empty.classList.remove("hidden");
  empty.querySelector("span").textContent = msg;
}

function renderBench() {
  const c = selectedCase();
  // evidence viewer
  if (c && c.image_url) {
    if (looksLikeImage(c.image_url)) showViewerImage(c.image_url);
    else showViewerPage(c.image_url);
  } else {
    showViewerEmpty(c ? "This case has no resource attached." : "Select a case from the docket to inspect its exhibit, or open a new one.");
  }
  // exhibit meta
  $("#em-id").textContent = c ? `CASE #${c.id} · ${sideName(c.claimed_side)} claim` : "·";
  $("#em-caption").textContent = c ? `"${c.caption}"` : "·";
  $("#em-claimant").textContent = c ? short(c.claimant) : "·";
  $("#em-src").innerHTML = c && c.image_url ? `<a href="${escapeHtml(c.image_url)}" target="_blank" rel="noreferrer" style="color:var(--accent);text-decoration:none">${escapeHtml(c.image_url.slice(0, 48))}${c.image_url.length > 48 ? "…" : ""}</a>` : "·";

  // verdict card
  const body = $("#vc-body"), vcEmpty = $("#vc-empty");
  if (!c) { body.classList.add("hidden"); vcEmpty.classList.remove("hidden"); return; }
  vcEmpty.classList.add("hidden"); body.classList.remove("hidden");

  if (c.status === STATUS.OPEN) {
    // not judged yet - show gauge dormant + pool + actions
    setGauge(0, "var(--ink-faint)");
    $("#gauge-num").textContent = "-";
    $("#vc-side").innerHTML = `<i class="ph-bold ph-hourglass-medium" style="color:var(--amber)"></i> AWAITING JURY`;
    $("#vc-side").style.color = "var(--amber)";
    $("#vc-conf").textContent = "not yet judged";
    $("#vc-rationale").textContent = "Stake on a side, then convene the jury. The contract will fetch the resource and the validator set will rule under the Equivalence Principle.";
  } else {
    const isReal = c.verdict_side === SIDE.REAL;
    const color = isReal ? "var(--real)" : "var(--fake)";
    const score = Number(c.authenticity_score ?? 0);
    setGauge(score, color);
    $("#gauge-num").textContent = score;
    $("#gauge-num").style.color = color;
    $("#vc-side").innerHTML = `<i class="ph-fill ${isReal ? "ph-seal-check" : "ph-seal-warning"}"></i> RULED ${sideName(c.verdict_side)}`;
    $("#vc-side").style.color = color;
    $("#vc-conf").textContent = `confidence ${c.confidence ?? 0}/1000`;
    $("#vc-rationale").textContent = c.rationale || "The jury returned a verdict without a written rationale.";
  }
  $("#vc-pool").innerHTML = poolBar(c);
  $("#vc-actions").innerHTML = actionsFor(c);
}

function setGauge(score, color) {
  const fill = $("#gauge-fill");
  if (!fill) return;
  const len = 251.3; // arc length of the semicircle path
  const pct = Math.max(0, Math.min(1000, Number(score) || 0)) / 1000;
  fill.style.stroke = color;
  // animate via dashoffset
  requestAnimationFrame(() => { fill.style.strokeDashoffset = String(len * (1 - pct)); });
}

function poolBar(c) {
  const real = Number(BigInt(c.real_pool || 0) / 10n ** 15n);
  const fake = Number(BigInt(c.fake_pool || 0) / 10n ** 15n);
  const total = real + fake;
  const realPct = total ? (real / total) * 100 : 50;
  return `
    <div class="pool-bar">
      <div class="real-fill" style="width:${realPct}%"></div>
      <div class="fake-fill" style="width:${100 - realPct}%"></div>
    </div>
    <div class="pool-legend">
      <span class="real">REAL ${weiToGen(c.real_pool, 2)}</span>
      <span class="fake">${weiToGen(c.fake_pool, 2)} FAKE</span>
    </div>`;
}

function actionsFor(c) {
  const owner = state.account && state.owner && state.account.toLowerCase() === state.owner;
  const btns = [];
  if (c.status === STATUS.OPEN) {
    btns.push(`<button class="btn btn-real sm" data-act="back" data-id="${c.id}"><i class="ph-bold ph-hand-coins"></i> Back a side</button>`);
    btns.push(`<button class="btn btn-amber sm" data-act="judge" data-id="${c.id}"><i class="ph-bold ph-gavel"></i> Convene jury</button>`);
  } else if (c.status === STATUS.JUDGED) {
    btns.push(`<button class="btn btn-primary sm" data-act="settle" data-id="${c.id}"><i class="ph-bold ph-scales"></i> Settle pot</button>`);
  } else if (c.status === STATUS.SETTLED) {
    btns.push(`<button class="btn btn-primary sm" data-act="claim" data-id="${c.id}"><i class="ph-bold ph-coin-vertical"></i> Claim winnings</button>`);
  }
  if (owner && !c.voided) btns.push(`<button class="btn btn-fake sm" data-act="archive" data-id="${c.id}"><i class="ph-bold ph-archive"></i></button>`);
  return btns.join("");
}

/* ---- loupe magnifier on the viewer ---- */
function wireLoupe() {
  const viewer = $("#viewer"), img = $("#viewer-img"), loupe = $("#loupe");
  viewer.addEventListener("mousemove", (e) => {
    if (img.classList.contains("hidden") || !img.src) { loupe.style.display = "none"; return; }
    const r = viewer.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    loupe.style.display = "block";
    loupe.style.left = `${x - 75}px`;
    loupe.style.top = `${y - 75}px`;
    loupe.style.backgroundImage = `url("${img.src}")`;
    loupe.style.backgroundSize = `${r.width * 2.2}px ${r.height * 2.2}px`;
    loupe.style.backgroundPosition = `-${x * 2.2 - 75}px -${y * 2.2 - 75}px`;
  });
  viewer.addEventListener("mouseleave", () => { loupe.style.display = "none"; });
}

/* ---- modal helpers ---- */
function openModal(sel) { $(sel).classList.add("open"); }
function closeModal(sel) { $(sel).classList.remove("open"); }
function selectedSide(toggleSel) { const a = $(`${toggleSel} .side-opt.active`); return a ? Number(a.dataset.side) : SIDE.REAL; }
function wireSideToggle(sel) {
  $$(`${sel} .side-opt`).forEach((b) => b.addEventListener("click", () => {
    $$(`${sel} .side-opt`).forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
  }));
}

/* ---- wiring ---- */
function wire() {
  $("#connect-btn").addEventListener("click", () => openModal("#connect-modal"));
  $("#connect-mm").addEventListener("click", connectMetaMask);

  $("#new-case-btn").addEventListener("click", () => openModal("#case-modal"));
  $("#f-caption").addEventListener("input", (e) => { $("#cap-count").textContent = `${e.target.value.length}/240`; });
  $("#submit-case").addEventListener("click", submitNewCase);
  $("#submit-back").addEventListener("click", submitBack);

  $$("[data-close]").forEach((b) => b.addEventListener("click", (e) => e.target.closest(".modal-backdrop").classList.remove("open")));
  $$(".modal-backdrop").forEach((bd) => bd.addEventListener("click", (e) => { if (e.target === bd) bd.classList.remove("open"); }));

  wireSideToggle("#f-side");
  wireSideToggle("#b-side");
  wireLoupe();

  $$("#filters .chip").forEach((c) => c.addEventListener("click", () => {
    $$("#filters .chip").forEach((x) => x.classList.remove("active"));
    c.classList.add("active"); state.filter = c.dataset.filter; renderDocket();
  }));
  $("#refresh-btn").addEventListener("click", refresh);

  // docket: click selects -> bench
  $("#cases").addEventListener("click", (e) => {
    const card = e.target.closest("[data-select]");
    if (!card) return;
    state.selectedId = Number(card.dataset.select);
    renderDocket(); renderBench();
    document.querySelector(".lighttable").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // bench actions
  $("#vc-actions").addEventListener("click", onBenchAction);

  $("#foot-addr").textContent = CONFIG.address;
  $("#foot-addr").href = CONFIG.explorer;
}

async function submitNewCase() {
  const url = $("#f-url").value.trim();
  const caption = $("#f-caption").value.trim();
  const side = selectedSide("#f-side");
  const stake = genToWei($("#f-stake").value);
  if (!url || !caption) return toast("Missing fields", "URL and caption are required.", "error");
  if (stake <= 0n) return toast("Stake required", "You must stake GEN to open a case.", "error");
  closeModal("#case-modal");
  const ok = await send("Open case", "open_case", [url, caption, side], stake);
  if (ok) { $("#f-url").value = ""; $("#f-caption").value = ""; $("#cap-count").textContent = "0/240"; }
}

let backTargetId = null;
function openBack(id) { backTargetId = id; $("#back-id").textContent = id; openModal("#back-modal"); }
async function submitBack() {
  const side = selectedSide("#b-side");
  const stake = genToWei($("#b-stake").value);
  if (stake <= 0n) return toast("Stake required", "You must stake GEN to back a case.", "error");
  closeModal("#back-modal");
  await send("Back case", "back_case", [backTargetId, side], stake);
}

async function onBenchAction(e) {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const id = Number(btn.dataset.id), act = btn.dataset.act;
  if (act === "back") return openBack(id);
  if (act === "judge") return void send("Convene jury", "judge", [id]);
  if (act === "settle") return void send("Settle", "settle", [id]);
  if (act === "claim") return void send("Claim", "claim", [id]);
  if (act === "archive") return void send("Archive", "archive", [id]);
}

/* ---- boot ---- */
async function boot() {
  wire();
  ensureReadClient();
  await refresh();
}
boot();
