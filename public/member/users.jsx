/* global React, window */
/* =========================================================================
   Member Portal — Student management (/member/users), Admin only
   ========================================================================= */
const { useState, useMemo } = React;
const { useMemberData } = window;
const { MIcon, StatusPill, useMToast, useConfirm } = window;
const { Shell } = window;

function UsersScreen() {
  const data = useMemberData();
  const { push } = useMToast();
  const confirm = useConfirm();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [viewing, setViewing] = useState(null);

  const rows = useMemo(() => data.students.filter((s) => {
    if (q.trim() && !(s.name.toLowerCase().includes(q.trim().toLowerCase()) || s.email.toLowerCase().includes(q.trim().toLowerCase()))) return false;
    if (status !== "all" && s.status !== status) return false;
    return true;
  }), [data.students, q, status]);

  const suspend = (s) => { data.setStudentStatus(s.id, s.status === "suspended" ? "active" : "suspended"); push(s.status === "suspended" ? `Reactivated ${s.name}` : `Suspended ${s.name}`); };
  const remove = async (s) => {
    const ok = await confirm({ title: "Delete student?", message: `${s.name}'s account and enrollment records will be removed.`, confirm: "Delete", danger: true, icon: "trash" });
    if (ok) { data.deleteStudent(s.id); push(`Deleted ${s.name}`); }
  };

  return (
    <Shell title="Students" subtitle={`${rows.length} of ${data.students.length} accounts`}>
      <div className="reveal-fade">
        <div className="toolbar">
          <div className="tb-search"><span className="ic"><MIcon name="search" size={17} /></span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email" /></div>
          <select className="selectmini" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All status</option><option value="active">Active</option><option value="suspended">Suspended</option></select>
        </div>

        {rows.length === 0 ? (
          <div className="mempty"><div className="eic"><MIcon name="users" size={28} /></div><h3>No students found</h3><p>No accounts match your search or filter.</p></div>
        ) : (
          <div className="tablewrap">
            <table className="dt">
              <thead><tr><th>Student</th><th>Enrolled</th><th>Joined</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td><div className="cellflex"><span className="avatar sm" style={{ width: 34, height: 34, fontSize: 14 }}>{s.name.charAt(0)}</span><div><div className="t-title">{s.name}</div><div className="t-sub">{s.email}</div></div></div></td>
                    <td>{s.enrolled} course{s.enrolled !== 1 ? "s" : ""}</td>
                    <td className="muted">{s.joined}</td>
                    <td><StatusPill status={s.status} /></td>
                    <td><div className="actions">
                      <button className="row-act" title="View profile" onClick={() => setViewing(s)}><MIcon name="eye" size={16} /></button>
                      <button className="row-act" title={s.status === "suspended" ? "Reactivate" : "Suspend"} onClick={() => suspend(s)}><MIcon name={s.status === "suspended" ? "check" : "lock"} size={16} /></button>
                      <button className="row-act danger" title="Delete" onClick={() => remove(s)}><MIcon name="trash" size={16} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewing && (
        <div className="mscrim open" onClick={(e) => { if (e.target === e.currentTarget) setViewing(null); }}>
          <div className="mmodal" role="dialog" aria-modal="true">
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
              <span className="avatar lg">{viewing.name.charAt(0)}</span>
              <div><h3 style={{ margin: 0 }}>{viewing.name}</h3><div className="muted" style={{ font: "var(--body-sm)" }}>{viewing.email}</div></div>
            </div>
            <div className="mrow" style={{ boxShadow: "inset 0 -1px 0 var(--hair)", display: "flex", justifyContent: "space-between", padding: "11px 0", font: "var(--body-sm)", color: "var(--body)" }}>Enrolled courses <span style={{ color: "var(--ink)", fontWeight: 600 }}>{viewing.enrolled}</span></div>
            <div className="mrow" style={{ boxShadow: "inset 0 -1px 0 var(--hair)", display: "flex", justifyContent: "space-between", padding: "11px 0", font: "var(--body-sm)", color: "var(--body)" }}>Joined <span style={{ color: "var(--ink)", fontWeight: 600 }}>{viewing.joined}</span></div>
            <div className="mrow" style={{ display: "flex", justifyContent: "space-between", padding: "11px 0 0", font: "var(--body-sm)", color: "var(--body)" }}>Status <StatusPill status={viewing.status} /></div>
            <div className="mactions" style={{ marginTop: 22 }}><button className="btn btn-green btn-sm" onClick={() => setViewing(null)}>Close</button></div>
          </div>
        </div>
      )}
    </Shell>
  );
}

window.UsersScreen = UsersScreen;
