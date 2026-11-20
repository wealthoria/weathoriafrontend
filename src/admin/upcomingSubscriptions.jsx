/* global React, window */
import React, { useState, useEffect, useMemo, useCallback } from "react";

const { MIcon } = window;

/* =========================================================================
   HELPER UTILITIES
   ========================================================================= */

function safeDate(val) {
  if (!val) return null;
  try {
    if (typeof val.toDate === "function") return val.toDate();
    if (val._seconds) return new Date(val._seconds * 1000);
    if (val.seconds) return new Date(val.seconds * 1000);
    const num = Number(val);
    if (!isNaN(num) && num > 1000000000 && num < 2000000000) {
      return new Date(num * 1000);
    }
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

function formatRelativeDays(targetDate) {
  const d = safeDate(targetDate);
  if (!d) return "—";
  const now = new Date();
  const diffTime = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Due Today";
  if (diffDays === 1) return "Due Tomorrow";
  if (diffDays > 1 && diffDays <= 7) return `Due in ${diffDays} days`;
  if (diffDays > 7) return `In ${diffDays} days`;
  if (diffDays === -1) return "1 day ago";
  return `${Math.abs(diffDays)} days ago`;
}

function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
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

/* =========================================================================
   UPCOMING SUBSCRIPTIONS SCREEN (ACTIVE MEMBERS ONLY)
   ========================================================================= */

function UpcomingSubscriptions() {
  const [members, setMembers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [dueFilter, setDueFilter] = useState("all"); // all, today, 7days, 15days, 30days, resubscribed
  const [expandedMemberId, setExpandedMemberId] = useState(null);
  const [sortField, setSortField] = useState("nextBilling"); // nextBilling, name, cycles, joinDate
  const [sortDirection, setSortDirection] = useState("asc");

  // Real-time Firestore Listeners
  useEffect(() => {
    if (!window.db) {
      setError("Database is not initialized.");
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubMembers = null;
    let unsubSubs = null;

    try {
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
          console.error("Members load error:", err);
          setError("Failed to load members: " + (err.message || "Permission denied"));
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
          console.warn("Subscriptions load error:", err);
        }
      );
    } catch (e) {
      setError("Error initializing listeners: " + e.message);
      setLoading(false);
    }

    return () => {
      if (unsubMembers) unsubMembers();
      if (unsubSubs) unsubSubs();
    };
  }, []);

  /* -------------------------------------------------------------
     PROCESS & RECONSTRUCT ACTIVE MEMBERS & CYCLES
     ------------------------------------------------------------- */
  const activeMembersData = useMemo(() => {
    // 1. Index members by email, uid, id, phone
    const memberMap = new Map();
    (members || []).forEach((m) => {
      if (m.id) memberMap.set(String(m.id).trim(), m);
      if (m.uid) memberMap.set(String(m.uid).trim(), m);
      if (m.email) memberMap.set(String(m.email).toLowerCase().trim(), m);
      if (m.phone) memberMap.set(String(m.phone).trim(), m);
    });

    // 2. Group subscriptions by member email/id
    const subsByMemberKey = new Map();

    (subscriptions || []).forEach((sub) => {
      const email = String(sub.email || sub.customerEmail || "").toLowerCase().trim();
      const memberId = String(sub.memberId || sub.userId || "").trim();
      const phone = String(sub.phone || sub.phoneNumber || sub.customerPhone || "").trim();

      const member = memberMap.get(memberId) || (email ? memberMap.get(email) : null) || (phone ? memberMap.get(phone) : null);
      const key = member?.email || email || memberId || sub.id;

      if (!subsByMemberKey.has(key)) {
        subsByMemberKey.set(key, { member, subs: [] });
      }
      subsByMemberKey.get(key).subs.push(sub);
    });

    // 3. Filter to ONLY ACTIVE MEMBERS with recurring subscriptions
    const result = [];

    subsByMemberKey.forEach(({ member, subs }, key) => {
      // Find active subscription(s)
      const activeSubs = subs.filter((s) => {
        const st = String(s.status || s.razorpayStatus || "").toLowerCase();
        return st === "active" || st === "authenticated";
      });

      // User requested: "I WANT ONLY ACTIVE MEMBERS"
      if (!activeSubs.length) return;

      // Pick primary active subscription (newest)
      const activeSub = activeSubs.sort((a, b) => {
        const tA = safeDate(a.createdAt || a.subscriptionStartDate)?.getTime() || 0;
        const tB = safeDate(b.createdAt || b.subscriptionStartDate)?.getTime() || 0;
        return tB - tA;
      })[0];

      // Identify previous cancelled / halted subscriptions
      const cancelledSubs = subs.filter((s) => {
        const st = String(s.status || s.razorpayStatus || "").toLowerCase();
        return st === "cancelled" || st === "halted" || st === "expired";
      });

      const isResubscribed = cancelledSubs.length > 0 && activeSubs.length > 0;

      // Calculate initial signup date across all subscriptions
      const allStarts = subs
        .map((s) => safeDate(s.subscriptionStartDate || s.createdAt || s.startDate))
        .filter(Boolean)
        .sort((a, b) => a.getTime() - b.getTime());

      const initialJoinDate = allStarts[0] || safeDate(activeSub.createdAt) || new Date();
      const activeSubStartDate = safeDate(activeSub.subscriptionStartDate || activeSub.createdAt) || initialJoinDate;

      // Next billing date
      let nextBilling = safeDate(activeSub.nextBillingDate);
      if (!nextBilling) {
        // Fallback: start date + (paidCount * 30 days)
        const count = Number(activeSub.paidCount || 1);
        nextBilling = addMonths(activeSubStartDate, count);
      }

      // Calculate total paid count
      const activePaidCount = Number(activeSub.paidCount || activeSub.paid_count || 1);
      const cancelledPaidCount = cancelledSubs.reduce((sum, cs) => sum + Number(cs.paidCount || cs.paid_count || 1), 0);
      const totalPaidCycles = isResubscribed ? (cancelledPaidCount + activePaidCount) : activePaidCount;

      // Build month-by-month payment cycles (Cycle 1, Cycle 2, Cycle 3, Cycle 4, etc.)
      const cycles = [];
      const totalCyclesToShow = Math.max(totalPaidCycles + 2, 4);

      let currentCycleDate = new Date(initialJoinDate);

      for (let i = 1; i <= totalCyclesToShow; i++) {
        const cycleNum = i;
        let isPaid = false;
        let isNextDue = false;
        let isFutureScheduled = false;
        let paymentDate = null;
        let paymentAmount = activeSub.amount || 99;
        let subRefId = activeSub.id;

        if (cycleNum <= totalPaidCycles) {
          isPaid = true;
          // Approximate or actual cycle date
          if (cycleNum === 1) {
            paymentDate = initialJoinDate;
            if (isResubscribed && cancelledSubs[0]) {
              subRefId = cancelledSubs[0].id;
            }
          } else if (isResubscribed && cycleNum === cancelledPaidCount + 1) {
            paymentDate = activeSubStartDate;
          } else {
            paymentDate = addMonths(initialJoinDate, cycleNum - 1);
          }
        } else if (cycleNum === totalPaidCycles + 1) {
          isNextDue = true;
          paymentDate = nextBilling;
        } else {
          isFutureScheduled = true;
          const monthsAhead = cycleNum - (totalPaidCycles + 1);
          paymentDate = addMonths(nextBilling, monthsAhead);
        }

        cycles.push({
          cycleNum,
          label: `${cycleNum === 1 ? "1st" : cycleNum === 2 ? "2nd" : cycleNum === 3 ? "3rd" : `${cycleNum}th`} Month`,
          date: paymentDate,
          amount: paymentAmount,
          isPaid,
          isNextDue,
          isFutureScheduled,
          subRefId
        });
      }

      // Generate the narrative description of lifecycle & cycles
      const timelineEvents = [];

      // Step 1: Initial Signup
      timelineEvents.push({
        date: initialJoinDate,
        type: "signup",
        badge: "Initial Join",
        badgeColor: "#15803d",
        badgeBg: "#dcfce7",
        title: "Subscribed & Paid 1st Month (Cycle #1)",
        details: `Paid ₹${activeSub.amount || 99} via UPI/Card. Initial mandate created.`
      });

      // If cancelled in between
      if (isResubscribed) {
        cancelledSubs.forEach((cs) => {
          const cancelDate = safeDate(cs.cancelledAt || cs.updatedAt) || activeSubStartDate;
          timelineEvents.push({
            date: cancelDate,
            type: "cancelled",
            badge: "Mandate Cancelled",
            badgeColor: "#dc2626",
            badgeBg: "#fee2e2",
            title: `Mandate (${cs.id}) was cancelled`,
            details: `Customer or system cancelled recurring mandate after ${cs.paidCount || 1} payment cycle.`
          });
        });

        timelineEvents.push({
          date: activeSubStartDate,
          type: "resubscribed",
          badge: "Re-Subscribed",
          badgeColor: "#7c3aed",
          badgeBg: "#ede9fe",
          title: `Re-subscribed with new mandate (${activeSub.id})`,
          details: `Member restarted membership on ${formatDate(activeSubStartDate)} and paid ₹${activeSub.amount || 99}.`
        });
      } else if (activePaidCount > 1) {
        // Continuous renewal
        for (let c = 2; c <= activePaidCount; c++) {
          const renewDate = addMonths(activeSubStartDate, c - 1);
          timelineEvents.push({
            date: renewDate,
            type: "renewed",
            badge: "Auto-Renewed",
            badgeColor: "#15803d",
            badgeBg: "#dcfce7",
            title: `Cycle #${c} Auto-Debited Successfully`,
            details: `Recurring payment # ${c} (₹${activeSub.amount || 99}) captured successfully.`
          });
        }
      }

      // Next Upcoming Debit event
      timelineEvents.push({
        date: nextBilling,
        type: "upcoming",
        badge: "Upcoming Auto-Debit",
        badgeColor: "#0284c7",
        badgeBg: "#e0f2fe",
        title: `Upcoming Cycle #${totalPaidCycles + 1} Debit Scheduled`,
        details: `Next renewal of ₹${activeSub.amount || 99} scheduled to debit on ${formatDate(nextBilling)} (${formatRelativeDays(nextBilling)}).`
      });

      // Narrative text summary
      let narrativeSummary = "";
      if (isResubscribed) {
        narrativeSummary = `Member joined on ${formatDate(initialJoinDate)} and paid 1st cycle. Later cancelled mandate (${cancelledSubs[0]?.id || "previous"}), then re-subscribed on ${formatDate(activeSubStartDate)} under active mandate ${activeSub.id}. Currently active with ${totalPaidCycles} total cycles paid. Next renewal is scheduled for ${formatDate(nextBilling)}.`;
      } else {
        narrativeSummary = `Member subscribed on ${formatDate(initialJoinDate)} under mandate ${activeSub.id}. Completed ${activePaidCount} payment cycle${activePaidCount > 1 ? "s" : ""}. Active continuous auto-debit. Next renewal scheduled on ${formatDate(nextBilling)} (${formatRelativeDays(nextBilling)}).`;
      }

      const memberName = member?.name || member?.fullName || activeSub.name || activeSub.customerName || "Subscriber";
      const memberEmail = member?.email || activeSub.email || activeSub.customerEmail || key;
      const memberPhone = member?.phone || activeSub.phone || activeSub.phoneNumber || activeSub.customerPhone || "—";

      result.push({
        id: member?.id || activeSub.id,
        memberId: member?.id || activeSub.memberId || null,
        activeSubId: activeSub.id,
        name: memberName,
        email: memberEmail,
        phone: memberPhone,
        plan: activeSub.plan || activeSub.planName || "Wealthoria Premium - Monthly",
        amount: activeSub.amount || 99,
        status: "active",
        initialJoinDate,
        activeSubStartDate,
        nextBilling,
        totalPaidCycles,
        activePaidCount,
        isResubscribed,
        cycles,
        timelineEvents,
        narrativeSummary,
        activeSub,
        cancelledSubs
      });
    });

    return result;
  }, [members, subscriptions]);

  /* -------------------------------------------------------------
     FILTERING & SEARCH
     ------------------------------------------------------------- */
  const filteredMembers = useMemo(() => {
    return activeMembersData.filter((item) => {
      // 1. Search filter
      if (search) {
        const q = search.toLowerCase().trim();
        const matchesName = String(item.name || "").toLowerCase().includes(q);
        const matchesEmail = String(item.email || "").toLowerCase().includes(q);
        const matchesPhone = String(item.phone || "").toLowerCase().includes(q);
        const matchesSubId = String(item.activeSubId || "").toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesSubId) return false;
      }

      // 2. Due Date Window filter
      if (dueFilter !== "all") {
        const now = new Date();
        const dueTime = item.nextBilling ? item.nextBilling.getTime() : 0;
        const diffDays = Math.ceil((dueTime - now.getTime()) / (1000 * 60 * 60 * 24));

        if (dueFilter === "today") {
          if (diffDays !== 0 && diffDays !== 1) return false;
        } else if (dueFilter === "7days") {
          if (diffDays < 0 || diffDays > 7) return false;
        } else if (dueFilter === "15days") {
          if (diffDays < 0 || diffDays > 15) return false;
        } else if (dueFilter === "30days") {
          if (diffDays < 0 || diffDays > 30) return false;
        } else if (dueFilter === "resubscribed") {
          if (!item.isResubscribed) return false;
        }
      }

      return true;
    }).sort((a, b) => {
      let comp = 0;
      if (sortField === "nextBilling") {
        comp = (a.nextBilling?.getTime() || 0) - (b.nextBilling?.getTime() || 0);
      } else if (sortField === "name") {
        comp = a.name.localeCompare(b.name);
      } else if (sortField === "cycles") {
        comp = b.totalPaidCycles - a.totalPaidCycles;
      } else if (sortField === "joinDate") {
        comp = (b.initialJoinDate?.getTime() || 0) - (a.initialJoinDate?.getTime() || 0);
      }
      return sortDirection === "asc" ? comp : -comp;
    });
  }, [activeMembersData, search, dueFilter, sortField, sortDirection]);

  /* -------------------------------------------------------------
     KPI METRICS
     ------------------------------------------------------------- */
  const metrics = useMemo(() => {
    const totalActive = activeMembersData.length;
    const now = new Date();

    let dueToday = 0;
    let due7Days = 0;
    let due30Days = 0;
    let resubscribedCount = 0;
    let expectedRevenue = 0;

    activeMembersData.forEach((m) => {
      const dueTime = m.nextBilling ? m.nextBilling.getTime() : 0;
      const diffDays = Math.ceil((dueTime - now.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0 || diffDays === 1) dueToday++;
      if (diffDays >= 0 && diffDays <= 7) due7Days++;
      if (diffDays >= 0 && diffDays <= 30) due30Days++;
      if (m.isResubscribed) resubscribedCount++;
      expectedRevenue += m.amount || 99;
    });

    return {
      totalActive,
      dueToday,
      due7Days,
      due30Days,
      resubscribedCount,
      expectedRevenue
    };
  }, [activeMembersData]);

  /* -------------------------------------------------------------
     EXCEL EXPORT
     ------------------------------------------------------------- */
  const handleExportExcel = async () => {
    try {
      await loadXLSX();
      const rows = filteredMembers.map((m, idx) => {
        const c1 = m.cycles[0];
        const c2 = m.cycles[1];
        const c3 = m.cycles[2];
        const c4 = m.cycles[3];

        return {
          "SL No": idx + 1,
          "Member Name": m.name,
          "Email ID": m.email,
          "Phone": m.phone,
          "Subscription ID": m.activeSubId,
          "Status": "Active",
          "Initial Join Date": formatDate(m.initialJoinDate),
          "Total Cycles Paid": m.totalPaidCycles,
          "Upcoming Renewal Date": formatDate(m.nextBilling),
          "Upcoming Due In": formatRelativeDays(m.nextBilling),
          "1st Month Payment": c1 ? `${formatDate(c1.date)} (₹${c1.amount}) - ${c1.isPaid ? "Paid" : "Due"}` : "—",
          "2nd Month Payment": c2 ? `${formatDate(c2.date)} (₹${c2.amount}) - ${c2.isPaid ? "Paid" : c2.isNextDue ? "Next Due" : "Scheduled"}` : "—",
          "3rd Month Payment": c3 ? `${formatDate(c3.date)} (₹${c3.amount}) - ${c3.isPaid ? "Paid" : c3.isNextDue ? "Next Due" : "Scheduled"}` : "—",
          "4th Month Payment": c4 ? `${formatDate(c4.date)} (₹${c4.amount}) - ${c4.isPaid ? "Paid" : c4.isNextDue ? "Next Due" : "Scheduled"}` : "—",
          "Re-subscribed After Cancel?": m.isResubscribed ? "Yes" : "No",
          "Lifecycle Description": m.narrativeSummary
        };
      });

      const ws = window.XLSX.utils.json_to_sheet(rows);
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, "Upcoming Subscriptions");
      window.XLSX.writeFile(wb, `Wealthoria_Upcoming_Subscriptions_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      alert("Failed to export Excel: " + err.message);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 16px 60px" }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 24 }}>📅</span>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "var(--text, #111827)" }}>
              Upcoming Subscriptions & Billing Cycles
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted, #64748b)" }}>
            Real-time tracking of active recurring members, 1st month & 2nd month cycle payments, and full cancellation/re-subscription history.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportExcel}
          style={{
            padding: "9px 16px",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            background: "#ffffff",
            color: "#0f172a",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}
        >
          <span>📥</span>
          <span>Export Excel</span>
        </button>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* TOP KPI CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 20 }}>
        {/* CARD 1: TOTAL ACTIVE */}
        <div
          onClick={() => setDueFilter("all")}
          style={{
            padding: "16px 18px",
            background: dueFilter === "all" ? "#f0fdf4" : "#ffffff",
            border: dueFilter === "all" ? "2px solid #16a34a" : "1px solid #e2e8f0",
            borderRadius: 12,
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
            🟢 Total Active Members
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#111827" }}>
            {metrics.totalActive}
          </div>
          <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
            Active recurring mandates
          </div>
        </div>

        {/* CARD 2: DUE TODAY / 24H */}
        <div
          onClick={() => setDueFilter(dueFilter === "today" ? "all" : "today")}
          style={{
            padding: "16px 18px",
            background: dueFilter === "today" ? "#fef3c7" : "#ffffff",
            border: dueFilter === "today" ? "2px solid #d97706" : "1px solid #e2e8f0",
            borderRadius: 12,
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
            ⏰ Due Today / 24h
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#b45309" }}>
            {metrics.dueToday}
          </div>
          <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
            Renewals debiting today/tomorrow
          </div>
        </div>

        {/* CARD 3: DUE IN 7 DAYS */}
        <div
          onClick={() => setDueFilter(dueFilter === "7days" ? "all" : "7days")}
          style={{
            padding: "16px 18px",
            background: dueFilter === "7days" ? "#e0f2fe" : "#ffffff",
            border: dueFilter === "7days" ? "2px solid #0284c7" : "1px solid #e2e8f0",
            borderRadius: 12,
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "#0284c7", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
            📅 Due in 7 Days
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#0369a1" }}>
            {metrics.due7Days}
          </div>
          <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
            Next week auto-debits
          </div>
        </div>

        {/* CARD 4: RE-SUBSCRIBED RETENTION */}
        <div
          onClick={() => setDueFilter(dueFilter === "resubscribed" ? "all" : "resubscribed")}
          style={{
            padding: "16px 18px",
            background: dueFilter === "resubscribed" ? "#ede9fe" : "#ffffff",
            border: dueFilter === "resubscribed" ? "2px solid #7c3aed" : "1px solid #e2e8f0",
            borderRadius: 12,
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
            🔄 Re-Subscribed
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#6d28d9" }}>
            {metrics.resubscribedCount}
          </div>
          <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
            Cancelled before & restarted
          </div>
        </div>

        {/* CARD 5: FORECASTED REVENUE */}
        <div
          style={{
            padding: "16px 18px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
            💰 Monthly Run-Rate
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>
            ₹{metrics.expectedRevenue.toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
            Per 30-day recurring cycle
          </div>
        </div>
      </div>

      {/* TOOLBAR: SEARCH & DUE FILTERS */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "14px 16px",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          marginBottom: 16,
          flexWrap: "wrap"
        }}
      >
        {/* SEARCH */}
        <div style={{ flex: "1 1 300px", position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search member name, email, phone, sub_xxx..."
            style={{
              width: "100%",
              padding: "9px 12px 9px 36px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 13,
              boxSizing: "border-box",
              outline: "none"
            }}
          />
        </div>

        {/* DUE FILTER BUTTONS */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginRight: 4 }}>Filter:</span>
          {[
            { key: "all", label: "All Active" },
            { key: "today", label: "Today / 24h" },
            { key: "7days", label: "Next 7 Days" },
            { key: "30days", label: "Next 30 Days" },
            { key: "resubscribed", label: "🔄 Re-Subscribed" }
          ].map((pill) => {
            const active = dueFilter === pill.key;
            return (
              <button
                key={pill.key}
                type="button"
                onClick={() => setDueFilter(pill.key)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: active ? "1px solid #0284c7" : "1px solid #e2e8f0",
                  background: active ? "#e0f2fe" : "#ffffff",
                  color: active ? "#0369a1" : "#475569",
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer"
                }}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TABLE */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          overflowX: "auto",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
        }}
      >
        {loading ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#64748b" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
            <div style={{ fontWeight: 600 }}>Loading active upcoming subscriptions...</div>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#64748b" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔎</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>No active subscriptions found</div>
            <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 4 }}>
              Try adjusting your search query or due date filter.
            </div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                <th style={{ padding: "12px 16px" }}>Subscriber</th>
                <th style={{ padding: "12px 14px" }}>Next Auto-Debit</th>
                <th style={{ padding: "12px 14px" }}>1st Month Payment</th>
                <th style={{ padding: "12px 14px" }}>2nd Month Payment</th>
                <th style={{ padding: "12px 14px" }}>3rd Month Payment</th>
                <th style={{ padding: "12px 14px" }}>4th Month Payment</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Lifecycle & History</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((item) => {
                const isExpanded = expandedMemberId === item.id;
                const c1 = item.cycles[0];
                const c2 = item.cycles[1];
                const c3 = item.cycles[2];
                const c4 = item.cycles[3];

                return (
                  <React.Fragment key={item.id}>
                    <tr
                      style={{
                        borderBottom: isExpanded ? "none" : "1px solid #f1f5f9",
                        background: isExpanded ? "#f8fafc" : "#ffffff",
                        transition: "background 0.15s ease"
                      }}
                    >
                      {/* 1. SUBSCRIBER INFO */}
                      <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: item.isResubscribed ? "#ede9fe" : "#e0f2fe",
                              color: item.isResubscribed ? "#6d28d9" : "#0369a1",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                              fontWeight: 800,
                              flexShrink: 0
                            }}
                          >
                            {getInitials(item.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 13.5 }}>
                              {item.name}
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>
                              {item.email}
                            </div>
                            <div style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                              <span>📞 {item.phone}</span>
                              <span>•</span>
                              <span style={{ fontFamily: "monospace", color: "#475569" }}>{item.activeSubId}</span>
                              {item.isResubscribed && (
                                <span
                                  style={{
                                    fontSize: 9.5,
                                    fontWeight: 800,
                                    padding: "1px 5px",
                                    borderRadius: 4,
                                    background: "#ede9fe",
                                    color: "#6d28d9"
                                  }}
                                  title="Customer previously cancelled a mandate and started a new subscription"
                                >
                                  🔄 Re-Subscribed
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. NEXT AUTO-DEBIT (UPCOMING) */}
                      <td style={{ padding: "14px 14px", verticalAlign: "middle" }}>
                        <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 13 }}>
                          {formatDate(item.nextBilling)}
                        </div>
                        <div style={{ marginTop: 2 }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 7px",
                              borderRadius: 4,
                              fontSize: 10.5,
                              fontWeight: 750,
                              background:
                                formatRelativeDays(item.nextBilling).includes("Today") || formatRelativeDays(item.nextBilling).includes("Tomorrow")
                                  ? "#fef3c7"
                                  : "#e0f2fe",
                              color:
                                formatRelativeDays(item.nextBilling).includes("Today") || formatRelativeDays(item.nextBilling).includes("Tomorrow")
                                  ? "#b45309"
                                  : "#0369a1"
                            }}
                          >
                            {formatRelativeDays(item.nextBilling)} • ₹{item.amount}
                          </span>
                        </div>
                      </td>

                      {/* 3. 1ST MONTH PAYMENT */}
                      <td style={{ padding: "14px 14px", verticalAlign: "middle" }}>
                        {c1 ? (
                          <div>
                            <div style={{ fontWeight: 600, color: "#0f172a" }}>
                              {formatDate(c1.date)}
                            </div>
                            <div style={{ marginTop: 2 }}>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  background: "#dcfce7",
                                  color: "#15803d"
                                }}
                              >
                                ₹{c1.amount} Paid ✓
                              </span>
                            </div>
                          </div>
                        ) : "—"}
                      </td>

                      {/* 4. 2ND MONTH PAYMENT */}
                      <td style={{ padding: "14px 14px", verticalAlign: "middle" }}>
                        {c2 ? (
                          <div>
                            <div style={{ fontWeight: 600, color: c2.isPaid ? "#0f172a" : "#64748b" }}>
                              {formatDate(c2.date)}
                            </div>
                            <div style={{ marginTop: 2 }}>
                              {c2.isPaid ? (
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 800,
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    background: "#dcfce7",
                                    color: "#15803d"
                                  }}
                                >
                                  ₹{c2.amount} Paid ✓
                                </span>
                              ) : c2.isNextDue ? (
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 800,
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    background: "#fef3c7",
                                    color: "#b45309"
                                  }}
                                >
                                  ₹{c2.amount} Due Soon ⏳
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    background: "#f1f5f9",
                                    color: "#64748b"
                                  }}
                                >
                                  ₹{c2.amount} Scheduled ⏰
                                </span>
                              )}
                            </div>
                          </div>
                        ) : "—"}
                      </td>

                      {/* 5. 3RD MONTH PAYMENT */}
                      <td style={{ padding: "14px 14px", verticalAlign: "middle" }}>
                        {c3 ? (
                          <div>
                            <div style={{ fontWeight: 600, color: c3.isPaid ? "#0f172a" : "#64748b" }}>
                              {formatDate(c3.date)}
                            </div>
                            <div style={{ marginTop: 2 }}>
                              {c3.isPaid ? (
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 800,
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    background: "#dcfce7",
                                    color: "#15803d"
                                  }}
                                >
                                  ₹{c3.amount} Paid ✓
                                </span>
                              ) : c3.isNextDue ? (
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 800,
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    background: "#fef3c7",
                                    color: "#b45309"
                                  }}
                                >
                                  ₹{c3.amount} Next Due ⏳
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    background: "#f1f5f9",
                                    color: "#64748b"
                                  }}
                                >
                                  ₹{c3.amount} Scheduled ⏰
                                </span>
                              )}
                            </div>
                          </div>
                        ) : "—"}
                      </td>

                      {/* 6. 4TH MONTH PAYMENT */}
                      <td style={{ padding: "14px 14px", verticalAlign: "middle" }}>
                        {c4 ? (
                          <div>
                            <div style={{ fontWeight: 600, color: c4.isPaid ? "#0f172a" : "#64748b" }}>
                              {formatDate(c4.date)}
                            </div>
                            <div style={{ marginTop: 2 }}>
                              {c4.isPaid ? (
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 800,
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    background: "#dcfce7",
                                    color: "#15803d"
                                  }}
                                >
                                  ₹{c4.amount} Paid ✓
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    background: "#f1f5f9",
                                    color: "#64748b"
                                  }}
                                >
                                  ₹{c4.amount} Scheduled ⏰
                                </span>
                              )}
                            </div>
                          </div>
                        ) : "—"}
                      </td>

                      {/* 7. EXPAND/ACTION BUTTON */}
                      <td style={{ padding: "14px 16px", textAlign: "right", verticalAlign: "middle" }}>
                        <button
                          type="button"
                          onClick={() => setExpandedMemberId(isExpanded ? null : item.id)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 6,
                            border: "1px solid #cbd5e1",
                            background: isExpanded ? "#0284c7" : "#ffffff",
                            color: isExpanded ? "#ffffff" : "#0f172a",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4
                          }}
                        >
                          <span>{isExpanded ? "Hide Details ▲" : "View History ▼"}</span>
                        </button>
                      </td>
                    </tr>

                    {/* EXPANDED DETAILED LIFECYCLE & TIMELINE ROW */}
                    {isExpanded && (
                      <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                        <td colSpan={7} style={{ padding: "16px 20px 24px" }}>
                          <div
                            style={{
                              background: "#ffffff",
                              border: "1px solid #e2e8f0",
                              borderRadius: 10,
                              padding: "18px 20px",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
                            }}
                          >
                            {/* NARRATIVE STORY SUMMARY */}
                            <div style={{ marginBottom: 18 }}>
                              <div style={{ fontSize: 12, fontWeight: 750, color: "#0284c7", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
                                📖 Member Subscription Lifecycle Description:
                              </div>
                              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "#1e293b", fontWeight: 500, background: "#f0f9ff", border: "1px solid #bae6fd", padding: "10px 14px", borderRadius: 8 }}>
                                {item.narrativeSummary}
                              </p>
                            </div>

                            {/* TIMELINE STEPS */}
                            <div style={{ marginBottom: 14 }}>
                              <div style={{ fontSize: 12, fontWeight: 750, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>
                                ⏱️ Step-by-Step Payment & Cycle Timeline:
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {item.timelineEvents.map((evt, eIdx) => (
                                  <div
                                    key={eIdx}
                                    style={{
                                      display: "flex",
                                      alignItems: "flex-start",
                                      gap: 12,
                                      padding: "8px 12px",
                                      background: "#f8fafc",
                                      border: "1px solid #f1f5f9",
                                      borderRadius: 8
                                    }}
                                  >
                                    <div style={{ minWidth: 100, fontSize: 12, fontWeight: 700, color: "#64748b" }}>
                                      {formatDate(evt.date)}
                                    </div>
                                    <span
                                      style={{
                                        fontSize: 10.5,
                                        fontWeight: 800,
                                        padding: "2px 7px",
                                        borderRadius: 4,
                                        background: evt.badgeBg,
                                        color: evt.badgeColor,
                                        flexShrink: 0
                                      }}
                                    >
                                      {evt.badge}
                                    </span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                                        {evt.title}
                                      </div>
                                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                                        {evt.details}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* QUICK ACTIONS */}
                            <div style={{ display: "flex", gap: 10, paddingTop: 10, borderTop: "1px solid #f1f5f9", flexWrap: "wrap" }}>
                              {item.phone && item.phone !== "—" && (
                                <a
                                  href={`https://wa.me/91${item.phone.replace(/[^0-9]/g, "").slice(-10)}?text=${encodeURIComponent(`Hello ${item.name}, this is from Wealthoria regarding your subscription renewal.`)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    textDecoration: "none",
                                    padding: "6px 12px",
                                    borderRadius: 6,
                                    background: "#25D366",
                                    color: "#ffffff",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6
                                  }}
                                >
                                  <span>💬</span> Chat on WhatsApp
                                </a>
                              )}
                              <a
                                href={`mailto:${item.email}?subject=${encodeURIComponent("Wealthoria Membership Subscription Update")}`}
                                style={{
                                  textDecoration: "none",
                                  padding: "6px 12px",
                                  borderRadius: 6,
                                  background: "#0284c7",
                                  color: "#ffffff",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6
                                }}
                              >
                                <span>✉️</span> Email Member
                              </a>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Router globals
window.UpcomingSubscriptions = UpcomingSubscriptions;
window.AdminUpcomingSubscriptions = UpcomingSubscriptions;

export default UpcomingSubscriptions;

