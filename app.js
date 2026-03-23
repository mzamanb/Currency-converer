const currencies = ["AED", "USD", "EUR", "GBP", "JPY", "INR", "CAD", "AUD"];

// Figma variable tokens (name -> value) extracted from your file.
// We reuse these exact values for UI colors so the converter matches the design.
const figmaVars = {
  "Color/Primary Button": "#3a4526",
  "Color/Secondary Button": "#b2e556",
  "Color/Text Color_Dark BG": "#ffffff",
  "Color/Text Color_LG_BG": "#000000",
};

// "1 unit in this currency" -> USD multiplier
// (Uses a small fixed demo table so the UI works offline.)
const rateToUSD = {
  AED: 0.1,
  USD: 1,
  EUR: 1.1,
  GBP: 1.25,
  JPY: 0.0067,
  INR: 0.012,
  CAD: 0.75,
  AUD: 0.66,
};

const els = {
  fromCurrency: document.getElementById("fromCurrency"),
  toCurrency: document.getElementById("toCurrency"),
  fromAmount: document.getElementById("fromAmount"),
  toAmount: document.getElementById("toAmount"),
  fromDropdownBtn: document.getElementById("fromDropdownBtn"),
  toDropdownBtn: document.getElementById("toDropdownBtn"),
  currencyDropdown: document.getElementById("currencyDropdown"),
  dropdownItems: document.getElementById("dropdownItems"),
  swapBtn: document.getElementById("swapBtn"),
};

let from = "AED";
let to = "USD";
let amountInput = "1000"; // left input as string to preserve typing
let dropdownTarget = null; // "from" | "to"

function clampAmountString(str) {
  // Keep at most 12 digits (ignoring sign/decimal) and at most 10 decimals.
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
  // Match a "calculator-ish" display: show up to 2 decimals for small/normal values.
  const decimals = abs >= 1000 ? 0 : abs >= 10 ? 2 : 2;
  const fixed = n.toFixed(decimals);
  // Strip trailing zeros & optional decimal point
  return fixed.replace(/(\.\d*?[1-9])0+$/g, "$1").replace(/\.0+$/g, "");
}

function convert(amount, fromCurrency, toCurrency) {
  const a = rateToUSD[fromCurrency];
  const b = rateToUSD[toCurrency];
  if (!a || !b) return 0;
  const usd = amount * a;
  return usd / b;
}

function updateUI() {
  const amount = parseAmount(amountInput);
  els.fromCurrency.textContent = from;
  els.toCurrency.textContent = to;
  els.fromAmount.textContent = formatAmount(amount);

  const out = convert(amount, from, to);
  els.toAmount.textContent = formatAmount(out);
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
  const clamped = clampAmountString(next);
  amountInput = clamped;
  updateUI();
}

function appendDigit(d) {
  const s = amountInput;
  if (s === "0") {
    setAmountString(d);
  } else if (s === "-0") {
    setAmountString("-" + d);
  } else {
    setAmountString(s + d);
  }
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
  // Preserve the displayed numeric value in the newly "from" currency.
  const currentFrom = parseAmount(amountInput);
  const currentToAmount = convert(currentFrom, from, to);

  const oldFrom = from;
  from = to;
  to = oldFrom;
  amountInput = String(currentToAmount);
  updateUI();
}

function openDropdown(target) {
  dropdownTarget = target;
  els.currencyDropdown.classList.remove("hidden");
  els.fromDropdownBtn?.setAttribute(
    "aria-expanded",
    target === "from" ? "true" : "false"
  );
  els.toDropdownBtn?.setAttribute("aria-expanded", target === "to" ? "true" : "false");
  els.currencyDropdown.scrollTop = 0;
}

function closeDropdown() {
  dropdownTarget = null;
  els.currencyDropdown.classList.add("hidden");
  els.fromDropdownBtn?.setAttribute("aria-expanded", "false");
  els.toDropdownBtn?.setAttribute("aria-expanded", "false");
}

function renderDropdown() {
  els.dropdownItems.innerHTML = "";
  for (const code of currencies) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "dm-sans w-full text-left px-[10px] py-[10px] rounded-[12px] " +
      "text-white hover:bg-[rgba(255,255,255,0.12)] focus:outline-none";
    btn.textContent = code;
    btn.addEventListener("click", () => {
      if (dropdownTarget === "from") from = code;
      else if (dropdownTarget === "to") to = code;
      closeDropdown();
      updateUI();
    });
    els.dropdownItems.appendChild(btn);
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
      // Digits
      if (typeof key === "string" && /^[0-9]$/.test(key)) appendDigit(key);
      return;
  }
}

function wireUpKeypad() {
  document.querySelectorAll("[data-key]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-key");
      handleKey(key);
    });
  });
}

function wireUpDropdown() {
  els.fromDropdownBtn.addEventListener("click", () => {
    const isOpen = !els.currencyDropdown.classList.contains("hidden");
    if (!isOpen || dropdownTarget !== "from") openDropdown("from");
    else closeDropdown();
  });

  els.toDropdownBtn.addEventListener("click", () => {
    const isOpen = !els.currencyDropdown.classList.contains("hidden");
    if (!isOpen || dropdownTarget !== "to") openDropdown("to");
    else closeDropdown();
  });

  document.addEventListener("click", (e) => {
    const clickedInsideDropdown = els.currencyDropdown.contains(e.target);
    const clickedFromBtn = els.fromDropdownBtn.contains(e.target);
    const clickedToBtn = els.toDropdownBtn.contains(e.target);
    if (clickedInsideDropdown || clickedFromBtn || clickedToBtn) return;
    closeDropdown();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDropdown();
  });
}

function wireUpSwap() {
  els.swapBtn.addEventListener("click", () => swapCurrencies());
}

// Init
renderDropdown();
applyFigmaTokenColors();
wireUpKeypad();
wireUpDropdown();
wireUpSwap();
updateUI();

