/* global React, window */

import React, { useEffect, useMemo, useState } from "react";
const { MIcon } = window;

/* =========================================================
   HELPERS
========================================================= */

function safeTimestamp(value) {
  if (!value) return 0;

  if (typeof value === "number") {
    return value;
  }

  if (value?.toDate && typeof value.toDate === "function") {
    return value.toDate().getTime();
  }

  if (value?.seconds) {
    return Number(value.seconds) * 1000;
  }

  const parsed = new Date(value).getTime();

  return Number.isFinite(parsed) ? parsed : 0;
}


function formatDate(value) {
  const time = safeTimestamp(value);

  if (!time) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(time));
}


function valueOrDash(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "—";
  }

  return String(value);
}


function addressToText(address) {
  if (!address) return "—";

  const parts = [
    address.name,
    address.phone,
    address.address,
    address.landmark,
    address.city,
    address.state,
    address.pincode,
    address.country
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : "—";
}


function addressToLines(address) {
  if (!address) return [];

  return [
    address.name,
    address.phone,
    address.address,
    address.landmark,
    address.city,
    address.state,
    address.pincode,
    address.country
  ].filter(Boolean);
}


function getPaymentMeta(status) {
  const value = String(status || "").toLowerCase();

  if (value === "paid" || value === "captured") {
    return {
      label: "Paid",
      background: "#eefbf2",
      color: "#198754",
      border: "#ccefd7"
    };
  }

  if (
    value === "failed" ||
    value === "cancelled" ||
    value === "canceled"
  ) {
    return {
      label: value === "failed" ? "Failed" : "Cancelled",
      background: "#fff3f2",
      color: "#b42318",
      border: "#f8d5d1"
    };
  }

  return {
    label: value ? String(status) : "Pending",
    background: "#fff8e8",
    color: "#9a6700",
    border: "#f4dfaa"
  };
}


function getOrderMeta(status) {
  const value = String(status || "").toLowerCase();

  if (
    value === "confirmed" ||
    value === "completed" ||
    value === "delivered"
  ) {
    return {
      label: value.charAt(0).toUpperCase() + value.slice(1),
      background: "#eefbf2",
      color: "#198754",
      border: "#ccefd7"
    };
  }

  if (
    value === "cancelled" ||
    value === "canceled"
  ) {
    return {
      label: "Cancelled",
      background: "#fff3f2",
      color: "#b42318",
      border: "#f8d5d1"
    };
  }

  return {
    label: value
      ? value.charAt(0).toUpperCase() + value.slice(1)
      : "Pending",
    background: "#fff8e8",
    color: "#9a6700",
    border: "#f4dfaa"
  };
}


function getShippingMeta(status) {
  const value = String(status || "").toLowerCase();

  if (value === "delivered") {
    return {
      label: "Delivered",
      background: "#eefbf2",
      color: "#198754",
      border: "#ccefd7"
    };
  }

  if (value === "shipped" || value === "in_transit") {
    return {
      label: value === "in_transit" ? "In Transit" : "Shipped",
      background: "#eef7ff",
      color: "#246bce",
      border: "#cfe3ff"
    };
  }

  if (
    value === "cancelled" ||
    value === "failed"
  ) {
    return {
      label: value.charAt(0).toUpperCase() + value.slice(1),
      background: "#fff3f2",
      color: "#b42318",
      border: "#f8d5d1"
    };
  }

  return {
    label: value
      ? value.charAt(0).toUpperCase() + value.slice(1)
      : "Pending",
    background: "#f5f7fa",
    color: "#667085",
    border: "#e1e6ec"
  };
}


/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ type, value }) {
  let meta;

  if (type === "payment") {
    meta = getPaymentMeta(value);
  } else if (type === "shipping") {
    meta = getShippingMeta(value);
  } else {
    meta = getOrderMeta(value);
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "5px 9px",
        borderRadius: 999,
        background: meta.background,
        color: meta.color,
        border: `1px solid ${meta.border}`,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap"
      }}
    >
      {meta.label}
    </span>
  );
}


/* =========================================================
   DETAIL FIELD
========================================================= */

function DetailField({ label, children }) {
  return (
    <div
      style={{
        padding: "12px 0",
        borderBottom: "1px solid var(--border, #e8ebef)"
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#667085",
          marginBottom: 5,
          textTransform: "uppercase",
          letterSpacing: ".04em"
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 14,
          color: "var(--ink, #17191c)",
          lineHeight: 1.5,
          wordBreak: "break-word"
        }}
      >
        {children || "—"}
      </div>
    </div>
  );
}


/* =========================================================
   ADDRESS BOX
========================================================= */

function AddressBox({ title, address }) {
  const lines = addressToLines(address);

  return (
    <div
      style={{
        border: "1px solid var(--border, #e8ebef)",
        borderRadius: 14,
        padding: 16,
        background: "var(--card, #fff)"
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 750,
          marginBottom: 10,
          color: "var(--ink, #17191c)"
        }}
      >
        {title}
      </div>

      {lines.length ? (
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.7,
            color: "#475467"
          }}
        >
          {lines.map((line, index) => (
            <div key={index}>
              {line}
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            fontSize: 13,
            color: "#98a2b3"
          }}
        >
          No address available
        </div>
      )}
    </div>
  );
}


/* =========================================================
   MAIN PAGE
========================================================= */

function PrebookOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [shippingFilter, setShippingFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [statusSuccess, setStatusSuccess] = useState("");
  const [emailOrder, setEmailOrder] = useState(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");


  /* =======================================================
     FIRESTORE LISTENER
  ======================================================= */

  useEffect(() => {
    if (
      !window.db ||
      typeof window.db.collection !== "function"
    ) {
      setError("Firestore database is not available.");
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = window.db
      .collection("bookOrders")
      .onSnapshot(
        (snapshot) => {
          const rows = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));

          rows.sort(
            (a, b) =>
              safeTimestamp(b.createdAt) -
              safeTimestamp(a.createdAt)
          );

          setOrders(rows);
          setError("");
          setLoading(false);
        },
        (err) => {
          console.error(
            "Pre-book orders listener failed:",
            err
          );

          setError(
            "Unable to load pre-book orders."
          );

          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);


  /* =======================================================
     FILTER
  ======================================================= */

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const paymentStatus = String(
        order.paymentStatus || ""
      ).toLowerCase();

      const shippingStatus = String(
        order.shippingStatus || ""
      ).toLowerCase();

      if (
        paymentFilter !== "all" &&
        paymentStatus !== paymentFilter
      ) {
        return false;
      }

      if (
        shippingFilter !== "all" &&
        shippingStatus !== shippingFilter
      ) {
        return false;
      }

      if (!query) return true;

      const customer = order.customer || {};
      const product = order.product || {};

      const searchable = [
        order.bookingId,
        order.id,
        customer.name,
        customer.email,
        customer.phone,
        product.name,
        order.razorpayOrderId,
        order.razorpayPaymentId,
        order.shiprocketOrderId,
        order.shiprocketShipmentId,
        order.awbCode,
        order.courierName,
        order.orderStatus,
        order.shippingStatus,
        addressToText(order.shippingAddress),
        addressToText(order.billingAddress)
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [
    orders,
    search,
    paymentFilter,
    shippingFilter
  ]);


  /* =======================================================
     COUNTS
  ======================================================= */

  const counts = useMemo(() => {
    let paid = 0;
    let pendingShipping = 0;
    let shipped = 0;
    let delivered = 0;

    orders.forEach((order) => {
      const paymentStatus = String(
        order.paymentStatus || ""
      ).toLowerCase();

      const shippingStatus = String(
        order.shippingStatus || ""
      ).toLowerCase();

      if (paymentStatus === "paid") {
        paid += 1;
      }

      if (
        shippingStatus === "pending" ||
        !shippingStatus
      ) {
        pendingShipping += 1;
      }

      if (
        shippingStatus === "shipped" ||
        shippingStatus === "in_transit"
      ) {
        shipped += 1;
      }

      if (shippingStatus === "delivered") {
        delivered += 1;
      }
    });

    return {
      total: orders.length,
      paid,
      pendingShipping,
      shipped,
      delivered
    };
  }, [orders]);


  const icon = (name, size = 17) =>
    MIcon ? (
      <MIcon
        name={name}
        size={size}
      />
    ) : null;


  /* =======================================================
     UPDATE DELIVERY STATUS
  ======================================================= */

  const updateDeliveryStatus = async (order, newStatus) => {
    if (!order?.id || !newStatus) return;

    const actionText =
      newStatus === "shipped"
        ? "mark this order as Shipped"
        : newStatus === "delivered"
        ? "mark this order as Delivered"
        : `set the status to ${newStatus}`;

    if (!window.confirm(`Are you sure you want to ${actionText}?`)) {
      return;
    }

    try {
      setUpdatingStatus(true);
      setStatusError("");
      setStatusSuccess("");

      const response = await fetch(
        `https://asia-south1-wealthoria-6fc11.cloudfunctions.net/api/admin/notifications/prebook-orders/${encodeURIComponent(order.id)}/status`,
       
       
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            shippingStatus: newStatus
          })
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
          "Unable to update delivery status."
        );
      }

      setOrders((prev) =>
        prev.map((item) =>
          item.id === order.id
            ? {
                ...item,
                shippingStatus: newStatus,
                updatedAt: new Date().toISOString()
              }
            : item
        )
      );

      setSelected((prev) =>
        prev?.id === order.id
          ? {
              ...prev,
              shippingStatus: newStatus,
              updatedAt: new Date().toISOString()
            }
          : prev
      );

      setStatusSuccess(
        `Delivery status updated to ${newStatus}.`
      );

    } catch (error) {
      console.error(
        "Delivery status update error:",
        error
      );

      setStatusError(
        error.message ||
        "Unable to update delivery status."
      );

    } finally {
      setUpdatingStatus(false);
    }
  };


  /* =======================================================
     SEND PRE-BOOK EMAIL
  ======================================================= */

  const sendPrebookEmail = async () => {
    if (!emailOrder) return;

    const email = String(
      emailOrder.customer?.email || ""
    ).trim();

    if (!email) {
      setEmailError("Customer email is not available.");
      return;
    }

    if (!emailSubject.trim()) {
      setEmailError("Email subject is required.");
      return;
    }

    if (!emailMessage.trim()) {
      setEmailError("Email message is required.");
      return;
    }

    try {
      setSendingEmail(true);
      setEmailError("");
      setEmailSuccess("");

      const response = await fetch(
        "https://asia-south1-wealthoria-6fc11.cloudfunctions.net/api/admin/notifications/prebook-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            subject: emailSubject.trim(),
            message: emailMessage.trim()
          })
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
          "Unable to send email."
        );
      }

      setEmailSuccess("Email sent successfully.");

      setTimeout(() => {
        setEmailOrder(null);
        setEmailError("");
        setEmailSuccess("");
      }, 1200);

    } catch (error) {
      console.error(
        "Pre-book email error:",
        error
      );

      setEmailError(
        error.message ||
        "Unable to send email."
      );

    } finally {
      setSendingEmail(false);
    }
  };


