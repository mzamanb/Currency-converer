// Currency Convertor interactivity + exchange-rate precision.

const figmaVars = {
  "Color/Primary Button": "#3a4526",
  "Color/Secondary Button": "#b2e556",
  "Color/Text Color_Dark BG": "#ffffff",
  "Color/Text Color_LG_BG": "#000000",
  "Color/Disabled_BG": "#c8c8c8",
};

// Currency list + bottom-sheet display metadata.
// (Content is illustrative; styling/token values come from your Figma variables.)
const currencyMeta = {
  AED: { name: "United Arab Emirates", symbol: "د.إ." },
  USD: { name: "United States", symbol: "$" },
  EUR: { name: "European Union", symbol: "€" },
  GBP: { name: "United Kingdom", symbol: "£" },
  JPY: { name: "Japan", symbol: "¥" },
  INR: { name: "India", symbol: "₹" },
  CAD: { name: "Canada", symbol: "$" },
  AUD: { name: "Australia", symbol: "$" },
  CHF: { name: "Switzerland", symbol: "Fr" },
  CNY: { name: "China", symbol: "¥" },
  ILS: { name: "Israel", symbol: "₪" },
  SGD: { name: "Singapore", symbol: "$" },
  KRW: { name: "South Korea", symbol: "₩" },
  MXN: { name: "Mexico", symbol: "$" },
  RUB: { name: "Russia", symbol: "₽" },
  TRY: { name: "Turkey", symbol: "₺" },
  NZD: { name: "New Zealand", symbol: "$" },
  BRL: { name: "Brazil", symbol: "R$" },
  ZAR: { name: "South Africa", symbol: "R" },
  PLN: { name: "Poland", symbol: "zł" },
  SEK: { name: "Sweden", symbol: "kr" },
  NOK: { name: "Norway", symbol: "kr" },
  DKK: { name: "Denmark", symbol: "kr" },
  THB: { name: "Thailand", symbol: "฿" },
  IDR: { name: "Indonesia", symbol: "Rp" },
  PHP: { name: "Philippines", symbol: "₱" },
  MYR: { name: "Malaysia", symbol: "RM" },
  EGP: { name: "Egypt", symbol: "ج.م." },
};

const currencies = Object.keys(currencyMeta);

const els = {
  fromCurrency: document.getElementById("fromCurrency"),
  toCurrency: document.getElementById("toCurrency"),
  fromAmount: document.getElementById("fromAmount"),
  toAmount: document.getElementById("toAmount"),
  fromDropdownBtn: document.getElementById("fromDropdownBtn"),
  toDropdownBtn: document.getElementById("toDropdownBtn"),
  swapBtn: document.getElementById("swapBtn"),

  sheetOverlay: document.getElementById("currencySheetOverlay"),
  sheetCloseBtn: document.getElementById("currencySheetCloseBtn"),
  sheetList: document.getElementById("currencySheetList"),
};

let from = "AED";
let to = "USD";
let amountInput = "1000";
let sheetTarget = null; // "from" | "to"

// ratesPerUSD: currency -> how many units of that currency equals 1 USD.
// Example: if ratesPerUSD.EUR = 0.92, then 1 USD = 0.92 EUR.
let ratesPerUSD = null;

const fallbackRatesPerUSD = {
  USD: 1,
  AED: 10, // from Figma: 1000 AED -> 100 USD => 1 USD = 10 AED
};

function clampAmountString(str) {
  const s = String(str ?? "").trim();
  if (!s) return "0";
  const sign = s.startsWith("-") ? "-" : "";
  const body = sign ? s.slice(1) : s;
  const [intPartRaw, fracRaw] = body.split(".");
  const intPart = (intPartRaw || "").replace(/[^\d]/g, "");
  const fracPart = (fracRaw ?? "").replace(/[^\d]/g, "").slice(0, 10);

  const intDigits = intPart.slice(Math.max(0, intPart.length - 12));
  if (!intDigits && fracPart === "") return "0";
  return sign + (intDigits || "0") + (fracPart ? "." + fracPart : "");
}

