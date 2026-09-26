import React from "react";

/* global React, window */

/* =========================================================================
   Wealthoria Admin — Members
   Clean members table + search + CSV/Excel export
   ========================================================================= */

const {
  useState,
  useEffect,
  useMemo
} = React;

const {
  Shell,
  MIcon
} = window;


/* =========================================================================
   HELPERS
   ========================================================================= */

function normalizeValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}


function displayValue(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return String(value);
}


function formatMemberDate(value) {

  if (!value) {
    return "—";
  }

  try {

    if (
      typeof value.toDate ===
      "function"
    ) {

      return value
        .toDate()
        .toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
            year: "numeric"
          }
        );

    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "—";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );

  } catch (error) {

    return "—";

  }
}


/* =========================================================================
   CSV HELPER
   ========================================================================= */

function csvCell(value) {

  const text =
    value === null ||
    value === undefined
      ? ""
      : String(value);

  return `"${text
    .replace(/"/g, '""')
    .replace(/\r?\n/g, " ")
  }"`;

}


function downloadBlob(
  blob,
  filename
) {

  const url =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement(
      "a"
    );

  link.href = url;

  link.download =
    filename;

  document.body.appendChild(
    link
  );

  link.click();

  document.body.removeChild(
    link
  );

  setTimeout(() => {

    URL.revokeObjectURL(
      url
    );

  }, 1000);

}


/* =========================================================================
   EXPORT CSV
   ========================================================================= */
function exportMembersCSV(members) {
  const headers = [
    "Member Name",
    "Email",
    "Phone Number",
    "Member ID",
    "Role",
    "Member Status",
    "Subscription Status",
    "Subscription Plan",
    "Subscription Amount",
    "Subscription Start",
    "Next Billing Date",
    "Razorpay Subscription ID",
    "Joined Date"
  ];

  const rows = members.map((member) => [
    member.name,
    member.email,
    member.phone,
    member.uid,
    member.role,
    member.status,
    member.subscriptionStatusDisplay,
    member.subscriptionPlanDisplay,
    member.subscriptionAmount !== null &&
    member.subscriptionAmount !== undefined &&
    member.subscriptionAmount !== ""
      ? `${member.subscriptionCurrency === "INR" ? "₹" : ""}${member.subscriptionAmount}`
      : "",
    formatMemberDate(member.subscriptionStartDate),
    formatMemberDate(member.nextBillingDate),
    member.razorpaySubscriptionId,
    formatMemberDate(member.joinedAt)
  ]);

  const csv = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(","))
  ].join("\r\n");

  const blob = new Blob(
    ["\uFEFF" + csv],
    { type: "text/csv;charset=utf-8;" }
  );

  downloadBlob(
    blob,
    "wealthoria-members.csv"
  );
}

/* =========================================================================
   EXPORT EXCEL
   ========================================================================= */

