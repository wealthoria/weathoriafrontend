import React from "react";

/* global window */

const {
  useState,
  useMemo,
  useEffect,
  useCallback
} = React;


/* =========================================================================
   HELPERS
   ========================================================================= */

const getAdmin = (name) => window[name];

const fmtINR0 = (n) =>
  "₹" + Math.round(n).toLocaleString("en-IN");


/* =========================================================================
   METRIC CARD
   ========================================================================= */

function MetricCard({
  icon,
  label,
  value,
  delta,
  spark,
  sparkKey,
  sparkColor
}) {

  const MIcon = getAdmin("MIcon");
  const WSparkline = getAdmin("WSparkline");

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


      <div className="m-foot">

        {delta != null ? (

          <span
            className={`delta ${
              delta >= 0 ? "up" : "down"
            }`}
          >

            {MIcon ? (
              <MIcon
                name="arrow"
                size={12}
                style={{
                  transform:
                    delta >= 0
                      ? "rotate(-45deg)"
                      : "rotate(45deg)"
                }}
              />
            ) : null}

            {Math.abs(delta)}%

          </span>

        ) : (
          <span />
        )}


        {spark && WSparkline ? (
          <WSparkline
            data={spark}
            dataKey={sparkKey}
            color={sparkColor}
            width={108}
            height={32}
          />
        ) : null}

      </div>

    </div>
  );
}


/* =========================================================================
   CONTROL PANEL
   ========================================================================= */

