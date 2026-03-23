const ratesPerUSD = {
  USD: 1,
  EUR: 0.862709,
  GBP: 0.749422,
  JPY: 159.241372,
  CNY: 6.886391,
  AUD: 1.423656,
  CAD: 1.372188,
  CHF: 0.788041,
  INR: 93.699948,
  BRL: 5.312504,
  AED: 3.67298,
};

const currencyMeta = {
  USD: { name: "United States", symbol: "$" },
  EUR: { name: "European Union", symbol: "EUR €" },
  GBP: { name: "United Kingdom", symbol: "GBP £" },
  JPY: { name: "Japan", symbol: "JPY ¥" },
  CNY: { name: "China", symbol: "CNY ¥" },
  AUD: { name: "Australia", symbol: "AUD $" },
  CAD: { name: "Canada", symbol: "CAD $" },
  CHF: { name: "Switzerland", symbol: "CHF Fr" },
  INR: { name: "India", symbol: "INR ₹" },
  BRL: { name: "Brazil", symbol: "BRL" },
  AED: { name: "United Arab Emirates", symbol: "AED د.إ." },
};

const currencies = Object.keys(currencyMeta);

const els = {
  appTitle: document.getElementById("appTitle"),
  fromCurrency: document.getElementById("fromCurrency"),
  toCurrency: document.getElementById("toCurrency"),
  fromAmount: document.getElementById("fromAmount"),
  toAmount: document.getElementById("toAmount"),
  fromCard: document.getElementById("fromCard"),
  toCard: document.getElementById("toCard"),
  fromDropdownBtn: document.getElementById("fromDropdownBtn"),
  toDropdownBtn: document.getElementById("toDropdownBtn"),
  swapBtn: document.getElementById("swapBtn"),
  themeModeIcon: document.getElementById("themeModeIcon"),
  sheetOverlay: document.getElementById("currencySheetOverlay"),
  sheet: document.getElementById("currencySheet"),
  sheetTitle: document.getElementById("sheetTitle"),
  sheetSubtitle: document.getElementById("sheetSubtitle"),
  sheetCloseBtn: document.getElementById("currencySheetCloseBtn"),
  sheetList: document.getElementById("currencySheetList"),
};

let from = "AED";
let to = "USD";
let amountInput = "0";
let currentTheme = "dark-tailwind";
let sheetTarget = "from";

function convert(amount, fromCode, toCode) {
  const f = ratesPerUSD[fromCode];
  const t = ratesPerUSD[toCode];
  if (typeof f !== "number" || typeof t !== "number") return 0;
  return (amount * t) / f;
}

function parseAmount(str) {
  const n = Number(str);
  return Number.isFinite(n) ? n : 0;
}

function formatAmount(n) {
  if (!Number.isFinite(n)) return "0";
  const abs = Math.abs(n);
  const decimals = abs >= 1000 ? 0 : abs >= 100 ? 2 : abs >= 1 ? 4 : 8;
  return n
    .toFixed(decimals)
    .replace(/(\.\d*?[1-9])0+$/g, "$1")
    .replace(/\.0+$/g, "");
}

function clampAmountString(str) {
  const s = String(str ?? "").trim();
  if (!s) return "0";
  const [i, f] = s.split(".");
  const intPart = (i || "").replace(/[^\d-]/g, "").slice(0, 12);
  const fracPart = (f || "").replace(/[^\d]/g, "").slice(0, 10);
  const normalized = intPart === "-" ? "-0" : intPart || "0";
  return fracPart ? `${normalized}.${fracPart}` : normalized;
}

function bump(el) {
  if (!el) return;
  el.classList.add("is-bump");
  setTimeout(() => el.classList.remove("is-bump"), 140);
}

function applyCardStates() {
  els.fromCard.classList.remove("state-active");
  els.toCard.classList.remove("state-active");
  if (!els.sheetOverlay.classList.contains("hidden")) {
    if (sheetTarget === "from") els.fromCard.classList.add("state-active");
    else els.toCard.classList.add("state-active");
  }
}

function applyTheme() {
  const dark = currentTheme === "dark-tailwind";
  document.body.style.backgroundColor = dark ? "#000000" : "#f1f5f9";
  const gradient = document.querySelector("#phone > div[aria-hidden='true']");
  if (gradient) {
    gradient.className = dark
      ? "absolute inset-0 bg-gradient-to-b from-[#3a4526] to-[#060606]"
      : "absolute inset-0 bg-gradient-to-b from-[#ffffff] to-[#f1f5f9]";
  }

  const darkKeyBg = dark ? "#3a4526" : "#e2e8f0";
  const darkKeyText = dark ? "#ffffff" : "#0f172a";
  const brightBg = dark ? "#b2e556" : "#0f172a";
  const brightText = dark ? "#000000" : "#ffffff";
  const textColor = dark ? "#ffffff" : "#0f172a";
  const subtleText = dark ? "#c8c8c8" : "#64748b";
  const sheetBg = dark ? "#3a4526" : "#ffffff";
  const cardBg = dark ? "rgba(255,255,255,0.2)" : "rgba(15,23,42,0.05)";
  const chevron = dark ? "#b2e556" : "#0f172a";

  [els.appTitle, els.fromCurrency, els.toCurrency, els.fromAmount, els.toAmount, els.sheetTitle].forEach((el) => {
    if (el) el.style.color = textColor;
  });
  if (els.sheetSubtitle) els.sheetSubtitle.style.color = subtleText;
  if (els.sheet) els.sheet.style.backgroundColor = sheetBg;
  if (els.fromCard) els.fromCard.style.backgroundColor = cardBg;
  if (els.toCard) els.toCard.style.backgroundColor = cardBg;

  document.querySelectorAll("[data-key]").forEach((btn) => {
    const key = btn.getAttribute("data-key");
    const isBright = key === "swap-theme" || key === "backspace" || key === "ac" || key === "go";
    btn.style.backgroundColor = isBright ? brightBg : darkKeyBg;
    btn.style.color = isBright ? brightText : darkKeyText;
  });

  document.querySelectorAll("#fromDropdownBtn path, #toDropdownBtn path, #swapBtn path").forEach((path) => {
    path.setAttribute("stroke", chevron);
  });

  if (els.themeModeIcon) els.themeModeIcon.textContent = dark ? "☀" : "◐";
  renderSheet();
}

