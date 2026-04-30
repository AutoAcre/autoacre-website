// Shared calculator math + helpers — lifted directly from calculator-v4.html
// (canonical pricing per business-model-update.md)

const TIER_1 = ['2477','2478','2479','2481','2482','2483'];
const TIER_2 = ['2480','2470','2464','2484','2487'];
function getTier(postcode) {
  if (TIER_1.includes(postcode)) return 1;
  if (TIER_2.includes(postcode)) return 2;
  return 3;
}

const MGMT_FEE = { 2.5:165, 3:195, 4:260, 5:330, 6:390, 7:455, 8:520, 9:585, 10:650 };
function mgmtFee(acres) {
  const keys = Object.keys(MGMT_FEE).map(Number).sort((a,b)=>a-b);
  if (acres <= keys[0]) return MGMT_FEE[keys[0]];
  if (acres >= keys[keys.length-1]) return MGMT_FEE[keys[keys.length-1]];
  for (let i=0; i<keys.length-1; i++) {
    if (acres >= keys[i] && acres <= keys[i+1]) {
      const f = (acres - keys[i]) / (keys[i+1] - keys[i]);
      return MGMT_FEE[keys[i]] + f * (MGMT_FEE[keys[i+1]] - MGMT_FEE[keys[i]]);
    }
  }
}

const FREQ_VISITS = { weekly: 52, fortnightly: 26, monthly: 12, seasonal: 4 };
const HOURS_PER_ACRE = { flat: 0.67, rolling: 1.0, steep: 1.33 };

function calcScenarios({ acres, terrain, frequency, hourlyValue }) {
  const visits = FREQ_VISITS[frequency];

  const diyHoursPerYear = acres * HOURS_PER_ACRE[terrain] * visits;
  const diyCapital = 9000;
  const diyOpex = (diyHoursPerYear * hourlyValue) + 550;
  const diyResidual = 0;
  const diyY1 = diyCapital + diyOpex;
  const diy8yr = diyCapital + (diyOpex * 8) - diyResidual;

  const contractorAnnual = 250 * acres * 12 * (visits / 26);
  const contractorY1 = contractorAnnual;
  const contractor8yr = contractorAnnual * 8;

  const isMammotion = acres < 5;
  const byoMowerPrice = isMammotion ? 16000 : 54000;
  const byoCapital = byoMowerPrice + 2000;
  const byoSupportHours = isMammotion ? acres * 10 : acres * 5;
  const byoOpex = (byoSupportHours * hourlyValue) + (byoMowerPrice * 0.05);
  const byoResidual = byoMowerPrice * 0.20;
  const byoY1 = byoCapital + byoOpex;
  const byo8yr = byoCapital + (byoOpex * 8) - byoResidual;

  const aaCapital = 33490;
  const aaMonthly = mgmtFee(acres);
  const aaOpex = aaMonthly * 12;
  const aaResidual = 6700;
  const aaY1 = aaCapital + aaOpex;
  const aa8yr = aaCapital + (aaOpex * 8) - aaResidual;

  return {
    diy:        { key:'diy',        label:'DIY zero-turn',        capital: diyCapital,  y1: diyY1,        total8: diy8yr,        hours: diyHoursPerYear, residual: diyResidual,    opex: diyOpex },
    contractor: { key:'contractor', label:'Contractor',           capital: 0,           y1: contractorY1, total8: contractor8yr, hours: 0,               residual: 0,              opex: contractorAnnual },
    byo:        { key:'byo',        label: isMammotion ? 'Buy your own — Mammotion' : 'Buy your own — Husqvarna CEORA', capital: byoCapital, y1: byoY1, total8: byo8yr, hours: byoSupportHours, residual: byoResidual, opex: byoOpex, isMammotion },
    aa:         { key:'aa',         label:'Buy + AutoAcre Manage', capital: aaCapital,   y1: aaY1,         total8: aa8yr,         hours: 0,               residual: aaResidual,     opex: aaOpex,  monthly: aaMonthly }
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
  return [s.diy, s.contractor, s.byo, s.aa];
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
  hourlyValue: 35
};

Object.assign(window, {
  calcScenarios, getTier, fmtMoney, fmtMoneyShort, fmtHours,
  scenariosArray, cheapest, lowestTime, useAnimatedNumber,
  DEFAULT_INPUTS, FREQ_VISITS, HOURS_PER_ACRE
});