/* =======================================================
   GENERATE SHIPPING LABEL PDF
   2 COLUMNS × 3 ROWS PER A4 PAGE
======================================================= */

/* =========================================================
   LOAD jsPDF
   ========================================================= */
/* =========================================================
   LOAD jsPDF
   ========================================================= */

const loadJsPDF = () => {
  return new Promise((resolve, reject) => {

    /* Already loaded */
    if (window.jspdf?.jsPDF) {
      resolve(window.jspdf.jsPDF);
      return;
    }

    /* Already loading */
    const existingScript = document.querySelector(
      'script[data-wealthoria-jspdf="true"]'
    );

    if (existingScript) {

      existingScript.addEventListener("load", () => {
        if (window.jspdf?.jsPDF) {
          resolve(window.jspdf.jsPDF);
        } else {
          reject(
            new Error(
              "jsPDF loaded but was not available."
            )
          );
        }
      });

      existingScript.addEventListener("error", () => {
        reject(
          new Error("Unable to load jsPDF.")
        );
      });

      return;
    }

    /* Load jsPDF */
    const script =
      document.createElement("script");

    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";

    script.async = true;

    script.dataset.wealthoriaJspdf = "true";

    script.onload = () => {

      if (window.jspdf?.jsPDF) {
        resolve(window.jspdf.jsPDF);
      } else {
        reject(
          new Error(
            "jsPDF loaded but was not available."
          )
        );
      }

    };

    script.onerror = () => {
      reject(
        new Error("Unable to load jsPDF.")
      );
    };

    document.head.appendChild(script);
  });
};