function updateUI() {
  const amount = parseAmount(amountInput);
  const converted = convert(amount, from, to);
  const fromText = formatAmount(amount);
  const toText = formatAmount(converted);
  if (els.fromAmount.textContent !== fromText) bump(els.fromAmount);
  if (els.toAmount.textContent !== toText) bump(els.toAmount);
  els.fromAmount.textContent = fromText;
  els.toAmount.textContent = toText;
  els.fromCurrency.textContent = from;
  els.toCurrency.textContent = to;
  applyCardStates();
}

function setAmount(next) {
  amountInput = clampAmountString(next);
  if (amountInput === "-" || amountInput === "") amountInput = "0";
  updateUI();
}

function handleKey(key) {
  if (/^\d$/.test(key)) {
    setAmount(amountInput === "0" ? key : amountInput + key);
    return;
  }
  if (key === ".") {
    if (!amountInput.includes(".")) setAmount(amountInput + ".");
    return;
  }
  if (key === "backspace") {
    if (amountInput.length <= 1) setAmount("0");
    else setAmount(amountInput.slice(0, -1));
    return;
  }
  if (key === "ac") {
    setAmount("0");
    return;
  }
  if (key === "swap-theme") {
    currentTheme = currentTheme === "dark-tailwind" ? "light-shadcn" : "dark-tailwind";
    applyTheme();
    return;
  }
  if (key === "equals" || key === "go") {
    const next = convert(parseAmount(amountInput), from, to);
    setAmount(String(next));
  }
}

function swapCurrencies() {
  const next = convert(parseAmount(amountInput), from, to);
  const old = from;
  from = to;
  to = old;
  setAmount(String(next));
}

function openSheet(target) {
  sheetTarget = target;
  els.sheetOverlay.classList.remove("hidden");
  renderSheet();
  applyCardStates();
}

function closeSheet() {
  els.sheetOverlay.classList.add("hidden");
  applyCardStates();
}

function renderSheet() {
  const dark = currentTheme === "dark-tailwind";
  const selectedColor = dark ? "#b2e556" : "#0f172a";
  const defaultColor = dark ? "#ffffff" : "#0f172a";
  const borderColor = dark ? "#4b4b4b" : "#cbd5e1";

  els.sheetList.innerHTML = "";
  currencies.forEach((code) => {
    const meta = currencyMeta[code];
    const selected = sheetTarget === "from" ? code === from : code === to;
    const row = document.createElement("button");
    row.type = "button";
    row.className = "w-full h-[54px] border-b flex items-center justify-between text-left";
    row.style.borderBottomColor = borderColor;
    row.innerHTML = `
      <span class="flex flex-col">
        <span class="dm-sans text-[16px] font-medium">${meta.name}</span>
        <span class="dm-sans text-[16px] font-medium">${code}</span>
      </span>
      <span class="dm-sans text-[24px] font-normal">${meta.symbol}</span>
    `;
    row.style.color = selected ? selectedColor : defaultColor;
    row.addEventListener("click", () => {
      if (sheetTarget === "from") from = code;
      else to = code;
      closeSheet();
      updateUI();
    });
    els.sheetList.appendChild(row);
  });
}

function wire() {
  document.querySelectorAll("[data-key]").forEach((btn) => {
    btn.addEventListener("click", () => handleKey(btn.getAttribute("data-key")));
    btn.addEventListener("pointerdown", () => btn.classList.add("is-pressed"));
    btn.addEventListener("pointerup", () => btn.classList.remove("is-pressed"));
    btn.addEventListener("pointerleave", () => btn.classList.remove("is-pressed"));
    btn.addEventListener("pointercancel", () => btn.classList.remove("is-pressed"));
  });

  els.fromDropdownBtn.addEventListener("click", () => openSheet("from"));
  els.toDropdownBtn.addEventListener("click", () => openSheet("to"));
  els.sheetCloseBtn.addEventListener("click", closeSheet);
  els.sheetOverlay.addEventListener("click", (e) => {
    if (e.target && e.target.getAttribute("data-role") === "backdrop") closeSheet();
  });
  els.swapBtn.addEventListener("click", swapCurrencies);

  document.addEventListener("keydown", (e) => {
    if (!els.sheetOverlay.classList.contains("hidden")) {
      if (e.key === "Escape") closeSheet();
      return;
    }
    if (/^[0-9]$/.test(e.key)) return handleKey(e.key);
    if (e.key === ".") return handleKey(".");
    if (e.key === "Backspace") return handleKey("backspace");
    if (e.key === "Enter") return handleKey("go");
  });
}

applyTheme();
wire();
updateUI();