function parseAmount(str) {
  const s = String(str ?? "").trim();
  if (s === "" || s === "-" || s === "." || s === "-.") return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function formatAmount(n) {
  if (!Number.isFinite(n)) return "0";
  const abs = Math.abs(n);

  // Keep more decimals for small values to feel "precise".
  const decimals = abs >= 1000 ? 0 : abs >= 100 ? 2 : abs >= 1 ? 4 : 8;
  const fixed = n.toFixed(decimals);
  return fixed
    .replace(/(\.\d*?[1-9])0+$/g, "$1") // trim trailing zeros
    .replace(/\.0+$/g, ""); // trim ".000..."
}

function convert(amount, fromCurrency, toCurrency) {
  const f = ratesPerUSD?.[fromCurrency];
  const t = ratesPerUSD?.[toCurrency];
  if (typeof f === "number" && typeof t === "number") {
    // amount(from) -> USD -> amount(to)
    // amountUSD = amount / ratesPerUSD[from]
    // amountTo = amountUSD * ratesPerUSD[to]
    return (amount * t) / f;
  }

  // Fallback only guarantees AED <-> USD.
  const fb = fallbackRatesPerUSD;
  const f2 = fb[fromCurrency];
  const t2 = fb[toCurrency];
  if (typeof f2 === "number" && typeof t2 === "number") return (amount * t2) / f2;
  return 0;
}

function updateUI() {
  const amount = parseAmount(amountInput);
  els.fromCurrency.textContent = from;
  els.toCurrency.textContent = to;
  els.fromAmount.textContent = formatAmount(amount);
  els.toAmount.textContent = formatAmount(convert(amount, from, to));
}

function applyFigmaTokenColors() {
  const primaryBg = figmaVars["Color/Primary Button"];
  const secondaryBg = figmaVars["Color/Secondary Button"];
  const darkText = figmaVars["Color/Text Color_Dark BG"];
  const lightText = figmaVars["Color/Text Color_LG_BG"];

  document.querySelectorAll(".key.dark").forEach((btn) => {
    btn.style.backgroundColor = primaryBg;
    btn.style.color = darkText;
  });

  document.querySelectorAll(".key.bright").forEach((btn) => {
    btn.style.backgroundColor = secondaryBg;
    btn.style.color = lightText;
  });
}

function setAmountString(next) {
  amountInput = clampAmountString(next);
  updateUI();
}

function appendDigit(d) {
  const s = amountInput;
  if (s === "0") setAmountString(d);
  else if (s === "-0") setAmountString("-" + d);
  else setAmountString(s + d);
}

function backspace() {
  const s = amountInput;
  if (s.length <= 1) return setAmountString("0");
  const next = s.slice(0, -1);
  if (next === "-" || next === "" || next === "-.") return setAmountString("0");
  setAmountString(next);
}

function toggleSign() {
  if (!amountInput || amountInput === "0") return setAmountString("-0");
  if (amountInput.startsWith("-")) setAmountString(amountInput.slice(1));
  else setAmountString("-" + amountInput);
}

function applyPercent() {
  const n = parseAmount(amountInput);
  setAmountString(String(n / 100));
}

function applyPlusMinusStep(sign) {
  const n = parseAmount(amountInput);
  const step = 1;
  setAmountString(String(n + sign * step));
}

function applyDot() {
  if (amountInput.includes(".")) return;
  if (amountInput === "" || amountInput === "-") return setAmountString(amountInput + "0.");
  setAmountString(amountInput + ".");
}

function swapCurrencies() {
  const currentFrom = parseAmount(amountInput);
  const currentToAmount = convert(currentFrom, from, to);

  const oldFrom = from;
  from = to;
  to = oldFrom;
  amountInput = String(currentToAmount);
  updateUI();
}

function openSheet(target) {
  sheetTarget = target;
  els.sheetOverlay.classList.remove("hidden");
  renderSheet();
}

function closeSheet() {
  sheetTarget = null;
  els.sheetOverlay.classList.add("hidden");
}

function getMeta(code) {
  const meta = currencyMeta[code];
  if (meta) return meta;
  // Fallback: best effort using Intl for symbol.
  try {
    const parts = new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0);
    const currencyPart = parts.find((p) => p.type === "currency");
    return { name: code, symbol: currencyPart?.value ?? code };
  } catch {
    return { name: code, symbol: code };
  }
}

