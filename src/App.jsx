import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, ChevronDown, Delete, MoonStar, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

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

function formatAmount(n) {
  if (!Number.isFinite(n)) return "0";
  const abs = Math.abs(n);
  const decimals = abs >= 1000 ? 0 : abs >= 100 ? 2 : abs >= 1 ? 4 : 8;
  return n
    .toFixed(decimals)
    .replace(/(\.\d*?[1-9])0+$/g, "$1")
    .replace(/\.0+$/g, "");
}

function convert(amount, from, to) {
  const fromRate = ratesPerUSD[from];
  const toRate = ratesPerUSD[to];
  if (typeof fromRate !== "number" || typeof toRate !== "number") return 0;
  return (amount * toRate) / fromRate;
}

const keypadRows = [
  ["7", "8", "9", "swap-theme"],
  ["4", "5", "6", "backspace"],
  ["1", "2", "3", "ac"],
  ["0", ".", "equals", "go"],
];

function App() {
  const [theme, setTheme] = useState("dark-tailwind");
  const [from, setFrom] = useState("AED");
  const [to, setTo] = useState("USD");
  const [input, setInput] = useState("0");
  const [sheetTarget, setSheetTarget] = useState("from");
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark-tailwind");
  }, [theme]);

  const amount = Number(input) || 0;
  const converted = useMemo(() => convert(amount, from, to), [amount, from, to]);

  const isDark = theme === "dark-tailwind";
  const wrapperClass = isDark
    ? "bg-black text-white"
    : "bg-slate-100 text-slate-900";
  const phoneClass = isDark
    ? "from-[#3a4526] to-[#060606] border-white/10"
    : "from-white to-slate-100 border-slate-300";
  const keypadAccent = isDark
    ? "bg-[#b2e556] text-black hover:bg-[#9edc3b]"
    : "bg-slate-900 text-white hover:bg-slate-800";
  const keypadDefault = isDark
    ? "bg-[#3a4526] text-white hover:bg-[#44502f]"
    : "bg-slate-200 text-slate-900 hover:bg-slate-300";

  function clampAmountString(str) {
    const s = String(str ?? "").trim();
    if (!s) return "0";
    const sign = s.startsWith("-") ? "-" : "";
    const body = sign ? s.slice(1) : s;
    const [intRaw, fracRaw] = body.split(".");
    const intPart = (intRaw || "").replace(/[^\d]/g, "").slice(0, 12);
    const fracPart = (fracRaw ?? "").replace(/[^\d]/g, "").slice(0, 10);
    if (!intPart && !fracPart) return "0";
    return `${sign}${intPart || "0"}${fracPart ? `.${fracPart}` : ""}`;
  }

  function setAmount(next) {
    const clamped = clampAmountString(next);
    setInput(clamped === "-" || clamped === "" ? "0" : clamped);
  }

  function handleKey(key) {
    if (key === "empty") return;

    if (/^\d$/.test(key)) {
      setInput((prev) => (prev === "0" ? key : prev + key));
      return;
    }
    if (key === ".") {
      setInput((prev) => (prev.includes(".") ? prev : `${prev}.`));
      return;
    }
    if (key === "backspace") {
      setInput((prev) => (prev.length <= 1 ? "0" : prev.slice(0, -1)));
      return;
    }
    if (key === "ac") {
      setInput("0");
      return;
    }
    if (key === "swap-theme") {
      setTheme((prev) => (prev === "dark-tailwind" ? "light-shadcn" : "dark-tailwind"));
      return;
    }
    if (key === "go") {
      setAmount(formatAmount(converted));
      return;
    }
    if (key === "equals") {
      setAmount(formatAmount(converted));
    }
  }

  function switchCurrencies() {
    const previousAmount = Number(input) || 0;
    const nextAmount = convert(previousAmount, from, to);
    setFrom(to);
    setTo(from);
    setAmount(String(nextAmount));
  }

  function openCurrencySheet(target) {
    setSheetTarget(target);
    setSheetOpen(true);
  }

  function handleCurrencySelect(code) {
    if (sheetTarget === "from") setFrom(code);
    else setTo(code);
    setSheetOpen(false);
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (sheetOpen) {
        if (e.key === "Escape") setSheetOpen(false);
        return;
      }
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleKey(e.key);
        return;
      }
      if (e.key === ".") {
        e.preventDefault();
        handleKey(".");
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        handleKey("backspace");
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        handleKey("go");
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [sheetOpen, converted]);

  return (
    <main className={`flex min-h-screen items-center justify-center p-4 font-sans ${wrapperClass}`}>
      <section
        className={cn(
          "relative flex h-[92vh] max-h-[898px] w-full max-w-[430px] flex-col overflow-hidden rounded-[38px] border bg-gradient-to-b px-0 pt-0 shadow-xl",
          phoneClass
        )}
      >
        <div className="flex h-[55px] items-center justify-center px-[24px]">
          <p className="text-center text-[18px] font-medium tracking-[4.5px]">Currency Convertor</p>
        </div>

        <div className="px-[16px] pt-[21px]">
          <div className="relative h-[319px]">
          <Card
            className={cn(
              "h-[151.5px] rounded-[24px] border-0 transition-all duration-200",
              isDark ? "bg-white/15 ring-white/10" : "bg-white ring-slate-300",
              sheetOpen && sheetTarget === "from" && (isDark ? "ring-[#b2e556]/70" : "ring-slate-800/40")
            )}
          >
            <CardContent className="flex h-full flex-col justify-between p-4 pb-[60px]">
              <Button
                variant="ghost"
                className="h-8 w-fit px-0 text-[12px] hover:bg-transparent"
                onClick={() => openCurrencySheet("from")}
              >
                {from}
                <ChevronDown className="ml-1 size-4" />
              </Button>
              <p className="text-[48px] leading-none font-medium tracking-tight">{formatAmount(amount)}</p>
            </CardContent>
          </Card>

          <Button
            type="button"
            size="icon"
            variant={isDark ? "secondary" : "outline"}
            className="absolute left-[75px] top-[140px] z-10 size-[40px] rotate-90 rounded-[15px]"
            onClick={switchCurrencies}
            aria-label="Swap currencies"
          >
            <ArrowUpDown className="size-4" />
          </Button>

          <Card
            className={cn(
              "mt-[16px] h-[151.5px] rounded-[24px] border-0 transition-all duration-200",
              isDark ? "bg-white/15 ring-white/10" : "bg-white ring-slate-300",
              sheetOpen && sheetTarget === "to" && (isDark ? "ring-[#b2e556]/70" : "ring-slate-800/40")
            )}
          >
            <CardContent className="flex h-full flex-col justify-between p-4 pb-[60px]">
              <Button
                variant="ghost"
                className="h-8 w-fit px-0 text-[12px] hover:bg-transparent"
                onClick={() => openCurrencySheet("to")}
              >
                {to}
                <ChevronDown className="ml-1 size-4" />
              </Button>
              <p className="text-[48px] leading-none font-medium tracking-tight">{formatAmount(converted)}</p>
            </CardContent>
          </Card>
          </div>
        </div>

        <Separator className={cn("mx-[16px] mt-[8px]", isDark ? "bg-white/10" : "bg-slate-300/70")} />

        <div className="mt-[8px] grid grid-cols-4 gap-[8px] px-[16px] pb-[16px]">
          {keypadRows.flat().map((key) => {
            const isAction = key === "swap-theme" || key === "go";
            const icon =
              key === "swap-theme" ? (
                isDark ? (
                  <Sun className="size-5" />
                ) : (
                  <MoonStar className="size-5" />
                )
              ) : key === "backspace" ? (
                <Delete className="size-5" />
              ) : null;
            const label =
              key === "ac"
                ? "Clr"
                : key === "go"
                  ? "Go"
                  : key === "equals"
                    ? "="
                  : key === "backspace"
                    ? ""
                    : key;
            return (
              <Button
                key={key}
                type="button"
                onClick={() => handleKey(key)}
                className={cn(
                  "h-[94px] rounded-[20px] text-[24px] font-normal shadow-sm transition-transform duration-100 active:scale-[0.98]",
                  isAction ? keypadAccent : keypadDefault
                )}
              >
                {icon || label}
              </Button>
            );
          })}
        </div>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <CurrencySheet
            selected={sheetTarget === "from" ? from : to}
            isDark={isDark}
            onSelect={handleCurrencySelect}
          />
        </Sheet>
      </section>
    </main>
  );
}

