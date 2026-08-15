/* global React, window */

const { useState, useEffect } = React;

function PurchaseHistory() {

  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================================================
     LOAD PURCHASE HISTORY
  ========================================================= */

  useEffect(() => {

    const loadPurchases = async () => {

      try {

        setLoading(true);
        setError("");

        if (!window.auth) {
          throw new Error(
            "Firebase Authentication is not initialized."
          );
        }

        const user = window.auth.currentUser;

        if (!user) {
          throw new Error(
            "Please login again."
          );
        }

        console.log(
          "Loading purchase history for:",
          user.email
        );

        /*
          PURCHASES COLLECTION

          Expected Firestore structure:

          purchases
            └── document
                ├── userId
                ├── email
                ├── productName
                ├── amount
                ├── paymentId
                ├── orderId
                ├── status
                └── createdAt
        */

        if (!window.db) {
          throw new Error(
            "Firestore is not initialized."
          );
        }

        const snapshot =
          await window.db
            .collection("purchases")
            .where(
              "email",
              "==",
              user.email
            )
            .get();


        const data =
          snapshot.docs.map((doc) => {

            const item = doc.data();

            return {
              id: doc.id,

              productName:
                item.productName ||
                item.courseName ||
                item.product ||
                "Wealthoria Membership",

              amount:
                item.amount ||
                item.price ||
                0,

              paymentId:
                item.paymentId ||
                item.transactionId ||
                item.transaction_id ||
                "-",

              orderId:
                item.orderId ||
                item.order_id ||
                "-",

              status:
                item.status ||
                item.paymentStatus ||
                "Paid",

              createdAt:
                item.createdAt ||
                item.date ||
                null
            };

          });


        /* Sort newest first */

        data.sort((a, b) => {

          const dateA =
            getDateValue(a.createdAt);

          const dateB =
            getDateValue(b.createdAt);

          return dateB - dateA;

        });


        setPurchases(data);

      } catch (err) {

        console.error(
          "Purchase history error:",
          err
        );

        setError(
          err.message ||
          "Unable to load purchase history."
        );

      } finally {

        setLoading(false);

      }

    };


    loadPurchases();

  }, []);


  /* =========================================================
     DATE HELPER
  ========================================================= */

  function getDateValue(value) {

    if (!value) {
      return 0;
    }

    try {

      if (
        value &&
        typeof value.toDate === "function"
      ) {

        return value.toDate().getTime();

      }

      if (
        value &&
        value.seconds
      ) {

        return (
          value.seconds * 1000
        );

      }

      return new Date(value).getTime();

    } catch {

      return 0;

    }

  }


  /* =========================================================
     FORMAT DATE
  ========================================================= */

  function formatDate(value) {

    const timestamp =
      getDateValue(value);

    if (!timestamp) {
      return "-";
    }

    return new Date(timestamp)
      .toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric"
        }
      );

  }


  /* =========================================================
     FORMAT AMOUNT
  ========================================================= */

  function formatAmount(amount) {

    if (
      amount === null ||
      amount === undefined ||
      amount === ""
    ) {

      return "₹0";

    }

    let value =
      Number(amount);

    /*
      If Razorpay amount is stored
      in paise, convert to rupees.
    */

    if (value >= 1000) {

      value =
        value / 100;

    }

    return (
      "₹" +
      value.toLocaleString(
        "en-IN",
        {
          maximumFractionDigits: 2
        }
      )
    );

  }


  /* =========================================================
     BACK TO DASHBOARD
  ========================================================= */

  const backToDashboard = () => {

    if (
      window.membersNavigate
    ) {

      window.membersNavigate(
        "/members/dashboard"
      );

    } else {

      window.location.href =
        "/members/dashboard";

    }

  };


  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {

    return (

      <section className="member-purchase-page">

        <div className="member-purchase-loading">

          <div className="member-purchase-spinner">
            ⟳
          </div>

          <p>
            Loading purchase history...
          </p>

        </div>

      </section>

    );

  }


  /* =========================================================
     PAGE
  ========================================================= */

  return (

    <section className="member-purchase-page">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="member-purchase-header">

        <div>

          <span className="member-eyebrow">
            ACCOUNT
          </span>

          <h2>
            Purchase History
          </h2>

          <p>
            View your Wealthoria purchases,
            payments and transaction details.
          </p>

        </div>


        <button
          className="member-purchase-back"
          onClick={backToDashboard}
        >

          ← Dashboard

        </button>

      </div>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (

        <div className="member-purchase-error">

          <strong>
            Unable to load purchases
          </strong>

          <p>
            {error}
          </p>

          <button
            onClick={() =>
              window.location.reload()
            }
          >
            Try Again
          </button>

        </div>

      )}


      {/* =====================================================
          SUMMARY
      ===================================================== */}

      {!error && (

        <>

          <div className="member-purchase-summary">


            <div className="member-purchase-summary-card">

              <span>
                Total Purchases
              </span>

              <strong>
                {purchases.length}
              </strong>

            </div>


            <div className="member-purchase-summary-card">

              <span>
                Successful Payments
              </span>

              <strong>

                {
                  purchases.filter(
                    (item) =>
                      String(
                        item.status
                      ).toLowerCase() ===
                      "paid" ||
                      String(
                        item.status
                      ).toLowerCase() ===
                      "success" ||
                      String(
                        item.status
                      ).toLowerCase() ===
                      "successful"
                  ).length
                }

              </strong>

            </div>


            <div className="member-purchase-summary-card">

              <span>
                Account
              </span>

              <strong className="member-purchase-email">

                {
                  window.auth?.currentUser
                    ?.email || "-"
                }

              </strong>

            </div>


          </div>


          {/* =================================================
              PURCHASE TABLE
          ================================================= */}

          <div className="member-purchase-panel">


            <div className="member-purchase-panel-header">

              <div>

                <span>
                  TRANSACTIONS
                </span>

                <h3>
                  Your Purchases
                </h3>

              </div>

            </div>


            {purchases.length === 0 ? (

              <div className="member-purchase-empty">

                <div className="member-purchase-empty-icon">
                  ▣
                </div>

                <h3>
                  No purchases yet
                </h3>

                <p>
                  Your completed Wealthoria
                  purchases will appear here.
                </p>

              </div>

            ) : (

              <div className="member-purchase-table-wrapper">

                <table className="member-purchase-table">

                  <thead>

                    <tr>

                      <th>
                        Date
                      </th>

                      <th>
                        Product
                      </th>

                      <th>
                        Amount
                      </th>

                      <th>
                        Payment ID
                      </th>

                      <th>
                        Order ID
                      </th>

                      <th>
                        Status
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {purchases.map(
                      (purchase) => (

                        <tr
                          key={
                            purchase.id
                          }
                        >

                          <td>

                            {formatDate(
                              purchase.createdAt
                            )}

                          </td>


                          <td>

                            <div className="member-purchase-product">

                              <div className="member-purchase-product-icon">
                                W
                              </div>

                              <strong>
                                {
                                  purchase.productName
                                }
                              </strong>

                            </div>

                          </td>


                          <td>

                            <strong>

                              {formatAmount(
                                purchase.amount
                              )}

                            </strong>

                          </td>


                          <td>

                            <span className="member-purchase-id">

                              {
                                purchase.paymentId
                              }

                            </span>

                          </td>


                          <td>

                            <span className="member-purchase-id">

                              {
                                purchase.orderId
                              }

                            </span>

                          </td>


                          <td>

                            <span
                              className={`member-purchase-status ${
                                String(
                                  purchase.status
                                ).toLowerCase() ===
                                "paid" ||
                                String(
                                  purchase.status
                                ).toLowerCase() ===
                                "success" ||
                                String(
                                  purchase.status
                                ).toLowerCase() ===
                                "successful"
                                  ? "success"
                                  : "pending"
                              }`}
                            >

                              {
                                purchase.status
                              }

                            </span>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </>

      )}

    </section>

  );

}


/* =========================================================
   EXPORT
========================================================= */

window.PurchaseHistory =
  PurchaseHistory;