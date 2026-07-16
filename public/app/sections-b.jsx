/* global React, window */
const { useState } = React;
const { useApp, Icon, Reveal, SectionHead, ImagePlaceholder } = window;

/* =========================================================================
   LEARNING PROGRAMS - tabbed/filterable
   ========================================================================= */
function Programs({ onNav }) {
  const { t } = useApp();
  const p = t.programs;
  const [tab, setTab] = useState("all");
  const items = p.items.filter((it) => tab === "all" || it.cat === tab);

  return (
    <section className="band band-white" id="programs">
      <div className="wrap">
        <SectionHead eyebrow={p.eyebrow} title={p.title} sub={p.sub} />
        <Reveal className="tabs">
          {p.tabs.map((tb) => (
            <button key={tb.id} className={`tab ${tab === tb.id ? "on" : ""}`} onClick={() => setTab(tb.id)}>{tb.label}</button>
          ))}
        </Reveal>
        <div className="prog-grid">
          {items.map((it, i) => (
            <Reveal as="button" key={it.t} className="prog" delay={(i % 3) * 80} onClick={() => onNav("consult")}>
              <div className="top">
                <div className="iconwrap"><Icon name={it.ic} size={24} /></div>
                <span className="badge badge-outline">{it.level}</span>
              </div>
              <h3>{it.t}</h3>
              <p>{it.d}</p>
              <div className="meta"><span>{it.modules}</span></div>
              <span className="go">{p.cta}<Icon name="arrow" size={16} /></span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   LEARNING PROCESS - stepper (ink band, polarity flip)
   ========================================================================= */
function Process() {
  const { t } = useApp();
  const p = t.process;
  return (
    <section className="band band-ink" id="process">
      <div className="wrap">
        <SectionHead eyebrow={p.eyebrow} title={p.title} sub={p.sub} />
        <div className="steps">
          {p.steps.map((s, i) => (
            <Reveal key={i} className="step" delay={i * 100}>
              <div className="connector" />
              <div className="num">{i + 1}</div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   FOUNDERS - ink band, two founders with distinct quotes + credentials
   ========================================================================= */
function Founder() {
  const { t } = useApp();
  const f = t.founder;
  return (
    <section className="band band-ink founders" id="about">
      <div className="wrap">
        <SectionHead eyebrow={f.eyebrow} title={f.title} sub={f.sub} center />
        <div className="founders-grid">
          {f.people.map((p, i) => (
            <Reveal key={i} className="founder-card" delay={i * 120}>
              <div className="founder-head">
                {p.photo
                  ? <img className="founder-avatar founder-photo" src={p.photo} alt={p.name} loading="lazy" width="76" height="76" />
                  : <ImagePlaceholder className="founder-avatar" label={p.photoLabel} icon="users" />}
                <div className="founder-id">
                  <div className="nm">{p.name}</div>
                  <div className="rl">{p.role}</div>
                </div>
              </div>
              <blockquote>
                <span className="quote-mark" aria-hidden="true">&ldquo;</span>
                {p.quote}
              </blockquote>
              <ul className="creds">
                {p.creds.map((c, j) => (
                  <li key={j}><Icon name="check" size={15} stroke={3} />{c}</li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Programs, Process, Founder });
