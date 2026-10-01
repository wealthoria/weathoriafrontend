import React from "react";

/* global React, window */

const { useState, useEffect } = React;

function SeminarRegistrations() {

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {

    const loadRegistrations = async () => {

      try {

        setLoading(true);
        setError("");

        if (!window.db) {
          throw new Error(
            "Firestore is not initialized."
          );
        }

        /*
         * IMPORTANT:
         * This collection name must match
         * your Firebase collection.
         */
        const snapshot = await window.db
          .collection("seminar_registrations")
          .get();

        const data = snapshot.docs.map((doc) => {

          const item = doc.data();

          let createdAt = "";

          if (
            item.created_at &&
            typeof item.created_at.toDate === "function"
          ) {
            createdAt = item.created_at
              .toDate()
              .toLocaleString("en-IN");
          } else if (item.created_at) {
            createdAt = String(item.created_at);
          }

          return {
            id: doc.id,
            full_name: item.full_name || "",
            email: item.email || "",
            phone: item.phone || "",
            place: item.place || "",
            amount: item.amount || "",
            payment_status: item.payment_status || "",
            transaction_id: item.transaction_id || "",
            order_id: item.order_id || "",
            created_at: createdAt
          };

        });

        setRegistrations(data);

      } catch (err) {

        console.error(
          "Failed to load seminar registrations:",
          err
        );

        setError(
          err.message ||
          "Unable to load registrations."
        );

      } finally {

        setLoading(false);

      }

    };

    loadRegistrations();

  }, []);


  /* =====================================================
     SEARCH
  ===================================================== */

  const filteredRegistrations =
    registrations.filter((item) => {

      const query =
        search.trim().toLowerCase();

      if (!query) {
        return true;
      }

      return (

        String(item.full_name)
          .toLowerCase()
          .includes(query)

        ||

        String(item.email)
          .toLowerCase()
          .includes(query)

        ||

        String(item.phone)
          .toLowerCase()
          .includes(query)

        ||

        String(item.place)
          .toLowerCase()
          .includes(query)

        ||

        String(item.payment_status)
          .toLowerCase()
          .includes(query)

      );

    });


  /* =====================================================
     EXPORT
  ===================================================== */

  const exportExcel = () => {

    if (!filteredRegistrations.length) {

      alert(
        "There are no registrations to export."
      );

      return;

    }

    const headers = [
      "S.No",
      "Full Name",
      "Email",
      "Phone",
      "Place",
      "Amount",
      "Payment Status",
      "Order ID",
      "Transaction ID",
      "Created At"
    ];

    const rows =
      filteredRegistrations.map(
        (item, index) => [

          index + 1,
          item.full_name,
          item.email,
          item.phone,
          item.place,
          item.amount,
          item.payment_status,
          item.order_id,
          item.transaction_id,
          item.created_at

        ]
      );

    const csv = [
      headers,
      ...rows
    ]
      .map((row) =>
        row
          .map((value) => {

            const text =
              String(value ?? "");

            return `"${text.replace(
              /"/g,
              '""'
            )}"`;

          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      [csv],
      {
        type:
          "text/csv;charset=utf-8;"
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "seminar-registrations.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

  };


  /* =====================================================
     UI
  ===================================================== */

  return (

    <div className="seminar-registration-page">

      <div className="seminar-registration-header">

        <div>

          <span className="seminar-registration-eyebrow">
            WEALTHORIA
          </span>

          <h1>
            Seminar Registrations
          </h1>

          <p>
            View and manage registered seminar participants.
          </p>

        </div>

        <button
          className="seminar-export-btn"
          onClick={exportExcel}
        >
          â†“ Export Excel
        </button>

      </div>


      {/* SEARCH */}

      <div className="seminar-registration-toolbar">

        <input
          type="text"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search name, email, phone or place..."
        />

        <span>
          Showing{" "}
          <strong>
            {filteredRegistrations.length}
          </strong>{" "}
          of{" "}
          <strong>
            {registrations.length}
          </strong>
        </span>

      </div>


      {/* ERROR */}

      {error && (

        <div className="seminar-registration-error">
          {error}
        </div>

      )}


      {/* LOADING */}

      {loading ? (

        <div className="seminar-registration-loading">
          Loading registrations...
        </div>

      ) : (

        <div className="seminar-registration-table-wrap">

          <table className="seminar-registration-table">

            <thead>

              <tr>

                <th>#</th>
                <th>NAME</th>
                <th>EMAIL</th>
                <th>PHONE</th>
                <th>PLACE</th>
                <th>AMOUNT</th>
                <th>STATUS</th>
                <th>TRANSACTION ID</th>
                <th>DATE</th>

              </tr>

            </thead>

            <tbody>

              {filteredRegistrations.length === 0 ? (

                <tr>

                  <td
                    colSpan="9"
                    className="seminar-empty"
                  >
                    No registrations found.
                  </td>

                </tr>

              ) : (

                filteredRegistrations.map(
                  (item, index) => (

                    <tr key={item.id}>

                      <td>
                        {index + 1}
                      </td>

                      <td>
                        <strong>
                          {item.full_name || "—"}
                        </strong>
                      </td>

                      <td>
                        {item.email || "—"}
                      </td>

                      <td>
                        {item.phone || "—"}
                      </td>

                      <td>
                        {item.place || "—"}
                      </td>

                      <td>
                        {item.amount
                          ? `₹${item.amount}`
                          : "—"}
                      </td>

                      <td>

                        <span
                          className={
                            String(
                              item.payment_status
                            ).toLowerCase() === "paid"
                              ? "seminar-status-paid"
                              : "seminar-status-pending"
                          }
                        >
                          {item.payment_status || "—"}
                        </span>

                      </td>

                      <td>
                        {item.transaction_id || "—"}
                      </td>

                      <td>
                        {item.created_at || "—"}
                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      )}

    </div>

  );

}

window.SeminarRegistrations =
  SeminarRegistrations;
