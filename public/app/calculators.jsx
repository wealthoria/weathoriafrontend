/* global React, window */
/* =========================================================================
   Calculators overlay — SIP, Lumpsum, Goal Planning SIP, Retirement, DCF
   Brand-styled versions of the reference calculators. Pure client-side math.
   Exposes: CalcOverlay, ComingSoonOverlay (window)
   ========================================================================= */
const { useState, useEffect, useRef } = React;
const { Icon } = window;

const fmtINR = (n) => {
  if (!isFinite(n)) return "n/a";
  const abs = Math.abs(n);
  if (abs >= 1e7) return "₹" + (n / 1e7).toFixed(2) + " Cr";
  if (abs >= 1e5) return "₹" + (n / 1e5).toFixed(2) + " L";
  return "₹" + Math.round(n).toLocaleString("en-IN");
};

/* shared field */
function CF({ id, label, req, hint, err, children }) {
  return (
    <div className="cfield">
      <label htmlFor={id}>{label} {req && <span className="req">*</span>} {hint && <span className="hint">{hint}</span>}</label>
      {children}
      {err && <div className="ferr">{err}</div>}
    </div>
  );
}
function NumInput({ id, value, set, placeholder }) {
  return <input id={id} type="number" inputMode="decimal" value={value} placeholder={placeholder}
    onChange={(e) => set(e.target.value)} />;
}

const FREQ = [
  { k: "monthly", label: "Monthly", perYear: 12 },
  { k: "quarterly", label: "Quarterly", perYear: 4 },
  { k: "yearly", label: "Yearly", perYear: 1 },
];

function num(v) { const n = parseFloat(v); return isNaN(n) ? null : n; }

