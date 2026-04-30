// Production wrapper for the Terminal Console calculator.
// Adds:
//  - Real Netlify form on the lead capture
//  - Methodology drawer (slide-out panel with assumptions)
//  - Tier-based CTAs after unlock (quote / waitlist / referral)
//  - Sticky result strip while scrolling
// Reuses ConsoleTerminal-style components, but rebuilt here as a single
// production-quality screen.

const PROD_MONO = '"JetBrains Mono", ui-monospace, monospace';
const PROD_SANS = '"Inter", -apple-system, BlinkMacSystemFont, sans-serif';

function prodTheme(mode) {
  if (mode === 'light') {
    return {
      bg:'#F6F5EE', surface:'#FFFFFF', surfaceDim:'#EFEEE5',
      text:'#1A1F18', textDim:'#6E7269', textFaint:'#9DA197',
      line:'rgba(26,31,24,0.10)', lineSoft:'rgba(26,31,24,0.06)'
    };
  }
  return {
    bg:'#0E120F', surface:'rgba(232,234,227,0.03)', surfaceDim:'rgba(232,234,227,0.02)',
    text:'#E8EAE3', textDim:'#9CA395', textFaint:'#7A8579',
    line:'rgba(232,234,227,0.12)', lineSoft:'rgba(232,234,227,0.06)'
  };
}