function ControlPanel() {

  /* Get everything at RENDER TIME, not module-load time */
  const useAdminAuth =
    getAdmin("useAdminAuth");

  const useRole =
    getAdmin("useRole");

  const useAdminData =
    getAdmin("useAdminData");

  const useAdminRouter =
    getAdmin("useAdminRouter");

  const useMToast =
    getAdmin("useMToast");

  const Shell =
    getAdmin("Shell");

  const MIcon =
    getAdmin("MIcon");

  const WLineChart =
    getAdmin("WLineChart");

  const WHBarChart =
    getAdmin("WHBarChart");

  const WAreaChart =
    getAdmin("WAreaChart");

  const WDonutChart =
    getAdmin("WDonutChart");

  const WFunnelChart =
    getAdmin("WFunnelChart");


  /* Analytics is also obtained at render time */
  const A =
    getAdmin("ANALYTICS");


  /* -----------------------------------------------------------------------
     REQUIRED GLOBAL CHECK
     ----------------------------------------------------------------------- */

  if (!A) {
    return (
      <div
        style={{
          padding: "40px",
          fontFamily: "Arial, sans-serif"
        }}
      >
        <h2>
          Admin Dashboard
        </h2>

        <p>
          Analytics module is not loaded.
        </p>

        <p>
          Please refresh the page.
        </p>
      </div>
    );
  }


  /* -----------------------------------------------------------------------
     AUTH
     ----------------------------------------------------------------------- */

  const auth =
    typeof useAdminAuth === "function"
      ? useAdminAuth() || {}
      : {};

  const user =
    auth.user || null;


  const roleInfo =
    typeof useRole === "function"
      ? useRole() || {}
      : {};

  const role =
    roleInfo.role ||
    "admin";


  /* -----------------------------------------------------------------------
     DATA
     ----------------------------------------------------------------------- */

  const data =
    typeof useAdminData === "function"
      ? useAdminData() || {
          students: [],
          courses: []
        }
      : {
          students: [],
          courses: []
        };


  /* -----------------------------------------------------------------------
     ROUTER
     ----------------------------------------------------------------------- */

  const router =
    typeof useAdminRouter === "function"
      ? useAdminRouter() || {}
      : {};

  const navigate =
    router.navigate ||
    (() => {});


  /* -----------------------------------------------------------------------
     TOAST
     ----------------------------------------------------------------------- */

  const toast =
    typeof useMToast === "function"
      ? useMToast() || {}
      : {};

  const push =
    toast.push ||
    (() => {});


  /* -----------------------------------------------------------------------
     STATE
     ----------------------------------------------------------------------- */

  const [rangeId, setRangeId] =
    useState("30d");

  const [custom, setCustom] =
    useState(false);

  const [from, setFrom] =
    useState("");

  const [to, setTo] =
    useState("");

  const [grain, setGrain] =
    useState("daily");


  /* -----------------------------------------------------------------------
     ACCESSIBILITY
     ----------------------------------------------------------------------- */

  useEffect(() => {

    const h =
      document.querySelector(
        ".topbar h1"
      );

    if (h) {

      h.setAttribute(
        "tabindex",
        "-1"
      );

      try {
        h.focus({
          preventScroll: true
        });
      } catch (error) {}

    }

  }, []);


  /* -----------------------------------------------------------------------
     DAYS
     ----------------------------------------------------------------------- */

  const days = useMemo(() => {

    if (
      custom &&
      from &&
      to
    ) {

      const d =
        Math.round(
          (
            new Date(to) -
            new Date(from)
          ) / 86400000
        ) + 1;

      return Math.max(
        2,
        Math.min(365, d)
      );
    }


    return (
      A.RANGES.find(
        (r) =>
          r.id === rangeId
      ) ||
      A.RANGES[1]
    ).days;

  }, [
    custom,
    from,
    to,
    rangeId,
    A
  ]);


  /* -----------------------------------------------------------------------
     ANALYTICS
     ----------------------------------------------------------------------- */

  const series =
    useMemo(
      () =>
        A.buildSeries(days),
      [days, A]
    );


  const bucketed =
    useMemo(
      () =>
        A.bucketize(
          series,
          grain
        ),
      [series, grain, A]
    );


  const enrollByCourse =
    useMemo(
      () =>
        A.enrollmentsByCourse(
          days
        ),
      [days, A]
    );


  const funnel =
    useMemo(
      () =>
        A.completionFunnel(
          days
        ),
      [days, A]
    );


  const traffic =
    useMemo(
      () =>
        A.trafficSources(
          days
        ),
      [days, A]
    );


  const metrics =
    useMemo(
      () =>
        A.headlineMetrics(
          series
        ),
      [series, A]
    );


  const activeCourses =
    data.courses.filter(
      (c) =>
        c.status === "published"
    ).length;


  const completionRate =
    funnel.length &&
    funnel[0].value
      ? Math.round(
          (
            funnel[3].value /
            funnel[0].value
          ) * 100
        )
      : 0;


  /* -----------------------------------------------------------------------
     GRAIN VALIDATION
     ----------------------------------------------------------------------- */

  useEffect(() => {

    if (
      days < 14 &&
      grain !== "daily"
    ) {
      setGrain("daily");
    }


    if (
      days < 60 &&
      grain === "monthly"
    ) {
      setGrain("weekly");
    }

  }, [
    days,
    grain
  ]);


  const setRange = (id) => {

    setCustom(false);
    setRangeId(id);

  };


  /* -----------------------------------------------------------------------
     SHELL CHECK
     ----------------------------------------------------------------------- */

  if (!Shell) {

    return (
      <div
        style={{
          padding: "40px",
          fontFamily: "Arial, sans-serif"
        }}
      >

        <h2>
          Admin Dashboard
        </h2>

        <p>
          Admin Shell is not loaded.
        </p>

        <button
          onClick={() =>
            window.location.reload()
          }
        >
          Refresh
        </button>

      </div>
    );
  }


  /* -----------------------------------------------------------------------
     DASHBOARD
     ----------------------------------------------------------------------- */

  return (

    <Shell
      title="Control panel"
      subtitle={`Signed in as ${role} · ${
        data.students.length
      } students`}
      actions={

        <button
          className="btn btn-green btn-sm"
          onClick={() =>
            navigate(
              "/admin/courses/new"
            )
          }
        >

          {MIcon ? (
            <MIcon
              name="plus"
              size={16}
            />
          ) : null}

          New course

        </button>

      }
    >

      <div className="reveal-fade">

        {/* DATE RANGE */}

        <div className="cp-bar">

          <div className="range-pick">

            {A.RANGES.map(
              (r) => (

                <button
                  key={r.id}
                  className={
                    !custom &&
                    rangeId === r.id
                      ? "on"
                      : ""
                  }
                  onClick={() =>
                    setRange(r.id)
                  }
                >
                  {r.label}
                </button>

              )
            )}

            <button
              className={
                custom
                  ? "on"
                  : ""
              }
              onClick={() =>
                setCustom(true)
              }
            >
              Custom
            </button>

          </div>


          {/* QUICK ACTIONS */}

          <div className="cp-actions">

            <QuickAction
              icon="send"
              label="Send Push Notification"
              onClick={() =>
                navigate(
                  "/admin/notifications"
                )
              }
            />

            <QuickAction
              icon="eye"
              label="Pending reviews"
              onClick={() =>
                push(
                  "3 reviews pending (stubbed)"
                )
              }
            />

            <QuickAction
              icon="download"
              label="Export CSV"
              onClick={() =>
                exportCsv(
                  data.students,
                  push
                )
              }
            />

            <QuickAction
              icon="plus"
              label="Add course"
              onClick={() =>
                navigate(
                  "/admin/courses/new"
                )
              }
            />

          </div>

        </div>


        {/* CUSTOM RANGE */}

        {custom && (

          <div className="cp-customrow">

            <span
              className="muted"
              style={{
                font: "var(--caption)"
              }}
            >
              From
            </span>

            <input
              className="dateinput"
              type="date"
              value={from}
              onChange={(e) =>
                setFrom(
                  e.target.value
                )
              }
            />

            <span
              className="muted"
              style={{
                font: "var(--caption)"
              }}
            >
              to
            </span>

            <input
              className="dateinput"
              type="date"
              value={to}
              onChange={(e) =>
                setTo(
                  e.target.value
                )
              }
            />

            <span
              className="muted"
              style={{
                font: "var(--caption)"
              }}
            >
              {from && to
                ? `${days} days`
                : "pick both dates"}
            </span>

          </div>

        )}


        {/* MAIN LAYOUT */}

        <div
          className="cp-layout"
          style={{
            marginTop: 18
          }}
        >

          {/* MAIN COLUMN */}

          <div
            style={{
              minWidth: 0
            }}
          >

            {/* METRICS */}

            <div className="metric-grid">

              <MetricCard
                icon="users"
                label="Students enrolled"
                value={(
                  2400 +
                  metrics.totalEnroll
                ).toLocaleString(
                  "en-IN"
                )}
                delta={
                  metrics.enrollDelta
                }
                spark={series}
                sparkKey="enrollments"
                sparkColor="#e8473f"
              />


              <MetricCard
                icon="rupee"
                label="Total revenue"
                value={fmtINR0(
                  metrics.totalRevenue
                )}
                delta={
                  metrics.revDelta
                }
                spark={series}
                sparkKey="gross"
                sparkColor="#f4823c"
              />


              <MetricCard
                icon="courses"
                label="Active courses"
                value={
                  activeCourses + 18
                }
              />


              <MetricCard
                icon="cert"
                label="Avg. completion"
                value={
                  completionRate + "%"
                }
                delta={4}
              />


              <MetricCard
                icon="upload"
                label="New signups (7d)"
                value={metrics.week}
                delta={11}
                spark={
                  series.slice(-7)
                }
                sparkKey="signups"
                sparkColor="#2ead4b"
              />

            </div>


            {/* REVENUE */}

            <div className="chart-grid">

              <div className="chart-card span2">

                <div className="chart-head">

                  <div className="ch-title">

                    <h3>
                      Revenue over time
                    </h3>

                    <span className="ch-sub">
                      Gross vs net, last{" "}
                      {days} days
                    </span>

                  </div>


                  <div className="ch-right">

                    <div className="legend">

                      <span className="li">
                        <span
                          className="sw"
                          style={{
                            background:
                              "#e8473f"
                          }}
                        />
                        Gross
                      </span>

                      <span className="li">
                        <span
                          className="sw"
                          style={{
                            background:
                              "#f3b14e"
                          }}
                        />
                        Net
                      </span>

                    </div>


                    <div className="seg">

                      <button
                        className={
                          grain ===
                          "daily"
                            ? "on"
                            : ""
                        }
                        onClick={() =>
                          setGrain(
                            "daily"
                          )
                        }
                      >
                        Daily
                      </button>

                      <button
                        className={
                          grain ===
                          "weekly"
                            ? "on"
                            : ""
                        }
                        onClick={() =>
                          setGrain(
                            "weekly"
                          )
                        }
                        disabled={
                          days < 14
                        }
                      >
                        Weekly
                      </button>

                      <button
                        className={
                          grain ===
                          "monthly"
                            ? "on"
                            : ""
                        }
                        onClick={() =>
                          setGrain(
                            "monthly"
                          )
                        }
                        disabled={
                          days < 60
                        }
                      >
                        Monthly
                      </button>

                    </div>

                  </div>

                </div>


                {WLineChart ? (

                  <WLineChart
                    data={bucketed}
                    keys={[
                      {
                        key: "gross",
                        color:
                          "#e8473f"
                      },
                      {
                        key: "net",
                        color:
                          "#f3b14e"
                      }
                    ]}
                    height={250}
                    aria={`Revenue over time, gross versus net, last ${days} days.`}
                  />

                ) : null}

              </div>

            </div>


            {/* ENROLLMENTS + TRAFFIC */}

            <div className="chart-grid two">

              <div className="chart-card">

                <div className="chart-head">

                  <div className="ch-title">

                    <h3>
                      Enrollments by course
                    </h3>

                    <span className="ch-sub">
                      Top 10
                    </span>

                  </div>

                </div>


                {WHBarChart ? (

                  <WHBarChart
                    data={enrollByCourse}
                    aria={`Top ${enrollByCourse.length} courses by enrollment.`}
                  />

                ) : null}

              </div>


              <div className="chart-card">

                <div className="chart-head">

                  <div className="ch-title">

                    <h3>
                      Traffic sources
                    </h3>

                    <span className="ch-sub">
                      Where students come from
                    </span>

                  </div>

                </div>


                <div
                  style={{
                    paddingTop: 8
                  }}
                >

                  {WDonutChart ? (

                    <WDonutChart
                      data={traffic}
                      size={188}
                      aria="Traffic sources"
                    />

                  ) : null}

                </div>

              </div>

            </div>


            {/* FUNNEL + AREA */}

            <div className="chart-grid two">

              <div className="chart-card">

                <div className="chart-head">

                  <div className="ch-title">

                    <h3>
                      Completion funnel
                    </h3>

                    <span className="ch-sub">
                      Enrolled to finished
                    </span>

                  </div>

                </div>


                <div
                  style={{
                    paddingTop: 6
                  }}
                >

                  {WFunnelChart ? (

                    <WFunnelChart
                      data={funnel}
                      aria="Completion funnel"
                    />

                  ) : null}

                </div>

              </div>


              <div className="chart-card">

                <div className="chart-head">

                  <div className="ch-title">

                    <h3>
                      New students per day
                    </h3>

                    <span className="ch-sub">
                      Last {days} days
                    </span>

                  </div>

                </div>


                {WAreaChart ? (

                  <WAreaChart
                    data={series}
                    dataKey="signups"
                    height={210}
                    aria={`New students per day over the last ${days} days.`}
                  />

                ) : null}

              </div>

            </div>

          </div>


          {/* ACTIVITY */}

          <ActivityFeed />

        </div>

      </div>

    </Shell>
  );
}