/* ---------------- SIP ---------------- */
function SipCalc() {
  const [freq, setFreq] = useState("monthly");
  const [amt, setAmt] = useState("");
  const [rate, setRate] = useState("");
  const [yrs, setYrs] = useState("");
  const [res, setRes] = useState(null);
  const [errs, setErrs] = useState({});

  function run() {
    const e = {};
    const P = num(amt), r = num(rate), t = num(yrs);
    if (!P || P <= 0) e.amt = "Enter an investment amount";
    if (!r || r <= 0 || r > 40) e.rate = "Enter a return between 1 and 40%";
    if (!t || t <= 0 || t > 50) e.yrs = "Enter a tenure between 1 and 50 years";
    setErrs(e);
    if (Object.keys(e).length) { setRes(null); return; }
    const perYear = FREQ.find((f) => f.k === freq).perYear;
    const i = r / 100 / perYear, n = t * perYear;
    const fv = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    const invested = P * n;
    setRes({ fv, invested, gain: fv - invested });
  }

  return (
    <div>
      <p className="calc-lede">Wish to invest periodically? Calculate the wealth you can create with disciplined, regular investing.</p>
      <div className="calc-grid">
        <CF id="sip-freq" label="Frequency of investment">
          <select id="sip-freq" value={freq} onChange={(e) => setFreq(e.target.value)}>
            {FREQ.map((f) => <option key={f.k} value={f.k}>{f.label}</option>)}
          </select>
        </CF>
        <CF id="sip-amt" label={`${FREQ.find((f) => f.k === freq).label} investment amount`} req err={errs.amt}>
          <NumInput id="sip-amt" value={amt} set={setAmt} placeholder="Ex: 1000" />
        </CF>
        <CF id="sip-rate" label="Expected rate of return (P.A)" req err={errs.rate}>
          <NumInput id="sip-rate" value={rate} set={setRate} placeholder="Ex: 12%" />
        </CF>
        <CF id="sip-yrs" label="Tenure (in years)" req hint="(up to 50 years)" err={errs.yrs}>
          <NumInput id="sip-yrs" value={yrs} set={setYrs} placeholder="Ex: 10" />
        </CF>
      </div>
      <div className="calc-actions"><button className="btn btn-green" onClick={run}>Plan my wealth</button></div>
      {res && (
        <div className="calc-result" aria-live="polite">
          <div className="rl">Wealth you can create</div>
          <div className="rv">{fmtINR(res.fv)}</div>
          <div className="rgrid">
            <div className="rg"><div className="gl">Total invested</div><div className="gv">{fmtINR(res.invested)}</div></div>
            <div className="rg"><div className="gl">Wealth gained</div><div className="gv">{fmtINR(res.gain)}</div></div>
            <div className="rg"><div className="gl">Growth multiple</div><div className="gv">{(res.fv / res.invested).toFixed(1)}×</div></div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Lumpsum ---------------- */
function LumpsumCalc() {
  const [amt, setAmt] = useState("");
  const [rate, setRate] = useState("");
  const [yrs, setYrs] = useState("");
  const [res, setRes] = useState(null);
  const [errs, setErrs] = useState({});

  function run() {
    const e = {};
    const P = num(amt), r = num(rate), t = num(yrs);
    if (!P || P <= 0) e.amt = "Enter an investment amount";
    if (!r || r <= 0 || r > 40) e.rate = "Enter a return between 1 and 40%";
    if (!t || t <= 0 || t > 50) e.yrs = "Enter a tenure between 1 and 50 years";
    setErrs(e);
    if (Object.keys(e).length) { setRes(null); return; }
    const fv = P * Math.pow(1 + r / 100, t);
    setRes({ fv, invested: P, gain: fv - P });
  }

  return (
    <div>
      <p className="calc-lede">Thinking of a one-time investment? Calculate the future value of your wealth.</p>
      <div className="calc-grid">
        <CF id="ls-amt" label="Investment amount" req err={errs.amt}><NumInput id="ls-amt" value={amt} set={setAmt} placeholder="Ex: 10000" /></CF>
        <CF id="ls-rate" label="Expected rate of return (P.A)" req err={errs.rate}><NumInput id="ls-rate" value={rate} set={setRate} placeholder="Ex: 12%" /></CF>
        <CF id="ls-yrs" label="Tenure (in years)" req hint="(up to 50 years)" err={errs.yrs}><NumInput id="ls-yrs" value={yrs} set={setYrs} placeholder="Ex: 10" /></CF>
      </div>
      <div className="calc-actions"><button className="btn btn-green" onClick={run}>Plan my future value</button></div>
      {res && (
        <div className="calc-result" aria-live="polite">
          <div className="rl">Future value</div>
          <div className="rv">{fmtINR(res.fv)}</div>
          <div className="rgrid">
            <div className="rg"><div className="gl">Invested</div><div className="gv">{fmtINR(res.invested)}</div></div>
            <div className="rg"><div className="gl">Wealth gained</div><div className="gv">{fmtINR(res.gain)}</div></div>
            <div className="rg"><div className="gl">Growth multiple</div><div className="gv">{(res.fv / res.invested).toFixed(1)}×</div></div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Goal Planning SIP ---------------- */
function GoalCalc() {
  const [freq, setFreq] = useState("monthly");
  const [target, setTarget] = useState("");
  const [rate, setRate] = useState("");
  const [yrs, setYrs] = useState("");
  const [infl, setInfl] = useState("no");
  const [res, setRes] = useState(null);
  const [errs, setErrs] = useState({});
  const INFLATION = 6;

  function run() {
    const e = {};
    const FV0 = num(target), r = num(rate), t = num(yrs);
    if (!FV0 || FV0 <= 0) e.target = "Enter your target wealth";
    if (!r || r <= 0 || r > 40) e.rate = "Enter a return between 1 and 40%";
    if (!t || t <= 0 || t > 50) e.yrs = "Enter a tenure between 1 and 50 years";
    setErrs(e);
    if (Object.keys(e).length) { setRes(null); return; }
    const FV = infl === "yes" ? FV0 * Math.pow(1 + INFLATION / 100, t) : FV0;
    const perYear = FREQ.find((f) => f.k === freq).perYear;
    const i = r / 100 / perYear, n = t * perYear;
    const P = FV / (((Math.pow(1 + i, n) - 1) / i) * (1 + i));
    setRes({ P, FV, invested: P * n, adjusted: infl === "yes" });
  }

  return (
    <div>
      <p className="calc-lede">How much should you invest regularly to reach your goal? Work backwards from your target.</p>
      <div className="calc-grid">
        <CF id="g-freq" label="Frequency of investment">
          <select id="g-freq" value={freq} onChange={(e) => setFreq(e.target.value)}>
            {FREQ.map((f) => <option key={f.k} value={f.k}>{f.label}</option>)}
          </select>
        </CF>
        <CF id="g-target" label="Targeted wealth" req err={errs.target}><NumInput id="g-target" value={target} set={setTarget} placeholder="Ex: 1000000" /></CF>
        <CF id="g-rate" label="Expected rate of return (P.A)" req err={errs.rate}><NumInput id="g-rate" value={rate} set={setRate} placeholder="Ex: 12%" /></CF>
        <CF id="g-yrs" label="Tenure (in years)" req hint="(up to 50 years)" err={errs.yrs}><NumInput id="g-yrs" value={yrs} set={setYrs} placeholder="Ex: 10" /></CF>
        <CF id="g-infl" label="Adjust for inflation" hint={`(${INFLATION}% assumed)`}>
          <select id="g-infl" value={infl} onChange={(e) => setInfl(e.target.value)}>
            <option value="no">No</option><option value="yes">Yes</option>
          </select>
        </CF>
      </div>
      <div className="calc-actions"><button className="btn btn-green" onClick={run}>Plan my SIP goal</button></div>
      {res && (
        <div className="calc-result" aria-live="polite">
          <div className="rl">Required {FREQ.find((f) => f.k === freq).label.toLowerCase()} investment</div>
          <div className="rv">{fmtINR(res.P)}</div>
          <div className="rgrid">
            <div className="rg"><div className="gl">{res.adjusted ? "Inflation-adjusted target" : "Target wealth"}</div><div className="gv">{fmtINR(res.FV)}</div></div>
            <div className="rg"><div className="gl">Total you will invest</div><div className="gv">{fmtINR(res.invested)}</div></div>
            <div className="rg"><div className="gl">Wealth gained</div><div className="gv">{fmtINR(res.FV - res.invested)}</div></div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Retirement ---------------- */
function RetireCalc() {
  const [age, setAge] = useState("");
  const [retAge, setRetAge] = useState("");
  const [life, setLife] = useState("");
  const [rate, setRate] = useState("");
  const [expense, setExpense] = useState("");
  const [res, setRes] = useState(null);
  const [errs, setErrs] = useState({});
  const INFLATION = 6;

  function run() {
    const e = {};
    const a = num(age), ra = num(retAge), le = num(life), r = num(rate), ex = num(expense);
    if (!a || a < 15 || a > 80) e.age = "Enter your current age (15 to 80)";
    if (!ra || ra <= (a || 0) || ra > 80) e.retAge = "Must be after your current age";
    if (!le || le <= (ra || 0) || le > 110) e.life = "Must be after retirement age";
    if (!r || r <= 0 || r > 40) e.rate = "Enter a return between 1 and 40%";
    if (!ex || ex <= 0) e.expense = "Enter your current annual expense";
    setErrs(e);
    if (Object.keys(e).length) { setRes(null); return; }
    const toRet = ra - a, inRet = le - ra;
    const g = INFLATION / 100, R = r / 100;
    const expAtRet = ex * Math.pow(1 + g, toRet);
    // corpus: growing annuity of expenses over retirement, discounted at return rate
    const realFactor = (1 + g) / (1 + R);
    const corpus = Math.abs(R - g) < 1e-6
      ? expAtRet * inRet
      : expAtRet * (1 - Math.pow(realFactor, inRet)) / (R - g) * (1 + R) / (1 + R); // standard growing-annuity PV
    // monthly SIP needed to build corpus by retirement
    const i = R / 12, n = toRet * 12;
    const sip = corpus / (((Math.pow(1 + i, n) - 1) / i) * (1 + i));
    setRes({ corpus, sip, expAtRet, toRet, inRet });
  }

  return (
    <div>
      <p className="calc-lede">Wish to live comfortably after retirement? Calculate the corpus you need and the monthly investment to get there. Inflation is assumed at {INFLATION}%.</p>
      <div className="calc-grid">
        <CF id="r-age" label="Current age" req err={errs.age}><NumInput id="r-age" value={age} set={setAge} placeholder="Ex: 24" /></CF>
        <CF id="r-ret" label="Retirement age" req err={errs.retAge}><NumInput id="r-ret" value={retAge} set={setRetAge} placeholder="Ex: 55" /></CF>
        <CF id="r-life" label="Life expectancy" req err={errs.life}><NumInput id="r-life" value={life} set={setLife} placeholder="Ex: 85" /></CF>
        <CF id="r-rate" label="Expected rate of return (P.A)" req err={errs.rate}><NumInput id="r-rate" value={rate} set={setRate} placeholder="Ex: 12%" /></CF>
        <CF id="r-exp" label="Current annual expense" req err={errs.expense}><NumInput id="r-exp" value={expense} set={setExpense} placeholder="Ex: 100000" /></CF>
      </div>
      <div className="calc-actions"><button className="btn btn-green" onClick={run}>Plan my retirement</button></div>
      {res && (
        <div className="calc-result" aria-live="polite">
          <div className="rl">Retirement corpus you need</div>
          <div className="rv">{fmtINR(res.corpus)}</div>
          <div className="rgrid">
            <div className="rg"><div className="gl">Monthly SIP to get there</div><div className="gv">{fmtINR(res.sip)}</div></div>
            <div className="rg"><div className="gl">Annual expense at retirement</div><div className="gv">{fmtINR(res.expAtRet)}</div></div>
            <div className="rg"><div className="gl">Years to retirement</div><div className="gv">{res.toRet}</div></div>
            <div className="rg"><div className="gl">Years in retirement</div><div className="gv">{res.inRet}</div></div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- DCF ---------------- */
const GROWTH_OPTS = [5, 8, 10, 12, 15, 18, 20, 25];
function DcfCalc() {
  const [fcf, setFcf] = useState("");
  const [disc, setDisc] = useState("");
  const [g15, setG15] = useState("");
  const [g610, setG610] = useState("");
  const [term, setTerm] = useState("");
  const [mcap, setMcap] = useState("");
  const [price, setPrice] = useState("");
  const [debt, setDebt] = useState("");
  const [mos, setMos] = useState("");
  const [res, setRes] = useState(null);
  const [errs, setErrs] = useState({});

  function run() {
    const e = {};
    const F = num(fcf), r = num(disc), gA = num(g15), gB = num(g610), gT = num(term);
    const MC = num(mcap), P = num(price), D = num(debt), M = num(mos);
    if (!F || F <= 0) e.fcf = "Enter initial free cash flow";
    if (!r || r <= 0 || r > 40) e.disc = "Enter a discount rate (1 to 40%)";
    if (gA == null || gA === 0) e.g15 = "Select a growth rate";
    if (gB == null || gB === 0) e.g610 = "Select a growth rate";
    if (gT == null || gT < 0 || gT >= (r || 100)) e.term = "Must be below the discount rate";
    if (!MC || MC <= 0) e.mcap = "Enter market capitalization";
    if (!P || P <= 0) e.price = "Enter current share price";
    if (D == null) e.debt = "Enter net debt (0 if none)";
    if (M == null || M < 0 || M > 90) e.mos = "Enter margin of safety (0 to 90%)";
    setErrs(e);
    if (Object.keys(e).length) { setRes(null); return; }

    const R = r / 100, ga = gA / 100, gb = gB / 100, gt = gT / 100;
    let pv = 0, f = F;
    for (let y = 1; y <= 10; y++) {
      f = f * (1 + (y <= 5 ? ga : gb));
      pv += f / Math.pow(1 + R, y);
    }
    const tv = (f * (1 + gt)) / (R - gt);
    pv += tv / Math.pow(1 + R, 10);
    const equity = pv - D;                       // Rs Cr
    const shares = MC / P;                        // Cr shares
    const intrinsic = equity / shares;            // Rs per share
    const buyBelow = intrinsic * (1 - M / 100);
    setRes({ intrinsic, buyBelow, price: P, undervalued: P < buyBelow });
  }

  return (
    <div>
      <p className="calc-lede">Estimate the intrinsic value of a company with a 10-year discounted cash flow, without wrestling a spreadsheet. All money figures in ₹ Cr.</p>
      <div className="calc-grid">
        <CF id="d-fcf" label="Initial FCF (₹ Cr)" req err={errs.fcf}><NumInput id="d-fcf" value={fcf} set={setFcf} placeholder="Ex: 100" /></CF>
        <CF id="d-disc" label="Discount rate (%)" req err={errs.disc}><NumInput id="d-disc" value={disc} set={setDisc} placeholder="Ex: 12" /></CF>
        <CF id="d-g15" label="Growth rate (years 1 to 5)" req err={errs.g15}>
          <select id="d-g15" value={g15} onChange={(e) => setG15(e.target.value)}>
            <option value="">Select growth rate</option>
            {GROWTH_OPTS.map((g) => <option key={g} value={g}>{g}%</option>)}
          </select>
        </CF>
        <CF id="d-g610" label="Growth rate (years 6 to 10)" req err={errs.g610}>
          <select id="d-g610" value={g610} onChange={(e) => setG610(e.target.value)}>
            <option value="">Select growth rate</option>
            {GROWTH_OPTS.map((g) => <option key={g} value={g}>{g}%</option>)}
          </select>
        </CF>
        <CF id="d-term" label="Terminal rate (%)" req err={errs.term}><NumInput id="d-term" value={term} set={setTerm} placeholder="Ex: 4" /></CF>
        <CF id="d-mcap" label="Market capitalization (₹ Cr)" req err={errs.mcap}><NumInput id="d-mcap" value={mcap} set={setMcap} placeholder="Ex: 12000" /></CF>
        <CF id="d-price" label="Current share price (₹)" req err={errs.price}><NumInput id="d-price" value={price} set={setPrice} placeholder="Ex: 120" /></CF>
        <CF id="d-debt" label="Net debt (₹ Cr)" req err={errs.debt}><NumInput id="d-debt" value={debt} set={setDebt} placeholder="Ex: 1200" /></CF>
        <CF id="d-mos" label="Margin of safety (%)" req err={errs.mos}><NumInput id="d-mos" value={mos} set={setMos} placeholder="Ex: 20" /></CF>
      </div>
      <div className="calc-actions"><button className="btn btn-green" onClick={run}>Calculate DCF</button></div>
      {res && (
        <div className="calc-result" aria-live="polite">
          <div className="rl">Intrinsic value per share</div>
          <div className="rv">₹{res.intrinsic.toFixed(2)}</div>
          <div className="rgrid">
            <div className="rg"><div className="gl">Buy below (after margin of safety)</div><div className="gv">₹{res.buyBelow.toFixed(2)}</div></div>
            <div className="rg"><div className="gl">Current price</div><div className="gv">₹{res.price.toFixed(2)}</div></div>
          </div>
          <div className={`verdict ${res.undervalued ? "good" : "bad"}`}>
            {res.undervalued ? "Trading below your buy price" : "Trading above your buy price"}
          </div>
          <div className="calc-note">Educational estimate only, not investment advice. DCF results are highly sensitive to growth and discount assumptions.</div>
        </div>
      )}
    </div>
  );
}

/* ---------------- overlay shells ---------------- */
const TABS = [
  { k: "sip", label: "SIP", title: "SIP calculator", C: SipCalc },
  { k: "lumpsum", label: "Lumpsum", title: "Lumpsum calculator", C: LumpsumCalc },
  { k: "goal", label: "Goal planning", title: "Goal planning · SIP", C: GoalCalc },
  { k: "retire", label: "Retirement", title: "Retirement planning", C: RetireCalc },
  { k: "dcf", label: "DCF", title: "DCF calculator", C: DcfCalc },
];

function CalcOverlay({ onClose }) {
  const [tab, setTab] = useState("sip");
  const ref = useRef(null);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);
  const T = TABS.find((t) => t.k === tab);
  return (
    <div className="calc-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="calc-modal" role="dialog" aria-modal="true" aria-label="Calculators" ref={ref}>
        <div className="calc-head">
          <span className="cic"><Icon name="calc" size={20} /></span>
          <div><h2>{T.title}</h2><div className="sub">Free tools · educational estimates, not advice</div></div>
          <button className="calc-close" onClick={onClose} aria-label="Close calculators"><Icon name="x" size={18} /></button>
        </div>
        <div className="calc-tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.k} role="tab" aria-selected={tab === t.k} className={`calc-tab ${tab === t.k ? "on" : ""}`} onClick={() => setTab(t.k)}>{t.label}</button>
          ))}
        </div>
        <div className="calc-body"><T.C /></div>
      </div>
    </div>
  );
}

function ComingSoonOverlay({ title, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="calc-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="soon-card" role="dialog" aria-modal="true">
        <span className="sic"><Icon name="clock" size={26} /></span>
        <h3>Coming soon</h3>
        <p>{title ? `"${title}" is` : "This resource is"} being written with care. It will be free when it arrives.</p>
        <button className="btn btn-green" onClick={onClose}>Got it</button>
      </div>
    </div>
  );
}

Object.assign(window, { CalcOverlay, ComingSoonOverlay });
