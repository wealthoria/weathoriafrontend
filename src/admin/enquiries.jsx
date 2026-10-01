/* global React, window */

import React, { useEffect, useMemo, useState } from "react";

const { MIcon } = window;

function safeTimestamp(value) {
  if (!value) return 0;

  if (typeof value === "number") {
    return value;
  }

  if (value?.toDate && typeof value.toDate === "function") {
    return value.toDate().getTime();
  }

  if (value?.seconds) {
    return Number(value.seconds) * 1000;
  }

  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value) {
  const time = safeTimestamp(value);

  if (!time) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(time));
}

function Enquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!window.db || typeof window.db.collection !== "function") {
      setError("Firestore database is not available.");
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = window.db
      .collection("enquiries")
      .onSnapshot(
        (snapshot) => {
          const rows = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          rows.sort((a, b) => safeTimestamp(b.createdAt) - safeTimestamp(a.createdAt));
          setEnquiries(rows);
          setError("");
          setLoading(false);
        },
        (err) => {
          console.error("Enquiries listener failed:", err);
          setError("Unable to load enquiries.");
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  const filteredEnquiries = useMemo(() => {
    const query = search.trim().toLowerCase();

    return enquiries.filter((item) => {
      const status = String(item.status || "new").toLowerCase();
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!query) return true;

      return [
        item.name,
        item.email,
        item.phone,
        item.city,
        item.interest,
        item.message,
        item.status
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [enquiries, search, statusFilter]);

  const counts = useMemo(() => {
    const result = { total: enquiries.length, new: 0, contacted: 0, closed: 0 };
    enquiries.forEach((item) => {
      const status = String(item.status || "new").toLowerCase();
      if (status === "new") result.new += 1;
      if (status === "contacted") result.contacted += 1;
      if (status === "closed") result.closed += 1;
    });
    return result;
  }, [enquiries]);

  const handleStatusChange = async (id, status) => {
    try {
      await window.db.collection("enquiries").doc(id).update({
        status,
        updatedAt: new Date()
      });
      setSelected((prev) => (prev?.id === id ? { ...prev, status } : prev));
    } catch (err) {
      console.error("Failed to update enquiry status:", err);
      alert("Unable to update enquiry status.");
    }
  };

  const getStatusMeta = (status) => {
    const value = String(status || "new").toLowerCase();
    if (value === "contacted") {
      return { label: "Contacted", background: "#eef7ff", color: "#246bce", border: "#cfe3ff" };
    }
    if (value === "closed") {
      return { label: "Closed", background: "#f2f4f7", color: "#667085", border: "#dfe3e8" };
    }
    return { label: "New", background: "#eefbf2", color: "#198754", border: "#ccefd7" };
  };

  const icon = (name, size = 16) => (MIcon ? <MIcon name={name} size={size} /> : null);

  return (
    <div
      className="admin-page enquiries-page"
      style={{ maxWidth: 1440, margin: "0 auto", paddingBottom: 32 }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 20,
          marginBottom: 22,
          flexWrap: "wrap"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
          
            <h2 style={{ margin: 0, fontSize: 25, lineHeight: 1.15, fontWeight: 750, letterSpacing: "-.02em" }}>
              Enquiries
            </h2>
          </div>
          <p style={{ margin: "0 0 0 48px", color: "var(--muted, #667085)", fontSize: 14 }}>
            Review and manage enquiries submitted through the website.
          </p>
        </div>

      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 14,
          marginBottom: 20
        }}
      >
        {[
          ["Total enquiries", counts.total, "inbox", "#f5f7fa", "#e9eef5"],
          ["New", counts.new, "bell", "#f0fbf3", "#d9f4df"],
          ["Contacted", counts.contacted, "phone", "#f2f7ff", "#dceaff"],
          ["Closed", counts.closed, "check", "#f6f7f8", "#e6e9ed"]
        ].map(([label, value, iconName, tone, iconBg]) => (
          <div
            key={label}
            style={{
              minWidth: 0,
              padding: 16,
              borderRadius: 14,
              border: "1px solid var(--border, #e8ebef)",
              background: "var(--card, #fff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: "var(--muted, #667085)", fontWeight: 600, marginBottom: 7 }}>
                {label}
              </div>
              <div style={{ fontSize: 24, lineHeight: 1, fontWeight: 760, color: "#17191c" }}>{value}</div>
            </div>
            <div
              style={{
                width: 40,
                height: 40,
                flexShrink: 0,
                borderRadius: 11,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: iconBg,
                color: "#344054"
              }}
            >
              {icon(iconName, 17)}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div
          style={{
            padding: "13px 15px",
            borderRadius: 12,
            background: "#fff3f2",
            border: "1px solid #f8d5d1",
            color: "#b42318",
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 600
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          background: "var(--card, #fff)",
          border: "1px solid var(--border, #e8ebef)",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 1px 2px rgba(16,24,40,.03)"
        }}
      >
        <div
          style={{
            padding: 16,
            borderBottom: "1px solid var(--border, #eef0f2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap"
          }}
        >
          <div style={{ position: "relative", flex: "1 1 360px", minWidth: 240 }}>
            <div
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#98a2b3",
                pointerEvents: "none"
              }}
            >
              {icon("search", 16)}
            </div>
            <input
              className="input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone or interest..."
              style={{ width: "100%", paddingLeft: 36, minHeight: 42, borderRadius: 10 }}
            />
          </div>

          <select
            className="select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ minWidth: 165, minHeight: 42, borderRadius: 10 }}
          >
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="closed">Closed</option>
          </select>

          <div style={{ fontSize: 13, color: "#667085", whiteSpace: "nowrap" }}>
            {filteredEnquiries.length} of {enquiries.length}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 56, textAlign: "center", color: "var(--muted, #667085)" }}>
            Loading enquiries...
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div style={{ padding: "66px 24px", textAlign: "center" }}>
            <div
              style={{
                width: 52,
                height: 52,
                margin: "0 auto 12px",
                borderRadius: "50%",
                background: "#f4f6f8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#98a2b3"
              }}
            >
              {icon("search", 20)}
            </div>
            <div style={{ fontWeight: 700, color: "#344054", marginBottom: 4 }}>No enquiries found</div>
            <div style={{ fontSize: 13, color: "#98a2b3" }}>Try changing the search or status filter.</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 980, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fafbfc", borderBottom: "1px solid #eef0f2" }}>
                  {["Enquirer", "Contact", "Interest", "Status", "Submitted", ""].map((heading, index) => (
                    <th
                      key={`${heading}-${index}`}
                      style={{
                        textAlign: "left",
                        padding: "13px 16px",
                        fontSize: 11,
                        fontWeight: 750,
                        letterSpacing: ".04em",
                        textTransform: "uppercase",
                        color: "#667085",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEnquiries.map((item) => {
                  const status = String(item.status || "new").toLowerCase();
                  const statusMeta = getStatusMeta(status);

                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid #f0f2f4" }}>
                      <td style={{ padding: "15px 16px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 180 }}>
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              flexShrink: 0,
                              borderRadius: "50%",
                              background: "#f1f3f6",
                              color: "#344054",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 750,
                              fontSize: 14
                            }}
                          >
                            {String(item.name || "?").trim().charAt(0).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: "#1d2939",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: 220
                              }}
                            >
                              {item.name || "—"}
                            </div>
                            <div style={{ marginTop: 3, fontSize: 12, color: "#98a2b3" }}>{item.city || "No city"}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "15px 16px", verticalAlign: "middle" }}>
                        <div style={{ fontSize: 13, color: "#344054", whiteSpace: "nowrap" }}>{item.email || "—"}</div>
                        {item.phone && <div style={{ marginTop: 3, fontSize: 12, color: "#98a2b3" }}>{item.phone}</div>}
                      </td>

                      <td style={{ padding: "15px 16px", verticalAlign: "middle" }}>
                        <div
                          style={{
                            maxWidth: 190,
                            fontSize: 13,
                            color: "#475467",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}
                          title={item.interest || ""}
                        >
                          {item.interest || "—"}
                        </div>
                      </td>

                      <td style={{ padding: "15px 16px", verticalAlign: "middle" }}>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 7,
                            padding: "6px 9px",
                            borderRadius: 999,
                            background: statusMeta.background,
                            color: statusMeta.color,
                            border: `1px solid ${statusMeta.border}`,
                            fontSize: 12,
                            fontWeight: 700
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
                          {statusMeta.label}
                        </div>
                      </td>

                      <td style={{ padding: "15px 16px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        <div style={{ fontSize: 13, color: "#475467" }}>{formatDate(item.createdAt)}</div>
                      </td>

                      <td style={{ padding: "15px 16px", verticalAlign: "middle", textAlign: "right" }}>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => setSelected(item)}
                          style={{
                            minHeight: 36,
                            padding: "7px 10px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 7,
                            borderRadius: 9
                          }}
                        >
                          {icon("eye", 15)}
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,.46)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 9999,
            backdropFilter: "blur(2px)"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(680px, 100%)",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: 18,
              border: "1px solid #e7eaee",
              boxShadow: "0 24px 80px rgba(0,0,0,.18)"
            }}
          >
            <div
              style={{
                padding: "20px 22px 18px",
                borderBottom: "1px solid #eef0f2",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 16
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    flexShrink: 0,
                    borderRadius: "50%",
                    background: "#f1f3f6",
                    color: "#344054",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 750,
                    fontSize: 16
                  }}
                >
                  {String(selected.name || "?").trim().charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 19,
                      color: "#101828",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
                  >
                    {selected.name || "Enquiry"}
                  </h3>
                  <div style={{ marginTop: 4, color: "#98a2b3", fontSize: 12 }}>
                    Submitted {formatDate(selected.createdAt)}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setSelected(null)}
                style={{
                  minWidth: 36,
                  width: 36,
                  height: 36,
                  padding: 0,
                  borderRadius: 9,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                aria-label="Close"
              >
                {icon("x", 16)}
              </button>
            </div>

            <div style={{ padding: 22 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 12,
                  marginBottom: 18
                }}
              >
                {[
                  ["Email", selected.email],
                  ["Phone", selected.phone],
                  ["City", selected.city],
                  ["Interest", selected.interest]
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      padding: "13px 14px",
                      borderRadius: 12,
                      background: "#f8fafb",
                      border: "1px solid #eef1f4"
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: ".04em",
                        color: "#98a2b3",
                        marginBottom: 6
                      }}
                    >
                      {label}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#344054", wordBreak: "break-word" }}>
                      {value || "—"}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#667085", marginBottom: 8 }}>Status</div>
                <select
                  value={String(selected.status || "new").toLowerCase()}
                  onChange={(e) => handleStatusChange(selected.id, e.target.value)}
                  className="select"
                  style={{ width: "100%", minHeight: 42, borderRadius: 10 }}
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#667085", marginBottom: 8 }}>Message</div>
                <div
                  style={{
                    padding: 15,
                    borderRadius: 12,
                    background: "#f8fafb",
                    border: "1px solid #eef1f4",
                    whiteSpace: "pre-wrap",
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "#344054",
                    minHeight: 90
                  }}
                >
                  {selected.message || "No message provided."}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "14px 22px",
                borderTop: "1px solid #eef0f2",
                display: "flex",
                justifyContent: "flex-end"
              }}
            >
              <button type="button" className="btn btn-ghost" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          color: "#6b7280",
          marginBottom: 4
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 14,
          fontWeight: 500
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "14px 16px",
  fontSize: 12,
  fontWeight: 700,
  color: "#6b7280",
  whiteSpace: "nowrap"
};

const tdStyle = {
  padding: "15px 16px",
  fontSize: 13,
  verticalAlign: "top"
};

window.AdminEnquiries = Enquiries;

export default Enquiries;