function CurrencySheet({ selected, onSelect, isDark }) {
  return (
    <SheetContent
      side="bottom"
      className={cn(
        "h-[592px] rounded-t-[28px] border-0 px-0 pb-0 sm:max-w-none",
        isDark ? "bg-[#3a4526] text-white" : "bg-white text-slate-900"
      )}
    >
      <SheetHeader className="px-[24px] pt-[32px] pb-0">
        <SheetTitle className="text-[24px] leading-[31px] font-normal">Currency Symbols</SheetTitle>
        <SheetDescription className="text-[16px] leading-[21px]">
          Select your currency you want to convert
        </SheetDescription>
      </SheetHeader>
      <ScrollArea className="mt-[24px] h-[460px] px-[24px] pb-[24px]">
        <div className="space-y-[16px]">
          {currencies.map((code) => {
            const active = code === selected;
            return (
              <Button
                key={code}
                type="button"
                variant="ghost"
                className={`h-[54px] w-full justify-between rounded-none border-b px-0 py-0 ${
                  active ? "text-primary" : isDark ? "text-white" : "text-slate-900"
                }`}
                onClick={() => onSelect(code)}
              >
                <span className="flex flex-col items-start">
                  <span className="text-[16px] font-medium">{currencyMeta[code].name}</span>
                  <span className="text-[16px] font-medium">{code}</span>
                </span>
                <span className="text-[24px] font-normal">{currencyMeta[code].symbol}</span>
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </SheetContent>
  );
}

export default App;
