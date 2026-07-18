/* global React, window */
const { useState } = React;
const { useApp, Icon, Reveal, SectionHead, BrandLockup } = window;

/* =========================================================================
   CONSULTATION FORM - validated, with success state
   ========================================================================= */
function Consultation() {
  const { t } = useApp();
  const c = t.consult;
  const F = c.form;
  const [vals, setVals] = useState({ name: "", email: "", phone: "", city: "", interest: F.interestOpts[0], message: "" });
  const [errs, setErrs] = useState({});
  const [done, setDone] = useState(false);

  const set = (k) => (e) => {setVals((v) => ({ ...v, [k]: e.target.value }));if (errs[k]) setErrs((x) => ({ ...x, [k]: false }));};

  const validate = () => {
    const e = {};
    if (!vals.name.trim()) e.name = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vals.email)) e.email = true;
    if (vals.phone.replace(/\D/g, "").length < 10) e.phone = true;
    setErrs(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev) => {ev.preventDefault();if (validate()) setDone(true);};

  return (
    <section className="band band-soft" id="consult">
      <div className="wrap consult-grid">
        <Reveal className="consult">
          <span className="eyebrow">{c.eyebrow}</span>
          <h2 className="h2" style={{ lineHeight: "1" }}>{c.title}</h2>
          <p className="sub">{c.sub}</p>
          <div className="pts">
            {c.points.map((p, i) =>
            <div className="pt" key={i}>
                <div className="iconwrap"><Icon name={p.ic} size={20} /></div>
                <div><h4>{p.t}</h4><p>{p.d}</p></div>
              </div>
            )}
          </div>
          <div className="contacts">
            {c.contacts.map((ct, i) =>
            <a key={i} href={ct.href}><Icon name={ct.ic} size={18} />{ct.v}</a>
            )}
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="formcard">
            {done ?
            <div className="form-success">
                <div className="ok"><Icon name="check" size={30} stroke={3} /></div>
                <h3>{F.successTitle}</h3>
                <p>{F.successMsg}</p>
                <button className="btn btn-ghost" style={{ marginTop: 22 }} onClick={() => {setDone(false);setVals({ name: "", email: "", phone: "", city: "", interest: F.interestOpts[0], message: "" });}}>
                  <Icon name="arrow" size={16} style={{ transform: "rotate(180deg)" }} />Back
                </button>
              </div> :

            <form onSubmit={submit} noValidate>
                <div className={`field ${errs.name ? "invalid" : ""}`}>
                  <label>{F.name} <span className="req">*</span></label>
                  <input className="input" value={vals.name} onChange={set("name")} placeholder={F.placeholderName} />
                  <div className="err">{F.errName}</div>
                </div>
                <div className="field row2">
                  <div className={errs.email ? "invalid field" : "field"} style={{ margin: 0 }}>
                    <label>{F.email} <span className="req">*</span></label>
                    <input className="input" value={vals.email} onChange={set("email")} placeholder={F.placeholderEmail} inputMode="email" />
                    <div className="err">{F.errEmail}</div>
                  </div>
                  <div className={errs.phone ? "invalid field" : "field"} style={{ margin: 0 }}>
                    <label>{F.phone} <span className="req">*</span></label>
                    <input className="input" value={vals.phone} onChange={set("phone")} placeholder={F.placeholderPhone} inputMode="tel" />
                    <div className="err">{F.errPhone}</div>
                  </div>
                </div>
                <div className="field">
                  <label>{F.city}</label>
                  <input className="input" value={vals.city} onChange={set("city")} placeholder={F.placeholderCity} />
                </div>
                <div className="field">
                  <label>{F.interest}</label>
                  <select className="select" value={vals.interest} onChange={set("interest")}>
                    {F.interestOpts.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>{F.message}</label>
                  <textarea className="textarea" value={vals.message} onChange={set("message")} placeholder={F.placeholderMsg} />
                </div>
                <button className="btn btn-green btn-block" type="submit">{F.submit}<Icon name="arrow" size={18} /></button>
              </form>
            }
          </div>
        </Reveal>
      </div>
    </section>);

}

/* =========================================================================
   FAQ - accordion
   ========================================================================= */
function FAQ() {
  const { t } = useApp();
  const [open, setOpen] = useState(0);
  return (
    <section className="band band-white">
      <div className="wrap">
        <SectionHead eyebrow={t.faq.eyebrow} title={t.faq.title} center />
        <div className="faq-list">
          {t.faq.items.map((it, i) =>
          <Reveal key={i} className={`faq-item ${open === i ? "open" : ""}`} delay={i * 50}>
              <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                <span className="faq-num">{String(i + 1).padStart(2, "0")}</span>
                {it.q}<span className="chev"><Icon name="chevron" size={20} /></span>
              </button>
              <div className="faq-a" style={{ maxHeight: open === i ? 320 : 0 }}>
                <div className="faq-a-inner">{it.a}</div>
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </section>);

}

/* =========================================================================
   FOOTER
   ========================================================================= */
function Footer() {
  const { t } = useApp();
  const f = t.footer;
  const socials = [["youtube", "#"], ["instagram", "#"], ["whatsapp", "#"], ["linkedin", "#"]];
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-top">
          <div>
            <BrandLockup markHeight={38} showSub href="#top" />
            <p className="blurb">{f.blurb}</p>
            <div className="nl">
              <input placeholder={f.newsletter} aria-label={f.newsletter} />
              <button className="btn btn-green btn-sm" type="button">{f.newsletterCta}</button>
            </div>
            <div className="social">
              {socials.map(([ic, href]) =>
              <a key={ic} href={href} aria-label={ic}><Icon name={ic} size={18} /></a>
              )}
            </div>
            <div className="footer-logins">
              <a className="footer-login" href="Student Portal.html"><Icon name="user" size={16} />Student login</a>
              <a className="footer-login" href="Member Portal.html"><Icon name="lock" size={15} />Member login</a>
            </div>
          </div>
          <div className="footer-cols">
<a href="/privacy-policy.html">Privacy Policy</a>  
<a href="/terms.html">Terms & Conditions</a>       
<a href="/terms.html">Terms & Conditions</a> 
<a href="/refund-policy.html">Refund Policy</a>
<a href="/contact.html">Contact Us</a>
      <a href="payment.html">
   Register for Live Webinar
  </a>
          </div>
        </div>
        <p style={{ font: "var(--caption)", color: "rgba(243,245,239,.4)", marginTop: 40, maxWidth: 760 }}>{f.disclaimer}</p>
        <div className="footer-bar">
          <span>{f.copyright}</span>
          <span>Learning is the first investment.</span>
        </div>
      </div>
    </footer>);

}

Object.assign(window, { Consultation, FAQ, Footer });