function exportMembersExcel(members) {
  const headers = [
    "Member Name",
    "Email",
    "Phone Number",
    "Member ID",
    "Role",
    "Member Status",
    "Subscription Status",
    "Subscription Plan",
    "Subscription Amount",
    "Subscription Start",
    "Next Billing Date",
    "Razorpay Subscription ID",
    "Joined Date"
  ];

  const rows = members.map((member) => [
    member.name,
    member.email,
    member.phone,
    member.uid,
    member.role,
    member.status,
    member.subscriptionStatusDisplay,
    member.subscriptionPlanDisplay,
    member.subscriptionAmount !== null &&
    member.subscriptionAmount !== undefined &&
    member.subscriptionAmount !== ""
      ? `${member.subscriptionCurrency === "INR" ? "₹" : ""}${member.subscriptionAmount}`
      : "",
    formatMemberDate(member.subscriptionStartDate),
    formatMemberDate(member.nextBillingDate),
    member.razorpaySubscriptionId,
    formatMemberDate(member.joinedAt)
  ]);

  const escapeHtml = (value) => {
    return String(
      value === null || value === undefined ? "" : value
    )
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  const headerHtml = headers
    .map((header) => `<th>${escapeHtml(header)}</th>`)
    .join("");

  const bodyHtml = rows
    .map(
      (row) =>
        `<tr>${row
          .map((cell) => `<td>${escapeHtml(cell)}</td>`)
          .join("")}</tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; }
  table { border-collapse: collapse; width: 100%; }
  th {
    background: #e8473f;
    color: #ffffff;
    font-weight: bold;
    border: 1px solid #d9d9d9;
    padding: 8px;
    text-align: left;
  }
  td {
    border: 1px solid #d9d9d9;
    padding: 8px;
    vertical-align: top;
  }
</style>
</head>
<body>
<table>
<thead><tr>${headerHtml}</tr></thead>
<tbody>${bodyHtml}</tbody>
</table>
</body>
</html>`;

  const blob = new Blob(
    ["\uFEFF", html],
    { type: "application/vnd.ms-excel;charset=utf-8;" }
  );

  downloadBlob(
    blob,
    "wealthoria-members.xls"
  );
}

/* =========================================================================
   MEMBERS SCREEN
   ========================================================================= */

function UsersScreen() {

  const [members, setMembers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [memberStatusFilter, setMemberStatusFilter] =
    useState("all");

  const [subscriptionStatusFilter, setSubscriptionStatusFilter] =
    useState("all");

  const [subscriptionPlanFilter, setSubscriptionPlanFilter] =
    useState("all");

  const [subscriptions, setSubscriptions] =
    useState([]);

  const [actionLoading, setActionLoading] =
    useState("");

  const API_BASE_URL =
    "https://asia-south1-wealthoria-6fc11.cloudfunctions.net";


  /* =======================================================
     LOAD MEMBERS
  ======================================================= */

  useEffect(() => {

    if (!window.db) {

      setError(
        "Firebase Firestore is not available."
      );

      setLoading(false);

      return;
    }

    let unsubscribeMembers = null;
    let unsubscribeSubscriptions = null;

    try {

      unsubscribeMembers =
        window.db
          .collection("members")
          .onSnapshot(

            (snapshot) => {

              const rows =
                snapshot.docs.map(
                  (doc) => {

                    const data =
                      doc.data() || {};

                    return {

                      id:
                        doc.id,

                      uid:
                        data.uid ||
                        data.userId ||
                        doc.id,

                      name:
                        data.name ||
                        data.fullName ||
                        data.displayName ||
                        data.username ||
                        "—",

                      email:
                        data.email ||
                        data.emailAddress ||
                        "—",

                      phone:
                        data.phone ||
                        data.phoneNumber ||
                        data.mobile ||
                        data.mobileNumber ||
                        "—",

                      role:
                        data.role ||
                        "member",

                      status:
                        data.status ||
                        (
                          data.active === false
                            ? "inactive"
                            : "active"
                        ),

                      joinedAt:
                        data.createdAt ||
                        data.joinedAt ||
                        data.registeredAt ||
                        data.createdOn ||
                        null,

                      city:
                        data.city ||
                        "",

                      state:
                        data.state ||
                        "",

                      country:
                        data.country ||
                        "",

                      occupation:
                        data.occupation ||
                        data.job ||
                        "",

                      company:
                        data.company ||
                        "",

                      gender:
                        data.gender ||
                        "",

                      dateOfBirth:
                        data.dateOfBirth ||
                        data.dob ||
                        "",

                      notificationEnabled:
                        Boolean(
                          data.fcmToken
                        )

                    };

                  }
                );

              rows.sort(
                (a, b) => {

                  return String(a.name)
                    .toLowerCase()
                    .localeCompare(
                      String(b.name).toLowerCase()
                    );

                }
              );

              setMembers(rows);
              setLoading(false);
              setError("");

            },

            (firebaseError) => {

              console.error(
                "Members Firestore error:",
                firebaseError
              );

              setError(
                firebaseError?.message ||
                "Unable to load members."
              );

              setLoading(false);

            }

          );

      /*
       * Load the complete subscriptions collection and join it
       * with members in the browser. This allows cancelled,
       * halted, paused, active and historical subscription records
       * to remain visible without changing the subscription data.
       */
      unsubscribeSubscriptions =
        window.db
          .collection("subscriptions")
          .onSnapshot(

            (snapshot) => {

              const subscriptionRows =
                snapshot.docs.map(
                  (doc) => ({
                    id: doc.id,
                    ...(doc.data() || {})
                  })
                );

              setSubscriptions(
                subscriptionRows
              );

            },

            (firebaseError) => {

              console.error(
                "Subscriptions Firestore error:",
                firebaseError
              );

              setSubscriptions([]);

              setError(
                firebaseError?.message ||
                "Unable to load subscriptions."
              );

            }

          );

    } catch (error) {

      console.error(
        "Members initialization error:",
        error
      );

      setError(
        error?.message ||
        "Unable to load members."
      );

      setLoading(false);

    }

    return () => {

      if (
        typeof unsubscribeMembers ===
        "function"
      ) {
        unsubscribeMembers();
      }

      if (
        typeof unsubscribeSubscriptions ===
        "function"
      ) {
        unsubscribeSubscriptions();
      }

    };

  }, []);


  /* =======================================================
     SEARCH
  ======================================================= */

  const joinedMembers = useMemo(() => {

    function toMillis(value) {
      if (!value) return 0;

      try {
        if (typeof value.toDate === "function") {
          return value.toDate().getTime();
        }

        const date = new Date(value);
        const time = date.getTime();

        return Number.isNaN(time)
          ? 0
          : time;
      } catch {
        return 0;
      }
    }

    function subscriptionMatches(member, subscription) {
      const memberUid = normalizeValue(member.uid);
      const memberEmail = normalizeValue(member.email);

      const subscriptionUid = normalizeValue(subscription.uid);

      const subscriptionUserId = normalizeValue(subscription.userId);

      const subscriptionMemberId = normalizeValue(subscription.memberId);

      const subscriptionEmail = normalizeValue(subscription.email);

      return Boolean(
        (memberUid &&
          (
            subscriptionUid === memberUid ||
            subscriptionUserId === memberUid ||
            subscriptionMemberId === memberUid
          )) ||
        (
          memberEmail &&
          memberEmail !== "—" &&
          subscriptionEmail === memberEmail
        )
      );
    }

    return members.map((member) => {

      const memberSubscriptions =
        subscriptions
          .filter((subscription) =>
            subscriptionMatches(
              member,
              subscription
            )
          )
          .sort(
            (a, b) =>
              toMillis(
                b.updatedAt ||
                b.createdAt ||
                b.subscriptionStartDate
              ) -
              toMillis(
                a.updatedAt ||
                a.createdAt ||
                a.subscriptionStartDate
              )
          );

      const statuses = [
        ...new Set(
          memberSubscriptions
            .flatMap((subscription) => [
              subscription.status,
              subscription.razorpayStatus
            ])
            .map((value) =>
              String(value || "")
                .trim()
                .toLowerCase()
            )
            .filter(Boolean)
        )
      ];

      const plans = [
        ...new Set(
          memberSubscriptions
            .map(
              (subscription) =>
                String(
                  subscription.plan ||
                  subscription.planName ||
                  subscription.planId ||
                  ""
                ).trim()
            )
            .filter(Boolean)
        )
      ];

      const latestSubscription =
        memberSubscriptions[0] || null;

      const statusLabels = statuses.map(
        (status) =>
          status.charAt(0).toUpperCase() +
          status.slice(1)
      );

      const planLabels = plans.filter(Boolean);

      return {
        ...member,

        subscriptions:
          memberSubscriptions,

        subscriptionStatuses:
          statuses,

        subscriptionPlans:
          plans,

        subscriptionStatusDisplay:
          latestSubscription
            ? String(
                latestSubscription.status ||
                latestSubscription.razorpayStatus ||
                "unknown"
              )
                .trim()
                .toLowerCase()
                .replace(
                  /^./,
                  (char) => char.toUpperCase()
                )
            : "No subscription",

        subscriptionPlanDisplay:
          latestSubscription
            ? String(
                latestSubscription.plan ||
                latestSubscription.planName ||
                latestSubscription.planId ||
                "—"
              ).trim()
            : "—",

        subscriptionStatusPrimary:
          statuses[0] || "none",

        subscriptionPlanPrimary:
          normalizeValue(
            latestSubscription?.plan ||
            latestSubscription?.planName ||
            latestSubscription?.planId ||
            ""
          ),

        subscriptionAmount:
          latestSubscription?.amount ??
          latestSubscription?.price ??
          null,

        subscriptionCurrency:
          latestSubscription?.currency ||
          "INR",

        subscriptionStartDate:
          latestSubscription?.subscriptionStartDate ||
          latestSubscription?.startDate ||
          latestSubscription?.createdAt ||
          null,

        nextBillingDate:
          latestSubscription?.nextBillingDate ||
          latestSubscription?.nextBilling ||
          null,

        razorpaySubscriptionId:
          latestSubscription?.razorpaySubscriptionId ||
          "",

        razorpayPaymentId:
          latestSubscription?.razorpayPaymentId ||
          "",

        subscriptionCount:
          memberSubscriptions.length,

      };

    });

  }, [
    members,
    subscriptions
  ]);


  const filteredMembers =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();

      return joinedMembers.filter(
        (member) => {

          const searchable =
            [

              member.uid,

              member.name,

              member.email,

              member.phone,

              member.role,

              member.status,

              member.city,

              member.state,

              member.country,

              member.occupation,

              member.company,

              member.gender,

              member.dateOfBirth,

              member.subscriptionStatusDisplay,

              member.subscriptionPlanDisplay,

              member.subscriptionAmount,

              member.razorpaySubscriptionId,

              member.razorpayPaymentId

            ]
              .map(
                (value) =>
                  String(value || "")
                    .toLowerCase()
              );

          const matchesSearch =
            !query ||
            searchable.some(
              (value) =>
                value.includes(query)
            );

          const normalizedMemberStatus = normalizeValue(member.status || "active");

          const matchesMemberStatus =
            memberStatusFilter === "all" ||
            normalizedMemberStatus ===
              memberStatusFilter;

          const matchesSubscriptionStatus =
            subscriptionStatusFilter === "all" ||
            (
              subscriptionStatusFilter === "none"
                ? member.subscriptionStatuses.length === 0
                : member.subscriptionStatuses.includes(
                    subscriptionStatusFilter
                  )
            );

          const matchesSubscriptionPlan =
            subscriptionPlanFilter === "all" ||
            member.subscriptionPlans.some(
              (plan) =>
                normalizeValue(plan) ===
                subscriptionPlanFilter
            );

          return (
            matchesSearch &&
            matchesMemberStatus &&
            matchesSubscriptionStatus &&
            matchesSubscriptionPlan
          );

        }
      );

    }, [
      joinedMembers,
      search,
      memberStatusFilter,
      subscriptionStatusFilter,
      subscriptionPlanFilter
    ]);


  const subscriptionStatusOptions =
    useMemo(() => {

      const values = new Set();

      joinedMembers.forEach(
        (member) => {
          member.subscriptionStatuses.forEach(
            (status) => values.add(status)
          );
        }
      );

      return Array.from(values).sort();

    }, [joinedMembers]);


  const subscriptionPlanOptions =
    useMemo(() => {

      const values = new Map();

      joinedMembers.forEach(
        (member) => {
          member.subscriptionPlans.forEach(
            (plan) => {
              const key = normalizeValue(plan);

              if (!values.has(key)) {
                values.set(
                  key,
                  String(plan).trim()
                );
              }
            }
          );
        }
      );

      return Array.from(
        values.entries()
      )
        .sort((a, b) =>
          a[1].localeCompare(b[1])
        );

    }, [joinedMembers]);


  /* =======================================================
     EXPORT CURRENT FILTERED RESULTS
  ======================================================= */

  const handleCSVExport =
    () => {

      exportMembersCSV(
        filteredMembers
      );

    };


  const handleExcelExport =
    () => {

      exportMembersExcel(
        filteredMembers
      );

    };


  /* =======================================================
     MEMBER ACTIONS
  ======================================================= */

  async function getAdminToken() {
    const currentUser = window.auth?.currentUser;

    if (!currentUser) {
      throw new Error(
        "Admin session not found. Please login again."
      );
    }

    return currentUser.getIdToken(true);
  }


  async function handleDeactivate(member) {
    const uid = String(member.uid || "").trim();

    if (!uid) {
      setError("Member UID is missing.");
      return;
    }

    const currentStatus =
      String(member.status || "active")
        .trim()
        .toLowerCase();

    if (currentStatus === "deactivated") {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to deactivate ${
        member.name || member.email || "this member"
      }?\n\nThe member will not be able to log in.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(`deactivate:${uid}`);
      setError("");

      const token =
        await getAdminToken();

      const response = await fetch(
        `${API_BASE_URL}/api/admin/members/deactivate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            uid,
          }),
        }
      );

      const data =
        await response.json().catch(
          () => ({})
        );

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
          "Unable to deactivate member."
        );
      }

      /*
       * Firestore onSnapshot will update the
       * table automatically.
       */
      setError("");

    } catch (error) {
      console.error(
        "Deactivate member error:",
        error
      );

      setError(
        error?.message ||
        "Unable to deactivate member."
      );
    } finally {
      setActionLoading("");
    }
  }


  async function handleActivate(member) {
    const uid = String(member.uid || "").trim();

    if (!uid) {
      setError("Member UID is missing.");
      return;
    }

    const currentStatus =
      String(member.status || "active")
        .trim()
        .toLowerCase();

    if (currentStatus !== "deactivated") {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to activate ${
        member.name || member.email || "this member"
      }?\n\nThe member will be able to log in again.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(`activate:${uid}`);
      setError("");

      const token = await getAdminToken();

      const response = await fetch(
        `${API_BASE_URL}/api/admin/members/activate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ uid }),
        }
      );

      const data =
        await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to activate member."
        );
      }

      setError("");
    } catch (error) {
      console.error("Activate member error:", error);

      setError(
        error?.message || "Unable to activate member."
      );
    } finally {
      setActionLoading("");
    }
  }


  async function handleDelete(member) {
    const uid = String(member.uid || "").trim();

    if (!uid) {
      setError("Member UID is missing.");
      return;
    }

    const displayName =
      member.name ||
      member.email ||
      "this member";

    const confirmed = window.confirm(
      `PERMANENT DELETE\n\n` +
      `Are you sure you want to permanently delete ${displayName}?\n\n` +
      `This will delete the member account, subscriptions, ` +
      `course purchases, notifications, student records and ` +
      `Firebase Authentication account.\n\n` +
      `THIS ACTION CANNOT BE UNDONE.`
    );

    if (!confirmed) {
      return;
    }

    /*
     * Second confirmation for the destructive action.
     */
    const finalConfirmation =
      window.confirm(
        `Final confirmation:\n\n` +
        `Delete ${displayName} permanently?`
      );

    if (!finalConfirmation) {
      return;
    }

    try {
      setActionLoading(`delete:${uid}`);
      setError("");

      const token =
        await getAdminToken();

      const response = await fetch(
        `${API_BASE_URL}/api/admin/members/delete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            uid,
          }),
        }
      );

      const data =
        await response.json().catch(
          () => ({})
        );

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
          "Unable to delete member."
        );
      }

      /*
       * The Firestore onSnapshot listener will
       * remove the deleted member from the table.
       */
      setError("");

    } catch (error) {
      console.error(
        "Delete member error:",
        error
      );

      setError(
        error?.message ||
        "Unable to delete member."
      );
    } finally {
      setActionLoading("");
    }
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <Shell
      title="Members"
      subtitle={
        `${members.length} registered members`
      }
    >

      <div
        className="members-admin-page"
        style={{
          width: "100%"
        }}
      >


        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div
          style={{
            display:
              "flex",

            alignItems:
              "flex-end",

            justifyContent:
              "space-between",

            gap:
              20,

            marginBottom:
              22,

            flexWrap:
              "wrap"
          }}
        >


          <div>

            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                gap:
                  10,

                marginBottom:
                  6
              }}
            >

              <h2
                style={{
                  margin: 0,

                  fontSize:
                    26,

                  lineHeight:
                    1.2,

                  fontWeight:
                    800,

                  color:
                    "var(--ink, #111827)"
                }}
              >
                Members
              </h2>


              <span
                style={{
                  display:
                    "inline-flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  minWidth:
                    32,

                  height:
                    24,

                  padding:
                    "0 8px",

                  borderRadius:
                    999,

                  background:
                    "#fde9e5",

                  color:
                    "#c94337",

                  fontSize:
                    12,

                  fontWeight:
                    800
                }}
              >
                {members.length}
              </span>

            </div>


            <p
              style={{
                margin:
                  0,

                fontSize:
                  14,

                color:
                  "var(--muted, #6b7280)"
              }}
            >
              View, search and export your
              registered members.
            </p>

          </div>


          {/* =================================================
              EXPORT BUTTONS
          ================================================= */}

          <div
            style={{
              display:
                "flex",

              gap:
                10,

              flexWrap:
                "wrap"
            }}
          >

            <button
              type="button"
              onClick={
                handleCSVExport
              }
              disabled={
                loading ||
                filteredMembers.length === 0
              }
              style={{
                height:
                  42,

                padding:
                  "0 15px",

                display:
                  "inline-flex",

                alignItems:
                  "center",

                gap:
                  8,

                border:
                  "1px solid #d9dde3",

                borderRadius:
                  10,

                background:
                  "#ffffff",

                color:
                  "#25313f",

                fontSize:
                  13,

                fontWeight:
                  700,

                cursor:
                  loading ||
                  filteredMembers.length === 0
                    ? "not-allowed"
                    : "pointer",

                opacity:
                  loading ||
                  filteredMembers.length === 0
                    ? 0.5
                    : 1
              }}
            >

              <MIcon
                name="download"
                size={16}
              />

              Export CSV

            </button>


            <button
              type="button"
              onClick={
                handleExcelExport
              }
              disabled={
                loading ||
                filteredMembers.length === 0
              }
              style={{
                height:
                  42,

                padding:
                  "0 15px",

                display:
                  "inline-flex",

                alignItems:
                  "center",

                gap:
                  8,

                border:
                  "1px solid #d7e6db",

                borderRadius:
                  10,

                background:
                  "#edf8ef",

                color:
                  "#217a36",

                fontSize:
                  13,

                fontWeight:
                  700,

                cursor:
                  loading ||
                  filteredMembers.length === 0
                    ? "not-allowed"
                    : "pointer",

                opacity:
                  loading ||
                  filteredMembers.length === 0
                    ? 0.5
                    : 1
              }}
            >

              <MIcon
                name="download"
                size={16}
              />

              Export Excel

            </button>

          </div>

        </div>


        {/* =================================================
            TOOLBAR + FILTERS
        ================================================= */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            marginBottom: 16,
            padding: 14,
            background: "var(--surface, #ffffff)",
            border: "1px solid var(--line, #e5e7eb)",
            borderRadius: 12,
            flexWrap: "wrap"
          }}
        >

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flex: "1 1 520px",
              flexWrap: "wrap"
            }}
          >

            {/* SEARCH */}

            <div
              style={{
                position: "relative",
                flex: "1 1 360px",
                minWidth: 260
              }}
            >

              <MIcon
                name="search"
                size={17}
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#8a939e",
                  pointerEvents: "none"
                }}
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder={
                  "Search name, email, phone number, member ID, payment ID or subscription..."
                }
                aria-label="Search members"
                style={{
                  width: "100%",
                  height: 44,
                  padding: "0 42px",
                  border: "1px solid #dfe3e8",
                  borderRadius: 9,
                  outline: "none",
                  background: "#ffffff",
                  color: "#202833",
                  fontSize: 14
                }}
              />

            </div>

            {/* MEMBER STATUS */}

            <select
              value={memberStatusFilter}
              onChange={(event) =>
                setMemberStatusFilter(
                  event.target.value
                )
              }
              aria-label="Filter member status"
              style={{
                height: 44,
                minWidth: 150,
                padding: "0 12px",
                border: "1px solid #dfe3e8",
                borderRadius: 9,
                background: "#ffffff",
                color: "#202833",
                fontSize: 13,
                outline: "none"
              }}
            >
              <option value="all">
                All member status
              </option>
              <option value="active">
                Active
              </option>
              <option value="deactivated">
                Deactivated
              </option>
              <option value="inactive">
                Inactive
              </option>
              <option value="disabled">
                Disabled
              </option>
              <option value="blocked">
                Blocked
              </option>
              <option value="suspended">
                Suspended
              </option>
            </select>

            {/* SUBSCRIPTION STATUS */}

            <select
              value={subscriptionStatusFilter}
              onChange={(event) =>
                setSubscriptionStatusFilter(
                  event.target.value
                )
              }
              aria-label="Filter subscription status"
              style={{
                height: 44,
                minWidth: 170,
                padding: "0 12px",
                border: "1px solid #dfe3e8",
                borderRadius: 9,
                background: "#ffffff",
                color: "#202833",
                fontSize: 13,
                outline: "none"
              }}
            >
              <option value="all">
                All subscription status
              </option>
              <option value="none">
                No subscription
              </option>
              {subscriptionStatusOptions.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status.charAt(0).toUpperCase() +
                      status.slice(1)}
                  </option>
                )
              )}
            </select>

            {/* PLAN */}

            <select
              value={subscriptionPlanFilter}
              onChange={(event) =>
                setSubscriptionPlanFilter(
                  event.target.value
                )
              }
              aria-label="Filter subscription plan"
              style={{
                height: 44,
                minWidth: 160,
                padding: "0 12px",
                border: "1px solid #dfe3e8",
                borderRadius: 9,
                background: "#ffffff",
                color: "#202833",
                fontSize: 13,
                outline: "none"
              }}
            >
              <option value="all">
                All plans
              </option>
              {subscriptionPlanOptions.map(
                ([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                )
              )}
            </select>


          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10
            }}
          >

            <div
              style={{
                fontSize: 13,
                color: "var(--muted, #6b7280)",
                whiteSpace: "nowrap"
              }}
            >
              {search ||
              memberStatusFilter !== "all" ||
              subscriptionStatusFilter !== "all" ||
              subscriptionPlanFilter !== "all"
                ? `${filteredMembers.length} result${filteredMembers.length === 1 ? "" : "s"}`
                : `${members.length} members`}
            </div>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setMemberStatusFilter("all");
                setSubscriptionStatusFilter("all");
                setSubscriptionPlanFilter("all");
              }}
              disabled={
                !search &&
                memberStatusFilter === "all" &&
                subscriptionStatusFilter === "all" &&
                subscriptionPlanFilter === "all"
              }
              style={{
                height: 38,
                padding: "0 12px",
                border: "1px solid #dfe3e8",
                borderRadius: 8,
                background: "#ffffff",
                color: "#59636e",
                fontSize: 12,
                fontWeight: 700,
                cursor:
                  !search &&
                  memberStatusFilter === "all" &&
                  subscriptionStatusFilter === "all" &&
                  subscriptionPlanFilter === "all"
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  !search &&
                  memberStatusFilter === "all" &&
                  subscriptionStatusFilter === "all" &&
                  subscriptionPlanFilter === "all"
                    ? 0.5
                    : 1
              }}
            >
              Clear filters
            </button>

          </div>

        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div
            style={{
              marginBottom:
                16,

              padding:
                "13px 15px",

              borderRadius:
                10,

              border:
                "1px solid #f1c5c0",

              background:
                "#fff3f1",

              color:
                "#b42318",

              fontSize:
                13
            }}
          >

            {error}

          </div>

        )}


        {/* =================================================
            TABLE
        ================================================= */}

        <div
          style={{
            background:
              "var(--surface, #ffffff)",

            border:
              "1px solid var(--line, #e5e7eb)",

            borderRadius:
              14,

            overflow:
              "hidden",

            boxShadow:
              "0 4px 16px rgba(25,35,45,0.04)"
          }}
        >


          {loading ? (

            <div
              style={{
                minHeight:
                  240,

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                color:
                  "var(--muted, #6b7280)",

                fontSize:
                  14
              }}
            >

              Loading members...

            </div>


          ) : filteredMembers.length === 0 ? (

            <div
              style={{
                minHeight:
                  240,

                display:
                  "flex",

                flexDirection:
                  "column",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                padding:
                  30,

                textAlign:
                  "center"
              }}
            >

              <div
                style={{
                  width:
                    48,

                  height:
                    48,

                  borderRadius:
                    "50%",

                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  background:
                    "#f3f5f7",

                  marginBottom:
                    12
                }}
              >

                <MIcon
                  name="search"
                  size={20}
                />

              </div>


              <strong
                style={{
                  fontSize:
                    15,

                  marginBottom:
                    5
                }}
              >
                No members found
              </strong>


              <span
                style={{
                  fontSize:
                    13,

                  color:
                    "var(--muted, #6b7280)"
                }}
              >
                Try another name, email,
                phone number or member ID.
              </span>

            </div>


          ) : (

            <div
              style={{
                width:
                  "100%",

                overflowX:
                  "auto"
              }}
            >

              <table
                style={{
                  width:
                    "100%",

                  minWidth:
                    1750,

                  borderCollapse:
                    "collapse"
                }}
              >


                {/* =================================================
                    HEAD
                ================================================= */}

                <thead>

                  <tr
                    style={{
                      background:
                        "#f8fafb",

                      borderBottom:
                        "1px solid #e4e7eb"
                    }}
                  >

                    {[
                      "#",
                      "MEMBER",
                      "EMAIL",
                      "PHONE",
                      "MEMBER ID",                      "ROLE",
                      "MEMBER STATUS",
                      "SUBSCRIPTION STATUS",
                      "PLAN",
                      "AMOUNT",
                      "SUBSCRIPTION START",
                      "NEXT BILLING",
                      "RAZORPAY SUBSCRIPTION ID",
                      "JOINED",
                      "ACTIONS"
                    ].map(
                      (heading) => (

                        <th
                          key={
                            heading
                          }
                          style={{
                            padding:
                              "13px 14px",

                            textAlign:
                              "left",

                            fontSize:
                              11,

                            fontWeight:
                              800,

                            letterSpacing:
                              "0.04em",

                            color:
                              "#6b7280",

                            whiteSpace:
                              "nowrap"
                          }}
                        >
                          {heading}
                        </th>

                      )
                    )}

                  </tr>

                </thead>


                {/* =================================================
                    BODY
                ================================================= */}

                <tbody>

                  {filteredMembers.map(
                    (
                      member,
                      index
                    ) => (

                      <tr
                        key={
                          member.id
                        }
                        style={{
                          borderBottom:
                            "1px solid #eef0f2"
                        }}
                      >


                        {/* INDEX */}

                        <td
                          style={{
                            padding:
                              "15px 14px",

                            color:
                              "#8a939e",

                            fontSize:
                              12
                          }}
                        >
                          {index + 1}
                        </td>


                        {/* MEMBER */}

                        <td
                          style={{
                            padding:
                              "15px 14px"
                          }}
                        >

                          <div
                            style={{
                              display:
                                "flex",

                              alignItems:
                                "center",

                              gap:
                                10
                            }}
                          >

                            <div
                              style={{
                                width:
                                  38,

                                height:
                                  38,

                                flex:
                                  "0 0 38px",

                                display:
                                  "flex",

                                alignItems:
                                  "center",

                                justifyContent:
                                  "center",

                                borderRadius:
                                  "50%",

                                background:
                                  "#fde9e5",

                                color:
                                  "#c94337",

                                fontWeight:
                                  800,

                                fontSize:
                                  14
                              }}
                            >

                              {String(
                                member.name
                              )
                                .charAt(0)
                                .toUpperCase()}

                            </div>


                            <div
                              style={{
                                minWidth:
                                  140
                              }}
                            >

                              <div
                                style={{
                                  fontSize:
                                    13,

                                  fontWeight:
                                    750,

                                  color:
                                    "#202833"
                                }}
                              >
                                {displayValue(
                                  member.name
                                )}
                              </div>


                              <div
                                style={{
                                  marginTop:
                                    3,

                                  fontSize:
                                    11,

                                  color:
                                    "#89929d"
                                }}
                              >
                                Member
                              </div>

                            </div>

                          </div>

                        </td>


                        {/* EMAIL */}

                        <td
                          style={{
                            padding:
                              "15px 14px",

                            fontSize:
                              13,

                            color:
                              "#374151",

                            whiteSpace:
                              "nowrap"
                          }}
                        >
                          {displayValue(
                            member.email
                          )}
                        </td>


                        {/* PHONE */}

                        <td
                          style={{
                            padding:
                              "15px 14px",

                            fontSize:
                              13,

                            color:
                              "#374151",

                            whiteSpace:
                              "nowrap"
                          }}
                        >
                          {displayValue(
                            member.phone
                          )}
                        </td>


                        {/* MEMBER ID */}

                        <td
                          style={{
                            padding:
                              "15px 14px",

                            fontFamily:
                              "ui-monospace, SFMono-Regular, Menlo, monospace",

                            fontSize:
                              11,

                            color:
                              "#59636e",

                            maxWidth:
                              190,

                            wordBreak:
                              "break-all"
                          }}
                        >
                          {displayValue(
                            member.uid
                          )}
                        </td>


                        {/* ROLE */}

                        <td
                          style={{
                            padding:
                              "15px 14px",

                            fontSize:
                              12,

                            color:
                              "#4b5563"
                          }}
                        >
                          {displayValue(
                            member.role
                          )}
                        </td>


                        {/* STATUS */}

                        <td
                          style={{
                            padding:
                              "15px 14px"
                          }}
                        >

                          <span
                            style={{
                              display:
                                "inline-flex",

                              alignItems:
                                "center",

                              gap:
                                6,

                              padding:
                                "5px 9px",

                              borderRadius:
                                999,

                              background:
                                String(
                                  member.status
                                )
                                  .toLowerCase() ===
                                "active"
                                  ? "#eaf7ed"
                                  : "#f1f3f5",

                              color:
                                String(
                                  member.status
                                )
                                  .toLowerCase() ===
                                "active"
                                  ? "#217a36"
                                  : "#69727c",

                              fontSize:
                                11,

                              fontWeight:
                                750
                            }}
                          >

                            <span
                              style={{
                                width:
                                  6,

                                height:
                                  6,

                                borderRadius:
                                  "50%",

                                background:
                                  String(
                                    member.status
                                  )
                                    .toLowerCase() ===
                                  "active"
                                    ? "#2ead4b"
                                    : "#9aa1a8"
                              }}
                            />

                            {displayValue(
                              member.status
                            )}

                          </span>

                        </td>


                        {/* SUBSCRIPTION STATUS */}

                        <td
                          style={{
                            padding: "15px 14px",
                            whiteSpace: "nowrap"
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "5px 9px",
                              borderRadius: 999,
                              background:
                                member.subscriptionStatusPrimary === "active"
                                  ? "#eaf7ed"
                                  : member.subscriptionStatusPrimary === "cancelled"
                                    ? "#fff3f1"
                                    : member.subscriptionStatusPrimary === "halted"
                                      ? "#fff3f1"
                                      : member.subscriptionStatusPrimary === "paused"
                                        ? "#fff9e8"
                                        : "#f1f3f5",
                              color:
                                member.subscriptionStatusPrimary === "active"
                                  ? "#217a36"
                                  : member.subscriptionStatusPrimary === "cancelled"
                                    ? "#b42318"
                                    : member.subscriptionStatusPrimary === "halted"
                                      ? "#b42318"
                                      : member.subscriptionStatusPrimary === "paused"
                                        ? "#8a6410"
                                        : "#69727c",
                              fontSize: 11,
                              fontWeight: 750
                            }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background:
                                  member.subscriptionStatusPrimary === "active"
                                    ? "#2ead4b"
                                    : member.subscriptionStatusPrimary === "cancelled"
                                      ? "#d6453d"
                                      : member.subscriptionStatusPrimary === "halted"
                                        ? "#d6453d"
                                        : member.subscriptionStatusPrimary === "paused"
                                          ? "#d8a62a"
                                          : "#9aa1a8"
                              }}
                            />

                            {member.subscriptionStatusDisplay}
                          </span>
                        </td>


                        {/* PLAN */}

                        <td
                          style={{
                            padding: "15px 14px",
                            fontSize: 12,
                            color: "#4b5563",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {displayValue(
                            member.subscriptionPlanDisplay
                          )}
                        </td>


                        {/* AMOUNT */}

                        <td
                          style={{
                            padding: "15px 14px",
                            fontSize: 12,
                            color: "#374151",
                            fontWeight: 650,
                            whiteSpace: "nowrap"
                          }}
                        >
                          {member.subscriptionAmount !== null &&
                          member.subscriptionAmount !== undefined &&
                          member.subscriptionAmount !== ""
                            ? `${member.subscriptionCurrency === "INR" ? "₹" : ""}${member.subscriptionAmount}`
                            : "—"}
                        </td>


                        {/* SUBSCRIPTION START */}

                        <td
                          style={{
                            padding: "15px 14px",
                            fontSize: 12,
                            color: "#66717d",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {formatMemberDate(
                            member.subscriptionStartDate
                          )}
                        </td>


                        {/* NEXT BILLING */}

                        <td
                          style={{
                            padding: "15px 14px",
                            fontSize: 12,
                            color: "#66717d",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {formatMemberDate(
                            member.nextBillingDate
                          )}
                        </td>


                        {/* RAZORPAY SUBSCRIPTION ID */}

                        <td
                          style={{
                            padding: "15px 14px",
                            fontFamily:
                              "ui-monospace, SFMono-Regular, Menlo, monospace",
                            fontSize: 11,
                            color: "#59636e",
                            maxWidth: 220,
                            wordBreak: "break-all"
                          }}
                        >
                          {displayValue(
                            member.razorpaySubscriptionId
                          )}
                        </td>


                        {/* JOINED */}

                        <td
                          style={{
                            padding:
                              "15px 14px",

                            whiteSpace:
                              "nowrap",

                            fontSize:
                              12,

                            color:
                              "#66717d"
                          }}
                        >
                          {formatMemberDate(
                            member.joinedAt
                          )}
                        </td>


                        {/* ACTIONS */}

                        <td
                          style={{
                            padding:
                              "15px 14px",
                            whiteSpace:
                              "nowrap"
                          }}
                        >

                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: 8
                            }}
                          >

                            {String(member.status || "")
                              .trim()
                              .toLowerCase() === "deactivated" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleActivate(member)
                                }
                                disabled={
                                  actionLoading ===
                                    `activate:${member.uid}` ||
                                  actionLoading ===
                                    `delete:${member.uid}`
                                }
                                style={{
                                  height: 34,
                                  padding: "0 11px",
                                  border: "1px solid #c9e2ce",
                                  borderRadius: 8,
                                  background: "#edf8ef",
                                  color: "#217a36",
                                  fontSize: 12,
                                  fontWeight: 750,
                                  cursor:
                                    actionLoading ===
                                      `activate:${member.uid}` ||
                                    actionLoading ===
                                      `delete:${member.uid}`
                                      ? "not-allowed"
                                      : "pointer",
                                  opacity:
                                    actionLoading ===
                                      `activate:${member.uid}` ||
                                    actionLoading ===
                                      `delete:${member.uid}`
                                      ? 0.55
                                      : 1
                                }}
                              >
                                {actionLoading ===
                                `activate:${member.uid}`
                                  ? "Activating..."
                                  : "Activate"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeactivate(member)
                                }
                                disabled={
                                  actionLoading ===
                                    `deactivate:${member.uid}` ||
                                  actionLoading ===
                                    `delete:${member.uid}` ||
                                  String(member.status || "")
                                    .trim()
                                    .toLowerCase() === "inactive"
                                }
                                style={{
                                  height: 34,
                                  padding: "0 11px",
                                  border: "1px solid #ead6a3",
                                  borderRadius: 8,
                                  background: "#fff9e8",
                                  color: "#8a6410",
                                  fontSize: 12,
                                  fontWeight: 750,
                                  cursor:
                                    actionLoading ===
                                      `deactivate:${member.uid}` ||
                                    actionLoading ===
                                      `delete:${member.uid}` ||
                                    String(member.status || "")
                                      .trim()
                                      .toLowerCase() === "inactive"
                                      ? "not-allowed"
                                      : "pointer",
                                  opacity:
                                    actionLoading ===
                                      `deactivate:${member.uid}` ||
                                    actionLoading ===
                                      `delete:${member.uid}` ||
                                    String(member.status || "")
                                      .trim()
                                      .toLowerCase() === "inactive"
                                      ? 0.55
                                      : 1
                                }}
                              >
                                {actionLoading ===
                                `deactivate:${member.uid}`
                                  ? "Deactivating..."
                                  : "Deactivate"}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  member
                                )
                              }
                              disabled={
                                actionLoading ===
                                  `deactivate:${member.uid}` ||
                                actionLoading ===
                                  `delete:${member.uid}`
                              }
                              style={{
                                height: 34,
                                padding:
                                  "0 11px",
                                border:
                                  "1px solid #f0c3bd",
                                borderRadius: 8,
                                background:
                                  "#fff3f1",
                                color:
                                  "#b42318",
                                fontSize: 12,
                                fontWeight: 750,
                                cursor:
                                  actionLoading ===
                                    `deactivate:${member.uid}` ||
                                  actionLoading ===
                                    `delete:${member.uid}`
                                    ? "not-allowed"
                                    : "pointer",
                                opacity:
                                  actionLoading ===
                                    `deactivate:${member.uid}` ||
                                  actionLoading ===
                                    `delete:${member.uid}`
                                    ? 0.55
                                    : 1
                              }}
                            >
                              {actionLoading ===
                              `delete:${member.uid}`
                                ? "Processing..."
                                : "Disable & Clear Data"}
                            </button>

                          </div>

                        </td>


                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>


        {/* =================================================
            FOOTER
        ================================================= */}

        {!loading &&
          filteredMembers.length > 0 && (

          <div
            style={{
              display:
                "flex",

              justifyContent:
                "space-between",

              alignItems:
                "center",

              gap:
                12,

              marginTop:
                12,

              flexWrap:
                "wrap",

              fontSize:
                12,

              color:
                "var(--muted, #6b7280)"
            }}
          >

            <span>
              Showing{" "}
              <strong
                style={{
                  color:
                    "#374151"
                }}
              >
                {filteredMembers.length}
              </strong>{" "}
              of{" "}
              <strong
                style={{
                  color:
                    "#374151"
                }}
              >
                {members.length}
              </strong>{" "}
              members
            </span>


            <span>
              Export uses the currently
              filtered results.
            </span>

          </div>

        )}

      </div>

    </Shell>

  );

}


/* =========================================================================
   EXPORT
   ========================================================================= */

window.UsersScreen =
  UsersScreen;
