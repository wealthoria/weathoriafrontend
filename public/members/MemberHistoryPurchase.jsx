
const { useState, useEffect } = React;


/* =========================================================
   PURCHASE HISTORY
========================================================= */

function MemberHistoryPurchase() {

  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
const [fromDate, setFromDate] = useState("");
const [toDate, setToDate] = useState("");


  /* =======================================================
     LOAD PURCHASES FOR CURRENT USER
  ======================================================= */
useEffect(() => {

  if (!window.auth) {
    setError("Firebase Authentication is not available.");
    setLoading(false);
    return;
  }

  if (!window.db) {
    setError("Firestore is not available.");
    setLoading(false);
    return;
  }

  let unsubscribePurchases = null;

  const unsubscribeAuth =
    window.auth.onAuthStateChanged((user) => {

      if (unsubscribePurchases) {
        unsubscribePurchases();
        unsubscribePurchases = null;
      }

      if (!user) {
        setPurchases([]);
        setError(
          "Please login to view your purchase history."
        );
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      unsubscribePurchases =
        window.db
          .collection("coursePurchases")
          .where("userId", "==", user.uid)
          .onSnapshot(

            (snapshot) => {

              const rows =
                snapshot.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data()
                }));

              rows.sort((a, b) => {

                const getTime = (value) => {

                  if (!value) return 0;

                  if (
                    typeof value.toMillis ===
                    "function"
                  ) {
                    return value.toMillis();
                  }

                  if (
                    typeof value.toDate ===
                    "function"
                  ) {
                    return value.toDate().getTime();
                  }

                  const parsed =
                    new Date(value).getTime();

                  return Number.isNaN(parsed)
                    ? 0
                    : parsed;
                };

                return (
                  getTime(b.paidAt) -
                  getTime(a.paidAt)
                );

              });

              setPurchases(rows);
              setLoading(false);
              setError("");

            },

            (err) => {

              console.error(
                "Purchase history error:",
                err
              );

              setError(
                "Unable to load your purchase history."
              );

              setLoading(false);

            }

          );

    });

  return () => {

    unsubscribeAuth();

    if (unsubscribePurchases) {
      unsubscribePurchases();
    }

  };

}, []);
  /* =======================================================
     FORMAT DATE
  ======================================================= */

  const formatDate = (value) => {

    if (!value) {
      return "—";
    }

    let date = null;

    try {

      if (
        typeof value.toDate === "function"
      ) {
        date = value.toDate();
      } else {
        date = new Date(value);
      }

      if (
        !date ||
        Number.isNaN(date.getTime())
      ) {
        return "—";
      }

      return date.toLocaleString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }
      );

    } catch (err) {

      return "—";

    }

  };


  /* =======================================================
     FORMAT AMOUNT
  ======================================================= */

  const formatAmount = (amount) => {

    const value = Number(amount || 0);

    return value.toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    );

  };


  /* =======================================================
     FILTER PURCHASES
  ======================================================= */

  const filteredPurchases =
    purchases.filter((purchase) => {

      const query =
        search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        String(
          purchase.courseTitle || ""
        )
          .toLowerCase()
          .includes(query) ||
        String(
          purchase.razorpayPaymentId || ""
        )
          .toLowerCase()
          .includes(query) ||
        String(
          purchase.razorpayOrderId || ""
        )
          .toLowerCase()
          .includes(query) ||
        String(
          purchase.courseId || ""
        )
          .toLowerCase()
          .includes(query);


      const getPurchaseTime = (value) => {

        if (!value) {
          return 0;
        }

        if (
          typeof value.toMillis ===
          "function"
        ) {
          return value.toMillis();
        }

        if (
          typeof value.toDate ===
          "function"
        ) {
          return value.toDate().getTime();
        }

        const time =
          new Date(value).getTime();

        return Number.isNaN(time)
          ? 0
          : time;

      };


      const purchaseTime =
        getPurchaseTime(
          purchase.paidAt
        );


      let matchesFromDate = true;
      let matchesToDate = true;


      if (fromDate) {

        const start =
          new Date(
            `${fromDate}T00:00:00`
          ).getTime();

        matchesFromDate =
          purchaseTime >= start;

      }


      if (toDate) {

        const end =
          new Date(
            `${toDate}T23:59:59.999`
          ).getTime();

        matchesToDate =
          purchaseTime <= end;

      }


      return (
        matchesSearch &&
        matchesFromDate &&
        matchesToDate
      );

    });


  const clearFilters = () => {

    setSearch("");
    setFromDate("");
    setToDate("");

  };


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <section className="member-purchase-history-page">

      <style>
        {`
          .member-purchase-history-page {
            width: 100%;
          }

          .purchase-history-header {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 24px;
            margin-bottom: 28px;
          }

          .purchase-history-header h2 {
            margin: 5px 0 8px;
          }

          .purchase-history-header p {
            margin: 0;
            color: var(--muted, #777);
            max-width: 620px;
          }

          .purchase-history-summary {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            margin-bottom: 22px;
          }

          .purchase-history-stat {
            min-width: 150px;
            padding: 14px 16px;
            border: 1px solid rgba(0,0,0,.08);
            border-radius: 14px;
            background: var(--surface, #fff);
          }

          .purchase-history-stat small {
            display: block;
            margin-bottom: 5px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: .05em;
            text-transform: uppercase;
            opacity: .55;
          }

          .purchase-history-stat strong {
            font-size: 20px;
            line-height: 1;
          }

          .purchase-history-list {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          .purchase-history-card {
            padding: 20px;
            border: 1px solid rgba(0,0,0,.08);
            border-radius: 16px;
            background: var(--surface, #fff);
            box-shadow: 0 6px 20px rgba(0,0,0,.03);
          }

          .purchase-history-main {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 20px;
          }

          .purchase-history-course-label {
            display: inline-block;
            margin-bottom: 5px;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: .08em;
            opacity: .5;
          }

          .purchase-history-card h3 {
            margin: 0 0 6px;
            font-size: 18px;
            line-height: 1.3;
          }

          .purchase-history-date {
            font-size: 12px;
            color: var(--muted, #777);
          }

          .purchase-history-price {
            flex: 0 0 auto;
            font-size: 20px;
            font-weight: 800;
            white-space: nowrap;
          }

          .purchase-history-details {
            display: grid;
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
            gap: 10px;
            margin-top: 17px;
            padding-top: 15px;
            border-top: 1px solid rgba(0,0,0,.07);
          }

          .purchase-history-detail {
            padding: 10px 12px;
            border-radius: 10px;
            background: rgba(0,0,0,.025);
            min-width: 0;
          }

          .purchase-history-detail span {
            display: block;
            margin-bottom: 4px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: .04em;
            opacity: .5;
          }

          .purchase-history-detail strong {
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 12px;
            font-weight: 600;
          }

          .purchase-history-status {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin-top: 12px;
            padding: 6px 10px;
            border-radius: 999px;
            background: rgba(24,134,75,.09);
            color: #18864b;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
          }

          .purchase-history-empty,
          .purchase-history-error {
            padding: 52px 22px;
            text-align: center;
            border: 1px dashed rgba(0,0,0,.14);
            border-radius: 16px;
            background: var(--surface, #fff);
          }

          .purchase-history-empty-icon {
            margin-bottom: 10px;
            font-size: 32px;
          }

          .purchase-history-empty h3,
          .purchase-history-error h3 {
            margin: 0 0 7px;
            font-size: 18px;
          }

          .purchase-history-empty p,
          .purchase-history-error p {
            margin: 0;
            color: var(--muted, #777);
          }

          .purchase-history-loading {
            padding: 45px 20px;
            text-align: center;
            color: var(--muted, #777);
          }

          .purchase-history-filters {
            display: grid;
            grid-template-columns:
              minmax(220px, 1.5fr)
              minmax(150px, 1fr)
              minmax(150px, 1fr)
              auto;
            gap: 10px;
            margin-bottom: 22px;
          }

          .purchase-history-filter-input {
            width: 100%;
            height: 42px;
            padding: 0 12px;
            box-sizing: border-box;
            border: 1px solid rgba(0,0,0,.12);
            border-radius: 10px;
            background: var(--surface, #fff);
            color: var(--ink, #222);
            font: inherit;
            outline: none;
          }

          .purchase-history-filter-input:focus {
            border-color: #e8473f;
            box-shadow:
              0 0 0 3px rgba(232,71,63,.10);
          }

          .purchase-history-clear {
            height: 42px;
            padding: 0 16px;
            border: 0;
            border-radius: 10px;
            background: #e8473f;
            color: #fff;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
          }

          .purchase-history-clear:hover {
            opacity: .92;
          }

          .purchase-history-results {
            margin-bottom: 14px;
            font-size: 12px;
            color: var(--muted, #777);
          }

          @media (max-width: 800px) {

            .purchase-history-filters {
              grid-template-columns: 1fr 1fr;
            }

            .purchase-history-clear {
              width: 100%;
            }

            .purchase-history-header {
              align-items: flex-start;
              flex-direction: column;
            }

            .purchase-history-details {
              grid-template-columns: 1fr;
            }

          }

          @media (max-width: 560px) {

            .purchase-history-filters {
              grid-template-columns: 1fr;
            }

            .purchase-history-main {
              flex-direction: column;
            }

            .purchase-history-price {
              font-size: 18px;
            }

          }
        `}
      </style>


      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="purchase-history-header">

        <div>

          <span className="member-eyebrow">
            ACCOUNT
          </span>

          <h2>
            Purchase History
          </h2>

          <p>
            View your course purchases, payment
            details, and purchase status.
          </p>

        </div>

      </div>


      {/* =====================================================
          SUMMARY
      ===================================================== */}

      {!loading && !error && (

        <div className="purchase-history-summary">

          <div className="purchase-history-stat">

            <small>
              Courses Purchased
            </small>

            <strong>
              {purchases.length}
            </strong>

          </div>


          <div className="purchase-history-stat">

            <small>
              Total Spent
            </small>

            <strong>
              ₹
              {formatAmount(
                purchases.reduce(
                  (total, item) =>
                    total +
                    Number(
                      item.amount || 0
                    ),
                  0
                )
              )}
            </strong>

          </div>

        </div>

      )}


      {/* =====================================================
          SEARCH + DATE FILTERS
      ===================================================== */}

      {!loading && !error && (

        <>
          <div className="purchase-history-filters">

            <input
              className="purchase-history-filter-input"
              type="text"
              placeholder="Search course or payment..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            <input
              className="purchase-history-filter-input"
              type="date"
              value={fromDate}
              onChange={(e) =>
                setFromDate(e.target.value)
              }
              aria-label="From date"
            />

            <input
              className="purchase-history-filter-input"
              type="date"
              value={toDate}
              onChange={(e) =>
                setToDate(e.target.value)
              }
              aria-label="To date"
            />

            <button
              type="button"
              className="purchase-history-clear"
              onClick={clearFilters}
            >
              Clear
            </button>

          </div>

          {purchases.length > 0 && (
            <div className="purchase-history-results">
              Showing{" "}
              <strong>
                {filteredPurchases.length}
              </strong>{" "}
              of{" "}
              <strong>
                {purchases.length}
              </strong>{" "}
              purchases
            </div>
          )}
        </>

      )}


      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading && (

        <div className="purchase-history-loading">
          Loading your purchases...
        </div>

      )}


      {/* =====================================================
          ERROR
      ===================================================== */}

      {!loading && error && (

        <div className="purchase-history-error">

          <div className="purchase-history-empty-icon">
            ⚠
          </div>

          <h3>
            Unable to load purchases
          </h3>

          <p>
            {error}
          </p>

        </div>

      )}


      {/* =====================================================
          EMPTY
      ===================================================== */}

      {!loading &&
        !error &&
        filteredPurchases.length === 0 &&
        purchases.length === 0 && (

          <div className="purchase-history-empty">

            <div className="purchase-history-empty-icon">
              🧾
            </div>

            <h3>
              No purchases yet
            </h3>

            <p>
              Your course purchases will appear
              here after you complete a payment.
            </p>

          </div>

        )}


      {/* =====================================================
          NO FILTER MATCHES
      ===================================================== */}

      {!loading &&
        !error &&
        purchases.length > 0 &&
        filteredPurchases.length === 0 && (

          <div className="purchase-history-empty">

            <div className="purchase-history-empty-icon">
              🔍
            </div>

            <h3>
              No matching purchases
            </h3>

            <p>
              Try another search term or date range.
            </p>

            <button
              type="button"
              className="purchase-history-clear"
              style={{
                marginTop: "16px"
              }}
              onClick={clearFilters}
            >
              Clear Filters
            </button>

          </div>

        )}


      {/* =====================================================
          PURCHASE LIST
      ===================================================== */}

      {!loading &&
        !error &&
        filteredPurchases.length > 0 && (

          <div className="purchase-history-list">

            {filteredPurchases.map((purchase) => (

              <article
                key={purchase.id}
                className="purchase-history-card"
              >

                <div className="purchase-history-main">

                  <div>

                    <span className="purchase-history-course-label">
                      COURSE
                    </span>

                    <h3>
                      {purchase.courseTitle ||
                        "Course"}
                    </h3>

                    <div className="purchase-history-date">
                      Purchased{" "}
                      {formatDate(
                        purchase.paidAt
                      )}
                    </div>

                  </div>


                  <div className="purchase-history-price">
                    ₹
                    {formatAmount(
                      purchase.amount
                    )}
                  </div>

                </div>


                <div className="purchase-history-details">

                  <div className="purchase-history-detail">

                    <span>
                      Payment ID
                    </span>

                    <strong
                      title={
                        purchase.razorpayPaymentId ||
                        ""
                      }
                    >
                      {purchase.razorpayPaymentId ||
                        "—"}
                    </strong>

                  </div>


                  <div className="purchase-history-detail">

                    <span>
                      Order ID
                    </span>

                    <strong
                      title={
                        purchase.razorpayOrderId ||
                        ""
                      }
                    >
                      {purchase.razorpayOrderId ||
                        "—"}
                    </strong>

                  </div>


                  <div className="purchase-history-detail">

                    <span>
                      Course ID
                    </span>

                    <strong
                      title={
                        purchase.courseId ||
                        ""
                      }
                    >
                      {purchase.courseId ||
                        "—"}
                    </strong>

                  </div>

                </div>


                <div className="purchase-history-status">
                  ✓
                  {purchase.status ||
                    "paid"}
                </div>

              </article>

            ))}

          </div>

        )}

    </section>

  );

}


/* =========================================================
   EXPORT
========================================================= */
window.MemberHistoryPurchase =
  MemberHistoryPurchase;