function MethodologyDrawer({ open, onClose, t, accent, inputs, s }) {
  return (
    <>
      <div onClick={onClose} style={{
        position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
        opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
        transition:'opacity 0.25s', zIndex:90
      }}/>
      <div style={{
        position:'fixed', top:0, right:0, bottom:0, width:'min(560px, 100vw)',
        background:t.bg, borderLeft:`1px solid ${t.line}`, color:t.text,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition:'transform 0.3s cubic-bezier(0.2,0.8,0.2,1)',
        zIndex:100, overflowY:'auto', fontFamily:PROD_SANS
      }}>
        <div style={{position:'sticky', top:0, padding:'18px 24px', borderBottom:`1px solid ${t.line}`, background:t.bg, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div style={{fontFamily:PROD_MONO, fontSize:11, letterSpacing:'0.18em', textTransform:'uppercase', color:accent, fontWeight:700}}>◼ METHODOLOGY</div>
          <button onClick={onClose} style={{background:'none', border:`1px solid ${t.line}`, color:t.text, padding:'6px 12px', fontFamily:PROD_MONO, fontSize:11, letterSpacing:'0.1em', cursor:'pointer', textTransform:'uppercase'}}>CLOSE ✕</button>
        </div>
        <div style={{padding:'32px 24px'}}>
          <h2 style={{fontSize:24, fontWeight:700, margin:'0 0 6px', letterSpacing:'-0.01em'}}>How we got these numbers</h2>
          <p style={{fontSize:14, color:t.textDim, lineHeight:1.55, marginTop:0}}>Anchored to AutoAcre's published methodology v4. Every assumption is shown below — change anything in the calculator and watch it ripple through.</p>

          <Section title="Assumed inputs" t={t} accent={accent}>
            <Kv label="Acres" v={`${inputs.acres.toFixed(1)}`} t={t}/>
            <Kv label="Terrain" v={inputs.terrain} t={t}/>
            <Kv label="Frequency" v={`${inputs.frequency} (${FREQ_VISITS[inputs.frequency]} visits/yr)`} t={t}/>
            <Kv label="Hours/acre/visit" v={HOURS_PER_ACRE[inputs.terrain].toFixed(2)} t={t}/>
            <Kv label="Your time" v={`$${inputs.hourlyValue}/hr`} t={t}/>
          </Section>

          <Section title="DIY zero-turn" t={t} accent={accent}>
            <Kv label="Capital" v={fmtMoney(s.diy.capital)} t={t}/>
            <Kv label="Annual fuel/maintenance" v="$550" t={t}/>
            <Kv label="Hours/year" v={`${Math.round(s.diy.hours)}`} t={t}/>
            <Kv label="Residual at Y8" v="$0 (assumes end-of-life)" t={t}/>
          </Section>

          <Section title="Contractor" t={t} accent={accent}>
            <Kv label="Rate basis" v="$250/visit/acre at fortnightly cadence" t={t}/>
            <Kv label="Annual" v={fmtMoney(s.contractor.opex)} t={t}/>
            <Kv label="Capital" v="$0" t={t}/>
          </Section>

          <Section title="Buy your own robot" t={t} accent={accent}>
            <Kv label="Mower" v={s.byo.isMammotion ? 'Mammotion ($16k, &lt;5 acres)' : 'Husqvarna CEORA ($54k, ≥5 acres)'} t={t}/>
            <Kv label="Install/setup" v="$2,000" t={t}/>
            <Kv label="Self-support hrs/yr" v={`${Math.round(s.byo.hours)} hrs`} t={t}/>
            <Kv label="Failure buffer" v="5% of mower price/yr" t={t}/>
            <Kv label="Residual at Y8" v={`${fmtMoney(s.byo.residual)} (20% of mower)`} t={t}/>
          </Section>

          <Section title="Buy + AutoAcre Manage" t={t} accent={accent}>
            <Kv label="Capital (mower + install)" v={fmtMoney(s.aa.capital)} t={t}/>
            <Kv label="Monthly fee" v={`${fmtMoney(s.aa.monthly)}/mo (acreage-tiered)`} t={t}/>
            <Kv label="Your time" v="0 hrs (managed)" t={t}/>
            <Kv label="Residual at Y8" v="$6,700 (locked buy-back)" t={t}/>
          </Section>

          <div style={{marginTop:24, padding:16, border:`1px dashed ${t.line}`, fontSize:12, color:t.textDim, lineHeight:1.6, fontFamily:PROD_MONO, letterSpacing:'0.04em'}}>
            // 8-YR_FORMULA: capital + (annual_opex × 8) − residual_at_year_8<br/>
            // YR-1_CASH: capital + annual_opex_year_1<br/>
            // No discounting applied. Real numbers vary ± by property.
          </div>
        </div>
      </div>
    </>
  );
}

function Section({ title, children, t, accent }) {
  return (
    <div style={{marginTop:28}}>
      <div style={{fontSize:11, fontFamily:PROD_MONO, color:accent, letterSpacing:'0.18em', textTransform:'uppercase', fontWeight:700, marginBottom:10, paddingBottom:8, borderBottom:`1px solid ${t.line}`}}>{title}</div>
      {children}
    </div>
  );
}
function Kv({ label, v, t }) {
  return (
    <div style={{display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:`1px solid ${t.lineSoft}`, gap:16, fontSize:13, fontFamily:PROD_MONO}}>
      <span style={{color:t.textDim, textTransform:'uppercase', letterSpacing:'0.06em', fontSize:11}}>{label}</span>
      <span style={{color:t.text, textAlign:'right'}} dangerouslySetInnerHTML={{__html: v}}/>
    </div>
  );
}

function ProdSlider({ label, value, min, max, step, format, onChange, accent, t }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{padding:'14px 0'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
        <div style={{fontSize:11, letterSpacing:'0.18em', textTransform:'uppercase', fontFamily:PROD_MONO, color:t.textFaint, fontWeight:500}}>{label}</div>
        <div style={{fontFamily:PROD_MONO, fontSize:18, fontWeight:600, color:accent, fontVariantNumeric:'tabular-nums'}}>{format(value)}</div>
      </div>
      <div style={{position:'relative', height:24, display:'flex', alignItems:'center'}}>
        <div style={{position:'absolute', inset:'11px 0', background:t.line, borderRadius:1}}/>
        <div style={{position:'absolute', left:0, top:11, height:2, width:`${pct}%`, background:accent}}/>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e=>onChange(parseFloat(e.target.value))}
          style={{position:'absolute', inset:0, width:'100%', opacity:0, cursor:'pointer', margin:0}}/>
        <div style={{position:'absolute', left:`calc(${pct}% - 6px)`, top:6, width:12, height:12, background:accent, border:`2px solid ${t.bg}`, borderRadius:0, pointerEvents:'none', boxShadow:`0 0 0 1px ${accent}`}}/>
      </div>
    </div>
  );
}
function ProdSeg({ label, value, options, onChange, accent, t }) {
  return (
    <div style={{padding:'14px 0'}}>
      <div style={{fontSize:11, letterSpacing:'0.18em', textTransform:'uppercase', fontFamily:PROD_MONO, color:t.textFaint, fontWeight:500, marginBottom:8}}>{label}</div>
      <div style={{display:'flex', flexWrap:'wrap', gap:0, border:`1px solid ${t.line}`}}>
        {options.map((o, i) => {
          const active = o.value === value;
          return (
            <button key={o.value} type="button" onClick={()=>onChange(o.value)}
              style={{flex:1, minWidth:60, padding:'10px 8px',
                borderRight: i < options.length-1 ? `1px solid ${t.line}` : 'none',
                background: active ? accent : 'transparent',
                color: active ? '#0E120F' : t.text,
                fontSize:12, fontWeight: active ? 700 : 500, letterSpacing:'0.05em',
                fontFamily:PROD_MONO, textTransform:'uppercase',
                cursor:'pointer', border:'none', transition:'all 0.12s'}}>{o.label}</button>
          );
        })}
      </div>
    </div>
  );
}

function ProdChart({ scenarios, cheapKey, accent, t, height = 240 }) {
  const years = 8;
  const W = 600, H = height;
  const padL = 44, padR = 16, padT = 16, padB = 28;
  const chartW = W - padL - padR, chartH = H - padT - padB;
  const series = scenarios.map(sc => {
    const pts = [];
    for (let y = 0; y <= years; y++) {
      let cost = y === 0 ? sc.capital : sc.capital + sc.opex * y - (y === years ? sc.residual : 0);
      pts.push(cost);
    }
    return { key: sc.key, pts };
  });
  const max = Math.max(...series.flatMap(s => s.pts));
  const niceMax = Math.ceil(max / 10000) * 10000;
  const x = y => padL + (y / years) * chartW;
  const y = v => padT + chartH - (v / niceMax) * chartH;
  const colors = { diy:'#9CA88E', contractor:'#C2A06B', byo:'#7E97C9', aa:accent };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%', height:'auto', display:'block'}}>
      {[0, 0.25, 0.5, 0.75, 1].map(f => (
        <g key={f}>
          <line x1={padL} y1={padT + chartH * f} x2={W - padR} y2={padT + chartH * f} stroke={t.lineSoft} strokeWidth="1"/>
          <text x={padL - 6} y={padT + chartH * f + 3} fill={t.textFaint} fontSize="9" fontFamily={PROD_MONO} textAnchor="end">${Math.round(niceMax * (1 - f) / 1000)}k</text>
        </g>
      ))}
      {[0,2,4,6,8].map(yr => (
        <text key={yr} x={x(yr)} y={H - 8} fill={t.textFaint} fontSize="9" fontFamily={PROD_MONO} textAnchor="middle">Y{yr}</text>
      ))}
      {series.map(sr => {
        const isCheap = sr.key === cheapKey;
        const d = sr.pts.map((v,i) => `${i===0?'M':'L'}${x(i)},${y(v)}`).join(' ');
        return (
          <g key={sr.key}>
            <path d={d} fill="none" stroke={colors[sr.key]} strokeWidth={isCheap ? 2.5 : 1.5} opacity={isCheap ? 1 : 0.55}/>
            <circle cx={x(years)} cy={y(sr.pts[years])} r={isCheap ? 4 : 3} fill={colors[sr.key]}/>
          </g>
        );
      })}
    </svg>
  );
}

