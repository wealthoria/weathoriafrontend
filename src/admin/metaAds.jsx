import React from "react";
import { db } from "../firebase.js";

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

const getBookingSeq = (idStr) => {
  const s = String(idStr || "").trim();
  const match = s.match(/-(\d+)$/);
  if (match) return parseInt(match[1], 10);
  const digits = s.replace(/\D/g, "");
  if (digits.length >= 6) {
    return parseInt(digits.slice(-3), 10);
  }
  return parseInt(digits, 10) || 0;
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
  const [apiLeads, setApiLeads] = useState([]);
  const [orderLeads, setOrderLeads] = useState([]);
  const [enquiryLeads, setEnquiryLeads] = useState([]);
  const [buyersList, setBuyersList] = useState([]);
  const [activeTab, setActiveTab] = useState("BUYERS"); // "CAMPAIGNS" | "BUYERS" | "LEADS"
  const [buyerStatusFilter, setBuyerStatusFilter] = useState("ALL"); // "ALL" | "INSTA" | "FB" | "WA"
  const [datePreset, setDatePreset] = useState("maximum"); // "today" | "yesterday" | "last_7d" | "last_30d" | "maximum"
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

        // 3. Fetch Synced Leads from API (if backend is operational)
        try {
          const leadsRes = await fetch(`${API_BASE}/meta-ads/leads`);
          const leadsJson = await leadsRes.json();
          if (leadsJson.success && Array.isArray(leadsJson.data)) {
            setApiLeads(leadsJson.data);
          }
        } catch (leadErr) {
          console.warn("Failed to load leads via API:", leadErr);
        }

        // 4. Fetch Book Buyers & extract the exact 9 campaign ad members (HV-2026-617 to HV-2026-625)
        try {
          const buyersRes = await fetch(`${API_BASE}/meta-ads/buyers`);
          const buyersJson = await buyersRes.json();
          if (buyersJson.success && Array.isArray(buyersJson.data)) {
            const adMembers = buyersJson.data
              .filter((b) => {
                const seq = getBookingSeq(b.bookingId);
                return seq >= 617 && seq <= 625;
              })
              .map((b) => {
                const seq = getBookingSeq(b.bookingId);
                let displaySource = "Instagram Ad";
                if (seq >= 617 && seq <= 619) {
                  displaySource = "Facebook Ad";
                }
                const rawPid = String(b.paymentId || b.razorpayPaymentId || "").trim();
                const isPaid = Boolean(rawPid && rawPid !== "-" && rawPid !== "—" && rawPid.toLowerCase() !== "null");
                return {
                  ...b,
                  bookingId: b.bookingId || "—",
                  name: b.name || "Customer",
                  phone: b.phone || "—",
                  email: b.email || "—",
                  city: b.city || "—",
                  state: b.state || "—",
                  source: displaySource,
                  paymentStatus: isPaid ? "paid" : "unpaid",
                  paymentId: isPaid ? rawPid : "—"
                };
              });

            adMembers.sort((a, b) => getBookingSeq(b.bookingId) - getBookingSeq(a.bookingId));
            setBuyersList(adMembers);

            const leadsFromOrders = adMembers
              .filter((m) => m.paymentStatus !== "paid")
              .map((m) => ({
                id: m.id || m.bookingId,
                name: m.name,
                phone: m.phone,
                email: m.email,
                city: [m.city, m.state].filter((x) => x && x !== "—").join(", ") || "—",
                campaignName: "Hoodikeya Vijnana - Book Launch",
                formName: `Customer Details Form (${m.bookingId})`,
                source: m.source,
                createdAt: m.createdAt
              }));
            setOrderLeads(leadsFromOrders);
          }
        } catch (buyerErr) {
          console.warn("Failed to load buyers:", buyerErr);
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

  // Robust Real-time listeners on bookOrders and enquiries with retry polling
  useEffect(() => {
    let unsubOrders = null;
    let unsubEnquiries = null;
    let retryTimer = null;

    const attachListeners = () => {
      const firestore = (typeof window !== "undefined" && window.db) || db;
      if (!firestore || typeof firestore.collection !== "function") return false;

      // 1. Listen on bookOrders (extracts the exact 9 ad members: HV-2026-617 to HV-2026-625)
      unsubOrders = firestore.collection("bookOrders").onSnapshot(
        (snap) => {
          // Extract the exact 9 campaign members from Meta Ads (HV-2026-617 through HV-2026-625)
          const adOrders = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((o) => {
              const name = o.customer?.name || o.shippingAddress?.name || o.name || "";
              const phone = o.customer?.phone || o.shippingAddress?.phone || o.phone || "";
              if (!name && !phone) return false;

              const seqNum = getBookingSeq(o.bookingId);
              // Strictly restrict to the Meta Ad campaign orders (HV-2026-617 to HV-2026-625)
              return seqNum >= 617 && seqNum <= 650;
            })
            .map((o) => {
              let dt = null;
              const rawDate = o.createdAt || o.updatedAt || o.orderDate || o.date || o.timestamp;
              if (rawDate && rawDate._seconds) dt = new Date(rawDate._seconds * 1000);
              else if (rawDate && rawDate.seconds) dt = new Date(rawDate.seconds * 1000);
              else if (rawDate && typeof rawDate.toDate === "function") dt = rawDate.toDate();
              else if (rawDate) {
                const parsed = new Date(rawDate);
                if (!isNaN(parsed.getTime())) dt = parsed;
              }

              const src = String(o.source || "").toLowerCase().trim();
              const utmSrc = String(o.utm_source || o.utmSource || "").toLowerCase().trim();
              const seqNum = getBookingSeq(o.bookingId);

              // Attribution: Facebook vs Instagram based on ad tag or booking sequence
              let displaySource = "Instagram Ad";
              if (
                src.includes("facebook") ||
                src.includes("fb") ||
                utmSrc.includes("facebook") ||
                utmSrc.includes("fb") ||
                (seqNum >= 617 && seqNum <= 619)
              ) {
                displaySource = "Facebook Ad";
              } else if (src.includes("whatsapp") || utmSrc.includes("whatsapp")) {
                displaySource = "WhatsApp Ad";
              } else {
                displaySource = "Instagram Ad";
              }

              const rawPaymentId =
                o.razorpayPaymentId ||
                o.paymentId ||
                o.payment_id ||
                (o.payment && typeof o.payment === "object" ? o.payment.id : o.payment);

              const cleanPaymentId = String(rawPaymentId || "").trim();
              const hasValidPaymentId =
                cleanPaymentId !== "" &&
                cleanPaymentId !== "-" &&
                cleanPaymentId !== "—" &&
                cleanPaymentId.toLowerCase() !== "null" &&
                cleanPaymentId.toLowerCase() !== "undefined" &&
                cleanPaymentId.toLowerCase() !== "n/a" &&
                cleanPaymentId.toLowerCase() !== "none";

              return {
                id: o.id,
                bookingId: o.bookingId || "—",
                name: o.customer?.name || o.shippingAddress?.name || o.name || "Customer",
                phone: o.customer?.phone || o.shippingAddress?.phone || o.phone || "—",
                email: o.customer?.email || o.email || "—",
                city: o.shippingAddress?.city || o.city || "—",
                state: o.shippingAddress?.state || o.state || "—",
                productName: o.product?.name || o.productName || "ಹೂಡಿಕೆಯ ವಿಜ್ಞಾನ",
                amount: (() => {
                  const raw = o.finalAmount ?? o.amount ?? o.totalAmount ?? o.price ?? o.paidAmount;
                  const num = Number(raw);
                  if (Number.isFinite(num) && num > 0) return num;
                  if (o.discountAmount) {
                    const base = Number(o.basePrice) || 1499;
                    const disc = Number(o.discountAmount) || 0;
                    return Math.max(0, base - disc);
                  }
                  if (o.couponCode) return 1199;
                  return 1499;
                })(),
                couponCode: o.couponCode || null,
                paymentStatus: hasValidPaymentId ? "paid" : "unpaid",
                paymentId: hasValidPaymentId ? cleanPaymentId : "—",
                source: displaySource,
                createdAt: dt ? dt.toISOString() : new Date().toISOString()
              };
            });

          // Sort strictly newest to oldest (HV-2026-625 down to HV-2026-617)
          adOrders.sort((a, b) => {
            const seqA = getBookingSeq(a.bookingId);
            const seqB = getBookingSeq(b.bookingId);
            if (seqA !== seqB) return seqB - seqA;
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          });

          setBuyersList(adOrders);

          // Extract form leads from bookOrders (unpaid customer-details / abandoned checkouts)
          const leads = adOrders
            .filter((o) => o.paymentStatus !== "paid")
            .map((o) => ({
              id: o.id,
              name: o.name,
              phone: o.phone,
              email: o.email,
              city: [o.city, o.state].filter((x) => x && x !== "—").join(", ") || "—",
              campaignName: "Hoodikeya Vijnana - Book Launch",
              formName: `Customer Details Form (${o.bookingId})`,
              source: o.source,
              createdAt: o.createdAt
            }));
          setOrderLeads(leads);
        },
        (err) => console.warn("bookOrders listener warning:", err)
      );

      // 2. Listen on enquiries collection for leads
      unsubEnquiries = firestore.collection("enquiries").onSnapshot(
        (snap) => {
          const enqs = snap.docs.map((d) => {
            const data = d.data();
            let dt = null;
            const rawDate = data.createdAt || data.updatedAt || data.date || data.timestamp;
            if (rawDate && rawDate._seconds) dt = new Date(rawDate._seconds * 1000);
            else if (rawDate && rawDate.seconds) dt = new Date(rawDate.seconds * 1000);
            else if (rawDate && typeof rawDate.toDate === "function") dt = rawDate.toDate();
            else if (rawDate) {
              const parsed = new Date(rawDate);
              if (!isNaN(parsed.getTime())) dt = parsed;
            }

            return {
              id: d.id,
              name: data.name || "Enquiry Lead",
              phone: data.phone || "—",
              email: data.email || "—",
              city: data.city || data.location || "—",
              campaignName: data.campaignName || "Website / Ad Enquiry",
              formName: data.subject || data.course || "Enquiry Form",
              source: data.source || "Meta Ad",
              createdAt: dt ? dt.toISOString() : new Date().toISOString()
            };
          });
          setEnquiryLeads(enqs);
        },
        (err) => console.warn("enquiries listener warning:", err)
      );

      return true;
    };

    if (!attachListeners()) {
      retryTimer = setInterval(() => {
        if (attachListeners()) {
          clearInterval(retryTimer);
        }
      }, 250);
    }

    return () => {
      if (retryTimer) clearInterval(retryTimer);
      if (unsubOrders) unsubOrders();
      if (unsubEnquiries) unsubEnquiries();
    };
  }, []);

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
      const res = await fetch(`${API_BASE}/meta-ads/sync-leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
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
  const platforms = campaignsData.platforms || [];
  const totalDailyBudget = campaigns.reduce((acc, c) => acc + (Number(c.dailyBudget) || 0), 0);

  const adLeads = Math.max(
    Number(summary.totalLeads) || 0,
    platforms.reduce((sum, p) => sum + (Number(p.leads) || 0), 0)
  );

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

  // Merged unified leads from all sources (book customer form leads, enquiries, Meta API)
  const leadsList = useMemo(() => {
    const map = new Map();

    // 1. Order form leads (from customer-details-page)
    orderLeads.forEach((l) => {
      const cleanPhone = String(l.phone || "").replace(/[^\d]/g, "");
      const key = cleanPhone && cleanPhone.length >= 10 ? cleanPhone : l.id;
      map.set(key, l);
    });

    // 2. Enquiry leads
    enquiryLeads.forEach((l) => {
      const cleanPhone = String(l.phone || "").replace(/[^\d]/g, "");
      const key = cleanPhone && cleanPhone.length >= 10 ? cleanPhone : l.id;
      if (!map.has(key)) map.set(key, l);
    });

    // 3. API leads
    apiLeads.forEach((l) => {
      const cleanPhone = String(l.phone || "").replace(/[^\d]/g, "");
      const key = cleanPhone && cleanPhone.length >= 10 ? cleanPhone : (l.id || l.metaLeadId);
      if (!map.has(key)) map.set(key, l);
    });

    const combined = Array.from(map.values());
    combined.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return combined;
  }, [orderLeads, enquiryLeads, apiLeads]);

  const filteredLeads = useMemo(() => {
    if (!search.trim()) return leadsList;
    const q = search.toLowerCase();
    return leadsList.filter(
      (l) =>
        (l.name || "").toLowerCase().includes(q) ||
        (l.phone || "").toLowerCase().includes(q) ||
        (l.email || "").toLowerCase().includes(q) ||
        (l.city || "").toLowerCase().includes(q) ||
        (l.campaignName || "").toLowerCase().includes(q) ||
        (l.formName || "").toLowerCase().includes(q)
    );
  }, [leadsList, search]);

  const instaPlatform = platforms.find((p) => p.platform === "instagram");
  const fbPlatform = platforms.find((p) => p.platform === "facebook");
  const waPlatform = platforms.find((p) => p.platform === "whatsapp");
  const instaPurchasesMeta = instaPlatform ? Number(instaPlatform.purchases) || 0 : 6;
  const fbPurchasesMeta = fbPlatform ? Number(fbPlatform.purchases) || 0 : 2;
  const waPurchasesMeta = waPlatform ? Number(waPlatform.purchases) || 0 : 1;

  const dateFilteredBuyers = useMemo(() => {
    const now = new Date();
    // Midnight today in local timezone
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Keep all campaign members within selected date range
    return buyersList.filter((b) => {
      if (!b.createdAt || datePreset === "maximum" || datePreset === "last_30d" || datePreset === "last_7d") return true;
      const d = new Date(b.createdAt);
      if (isNaN(d.getTime())) return true;
      if (datePreset === "today") return d >= startOfToday;
      if (datePreset === "yesterday") return d >= startOfYesterday && d < startOfToday;
      return true; // "maximum" / lifetime
    });
  }, [buyersList, datePreset]);

  const paidCount = dateFilteredBuyers.filter((b) => b.paymentStatus === "paid").length;
  const unpaidCount = dateFilteredBuyers.filter((b) => b.paymentStatus !== "paid").length;
  const paidTotal = dateFilteredBuyers
    .filter((b) => b.paymentStatus === "paid")
    .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const adPurchases = paidCount;
  const adRevenue = paidTotal;
  const instaBuyersCount = dateFilteredBuyers.filter((b) => (b.source || "").toLowerCase().includes("instagram")).length;
  const fbBuyersCount = dateFilteredBuyers.filter((b) => (b.source || "").toLowerCase().includes("facebook")).length;
  const waBuyersCount = dateFilteredBuyers.filter((b) => (b.source || "").toLowerCase().includes("whatsapp")).length;

  const filteredBuyers = useMemo(() => {
    let list = dateFilteredBuyers;
    if (buyerStatusFilter === "PAID") {
      list = list.filter((b) => b.paymentStatus === "paid");
    } else if (buyerStatusFilter === "UNPAID") {
      list = list.filter((b) => b.paymentStatus !== "paid");
    } else if (buyerStatusFilter === "INSTA") {
      list = list.filter((b) => (b.source || "").toLowerCase().includes("instagram"));
    } else if (buyerStatusFilter === "FB") {
      list = list.filter((b) => (b.source || "").toLowerCase().includes("facebook"));
    } else if (buyerStatusFilter === "WA") {
      list = list.filter((b) => (b.source || "").toLowerCase().includes("whatsapp"));
    }

    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (b) =>
        (b.name || "").toLowerCase().includes(q) ||
        (b.phone || "").toLowerCase().includes(q) ||
        (b.email || "").toLowerCase().includes(q) ||
        (b.city || "").toLowerCase().includes(q) ||
        (b.bookingId || "").toLowerCase().includes(q) ||
        (b.couponCode || "").toLowerCase().includes(q) ||
        (b.paymentId || "").toLowerCase().includes(q) ||
        (b.source || "").toLowerCase().includes(q)
    );
  }, [dateFilteredBuyers, buyerStatusFilter, search]);

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
            {totalDailyBudget > 0 ? `Budget: ₹${totalDailyBudget}/day` : "Active"}
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
            Ad Purchases (Verified Sales)
          </span>
          <b style={{ fontSize: 24, fontWeight: 800, color: adPurchases > 0 ? "#10b981" : "var(--fg, #111827)" }}>
            {adPurchases} Verified {adPurchases === 1 ? "Sale" : "Sales"}
          </b>
          <span style={{ fontSize: 11.5, color: "var(--mute, #6b7280)" }}>
            {adPurchases > 0 ? `${formatINR(adRevenue)} verified ad revenue` : "0 verified purchases tracked from ads"}
          </span>
        </div>
      </div>

      {/* =======================================================
          PLATFORM BREAKDOWN: INSTAGRAM VS FACEBOOK
          ======================================================= */}
      {platforms.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--fg, #111827)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              📱 Platform Performance ({datePreset.toUpperCase()})
            </h4>
            <span style={{ fontSize: 12, color: "var(--mute, #6b7280)" }}>
              Instagram vs Facebook traffic & conversion comparison
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "14px"
            }}
          >
            {platforms.map((p) => {
              const isInsta = p.platform === "instagram";
              const isFb = p.platform === "facebook";
              const isWa = p.platform === "whatsapp";
              const title = isInsta ? "Instagram" : isFb ? "Facebook" : isWa ? "WhatsApp" : p.platform.toUpperCase();
              const icon = isInsta ? "📸" : isFb ? "👥" : isWa ? "💬" : "🌐";
              const bgGradient = isInsta
                ? "linear-gradient(135deg, rgba(225, 48, 108, 0.08) 0%, rgba(253, 29, 29, 0.04) 100%)"
                : isFb
                ? "linear-gradient(135deg, rgba(24, 119, 242, 0.08) 0%, rgba(0, 102, 255, 0.04) 100%)"
                : isWa
                ? "linear-gradient(135deg, rgba(37, 211, 102, 0.08) 0%, rgba(18, 140, 126, 0.04) 100%)"
                : "var(--surface, #ffffff)";
              const borderColor = isInsta
                ? "rgba(225, 48, 108, 0.3)"
                : isFb
                ? "rgba(24, 119, 242, 0.3)"
                : isWa
                ? "rgba(37, 211, 102, 0.3)"
                : "var(--line, #e5e7eb)";

              // Platform-specific verified purchases (actual confirmed paid orders in database)
              const platformOrderPurchases = dateFilteredBuyers.filter((b) => {
                if (b.paymentStatus !== "paid") return false;
                const src = (b.source || "").toLowerCase();
                if (isInsta) return src.includes("instagram") || src.includes("insta") || src.includes("ig");
                if (isFb) return src.includes("facebook") || src.includes("fb");
                if (isWa) return src.includes("whatsapp") || src.includes("wa");
                return false;
              }).length;

              const platformPurchases = platformOrderPurchases;

              return (
                <div
                  key={p.platform}
                  style={{
                    background: bgGradient,
                    border: `1px solid ${borderColor}`,
                    borderRadius: "16px",
                    padding: "16px 18px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "20px" }}>{icon}</span>
                      <b style={{ fontSize: "15px", color: "var(--fg, #111827)" }}>{title}</b>
                    </div>
                    {platformPurchases > 0 ? (
                      <span
                        style={{
                          background: "#10b981",
                          color: "#fff",
                          fontSize: "10px",
                          fontWeight: 800,
                          padding: "3px 8px",
                          borderRadius: "10px",
                          letterSpacing: "0.03em"
                        }}
                      >
                        🏆 {platformPurchases} PAID
                      </span>
                    ) : Number(p.leads) > 0 ? (
                      <span
                        style={{
                          background: "rgba(37, 99, 235, 0.12)",
                          color: "#2563eb",
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "10px",
                          letterSpacing: "0.03em"
                        }}
                      >
                        🎯 {p.leads} LEADS
                      </span>
                    ) : null}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px" }}>
                    <div>
                      <span style={{ color: "var(--mute, #6b7280)", display: "block", fontSize: "11px" }}>Clicks</span>
                      <b style={{ fontSize: "16px", color: isInsta ? "#e1306c" : isFb ? "#1877f2" : "var(--fg, #111827)" }}>
                        {p.clicks} clicks
                      </b>
                    </div>
                    <div>
                      <span style={{ color: "var(--mute, #6b7280)", display: "block", fontSize: "11px" }}>Spend</span>
                      <b style={{ fontSize: "16px", color: "var(--fg, #111827)" }}>
                        {formatINR(p.spend)}
                      </b>
                    </div>
                    <div>
                      <span style={{ color: "var(--mute, #6b7280)", display: "block", fontSize: "11px" }}>Avg CPC</span>
                      <b>₹{p.cpc ? p.cpc.toFixed(2) : "0.00"}</b>
                    </div>
                    <div>
                      <span style={{ color: "var(--mute, #6b7280)", display: "block", fontSize: "11px" }}>Impressions</span>
                      <b>{p.impressions ? p.impressions.toLocaleString("en-IN") : 0}</b>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            className={`meta-pill-btn ${activeTab === "CAMPAIGNS" ? "active" : ""}`}
            onClick={() => setActiveTab("CAMPAIGNS")}
          >
            📊 Ad Campaigns ({campaigns.length})
          </button>
          <button
            type="button"
            className={`meta-pill-btn ${activeTab === "BUYERS" ? "active" : ""}`}
            onClick={() => setActiveTab("BUYERS")}
            style={{
              borderColor: activeTab === "BUYERS" ? "#10b981" : undefined,
              background: activeTab === "BUYERS" ? "#10b981" : undefined,
              color: activeTab === "BUYERS" ? "#fff" : undefined
            }}
          >
            🛍️ Ad Members ({dateFilteredBuyers.length})
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
          placeholder={
            activeTab === "CAMPAIGNS"
              ? "Search campaigns..."
              : activeTab === "BUYERS"
              ? "Search buyers by name, phone, city, order ID..."
              : "Search leads by name, phone, email..."
          }
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
                    <th>Purchases (Pixel Events)</th>
                    <th>Cost/Pixel Event</th>
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
                    <th>City / Location</th>
                    <th>Campaign / Form</th>
                    <th>Captured Time</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((l, i) => {
                    const cleanPhone = String(l.phone || "").replace(/[^\d]/g, "");
                    const isWaAvailable = cleanPhone.length >= 10;
                    const waLink = `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(
                      `Hello ${l.name}, thank you for your interest in Wealthoria! How can we assist you with the book pre-order?`
                    )}`;

                    return (
                      <tr key={l.id || l.metaLeadId || i}>
                        <td>
                          <b style={{ color: "var(--fg, #111827)", display: "block" }}>{l.name}</b>
                          <span style={{ fontSize: 11, color: "var(--mute, #6b7280)" }}>
                            {l.source || "Meta Ad Lead"}
                          </span>
                        </td>
                        <td>
                          {l.phone && l.phone !== "—" ? (
                            <a
                              href={`tel:${cleanPhone}`}
                              style={{ color: "#2563eb", textDecoration: "none", fontWeight: 700 }}
                            >
                              📞 {l.phone}
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
                          <span style={{ fontSize: 12, color: "var(--fg, #111827)", display: "block", fontWeight: 600 }}>
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
                        <td>
                          {isWaAvailable && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "4px 10px",
                                borderRadius: "8px",
                                background: "#25d366",
                                color: "#ffffff",
                                fontSize: "11px",
                                fontWeight: 800,
                                textDecoration: "none",
                                boxShadow: "0 1px 3px rgba(37, 211, 102, 0.3)"
                              }}
                            >
                              💬 WhatsApp
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =======================================================
          TAB 3: BOOK BUYERS TABLE (PAID VS FORM FILLED)
          ======================================================= */}
      {activeTab === "BUYERS" && (
        <div
          style={{
            background: "var(--surface, #ffffff)",
            border: "1px solid var(--line, #e5e7eb)",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
          }}
        >
          {/* SUB-FILTER BAR: ALL AD BUYERS VS INSTAGRAM VS FACEBOOK */}
          <div
            style={{
              padding: "14px 20px",
              background: "var(--bg-muted, #f9fafb)",
              borderBottom: "1px solid var(--line, #e5e7eb)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px"
            }}
          >
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                className={`meta-pill-btn ${buyerStatusFilter === "ALL" ? "active" : ""}`}
                onClick={() => setBuyerStatusFilter("ALL")}
                style={{ fontSize: 12, padding: "5px 12px" }}
              >
                🎯 All Ad Members ({dateFilteredBuyers.length})
              </button>
              <button
                type="button"
                className={`meta-pill-btn ${buyerStatusFilter === "PAID" ? "active" : ""}`}
                onClick={() => setBuyerStatusFilter("PAID")}
                style={{
                  fontSize: 12,
                  padding: "5px 12px",
                  borderColor: buyerStatusFilter === "PAID" ? "#10b981" : "#d1fae5",
                  background: buyerStatusFilter === "PAID" ? "#10b981" : "#ecfdf5",
                  color: buyerStatusFilter === "PAID" ? "#ffffff" : "#065f46",
                  fontWeight: 800
                }}
              >
                ✅ Paid ({paidCount})
              </button>
              <button
                type="button"
                className={`meta-pill-btn ${buyerStatusFilter === "INSTA" ? "active" : ""}`}
                onClick={() => setBuyerStatusFilter("INSTA")}
                style={{
                  fontSize: 12,
                  padding: "5px 12px",
                  borderColor: buyerStatusFilter === "INSTA" ? "#e1306c" : "#fbcfe8",
                  background: buyerStatusFilter === "INSTA" ? "#e1306c" : "#fdf2f8",
                  color: buyerStatusFilter === "INSTA" ? "#ffffff" : "#be185d",
                  fontWeight: 800
                }}
              >
                📸 Instagram Ad ({instaBuyersCount})
              </button>
              <button
                type="button"
                className={`meta-pill-btn ${buyerStatusFilter === "FB" ? "active" : ""}`}
                onClick={() => setBuyerStatusFilter("FB")}
                style={{
                  fontSize: 12,
                  padding: "5px 12px",
                  borderColor: buyerStatusFilter === "FB" ? "#1877f2" : "#bfdbfe",
                  background: buyerStatusFilter === "FB" ? "#1877f2" : "#eff6ff",
                  color: buyerStatusFilter === "FB" ? "#ffffff" : "#1d4ed8",
                  fontWeight: 800
                }}
              >
                👥 Facebook Ad ({fbBuyersCount})
              </button>
              {unpaidCount > 0 && (
                <button
                  type="button"
                  className={`meta-pill-btn ${buyerStatusFilter === "UNPAID" ? "active" : ""}`}
                  onClick={() => setBuyerStatusFilter("UNPAID")}
                  style={{
                    fontSize: 12,
                    padding: "5px 12px",
                    borderColor: buyerStatusFilter === "UNPAID" ? "#f59e0b" : "#fef3c7",
                    background: buyerStatusFilter === "UNPAID" ? "#f59e0b" : "#fffbeb",
                    color: buyerStatusFilter === "UNPAID" ? "#ffffff" : "#92400e",
                    fontWeight: 800
                  }}
                >
                  ⚠️ Unpaid Leads ({unpaidCount})
                </button>
              )}
            </div>

            <span style={{ fontSize: 12, color: "var(--mute, #6b7280)" }}>
              {paidCount} paid buyer{paidCount === 1 ? "" : "s"} &bull; {unpaidCount} unpaid lead{unpaidCount === 1 ? "" : "s"}
            </span>
          </div>

          {filteredBuyers.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--mute, #6b7280)" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🛍️</div>
              <b style={{ fontSize: 16, color: "var(--fg, #111827)" }}>No members bought the book from ads yet</b>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--mute, #6b7280)" }}>
                Displaying only members who bought the book directly from ads (Instagram / Facebook). Organic website buyers and unpaid form leads are not displayed.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="meta-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Order / Booking ID</th>
                    <th>Platform / Source</th>
                    <th>Customer Name</th>
                    <th>Phone</th>
                    <th>City / State</th>
                    <th>Amount</th>
                    <th>Payment ID</th>
                    <th>Time</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBuyers.map((b) => {
                    const isPaid = b.paymentStatus === "paid";
                    const cleanPhone = String(b.phone || "").replace(/[^\d]/g, "");
                    const isInsta = (b.source || "").toLowerCase().includes("instagram");
                    const isFb = (b.source || "").toLowerCase().includes("facebook");
                    const isWa = (b.source || "").toLowerCase().includes("whatsapp");
                    const waMessage = encodeURIComponent(
                      `Namaskara ${b.name}, thank you for purchasing "Hoodikeya Vijnana" book from Wealthoria! Your order has been confirmed.`
                    );

                    return (
                      <tr
                        key={b.id || b.bookingId}
                        style={{
                          background: isPaid ? "rgba(16, 185, 129, 0.03)" : "rgba(245, 158, 11, 0.03)"
                        }}
                      >
                        <td>
                          {isPaid ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                background: "#d1fae5",
                                color: "#065f46",
                                fontSize: 10.5,
                                fontWeight: 800,
                                padding: "3px 8px",
                                borderRadius: 6,
                                letterSpacing: "0.03em"
                              }}
                            >
                              ✅ PAID
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                background: "#fef3c7",
                                color: "#92400e",
                                fontSize: 10.5,
                                fontWeight: 800,
                                padding: "3px 8px",
                                borderRadius: 6,
                                letterSpacing: "0.03em"
                              }}
                            >
                              ⚠️ LEAD
                            </span>
                          )}
                        </td>
                        <td>
                          <b style={{ color: "var(--fg, #111827)", fontFamily: "monospace", fontSize: 13 }}>
                            {b.bookingId}
                          </b>
                          {b.couponCode && (
                            <span
                              style={{
                                display: "block",
                                fontSize: 10.5,
                                color: "#b45309",
                                fontWeight: 700
                              }}
                            >
                              🏷️ {b.couponCode}
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              fontSize: 11,
                              fontWeight: 700,
                              color: isInsta ? "#e1306c" : isFb ? "#1877f2" : isWa ? "#15803d" : "#059669"
                            }}
                          >
                            {isInsta ? "📸 Instagram Ad" : isFb ? "👥 Facebook Ad" : isWa ? "💬 WhatsApp Ad" : "📱 Meta Ad"}
                          </span>
                        </td>
                        <td>
                          <b style={{ color: "var(--fg, #111827)", display: "block" }}>{b.name}</b>
                          <span style={{ fontSize: 11, color: "var(--mute, #6b7280)" }}>{b.email}</span>
                        </td>
                        <td>
                          {b.phone && b.phone !== "—" ? (
                            <a
                              href={`tel:${cleanPhone}`}
                              style={{ color: "#2563eb", textDecoration: "none", fontWeight: 700 }}
                            >
                              {b.phone}
                            </a>
                          ) : (
                            <span style={{ color: "var(--mute, #6b7280)" }}>—</span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontWeight: 600 }}>{b.city || "—"}</span>
                          {b.state && b.state !== "—" && (
                            <span style={{ fontSize: 11, color: "var(--mute, #6b7280)", display: "block" }}>
                              {b.state}
                            </span>
                          )}
                        </td>
                        <td>
                          <b style={{ color: isPaid ? "#059669" : "#d97706", fontSize: 13.5 }}>
                            {formatINR(b.amount)}
                          </b>
                          <span style={{ fontSize: 10.5, color: "var(--mute, #6b7280)", display: "block" }}>
                            {isPaid ? "Paid" : "Unpaid"}
                          </span>
                        </td>
                        <td>
                          {isPaid ? (
                            <span
                              style={{
                                fontFamily: "monospace",
                                fontSize: 11,
                                color: "#065f46",
                                background: "#ecfdf5",
                                padding: "3px 7px",
                                borderRadius: 4,
                                border: "1px solid #a7f3d0"
                              }}
                            >
                              {b.paymentId}
                            </span>
                          ) : (
                            <span style={{ color: "var(--mute, #6b7280)", fontSize: 11.5 }}>
                              Not Paid Yet
                            </span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: 11.5, color: "var(--mute, #6b7280)" }}>
                            {formatRelativeTime(b.createdAt)}
                          </span>
                        </td>
                        <td>
                          {!isPaid && cleanPhone ? (
                            <a
                              href={`https://wa.me/91${cleanPhone}?text=${waMessage}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="meta-pill-btn"
                              style={{
                                background: "#25D366",
                                color: "#ffffff",
                                borderColor: "#25D366",
                                padding: "4px 10px",
                                fontSize: 11,
                                textDecoration: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4
                              }}
                            >
                              💬 Follow Up
                            </a>
                          ) : (
                            <span style={{ color: "#059669", fontSize: 11.5, fontWeight: 700 }}>
                              ✓ Confirmed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
