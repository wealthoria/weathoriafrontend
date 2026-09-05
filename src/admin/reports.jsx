import React from "react";

/* global React, window */

const {
  useState,
  useMemo,
  useEffect,
  useCallback
} = React;

/* =========================================================
   WEALTHORIA ADMIN REPORTS
   ---------------------------------------------------------
   Firestore collections used:
   - members
   - coursePurchases
   - subscriptions
========================================================= */

const getAdmin = (name) => window[name];

const fmtINR0 = (value) =>
  "₹" + Math.round(Number(value || 0)).toLocaleString("en-IN");

const toMillis = (value) => {
  if (!value) return 0;

  try {
    if (typeof value.toMillis === "function") {
      return value.toMillis();
    }

    if (typeof value.toDate === "function") {
      return value.toDate().getTime();
    }

    if (value instanceof Date) {
      return value.getTime();
    }

    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  } catch (error) {
    return 0;
  }
};

const formatDate = (value) => {
  const time = toMillis(value);

  if (!time) return "—";

  return new Date(time).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfWeek = (date) => {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
};

const startOfMonth = (date) => {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
};

const endOfPeriod = (start, period) => {
  const d = new Date(start);

  if (period === "week") {
    d.setDate(d.getDate() + 7);
  } else {
    d.setMonth(d.getMonth() + 1);
  }

  return d;
};

const getPurchaseAmount = (item) =>
  Number(
    item?.amount ??
    item?.totalAmount ??
    item?.price ??
    0
  ) || 0;

const getPurchaseDate = (item) =>
  item?.paidAt ||
  item?.createdAt ||
  item?.updatedAt ||
  null;

const getMemberDate = (item) =>
  item?.joinedAt ||
  item?.registeredAt ||
  item?.createdAt ||
  item?.createdOn ||
  null;

const getSubscriptionDate = (item) =>
  item?.subscriptionStartDate ||
  item?.createdAt ||
  item?.updatedAt ||
  null;

const isPaidPurchase = (item) =>
  String(item?.status || "paid").toLowerCase() === "paid";

const isActiveSubscription = (item) =>
  String(item?.status || "").toLowerCase() === "active";

/* =========================================================
   DATA LOADER
========================================================= */

function getCollectionRows(name) {
  if (
    !window.db ||
    typeof window.db.collection !== "function"
  ) {
    return Promise.resolve([]);
  }

  return window.db
    .collection(name)
    .get()
    .then((snapshot) =>
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
    )
    .catch((error) => {
      console.warn(
        `Reports could not load ${name}:`,
        error
      );

      return [];
    });
}

function useReportsData() {
  const [state, setState] = useState({
    loading: true,
    error: "",
    members: [],
    purchases: [],
    subscriptions: []
  });

  const load = useCallback(async () => {
    if (
      !window.db ||
      typeof window.db.collection !== "function"
    ) {
      setState({
        loading: false,
        error: "Firestore is not available.",
        members: [],
        purchases: [],
        subscriptions: []
      });

      return;
    }

    setState((current) => ({
      ...current,
      loading: true,
      error: ""
    }));

    const [
      members,
      purchases,
      subscriptions
    ] = await Promise.all([
      getCollectionRows("members"),
      getCollectionRows("coursePurchases"),
      getCollectionRows("subscriptions")
    ]);

    setState({
      loading: false,
      error: "",
      members,
      purchases,
      subscriptions
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    ...state,
    reload: load
  };
}

/* =========================================================
   SMALL UI HELPERS
========================================================= */

function ReportMetric({
  icon,
  label,
  value,
  sub
}) {
  const MIcon = getAdmin("MIcon");

  return (
    <div className="metric">
      <div className="m-top">
        <span className="m-ic">
          {MIcon ? (
            <MIcon
              name={icon}
              size={17}
            />
          ) : null}
        </span>

        <span className="m-label">
          {label}
        </span>
      </div>

      <div className="m-value">
        {value}
      </div>

      {sub ? (
        <div
          className="m-foot"
          style={{
            minHeight: 20,
            color: "var(--mute)",
            fontSize: 11
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function EmptyState({
  children = "No data available."
}) {
  return (
    <div
      className="muted"
      style={{
        padding: 28,
        textAlign: "center"
      }}
    >
      {children}
    </div>
  );
}

/* =========================================================
   PERIOD TABLE
========================================================= */

function PeriodTable({
  rows,
  title,
  columns
}) {
  return (
    <div className="chart-card">
      <div className="chart-head">
        <div className="ch-title">
          <h3>{title}</h3>
          <span className="ch-sub">
            Purchases, subscriptions, members and revenue
          </span>
        </div>
      </div>

      <div
        style={{
          width: "100%",
          overflowX: "auto"
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 620
          }}
        >
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{
                    textAlign:
                      column.align || "left",
                    padding: "11px 12px",
                    borderBottom:
                      "1px solid var(--hair)",
                    color:
                      "var(--mute)",
                    fontSize: 11,
                    fontWeight: 700,
                    whiteSpace: "nowrap"
                  }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    style={{
                      padding: "12px",
                      borderBottom:
                        "1px solid var(--hair)",
                      textAlign:
                        column.align || "left",
                      fontSize: 12,
                      fontWeight:
                        column.bold
                          ? 700
                          : 500,
                      whiteSpace:
                        column.nowrap
                          ? "nowrap"
                          : "normal"
                    }}
                  >
                    {column.render
                      ? column.render(row)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {!rows.length ? (
          <EmptyState />
        ) : null}
      </div>
    </div>
  );
}

/* =========================================================
   DETAILED FINANCIAL TABLE
========================================================= */

function DetailTable({
  title,
  subtitle,
  rows,
  type
}) {
  return (
    <div className="chart-card">
      <div className="chart-head">
        <div className="ch-title">
          <h3>{title}</h3>

          <span className="ch-sub">
            {subtitle}
          </span>
        </div>
      </div>

      <div
        style={{
          width: "100%",
          overflowX: "auto"
        }}
      >
        {rows.length ? (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth:
                type === "purchase"
                  ? 760
                  : 700
            }}
          >
            <thead>
              <tr>
                {(
                  type === "purchase"
                    ? [
                        ["Customer", "left"],
                        ["Email", "left"],
                        ["Course", "left"],
                        ["Status", "left"],
                        ["Amount", "right"],
                        ["Date", "right"]
                      ]
                    : [
                        ["Member", "left"],
                        ["Email", "left"],
                        ["Plan", "left"],
                        ["Status", "left"],
                        ["Amount", "right"],
                        ["Date", "right"]
                      ]
                ).map(([label, align]) => (
                  <th
                    key={label}
                    style={{
                      textAlign: align,
                      padding: "11px 12px",
                      borderBottom:
                        "1px solid var(--hair)",
                      color:
                        "var(--mute)",
                      fontSize: 11,
                      fontWeight: 700,
                      whiteSpace: "nowrap"
                    }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.slice(0, 20).map((item) => {
                const name =
                  item?.userName ||
                  item?.name ||
                  item?.userEmail ||
                  item?.email ||
                  "Member";

                const email =
                  item?.userEmail ||
                  item?.email ||
                  "—";

                const amount =
                  type === "purchase"
                    ? getPurchaseAmount(item)
                    : Number(
                        item?.amount || 0
                      );

                const date =
                  type === "purchase"
                    ? getPurchaseDate(item)
                    : getSubscriptionDate(item);

                return (
                  <tr key={item.id}>
                    <td
                      style={{
                        padding: "12px",
                        borderBottom:
                          "1px solid var(--hair)",
                        fontSize: 12,
                        fontWeight: 700
                      }}
                    >
                      {name}
                    </td>

                    <td
                      style={{
                        padding: "12px",
                        borderBottom:
                          "1px solid var(--hair)",
                        fontSize: 12
                      }}
                    >
                      {email}
                    </td>

                    <td
                      style={{
                        padding: "12px",
                        borderBottom:
                          "1px solid var(--hair)",
                        fontSize: 12
                      }}
                    >
                      {type === "purchase"
                        ? (
                            item?.courseTitle ||
                            item?.courseName ||
                            item?.courseId ||
                            "Course"
                          )
                        : (
                            item?.plan ||
                            "Subscription"
                          )}
                    </td>

                    <td
                      style={{
                        padding: "12px",
                        borderBottom:
                          "1px solid var(--hair)",
                        fontSize: 12
                      }}
                    >
                      {item?.status || "—"}
                    </td>

                    <td
                      style={{
                        padding: "12px",
                        borderBottom:
                          "1px solid var(--hair)",
                        textAlign: "right",
                        fontSize: 12,
                        fontWeight: 700,
                        whiteSpace: "nowrap"
                      }}
                    >
                      {fmtINR0(amount)}
                    </td>

                    <td
                      style={{
                        padding: "12px",
                        borderBottom:
                          "1px solid var(--hair)",
                        textAlign: "right",
                        fontSize: 12,
                        whiteSpace: "nowrap"
                      }}
                    >
                      {formatDate(date)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <EmptyState>
            No records available.
          </EmptyState>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   REPORT PAGE
========================================================= */

function ReportsPage() {
  const useAdminRouter =
    getAdmin("useAdminRouter");

  const MIcon = getAdmin("MIcon");

  const router =
    typeof useAdminRouter === "function"
      ? useAdminRouter() || {}
      : {};

  const navigate =
    router.navigate || (() => {});

  const backend =
    useReportsData();

  const {
    loading,
    error,
    members,
    purchases,
    subscriptions
  } = backend;

  const [
    section,
    setSection
  ] = useState("weekly");

  /* ---------------------------------------------------------
     CLEAN DATA
  --------------------------------------------------------- */

  const paidPurchases = useMemo(
    () =>
      purchases.filter(
        isPaidPurchase
      ),
    [purchases]
  );

  const activeSubscriptions =
    useMemo(
      () =>
        subscriptions.filter(
          isActiveSubscription
        ),
      [subscriptions]
    );

  const purchaseRevenue =
    useMemo(
      () =>
        paidPurchases.reduce(
          (sum, item) =>
            sum +
            getPurchaseAmount(item),
          0
        ),
      [paidPurchases]
    );

  const subscriptionRevenue =
    useMemo(
      () =>
        subscriptions.reduce(
          (sum, item) =>
            sum +
            (Number(
              item?.amount || 0
            ) || 0),
          0
        ),
      [subscriptions]
    );

  const totalRevenue =
    purchaseRevenue +
    subscriptionRevenue;

  const subscriptionMemberIds =
    useMemo(
      () =>
        new Set(
          activeSubscriptions
            .map(
              (item) =>
                item?.memberId
            )
            .filter(Boolean)
        ),
      [activeSubscriptions]
    );

  const activeMemberCount =
    subscriptionMemberIds.size;

  const memberCount =
    members.length;

  /* ---------------------------------------------------------
     CURRENT PERIOD SNAPSHOTS
  --------------------------------------------------------- */

  const today =
    useMemo(() => new Date(), []);

  const currentWeekStart =
    useMemo(
      () => startOfWeek(today),
      [today]
    );

  const currentMonthStart =
    useMemo(
      () => startOfMonth(today),
      [today]
    );

  const weeklyPurchases =
    useMemo(
      () =>
        paidPurchases.filter(
          (item) =>
            toMillis(
              getPurchaseDate(item)
            ) >=
            currentWeekStart.getTime()
        ),
      [
        paidPurchases,
        currentWeekStart
      ]
    );

  const weeklySubscriptions =
    useMemo(
      () =>
        subscriptions.filter(
          (item) =>
            toMillis(
              getSubscriptionDate(item)
            ) >=
            currentWeekStart.getTime()
        ),
      [
        subscriptions,
        currentWeekStart
      ]
    );

  const monthlyPurchases =
    useMemo(
      () =>
        paidPurchases.filter(
          (item) =>
            toMillis(
              getPurchaseDate(item)
            ) >=
            currentMonthStart.getTime()
        ),
      [
        paidPurchases,
        currentMonthStart
      ]
    );

  const monthlySubscriptions =
    useMemo(
      () =>
        subscriptions.filter(
          (item) =>
            toMillis(
              getSubscriptionDate(item)
            ) >=
            currentMonthStart.getTime()
        ),
      [
        subscriptions,
        currentMonthStart
      ]
    );

  const weeklyPurchaseRevenue =
    weeklyPurchases.reduce(
      (sum, item) =>
        sum + getPurchaseAmount(item),
      0
    );

  const weeklySubscriptionRevenue =
    weeklySubscriptions.reduce(
      (sum, item) =>
        sum +
        (Number(
          item?.amount || 0
        ) || 0),
      0
    );

  const monthlyPurchaseRevenue =
    monthlyPurchases.reduce(
      (sum, item) =>
        sum + getPurchaseAmount(item),
      0
    );

  const monthlySubscriptionRevenue =
    monthlySubscriptions.reduce(
      (sum, item) =>
        sum +
        (Number(
          item?.amount || 0
        ) || 0),
      0
    );

  /* ---------------------------------------------------------
     WEEKLY ROWS — LAST 12 WEEKS
  --------------------------------------------------------- */

  const weeklyRows =
    useMemo(() => {
      const rows = [];

      for (let i = 11; i >= 0; i -= 1) {
        const start =
          new Date(
            currentWeekStart
          );

        start.setDate(
          start.getDate() -
            i * 7
        );

        const end =
          endOfPeriod(
            start,
            "week"
          );

        const purchasesInPeriod =
          paidPurchases.filter(
            (item) => {
              const time =
                toMillis(
                  getPurchaseDate(
                    item
                  )
                );

              return (
                time >= start.getTime() &&
                time < end.getTime()
              );
            }
          );

        const subscriptionsInPeriod =
          subscriptions.filter(
            (item) => {
              const time =
                toMillis(
                  getSubscriptionDate(
                    item
                  )
                );

              return (
                time >= start.getTime() &&
                time < end.getTime()
              );
            }
          );

        const membersInPeriod =
          members.filter((item) => {
            const time =
              toMillis(
                getMemberDate(item)
              );

            return (
              time >= start.getTime() &&
              time < end.getTime()
            );
          });

        const purchaseRevenue =
          purchasesInPeriod.reduce(
            (sum, item) =>
              sum +
              getPurchaseAmount(
                item
              ),
            0
          );

        const subscriptionRevenue =
          subscriptionsInPeriod.reduce(
            (sum, item) =>
              sum +
              (Number(
                item?.amount || 0
              ) || 0),
            0
          );

        rows.push({
          key:
            start.toISOString(),
          period:
            `${start.toLocaleDateString(
              "en-IN",
              {
                day: "2-digit",
                month: "short"
              }
            )} – ${new Date(
              end.getTime() -
                86400000
            ).toLocaleDateString(
              "en-IN",
              {
                day: "2-digit",
                month: "short"
              }
            )}`,
          purchases:
            purchasesInPeriod.length,
          subscriptions:
            subscriptionsInPeriod.length,
          members:
            membersInPeriod.length,
          revenue:
            purchaseRevenue +
            subscriptionRevenue,
          purchaseRevenue,
          subscriptionRevenue
        });
      }

      return rows;
    }, [
      currentWeekStart,
      paidPurchases,
      subscriptions,
      members
    ]);

  /* ---------------------------------------------------------
     MONTHLY ROWS — LAST 12 MONTHS
  --------------------------------------------------------- */

  const monthlyRows =
    useMemo(() => {
      const rows = [];

      for (let i = 11; i >= 0; i -= 1) {
        const start =
          new Date(
            currentMonthStart
          );

        start.setMonth(
          start.getMonth() -
            i
        );

        const end =
          endOfPeriod(
            start,
            "month"
          );

        const purchasesInPeriod =
          paidPurchases.filter(
            (item) => {
              const time =
                toMillis(
                  getPurchaseDate(
                    item
                  )
                );

              return (
                time >= start.getTime() &&
                time < end.getTime()
              );
            }
          );

        const subscriptionsInPeriod =
          subscriptions.filter(
            (item) => {
              const time =
                toMillis(
                  getSubscriptionDate(
                    item
                  )
                );

              return (
                time >= start.getTime() &&
                time < end.getTime()
              );
            }
          );

        const membersInPeriod =
          members.filter((item) => {
            const time =
              toMillis(
                getMemberDate(item)
              );

            return (
              time >= start.getTime() &&
              time < end.getTime()
            );
          });

        const purchaseRevenue =
          purchasesInPeriod.reduce(
            (sum, item) =>
              sum +
              getPurchaseAmount(
                item
              ),
            0
          );

        const subscriptionRevenue =
          subscriptionsInPeriod.reduce(
            (sum, item) =>
              sum +
              (Number(
                item?.amount || 0
              ) || 0),
            0
          );

        rows.push({
          key:
            start.toISOString(),
          period:
            start.toLocaleDateString(
              "en-IN",
              {
                month: "short",
                year: "numeric"
              }
            ),
          purchases:
            purchasesInPeriod.length,
          subscriptions:
            subscriptionsInPeriod.length,
          members:
            membersInPeriod.length,
          revenue:
            purchaseRevenue +
            subscriptionRevenue,
          purchaseRevenue,
          subscriptionRevenue
        });
      }

      return rows;
    }, [
      currentMonthStart,
      paidPurchases,
      subscriptions,
      members
    ]);

  /* ---------------------------------------------------------
     LATEST TABLES
  --------------------------------------------------------- */

  const latestPurchases =
    useMemo(
      () =>
        [...paidPurchases].sort(
          (a, b) =>
            toMillis(
              getPurchaseDate(b)
            ) -
            toMillis(
              getPurchaseDate(a)
            )
        ),
      [paidPurchases]
    );

  const latestSubscriptions =
    useMemo(
      () =>
        [...subscriptions].sort(
          (a, b) =>
            toMillis(
              getSubscriptionDate(b)
            ) -
            toMillis(
              getSubscriptionDate(a)
            )
        ),
      [subscriptions]
    );

  return (
    <div className="reveal-fade">

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          marginBottom: 16
        }}
      >
        <button
          className="btn btn-green btn-sm"
          onClick={() => backend.reload()}
          disabled={loading}
        >
          {MIcon ? (
            <MIcon
              name="refresh"
              size={15}
            />
          ) : null}
          Refresh
        </button>
      </div>
        {error ? (
          <div
            className="notice notice-error"
            style={{
              marginBottom: 16
            }}
          >
            {error}
          </div>
        ) : null}

        {/* =====================================================
            TOP METRICS
        ===================================================== */}

        <div className="metric-grid">
          <ReportMetric
            icon="rupee"
            label="Total revenue"
            value={
              loading
                ? "—"
                : fmtINR0(
                    totalRevenue
                  )
            }
            sub="Course purchases + subscriptions"
          />

          <ReportMetric
            icon="rupee"
            label="Course purchase revenue"
            value={
              loading
                ? "—"
                : fmtINR0(
                    purchaseRevenue
                  )
            }
            sub={`${paidPurchases.length.toLocaleString("en-IN")} paid purchases`}
          />

          <ReportMetric
            icon="rupee"
            label="Subscription revenue"
            value={
              loading
                ? "—"
                : fmtINR0(
                    subscriptionRevenue
                  )
            }
            sub={`${subscriptions.length.toLocaleString("en-IN")} subscriptions`}
          />

          <ReportMetric
            icon="users"
            label="Total members"
            value={
              loading
                ? "—"
                : memberCount.toLocaleString(
                    "en-IN"
                  )
            }
            sub={`${activeMemberCount.toLocaleString("en-IN")} active subscription members`}
          />

          <ReportMetric
            icon="courses"
            label="Weekly revenue"
            value={
              loading
                ? "—"
                : fmtINR0(
                    weeklyPurchaseRevenue +
                    weeklySubscriptionRevenue
                  )
            }
            sub={`${weeklyPurchases.length} purchases · ${weeklySubscriptions.length} subscriptions`}
          />
        </div>

        {/* =====================================================
            RANGE SWITCH
        ===================================================== */}

        <div
          className="cp-bar"
          style={{
            marginTop: 18
          }}
        >
          <div className="range-pick">
            <button
              className={
                section === "weekly"
                  ? "on"
                  : ""
              }
              onClick={() =>
                setSection(
                  "weekly"
                )
              }
            >
              Weekly
            </button>

            <button
              className={
                section === "monthly"
                  ? "on"
                  : ""
              }
              onClick={() =>
                setSection(
                  "monthly"
                )
              }
            >
              Monthly
            </button>
          </div>

          <div
            className="muted"
            style={{
              fontSize: 12
            }}
          >
            All figures are calculated from
            Firestore records.
          </div>
        </div>

        {/* =====================================================
            CURRENT PERIOD BREAKDOWN
        ===================================================== */}

        <div
          className="chart-grid two"
          style={{
            marginTop: 18
          }}
        >
          <div className="chart-card">
            <div className="chart-head">
              <div className="ch-title">
                <h3>
                  This week
                </h3>

                <span className="ch-sub">
                  Current Monday–Sunday period
                </span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2,minmax(0,1fr))",
                gap: 12
              }}
            >
              <div className="qa-card">
                <b>
                  {weeklyPurchases.length}
                </b>
                <span>
                  Paid purchases
                </span>
              </div>

              <div className="qa-card">
                <b>
                  {weeklySubscriptions.length}
                </b>
                <span>
                  Subscriptions
                </span>
              </div>

              <div className="qa-card">
                <b>
                  {weeklyPurchases
                    .length +
                    weeklySubscriptions
                      .length}
                </b>
                <span>
                  Total transactions
                </span>
              </div>

              <div className="qa-card">
                <b>
                  {fmtINR0(
                    weeklyPurchaseRevenue +
                    weeklySubscriptionRevenue
                  )}
                </b>
                <span>
                  Total revenue
                </span>
              </div>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-head">
              <div className="ch-title">
                <h3>
                  This month
                </h3>

                <span className="ch-sub">
                  Current calendar month
                </span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2,minmax(0,1fr))",
                gap: 12
              }}
            >
              <div className="qa-card">
                <b>
                  {monthlyPurchases.length}
                </b>
                <span>
                  Paid purchases
                </span>
              </div>

              <div className="qa-card">
                <b>
                  {monthlySubscriptions.length}
                </b>
                <span>
                  Subscriptions
                </span>
              </div>

              <div className="qa-card">
                <b>
                  {monthlyPurchases
                    .length +
                    monthlySubscriptions
                      .length}
                </b>
                <span>
                  Total transactions
                </span>
              </div>

              <div className="qa-card">
                <b>
                  {fmtINR0(
                    monthlyPurchaseRevenue +
                    monthlySubscriptionRevenue
                  )}
                </b>
                <span>
                  Total revenue
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            WEEKLY / MONTHLY REPORT
        ===================================================== */}

        <div
          style={{
            marginTop: 18
          }}
        >
          {section === "weekly" ? (
            <PeriodTable
              title="Weekly report"
              rows={weeklyRows}
              columns={[
                {
                  key: "period",
                  label: "Week",
                  nowrap: true,
                  bold: true
                },
                {
                  key: "purchases",
                  label: "Purchases",
                  align: "right"
                },
                {
                  key: "subscriptions",
                  label: "Subscriptions",
                  align: "right"
                },
                {
                  key: "members",
                  label: "New members",
                  align: "right"
                },
                {
                  key: "purchaseRevenue",
                  label: "Course revenue",
                  align: "right",
                  render: (row) =>
                    fmtINR0(
                      row.purchaseRevenue
                    )
                },
                {
                  key: "subscriptionRevenue",
                  label: "Subscription revenue",
                  align: "right",
                  render: (row) =>
                    fmtINR0(
                      row.subscriptionRevenue
                    )
                },
                {
                  key: "revenue",
                  label: "Total revenue",
                  align: "right",
                  bold: true,
                  render: (row) =>
                    fmtINR0(
                      row.revenue
                    )
                }
              ]}
            />
          ) : (
            <PeriodTable
              title="Monthly report"
              rows={monthlyRows}
              columns={[
                {
                  key: "period",
                  label: "Month",
                  nowrap: true,
                  bold: true
                },
                {
                  key: "purchases",
                  label: "Purchases",
                  align: "right"
                },
                {
                  key: "subscriptions",
                  label: "Subscriptions",
                  align: "right"
                },
                {
                  key: "members",
                  label: "New members",
                  align: "right"
                },
                {
                  key: "purchaseRevenue",
                  label: "Course revenue",
                  align: "right",
                  render: (row) =>
                    fmtINR0(
                      row.purchaseRevenue
                    )
                },
                {
                  key: "subscriptionRevenue",
                  label: "Subscription revenue",
                  align: "right",
                  render: (row) =>
                    fmtINR0(
                      row.subscriptionRevenue
                    )
                },
                {
                  key: "revenue",
                  label: "Total revenue",
                  align: "right",
                  bold: true,
                  render: (row) =>
                    fmtINR0(
                      row.revenue
                    )
                }
              ]}
            />
          )}
        </div>

        {/* =====================================================
            MEMBER SUMMARY
        ===================================================== */}

        <div
          className="chart-grid two"
          style={{
            marginTop: 18
          }}
        >
          <div className="chart-card">
            <div className="chart-head">
              <div className="ch-title">
                <h3>
                  Member summary
                </h3>

                <span className="ch-sub">
                  Current member and subscription base
                </span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 10
              }}
            >
              <div className="qa-card">
                <b>
                  {memberCount.toLocaleString(
                    "en-IN"
                  )}
                </b>
                <span>
                  Total members
                </span>
              </div>

              <div className="qa-card">
                <b>
                  {activeSubscriptions.length.toLocaleString(
                    "en-IN"
                  )}
                </b>
                <span>
                  Active subscriptions
                </span>
              </div>

              <div className="qa-card">
                <b>
                  {activeMemberCount.toLocaleString(
                    "en-IN"
                  )}
                </b>
                <span>
                  Unique active subscription members
                </span>
              </div>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-head">
              <div className="ch-title">
                <h3>
                  Revenue split
                </h3>

                <span className="ch-sub">
                  All successful course and subscription revenue
                </span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 12
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  gap: 16,
                  padding:
                    "12px 14px",
                  border:
                    "1px solid var(--hair)",
                  borderRadius: 10
                }}
              >
                <span>
                  Course purchases
                </span>

                <b>
                  {fmtINR0(
                    purchaseRevenue
                  )}
                </b>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  gap: 16,
                  padding:
                    "12px 14px",
                  border:
                    "1px solid var(--hair)",
                  borderRadius: 10
                }}
              >
                <span>
                  Subscriptions
                </span>

                <b>
                  {fmtINR0(
                    subscriptionRevenue
                  )}
                </b>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  gap: 16,
                  padding:
                    "14px",
                  border:
                    "1px solid var(--hair)",
                  borderRadius: 10,
                  fontWeight: 800
                }}
              >
                <span>
                  Total revenue
                </span>

                <b>
                  {fmtINR0(
                    totalRevenue
                  )}
                </b>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            DETAIL TABLES
        ===================================================== */}

        <div
          className="chart-grid two"
          style={{
            marginTop: 18
          }}
        >
          <DetailTable
            title="Latest purchases"
            subtitle={`Latest ${Math.min(
              20,
              latestPurchases.length
            )} paid course purchases`}
            rows={latestPurchases}
            type="purchase"
          />

          <DetailTable
            title="Latest subscriptions"
            subtitle={`Latest ${Math.min(
              20,
              latestSubscriptions.length
            )} subscriptions`}
            rows={latestSubscriptions}
            type="subscription"
          />
        </div>

        {/* =====================================================
            BACK
        ===================================================== */}

        <div
          style={{
            marginTop: 18,
            display: "flex",
            justifyContent:
              "flex-start"
          }}
        >
          <button
            className="btn btn-ghost btn-sm"
            onClick={() =>
              navigate(
                "/admin/dashboard"
              )
            }
          >
            ← Back to dashboard
          </button>
        </div>
      </div>
  );
}

/* =========================================================
   PUBLIC EXPORT
========================================================= */

window.AdminReports =
  ReportsPage;

console.log(
  "Admin Reports loaded successfully"
);