const generateShippingLabelsPDF = async () => {
  try {
    /* =====================================================
       CHECK ORDERS
       ===================================================== */

    if (!filteredOrders.length) {
      alert("No orders available to generate PDF.");
      return;
    }

    /* =====================================================
       LOAD jsPDF
       ===================================================== */

    const jsPDF = await loadJsPDF();

    /* =====================================================
       CREATE A4 PDF
       ===================================================== */

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    /* =====================================================
       A4 SIZE
       ===================================================== */

    const pageWidth = 210;
    const pageHeight = 297;

    /* =====================================================
       GRID

       3 COLUMNS × 6 ROWS
       18 LABELS PER PAGE
       ===================================================== */

    const columns = 3;
    const rows = 6;

    const labelsPerPage =
      columns * rows;

    /* =====================================================
       OUTER MARGIN
       ===================================================== */

    const marginX = 2;
    const marginY = 2;

    /* =====================================================
       HORIZONTAL GAP
       ===================================================== */

    const gapX = 2;

    /* =====================================================
       LABEL WIDTH

       210 - margins - gaps
       ===================================================== */

    const labelWidth =
      (
        pageWidth -
        marginX * 2 -
        gapX * (columns - 1)
      ) / columns;

    /* =====================================================
       LABEL HEIGHT

       Content box is intentionally shorter so
       there is NO large empty space below PIN.
       ===================================================== */

    const labelHeight = 43;

    /* =====================================================
       VERTICAL GAP

       Remaining A4 height is distributed between
       the 6 rows.
       ===================================================== */

    const availableHeight =
      pageHeight -
      marginY * 2;

    const gapY =
      (
        availableHeight -
        labelHeight * rows
      ) / (rows - 1);

    /* =====================================================
       PROCESS ORDERS
       ===================================================== */

    filteredOrders.forEach(
      (order, index) => {

        /* =================================================
           POSITION
           ================================================= */

        const position =
          index % labelsPerPage;

        /* =================================================
           NEW PAGE AFTER 18 LABELS
           ================================================= */

        if (
          index > 0 &&
          position === 0
        ) {
          pdf.addPage();
        }

        /* =================================================
           COLUMN
           ================================================= */

        const column =
          position % columns;

        /* =================================================
           ROW
           ================================================= */

        const row =
          Math.floor(
            position / columns
          );

        /* =================================================
           BOX POSITION
           ================================================= */

        const x =
          marginX +
          column *
            (
              labelWidth +
              gapX
            );

        const y =
          marginY +
          row *
            (
              labelHeight +
              gapY
            );

        /* =================================================
           CUSTOMER DATA
           ================================================= */

        const customer =
          order.customer || {};

        const address =
          order.shippingAddress || {};

        /* =================================================
           CUSTOMER NAME
           ================================================= */

        const name =
          customer.name ||
          address.name ||
          "—";

        /* =================================================
           PHONE
           ================================================= */

        const phone =
          customer.phone ||
          address.phone ||
          "—";

        /* =================================================
           ADDRESS
           ================================================= */

        const completeAddress = [
          address.address,
          address.landmark,
          address.city
        ]
          .filter(Boolean)
          .join(", ");

        /* =================================================
           STATE
           ================================================= */

        const state =
          address.state ||
          "—";

        /* =================================================
           PINCODE
           ================================================= */

        const pincode =
          address.pincode ||
          "—";

        /* =================================================
           SMALL INTERNAL PADDING
           ================================================= */

        const paddingX = 2;

        const left =
          x + paddingX;

        const right =
          x +
          labelWidth -
          paddingX;

        const contentWidth =
          labelWidth -
          paddingX * 2;

        /* =================================================
           DASHED BORDER
           ================================================= */

        pdf.setDrawColor(
          140,
          140,
          140
        );

        pdf.setLineWidth(
          0.25
        );

        pdf.setLineDashPattern(
          [1.2, 1.2],
          0
        );

        pdf.rect(
          x,
          y,
          labelWidth,
          labelHeight
        );

        /* Reset dash */
        pdf.setLineDashPattern(
          [],
          0
        );

        /* =================================================
           COMPANY NAME
           ================================================= */

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.setFontSize(
          6
        );

        pdf.text(
          "WEALTHORIA EDUCATION PRIVATE LIMITED",
          left,
          y + 4.2,
          {
            maxWidth:
              contentWidth
          }
        );

        /* =================================================
           DIVIDER
           ================================================= */

        pdf.setDrawColor(
          100,
          100,
          100
        );

        pdf.setLineWidth(
          0.15
        );

        pdf.line(
          left,
          y + 5.8,
          right,
          y + 5.8
        );

        /* =================================================
           DELIVER TO
           ================================================= */

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.setFontSize(
          5.5
        );

        pdf.text(
          "DELIVER TO",
          left,
          y + 8.5
        );

        /* =================================================
           CUSTOMER NAME

           SMALL SPACE AFTER DELIVER TO
           ================================================= */

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.setFontSize(
          9
        );

        const nameLines =
          pdf.splitTextToSize(
            String(name),
            contentWidth
          );

        const safeNameLines =
          nameLines.slice(
            0,
            2
          );

        pdf.text(
          safeNameLines,
          left,
          y + 12.5
        );

        /* =================================================
           PHONE
           ================================================= */

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setFontSize(
          6.5
        );

        pdf.text(
          `Ph: ${phone}`,
          left,
          y + 18.5
        );

        /* =================================================
           ADDRESS
           ================================================= */

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setFontSize(
          6.5
        );

        const addressLines =
          pdf.splitTextToSize(
            completeAddress ||
              "Address not available",
            contentWidth
          );

        /* Maximum 3 lines */
        const safeAddressLines =
          addressLines.slice(
            0,
            3
          );

        pdf.text(
          safeAddressLines,
          left,
          y + 22.5
        );

        /* =================================================
           STATE

           SMALL SPACE AFTER ADDRESS
           ================================================= */

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.setFontSize(
          6.5
        );

        pdf.text(
          `State: ${state}`,
          left,
          y + 32.5,
          {
            maxWidth:
              contentWidth
          }
        );

        /* =================================================
           PIN

           VERY SMALL GAP AFTER STATE
           ================================================= */

        const pinY =
          y + 34;

        const pinHeight =
          6;

        /* =================================================
           PIN BACKGROUND
           ================================================= */

        pdf.setFillColor(
          235,
          235,
          235
        );

        pdf.rect(
          left,
          pinY,
          contentWidth,
          pinHeight,
          "F"
        );

        /* =================================================
           PIN TEXT
           ================================================= */

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.setFontSize(
          8
        );

        pdf.text(
          `PIN: ${pincode}`,
          left + 2,
          pinY + 4
        );

        /*
         * PIN ends at:
         *
         * y + 34 + 6
         * = y + 40
         *
         * Box ends at:
         *
         * y + 43
         *
         * Therefore only 3mm padding
         * remains below the PIN.
         */
      }
    );

    /* =====================================================
       SAVE PDF
       ===================================================== */

    const today =
      new Date()
        .toISOString()
        .slice(
          0,
          10
        );

    pdf.save(
      `wealthoria-shipping-labels-${today}.pdf`
    );

  } catch (error) {

    console.error(
      "Shipping label PDF error:",
      error
    );

    alert(
      "Unable to generate the PDF. Please try again."
    );
  }
};
  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="admin-page prebook-orders-page"
      style={{
        maxWidth: 1600,
        margin: "0 auto",
        paddingBottom: 32
      }}
    >



      {/* ===================================================
          HEADER
      =================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 20,
          marginBottom: 22,
          flexWrap: "wrap"
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 7
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 25,
                lineHeight: 1.15,
                fontWeight: 750,
                letterSpacing: "-.02em"
              }}
            >
              Pre-book Orders
            </h2>
          </div>



        </div>

        
          <button
  type="button"
  onClick={generateShippingLabelsPDF}
  disabled={!filteredOrders.length}
  style={{
    height: 42,
    padding: "0 16px",
    border: "none",
    borderRadius: 10,
    background: filteredOrders.length
      ? "rgb(232 95 78)"
      : "#d0d5dd",
    color: "#fff",
    fontSize: 13,
    fontWeight: 750,
    cursor: filteredOrders.length
      ? "pointer"
      : "not-allowed",
    whiteSpace: "nowrap"
  }}
>
  Generate PDF
</button>
      </div>


      {/* ===================================================
          SUMMARY CARDS
      =================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(5, minmax(0, 1fr))",
          gap: 14,
          marginBottom: 20
        }}
      >
        {[
          [
            "Total orders",
            counts.total,
            "inbox",
            "#f5f7fa"
          ],
          [
            "Paid",
            counts.paid,
            "check",
            "#f0fbf3"
          ],
          [
            "Pending shipping",
            counts.pendingShipping,
            "package",
            "#fff8e8"
          ],
          [
            "Shipped",
            counts.shipped,
            "truck",
            "#f2f7ff"
          ],
          [
            "Delivered",
            counts.delivered,
            "check",
            "#f0fbf3"
          ]
        ].map(
          ([
            label,
            value,
            iconName,
            iconBg
          ]) => (
            <div
              key={label}
              style={{
                minWidth: 0,
                padding: 16,
                borderRadius: 14,
                border:
                  "1px solid var(--border, #e8ebef)",
                background:
                  "var(--card, #fff)",
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                gap: 14
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color:
                      "var(--muted, #667085)",
                    fontWeight: 600,
                    marginBottom: 7
                  }}
                >
                  {label}
                </div>

                <div
                  style={{
                    fontSize: 24,
                    lineHeight: 1,
                    fontWeight: 760,
                    color:
                      "var(--ink, #17191c)"
                  }}
                >
                  {value}
                </div>
              </div>

              <div
                style={{
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  borderRadius: 11,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: iconBg,
                  color: "#344054"
                }}
              >
                {icon(iconName)}
              </div>
            </div>
          )
        )}
      </div>


      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div
          style={{
            padding: "13px 15px",
            borderRadius: 12,
            background: "#fff3f2",
            border:
              "1px solid #f8d5d1",
            color: "#b42318",
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 600
          }}
        >
          {error}
        </div>
      )}


      {/* ===================================================
          FILTER BAR
      =================================================== */}

      <div
        style={{
          background: "var(--card, #fff)",
          border:
            "1px solid var(--border, #e8ebef)",
          borderRadius: 14,
          padding: 14,
          marginBottom: 14,
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap"
        }}
      >

        <div
          style={{
            position: "relative",
            flex: "1 1 320px",
            minWidth: 240
          }}
        >
          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search booking, customer, email, phone, Razorpay, AWB..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              height: 42,
              border:
                "1px solid #dfe3e8",
              borderRadius: 10,
              padding: "0 13px",
              fontSize: 13,
              outline: "none",
              background:
                "var(--card, #fff)",
              color:
                "var(--ink, #17191c)"
            }}
          />
        </div>


        <select
          value={paymentFilter}
          onChange={(e) =>
            setPaymentFilter(e.target.value)
          }
          style={{
            height: 42,
            border:
              "1px solid #dfe3e8",
            borderRadius: 10,
            padding: "0 12px",
            fontSize: 13,
            background:
              "var(--card, #fff)",
            color:
              "var(--ink, #17191c)"
          }}
        >
          <option value="all">
            All payments
          </option>
          <option value="paid">
            Paid
          </option>
          <option value="pending">
            Pending
          </option>
          <option value="failed">
            Failed
          </option>
        </select>


        <select
          value={shippingFilter}
          onChange={(e) =>
            setShippingFilter(e.target.value)
          }
          style={{
            height: 42,
            border:
              "1px solid #dfe3e8",
            borderRadius: 10,
            padding: "0 12px",
            fontSize: 13,
            background:
              "var(--card, #fff)",
            color:
              "var(--ink, #17191c)"
          }}
        >
          <option value="all">
            All shipping
          </option>
          <option value="pending">
            Pending
          </option>
          <option value="shipped">
            Shipped
          </option>
          <option value="in_transit">
            In Transit
          </option>
          <option value="delivered">
            Delivered
          </option>
        </select>


        <button
          type="button"
          onClick={() => {
            setSearch("");
            setPaymentFilter("all");
            setShippingFilter("all");
          }}
          style={{
            height: 42,
            padding: "0 14px",
            border:
              "1px solid #dfe3e8",
            borderRadius: 10,
            background:
              "var(--card, #fff)",
            color: "#344054",
            fontSize: 13,
            fontWeight: 650,
            cursor: "pointer"
          }}
        >
          Clear
        </button>

      </div>


      {/* ===================================================
          TABLE
      =================================================== */}

      <div
        style={{
          background:
            "var(--card, #fff)",
          border:
            "1px solid var(--border, #e8ebef)",
          borderRadius: 16,
          overflow: "hidden"
        }}
      >

        <div
          style={{
            padding: "14px 16px",
            borderBottom:
              "1px solid var(--border, #e8ebef)",
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: 10
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700
            }}
          >
            Orders
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#667085"
            }}
          >
            Showing {filteredOrders.length} of{" "}
            {orders.length}
          </div>
        </div>


        <div
          style={{
            overflowX: "auto",
            width: "100%"
          }}
        >

          <table
            style={{
              width: "100%",
              minWidth: 1250,
              borderCollapse: "collapse"
            }}
          >

            <thead>
              <tr
                style={{
                  background:
                    "#f8fafc",
                  borderBottom:
                    "1px solid #e8ebef"
                }}
              >

                {[
                  "Booking ID",
                  "Name",
                  "Email",
                  "Phone",
                  "Qty",
                  "Amount",
                  "Delivery Status",
                  "View",
                  "Send Email"
                ].map(
                  (heading, index) => (
                    <th
                      key={`${heading}-${index}`}
                      style={{
                        textAlign:
                          "left",
                        padding:
                          "13px 14px",
                        fontSize: 11,
                        fontWeight: 750,
                        color:
                          "#667085",
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


            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      padding: 50,
                      textAlign:
                        "center",
                      color:
                        "#667085",
                      fontSize: 13
                    }}
                  >
                    Loading pre-book orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      padding: 50,
                      textAlign:
                        "center",
                      color:
                        "#667085",
                      fontSize: 13
                    }}
                  >
                    {orders.length === 0
                      ? "No pre-book orders found."
                      : "No orders match your search or filters."}
                  </td>
                </tr>
              ) : (
                filteredOrders.map(
                  (order) => {
                    const customer =
                      order.customer ||
                      {};

                    const product =
                      order.product ||
                      {};

                    return (
                      <tr
                        key={order.id}
                        style={{
                          borderBottom:
                            "1px solid #edf0f3"
                        }}
                      >

                        {/* BOOKING ID */}
                        <td
                          style={{
                            padding: "14px",
                            fontSize: 13,
                            fontWeight: 750,
                            whiteSpace: "nowrap"
                          }}
                        >
                          {valueOrDash(order.bookingId)}
                        </td>

                        {/* NAME */}
                        <td
                          style={{
                            padding: "14px",
                            fontSize: 13,
                            fontWeight: 650,
                            whiteSpace: "nowrap"
                          }}
                        >
                          {valueOrDash(customer.name)}
                        </td>

                        {/* EMAIL */}
                        <td
                          style={{
                            padding: "14px",
                            fontSize: 13,
                            whiteSpace: "nowrap"
                          }}
                        >
                          {valueOrDash(customer.email)}
                        </td>

                        {/* PHONE */}
                        <td
                          style={{
                            padding: "14px",
                            fontSize: 13,
                            whiteSpace: "nowrap"
                          }}
                        >
                          {valueOrDash(customer.phone)}
                        </td>

                        {/* QTY */}
                        <td
                          style={{
                            padding: "14px",
                            fontSize: 13,
                            textAlign: "center"
                          }}
                        >
                          {valueOrDash(product.quantity || 1)}
                        </td>

                        {/* AMOUNT */}
                        <td
                          style={{
                            padding: "14px",
                            fontSize: 13,
                            fontWeight: 700,
                            whiteSpace: "nowrap"
                          }}
                        >
                          ₹{valueOrDash(order.amount)}
                        </td>

                        {/* DELIVERY STATUS */}
                        <td style={{ padding: "14px", minWidth: 220 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              flexWrap: "wrap"
                            }}
                          >
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "5px 9px",
                                borderRadius: 999,
                                background:
                                  order.shippingStatus === "delivered"
                                    ? "#ecfdf3"
                                    : order.shippingStatus === "shipped"
                                    ? "#eff8ff"
                                    : "#f2f4f7",
                                color:
                                  order.shippingStatus === "delivered"
                                    ? "#067647"
                                    : order.shippingStatus === "shipped"
                                    ? "#175cd3"
                                    : "#475467",
                                fontSize: 11,
                                fontWeight: 750,
                                whiteSpace: "nowrap"
                              }}
                            >
                              {order.shippingStatus === "delivered"
                                ? "✓ Delivered"
                                : order.shippingStatus === "shipped"
                                ? "Shipped"
                                : "Pending"}
                            </span>

                            {order.shippingStatus !== "delivered" && (
                              <button
                                type="button"
                                disabled={updatingStatus}
                                onClick={() =>
                                  updateDeliveryStatus(
                                    order,
                                    order.shippingStatus === "shipped"
                                      ? "delivered"
                                      : "shipped"
                                  )
                                }
                                style={{
                                  height: 34,
                                  padding: "0 11px",
                                  border: "none",
                                  borderRadius: 7,
                                  background:
                                    order.shippingStatus === "shipped"
                                      ? "#067647"
                                      : "#175cd3",
                                  color: "#fff",
                                  fontSize: 11,
                                  fontWeight: 750,
                                  cursor: updatingStatus
                                    ? "not-allowed"
                                    : "pointer",
                                  opacity: updatingStatus ? 0.65 : 1,
                                  whiteSpace: "nowrap"
                                }}
                              >
                                {updatingStatus
                                  ? "Updating..."
                                  : order.shippingStatus === "shipped"
                                  ? "Mark as Delivered"
                                  : "Mark as Shipped"}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* VIEW */}
                        <td style={{ padding: "14px" }}>
                          <button
                            type="button"
                            onClick={() => setSelected(order)}
                            style={{
                              height: 34,
                              padding: "0 12px",
                              border: "1px solid #dfe3e8",
                              borderRadius: 8,
                              background: "#fff",
                              color: "#344054",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                              whiteSpace: "nowrap"
                            }}
                          >
                            View
                          </button>
                        </td>

                        {/* SEND EMAIL */}
                        <td style={{ padding: "14px" }}>
                          <button
                            type="button"
                            onClick={() => {
                              const name = customer.name || "Customer";
                              const bookingId = order.bookingId || "";
                              const amount = order.amount ?? "";
                              setEmailOrder(order);
                              setEmailSubject(
                                `Wealthoria – Pre-booking Confirmation ${bookingId}`
                              );
                              setEmailMessage(
                                `Dear ${name},\n\n` +
                                `Thank you for pre-booking the book "ಹೂಡಿಕೆಯ ವಿಜ್ಞಾನ" with Wealthoria.\n\n` +
                                `Booking ID: ${bookingId}\n` +
                                `Amount Paid: ₹${amount}\n\n` +
                                `We will share shipping updates once your book is dispatched.\n\n` +
                                `Regards,\nWealthoria`
                              );
                            }}
                            style={{
                              height: 34,
                              padding: "0 12px",
                              border: "1px solid #f0c9c1",
                              borderRadius: 8,
                              background: "#fff7f5",
                              color: "#c0392b",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                              whiteSpace: "nowrap"
                            }}
                          >
                            Send Email
                          </button>
                        </td>

                      </tr>
                    );
                  }
                )
              )}

            </tbody>

          </table>

        </div>
      </div>


      {/* ===================================================
          SEND EMAIL MODAL
      =================================================== */}

      {emailOrder && (
        <div
          onClick={() => setEmailOrder(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, .48)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(650px, 100%)",
              background: "var(--card, #fff)",
              borderRadius: 18,
              boxShadow: "0 25px 80px rgba(0,0,0,.22)",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                padding: "18px 20px",
                borderBottom: "1px solid #e8ebef",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 15
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    marginBottom: 4
                  }}
                >
                  Send Email
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#667085"
                  }}
                >
                  To: {emailOrder.customer?.email || "—"}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEmailOrder(null)}
                style={{
                  width: 36,
                  height: 36,
                  border: "1px solid #dfe3e8",
                  borderRadius: 9,
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: 18,
                  color: "#475467"
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: 20 }}>
              {emailError && (
                <div
                  style={{
                    padding: "10px 12px",
                    marginBottom: 12,
                    borderRadius: 8,
                    background: "#fff3f2",
                    color: "#b42318",
                    fontSize: 13,
                    fontWeight: 600
                  }}
                >
                  {emailError}
                </div>
              )}

              {emailSuccess && (
                <div
                  style={{
                    padding: "10px 12px",
                    marginBottom: 12,
                    borderRadius: 8,
                    background: "#eefbf2",
                    color: "#198754",
                    fontSize: 13,
                    fontWeight: 600
                  }}
                >
                  {emailSuccess}
                </div>
              )}

              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#475467",
                  marginBottom: 7
                }}
              >
                Recipient
              </label>

              <input
                value={emailOrder.customer?.email || ""}
                readOnly
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  height: 42,
                  border: "1px solid #dfe3e8",
                  borderRadius: 9,
                  padding: "0 12px",
                  marginBottom: 15,
                  fontSize: 13,
                  background: "#f8fafc"
                }}
              />

              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#475467",
                  marginBottom: 7
                }}
              >
                Subject
              </label>

              <input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  height: 42,
                  border: "1px solid #dfe3e8",
                  borderRadius: 9,
                  padding: "0 12px",
                  marginBottom: 15,
                  fontSize: 13
                }}
              />

              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#475467",
                  marginBottom: 7
                }}
              >
                Message
              </label>

              <textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={10}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  border: "1px solid #dfe3e8",
                  borderRadius: 9,
                  padding: 12,
                  resize: "vertical",
                  fontSize: 13,
                  lineHeight: 1.55,
                  fontFamily: "inherit"
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 16
                }}
              >
                <button
                  type="button"
                  onClick={() => setEmailOrder(null)}
                  style={{
                    height: 40,
                    padding: "0 15px",
                    border: "1px solid #dfe3e8",
                    borderRadius: 9,
                    background: "#fff",
                    color: "#344054",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={sendPrebookEmail}
                  disabled={sendingEmail}
                  style={{
                    height: 40,
                    padding: "0 17px",
                    border: "1px solid #c0392b",
                    borderRadius: 9,
                    background: "#c0392b",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 750,
                    cursor: sendingEmail
                      ? "not-allowed"
                      : "pointer",
                    opacity: sendingEmail ? 0.7 : 1
                  }}
                >
                  {sendingEmail ? "Sending..." : "Send Email"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          DETAILS MODAL
      =================================================== */}

      {selected && (
        <div
          onClick={() =>
            setSelected(null)
          }
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(15, 23, 42, .48)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20
          }}
        >

          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            style={{
              width: "min(1050px, 100%)",
              maxHeight: "90vh",
              overflowY: "auto",
              background:
                "var(--card, #fff)",
              borderRadius: 18,
              boxShadow:
                "0 25px 80px rgba(0,0,0,.22)"
            }}
          >

            {/* MODAL HEADER */}

            <div
              style={{
                padding:
                  "18px 20px",
                borderBottom:
                  "1px solid var(--border, #e8ebef)",
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                gap: 15,
                position:
                  "sticky",
                top: 0,
                background:
                  "var(--card, #fff)",
                zIndex: 2
              }}
            >

              <div>
                <div
                  style={{
                    fontSize: 11,
                    color:
                      "#667085",
                    fontWeight: 700,
                    marginBottom: 4,
                    textTransform:
                      "uppercase"
                  }}
                >
                  Booking
                </div>

                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800
                  }}
                >
                  {valueOrDash(
                    selected.bookingId
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelected(null)
                }
                style={{
                  width: 36,
                  height: 36,
                  border:
                    "1px solid #dfe3e8",
                  borderRadius: 9,
                  background:
                    "#fff",
                  cursor:
                    "pointer",
                  fontSize: 18,
                  color:
                    "#475467"
                }}
                aria-label="Close"
              >
                ×
              </button>

            </div>


            {/* MODAL BODY */}

            <div
              style={{
                padding: 20
              }}
            >

              {/* SUMMARY */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(4, minmax(0, 1fr))",
                  gap: 12,
                  marginBottom: 20
                }}
              >

                <div
                  style={{
                    padding: 14,
                    border:
                      "1px solid #e8ebef",
                    borderRadius: 12
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color:
                        "#667085",
                      marginBottom: 5
                    }}
                  >
                    Payment
                  </div>

                  <StatusBadge
                    type="payment"
                    value={
                      selected.paymentStatus
                    }
                  />
                </div>


                <div
                  style={{
                    padding: 14,
                    border:
                      "1px solid #e8ebef",
                    borderRadius: 12
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color:
                        "#667085",
                      marginBottom: 5
                    }}
                  >
                    Order
                  </div>

                  <StatusBadge
                    type="order"
                    value={
                      selected.orderStatus
                    }
                  />
                </div>


                <div
                  style={{
                    padding: 14,
                    border:
                      "1px solid #e8ebef",
                    borderRadius: 12
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color:
                        "#667085",
                      marginBottom: 5
                    }}
                  >
                    Shipping
                  </div>

                  <StatusBadge
                    type="shipping"
                    value={
                      selected.shippingStatus
                    }
                  />
                </div>


                <div
                  style={{
                    padding: 14,
                    border:
                      "1px solid #e8ebef",
                    borderRadius: 12
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color:
                        "#667085",
                      marginBottom: 5
                    }}
                  >
                    Amount
                  </div>

                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800
                    }}
                  >
                    ₹
                    {valueOrDash(
                      selected.amount
                    )}
                  </div>
                </div>

              </div>


              {/* CUSTOMER + PRODUCT */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 1fr",
                  gap: 20,
                  marginBottom: 20
                }}
              >

                <div
                  style={{
                    border:
                      "1px solid #e8ebef",
                    borderRadius: 14,
                    padding:
                      "4px 16px 12px"
                  }}
                >

                  <h3
                    style={{
                      margin:
                        "12px 0 4px",
                      fontSize: 15
                    }}
                  >
                    Customer
                  </h3>

                  <DetailField label="Name">
                    {
                      selected
                        .customer
                        ?.name
                    }
                  </DetailField>

                  <DetailField label="Email">
                    {
                      selected
                        .customer
                        ?.email
                    }
                  </DetailField>

                  <DetailField label="Phone">
                    {
                      selected
                        .customer
                        ?.phone
                    }
                  </DetailField>

                </div>


                <div
                  style={{
                    border:
                      "1px solid #e8ebef",
                    borderRadius: 14,
                    padding:
                      "4px 16px 12px"
                  }}
                >

                  <h3
                    style={{
                      margin:
                        "12px 0 4px",
                      fontSize: 15
                    }}
                  >
                    Product
                  </h3>

                  <DetailField label="Book">
                    {
                      selected
                        .product
                        ?.name
                    }
                  </DetailField>

                  <DetailField label="Quantity">
                    {
                      selected
                        .product
                        ?.quantity ||
                      1
                    }
                  </DetailField>

                  <DetailField label="SKU">
                    {
                      selected
                        .product
                        ?.sku
                    }
                  </DetailField>

                  <DetailField label="Unit price">
                    ₹
                    {
                      selected
                        .product
                        ?.unitPrice
                    }
                  </DetailField>

                </div>

              </div>


              {/* ADDRESSES */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 1fr",
                  gap: 16,
                  marginBottom: 20
                }}
              >

                <AddressBox
                  title="Delivery Address"
                  address={
                    selected.shippingAddress
                  }
                />

                <AddressBox
                  title="Billing Address"
                  address={
                    selected.billingAddress
                  }
                />

              </div>


              {/* PAYMENT */}

              <div
                style={{
                  border:
                    "1px solid #e8ebef",
                  borderRadius: 14,
                  padding:
                    "4px 16px 12px",
                  marginBottom: 20
                }}
              >

                <h3
                  style={{
                    margin:
                      "12px 0 4px",
                    fontSize: 15
                  }}
                >
                  Payment Details
                </h3>

                <DetailField label="Razorpay Order ID">
                  {
                    selected.razorpayOrderId
                  }
                </DetailField>

                <DetailField label="Razorpay Payment ID">
                  {
                    selected.razorpayPaymentId
                  }
                </DetailField>

                <DetailField label="Payment Status">
                  <StatusBadge
                    type="payment"
                    value={
                      selected.paymentStatus
                    }
                  />
                </DetailField>

                <DetailField label="Currency">
                  {
                    selected.currency ||
                    "INR"
                  }
                </DetailField>

              </div>


              {/* SHIPROCKET */}

              <div
                style={{
                  border:
                    "1px solid #e8ebef",
                  borderRadius: 14,
                  padding:
                    "4px 16px 12px",
                  marginBottom: 20
                }}
              >

              


                

              </div>


              {/* SYSTEM DETAILS */}

              <div
                style={{
                  border:
                    "1px solid #e8ebef",
                  borderRadius: 14,
                  padding:
                    "4px 16px 12px"
                }}
              >

                <h3
                  style={{
                    margin:
                      "12px 0 4px",
                    fontSize: 15
                  }}
                >
                  Order Information
                </h3>

                <DetailField label="Booking ID">
                  {
                    selected.bookingId
                  }
                </DetailField>

                <DetailField label="Order ID">
                  {
                    selected.id
                  }
                </DetailField>

                <DetailField label="Source">
                  {
                    selected.source
                  }
                </DetailField>

                <DetailField label="Email Sent">
                  {selected.emailSent ===
                  true
                    ? "Yes"
                    : "No"}
                </DetailField>

                <DetailField label="Created">
                  {formatDate(
                    selected.createdAt
                  )}
                </DetailField>

                <DetailField label="Updated">
                  {formatDate(
                    selected.updatedAt
                  )}
                </DetailField>

                <DetailField label="Shipping Error">
                  {
                    selected.shippingError
                  }
                </DetailField>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}


/* =========================================================
   GLOBAL ADMIN EXPORT
========================================================= */

window.AdminPrebookOrders =
  PrebookOrders;

export default PrebookOrders;