function renderSheet() {
  const selectedColor = figmaVars["Color/Secondary Button"];
  const unselectedColor = figmaVars["Color/Text Color_Dark BG"];
  const disabledBg = figmaVars["Color/Disabled_BG"];

  // Header subtitle is static in HTML; keep here only for consistent colors if needed later.
  void disabledBg;

  els.sheetList.innerHTML = "";

  for (const code of currencies) {
    const meta = getMeta(code);
    const isSelected = sheetTarget === "from" ? code === from : code === to;

    const row = document.createElement("button");
    row.type = "button";
    row.className =
      "border-[#4b4b4b] border-b border-solid w-full flex items-center justify-between pb-[8px] text-left";
    row.setAttribute("data-currency-code", code);

    const left = document.createElement("div");
    left.className = "flex flex-col gap-[4px] items-start justify-center leading-[normal] shrink-0";

    const nameEl = document.createElement("p");
    nameEl.className = "dm-sans font-medium text-[16px] whitespace-nowrap";
    nameEl.style.color = isSelected ? selectedColor : unselectedColor;
    nameEl.textContent = meta.name;

    const codeEl = document.createElement("p");
    codeEl.className = "dm-sans font-medium text-[16px] whitespace-nowrap";
    codeEl.style.color = isSelected ? selectedColor : unselectedColor;
    codeEl.textContent = code;

    left.appendChild(nameEl);
    left.appendChild(codeEl);

    const symbolWrap = document.createElement("div");
    symbolWrap.className = "flex items-center shrink-0";

    const symbolEl = document.createElement("p");
    symbolEl.className = "dm-sans font-normal text-[24px] whitespace-nowrap";
    symbolEl.style.color = isSelected ? selectedColor : unselectedColor;
    symbolEl.textContent = meta.symbol;

    symbolWrap.appendChild(symbolEl);

    row.appendChild(left);
    row.appendChild(symbolWrap);

    row.addEventListener("click", () => {
      if (sheetTarget === "from") from = code;
      else if (sheetTarget === "to") to = code;
      closeSheet();
      updateUI();
    });

    els.sheetList.appendChild(row);
  }
}

function handleKey(key) {
  switch (key) {
    case "ac":
      setAmountString("0");
      return;
    case "sign":
      toggleSign();
      return;
    case "percent":
      applyPercent();
      return;
    case "swap":
      swapCurrencies();
      return;
    case "backspace":
      backspace();
      return;
    case "dot":
      applyDot();
      return;
    case "equals":
      updateUI();
      return;
    case "plus":
      applyPlusMinusStep(1);
      return;
    case "minus":
      applyPlusMinusStep(-1);
      return;
    default:
      if (typeof key === "string" && /^[0-9]$/.test(key)) appendDigit(key);
      return;
  }
}

function wireUpKeypad() {
  document.querySelectorAll("[data-key]").forEach((btn) => {
    btn.addEventListener("click", () => handleKey(btn.getAttribute("data-key")));
  });
}

function wireUpSheet() {
  els.fromDropdownBtn.addEventListener("click", () => {
    const already = !els.sheetOverlay.classList.contains("hidden") && sheetTarget === "from";
    if (already) closeSheet();
    else openSheet("from");
  });
  els.toDropdownBtn.addEventListener("click", () => {
    const already = !els.sheetOverlay.classList.contains("hidden") && sheetTarget === "to";
    if (already) closeSheet();
    else openSheet("to");
  });

  els.sheetCloseBtn.addEventListener("click", closeSheet);

  els.sheetOverlay.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const isBackdrop = t.getAttribute("data-role") === "backdrop";
    if (isBackdrop) closeSheet();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSheet();
  });
}

function wireUpSwap() {
  els.swapBtn.addEventListener("click", () => swapCurrencies());
}

async function loadRates() {
  try {
    // Public API: rates are "how many units per 1 USD"
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" });
    const data = await res.json();
    if (data && data.result === "success" && data.rates) {
      // Clone + ensure USD exists.
      ratesPerUSD = { ...data.rates, USD: 1 };
    }
  } catch {
    // Keep fallback (AED <-> USD) if offline.
  }
}

// Init
applyFigmaTokenColors();
wireUpKeypad();
wireUpSheet();
wireUpSwap();
updateUI();

// Fetch rates then recompute.
loadRates().finally(() => updateUI());

