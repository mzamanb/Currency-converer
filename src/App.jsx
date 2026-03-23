import { useEffect, useMemo, useState } from "react";
import "./App.css";

const figmaVars = {
  "Color/Primary Button": "#3a4526",
  "Color/Secondary Button": "#b2e556",
  "Color/Text Color_Dark BG": "#ffffff",
  "Color/Text Color_LG_BG": "#000000",
  "Color/Disabled_BG": "#c8c8c8",
};

const currencyMeta = {
  USD: { name: "United States", symbol: "$" },
  EUR: { name: "European Union", symbol: "€" },
  GBP: { name: "United Kingdom", symbol: "£" },
  JPY: { name: "Japan", symbol: "¥" },
  CNY: { name: "China", symbol: "¥" },
  AUD: { name: "Australia", symbol: "$" },
  CAD: { name: "Canada", symbol: "$" },
  CHF: { name: "Switzerland", symbol: "Fr" },
  INR: { name: "India", symbol: "₹" },
  BRL: { name: "Brazil", symbol: "R$" },
  AED: { name: "United Arab Emirates", symbol: "د.إ." },
};

const currencies = ["USD", "EUR", "GBP", "JPY", "CNY", "AUD", "CAD", "CHF", "INR", "BRL", "AED"];

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

const themePalettes = {
  "dark-tailwind": {
    pageBg: "#000000",
    phoneBg: figmaVars["Color/Primary Button"],
    gradFrom: figmaVars["Color/Primary Button"],
    gradTo: "#060606",
    title: figmaVars["Color/Text Color_Dark BG"],
    cardBg: "rgba(255,255,255,0.2)",
    cardBorder: "rgba(255,255,255,0.08)",
    label: figmaVars["Color/Text Color_Dark BG"],
    amount: figmaVars["Color/Text Color_Dark BG"],
    accent: figmaVars["Color/Secondary Button"],
    keyDarkOuter: figmaVars["Color/Primary Button"],
    keyDarkInner: figmaVars["Color/Primary Button"],
    keyDarkText: figmaVars["Color/Text Color_Dark BG"],
    keyBrightOuter: figmaVars["Color/Secondary Button"],
    keyBrightInner: figmaVars["Color/Secondary Button"],
    keyBrightText: figmaVars["Color/Text Color_LG_BG"],
    sheetBg: figmaVars["Color/Primary Button"],
    sheetTitle: figmaVars["Color/Text Color_Dark BG"],
    sheetSubtitle: figmaVars["Color/Disabled_BG"],
    sheetCloseBg: "rgba(255,255,255,0.10)",
    sheetCloseText: figmaVars["Color/Text Color_Dark BG"],
    sheetBorder: "#4b4b4b",
  },
  "light-shadcn": {
    pageBg: "#f8fafc",
    phoneBg: "#ffffff",
    gradFrom: "#ffffff",
    gradTo: "#f1f5f9",
    title: "#0f172a",
    cardBg: "rgba(15,23,42,0.04)",
    cardBorder: "rgba(15,23,42,0.12)",
    label: "#475569",
    amount: "#0f172a",
    accent: "#0f172a",
    keyDarkOuter: "#e2e8f0",
    keyDarkInner: "#f8fafc",
    keyDarkText: "#0f172a",
    keyBrightOuter: "#0f172a",
    keyBrightInner: "#1e293b",
    keyBrightText: "#f8fafc",
    sheetBg: "#ffffff",
    sheetTitle: "#0f172a",
    sheetSubtitle: "#64748b",
    sheetCloseBg: "rgba(15,23,42,0.08)",
    sheetCloseText: "#0f172a",
    sheetBorder: "#cbd5e1",
  },
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
  const decimals = abs >= 1000 ? 0 : abs >= 100 ? 2 : abs >= 1 ? 4 : 8;
  const fixed = n.toFixed(decimals);
  return fixed.replace(/(\.\d*?[1-9])0+$/g, "$1").replace(/\.0+$/g, "");
}

function convert(amount, fromCurrency, toCurrency) {
  const f = ratesPerUSD[fromCurrency];
  const t = ratesPerUSD[toCurrency];
  if (typeof f === "number" && typeof t === "number") return (amount * t) / f;
  return 0;
}

