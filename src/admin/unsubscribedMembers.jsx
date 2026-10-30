import React, { useState, useEffect, useMemo, useCallback } from "react";

/* global window */

const { MIcon } = window;

/* =========================================================================
   UNSUBSCRIBED MEMBERS & SALES FOLLOW-UP (PREMIUM ADMIN UI)
   - Clean, uncluttered table with generous whitespace
   - Refined metric cards with modern typography
   - Segmented filter controls
   - Slide-over Follow-up Drawer with WhatsApp templates, Dialer & Notes
   ========================================================================= */

const FOLLOWUP_STAGES = [
  { value: "not_contacted", label: "Not Contacted", color: "#64748b", bg: "#f1f5f9" },
  { value: "contacted", label: "Contacted", color: "#0284c7", bg: "#e0f2fe" },
  { value: "interested", label: "Interested", color: "#16a34a", bg: "#dcfce7" },
  { value: "follow_up_later", label: "Follow Up Later", color: "#d97706", bg: "#fef3c7" },
  { value: "not_interested", label: "Not Interested", color: "#ef4444", bg: "#fee2e2" },
  { value: "converted", label: "Converted", color: "#7c3aed", bg: "#ede9fe" },
];

function normalize(val) {
  return String(val || "").trim().toLowerCase();
}