/* =========================================================================
   QUICK ACTION
   ========================================================================= */

function QuickAction({
  icon,
  label,
  onClick
}) {

  const MIcon =
    getAdmin("MIcon");


  return (

    <button
      className="qa-btn"
      onClick={onClick}
    >

      <span className="qa-ic">

        {MIcon ? (
          <MIcon
            name={icon}
            size={15}
          />
        ) : null}

      </span>

      {label}

    </button>
  );
}


/* =========================================================================
   CSV EXPORT
   ========================================================================= */

function exportCsv(
  students,
  push
) {

  const rows = [
    [
      "Name",
      "Email",
      "Enrolled",
      "Joined",
      "Status"
    ],
    ...students.map(
      (s) => [
        s.name,
        s.email,
        s.enrolled,
        s.joined,
        s.status
      ]
    )
  ];


  const csv =
    rows
      .map((r) =>
        r
          .map(
            (c) =>
              `"${c}"`
          )
          .join(",")
      )
      .join("\n");


  try {

    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv"
        }
      );


    const url =
      URL.createObjectURL(
        blob
      );


    const a =
      document.createElement(
        "a"
      );

    a.href = url;

    a.download =
      "wealthoria-students.csv";

    a.click();


    URL.revokeObjectURL(
      url
    );


    push(
      "Exported student CSV"
    );

  } catch (e) {

    push(
      "Export ready (stubbed)"
    );

  }
}