function ProductionCalculator({ accent, gating, initialMode }) {
  const [mode, setMode] = React.useState(initialMode || 'dark');
  const [inputs, setInputs] = React.useState(DEFAULT_INPUTS);
  const [unlocked, setUnlocked] = React.useState(gating === 'off');
  const [showLeadForm, setShowLeadForm] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [methodOpen, setMethodOpen] = React.useState(false);
  const [stickyVisible, setStickyVisible] = React.useState(false);
  const heroRef = React.useRef(null);

  React.useEffect(()=>{ setUnlocked(gating==='off'); }, [gating]);
  React.useEffect(()=>{ setMode(initialMode || 'dark'); }, [initialMode]);

  React.useEffect(() => {
    const onScroll = () => {
      if (!heroRef.current) return;
      const r = heroRef.current.getBoundingClientRect();
      setStickyVisible(r.bottom < 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const t = prodTheme(mode);
  const s = React.useMemo(()=>calcScenarios(inputs), [inputs]);
  const cheap = cheapest(s);
  const all = scenariosArray(s);
  const tier = getTier(inputs.postcode);
  const cheapAnim = useAnimatedNumber(cheap.total8);
  const set = (k,v) => setInputs(p => ({...p, [k]: v}));
  const colors = { diy:'#9CA88E', contractor:'#C2A06B', byo:'#7E97C9', aa:accent };

  // savings vs DIY (or worst path) — narrative element
  const max8 = Math.max(...all.map(x=>x.total8));
  const savings = max8 - cheap.total8;

  const handleLeadSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const params = new URLSearchParams();
    for (const pair of fd.entries()) params.append(pair[0], pair[1]);
    fetch('/', {
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body: params.toString()
    }).then(()=>{
      setSubmitted(true);
      setUnlocked(true);
    }).catch(()=>{
      // Optimistic unlock even on offline preview
      setSubmitted(true);
      setUnlocked(true);
    });
  };

  return (
    <div style={{fontFamily:PROD_SANS, background:t.bg, color:t.text, minHeight:'100vh'}}>
      {/* Top bar */}
      <div style={{padding:'14px 24px', borderBottom:`1px solid ${t.line}`,
        display:'flex', justifyContent:'space-between', alignItems:'center',
        fontFamily:PROD_MONO, fontSize:11, letterSpacing:'0.1em', textTransform:'uppercase', color:t.textFaint, flexWrap:'wrap', gap:8,
        position:'sticky', top:0, background:t.bg, zIndex:50}}>
        <div><span style={{color:accent}}>◼</span> AUTOACRE / COST.CALC / v4.2</div>
        <div style={{display:'flex', alignItems:'center', gap:14}}>
          <span>{tier===1?<span style={{color:accent}}>● TIER-1 SERVICE</span>:tier===2?<span style={{color:'#C2A06B'}}>● TIER-2 EXPANSION</span>:'● TIER-3 REFERRAL'}</span>
          <button onClick={()=>setMethodOpen(true)} style={{background:'none', border:`1px solid ${t.line}`, color:t.text, padding:'5px 10px', fontFamily:PROD_MONO, fontSize:10, letterSpacing:'0.14em', cursor:'pointer', textTransform:'uppercase'}}>METHODOLOGY</button>
          <div style={{display:'inline-flex', border:`1px solid ${t.line}`}}>
            {['dark','light'].map((m,i) => (
              <button key={m} onClick={()=>setMode(m)} style={{
                padding:'5px 10px', background: mode===m ? t.text : 'transparent',
                color: mode===m ? t.bg : t.textDim, border:'none',
                fontFamily:PROD_MONO, fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase',
                fontWeight:600, cursor:'pointer',
                borderRight: i===0 ? `1px solid ${t.line}` : 'none'
              }}>{m}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky result strip */}
      <div style={{
        position:'sticky', top:48, zIndex:40,
        padding:'10px 24px', background: t.bg,
        borderBottom: stickyVisible ? `1px solid ${accent}` : `1px solid transparent`,
        boxShadow: stickyVisible ? `0 0 0 1px ${t.line}` : 'none',
        opacity: stickyVisible ? 1 : 0,
        transform: stickyVisible ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'opacity 0.2s, transform 0.2s, border-color 0.2s',
        display:'flex', alignItems:'baseline', gap:18, flexWrap:'wrap', fontFamily:PROD_MONO
      }}>
        <span style={{fontSize:10, color:accent, letterSpacing:'0.2em', textTransform:'uppercase', fontWeight:700}}>OPTIMAL</span>
        <span style={{fontSize:14, color:t.text, fontWeight:600}}>{cheap.label}</span>
        <span style={{flex:1}}/>
        <span style={{fontSize:18, color:accent, fontWeight:700, fontVariantNumeric:'tabular-nums'}}>{fmtMoney(cheap.total8)}</span>
        <span style={{fontSize:10, color:t.textFaint, letterSpacing:'0.14em', textTransform:'uppercase'}}>· 8 YR</span>
      </div>

      {/* Hero */}
      <div ref={heroRef} style={{padding:'56px 24px 32px', maxWidth:980}}>
        <div style={{fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', fontFamily:PROD_MONO, color:accent, fontWeight:600, marginBottom:18}}>
          → 8-YEAR ACREAGE COST MODEL
        </div>
        <h1 style={{fontSize:'clamp(36px, 5.4vw, 64px)', lineHeight:1, letterSpacing:'-0.03em', margin:0, fontWeight:700, color:t.text}}>
          The math on mowing.<br/><span style={{color:accent}}>No marketing.</span>
        </h1>
        <p style={{fontSize:16, lineHeight:1.55, color:t.textDim, marginTop:20, maxWidth:620}}>
          A live cost model. Drag any input — every number recalculates instantly. Same property, same assumptions, four paths compared honestly.
        </p>
      </div>

      {/* Inputs */}
      <div style={{margin:'0 24px', padding:'20px', border:`1px solid ${t.line}`, background:t.surfaceDim}}>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'8px 28px'}}>
          <ProdSlider t={t} label="ACRES" value={inputs.acres} min={2.5} max={10} step={0.1}
            format={v=>`${v.toFixed(1)}`} onChange={v=>set('acres', v)} accent={accent}/>
          <ProdSlider t={t} label="$/HR (TIME)" value={inputs.hourlyValue} min={20} max={150} step={5}
            format={v=>`$${v}`} onChange={v=>set('hourlyValue', v)} accent={accent}/>
          <ProdSeg t={t} label="TERRAIN" value={inputs.terrain}
            options={[{value:'flat',label:'FLAT'},{value:'rolling',label:'ROLL'},{value:'steep',label:'STEEP'}]}
            onChange={v=>set('terrain', v)} accent={accent}/>
          <ProdSeg t={t} label="FREQUENCY" value={inputs.frequency}
            options={[{value:'weekly',label:'WK'},{value:'fortnightly',label:'2WK'},{value:'monthly',label:'MO'},{value:'seasonal',label:'SSN'}]}
            onChange={v=>set('frequency', v)} accent={accent}/>
        </div>
        <div style={{marginTop:12, display:'flex', alignItems:'center', gap:18, flexWrap:'wrap'}}>
          <div style={{fontSize:11, letterSpacing:'0.18em', textTransform:'uppercase', fontFamily:PROD_MONO, color:t.textFaint, fontWeight:500}}>POSTCODE</div>
          <input value={inputs.postcode} onChange={e=>set('postcode', e.target.value.replace(/\D/g,'').slice(0,4))}
            inputMode="numeric"
            style={{width:160, padding:'10px 12px', background:t.surface, border:`1px solid ${t.line}`, color:t.text,
              fontSize:16, fontFamily:PROD_MONO, outline:'none', letterSpacing:'0.08em'}}/>
        </div>
      </div>

      {/* Optimal answer */}
      <div style={{margin:'24px', padding:'28px 24px', border:`1px solid ${accent}`, background:`${accent}10`, position:'relative'}}>
        <div style={{position:'absolute', top:-1, left:-1, padding:'4px 10px', background:accent, color:'#0E120F', fontSize:10, fontWeight:700, letterSpacing:'0.18em', fontFamily:PROD_MONO}}>CHEAPEST</div>
        <div style={{display:'flex', flexWrap:'wrap', gap:24, alignItems:'baseline', marginTop:8}}>
          <div style={{flex:'1 1 240px', minWidth:0}}>
            <div style={{fontSize:11, fontFamily:PROD_MONO, color:t.textFaint, letterSpacing:'0.18em', textTransform:'uppercase', marginBottom:6}}>OPTIMAL_PATH</div>
            <div style={{fontSize:24, fontWeight:700, color:t.text, marginBottom:4, lineHeight:1.1}}>{cheap.label}</div>
            <div style={{fontSize:13, color:t.textDim, fontFamily:PROD_MONO}}>over 8 years · {Math.round(cheap.hours)} hrs/yr · saves {fmtMoney(savings)} vs costliest path</div>
          </div>
          <div style={{flex:'0 0 auto'}}>
            <div style={{fontSize:11, fontFamily:PROD_MONO, color:t.textFaint, letterSpacing:'0.18em', textTransform:'uppercase', marginBottom:6}}>TOTAL_COST</div>
            <div style={{fontSize:'clamp(40px, 6vw, 60px)', fontWeight:700, color:accent, lineHeight:1, letterSpacing:'-0.02em', fontVariantNumeric:'tabular-nums', fontFamily:PROD_MONO}}>
              {fmtMoney(cheapAnim)}
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{margin:'0 24px 24px', padding:'24px', border:`1px solid ${t.line}`, background:t.surfaceDim}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, flexWrap:'wrap', gap:8}}>
          <div style={{fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', fontFamily:PROD_MONO, color:t.textFaint, fontWeight:600}}>FIG.01 / CUMULATIVE COST · YEARS 0–8</div>
          <div style={{display:'flex', gap:14, flexWrap:'wrap'}}>
            {all.map(sc => (
              <div key={sc.key} style={{display:'flex', alignItems:'center', gap:6, fontSize:11, fontFamily:PROD_MONO, color: sc.key===cheap.key?t.text:t.textDim, textTransform:'uppercase', letterSpacing:'0.05em'}}>
                <span style={{width:10, height:2, background:colors[sc.key]}}/>
                {sc.key === 'aa' ? 'AUTOACRE' : sc.key === 'byo' ? 'OWN ROBOT' : sc.key.toUpperCase()}
              </div>
            ))}
          </div>
        </div>
        <ProdChart scenarios={all} cheapKey={cheap.key} accent={accent} t={t}/>
      </div>

      {/* Comparison table — gated rows blur */}
      <div style={{margin:'0 24px 24px'}}>
        <div style={{fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', fontFamily:PROD_MONO, color:t.textFaint, fontWeight:600, marginBottom:12}}>FIG.02 / PATH COMPARISON · ALL METRICS</div>
        <div style={{overflowX:'auto', border:`1px solid ${t.line}`, background:t.surface}}>
          <table style={{width:'100%', borderCollapse:'collapse', fontFamily:PROD_MONO, fontSize:13}}>
            <thead><tr style={{background:t.surfaceDim}}>
              <th style={{padding:'10px 14px', textAlign:'left', fontSize:10, letterSpacing:'0.18em', fontWeight:600, color:t.textFaint, textTransform:'uppercase'}}>PATH</th>
              <th style={{padding:'10px 14px', textAlign:'right', fontSize:10, letterSpacing:'0.18em', fontWeight:600, color:t.textFaint, textTransform:'uppercase'}}>CAPITAL</th>
              <th style={{padding:'10px 14px', textAlign:'right', fontSize:10, letterSpacing:'0.18em', fontWeight:600, color:t.textFaint, textTransform:'uppercase'}}>YR 1</th>
              <th style={{padding:'10px 14px', textAlign:'right', fontSize:10, letterSpacing:'0.18em', fontWeight:600, color:t.textFaint, textTransform:'uppercase'}}>8-YR</th>
              <th style={{padding:'10px 14px', textAlign:'right', fontSize:10, letterSpacing:'0.18em', fontWeight:600, color:t.textFaint, textTransform:'uppercase'}}>HRS/YR</th>
              <th style={{padding:'10px 14px', textAlign:'right', fontSize:10, letterSpacing:'0.18em', fontWeight:600, color:t.textFaint, textTransform:'uppercase'}}>RESIDUAL</th>
            </tr></thead>
            <tbody>
              {all.map(sc => {
                const isCheap = sc.key === cheap.key;
                const blur = !unlocked && !isCheap;
                const cell = {padding:'12px 14px', fontSize:13, fontVariantNumeric:'tabular-nums'};
                return (
                  <tr key={sc.key} style={{borderTop:`1px solid ${t.lineSoft}`, background: isCheap ? `${accent}12` : 'transparent'}}>
                    <td style={{...cell, color: isCheap ? accent : t.text, fontWeight: isCheap ? 700 : 500}}>
                      <span style={{display:'inline-block', width:8, height:8, background:colors[sc.key], marginRight:8, verticalAlign:'middle'}}/>
                      {sc.label}
                    </td>
                    <td style={{...cell, textAlign:'right', filter: blur?'blur(5px)':'none', color:t.text}}>{fmtMoney(sc.capital)}</td>
                    <td style={{...cell, textAlign:'right', filter: blur?'blur(5px)':'none', color:t.text}}>{fmtMoney(sc.y1)}</td>
                    <td style={{...cell, textAlign:'right', color: isCheap?accent:t.text, fontWeight: isCheap?700:500, filter: (blur && !isCheap)?'blur(5px)':'none'}}>{fmtMoney(sc.total8)}</td>
                    <td style={{...cell, textAlign:'right', filter: blur?'blur(5px)':'none', color:t.text}}>{Math.round(sc.hours)}</td>
                    <td style={{...cell, textAlign:'right', filter: blur?'blur(5px)':'none', color:t.text}}>{sc.residual > 0 ? fmtMoney(sc.residual) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Soft gate / lead form */}
      {!unlocked && (
        <div style={{margin:'0 24px 24px', padding:'24px', border:`1px dashed ${accent}`, background:`${accent}0A`}}>
          <div style={{fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', fontFamily:PROD_MONO, color:accent, fontWeight:700, marginBottom:10}}>◼ FULL DATASET LOCKED</div>
          <div style={{fontSize:18, fontWeight:600, marginBottom:6, color:t.text, lineHeight:1.3, maxWidth:560}}>
            Year-by-year cashflow, capital schedules, residual recovery — and a personalised PDF.
          </div>
          <div style={{fontSize:13, color:t.textDim, marginBottom:18, fontFamily:PROD_MONO}}>// EMAIL_REQUIRED · NO_PHONE · NO_SPAM</div>
          {!showLeadForm ? (
            <button onClick={()=>setShowLeadForm(true)} style={{padding:'12px 20px', background:accent, color:'#0E120F', border:'none', fontSize:13, fontWeight:700, letterSpacing:'0.1em', fontFamily:PROD_MONO, cursor:'pointer', textTransform:'uppercase'}}>
              UNLOCK FULL BREAKDOWN →
            </button>
          ) : (
            <form name="calc-leads" method="POST" data-netlify="true" netlify-honeypot="bot-field" onSubmit={handleLeadSubmit}
              style={{display:'flex', flexDirection:'column', gap:8, maxWidth:380}}>
              <input type="hidden" name="form-name" value="calc-leads"/>
              <p style={{display:'none'}}><label>Don't fill: <input name="bot-field"/></label></p>
              <input type="hidden" name="lead-tier" value={`tier${tier}`}/>
              <input type="hidden" name="acres" value={inputs.acres}/>
              <input type="hidden" name="postcode" value={inputs.postcode}/>
              <input type="hidden" name="terrain" value={inputs.terrain}/>
              <input type="hidden" name="frequency" value={inputs.frequency}/>
              <input type="hidden" name="cheapest-path" value={cheap.label}/>
              <input type="hidden" name="cheapest-total" value={Math.round(cheap.total8)}/>
              <input name="name" required placeholder="NAME" style={{padding:'10px 12px', background:t.surface, border:`1px solid ${t.line}`, color:t.text, fontSize:13, fontFamily:PROD_MONO, outline:'none', letterSpacing:'0.08em'}}/>
              <input name="email" type="email" required placeholder="EMAIL" style={{padding:'10px 12px', background:t.surface, border:`1px solid ${t.line}`, color:t.text, fontSize:13, fontFamily:PROD_MONO, outline:'none', letterSpacing:'0.08em'}}/>
              <label style={{display:'flex', gap:8, alignItems:'flex-start', fontSize:11, color:t.textDim, fontFamily:PROD_MONO, lineHeight:1.5, letterSpacing:'0.04em', marginTop:4}}>
                <input type="checkbox" name="consent" required style={{accentColor:accent, marginTop:2}}/>
                <span>I CONSENT TO AUTOACRE EMAILING ME ABOUT SERVICE OR PARTNER REFERRALS.</span>
              </label>
              <button type="submit" style={{padding:'12px 20px', background:accent, color:'#0E120F', border:'none', fontSize:13, fontWeight:700, letterSpacing:'0.1em', fontFamily:PROD_MONO, cursor:'pointer', textTransform:'uppercase', alignSelf:'flex-start', marginTop:6}}>
                EXEC →
              </button>
            </form>
          )}
        </div>
      )}

      {/* After unlock — tier-based CTA */}
      {unlocked && (
        <div style={{margin:'0 24px 24px', padding:'28px 24px', border:`1px solid ${accent}`, background:`${accent}14`, position:'relative'}}>
          <div style={{position:'absolute', top:-1, left:-1, padding:'4px 10px', background:accent, color:'#0E120F', fontSize:10, fontWeight:700, letterSpacing:'0.18em', fontFamily:PROD_MONO}}>NEXT_STEP</div>
          {submitted && (
            <div style={{fontSize:11, fontFamily:PROD_MONO, color:accent, letterSpacing:'0.14em', textTransform:'uppercase', marginTop:8, marginBottom:6}}>// THANKS — DETAILS RECEIVED</div>
          )}
          {tier === 1 && (
            <>
              <div style={{fontSize:22, fontWeight:700, color:t.text, marginTop:12, lineHeight:1.2, letterSpacing:'-0.01em', maxWidth:600}}>
                You're in our direct service area.
              </div>
              <p style={{fontSize:14, color:t.textDim, lineHeight:1.55, marginTop:8, maxWidth:600}}>
                Want a real quote against these numbers? Short form, personalised proposal — no phone tag.
              </p>
              <div style={{display:'flex', gap:12, marginTop:18, flexWrap:'wrap'}}>
                <a href={`/quote.html?acres=${inputs.acres}&postcode=${inputs.postcode}&terrain=${inputs.terrain}`}
                  style={{padding:'12px 20px', background:t.text, color:t.bg, textDecoration:'none', fontSize:13, fontWeight:700, letterSpacing:'0.1em', fontFamily:PROD_MONO, textTransform:'uppercase'}}>
                  GET A QUOTE →
                </a>
                <button onClick={()=>window.print()} style={{padding:'12px 20px', background:'transparent', color:t.text, border:`1px solid ${t.line}`, fontSize:13, fontWeight:700, letterSpacing:'0.1em', fontFamily:PROD_MONO, cursor:'pointer', textTransform:'uppercase'}}>
                  PRINT / PDF
                </button>
              </div>
            </>
          )}
          {tier === 2 && (
            <>
              <div style={{fontSize:22, fontWeight:700, color:t.text, marginTop:12, lineHeight:1.2, letterSpacing:'-0.01em', maxWidth:600}}>
                You're in our 2026 expansion area.
              </div>
              <p style={{fontSize:14, color:t.textDim, lineHeight:1.55, marginTop:8, maxWidth:600}}>
                We've added you to the waitlist — you'll be first-served when service launches in your postcode.
              </p>
            </>
          )}
          {tier === 3 && (
            <>
              <div style={{fontSize:22, fontWeight:700, color:t.text, marginTop:12, lineHeight:1.2, letterSpacing:'-0.01em', maxWidth:600}}>
                We don't service this postcode directly yet.
              </div>
              <p style={{fontSize:14, color:t.textDim, lineHeight:1.55, marginTop:8, maxWidth:600}}>
                We'll be in touch when AutoAcre or a vetted partner is available in your area. In the meantime, the buyer's guide compares specific robot mowers head-to-head.
              </p>
              <div style={{display:'flex', gap:12, marginTop:18, flexWrap:'wrap'}}>
                <a href="/commercial-robotic-mower-buyers-guide-australia.html"
                  style={{padding:'12px 20px', background:t.text, color:t.bg, textDecoration:'none', fontSize:13, fontWeight:700, letterSpacing:'0.1em', fontFamily:PROD_MONO, textTransform:'uppercase'}}>
                  BUYER'S GUIDE →
                </a>
              </div>
            </>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{padding:'16px 24px 32px', borderTop:`1px solid ${t.lineSoft}`, fontSize:11, color:t.textFaint, fontFamily:PROD_MONO, letterSpacing:'0.05em', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8}}>
        <span>AUTOACRE.COM.AU · NORTHERN_RIVERS_NSW · METHODOLOGY_v4</span>
        <button onClick={()=>setMethodOpen(true)} style={{background:'none', border:'none', color:accent, fontFamily:PROD_MONO, fontSize:11, letterSpacing:'0.1em', cursor:'pointer', textTransform:'uppercase', textDecoration:'underline'}}>VIEW METHODOLOGY</button>
      </div>

      <MethodologyDrawer open={methodOpen} onClose={()=>setMethodOpen(false)} t={t} accent={accent} inputs={inputs} s={s}/>
    </div>
  );
}

window.ProductionCalculator = ProductionCalculator;
