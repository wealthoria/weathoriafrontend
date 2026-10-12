import React from "react";

/* global React, window */

const {
  useState,
  useEffect,
  useMemo,
  useCallback
} = React;

const getAdmin = (name) => window[name];

const API_BASE = "https://asia-south1-wealthoria-6fc11.cloudfunctions.net/api";

const formatINR = (val) => {
  const n = Number(val || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(n);
};

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return "—";
  const date = new Date(timestamp);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

/* =========================================================
   MAIN ADMIN META ADS & LEADS COMPONENT
   ========================================================= */

function AdminMetaAds() {
  const useMToast = getAdmin("useMToast");
  const toast = typeof useMToast === "function" ? useMToast() || {} : {};
  const pushToast = toast.push || (() => {});

  const [loading, setLoading] = useState(true);
  const [syncingLeads, setSyncingLeads] = useState(false);
  const [status, setStatus] = useState(null);
  const [campaignsData, setCampaignsData] = useState({ campaigns: [], summary: {} });
  const [leadsList, setLeadsList] = useState([]);
  const [activeTab, setActiveTab] = useState("CAMPAIGNS"); // "CAMPAIGNS" | "LEADS"
  const [datePreset, setDatePreset] = useState("today"); // "today" | "yesterday" | "last_7d" | "last_30d" | "maximum"
  const [search, setSearch] = useState("");

  /* ---------------------------------------------------------
     LOAD STATUS, CAMPAIGNS & LEADS
     --------------------------------------------------------- */
  const fetchData = useCallback(async (preset = datePreset) => {
    setLoading(true);
    try {
      // 1. Fetch Meta Ads Status
      const statusRes = await fetch(`${API_BASE}/meta-ads/status`);
      const statusJson = await statusRes.json();
      setStatus(statusJson);

      if (statusJson.connected) {
        // 2. Fetch Active Campaigns & Insights with datePreset
        const campRes = await fetch(`${API_BASE}/meta-ads/campaigns?datePreset=${preset}`);
        const campJson = await campRes.json();
        if (campJson.success) {
          setCampaignsData(campJson);
        }

        // 3. Fetch Synced Leads
        const leadsRes = await fetch(`${API_BASE}/meta-ads/leads`);
        const leadsJson = await leadsRes.json();
        if (leadsJson.success && Array.isArray(leadsJson.data)) {
          setLeadsList(leadsJson.data);
        }
      }
    } catch (err) {
      console.error("Failed to load Meta Ads data:", err);
      pushToast("Failed to connect to Meta Ads API", "error");
    } finally {
      setLoading(false);
    }
  }, [datePreset, pushToast]);

  useEffect(() => {
    fetchData(datePreset);
  }, [datePreset, fetchData]);

  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [savingToken, setSavingToken] = useState(false);

  /* ---------------------------------------------------------
     HANDLE OAUTH CODE EXCHANGE ON REDIRECT BACK
     --------------------------------------------------------- */
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code) {
      (async () => {
        pushToast("Connecting your Meta Ads account...", "info");
        try {
          const res = await fetch(`${API_BASE}/meta-ads/exchange-code`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code,
              redirectUri: window.location.origin + window.location.pathname
            })
          });
          const json = await res.json();
          if (json.success) {
            pushToast("Meta Ads connected successfully!", "success");
            window.history.replaceState({}, document.title, window.location.pathname);
            fetchData();
          } else {
            pushToast(json.error || json.message || "Failed to exchange code", "error");
          }
        } catch (e) {
          pushToast("Network error exchanging Meta code", "error");
        }
      })();
    }
  }, [fetchData, pushToast]);

  /* ---------------------------------------------------------
     SAVE TOKEN MANUALLY (FALLBACK)
     --------------------------------------------------------- */
  const handleSaveToken = async () => {
    if (!tokenInput.trim()) return pushToast("Please paste an Access Token", "error");
    setSavingToken(true);
    try {
      const res = await fetch(`${API_BASE}/meta-ads/save-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: tokenInput.trim() })
      });
      const data = await res.json();
      if (data.success) {
        pushToast(data.message || "Connected successfully!", "success");
        setShowTokenModal(false);
        setTokenInput("");
        fetchData();
      } else {
        pushToast(data.error || data.message || "Failed to verify token", "error");
      }
    } catch (e) {
      pushToast("Network error verifying token", "error");
    } finally {
      setSavingToken(false);
    }
  };

  /* ---------------------------------------------------------
     CONNECT META AD ACCOUNT VIA OAUTH
     --------------------------------------------------------- */
  const handleConnect = async () => {
    try {
      const res = await fetch(`${API_BASE}/meta-ads/auth-url`);
      const data = await res.json();
      if (data.success && data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        pushToast(data.message || "Failed to generate Meta auth URL", "error");
      }
    } catch (e) {
      pushToast("Network error initiating Meta connection", "error");
    }
  };

  /* ---------------------------------------------------------
     SYNC LEADS FROM META INSTANT FORMS
     --------------------------------------------------------- */
  const handleSyncLeads = async () => {
    setSyncingLeads(true);
    try {
      const res = await fetch(`${API_BASE}/meta-ads/sync-leads`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        pushToast(data.message || "Leads synced successfully!", "success");
        fetchData();
      } else {
        pushToast(data.message || "Failed to sync Meta leads", "error");
      }
    } catch (e) {
      pushToast("Network error syncing Meta leads", "error");
    } finally {
      setSyncingLeads(false);
    }
  };

  const summary = campaignsData.summary || {};
  const campaigns = campaignsData.campaigns || [];

  const filteredCampaigns = useMemo(() => {
    if (!search.trim()) return campaigns;
    const q = search.toLowerCase();
    return campaigns.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.objective || "").toLowerCase().includes(q) ||
        (c.status || "").toLowerCase().includes(q)
    );
  }, [campaigns, search]);

  const filteredLeads = useMemo(() => {
    if (!search.trim()) return leadsList;
    const q = search.toLowerCase();
    return leadsList.filter(
      (l) =>
        (l.name || "").toLowerCase().includes(q) ||
        (l.phone || "").toLowerCase().includes(q) ||
        (l.email || "").toLowerCase().includes(q) ||
        (l.city || "").toLowerCase().includes(q) ||
        (l.campaignName || "").toLowerCase().includes(q)
    );
  }, [leadsList, search]);

  return (
    <div className="reveal-fade" style={{ padding: "8px 0 40px" }}>
      {/* SCOPED STYLES */}
      <style>{`
        .meta-stat-card {
          background: var(--surface, #ffffff);
          border: 1px solid var(--line, #e5e7eb);
          border-radius: 16px;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .meta-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.06);
        }
        .meta-pill-btn {
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          border: 1px solid var(--line, #e5e7eb);
          background: var(--surface, #ffffff);
          color: var(--fg, #374151);
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .meta-pill-btn.active {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
        }
        .meta-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13px;
        }
        .meta-table th {
          background: var(--bg-muted, #f9fafb);
          padding: 12px 16px;
          font-weight: 700;
          color: var(--mute, #6b7280);
          border-bottom: 1px solid var(--line, #e5e7eb);
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.05em;
        }
        .meta-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--line, #f3f4f6);
          color: var(--fg, #1f2937);
        }
        .meta-table tr:hover td {
          background: rgba(37, 99, 235, 0.02);
        }
      `}</style>

      {/* =======================================================
          TOP ACCOUNT & ADS STATUS BANNER
          ======================================================= */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(204, 35, 102, 0.08) 100%)",
          border: "1px solid rgba(37, 99, 235, 0.2)",
          borderRadius: "18px",
          padding: "20px 24px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "16px",
              background: "linear-gradient(135deg, #1877f2, #0066ff, #d946ef)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 24,
              boxShadow: "0 4px 14px rgba(24, 119, 242, 0.3)"
            }}
          >
            📢
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--fg, #111827)" }}>
                {status?.selectedAdAccountName || status?.userName || "Wealthoria Ads Manager"}
              </h3>
              <span
                style={{
                  background: status?.connected ? "#10b981" : "#ef4444",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "2px 7px",
                  borderRadius: "12px",
                  letterSpacing: "0.03em"
                }}
              >
                ● {status?.connected ? "CONNECTED" : "NOT CONNECTED"}
              </span>
            </div>

            <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--mute, #6b7280)" }}>
              {status?.connected
                ? `Meta Marketing API · ${campaigns.length} Active Campaigns · ${leadsList.length} Leads Synced`
                : "Connect your Meta / Facebook Ads account to track campaigns & sync lead forms automatically."}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {!status?.connected ? (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                className="meta-pill-btn"
                onClick={handleConnect}
                style={{ background: "#1877f2", color: "#fff", borderColor: "#1877f2" }}
              >
                🚀 Connect Meta Ads Account
              </button>

              <button
                type="button"
                className="meta-pill-btn"
                onClick={() => setShowTokenModal(true)}
                style={{ background: "#059669", color: "#fff", borderColor: "#059669" }}
              >
                🔑 Paste Token
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="meta-pill-btn"
                onClick={handleSyncLeads}
                disabled={syncingLeads}
                style={{ background: "#2563eb", color: "#fff", borderColor: "#2563eb" }}
              >
                ⚡ {syncingLeads ? "Syncing Leads..." : "Sync Lead Ads"}
              </button>

              <button
                type="button"
                className="meta-pill-btn"
                onClick={fetchData}
                disabled={loading}
              >
                🔄 {loading ? "Refreshing..." : "Refresh Insights"}
              </button>

              <a
                href="https://adsmanager.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="meta-pill-btn"
                style={{ textDecoration: "none" }}
              >
                Meta Ads Manager ↗
              </a>
            </>
          )}
        </div>
      </div>

      {/* =======================================================
          DATE PRESET SELECTOR & CONTROLS
          ======================================================= */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px"
        }}
      >
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[
            { id: "today", label: "Today" },
            { id: "yesterday", label: "Yesterday" },
            { id: "last_7d", label: "Last 7 Days" },
            { id: "last_30d", label: "Last 30 Days" },
            { id: "maximum", label: "Lifetime" }
          ].map((dp) => (
            <button
              key={dp.id}
              type="button"
              className={`meta-pill-btn ${datePreset === dp.id ? "active" : ""}`}
              onClick={() => setDatePreset(dp.id)}
              style={{ fontSize: 12, padding: "6px 12px" }}
            >
              {dp.label}
            </button>
          ))}
        </div>

        <span style={{ fontSize: 12, color: "var(--mute, #6b7280)", fontWeight: 600 }}>
          {status?.connected ? `Showing ${datePreset.toUpperCase()} performance` : ""}
        </span>
      </div>

      {/* =======================================================
          KPI METRICS SUMMARY CARDS
          ======================================================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px"
        }}
      >
        <div className="meta-stat-card">
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--mute, #6b7280)", textTransform: "uppercase" }}>
            Total Spend
          </span>
          <b style={{ fontSize: 24, fontWeight: 800, color: "var(--fg, #111827)" }}>
            {formatINR(summary.totalSpend || 0)}
          </b>
          <span style={{ fontSize: 11.5, color: "#10b981", fontWeight: 600 }}>
            Budget: ₹300/day
          </span>
        </div>

        <div className="meta-stat-card">
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--mute, #6b7280)", textTransform: "uppercase" }}>
            Reach & Impressions
          </span>
          <b style={{ fontSize: 24, fontWeight: 800, color: "var(--fg, #111827)" }}>
            {Number(summary.totalReach || 0).toLocaleString("en-IN")}
          </b>
          <span style={{ fontSize: 11.5, color: "var(--mute, #6b7280)" }}>
            {Number(summary.totalImpressions || 0).toLocaleString("en-IN")} Impressions
          </span>
        </div>

        <div className="meta-stat-card">
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--mute, #6b7280)", textTransform: "uppercase" }}>
            Link Clicks & CPC
          </span>
          <b style={{ fontSize: 24, fontWeight: 800, color: "#2563eb" }}>
            {Number(summary.totalClicks || 0).toLocaleString("en-IN")} Clicks
          </b>
          <span style={{ fontSize: 11.5, color: "var(--mute, #6b7280)" }}>
            Avg CPC: ₹{summary.avgCpc || "0.00"}
          </span>
        </div>

        <div className="meta-stat-card">
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--mute, #6b7280)", textTransform: "uppercase" }}>
            Purchases & Leads
          </span>
          <b style={{ fontSize: 24, fontWeight: 800, color: "#10b981" }}>
            {summary.totalPurchases || 0} Purchases
          </b>
          <span style={{ fontSize: 11.5, color: "var(--mute, #6b7280)" }}>
            {summary.totalLeads || 0} Leads
          </span>
        </div>
      </div>

      {/* =======================================================
          TABS & SEARCH BAR
          ======================================================= */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          marginBottom: "16px"
        }}
      >
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            className={`meta-pill-btn ${activeTab === "CAMPAIGNS" ? "active" : ""}`}
            onClick={() => setActiveTab("CAMPAIGNS")}
          >
            📊 Ad Campaigns ({campaigns.length})
          </button>
          <button
            type="button"
            className={`meta-pill-btn ${activeTab === "LEADS" ? "active" : ""}`}
            onClick={() => setActiveTab("LEADS")}
          >
            🎯 Synced Leads ({leadsList.length})
          </button>
        </div>

        <input
          type="text"
          placeholder={activeTab === "CAMPAIGNS" ? "Search campaigns..." : "Search leads by name, phone, email..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "8px 14px",
            borderRadius: "10px",
            border: "1px solid var(--line, #e5e7eb)",
            fontSize: "13px",
            width: "280px",
            outline: "none",
            background: "var(--surface, #fff)",
            color: "var(--fg, #111827)"
          }}
        />
      </div>

      {/* =======================================================
          TAB 1: CAMPAIGNS TABLE
          ======================================================= */}
      {activeTab === "CAMPAIGNS" && (
        <div
          style={{
            background: "var(--surface, #ffffff)",
            border: "1px solid var(--line, #e5e7eb)",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
          }}
        >
          {loading ? (
            <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--mute, #6b7280)" }}>
              Loading Meta Ad campaigns...
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--mute, #6b7280)" }}>
              No ad campaigns found. Run your first campaign on Meta Ads Manager to see live ROI here.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="meta-table">
                <thead>
                  <tr>
                    <th>Campaign Name</th>
                    <th>Status</th>
                    <th>Spend (₹)</th>
                    <th>Reach</th>
                    <th>Impressions</th>
                    <th>Clicks</th>
                    <th>CPC (₹)</th>
                    <th>CTR</th>
                    <th>Purchases</th>
                    <th>Cost/Purchase</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <b style={{ color: "var(--fg, #111827)", display: "block" }}>{c.name}</b>
                        <span style={{ fontSize: 11, color: "var(--mute, #6b7280)" }}>
                          Budget: {c.dailyBudget ? `₹${c.dailyBudget}/day` : c.lifetimeBudget ? `₹${c.lifetimeBudget} lifetime` : "—"}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            background: c.status === "ACTIVE" ? "rgba(16, 185, 129, 0.15)" : "rgba(107, 114, 128, 0.15)",
                            color: c.status === "ACTIVE" ? "#059669" : "#6b7280",
                            fontSize: 11,
                            fontWeight: 800,
                            padding: "3px 8px",
                            borderRadius: "6px"
                          }}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <b>{formatINR(c.metrics?.spend || 0)}</b>
                      </td>
                      <td>
                        <span>{Number(c.metrics?.reach || 0).toLocaleString("en-IN")}</span>
                      </td>
                      <td>
                        <span>{Number(c.metrics?.impressions || 0).toLocaleString("en-IN")}</span>
                      </td>
                      <td>
                        <b style={{ color: "#2563eb" }}>{Number(c.metrics?.clicks || 0).toLocaleString("en-IN")}</b>
                      </td>
                      <td>
                        <span>{c.metrics?.cpc ? `₹${c.metrics.cpc.toFixed(2)}` : "—"}</span>
                      </td>
                      <td>
                        <span>{c.metrics?.ctr ? `${c.metrics.ctr.toFixed(2)}%` : "—"}</span>
                      </td>
                      <td>
                        <b style={{ color: "#10b981" }}>{c.metrics?.purchases || 0}</b>
                      </td>
                      <td>
                        <span>{c.metrics?.costPerPurchase > 0 ? `₹${c.metrics.costPerPurchase}` : "—"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =======================================================
          TAB 2: SYNCHRONIZED LEADS TABLE
          ======================================================= */}
      {activeTab === "LEADS" && (
        <div
          style={{
            background: "var(--surface, #ffffff)",
            border: "1px solid var(--line, #e5e7eb)",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
          }}
        >
          {filteredLeads.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--mute, #6b7280)" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🎯</div>
              <b>No Meta leads synced yet.</b>
              <p style={{ margin: "6px 0 16px", fontSize: 13 }}>
                Click "Sync Lead Ads" above to import instant leads from your active Facebook & Instagram ad forms.
              </p>
              <button
                type="button"
                className="meta-pill-btn"
                onClick={handleSyncLeads}
                disabled={syncingLeads}
                style={{ background: "#2563eb", color: "#fff", borderColor: "#2563eb" }}
              >
                ⚡ {syncingLeads ? "Syncing..." : "Sync Latest Leads"}
              </button>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="meta-table">
                <thead>
                  <tr>
                    <th>Lead Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>City</th>
                    <th>Campaign / Form</th>
                    <th>Captured Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((l, i) => (
                    <tr key={l.id || l.metaLeadId || i}>
                      <td>
                        <b style={{ color: "var(--fg, #111827)" }}>{l.name}</b>
                      </td>
                      <td>
                        {l.phone && l.phone !== "—" ? (
                          <a
                            href={`tel:${String(l.phone).replace(/[^\d+]/g, "")}`}
                            style={{ color: "#2563eb", textDecoration: "none", fontWeight: 600 }}
                          >
                            {l.phone}
                          </a>
                        ) : (
                          <span style={{ color: "var(--mute, #6b7280)" }}>—</span>
                        )}
                      </td>
                      <td>
                        <span style={{ color: "var(--mute, #6b7280)" }}>{l.email}</span>
                      </td>
                      <td>
                        <span>{l.city || "—"}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: "var(--fg, #111827)", display: "block" }}>
                          {l.campaignName}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--mute, #6b7280)" }}>
                          {l.formName}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: "var(--mute, #6b7280)" }}>
                          {formatRelativeTime(l.createdAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MANUAL TOKEN MODAL */}
      {showTokenModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "20px"
          }}
        >
          <div
            style={{
              background: "var(--surface, #ffffff)",
              borderRadius: "18px",
              padding: "28px",
              maxWidth: "520px",
              width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)"
            }}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: "var(--fg, #111827)" }}>
              Connect via Meta Access Token
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--mute, #6b7280)", lineHeight: 1.5 }}>
              Paste your Meta System User Token or Graph API Explorer token to link your ad account directly without OAuth redirect.
            </p>
            <textarea
              rows={4}
              placeholder="Paste Meta Access Token here (EAA...)"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid var(--line, #e5e7eb)",
                fontSize: "12px",
                fontFamily: "monospace",
                boxSizing: "border-box",
                outline: "none",
                marginBottom: "16px",
                background: "var(--bg-muted, #f9fafb)",
                color: "var(--fg, #111827)"
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="meta-pill-btn"
                onClick={() => setShowTokenModal(false)}
                disabled={savingToken}
              >
                Cancel
              </button>
              <button
                type="button"
                className="meta-pill-btn"
                onClick={handleSaveToken}
                disabled={savingToken}
                style={{ background: "#2563eb", color: "#fff", borderColor: "#2563eb" }}
              >
                {savingToken ? "Verifying..." : "Verify & Connect"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   PUBLIC EXPORT
   ========================================================= */

window.AdminMetaAds = AdminMetaAds;
export default AdminMetaAds;
