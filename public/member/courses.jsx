/* global React, window */
/* =========================================================================
   Member Portal — Courses list + multi-step Course builder
   /member/courses           -> list
   /member/courses/new       -> builder (create)
   /member/courses/:id/edit  -> builder (edit)
   ========================================================================= */
const { useState, useRef, useMemo } = React;
const { useMemberData } = window;
const { useMRouter, MIcon, StatusPill, useMToast, useConfirm, Switch } = window;
const { Shell } = window;
const { CATEGORIES } = window.MEMBER_DATA;

/* ---------------- list ---------------- */
function CoursesList() {
  const data = useMemberData();
  const { navigate } = useMRouter();
  const { push } = useMToast();
  const confirm = useConfirm();

  const remove = async (c) => {
    const ok = await confirm({ title: "Delete course?", message: `"${c.title}" and its curriculum will be removed.`, confirm: "Delete", danger: true, icon: "trash" });
    if (ok) { data.deleteCourse(c.id); push(`Deleted "${c.title}"`); }
  };

  return (
    <Shell title="Courses" subtitle={`${data.courses.length} course${data.courses.length !== 1 ? "s" : ""}`}
      actions={<button className="btn btn-green btn-sm" onClick={() => navigate("/member/courses/new")}><MIcon name="plus" size={16} />New course</button>}>
      <div className="reveal-fade">
        {data.courses.length === 0 ? (
          <div className="mempty"><div className="eic"><MIcon name="courses" size={28} /></div><h3>No courses yet</h3><p>Build your first course from your content and uploads.</p><button className="btn btn-green btn-sm" onClick={() => navigate("/member/courses/new")}>Create course</button></div>
        ) : (
          <div className="tablewrap">
            <table className="dt">
              <thead><tr><th>Course</th><th>Category</th><th>Lessons</th><th>Price</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
              <tbody>
                {data.courses.map((c) => {
                  const lessons = c.sections.reduce((n, s) => n + s.lessons.length, 0);
                  return (
                    <tr key={c.id}>
                      <td><span className="t-title">{c.title}</span><div className="t-sub">{c.sections.length} section{c.sections.length !== 1 ? "s" : ""}</div></td>
                      <td>{c.category}</td>
                      <td>{lessons}</td>
                      <td>&#8377;{c.price.toLocaleString("en-IN")}</td>
                      <td><StatusPill status={c.status} /></td>
                      <td><div className="actions">
                        <button className="row-act" title="Edit" onClick={() => navigate(`/member/courses/${c.id}/edit`)}><MIcon name="pencil" size={16} /></button>
                        <button className="row-act danger" title="Delete" onClick={() => remove(c)}><MIcon name="trash" size={16} /></button>
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Shell>
  );
}

/* ---------------- builder ---------------- */
const STEPS = ["Basic info", "Curriculum", "Settings", "Preview"];

function CourseBuilder({ courseId }) {
  const data = useMemberData();
  const { navigate } = useMRouter();
  const { push } = useMToast();

  const existing = courseId ? data.courses.find((c) => c.id === courseId) : null;
  const [step, setStep] = useState(0);
  const [course, setCourse] = useState(() => existing ? JSON.parse(JSON.stringify(existing)) : {
    id: "course" + Date.now(), title: "", description: "", price: 999, category: CATEGORIES[0], status: "draft",
    visibility: "public", enrollmentLimit: "", certificate: true, sections: [],
  });
  const set = (patch) => setCourse((c) => ({ ...c, ...patch }));

  const dragRef = useRef(null);

  /* ----- curriculum mutations ----- */
  const addSection = () => set({ sections: [...course.sections, { id: "sec" + Date.now(), title: "New section", lessons: [] }] });
  const updateSection = (sid, patch) => set({ sections: course.sections.map((s) => s.id === sid ? { ...s, ...patch } : s) });
  const removeSection = (sid) => set({ sections: course.sections.filter((s) => s.id !== sid) });
  const addLesson = (sid) => set({ sections: course.sections.map((s) => s.id === sid ? { ...s, lessons: [...s.lessons, { id: "l" + Date.now(), title: "New lesson", type: "video" }] } : s) });
  const updateLesson = (sid, lid, patch) => set({ sections: course.sections.map((s) => s.id === sid ? { ...s, lessons: s.lessons.map((l) => l.id === lid ? { ...l, ...patch } : l) } : s) });
  const removeLesson = (sid, lid) => set({ sections: course.sections.map((s) => s.id === sid ? { ...s, lessons: s.lessons.filter((l) => l.id !== lid) } : s) });

  const reorderSections = (fromIdx, toIdx) => {
    const arr = [...course.sections]; const [m] = arr.splice(fromIdx, 1); arr.splice(toIdx, 0, m); set({ sections: arr });
  };
  const reorderLessons = (sid, fromIdx, toIdx) => {
    set({ sections: course.sections.map((s) => { if (s.id !== sid) return s; const arr = [...s.lessons]; const [m] = arr.splice(fromIdx, 1); arr.splice(toIdx, 0, m); return { ...s, lessons: arr }; }) });
  };

  const totalLessons = course.sections.reduce((n, s) => n + s.lessons.length, 0);
  const canNext = step === 0 ? course.title.trim().length > 0 : true;

  const saveDraft = () => { data.saveCourse({ ...course, status: "draft" }); push(`Saved "${course.title || "Untitled"}" as draft`); navigate("/member/courses"); };
  const publish = () => { data.saveCourse({ ...course, status: "published" }); push(`Published "${course.title}"`); navigate("/member/courses"); };

  return (
    <Shell title={existing ? "Edit course" : "New course"} subtitle={course.title || "Untitled course"}
      actions={<button className="btn btn-ghost btn-sm" onClick={() => navigate("/member/courses")}>Close</button>}>
      <div className="mcontent narrow reveal-fade" style={{ padding: 0 }}>
        {/* stepper */}
        <div className="stepper">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`step-pill ${i === step ? "on" : ""} ${i < step ? "done" : ""}`} onClick={() => i < step && setStep(i)} style={{ cursor: i < step ? "pointer" : "default" }}>
                <span className="num">{i < step ? <MIcon name="check" size={15} stroke={3} /> : i + 1}</span>
                <span className="lbl">{s}</span>
              </div>
              {i < STEPS.length - 1 && <span className="step-line" />}
            </React.Fragment>
          ))}
        </div>

        {/* step 1: basic */}
        {step === 0 && (
          <div className="panel panel-pad builder-grid">
            <div className="field"><label>Course title</label><input className="input" value={course.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Stock market fundamentals" /></div>
            <div className="field"><label>Description</label><textarea className="textarea" value={course.description} onChange={(e) => set({ description: e.target.value })} placeholder="What will students learn?" /></div>
            <div className="field-grid2">
              <div className="field"><label>Price (&#8377;)</label><input className="input" type="number" value={course.price} onChange={(e) => set({ price: +e.target.value })} /></div>
              <div className="field"><label>Category</label><select className="select" value={course.category} onChange={(e) => set({ category: e.target.value })}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
            </div>
          </div>
        )}

        {/* step 2: curriculum */}
        {step === 1 && (
          <div className="panel panel-pad">
            {course.sections.length === 0 && <p className="muted" style={{ font: "var(--body-sm)", margin: "0 0 14px" }}>Add sections, then lessons inside them. Drag the handle to reorder.</p>}
            <div className="curriculum">
              {course.sections.map((s, si) => (
                <div key={s.id} className="csection"
                  draggable
                  onDragStart={() => (dragRef.current = { kind: "section", from: si })}
                  onDragOver={(e) => { if (dragRef.current?.kind === "section") { e.preventDefault(); e.currentTarget.classList.add("dragover"); } }}
                  onDragLeave={(e) => e.currentTarget.classList.remove("dragover")}
                  onDrop={(e) => { e.currentTarget.classList.remove("dragover"); if (dragRef.current?.kind === "section" && dragRef.current.from !== si) reorderSections(dragRef.current.from, si); dragRef.current = null; }}>
                  <div className="csec-head">
                    <span className="drag-handle"><MIcon name="grip" size={18} /></span>
                    <input className="titlein" value={s.title} onChange={(e) => updateSection(s.id, { title: e.target.value })} />
                    <button className="row-act danger" title="Remove section" onClick={() => removeSection(s.id)}><MIcon name="trash" size={16} /></button>
                  </div>
                  <div className="lessons">
                    {s.lessons.map((l, li) => (
                      <div key={l.id} className="lesson"
                        draggable
                        onDragStart={(e) => { e.stopPropagation(); dragRef.current = { kind: "lesson", sid: s.id, from: li }; }}
                        onDragOver={(e) => { if (dragRef.current?.kind === "lesson" && dragRef.current.sid === s.id) { e.preventDefault(); e.currentTarget.classList.add("dragover"); } }}
                        onDragLeave={(e) => e.currentTarget.classList.remove("dragover")}
                        onDrop={(e) => { e.stopPropagation(); e.currentTarget.classList.remove("dragover"); if (dragRef.current?.kind === "lesson" && dragRef.current.sid === s.id && dragRef.current.from !== li) reorderLessons(s.id, dragRef.current.from, li); dragRef.current = null; }}>
                        <span className="drag-handle"><MIcon name="grip" size={16} /></span>
                        <span className={`tic ${l.type}`} style={{ width: 24, height: 24, borderRadius: 6, display: "grid", placeItems: "center", background: "var(--canvas-soft)", color: "var(--ink-deep)" }}><MIcon name={window.typeIcon(l.type)} size={13} /></span>
                        <input value={l.title} onChange={(e) => updateLesson(s.id, l.id, { title: e.target.value })} />
                        <select className="selectmini" style={{ padding: "5px 26px 5px 9px", fontSize: 12 }} value={l.type} onChange={(e) => updateLesson(s.id, l.id, { type: e.target.value })}>
                          <option value="video">Video</option><option value="pdf">PDF</option><option value="quiz">Quiz</option>
                        </select>
                        <button className="row-act danger" title="Remove lesson" onClick={() => removeLesson(s.id, l.id)}><MIcon name="x" size={15} /></button>
                      </div>
                    ))}
                    <button className="addrow" onClick={() => addLesson(s.id)}><MIcon name="plus" size={15} />Add lesson</button>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 14 }} onClick={addSection}><MIcon name="plus" size={16} />Add section</button>
          </div>
        )}

        {/* step 3: settings */}
        {step === 2 && (
          <div className="panel panel-pad">
            <div className="settingrow">
              <div className="sr-body"><h4>Visibility</h4><p>Public courses appear in the catalog. Unlisted are link-only.</p></div>
              <select className="selectmini" value={course.visibility} onChange={(e) => set({ visibility: e.target.value })}><option value="public">Public</option><option value="unlisted">Unlisted</option><option value="private">Private</option></select>
            </div>
            <div className="settingrow">
              <div className="sr-body"><h4>Enrollment limit</h4><p>Cap the number of students. Leave blank for unlimited.</p></div>
              <input className="dateinput" style={{ width: 120 }} type="number" min="0" value={course.enrollmentLimit} onChange={(e) => set({ enrollmentLimit: e.target.value })} placeholder="Unlimited" />
            </div>
            <div className="settingrow">
              <div className="sr-body"><h4>Completion certificate</h4><p>Issue a certificate when a student finishes the course.</p></div>
              <Switch checked={course.certificate} onChange={(v) => set({ certificate: v })} />
            </div>
          </div>
        )}

        {/* step 4: preview */}
        {step === 3 && (
          <div className="panel panel-pad">
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <span className="badge badge-soft">{course.category}</span>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, margin: "12px 0 6px", color: "var(--ink)" }}>{course.title || "Untitled course"}</h2>
                <p style={{ font: "var(--body-md)", color: "var(--body)", margin: "0 0 14px" }}>{course.description || "No description yet."}</p>
                <div style={{ display: "flex", gap: 18, font: "var(--body-sm)", color: "var(--mute)" }}>
                  <span>&#8377;{course.price.toLocaleString("en-IN")}</span><span>{course.sections.length} sections</span><span>{totalLessons} lessons</span><span>{course.certificate ? "Certificate" : "No certificate"}</span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 20 }}>
              {course.sections.map((s, i) => (
                <div key={s.id} style={{ marginBottom: 14 }}>
                  <div style={{ font: "var(--body-md-strong)", color: "var(--ink)", marginBottom: 8 }}>{i + 1}. {s.title}</div>
                  {s.lessons.map((l) => (
                    <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0 8px 16px", font: "var(--body-sm)", color: "var(--body)" }}>
                      <MIcon name={window.typeIcon(l.type)} size={15} />{l.title}<span className="muted" style={{ marginLeft: "auto", font: "var(--caption)" }}>{l.type}</span>
                    </div>
                  ))}
                  {s.lessons.length === 0 && <div className="muted" style={{ font: "var(--caption)", paddingLeft: 16 }}>No lessons</div>}
                </div>
              ))}
              {course.sections.length === 0 && <p className="muted">No curriculum added. Go back to step 2 to add sections.</p>}
            </div>
          </div>
        )}

        {/* footer nav */}
        <div className="builder-foot">
          {step > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setStep((s) => s - 1)}><MIcon name="chevronL" size={16} />Back</button>}
          <div className="bf-space">
            <button className="btn btn-ghost btn-sm" onClick={saveDraft}>Save draft</button>
            {step < STEPS.length - 1
              ? <button className="btn btn-green btn-sm" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>Next<MIcon name="arrow" size={16} /></button>
              : <button className="btn btn-green btn-sm" onClick={publish}><MIcon name="send" size={16} />Publish course</button>}
          </div>
        </div>
      </div>
    </Shell>
  );
}

Object.assign(window, { CoursesList, CourseBuilder });