/* =========================================================================
   ACTIVITY FEED
   ========================================================================= */

function ActivityFeed() {

  const A =
    getAdmin("ANALYTICS");

  const MIcon =
    getAdmin("MIcon");


  const full =
    useMemo(
      () =>
        A
          ? A.buildFeed(40)
          : [],
      [A]
    );


  const [count, setCount] =
    useState(8);


  const faClass = {
    enroll:
      "fa-enroll",
    purchase:
      "fa-purchase",
    publish:
      "fa-publish",
    comment:
      "fa-comment",
    complete:
      "fa-complete"
  };


  return (

    <aside className="feed-card">

      <div className="feed-head">

        <h3>
          Recent activity
        </h3>

        <span className="live">

          <span className="pulse" />

          Live

        </span>

      </div>


      <div className="feed-list">

        {full
          .slice(0, count)
          .map((it) => (

            <div
              className="feed-item"
              key={it.id}
            >

              <div>

                <span
                  className={`feed-ava ${
                    faClass[
                      it.type
                    ] || ""
                  }`}
                >
                  {it.name.charAt(0)}
                </span>


                <span className="feed-ic">

                  {MIcon ? (
                    <MIcon
                      name={it.icon}
                      size={11}
                    />
                  ) : null}

                </span>

              </div>


              <div className="feed-body">

                <div className="feed-text">

                  <b>
                    {it.name}
                  </b>

                  {it.text.replace(
                    it.name,
                    ""
                  )}

                </div>


                <div className="feed-time">

                  {A
                    ? A.relTime(
                        it.minsAgo
                      )
                    : ""}

                </div>

              </div>

            </div>

          ))}

      </div>


      {count < full.length && (

        <div className="feed-foot">

          <button
            className="btn btn-ghost btn-sm btn-block"
            onClick={() =>
              setCount(
                (c) =>
                  Math.min(
                    full.length,
                    c + 8
                  )
              )
            }
          >
            Load more
          </button>

        </div>

      )}

    </aside>
  );
}


/* =========================================================================
   PUBLIC EXPORT
   ========================================================================= */

function AdminDashboard() {

  return (
    <ControlPanel />
  );
}


window.AdminDashboard =
  AdminDashboard;