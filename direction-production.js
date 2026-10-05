const PROD_MONO = '"JetBrains Mono", ui-monospace, monospace';
const PROD_SANS = '"Inter", -apple-system, BlinkMacSystemFont, sans-serif';
function prodTheme(mode) {
  if (mode === "light") {
    return {
      bg: "#F6F5EE",
      surface: "#FFFFFF",
      surfaceDim: "#EFEEE5",
      text: "#1A1F18",
      textDim: "#6E7269",
      textFaint: "#9DA197",
      line: "rgba(26,31,24,0.10)",
      lineSoft: "rgba(26,31,24,0.06)"
    };
  }
  return {
    bg: "#0E120F",
    surface: "rgba(232,234,227,0.03)",
    surfaceDim: "rgba(232,234,227,0.02)",
    text: "#E8EAE3",
    textDim: "#9CA395",
    textFaint: "#7A8579",
    line: "rgba(232,234,227,0.12)",
    lineSoft: "rgba(232,234,227,0.06)"
  };
}
function MethodologyDrawer({ open, onClose, t, accent, inputs, s }) {
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { onClick: onClose, style: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    opacity: open ? 1 : 0,
    pointerEvents: open ? "auto" : "none",
    transition: "opacity 0.25s",
    zIndex: 90
  } }), /* @__PURE__ */ React.createElement("div", { style: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    width: "min(560px, 100vw)",
    background: t.bg,
    borderLeft: `1px solid ${t.line}`,
    color: t.text,
    transform: open ? "translateX(0)" : "translateX(100%)",
    transition: "transform 0.3s cubic-bezier(0.2,0.8,0.2,1)",
    zIndex: 100,
    overflowY: "auto",
    fontFamily: PROD_SANS
  } }, /* @__PURE__ */ React.createElement("div", { style: { position: "sticky", top: 0, padding: "18px 24px", borderBottom: `1px solid ${t.line}`, background: t.bg, display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: PROD_MONO, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: accent, fontWeight: 700 } }, "\u25FC METHODOLOGY"), /* @__PURE__ */ React.createElement("button", { onClick: onClose, style: { background: "none", border: `1px solid ${t.line}`, color: t.text, padding: "6px 12px", fontFamily: PROD_MONO, fontSize: 11, letterSpacing: "0.1em", cursor: "pointer", textTransform: "uppercase" } }, "CLOSE \u2715")), /* @__PURE__ */ React.createElement("div", { style: { padding: "32px 24px" } }, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 24, fontWeight: 700, margin: "0 0 6px", letterSpacing: "-0.01em" } }, "How we got these numbers"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 14, color: t.textDim, lineHeight: 1.55, marginTop: 0 } }, "Anchored to AutoAcre's published methodology v4. Every assumption is shown below \u2014 change anything in the calculator and watch it ripple through."), /* @__PURE__ */ React.createElement(Section, { title: "Assumed inputs", t, accent }, /* @__PURE__ */ React.createElement(Kv, { label: "Acres", v: `${inputs.acres.toFixed(1)}`, t }), /* @__PURE__ */ React.createElement(Kv, { label: "Terrain", v: inputs.terrain, t }), /* @__PURE__ */ React.createElement(Kv, { label: "Frequency", v: `${inputs.frequency} (${FREQ_VISITS[inputs.frequency]} visits/yr)`, t }), /* @__PURE__ */ React.createElement(Kv, { label: "Hours/acre/visit", v: HOURS_PER_ACRE[inputs.terrain].toFixed(2), t }), /* @__PURE__ */ React.createElement(Kv, { label: "Your time", v: "$50/hr (fixed)", t })), /* @__PURE__ */ React.createElement(Section, { title: "DIY zero-turn", t, accent }, /* @__PURE__ */ React.createElement(Kv, { label: "Capital", v: fmtMoney(s.diy.capital), t }), /* @__PURE__ */ React.createElement(Kv, { label: "Annual fuel/maintenance", v: "$550", t }), /* @__PURE__ */ React.createElement(Kv, { label: "Hours/year", v: `${Math.round(s.diy.hours)}`, t }), /* @__PURE__ */ React.createElement(Kv, { label: "Residual at Y8", v: "$0 (assumes end-of-life)", t })), /* @__PURE__ */ React.createElement(Section, { title: "Contractor", t, accent }, /* @__PURE__ */ React.createElement(Kv, { label: "Rate basis", v: "AUD $250/acre/month at fortnightly cadence", t }), /* @__PURE__ */ React.createElement(Kv, { label: "Annual", v: fmtMoney(s.contractor.opex), t }), /* @__PURE__ */ React.createElement(Kv, { label: "Capital", v: "$0", t })), /* @__PURE__ */ React.createElement(Section, { title: "Buy + AutoAcre Manage", t, accent }, /* @__PURE__ */ React.createElement(Kv, { label: "Capital (mower + install)", v: "In your written quote", t }), /* @__PURE__ */ React.createElement(Kv, { label: "Monthly fee", v: "Priced against your current mowing bill", t }), /* @__PURE__ */ React.createElement(Kv, { label: "Your time", v: "0 hrs (managed)", t }), /* @__PURE__ */ React.createElement(Kv, { label: "Residual at Y8", v: "Set out in your written quote", t })), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 24, padding: 16, border: `1px dashed ${t.line}`, fontSize: 12, color: t.textDim, lineHeight: 1.6, fontFamily: PROD_MONO, letterSpacing: "0.04em" } }, "// 8-YR_FORMULA: capital + (annual_opex \xD7 8) \u2212 residual_at_year_8", /* @__PURE__ */ React.createElement("br", null), "// YR-1_CASH: capital + annual_opex_year_1", /* @__PURE__ */ React.createElement("br", null), "// No discounting applied. Real numbers vary \xB1 by property."))));
}
function Section({ title, children, t, accent }) {
  return /* @__PURE__ */ React.createElement("div", { style: { marginTop: 28 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontFamily: PROD_MONO, color: accent, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${t.line}` } }, title), children);
}
function Kv({ label, v, t }) {
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${t.lineSoft}`, gap: 16, fontSize: 13, fontFamily: PROD_MONO } }, /* @__PURE__ */ React.createElement("span", { style: { color: t.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: 11 } }, label), /* @__PURE__ */ React.createElement("span", { style: { color: t.text, textAlign: "right" }, dangerouslySetInnerHTML: { __html: v } }));
}
function ProdSlider({ label, hint, value, min, max, step, format, onChange, accent, t }) {
  const pct = (value - min) / (max - min) * 100;
  return /* @__PURE__ */ React.createElement("div", { style: { padding: "14px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: hint ? 2 : 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: PROD_MONO, color: t.textFaint, fontWeight: 500 } }, label), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: PROD_MONO, fontSize: 18, fontWeight: 600, color: accent, fontVariantNumeric: "tabular-nums" } }, format(value))), hint && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: t.textFaint, marginBottom: 10, lineHeight: 1.4, fontStyle: "italic", opacity: 0.85 } }, hint), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", height: 24, display: "flex", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", inset: "11px 0", background: t.line, borderRadius: 1 } }), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", left: 0, top: 11, height: 2, width: `${pct}%`, background: accent } }), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "range",
      min,
      max,
      step,
      value,
      onChange: (e) => onChange(parseFloat(e.target.value)),
      style: { position: "absolute", inset: 0, width: "100%", opacity: 0, cursor: "pointer", margin: 0 }
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", left: `calc(${pct}% - 6px)`, top: 6, width: 12, height: 12, background: accent, border: `2px solid ${t.bg}`, borderRadius: 0, pointerEvents: "none", boxShadow: `0 0 0 1px ${accent}` } })));
}
function ProdSeg({ label, hint, value, options, onChange, accent, t }) {
  return /* @__PURE__ */ React.createElement("div", { style: { padding: "14px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: PROD_MONO, color: t.textFaint, fontWeight: 500, marginBottom: hint ? 2 : 8 } }, label), hint && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: t.textFaint, marginBottom: 10, lineHeight: 1.4, fontStyle: "italic", opacity: 0.85 } }, hint), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 0, border: `1px solid ${t.line}` } }, options.map((o, i) => {
    const active = o.value === value;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: o.value,
        type: "button",
        onClick: () => onChange(o.value),
        style: {
          flex: "1 1 auto",
          minWidth: 60,
          padding: "10px 12px",
          borderRight: i < options.length - 1 ? `1px solid ${t.line}` : "none",
          background: active ? accent : "transparent",
          color: active ? "#0E120F" : t.text,
          fontSize: 12,
          fontWeight: active ? 700 : 500,
          letterSpacing: "0.05em",
          fontFamily: PROD_MONO,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          cursor: "pointer",
          border: "none",
          transition: "all 0.12s"
        }
      },
      o.label
    );
  })));
}
function ProdChart({ scenarios, cheapKey, referenceKey, accent, t, height = 240 }) {
  const years = 8;
  const W = 600, H = height;
  const padL = 44, padR = 16, padT = 16, padB = 28;
  const chartW = W - padL - padR, chartH = H - padT - padB;
  const series = scenarios.map((sc) => {
    const pts = [];
    for (let y2 = 0; y2 <= years; y2++) {
      let cost = y2 === 0 ? sc.capital : sc.capital + sc.opex * y2 - (y2 === years ? sc.residual : 0);
      pts.push(cost);
    }
    return { key: sc.key, pts };
  });
  const max = Math.max(...series.flatMap((s) => s.pts));
  const niceMax = Math.ceil(max / 1e4) * 1e4;
  const x = (y2) => padL + y2 / years * chartW;
  const y = (v) => padT + chartH - v / niceMax * chartH;
  const colors = { diy: "#9CA88E", contractor: "#C2A06B", aa: accent };
  return /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${W} ${H}`, style: { width: "100%", height: "auto", display: "block" } }, [0, 0.25, 0.5, 0.75, 1].map((f) => /* @__PURE__ */ React.createElement("g", { key: f }, /* @__PURE__ */ React.createElement("line", { x1: padL, y1: padT + chartH * f, x2: W - padR, y2: padT + chartH * f, stroke: t.lineSoft, strokeWidth: "1" }), /* @__PURE__ */ React.createElement("text", { x: padL - 6, y: padT + chartH * f + 3, fill: t.textFaint, fontSize: "9", fontFamily: PROD_MONO, textAnchor: "end" }, "$", Math.round(niceMax * (1 - f) / 1e3), "k"))), [0, 2, 4, 6, 8].map((yr) => /* @__PURE__ */ React.createElement("text", { key: yr, x: x(yr), y: H - 8, fill: t.textFaint, fontSize: "9", fontFamily: PROD_MONO, textAnchor: "middle" }, "Y", yr)), series.map((sr) => {
    const isCheap = sr.key === cheapKey;
    const isRef = sr.key === referenceKey;
    const d = sr.pts.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");
    const op = isCheap ? 1 : isRef ? 0.3 : 0.55;
    const sw = isCheap ? 2.5 : 1.5;
    return /* @__PURE__ */ React.createElement("g", { key: sr.key }, /* @__PURE__ */ React.createElement(
      "path",
      {
        d,
        fill: "none",
        stroke: colors[sr.key],
        strokeWidth: sw,
        opacity: op,
        strokeDasharray: isRef ? "4 4" : "none"
      }
    ), /* @__PURE__ */ React.createElement("circle", { cx: x(years), cy: y(sr.pts[years]), r: isCheap ? 4 : 3, fill: colors[sr.key], opacity: isRef ? 0.4 : 1 }));
  }));
}
function ProductionCalculator({ accent, gating, initialMode }) {
  const [mode, setMode] = React.useState(initialMode || "light");
  const [inputs, setInputs] = React.useState(DEFAULT_INPUTS);
  const [unlocked, setUnlocked] = React.useState(gating === "off");
  const [showLeadForm, setShowLeadForm] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [methodOpen, setMethodOpen] = React.useState(false);
  const [stickyVisible, setStickyVisible] = React.useState(false);
  const heroRef = React.useRef(null);
  React.useEffect(() => {
    setUnlocked(gating === "off");
  }, [gating]);
  React.useEffect(() => {
    setMode(initialMode || "light");
  }, [initialMode]);
  React.useEffect(() => {
    const onScroll = () => {
      if (!heroRef.current) return;
      const r = heroRef.current.getBoundingClientRect();
      setStickyVisible(r.bottom < 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const t = prodTheme(mode);
  const derivedMonthly = inputs.mowMode === "diy" ? (inputs.diyHourlyValue * inputs.diyHoursPerMonth * 12 + 1200) / 12 : inputs.ctrMonthlyInvoice;
  const s = React.useMemo(
    () => calcScenarios({ ...inputs, contractorMonthly: derivedMonthly }),
    [inputs, derivedMonthly]
  );
  const all = scenariosArray(s);
  const tier = getTier(inputs.postcode);
  const set = (k, v) => setInputs((p) => ({ ...p, [k]: v }));
  const colors = { diy: "#9CA88E", contractor: "#C2A06B", aa: accent };
  const isDiy = inputs.mowMode === "diy";
  const referenceKey = isDiy ? "contractor" : "diy";
  const candidates = all.filter((sc) => sc.key !== referenceKey);
  const cheap = candidates.reduce((a, b) => a.total8 < b.total8 ? a : b);
  const cheapAnim = useAnimatedNumber(cheap.total8);
  const max8 = Math.max(...candidates.map((x) => x.total8));
  const savings = max8 - cheap.total8;
  const savingsVsCurrent = Math.max(0, s.contractor.total8 - cheap.total8);
  const nearEqual = cheap.key === "aa" && s.contractor.total8 > 0 && savingsVsCurrent / s.contractor.total8 < 0.1;
  const diyHoursPerYear = Math.round(inputs.diyHoursPerMonth * 12);
  const AA_OVERSIGHT_HRS = 25;
  const hoursFreedDiy = Math.max(0, diyHoursPerYear - AA_OVERSIGHT_HRS);
  const paybackYears = (() => {
    if (cheap.key === "contractor") return null;
    for (let y = 1; y <= 20; y++) {
      const cheapCum = cheap.capital + cheap.opex * y;
      const curCum = s.contractor.opex * y;
      if (cheapCum <= curCum) return y;
    }
    return null;
  })();
  const handleLeadSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const params = new URLSearchParams();
    for (const pair of fd.entries()) params.append(pair[0], pair[1]);
    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    }).then(() => {
      setSubmitted(true);
      setUnlocked(true);
    }).catch(() => {
      setSubmitted(true);
      setUnlocked(true);
    });
  };
  return /* @__PURE__ */ React.createElement("div", { style: { fontFamily: PROD_SANS, background: t.bg, color: t.text, minHeight: "100vh" } }, /* @__PURE__ */ React.createElement("div", { style: {
    padding: "14px 24px",
    borderBottom: `1px solid ${t.line}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontFamily: PROD_MONO,
    fontSize: 11,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: t.textFaint,
    flexWrap: "wrap",
    gap: 8,
    position: "sticky",
    top: 80,
    background: t.bg,
    zIndex: 50
  } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { color: accent } }, "\u25FC"), " AUTOACRE / COST.CALC / v4.2"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14 } }, /* @__PURE__ */ React.createElement("span", null, tier === 1 ? /* @__PURE__ */ React.createElement("span", { style: { color: accent } }, "\u25CF TIER-1 SERVICE") : tier === 2 ? /* @__PURE__ */ React.createElement("span", { style: { color: "#C2A06B" } }, "\u25CF TIER-2 EXPANSION") : "\u25CF TIER-3 REFERRAL"), /* @__PURE__ */ React.createElement("button", { onClick: () => setMethodOpen(true), style: { background: "none", border: `1px solid ${t.line}`, color: t.text, padding: "5px 10px", fontFamily: PROD_MONO, fontSize: 10, letterSpacing: "0.14em", cursor: "pointer", textTransform: "uppercase" } }, "METHODOLOGY"))), /* @__PURE__ */ React.createElement("div", { style: {
    position: "sticky",
    top: 128,
    zIndex: 40,
    padding: "10px 24px",
    background: t.bg,
    borderBottom: stickyVisible ? `1px solid ${accent}` : `1px solid transparent`,
    boxShadow: stickyVisible ? `0 0 0 1px ${t.line}` : "none",
    opacity: stickyVisible ? 1 : 0,
    transform: stickyVisible ? "translateY(0)" : "translateY(-100%)",
    transition: "opacity 0.2s, transform 0.2s, border-color 0.2s",
    display: "flex",
    alignItems: "baseline",
    gap: 18,
    flexWrap: "wrap",
    fontFamily: PROD_MONO
  } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: accent, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700 } }, "OPTIMAL"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, color: t.text, fontWeight: 600 } }, cheap.label), /* @__PURE__ */ React.createElement("span", { style: { flex: 1 } }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18, color: accent, fontWeight: 700, fontVariantNumeric: "tabular-nums" } }, fmtMoney(cheap.total8)), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: t.textFaint, letterSpacing: "0.14em", textTransform: "uppercase" } }, "\xB7 8 YR")), /* @__PURE__ */ React.createElement("div", { ref: heroRef, style: { padding: "56px 24px 32px", maxWidth: 980 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: PROD_MONO, color: accent, fontWeight: 600, marginBottom: 18 } }, "\u2192 8-YEAR ACREAGE COST MODEL"), /* @__PURE__ */ React.createElement("h1", { style: { fontSize: "clamp(36px, 5.4vw, 64px)", lineHeight: 1, letterSpacing: "-0.03em", margin: 0, fontWeight: 700, color: t.text } }, "The math on mowing.", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { style: { color: accent } }, "No marketing.")), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 16, lineHeight: 1.55, color: t.textDim, marginTop: 20, maxWidth: 620 } }, "A live cost model. Drag any input \u2014 every number recalculates instantly. Same property, same assumptions, four paths compared honestly.")), /* @__PURE__ */ React.createElement("div", { style: { margin: "0 24px", padding: "20px", border: `1px solid ${t.line}`, background: t.surfaceDim } }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "8px 28px" } }, /* @__PURE__ */ React.createElement(
    ProdSlider,
    {
      t,
      label: "YOUR MOWABLE ACRES",
      hint: "The area you actually mow \u2014 not the total property size.",
      value: inputs.acres,
      min: 2.5,
      max: 10,
      step: 0.1,
      format: (v) => `${v.toFixed(1)} ac`,
      onChange: (v) => set("acres", v),
      accent
    }
  )), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14, paddingTop: 18, borderTop: `1px solid ${t.line}` } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: PROD_MONO, color: t.textFaint, fontWeight: 500, marginBottom: 10 } }, "HOW DO YOU CURRENTLY MANAGE YOUR MOWING?"), /* @__PURE__ */ React.createElement(
    "div",
    {
      role: "radiogroup",
      "aria-label": "Current mowing arrangement",
      style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, border: `1px solid ${t.line}` }
    },
    [
      { value: "contractor", label: "CONTRACTOR \u2014 I pay someone to mow" },
      { value: "diy", label: "DIY \u2014 I do it myself" }
    ].map((o, i) => {
      const active = inputs.mowMode === o.value;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: o.value,
          type: "button",
          role: "radio",
          "aria-checked": active,
          onClick: () => set("mowMode", o.value),
          style: {
            padding: "14px 14px",
            borderRight: i === 0 ? `1px solid ${t.line}` : "none",
            background: active ? accent : "transparent",
            color: active ? "#0E120F" : t.text,
            fontSize: 12,
            fontWeight: active ? 700 : 500,
            letterSpacing: "0.05em",
            fontFamily: PROD_MONO,
            textTransform: "uppercase",
            cursor: "pointer",
            border: "none",
            textAlign: "center",
            lineHeight: 1.35,
            transition: "all 0.12s"
          }
        },
        o.label
      );
    })
  ), inputs.mowMode === "contractor" && /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "8px 28px", marginTop: 6 } }, /* @__PURE__ */ React.createElement(
    ProdSlider,
    {
      t,
      label: "AVG MONTHLY INVOICE",
      hint: "What do you typically pay your contractor per month?",
      value: inputs.ctrMonthlyInvoice,
      min: 200,
      max: 3e3,
      step: 50,
      format: (v) => `$${v.toLocaleString("en-AU")}`,
      onChange: (v) => set("ctrMonthlyInvoice", v),
      accent
    }
  )), inputs.mowMode === "diy" && /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "8px 28px", marginTop: 6 } }, /* @__PURE__ */ React.createElement(
    ProdSlider,
    {
      t,
      label: "YOUR TIME / HR",
      hint: "What's an hour of your time worth to you?",
      value: inputs.diyHourlyValue,
      min: 20,
      max: 150,
      step: 5,
      format: (v) => `$${v}`,
      onChange: (v) => set("diyHourlyValue", v),
      accent
    }
  ), /* @__PURE__ */ React.createElement(
    ProdSlider,
    {
      t,
      label: "HRS ON MOWER / MONTH",
      value: inputs.diyHoursPerMonth,
      min: 1,
      max: 20,
      step: 0.5,
      format: (v) => `${v} hrs`,
      onChange: (v) => set("diyHoursPerMonth", v),
      accent
    }
  ))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "8px 28px", marginTop: 14, paddingTop: 18, borderTop: `1px solid ${t.line}` } }, /* @__PURE__ */ React.createElement(
    ProdSeg,
    {
      t,
      label: "TERRAIN",
      hint: "The dominant grade across most of the mowable area.",
      value: inputs.terrain,
      options: [{ value: "flat", label: "FLAT" }, { value: "rolling", label: "ROLLING" }, { value: "steep", label: "STEEP" }],
      onChange: (v) => set("terrain", v),
      accent
    }
  ), /* @__PURE__ */ React.createElement(
    ProdSeg,
    {
      t,
      label: "HOW OFTEN IT'S MOWED NOW",
      hint: "Your current mowing rhythm, not the one you wish you had.",
      value: inputs.frequency,
      options: [{ value: "weekly", label: "WEEKLY" }, { value: "fortnightly", label: "FORTNIGHTLY" }, { value: "monthly", label: "MONTHLY" }, { value: "seasonal", label: "SEASONAL" }],
      onChange: (v) => set("frequency", v),
      accent
    }
  )), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: PROD_MONO, color: t.textFaint, fontWeight: 500, marginBottom: 2 } }, "YOUR POSTCODE"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: t.textFaint, marginBottom: 10, lineHeight: 1.4, fontStyle: "italic", opacity: 0.85 } }, "4 digits \u2014 determines local service tier."), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: inputs.postcode,
      onChange: (e) => set("postcode", e.target.value.replace(/\D/g, "").slice(0, 4)),
      inputMode: "numeric",
      style: {
        width: 160,
        padding: "10px 12px",
        background: t.surface,
        border: `1px solid ${t.line}`,
        color: t.text,
        fontSize: 16,
        fontFamily: PROD_MONO,
        outline: "none",
        letterSpacing: "0.08em"
      }
    }
  ))), /* @__PURE__ */ React.createElement("div", { style: { margin: "24px", padding: "28px 24px", border: `1px solid ${accent}`, background: `${accent}10`, position: "relative" } }, /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: -1, left: -1, padding: "4px 10px", background: accent, color: "#0E120F", fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", fontFamily: PROD_MONO } }, "CHEAPEST"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 24, alignItems: "baseline", marginTop: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: "1 1 240px", minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontFamily: PROD_MONO, color: t.textFaint, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 } }, "OPTIMAL_PATH"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 24, fontWeight: 700, color: t.text, marginBottom: 4, lineHeight: 1.1 } }, cheap.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: t.textDim, fontFamily: PROD_MONO } }, "over 8 years \xB7 ", Math.round(cheap.hours), " hrs/yr \xB7 saves ", fmtMoney(savings), " vs costliest path")), /* @__PURE__ */ React.createElement("div", { style: { flex: "0 0 auto" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontFamily: PROD_MONO, color: t.textFaint, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 } }, "TOTAL_COST"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "clamp(40px, 6vw, 60px)", fontWeight: 700, color: accent, lineHeight: 1, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", fontFamily: PROD_MONO } }, fmtMoney(cheapAnim))))), /* @__PURE__ */ React.createElement("div", { style: { margin: "0 24px 24px", padding: "24px", border: `1px solid ${t.line}`, background: t.surfaceDim } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: PROD_MONO, color: t.textFaint, fontWeight: 600 } }, "FIG.01 / CUMULATIVE COST \xB7 YEARS 0\u20138"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 14, flexWrap: "wrap" } }, all.map((sc) => {
    const isRef = sc.key === referenceKey;
    return /* @__PURE__ */ React.createElement("div", { key: sc.key, style: { display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: PROD_MONO, color: sc.key === cheap.key ? t.text : t.textDim, textTransform: "uppercase", letterSpacing: "0.05em", opacity: isRef ? 0.45 : 1 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 10, height: 2, background: colors[sc.key] } }), sc.key === "aa" ? "AUTOACRE" : sc.key.toUpperCase(), isRef && /* @__PURE__ */ React.createElement("span", { style: { marginLeft: 4, fontSize: 9, letterSpacing: "0.14em", color: t.textFaint } }, "\xB7 REF"));
  }))), /* @__PURE__ */ React.createElement(ProdChart, { scenarios: all, cheapKey: cheap.key, referenceKey, accent, t })), /* @__PURE__ */ React.createElement("div", { style: { margin: "0 24px 24px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: PROD_MONO, color: t.textFaint, fontWeight: 600, marginBottom: 12 } }, "FIG.02 / PATH COMPARISON \xB7 ALL METRICS"), /* @__PURE__ */ React.createElement("div", { style: { overflowX: "auto", border: `1px solid ${t.line}`, background: t.surface } }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontFamily: PROD_MONO, fontSize: 13 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: t.surfaceDim } }, /* @__PURE__ */ React.createElement("th", { style: { padding: "10px 14px", textAlign: "left", fontSize: 10, letterSpacing: "0.18em", fontWeight: 600, color: t.textFaint, textTransform: "uppercase" } }, "PATH"), /* @__PURE__ */ React.createElement("th", { style: { padding: "10px 14px", textAlign: "right", fontSize: 10, letterSpacing: "0.18em", fontWeight: 600, color: t.textFaint, textTransform: "uppercase" } }, "CAPITAL"), /* @__PURE__ */ React.createElement("th", { style: { padding: "10px 14px", textAlign: "right", fontSize: 10, letterSpacing: "0.18em", fontWeight: 600, color: t.textFaint, textTransform: "uppercase" } }, "YR 1"), /* @__PURE__ */ React.createElement("th", { style: { padding: "10px 14px", textAlign: "right", fontSize: 10, letterSpacing: "0.18em", fontWeight: 600, color: t.textFaint, textTransform: "uppercase" } }, "8-YR"), /* @__PURE__ */ React.createElement("th", { style: { padding: "10px 14px", textAlign: "right", fontSize: 10, letterSpacing: "0.18em", fontWeight: 600, color: t.textFaint, textTransform: "uppercase" } }, "HRS/YR"), /* @__PURE__ */ React.createElement("th", { style: { padding: "10px 14px", textAlign: "right", fontSize: 10, letterSpacing: "0.18em", fontWeight: 600, color: t.textFaint, textTransform: "uppercase" } }, "RESIDUAL"))), /* @__PURE__ */ React.createElement("tbody", null, all.map((sc) => {
    const isCheap = sc.key === cheap.key;
    const isRef = sc.key === referenceKey;
    const blur = !unlocked && !isCheap;
    const cell = { padding: "12px 14px", fontSize: 13, fontVariantNumeric: "tabular-nums" };
    const subCell = { padding: "8px 14px 10px", fontSize: 12, fontVariantNumeric: "tabular-nums", color: t.textDim, fontWeight: 400 };
    const rowOpacity = isRef ? 0.5 : 1;
    return /* @__PURE__ */ React.createElement(React.Fragment, { key: sc.key }, /* @__PURE__ */ React.createElement("tr", { style: { borderTop: `1px solid ${t.lineSoft}`, background: isCheap ? `${accent}12` : "transparent", opacity: rowOpacity } }, /* @__PURE__ */ React.createElement("td", { style: { ...cell, color: isCheap ? accent : t.text, fontWeight: isCheap ? 700 : 500 } }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-block", width: 8, height: 8, background: colors[sc.key], marginRight: 8, verticalAlign: "middle" } }), sc.label, isRef && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: t.textFaint, marginTop: 2, letterSpacing: "0.06em", fontWeight: 400, textTransform: "uppercase" } }, "Reference only \u2014 not aligned with your current approach")), /* @__PURE__ */ React.createElement("td", { style: { ...cell, textAlign: "right", filter: blur ? "blur(5px)" : "none", color: t.text } }, fmtMoney(sc.capital)), /* @__PURE__ */ React.createElement("td", { style: { ...cell, textAlign: "right", filter: blur ? "blur(5px)" : "none", color: t.text } }, fmtMoney(sc.y1)), /* @__PURE__ */ React.createElement("td", { style: { ...cell, textAlign: "right", color: isCheap ? accent : t.text, fontWeight: isCheap ? 700 : 500, filter: blur && !isCheap ? "blur(5px)" : "none" } }, fmtMoney(sc.total8)), /* @__PURE__ */ React.createElement("td", { style: { ...cell, textAlign: "right", filter: blur ? "blur(5px)" : "none", color: t.text } }, Math.round(sc.hours)), /* @__PURE__ */ React.createElement("td", { style: { ...cell, textAlign: "right", filter: blur ? "blur(5px)" : "none", color: t.text } }, sc.residual > 0 ? fmtMoney(sc.residual) : "\u2014")), sc.key === "aa" && /* @__PURE__ */ React.createElement("tr", { style: { borderTop: `1px dashed ${t.lineSoft}`, background: isCheap ? `${accent}08` : "transparent" } }, /* @__PURE__ */ React.createElement("td", { style: { ...subCell, paddingLeft: 38 } }, "\u21B3 MANAGE PREMIUM", /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: t.textFaint, marginTop: 2, letterSpacing: "0.04em", fontWeight: 400, textTransform: "none" } }, "AutoAcre management fee component")), /* @__PURE__ */ React.createElement("td", { style: { ...subCell, textAlign: "right", color: t.textFaint } }, "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { ...subCell, textAlign: "right", filter: blur ? "blur(5px)" : "none" } }, fmtMoney(s.aa.opex)), /* @__PURE__ */ React.createElement("td", { style: { ...subCell, textAlign: "right", filter: blur ? "blur(5px)" : "none" } }, fmtMoney(s.aa.opex * 8)), /* @__PURE__ */ React.createElement("td", { style: { ...subCell, textAlign: "right", color: t.textFaint } }, "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { ...subCell, textAlign: "right", color: t.textFaint } }, "\u2014")));
  }))))), !unlocked && /* @__PURE__ */ React.createElement("div", { style: { margin: "0 24px 24px", padding: "24px", border: `1px dashed ${accent}`, background: `${accent}0A` } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: PROD_MONO, color: accent, fontWeight: 700, marginBottom: 10 } }, "\u25FC FULL DATASET LOCKED"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, fontWeight: 600, marginBottom: 6, color: t.text, lineHeight: 1.3, maxWidth: 560 } }, "Year-by-year cashflow, capital schedules, residual recovery \u2014 and a personalised PDF."), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: t.textDim, marginBottom: 18, fontFamily: PROD_MONO } }, "// EMAIL_REQUIRED \xB7 NO_PHONE \xB7 NO_SPAM"), !showLeadForm ? /* @__PURE__ */ React.createElement("button", { onClick: () => setShowLeadForm(true), style: { padding: "12px 20px", background: accent, color: "#0E120F", border: "none", fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", fontFamily: PROD_MONO, cursor: "pointer", textTransform: "uppercase" } }, "UNLOCK FULL BREAKDOWN \u2192") : /* @__PURE__ */ React.createElement(
    "form",
    {
      name: "calc-leads",
      method: "POST",
      "data-netlify": "true",
      "netlify-honeypot": "bot-field",
      onSubmit: handleLeadSubmit,
      style: { display: "flex", flexDirection: "column", gap: 8, maxWidth: 380 }
    },
    /* @__PURE__ */ React.createElement("input", { type: "hidden", name: "form-name", value: "calc-leads" }),
    /* @__PURE__ */ React.createElement("p", { style: { display: "none" } }, /* @__PURE__ */ React.createElement("label", null, "Don't fill: ", /* @__PURE__ */ React.createElement("input", { name: "bot-field" }))),
    /* @__PURE__ */ React.createElement("input", { type: "hidden", name: "lead-tier", value: `tier${tier}` }),
    /* @__PURE__ */ React.createElement("input", { type: "hidden", name: "acres", value: inputs.acres }),
    /* @__PURE__ */ React.createElement("input", { type: "hidden", name: "postcode", value: inputs.postcode }),
    /* @__PURE__ */ React.createElement("input", { type: "hidden", name: "terrain", value: inputs.terrain }),
    /* @__PURE__ */ React.createElement("input", { type: "hidden", name: "frequency", value: inputs.frequency }),
    /* @__PURE__ */ React.createElement("input", { type: "hidden", name: "cheapest-path", value: cheap.label }),
    /* @__PURE__ */ React.createElement("input", { type: "hidden", name: "cheapest-total", value: Math.round(cheap.total8) }),
    /* @__PURE__ */ React.createElement("input", { name: "name", required: true, placeholder: "NAME", style: { padding: "10px 12px", background: t.surface, border: `1px solid ${t.line}`, color: t.text, fontSize: 13, fontFamily: PROD_MONO, outline: "none", letterSpacing: "0.08em" } }),
    /* @__PURE__ */ React.createElement("input", { name: "email", type: "email", required: true, placeholder: "EMAIL", style: { padding: "10px 12px", background: t.surface, border: `1px solid ${t.line}`, color: t.text, fontSize: 13, fontFamily: PROD_MONO, outline: "none", letterSpacing: "0.08em" } }),
    /* @__PURE__ */ React.createElement("label", { style: { display: "flex", gap: 8, alignItems: "flex-start", fontSize: 11, color: t.textDim, fontFamily: PROD_MONO, lineHeight: 1.5, letterSpacing: "0.04em", marginTop: 4 } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", name: "consent", required: true, style: { accentColor: accent, marginTop: 2 } }), /* @__PURE__ */ React.createElement("span", null, "I CONSENT TO AUTOACRE EMAILING ME ABOUT SERVICE OR PARTNER REFERRALS.")),
    /* @__PURE__ */ React.createElement("button", { type: "submit", style: { padding: "12px 20px", background: accent, color: "#0E120F", border: "none", fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", fontFamily: PROD_MONO, cursor: "pointer", textTransform: "uppercase", alignSelf: "flex-start", marginTop: 6 } }, "EXEC \u2192")
  )), unlocked && /* @__PURE__ */ React.createElement("div", { style: { margin: "0 24px 16px", padding: "28px 24px", border: `1px solid ${t.line}`, background: t.surface, position: "relative" } }, /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: -1, left: -1, padding: "4px 10px", background: accent, color: "#0E120F", fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", fontFamily: PROD_MONO } }, "FINDINGS"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 20, fontWeight: 700, color: t.text, marginTop: 12, lineHeight: 1.25, letterSpacing: "-0.01em", maxWidth: 720 } }, isDiy ? /* @__PURE__ */ React.createElement(React.Fragment, null, "Over 8 years, ", /* @__PURE__ */ React.createElement("span", { style: { color: accent } }, cheap.label), " saves you ", /* @__PURE__ */ React.createElement("span", { style: { color: accent } }, fmtMoney(savingsVsCurrent)), " in time and frees up ", /* @__PURE__ */ React.createElement("span", { style: { color: accent } }, diyHoursPerYear), " hours annually.") : /* @__PURE__ */ React.createElement(React.Fragment, null, "Over 8 years, ", /* @__PURE__ */ React.createElement("span", { style: { color: accent } }, cheap.label), " saves you ", /* @__PURE__ */ React.createElement("span", { style: { color: accent } }, fmtMoney(savingsVsCurrent)), " compared to your current contractor.")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 1, marginTop: 20, background: t.line, border: `1px solid ${t.line}` } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "16px 18px", background: t.bg } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: PROD_MONO, color: t.textFaint, fontWeight: 500, marginBottom: 6 } }, isDiy ? "TIME VALUE SAVED \xB7 8 YRS" : "VS CONTRACTOR \xB7 8 YRS"), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: PROD_MONO, fontSize: 26, fontWeight: 700, color: savingsVsCurrent > 0 ? accent : t.text, fontVariantNumeric: "tabular-nums", lineHeight: 1.05 } }, fmtMoney(savingsVsCurrent)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: t.textDim, marginTop: 4, letterSpacing: "0.04em" } }, isDiy ? "in time value" : "vs current contractor")), /* @__PURE__ */ React.createElement("div", { style: { padding: "16px 18px", background: t.bg } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: PROD_MONO, color: t.textFaint, fontWeight: 500, marginBottom: 6 } }, isDiy ? "HOURS FREED / YEAR" : "CONTRACTOR SPEND \xB7 8 YRS"), isDiy ? /* @__PURE__ */ React.createElement("div", { style: { fontFamily: PROD_MONO, fontSize: 26, fontWeight: 700, color: hoursFreedDiy > 0 ? accent : t.text, fontVariantNumeric: "tabular-nums", lineHeight: 1.05 } }, hoursFreedDiy, " hrs") : /* @__PURE__ */ React.createElement("div", { style: { fontFamily: PROD_MONO, fontSize: 26, fontWeight: 700, color: t.text, fontVariantNumeric: "tabular-nums", lineHeight: 1.05 } }, fmtMoney(s.contractor.total8)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: t.textDim, marginTop: 4, letterSpacing: "0.04em" } }, isDiy ? "after ~25 hrs/yr oversight" : "cumulative at year 8")), /* @__PURE__ */ React.createElement("div", { style: { padding: "16px 18px", background: t.bg } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: PROD_MONO, color: t.textFaint, fontWeight: 500, marginBottom: 6 } }, "RESIDUAL VALUE \xB7 YR 8"), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: PROD_MONO, fontSize: 26, fontWeight: 700, color: cheap.residual > 0 ? accent : t.text, fontVariantNumeric: "tabular-nums", lineHeight: 1.05 } }, fmtMoney(cheap.residual)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: t.textDim, marginTop: 4, letterSpacing: "0.04em" } }, cheap.residual > 0 ? "optimal path" : "end-of-life"))), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 14, color: t.textDim, lineHeight: 1.6, marginTop: 18, maxWidth: 720 } }, cheap.key !== "aa" ? isDiy ? `At ${inputs.acres.toFixed(1)} acres, your current DIY setup remains the cheapest option over 8 years on the numbers \u2014 but it costs you ${diyHoursPerYear} hours a year.` : `At ${inputs.acres.toFixed(1)} acres and your current contractor spend, your contractor remains the cheapest option over 8 years.` : nearEqual ? isDiy ? `At ${inputs.acres.toFixed(1)} acres, ${cheap.label.toLowerCase()} costs roughly the same as your current approach over 8 years \u2014 but eliminates the time commitment entirely.` : `At ${inputs.acres.toFixed(1)} acres, ${cheap.label.toLowerCase()} costs roughly the same as your current approach over 8 years \u2014 but eliminates the scheduling hassle entirely.` : isDiy ? paybackYears ? `At ${inputs.acres.toFixed(1)} acres, ${cheap.label.toLowerCase()} pays back in approximately ${paybackYears} ${paybackYears === 1 ? "year" : "years"} and returns ${hoursFreedDiy} hours to you every year.` : `At ${inputs.acres.toFixed(1)} acres, ${cheap.label.toLowerCase()} is the lowest-cost option over the 8-year window and returns ${hoursFreedDiy} hours to you every year.` : paybackYears ? `At ${inputs.acres.toFixed(1)} acres and your current contractor spend, ${cheap.label.toLowerCase()} becomes the lowest-cost option from year ${paybackYears} onwards.` : `At ${inputs.acres.toFixed(1)} acres and your current contractor spend, ${cheap.label.toLowerCase()} is the lowest-cost option over the 8-year window.`), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: t.textFaint, marginTop: 12, fontStyle: "italic", lineHeight: 1.5 } }, "Based on your inputs. Figures are indicative \u2014 actual results depend on terrain, growth rate and usage.")), unlocked && /* @__PURE__ */ React.createElement("div", { style: { margin: "0 24px 24px", padding: "28px 24px", border: `1px solid ${accent}`, background: `${accent}14`, position: "relative" } }, /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: -1, left: -1, padding: "4px 10px", background: accent, color: "#0E120F", fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", fontFamily: PROD_MONO } }, "NEXT_STEP"), submitted && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontFamily: PROD_MONO, color: accent, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 8, marginBottom: 6 } }, "// THANKS \u2014 DETAILS RECEIVED"), tier === 1 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: t.text, marginTop: 12, lineHeight: 1.2, letterSpacing: "-0.01em", maxWidth: 600 } }, "You're in our direct service area."), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 14, color: t.textDim, lineHeight: 1.55, marginTop: 8, maxWidth: 600 } }, "Want a real quote against these numbers? Short form, personalised proposal \u2014 no phone tag."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(
    "a",
    {
      href: `/quote?acres=${inputs.acres}&postcode=${inputs.postcode}&terrain=${inputs.terrain}`,
      style: { padding: "12px 20px", background: t.text, color: t.bg, textDecoration: "none", fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", fontFamily: PROD_MONO, textTransform: "uppercase" }
    },
    "GET A QUOTE \u2192"
  ), /* @__PURE__ */ React.createElement("button", { onClick: () => window.print(), style: { padding: "12px 20px", background: "transparent", color: t.text, border: `1px solid ${t.line}`, fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", fontFamily: PROD_MONO, cursor: "pointer", textTransform: "uppercase" } }, "PRINT / PDF"))), tier === 2 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: t.text, marginTop: 12, lineHeight: 1.2, letterSpacing: "-0.01em", maxWidth: 600 } }, "You're in our 2026 expansion area."), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 14, color: t.textDim, lineHeight: 1.55, marginTop: 8, maxWidth: 600 } }, "We've added you to the waitlist \u2014 you'll be first-served when service launches in your postcode.")), tier === 3 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: t.text, marginTop: 12, lineHeight: 1.2, letterSpacing: "-0.01em", maxWidth: 600 } }, "We don't service this postcode directly yet."), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 14, color: t.textDim, lineHeight: 1.55, marginTop: 8, maxWidth: 600 } }, "We'll be in touch when AutoAcre or a vetted partner is available in your area. In the meantime, the buyer's guide compares specific robot mowers head-to-head."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(
    "a",
    {
      href: "/commercial-robotic-mower-buyers-guide-australia.html",
      style: { padding: "12px 20px", background: t.text, color: t.bg, textDecoration: "none", fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", fontFamily: PROD_MONO, textTransform: "uppercase" }
    },
    "BUYER'S GUIDE \u2192"
  )))), /* @__PURE__ */ React.createElement("div", { style: { padding: "16px 24px 32px", borderTop: `1px solid ${t.lineSoft}`, fontSize: 11, color: t.textFaint, fontFamily: PROD_MONO, letterSpacing: "0.05em", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 } }, /* @__PURE__ */ React.createElement("span", null, "AUTOACRE.COM.AU \xB7 NORTHERN_RIVERS_NSW \xB7 METHODOLOGY_v4"), /* @__PURE__ */ React.createElement("button", { onClick: () => setMethodOpen(true), style: { background: "none", border: "none", color: accent, fontFamily: PROD_MONO, fontSize: 11, letterSpacing: "0.1em", cursor: "pointer", textTransform: "uppercase", textDecoration: "underline" } }, "VIEW METHODOLOGY")), /* @__PURE__ */ React.createElement(MethodologyDrawer, { open: methodOpen, onClose: () => setMethodOpen(false), t, accent, inputs, s }));
}
window.ProductionCalculator = ProductionCalculator;