function safeDate(val) {
  if (!val) return null;
  try {
    if (typeof val.toDate === "function") return val.toDate();
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function formatDate(val) {
  const d = safeDate(val);
  if (!d) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function toDateInputValue(val) {
  if (!val) return "";
  const d = safeDate(val);
  if (!d) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMemberTimestamp(member, basis = "registered") {
  if (basis === "followup") {
    const d = safeDate(member.followupUpdatedAt);
    return d ? d.getTime() : 0;
  }
  const d = safeDate(
    member.createdAt ||
    member.joinedAt ||
    member.registeredAt ||
    member.timestamp ||
    member.updatedAt
  );
  return d ? d.getTime() : 0;
}

function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function loadXLSX() {
  return new Promise((resolve, reject) => {
    if (window.XLSX) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[data-wealthoria-xlsx="true"]');
    if (existing) {
      existing.addEventListener("load", resolve);
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
    script.async = true;
    script.dataset.wealthoriaXlsx = "true";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Unable to load Excel export library."));
    document.head.appendChild(script);
  });
}

function UnsubscribedMembers() {
  const [members, setMembers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [followups, setFollowups] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [tabFilter, setTabFilter] = useState("unsubscribed"); // unsubscribed, cancelled, unpaid, all
  const [followupFilter, setFollowupFilter] = useState("all");
  const [datePreset, setDatePreset] = useState("all"); // all, today, yesterday, 7days, 30days, this_month, custom
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateBasis, setDateBasis] = useState("registered"); // registered | followup
  const [sortOrder, setSortOrder] = useState("desc"); // desc (newest) | asc (oldest)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const handleDatePresetChange = (preset) => {
    setDatePreset(preset);
    const now = new Date();
    const todayStr = toDateInputValue(now);

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "yesterday") {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = toDateInputValue(y);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === "7days") {
      const past = new Date();
      past.setDate(past.getDate() - 6);
      setStartDate(toDateInputValue(past));
      setEndDate(todayStr);
    } else if (preset === "30days") {
      const past = new Date();
      past.setDate(past.getDate() - 29);
      setStartDate(toDateInputValue(past));
      setEndDate(todayStr);
    } else if (preset === "this_month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(toDateInputValue(firstDay));
      setEndDate(todayStr);
    }
  };

  const clearDateFilter = () => {
    setDatePreset("all");
    setStartDate("");
    setEndDate("");
  };

  // Selected member for slide-over follow-up drawer
  const [activeDrawerMember, setActiveDrawerMember] = useState(null);
  const [drawerNotes, setDrawerNotes] = useState("");
  const [drawerStatus, setDrawerStatus] = useState("not_contacted");
  const [savingDrawer, setSavingDrawer] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  /* -------------------------------------------------------------
     REAL-TIME LISTENER      ------------------------------------------------------------- */
  useEffect(() => {
    if (!window.db) {
      setError("Firestore database is not available.");
      setLoading(false);
      return;
    }

    setLoading(true);

    let unsubMembers = null;
    let unsubSubs = null;
    let unsubFollowups = null;
    let unsubAuth = null;
    let isSubscribed = false;

    const startListeners = () => {
      if (isSubscribed) return;
      isSubscribed = true;

      unsubMembers = window.db.collection("members").onSnapshot(
        (snapshot) => {
          const list = snapshot.docs.map((doc) => ({
            id: doc.id,
            uid: doc.id,
            ...(doc.data() || {})
          }));
          setMembers(list);
          setLoading(false);
        },
        (err) => {
          console.error("Members error:", err);
          setError("Unable to load members: " + (err.message || "Permission error"));
          setLoading(false);
        }
      );

      unsubSubs = window.db.collection("subscriptions").onSnapshot(
        (snapshot) => {
          const list = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() || {})
          }));
          setSubscriptions(list);
        },
        (err) => {
          console.warn("Subscriptions error:", err);
        }
      );

      unsubFollowups = window.db.collection("member_followups").onSnapshot(
        (snapshot) => {
          const map = {};
          snapshot.docs.forEach((doc) => {
            map[doc.id] = doc.data();
          });
          setFollowups(map);
        },
        (err) => {
          console.warn("Followups error:", err);
        }
      );
    };

    if (window.auth) {
      if (window.auth.currentUser) {
        startListeners();
      }
      unsubAuth = window.auth.onAuthStateChanged((user) => {
        if (user) {
          startListeners();
        }
      });
    } else {
      startListeners();
    }

    return () => {
      if (typeof unsubAuth === "function") unsubAuth();
      if (typeof unsubMembers === "function") unsubMembers();
      if (typeof unsubSubs === "function") unsubSubs();
      if (typeof unsubFollowups === "function") unsubFollowups();
    };
  }, []);

  /* -------------------------------------------------------------
     PROCESS & CLASSIFY MEMBERS
     ------------------------------------------------------------- */
  const classifiedMembers = useMemo(() => {
    const subMapByMember = new Map();

    subscriptions.forEach((sub) => {
      const uids = [sub.memberId, sub.userId, sub.uid].filter(Boolean).map(normalize);
      const email = normalize(sub.email || sub.customerEmail);

      uids.forEach((uid) => {
        if (!subMapByMember.has(uid)) subMapByMember.set(uid, []);
        subMapByMember.get(uid).push(sub);
      });

      if (email && email !== "—") {
        if (!subMapByMember.has(email)) subMapByMember.set(email, []);
        subMapByMember.get(email).push(sub);
      }
    });

    return members.map((member) => {
      const memberUid = normalize(member.uid || member.id);
      const memberEmail = normalize(member.email);

      const memberSubs = [
        ...(subMapByMember.get(memberUid) || []),
        ...(subMapByMember.get(memberEmail) || [])
      ].filter((sub, idx, arr) => arr.findIndex((s) => s.id === sub.id) === idx);

      const hasActiveSub = memberSubs.some((s) => normalize(s.status || s.razorpayStatus) === "active");
      const hasCancelledSub = memberSubs.some((s) => {
        const st = normalize(s.status || s.razorpayStatus);
        return st === "cancelled" || st === "halted";
      });
      const hasExpiredSub = memberSubs.some((s) => {
        const st = normalize(s.status || s.razorpayStatus);
        return st === "expired" || st === "inactive";
      });

      const hasPaid = memberSubs.some((s) => {
        if (s.razorpayPaymentId) return true;
        const paidCount = Number(s.paidCount ?? s.paid_count);
        if (Number.isFinite(paidCount) && paidCount > 0) return true;
        const st = normalize(s.status);
        return ["active", "cancelled", "halted", "paused", "inactive"].includes(st);
      });

      // Calculate paid cycles completed
      const subPaidCount = memberSubs.reduce((max, s) => {
        const c = Number(s.paidCount ?? s.paid_count);
        return Number.isFinite(c) && c > max ? c : max;
      }, 0);
      const effectivePaidCount = subPaidCount > 0 ? subPaidCount : (hasPaid ? 1 : 0);

      // Check if auto-debit charge failed / pending retry
      const isRenewalFailed = memberSubs.some((s) => {
        const rz = normalize(s.razorpayStatus);
        const src = String(s.lastSyncSource || "");
        return rz === "pending" || src.includes("subscription.pending");
      });

      // Cancelled 2nd Payment:
      // Members who completed initial month 1 payment, but cancelled, halted, expired,
      // or failed auto-renewal before/at their 2nd debit, making their account inactive.
      const isCancelled2ndPayment =
        !hasActiveSub &&
        hasPaid &&
        (effectivePaidCount <= 1 || isRenewalFailed);

      let category = "unpaid";
      let statusLabel = "Unpaid Signup";
      let statusTheme = { color: "#b45309", bg: "#fef3c7", border: "#fde68a" };

      if (hasActiveSub) {
        category = "active";
        statusLabel = "Active";
        statusTheme = { color: "#15803d", bg: "#dcfce7", border: "#bbf7d0" };
      } else if (isCancelled2ndPayment) {
        category = "cancelled_2nd_payment";
        statusLabel = isRenewalFailed ? "2nd Debit Failed" : "Cancelled 2nd Payment";
        statusTheme = { color: "#be123c", bg: "#fff1f2", border: "#fecdd3" };
      } else if (hasCancelledSub) {
        category = "cancelled";
        statusLabel = effectivePaidCount > 1 ? `Cancelled (${effectivePaidCount} Cycles)` : "Cancelled";
        statusTheme = { color: "#b91c1c", bg: "#fee2e2", border: "#fecaca" };
      } else if (hasExpiredSub) {
        category = "expired";
        statusLabel = "Expired";
        statusTheme = { color: "#475569", bg: "#f1f5f9", border: "#e2e8f0" };
      } else if (hasPaid) {
        category = "inactive";
        statusLabel = "Past Subscriber";
        statusTheme = { color: "#c2410c", bg: "#ffedd5", border: "#fed7aa" };
      }

      const latestSub = memberSubs[0] || null;
      const planName = latestSub?.plan || latestSub?.planName || latestSub?.planId || "—";
      const planAmount = latestSub?.amount ?? latestSub?.price ?? (hasPaid ? 99 : null);

      const followupData = followups[member.id] || {};
      const followupStatus = followupData.status || "not_contacted";
      const followupNotes = followupData.notes || "";
      const followupUpdatedAt = followupData.updatedAt || null;

      const cleanPhone = String(member.phone || member.phoneNumber || "").replace(/\D/g, "").slice(-10);

      return {
        ...member,
        category,
        isUnsubscribed: !hasActiveSub,
        isCancelled2ndPayment,
        isRenewalFailed,
        effectivePaidCount,
        statusLabel,
        statusTheme,
        hasPaid,
        latestSub,
        planName,
        planAmount,
        cleanPhone,
        followupStatus,
        followupNotes,
        followupUpdatedAt,
      };
    });
  }, [members, subscriptions, followups]);

  /* -------------------------------------------------------------
     METRICS COUNTS
     ------------------------------------------------------------- */
  const counts = useMemo(() => {
    let total = classifiedMembers.length;
    let unsubscribed = 0;
    let cancelled = 0;
    let cancelled2ndPayment = 0;
    let unpaid = 0;
    let active = 0;
    let contacted = 0;

    classifiedMembers.forEach((m) => {
      if (m.isUnsubscribed) unsubscribed++;
      if (m.isCancelled2ndPayment) cancelled2ndPayment++;
      if (m.category === "cancelled" || m.isCancelled2ndPayment) cancelled++;
      if (m.category === "unpaid") unpaid++;
      if (m.category === "active") active++;
      if (["contacted", "interested", "follow_up_later", "converted"].includes(m.followupStatus)) {
        contacted++;
      }
    });

    return { total, unsubscribed, cancelled, cancelled2ndPayment, unpaid, active, contacted };
  }, [classifiedMembers]);

  /* -------------------------------------------------------------
     FILTERED & SEARCHED LIST
     ------------------------------------------------------------- */
  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();

    const result = classifiedMembers.filter((m) => {
      if (tabFilter === "unsubscribed" && !m.isUnsubscribed) return false;
      if (tabFilter === "cancelled_2nd_payment" && !m.isCancelled2ndPayment) return false;
      if (tabFilter === "cancelled" && m.category !== "cancelled" && !m.isCancelled2ndPayment) return false;
      if (tabFilter === "unpaid" && m.category !== "unpaid") return false;

      if (followupFilter !== "all" && m.followupStatus !== followupFilter) return false;

      // Date filtering
      if (startDate || endDate) {
        const memberMs = getMemberTimestamp(m, dateBasis);
        if (startDate) {
          const startMs = new Date(`${startDate}T00:00:00`).getTime();
          if (!memberMs || memberMs < startMs) return false;
        }
        if (endDate) {
          const endMs = new Date(`${endDate}T23:59:59.999`).getTime();
          if (!memberMs || memberMs > endMs) return false;
        }
      }

      if (q) {
        const text = [
          m.name,
          m.email,
          m.phone,
          m.city,
          m.state,
          m.planName,
          m.statusLabel,
          m.followupNotes
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!text.includes(q)) return false;
      }

      return true;
    });

    result.sort((a, b) => {
      const timeA = getMemberTimestamp(a, dateBasis);
      const timeB = getMemberTimestamp(b, dateBasis);
      return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
    });

    return result;
  }, [classifiedMembers, tabFilter, followupFilter, search, startDate, endDate, dateBasis, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, tabFilter, followupFilter, datePreset, startDate, endDate, dateBasis, sortOrder]);

  /* -------------------------------------------------------------
     DRAWER OPEN / SAVE
     ------------------------------------------------------------- */
  const openDrawer = (member) => {
    setActiveDrawerMember(member);
    setDrawerNotes(member.followupNotes || "");
    setDrawerStatus(member.followupStatus || "not_contacted");
    setSaveSuccessMsg("");
  };

  const closeDrawer = () => {
    setActiveDrawerMember(null);
    setSaveSuccessMsg("");
  };

  const saveDrawerData = async () => {
    if (!activeDrawerMember || !window.db) return;
    try {
      setSavingDrawer(true);
      await window.db.collection("member_followups").doc(activeDrawerMember.id).set(
        {
          status: drawerStatus,
          notes: drawerNotes.trim(),
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
      setSaveSuccessMsg("Saved successfully!");
      setTimeout(() => setSaveSuccessMsg(""), 2000);
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save follow-up details: " + err.message);
    } finally {
      setSavingDrawer(false);
    }
  };

  /* -------------------------------------------------------------
     QUICK INLINE STATUS CHANGE
     ------------------------------------------------------------- */
  const handleQuickStatusChange = async (memberId, newStatus) => {
    if (!window.db) return;
    try {
      await window.db.collection("member_followups").doc(memberId).set(
        {
          status: newStatus,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (err) {
      console.error("Status change error:", err);
    }
  };

  /* -------------------------------------------------------------
     EXPORT TO EXCEL
     ------------------------------------------------------------- */
  const exportToExcel = async () => {
    if (!filteredList.length) {
      alert("No members to export.");
      return;
    }

    try {
      await loadXLSX();

      const rows = filteredList.map((m, idx) => ({
        "SL No": idx + 1,
        "Name": m.name || "—",
        "Phone": m.cleanPhone || m.phone || "—",
        "Email": m.email || "—",
        "City": m.city || "—",
        "State": m.state || "—",
        "Membership Status": m.statusLabel,
        "Cancelled 2nd Payment": m.isCancelled2ndPayment ? "Yes (2nd debit cancelled/unpaid)" : "No",
        "Completed Cycles": m.effectivePaidCount || 0,
        "Last Plan": m.planName,
        "Plan Rate": m.planAmount ? `₹${m.planAmount}` : "—",
        "Registered On": formatDate(m.createdAt || m.joinedAt),
        "Follow-up Status": FOLLOWUP_STAGES.find((s) => s.value === m.followupStatus)?.label || "Not Contacted",
        "Follow-up Notes": m.followupNotes || "—",
        "Last Updated": formatDate(m.followupUpdatedAt)
      }));

      const worksheet = window.XLSX.utils.json_to_sheet(rows);
      worksheet["!cols"] = [
        { wch: 8 },
        { wch: 22 },
        { wch: 16 },
        { wch: 28 },
        { wch: 18 },
        { wch: 16 },
        { wch: 22 },
        { wch: 22 },
        { wch: 16 },
        { wch: 18 },
        { wch: 14 },
        { wch: 16 },
        { wch: 20 },
        { wch: 35 },
        { wch: 16 }
      ];

      const workbook = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(workbook, worksheet, "Unsubscribed Leads");

      const dateSuffix = startDate || endDate ? `_${startDate || "start"}_to_${endDate || "end"}` : "";
      const today = new Date().toISOString().slice(0, 10);
      window.XLSX.writeFile(workbook, `wealthoria-unsubscribed-leads-${today}${dateSuffix}.xlsx`);
    } catch (err) {
      console.error("Export error:", err);
      alert("Export failed: " + err.message);
    }
  };

  /* -------------------------------------------------------------
     WHATSAPP TEMPLATES
     ------------------------------------------------------------- */
  const getWhatsAppLink = (member, template = "standard") => {
    if (!member?.cleanPhone) return "#";
    const name = member.name || "Member";

    let text = "";
    if (template === "2nd_payment" || (template === "standard" && member.isCancelled2ndPayment)) {
      text = `Hello ${name}, this is from Wealthoria Education. We noticed your 2nd month subscription renewal was not completed and your premium access is currently inactive. Would you like to reactivate your access with an exclusive renewal offer? https://wealthoria.in/members/subscription`;
    } else if (template === "discount") {
      text = `Hello ${name}, this is from Wealthoria Education. We have an exclusive renewal offer on our premium subscription for you. Would you like to reactivate your plan? https://wealthoria.in/members/subscription`;
    } else if (template === "checkin") {
      text = `Hi ${name}, this is Wealthoria support team. We noticed your subscription has ended. Do you need any assistance with renewing your access? https://wealthoria.in/members/subscription`;
    } else {
      text = `Hello ${name}, this is from Wealthoria Education. Your membership is currently inactive. You can easily reactivate it anytime here: https://wealthoria.in/members/subscription`;
    }

    return `https://wa.me/91${member.cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div style={{ maxWidth: 1440, margin: "0 auto", paddingBottom: 48, fontFamily: "inherit" }}>
      {/* =========================================================
          TOP PAGE HEADER
          ========================================================= */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 24,
          flexWrap: "wrap"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 750,
                letterSpacing: "-0.02em",
                color: "#111827"
              }}
            >
              Unsubscribed Members
            </h1>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "3px 10px",
                borderRadius: 999,
                background: "#fef2f2",
                color: "#b91c1c",
                fontSize: 12,
                fontWeight: 750
              }}
            >
              {counts.unsubscribed} leads
            </span>
          </div>
          <p style={{ margin: "5px 0 0", fontSize: 13, color: "#6b7280" }}>
            Track and follow up with inactive, cancelled, and unpaid signups to recover subscriptions.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={exportToExcel}
            style={{
              height: 38,
              padding: "0 14px",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: "#ffffff",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 650,
              color: "#374151",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              transition: "background 0.15s"
            }}
          >
            <span>📥</span> Export Excel
          </button>
        </div>
      </div>

      {/* =========================================================
          MINIMALIST METRIC STRIP (Clean & Subtle)
          ========================================================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14,
          marginBottom: 20
        }}
      >
        {/* Unsubscribed Total */}
        <div
          onClick={() => setTabFilter("unsubscribed")}
          style={{
            background: "#ffffff",
            border: tabFilter === "unsubscribed" ? "2px solid #ef4444" : "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "16px 18px",
            cursor: "pointer",
            transition: "all 0.15s"
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 650, color: "#6b7280" }}>
            Total Unsubscribed
          </div>
          <div style={{ fontSize: 26, fontWeight: 750, color: "#111827", margin: "4px 0 2px" }}>
            {counts.unsubscribed}
          </div>
          <div style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>
            Inactive registered accounts
          </div>
        </div>

        {/* Cancelled 2nd Payment (NEW!) */}
        <div
          onClick={() => setTabFilter("cancelled_2nd_payment")}
          style={{
            background: tabFilter === "cancelled_2nd_payment" ? "#fff1f2" : "#ffffff",
            border: tabFilter === "cancelled_2nd_payment" ? "2px solid #be123c" : "1px solid #fecdd3",
            borderRadius: 12,
            padding: "16px 18px",
            cursor: "pointer",
            boxShadow: tabFilter === "cancelled_2nd_payment" ? "0 4px 14px rgba(190, 18, 60, 0.12)" : "none",
            transition: "all 0.15s"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#be123c" }}>
              Cancelled 2nd Payment
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                padding: "2px 6px",
                borderRadius: 4,
                background: "#ffe4e6",
                color: "#be123c"
              }}
            >
              Priority
            </span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#be123c", margin: "4px 0 2px" }}>
            {counts.cancelled2ndPayment}
          </div>
          <div style={{ fontSize: 11, color: "#9f1239", fontWeight: 600 }}>
            Paid month 1 · 2nd renewal cancelled
          </div>
        </div>

        {/* Cancelled Subscriptions */}
        <div
          onClick={() => setTabFilter("cancelled")}
          style={{
            background: "#ffffff",
            border: tabFilter === "cancelled" ? "2px solid #ef4444" : "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "16px 18px",
            cursor: "pointer",
            transition: "all 0.15s"
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 650, color: "#6b7280" }}>
            All Cancelled Members
          </div>
          <div style={{ fontSize: 26, fontWeight: 750, color: "#111827", margin: "4px 0 2px" }}>
            {counts.cancelled}
          </div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>
            Paid in past · Auto-renew cancelled
          </div>
        </div>

        {/* Unpaid / Never Subscribed */}
        <div
          onClick={() => setTabFilter("unpaid")}
          style={{
            background: "#ffffff",
            border: tabFilter === "unpaid" ? "2px solid #ef4444" : "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "16px 18px",
            cursor: "pointer",
            transition: "all 0.15s"
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 650, color: "#6b7280" }}>
            Unpaid Signups
          </div>
          <div style={{ fontSize: 26, fontWeight: 750, color: "#111827", margin: "4px 0 2px" }}>
            {counts.unpaid}
          </div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>
            Registered · Never completed payment
          </div>
        </div>

        {/* Follow-up Progress */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "16px 18px"
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 650, color: "#6b7280" }}>
            Follow-up Contacted
          </div>
          <div style={{ fontSize: 26, fontWeight: 750, color: "#111827", margin: "4px 0 2px" }}>
            {counts.contacted}
          </div>
          <div style={{ fontSize: 11, color: "#15803d", fontWeight: 600 }}>
            Logged in progress
          </div>
        </div>
      </div>

      {/* =========================================================
          CONTROL BAR: SEGMENTS, SEARCH, DATE FILTER & STATUS
          ========================================================= */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12
        }}
      >
        {/* ROW 1: Segmented Filter Tabs + Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap"
          }}
        >
          {/* Segmented Filter Pills */}
          <div
            style={{
              display: "inline-flex",
              background: "#f3f4f6",
              padding: 3,
              borderRadius: 8,
              gap: 2,
              flexWrap: "wrap"
            }}
          >
            {[
              { id: "unsubscribed", label: `All Unsubscribed (${counts.unsubscribed})` },
              { id: "cancelled_2nd_payment", label: `🛑 Cancelled 2nd Payment (${counts.cancelled2ndPayment})`, highlight: true },
              { id: "cancelled", label: `All Cancelled (${counts.cancelled})` },
              { id: "unpaid", label: `Unpaid (${counts.unpaid})` },
              { id: "all", label: `All in DB (${counts.total})` }
            ].map((tab) => {
              const isActive = tabFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTabFilter(tab.id)}
                  style={{
                    height: 30,
                    padding: "0 12px",
                    borderRadius: 6,
                    border: tab.highlight && !isActive ? "1px solid #fecdd3" : "none",
                    background: isActive ? (tab.highlight ? "#be123c" : "#ffffff") : (tab.highlight ? "#fff1f2" : "transparent"),
                    color: isActive ? "#ffffff" : (tab.highlight ? "#be123c" : "#4b5563"),
                    fontSize: 12,
                    fontWeight: isActive ? 750 : (tab.highlight ? 700 : 550),
                    cursor: "pointer",
                    boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.15s"
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div style={{ position: "relative", width: 260 }}>
            <input
              type="text"
              placeholder="Search name, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                height: 34,
                padding: "0 10px 0 28px",
                border: "1px solid #d1d5db",
                borderRadius: 7,
                fontSize: 12,
                outline: "none",
                boxSizing: "border-box"
              }}
            />
            <span
              style={{
                position: "absolute",
                left: 9,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 12,
                color: "#9ca3af",
                pointerEvents: "none"
              }}
            >
              🔍
            </span>
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  color: "#9ca3af",
                  cursor: "pointer",
                  fontSize: 12
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ROW 2: Date-wise Filter & Additional Refinements */}
        <div
          style={{
            paddingTop: 10,
            borderTop: "1px solid #f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap"
          }}
        >
          {/* Left: Date Preset & Date Pickers */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Date:</span>
              <select
                value={datePreset}
                onChange={(e) => handleDatePresetChange(e.target.value)}
                style={{
                  height: 32,
                  padding: "0 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#374151",
                  background: "#ffffff",
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="this_month">This Month</option>
                <option value="custom">Custom Range...</option>
              </select>
            </div>

            {/* Date Basis selector */}
            <select
              value={dateBasis}
              onChange={(e) => setDateBasis(e.target.value)}
              title="Select date field to filter by"
              style={{
                height: 32,
                padding: "0 8px",
                border: "1px solid #d1d5db",
                borderRadius: 7,
                fontSize: 11,
                fontWeight: 600,
                color: "#4b5563",
                background: "#f9fafb",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="registered">Registered Date</option>
              <option value="followup">Follow-up Date</option>
            </select>

            {/* Custom Range Date Pickers */}
            {(datePreset === "custom" || startDate || endDate) && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#f9fafb",
                  padding: "2px 8px",
                  borderRadius: 7,
                  border: "1px solid #e5e7eb"
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 650, color: "#6b7280" }}>From</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDatePreset("custom");
                  }}
                  style={{
                    height: 26,
                    border: "1px solid #d1d5db",
                    borderRadius: 5,
                    padding: "0 6px",
                    fontSize: 11,
                    color: "#111827",
                    background: "#ffffff"
                  }}
                />
                <span style={{ fontSize: 11, fontWeight: 650, color: "#6b7280" }}>To</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDatePreset("custom");
                  }}
                  style={{
                    height: 26,
                    border: "1px solid #d1d5db",
                    borderRadius: 5,
                    padding: "0 6px",
                    fontSize: 11,
                    color: "#111827",
                    background: "#ffffff"
                  }}
                />
              </div>
            )}

            {/* Clear Date Filter Button */}
            {(datePreset !== "all" || startDate || endDate) && (
              <button
                type="button"
                onClick={clearDateFilter}
                style={{
                  height: 26,
                  padding: "0 8px",
                  border: "1px solid #fecaca",
                  background: "#fef2f2",
                  color: "#b91c1c",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 650,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3
                }}
              >
                <span>✕</span> Clear Date
              </button>
            )}
          </div>

          {/* Right: Follow-up stage, Sort & Counter */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {/* Follow-up Stage Filter */}
            <select
              value={followupFilter}
              onChange={(e) => setFollowupFilter(e.target.value)}
              style={{
                height: 32,
                padding: "0 10px",
                border: "1px solid #d1d5db",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 600,
                color: "#374151",
                background: "#ffffff",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="all">All Follow-up Status</option>
              {FOLLOWUP_STAGES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{
                height: 32,
                padding: "0 8px",
                border: "1px solid #d1d5db",
                borderRadius: 7,
                fontSize: 11,
                fontWeight: 600,
                color: "#4b5563",
                background: "#ffffff",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="desc">⬇ Newest First</option>
              <option value="asc">⬆ Oldest First</option>
            </select>

            {/* Results Counter */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 650,
                color: "#4b5563",
                background: "#f3f4f6",
                padding: "5px 9px",
                borderRadius: 6,
                whiteSpace: "nowrap"
              }}
            >
              {filteredList.length} {filteredList.length === 1 ? "lead" : "leads"}
            </div>
          </div>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div
          style={{
            padding: "10px 14px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            color: "#b91c1c",
            marginBottom: 16,
            fontSize: 13
          }}
        >
          {error}
        </div>
      )}

      {/* =========================================================
          MEMBERS TABLE (CLEAN & MINIMALIST)
          ========================================================= */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
        }}
      >
        <div style={{ overflowX: "auto", width: "100%" }}>
          <table style={{ width: "100%", minWidth: 980, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {[
                  "#",
                  "Member",
                  "Contact Number",
                  "Status",
                  "Plan History",
                  "Registered",
                  "Follow-up Status",
                  "Action"
                ].map((th, i) => (
                  <th
                    key={i}
                    style={{
                      textAlign: i === 7 ? "right" : "left",
                      padding: "12px 16px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {th}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: 48, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                    Loading member records...
                  </td>
                </tr>
              ) : paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 48, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                    No members match the current filter or search.
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((member, index) => {
                  const rowNum = (currentPage - 1) * pageSize + index + 1;
                  const stage =
                    FOLLOWUP_STAGES.find((s) => s.value === member.followupStatus) || FOLLOWUP_STAGES[0];

                  return (
                    <tr
                      key={member.id}
                      style={{
                        borderBottom: "1px solid #f3f4f6",
                        transition: "background 0.12s"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* # */}
                      <td style={{ padding: "14px 16px", fontSize: 12, color: "#9ca3af", width: 40 }}>
                        {rowNum}
                      </td>

                      {/* MEMBER (AVATAR + NAME + EMAIL) */}
                      <td style={{ padding: "14px 16px", minWidth: 200 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: "50%",
                              background: "#f1f5f9",
                              color: "#475569",
                              fontSize: 12,
                              fontWeight: 750,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0
                            }}
                          >
                            {getInitials(member.name)}
                          </div>
                          <div>
                            <div
                              onClick={() => openDrawer(member)}
                              style={{
                                fontSize: 13,
                                fontWeight: 650,
                                color: "#111827",
                                cursor: "pointer"
                              }}
                            >
                              {member.name || "Member"}
                            </div>
                            <div style={{ fontSize: 11, color: "#6b7280" }}>
                              {member.email || "No email"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* CONTACT NUMBER + QUICK ACTION */}
                      <td style={{ padding: "14px 16px", minWidth: 190, whiteSpace: "nowrap" }}>
                        {member.cleanPhone ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                              +91 {member.cleanPhone}
                            </span>

                            {/* WhatsApp Icon */}
                            <a
                              href={getWhatsAppLink(member)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Chat on WhatsApp"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 26,
                                height: 26,
                                borderRadius: 6,
                                background: "#ecfdf5",
                                color: "#16a34a",
                                border: "1px solid #bbf7d0",
                                textDecoration: "none",
                                fontSize: 13
                              }}
                            >
                              💬
                            </a>

                            {/* Phone Call Icon */}
                            <a
                              href={`tel:+91${member.cleanPhone}`}
                              title="Call"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 26,
                                height: 26,
                                borderRadius: 6,
                                background: "#f1f5f9",
                                color: "#475569",
                                border: "1px solid #e2e8f0",
                                textDecoration: "none",
                                fontSize: 12
                              }}
                            >
                              📞
                            </a>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: "#9ca3af" }}>—</span>
                        )}
                      </td>

                      {/* STATUS BADGE */}
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "3px 9px",
                            borderRadius: 999,
                            background: member.statusTheme.bg,
                            color: member.statusTheme.color,
                            border: `1px solid ${member.statusTheme.border}`,
                            fontSize: 11,
                            fontWeight: 700
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: member.statusTheme.color
                            }}
                          />
                          {member.statusLabel}
                        </span>
                        {member.isCancelled2ndPayment && (
                          <div style={{ fontSize: 10, color: "#be123c", fontWeight: 700, marginTop: 4 }}>
                            ⚡ Inactive · 2nd Renewal Cancelled
                          </div>
                        )}
                      </td>

                      {/* PLAN HISTORY */}
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <div style={{ fontSize: 12, fontWeight: 650, color: "#111827" }}>
                          {member.planAmount ? `₹${member.planAmount}` : "Free Signup"}
                        </div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>
                          {member.planName}
                        </div>
                        {member.effectivePaidCount > 0 && (
                          <div style={{ fontSize: 10, color: member.isCancelled2ndPayment ? "#be123c" : "#6b7280", fontWeight: 650, marginTop: 2 }}>
                            {member.effectivePaidCount} {member.effectivePaidCount === 1 ? "cycle" : "cycles"} paid
                          </div>
                        )}
                      </td>

                      {/* REGISTERED DATE */}
                      <td style={{ padding: "14px 16px", fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>
                        <div>{formatDate(member.createdAt || member.joinedAt)}</div>
                        {member.followupUpdatedAt && (
                          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
                            Follow-up: {formatDate(member.followupUpdatedAt)}
                          </div>
                        )}
                      </td>

                      {/* FOLLOW-UP STATUS SELECT */}
                      <td style={{ padding: "14px 16px", minWidth: 150 }}>
                        <select
                          value={member.followupStatus}
                          onChange={(e) => handleQuickStatusChange(member.id, e.target.value)}
                          style={{
                            height: 28,
                            padding: "0 8px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 650,
                            border: `1px solid ${stage.color}40`,
                            background: stage.bg,
                            color: stage.color,
                            cursor: "pointer",
                            outline: "none"
                          }}
                        >
                          {FOLLOWUP_STAGES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        {member.followupNotes && (
                          <div
                            onClick={() => openDrawer(member)}
                            title={member.followupNotes}
                            style={{
                              fontSize: 11,
                              color: "#6b7280",
                              marginTop: 4,
                              maxWidth: 160,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              cursor: "pointer"
                            }}
                          >
                            📝 {member.followupNotes}
                          </div>
                        )}
                      </td>

                      {/* ACTION: OPEN DRAWER */}
                      <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <button
                          type="button"
                          onClick={() => openDrawer(member)}
                          style={{
                            height: 30,
                            padding: "0 12px",
                            border: "1px solid #e5e7eb",
                            background: "#ffffff",
                            borderRadius: 6,
                            color: "#374151",
                            fontSize: 12,
                            fontWeight: 650,
                            cursor: "pointer",
                            transition: "all 0.15s"
                          }}
                        >
                          {member.followupNotes ? "Notes 📝" : "Follow-up →"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* =========================================================
            PAGINATION
            ========================================================= */}
        <div
          style={{
            padding: "12px 18px",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
            color: "#6b7280"
          }}
        >
          <div>
            Showing {filteredList.length ? (currentPage - 1) * pageSize + 1 : 0} –{" "}
            {Math.min(currentPage * pageSize, filteredList.length)} of {filteredList.length} members
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  height: 28,
                  padding: "0 10px",
                  border: "1px solid #d1d5db",
                  background: currentPage === 1 ? "#f9fafb" : "#ffffff",
                  color: currentPage === 1 ? "#9ca3af" : "#374151",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: currentPage === 1 ? "not-allowed" : "pointer"
                }}
              >
                Previous
              </button>
              <span style={{ display: "flex", alignItems: "center", padding: "0 6px", fontWeight: 600 }}>
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  height: 28,
                  padding: "0 10px",
                  border: "1px solid #d1d5db",
                  background: currentPage === totalPages ? "#f9fafb" : "#ffffff",
                  color: currentPage === totalPages ? "#9ca3af" : "#374151",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer"
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================
          SLIDE-OVER FOLLOW-UP DRAWER (Modern CRM Style)
          ========================================================= */}
      {activeDrawerMember && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(17, 24, 39, 0.4)",
            backdropFilter: "blur(2px)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "flex-end"
          }}
          onClick={closeDrawer}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 440,
              height: "100%",
              background: "#ffffff",
              boxShadow: "-8px 0 24px rgba(0,0,0,0.12)",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              boxSizing: "border-box"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start"
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 750, color: "#111827" }}>
                  {activeDrawerMember.name || "Member Details"}
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>
                  Member ID: {activeDrawerMember.id}
                </p>
              </div>

              <button
                type="button"
                onClick={closeDrawer}
                style={{
                  border: "none",
                  background: "#f3f4f6",
                  color: "#6b7280",
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14
                }}
              >
                ✕
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ padding: "20px 24px", flex: 1 }}>
              {/* Alert Banner for Cancelled 2nd Payment */}
              {activeDrawerMember.isCancelled2ndPayment && (
                <div
                  style={{
                    background: "#fff1f2",
                    border: "1px solid #fecdd3",
                    borderRadius: 10,
                    padding: "12px 14px",
                    marginBottom: 18
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 750, color: "#be123c", fontSize: 13 }}>
                    <span>🎯</span> Cancelled 2nd Payment Follow-up
                  </div>
                  <div style={{ fontSize: 12, color: "#4c0519", marginTop: 4, lineHeight: 1.45 }}>
                    This member completed <strong>Month 1 ({activeDrawerMember.effectivePaidCount || 1} cycle)</strong> and their 2nd payment renewal was cancelled/unpaid. Call or message them now to offer a renewal incentive and reactivate their account!
                  </div>
                </div>
              )}

              {/* Member Summary Card */}
              <div
                style={{
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: "14px 16px",
                  marginBottom: 20
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase" }}>Phone</div>
                    <div style={{ fontSize: 13, fontWeight: 650, color: "#111827", marginTop: 2 }}>
                      {activeDrawerMember.phone || "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase" }}>Email</div>
                    <div style={{ fontSize: 13, fontWeight: 650, color: "#111827", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {activeDrawerMember.email || "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase" }}>Status</div>
                    <div style={{ marginTop: 2 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: activeDrawerMember.statusTheme.bg,
                          color: activeDrawerMember.statusTheme.color
                        }}
                      >
                        {activeDrawerMember.statusLabel}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase" }}>Registered</div>
                    <div style={{ fontSize: 13, color: "#374151", marginTop: 2 }}>
                      {formatDate(activeDrawerMember.createdAt || activeDrawerMember.joinedAt)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Communication Action Buttons */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10 }}>
                  Direct Outreach:
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <a
                    href={getWhatsAppLink(activeDrawerMember, "standard")}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      height: 38,
                      background: "#25D366",
                      color: "#ffffff",
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: "none"
                    }}
                  >
                    💬 WhatsApp
                  </a>

                  <a
                    href={`tel:+91${activeDrawerMember.cleanPhone}`}
                    style={{
                      flex: 1,
                      height: 38,
                      background: "#0f172a",
                      color: "#ffffff",
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: "none"
                    }}
                  >
                    📞 Call Now
                  </a>
                </div>
              </div>

              {/* WhatsApp Message Templates */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
                  Quick WhatsApp Templates:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {activeDrawerMember.isCancelled2ndPayment && (
                    <a
                      href={getWhatsAppLink(activeDrawerMember, "2nd_payment")}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #fecdd3",
                        background: "#fff1f2",
                        fontSize: 12,
                        color: "#9f1239",
                        textDecoration: "none",
                        fontWeight: 700
                      }}
                    >
                      <strong>Template (Recommended):</strong> 2nd Month Renewal Recovery Offer →
                    </a>
                  )}
                  <a
                    href={getWhatsAppLink(activeDrawerMember, "discount")}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      background: "#ffffff",
                      fontSize: 12,
                      color: "#374151",
                      textDecoration: "none"
                    }}
                  >
                    <strong>Template 1:</strong> Special Renewal Offer →
                  </a>
                  <a
                    href={getWhatsAppLink(activeDrawerMember, "checkin")}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      background: "#ffffff",
                      fontSize: 12,
                      color: "#374151",
                      textDecoration: "none"
                    }}
                  >
                    <strong>Template 2:</strong> Friendly Re-subscription Check-in →
                  </a>
                </div>
              </div>

              {/* Follow-up Status Update */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                  Update Follow-up Status:
                </label>
                <select
                  value={drawerStatus}
                  onChange={(e) => setDrawerStatus(e.target.value)}
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 10px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 13,
                    fontWeight: 600,
                    outline: "none"
                  }}
                >
                  {FOLLOWUP_STAGES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Follow-up Notes Textarea */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                  Call / Follow-up Notes:
                </label>
                <textarea
                  rows={4}
                  value={drawerNotes}
                  onChange={(e) => setDrawerNotes(e.target.value)}
                  placeholder="e.g. Spoke to customer, promised to subscribe next week..."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 13,
                    fontFamily: "inherit",
                    outline: "none",
                    boxSizing: "border-box",
                    resize: "vertical"
                  }}
                />
              </div>

              {saveSuccessMsg && (
                <div style={{ fontSize: 12, color: "#15803d", fontWeight: 700, marginBottom: 12 }}>
                  ✓ {saveSuccessMsg}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                background: "#fafafa"
              }}
            >
              <button
                type="button"
                onClick={closeDrawer}
                style={{
                  height: 38,
                  padding: "0 16px",
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#374151",
                  cursor: "pointer"
                }}
              >
                Close
              </button>
              <button
                type="button"
                disabled={savingDrawer}
                onClick={saveDrawerData}
                style={{
                  height: 38,
                  padding: "0 20px",
                  border: "none",
                  background: "#111827",
                  color: "#ffffff",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: savingDrawer ? "not-allowed" : "pointer"
                }}
              >
                {savingDrawer ? "Saving..." : "Save Status & Notes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.AdminUnsubscribedMembers = UnsubscribedMembers;
export default UnsubscribedMembers;