function App() {
  const [from, setFrom] = useState("AED");
  const [to, setTo] = useState("USD");
  const [amountInput, setAmountInput] = useState("0");
  const [sheetTarget, setSheetTarget] = useState(null);
  const [currentTheme, setCurrentTheme] = useState("dark-tailwind");
  const [pressedKey, setPressedKey] = useState(null);
  const [bumpFrom, setBumpFrom] = useState(false);
  const [bumpTo, setBumpTo] = useState(false);
  const [phoneScale, setPhoneScale] = useState(1);

  const amount = useMemo(() => parseAmount(amountInput), [amountInput]);
  const toAmount = useMemo(() => convert(amount, from, to), [amount, from, to]);
  const fromText = useMemo(() => formatAmount(amount), [amount]);
  const toText = useMemo(() => formatAmount(toAmount), [toAmount]);
  const palette = themePalettes[currentTheme];
  const sheetOpen = sheetTarget !== null;

  useEffect(() => {
    document.body.style.backgroundColor = palette.pageBg;
    document.body.dataset.theme = currentTheme;
    document.documentElement.style.setProperty(
      "--input-active-color",
      currentTheme === "dark-tailwind" ? "rgba(178, 229, 86, 0.45)" : "rgba(15, 23, 42, 0.4)"
    );
    document.documentElement.style.setProperty(
      "--input-active-ring",
      currentTheme === "dark-tailwind" ? "rgba(178, 229, 86, 0.2)" : "rgba(15, 23, 42, 0.2)"
    );
    document.documentElement.style.setProperty(
      "--input-filled-bg",
      currentTheme === "dark-tailwind" ? "rgba(255, 255, 255, 0.23)" : "rgba(15, 23, 42, 0.04)"
    );
  }, [palette.pageBg, currentTheme]);

  useEffect(() => {
    function fitPhoneToViewport() {
      const vw = Math.max(320, window.innerWidth - 32);
      const vh = Math.max(320, window.innerHeight - 32);
      const scale = Math.min(1, vw / 430, vh / 932);
      setPhoneScale(scale);
    }
    fitPhoneToViewport();
    window.addEventListener("resize", fitPhoneToViewport);
    return () => window.removeEventListener("resize", fitPhoneToViewport);
  }, []);

  useEffect(() => {
    setBumpFrom(true);
    const t = setTimeout(() => setBumpFrom(false), 140);
    return () => clearTimeout(t);
  }, [fromText]);

  useEffect(() => {
    setBumpTo(true);
    const t = setTimeout(() => setBumpTo(false), 140);
    return () => clearTimeout(t);
  }, [toText]);

  useEffect(() => {
    if (!pressedKey) return undefined;
    const t = setTimeout(() => setPressedKey(null), 110);
    return () => clearTimeout(t);
  }, [pressedKey]);

  useEffect(() => {
    function onKeyDown(e) {
      if (sheetOpen) {
        if (e.key === "Escape") setSheetTarget(null);
        return;
      }
      if (e.key === "Enter" || e.code === "NumpadEnter") {
        e.preventDefault();
        handleKey("equals");
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        handleKey("backspace");
        return;
      }
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleKey(e.key);
        return;
      }
      if (e.key === "." || e.code === "NumpadDecimal") {
        e.preventDefault();
        handleKey("dot");
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  function applyInputCardStates() {
    const activeCard = sheetTarget === "to" ? "to" : "from";
    return {
      from: `${activeCard === "from" ? "state-active" : "state-default"} ${
        Math.abs(amount) > 0 ? "state-filled" : ""
      }`,
      to: `${activeCard === "to" ? "state-active" : "state-default"} ${
        Math.abs(amount) > 0 ? "state-filled" : ""
      }`,
    };
  }

  function setAmountString(next) {
    setAmountInput(clampAmountString(next));
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

  function applyDot() {
    if (amountInput.includes(".")) return;
    if (amountInput === "" || amountInput === "-") return setAmountString(amountInput + "0.");
    setAmountString(amountInput + ".");
  }

  function swapCurrencies() {
    const currentFrom = parseAmount(amountInput);
    const currentToAmount = convert(currentFrom, from, to);
    const oldFrom = from;
    setFrom(to);
    setTo(oldFrom);
    setAmountInput(String(currentToAmount));
  }

  function handleKey(key) {
    setPressedKey(key);
    switch (key) {
      case "ac":
        setAmountString("0");
        return;
      case "swap":
        setCurrentTheme((prev) => (prev === "dark-tailwind" ? "light-shadcn" : "dark-tailwind"));
        return;
      case "backspace":
        backspace();
        return;
      case "dot":
        applyDot();
        return;
      case "equals":
        return;
      default:
        if (typeof key === "string" && /^[0-9]$/.test(key)) appendDigit(key);
    }
  }

  function openSheet(target) {
    setSheetTarget(target);
  }

  function closeSheet() {
    setSheetTarget(null);
  }

  function onCurrencySelect(code) {
    if (sheetTarget === "from") setFrom(code);
    else if (sheetTarget === "to") setTo(code);
    closeSheet();
  }

  const cardStates = applyInputCardStates();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div
        style={{ width: `${430 * phoneScale}px`, height: `${932 * phoneScale}px` }}
        className="relative flex-shrink-0"
      >
        <div
          style={{ transform: `scale(${phoneScale})`, transformOrigin: "top left" }}
          className="relative w-[430px] h-[932px] overflow-y-auto overflow-x-hidden rounded-[15px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] pb-[24px]"
        >
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, ${palette.gradFrom}, ${palette.gradTo})`,
            }}
          />

          <div className="relative z-10">
            <div className="h-[54px]" />
            <div className="h-[55px] px-[24px] flex items-center justify-center">
              <div className="dm-sans font-medium text-[18px] tracking-[4.5px]" style={{ color: palette.title }}>
                Currency Convertor
              </div>
            </div>

            <div className="relative left-0 top-[50px] w-full px-[16px] flex flex-col gap-[16px]">
              <div
                className={`input-card ${cardStates.from} rounded-[15px] px-[16px] pb-[60px] pt-[16px]`}
                style={{ backgroundColor: palette.cardBg, borderColor: palette.cardBorder }}
              >
                <div className="flex flex-col gap-[24px]">
                  <div className="flex items-center justify-end gap-[8px] w-full">
                    <button
                      className="flex items-center justify-end gap-[8px] group select-none"
                      type="button"
                      onClick={() => openSheet("from")}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-95">
                        <path
                          d="M3.2 5.2L7 9L10.8 5.2"
                          stroke={palette.accent}
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="dm-sans font-medium text-[12px] leading-normal" style={{ color: palette.label }}>
                        {from}
                      </span>
                    </button>
                  </div>
                  <div className="w-full flex justify-end">
                    <div className="dm-sans font-extrabold text-[28px] leading-[0] text-right" style={{ color: palette.amount }}>
                      <span className={`amount-value ${bumpFrom ? "is-bump" : ""}`}>{fromText}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="absolute z-20 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[40px] h-[40px] rounded-[15px] flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.2)]"
                style={{ backgroundColor: "rgba(255,255,255,0.23)" }}
                onClick={swapCurrencies}
                aria-label="Swap currencies"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M8 4L5 7L8 10M16 20L19 17L16 14M5 7H16M8 17H19"
                    stroke={palette.accent}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <div
                className={`input-card ${cardStates.to} rounded-[15px] px-[16px] pb-[60px] pt-[16px]`}
                style={{ backgroundColor: palette.cardBg, borderColor: palette.cardBorder }}
              >
                <div className="flex flex-col gap-[24px]">
                  <div className="flex items-center justify-end gap-[8px] w-full">
                    <button
                      className="flex items-center justify-end gap-[8px] select-none"
                      type="button"
                      onClick={() => openSheet("to")}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-95">
                        <path
                          d="M3.2 5.2L7 9L10.8 5.2"
                          stroke={palette.accent}
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="dm-sans font-medium text-[12px] leading-normal" style={{ color: palette.label }}>
                        {to}
                      </span>
                    </button>
                  </div>
                  <div className="w-full flex justify-end">
                    <div className="dm-sans font-extrabold text-[28px] leading-[0] text-right" style={{ color: palette.amount }}>
                      <span className={`amount-value ${bumpTo ? "is-bump" : ""}`}>{toText}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 w-full px-[16px] mt-[30%]">
            <div className="flex flex-col gap-[8px] w-full">
              {[
                ["7", "8", "9", "swap"],
                ["4", "5", "6", "backspace"],
                ["1", "2", "3", "ac"],
                ["0", "dot", "equals"],
              ].map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-[8px] w-full">
                  {row.map((key) => {
                    const isBright = key === "swap" || key === "backspace" || key === "ac" || key === "equals";
                    const wideZero = rowIndex === 3 && key === "0";
                    const className = `key key-shell ${isBright ? "bright" : "dark"} ${
                      wideZero ? "w-[194.5px]" : "flex-1"
                    } dm-sans text-[24px] font-normal ${pressedKey === key ? "is-pressed" : ""}`;
                    const label = key === "backspace" ? "‹" : key === "ac" ? "Clr" : key === "dot" ? "." : key === "equals" ? "Go" : key;
                    return (
                      <button
                        key={key}
                        data-key={key}
                        className={className}
                        style={{ backgroundColor: isBright ? palette.keyBrightOuter : palette.keyDarkOuter, color: isBright ? palette.keyBrightText : palette.keyDarkText }}
                        onPointerDown={() => setPressedKey(key)}
                        onPointerUp={() => setPressedKey(null)}
                        onPointerLeave={() => setPressedKey(null)}
                        onPointerCancel={() => setPressedKey(null)}
                        onClick={() => handleKey(key)}
                      >
                        <span
                          className="key-inner w-full"
                          style={{
                            backgroundColor: isBright ? palette.keyBrightInner : palette.keyDarkInner,
                            color: isBright ? palette.keyBrightText : palette.keyDarkText,
                          }}
                        >
                          {key === "swap" ? (currentTheme === "dark-tailwind" ? "☀" : "◐") : label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {sheetOpen && (
            <div className="absolute inset-0 z-30" role="dialog" aria-modal="true" aria-label="Currency selector">
              <div className="absolute inset-0 bg-[rgba(0,0,0,0.35)]" onClick={closeSheet} />
              <div
                className="absolute bottom-0 left-0 w-full h-[75%] flex flex-col gap-[24px] items-start overflow-clip px-[24px] py-[32px] rounded-[15px] shadow-[0px_4px_18px_rgba(0,0,0,0.35)]"
                style={{ backgroundColor: palette.sheetBg }}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex flex-col items-start leading-[normal] whitespace-nowrap">
                    <p className="dm-sans font-normal text-[24px]" style={{ color: palette.sheetTitle }}>Currency Symbols</p>
                    <p className="dm-sans font-medium text-[16px]" style={{ color: palette.sheetSubtitle }}>
                      Select your currency you want to convert
                    </p>
                  </div>
                  <button
                    type="button"
                    className="dm-sans w-[40px] h-[40px] rounded-[15px] flex items-center justify-center"
                    style={{ backgroundColor: palette.sheetCloseBg, color: palette.sheetCloseText }}
                    onClick={closeSheet}
                    aria-label="Close currency sheet"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex-1 min-h-0 flex flex-col gap-[16px] w-full overflow-y-auto">
                  {currencies.map((code) => {
                    const meta = currencyMeta[code];
                    const isSelected = sheetTarget === "from" ? code === from : code === to;
                    return (
                      <button
                        key={code}
                        type="button"
                        className="border-b border-solid w-full flex items-center justify-between pb-[8px] text-left"
                        style={{ borderBottomColor: palette.sheetBorder }}
                        onClick={() => onCurrencySelect(code)}
                      >
                        <div className="flex flex-col gap-[4px] items-start justify-center leading-[normal]">
                          <p className="dm-sans font-medium text-[16px]" style={{ color: isSelected ? palette.accent : palette.sheetTitle }}>
                            {meta.name}
                          </p>
                          <p className="dm-sans font-medium text-[16px]" style={{ color: isSelected ? palette.accent : palette.sheetTitle }}>
                            {code}
                          </p>
                        </div>
                        <p className="dm-sans font-normal text-[24px]" style={{ color: isSelected ? palette.accent : palette.sheetTitle }}>
                          {meta.symbol}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
