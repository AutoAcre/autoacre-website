// Shared calculator math + helpers.
//
// No AutoAcre pricing lives in this file. It is served publicly, so the fee
// table and the system price were readable by anyone who opened it. The
// comparison covers the options a buyer can price themselves (DIY zero-turn
// and a contractor). What AutoAcre charges is quoted after a site assessment.

const TIER_1 = ['2477','2478','2479','2481','2482','2483'];
const TIER_2 = ['2480','2470','2464','2484','2487'];
function getTier(postcode) {
  if (TIER_1.includes(postcode)) return 1;
  if (TIER_2.includes(postcode)) return 2;
  return 3;
}

const FREQ_VISITS = { weekly: 52, fortnightly: 26, monthly: 12, seasonal: 4 };
const HOURS_PER_ACRE = { flat: 0.67, rolling: 1.0, steep: 1.33 };

function calcScenarios({ acres, terrain, frequency, contractorMonthly }) {
  const visits = FREQ_VISITS[frequency];
  // $/hr value of the user's time — fixed in the background. Used to weight
  // DIY zero-turn and BYO self-support hours into a dollar opex line.
  const hourlyValue = 50;

  const diyHoursPerYear = acres * HOURS_PER_ACRE[terrain] * visits;
  const diyCapital = 9000;
  const diyOpex = (diyHoursPerYear * hourlyValue) + 550;
  const diyResidual = 0;
  const diyY1 = diyCapital + diyOpex;
  const diy8yr = diyCapital + (diyOpex * 8) - diyResidual;

  // Contractor cost is now driven directly by the user's stated monthly bill
  // — their actual reality, not a derived $/acre/month formula. The previous
  // formula (250 * acres * 12 * visits/26) is preserved as a fallback default
  // when contractorMonthly is missing, so first-render still yields a sensible
  // number even before the slider is touched.
  const contractorAnnualValue = (contractorMonthly ?? (250 * acres * (visits / 26))) * 12;
  const contractorY1 = contractorAnnualValue;
  const contractor8yr = contractorAnnualValue * 8;

  const isMammotion = acres < 5;
  const byoMowerPrice = isMammotion ? 16000 : 54000;
  const byoCapital = byoMowerPrice + 2000;
  const byoSupportHours = isMammotion ? acres * 10 : acres * 5;
  const byoOpex = (byoSupportHours * hourlyValue) + (byoMowerPrice * 0.05);
  const byoResidual = byoMowerPrice * 0.20;
  const byoY1 = byoCapital + byoOpex;
  const byo8yr = byoCapital + (byoOpex * 8) - byoResidual;

  return {
    diy:        { key:'diy',        label:'DIY zero-turn',        capital: diyCapital,  y1: diyY1,        total8: diy8yr,        hours: diyHoursPerYear, residual: diyResidual,    opex: diyOpex },
    contractor: { key:'contractor', label:'Contractor',           capital: 0,           y1: contractorY1, total8: contractor8yr, hours: 0,               residual: 0,              opex: contractorAnnualValue },
    byo:        { key:'byo',        label:'Buy your own RTK-LiDAR autonomous mowing system', capital: byoCapital, y1: byoY1, total8: byo8yr, hours: byoSupportHours, residual: byoResidual, opex: byoOpex, isMammotion },
    // Kept so the view can still reference it, with no figures in it. Our fee
    // and system price are quoted after a site assessment, not published.
    aa:         { key:'aa',         label:'Buy + AutoAcre Manage', capital: null, y1: null, total8: null, hours: 0, residual: null, opex: null, monthly: null, quoted: true }
  };
}

function fmtMoney(n) {
  if (n === 0 || n == null) return '—';
  return '$' + Math.round(n).toLocaleString('en-AU');
}
function fmtMoneyShort(n) {
  if (n == null) return '—';
  if (n >= 1000) return '$' + (n/1000).toFixed(n >= 10000 ? 0 : 1) + 'k';
  return '$' + Math.round(n);
}
function fmtHours(n) { return Math.round(n) + ' hrs'; }

function scenariosArray(s) {
  // The AutoAcre scenario is not shown: our fee is quoted after a site
  // assessment, not published. s.byo stays computed for backward compat but
  // is excluded, as before.
  return [s.diy, s.contractor];
}
function cheapest(s) {
  return scenariosArray(s).reduce((a,b)=>a.total8 < b.total8 ? a : b);
}
function lowestTime(s) {
  return scenariosArray(s).reduce((a,b)=>a.hours < b.hours ? a : b);
}

// useAnimatedNumber — smooth tween between values (for live updates)
function useAnimatedNumber(value, ms = 400) {
  const [display, setDisplay] = React.useState(value);
  const fromRef = React.useRef(value);
  const startRef = React.useRef(0);
  const rafRef = React.useRef(0);
  React.useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    fromRef.current = display;
    startRef.current = performance.now();
    const target = value;
    const tick = (now) => {
      const t = Math.min(1, (now - startRef.current) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = fromRef.current + (target - fromRef.current) * eased;
      setDisplay(v);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);
  return display;
}

// shared default inputs
const DEFAULT_INPUTS = {
  acres: 5,
  postcode: '2478',
  terrain: 'rolling',
  frequency: 'fortnightly',
  // contractorMonthly is now derived from the contractor/DIY toggle below
  // (see deriveCurrentMonthlySpend in direction-production.jsx). Kept here
  // as a fallback for any caller that bypasses the production calc UI.
  contractorMonthly: 1250,

  // Contractor/DIY toggle — replaces the single "current monthly spend" slider.
  // mowMode 'contractor' → ctrMonthlyInvoice drives cost (× 12 = annual).
  // mowMode 'diy'        → diy* fields drive cost.
  mowMode: 'contractor',
  ctrMonthlyInvoice: 1200,  // $ user typically pays their contractor per month
  diyHourlyValue: 60,       // $/hr the user values their own time at
  diyHoursPerMonth: 10      // hrs/month they currently spend on the mower
};

Object.assign(window, {
  calcScenarios, getTier, fmtMoney, fmtMoneyShort, fmtHours,
  scenariosArray, cheapest, lowestTime, useAnimatedNumber,
  DEFAULT_INPUTS, FREQ_VISITS, HOURS_PER_ACRE
});
