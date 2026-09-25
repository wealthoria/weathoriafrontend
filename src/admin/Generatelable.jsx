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


function formatRowRanges(numbers) {
  if (!Array.isArray(numbers) || !numbers.length) return "—";
  const sorted = [...new Set(numbers)].sort((a, b) => a - b);
  const ranges = [];
  let start = sorted[0];
  let end = sorted[0];
  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i];
    if (current === end + 1) { end = current; continue; }
    ranges.push(start === end ? `${start}` : `${start}-${end}`);
    start = current;
    end = current;
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`);
  return ranges.join(", ");
}


/* =========================================================
   MAIN PAGE
========================================================= */

function Generatelables() {
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
  const [currentPage, setCurrentPage] = useState(1);
  const [labelGenerating, setLabelGenerating] = useState(false);
  const [labelNotice, setLabelNotice] = useState("");
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [selectedLabelOrders, setSelectedLabelOrders] = useState([]);
const [returnLabelQuantity, setReturnLabelQuantity] = useState("");

  const ORDERS_PER_PAGE = 50;


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



  const exportOrdersToExcel = async () => {
  try {
    if (!filteredOrders.length) {
      alert("No orders available to export.");
      return;
    }

    // Load Excel library
    if (!window.XLSX) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");

        script.src =
          "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";

        script.onload = resolve;
        script.onerror = reject;

        document.head.appendChild(script);
      });
    }

    const excelData = filteredOrders.map((order) => ({
      Name: order.customer?.name || "",
      "Email ID": order.customer?.email || "",
      "Phone Number": order.customer?.phone || "",
      "Book ID": order.bookingId || ""
    }));

    const worksheet =
      window.XLSX.utils.json_to_sheet(excelData);

    worksheet["!cols"] = [
      { wch: 28 },
      { wch: 35 },
      { wch: 20 },
      { wch: 22 }
    ];

    const workbook =
      window.XLSX.utils.book_new();

    window.XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Pre-book Orders"
    );

    window.XLSX.writeFile(
      workbook,
      "Wealthoria_Prebook_Orders.xlsx"
    );

  } catch (error) {
    console.error("Excel export error:", error);
    alert("Unable to export Excel.");
  }
};

/* =======================================================
   DUPLICATE DETECTION
   Duplicate if EMAIL or PHONE appears more than once
======================================================= */

const duplicateInfo = useMemo(() => {
  const emailMap = new Map();
  const phoneMap = new Map();

  orders.forEach((order) => {
    const customer = order.customer || {};

    const email = String(customer.email || "")
      .trim()
      .toLowerCase();

    const phone = String(customer.phone || "")
      .replace(/\D/g, "");

    if (email) {
      if (!emailMap.has(email)) {
        emailMap.set(email, []);
      }
      emailMap.get(email).push(order.id);
    }

    if (phone) {
      if (!phoneMap.has(phone)) {
        phoneMap.set(phone, []);
      }
      phoneMap.get(phone).push(order.id);
    }
  });

  const duplicateOrderIds = new Set();
  const duplicateDetails = new Map();

  emailMap.forEach((ids, email) => {
    if (ids.length > 1) {
      ids.forEach((id) => {
        duplicateOrderIds.add(id);

        const existing = duplicateDetails.get(id) || {
          emails: [],
          phones: []
        };

        if (!existing.emails.includes(email)) {
          existing.emails.push(email);
        }

        duplicateDetails.set(id, existing);
      });
    }
  });

  phoneMap.forEach((ids, phone) => {
    if (ids.length > 1) {
      ids.forEach((id) => {
        duplicateOrderIds.add(id);

        const existing = duplicateDetails.get(id) || {
          emails: [],
          phones: []
        };

        if (!existing.phones.includes(phone)) {
          existing.phones.push(phone);
        }

        duplicateDetails.set(id, existing);
      });
    }
  });

  return {
    duplicateOrderIds,
    duplicateDetails
  };
}, [orders]);

  /* =======================================================
     FILTER
  ======================================================= */
const filteredOrders = useMemo(() => {
  const query = search.trim().toLowerCase();

  return orders.filter((order) => {

    if (
      showDuplicates &&
      !duplicateInfo.duplicateOrderIds.has(order.id)
    ) {
      return false;
    }
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
  },  [
  orders,
  search,
  paymentFilter,
  shippingFilter,
  showDuplicates,
  duplicateInfo
]);



  /* =======================================================
     PAGINATION — 50 RECORDS PER PAGE
  ======================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / ORDERS_PER_PAGE)
  );
useEffect(() => {
  setCurrentPage(1);
}, [
  search,
  paymentFilter,
  shippingFilter,
  showDuplicates
]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ORDERS_PER_PAGE;
    return filteredOrders.slice(
      start,
      start + ORDERS_PER_PAGE
    );
  }, [filteredOrders, currentPage]);

  const pageStart = filteredOrders.length
    ? (currentPage - 1) * ORDERS_PER_PAGE + 1
    : 0;

  const pageEnd = Math.min(
    currentPage * ORDERS_PER_PAGE,
    filteredOrders.length
  );

  const pageEligibleLabelCount = paginatedOrders.filter((order) => {
    const shippingStatus = String(order.shippingStatus || "")
      .trim()
      .toLowerCase();
    return shippingStatus !== "shipped" && shippingStatus !== "delivered";
  }).length;

  const pageGeneratedLabelCount = paginatedOrders.filter(
    (order) => order.labelGenerated === true
  ).length;

  const selectedCurrentPageOrders = paginatedOrders.filter((order) =>
    selectedLabelOrders.includes(order.id)
  );


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



  /* =======================================================
   EXPORT PRE-BOOK ORDERS TO EXCEL
   Columns:
   Name | Email | Phone Number | Book ID
======================================================= */


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

  const deleteOrder = async (order) => {
  if (!order?.id) return;

  const confirmed = window.confirm(
    `Are you sure you want to permanently delete order ${
      order.bookingId || order.id
    }?\n\nThis cannot be undone.`
  );

  if (!confirmed) return;

  try {
    const ref = window.db.collection("bookOrders").doc(order.id);

    await ref.delete();

    setSelected((prev) =>
      prev?.id === order.id ? null : prev
    );

    alert("Order deleted successfully.");
  } catch (error) {
    console.error("Delete order error:", error);
    alert(
      error?.message ||
        "Unable to delete the order. Please try again."
    );
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
   3 COLUMNS × 6 ROWS = 18 LABELS PER A4 PAGE
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



const generateReturnAddressLabelsPDF = async () => {
  if (labelGenerating) return;

  const quantity = Number(returnLabelQuantity);

  if (!Number.isInteger(quantity) || quantity <= 0) {
    alert("Please enter a valid number of labels.");
    return;
  }

  try {
    setLabelGenerating(true);

    const confirmed = window.confirm(
      `Generate ${quantity} return address label${quantity === 1 ? "" : "s"}?\n\n` +
      `Each label will contain:\n` +
      `WEALTHORIA EDUCATION PRIVATE LIMITED\n` +
      `No.2687/1, D-1, 2nd Floor\n` +
      `5th Cross, Kalidasa Road\n` +
      `V V Mohalla, Mysore - 570002\n` +
      `Phone: 9019759001`
    );

    if (!confirmed) return;

    const jsPDF = await loadJsPDF();

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageWidth = 210;
    const pageHeight = 297;

    const columns = 3;
    const rows = 6;
    const labelsPerPage = columns * rows;

    const marginX = 2;
    const marginY = 2;
    const gapX = 2;

    const labelWidth =
      (pageWidth - marginX * 2 - gapX * (columns - 1)) / columns;

    const labelHeight = 43;

    const availableHeight = pageHeight - marginY * 2;

    const gapY =
      (availableHeight - labelHeight * rows) / (rows - 1);

    for (let index = 0; index < quantity; index += 1) {
      const position = index % labelsPerPage;

      if (index > 0 && position === 0) {
        pdf.addPage();
      }

      const column = position % columns;
      const row = Math.floor(position / columns);

      const x =
        marginX + column * (labelWidth + gapX);

      const y =
        marginY + row * (labelHeight + gapY);

      const paddingX = 2;
      const left = x + paddingX;
      const right = x + labelWidth - paddingX;
      const contentWidth = labelWidth - paddingX * 2;

      /* Dashed border - same label size/layout */
      pdf.setDrawColor(140, 140, 140);
      pdf.setLineWidth(0.25);
      pdf.setLineDashPattern([1.2, 1.2], 0);
      pdf.rect(x, y, labelWidth, labelHeight);
      pdf.setLineDashPattern([], 0);

      /* Same title */
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6);
      pdf.text(
        "WEALTHORIA EDUCATION PRIVATE LIMITED",
        left,
        y + 4.2,
        { maxWidth: contentWidth }
      );

      /* Divider */
      pdf.setDrawColor(100, 100, 100);
      pdf.setLineWidth(0.15);
      pdf.line(left, y + 5.8, right, y + 5.8);

      /* Undelivered message */
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(5.2);
      pdf.text(
        "IF UNDELIVERED, PLEASE RETURN TO:",
        left,
        y + 9.5,
        { maxWidth: contentWidth }
      );

      /* Return address */
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.2);

      const returnAddressLines = [
        "Wealthoria Education Private Limited",
        "No.2687/1, D-1, 2nd Floor",
        "5th Cross, Kalidasa Road",
        "V V Mohalla, Mysore - 570002",
        "Phone: 9019759001"
      ];

      pdf.text(returnAddressLines, left, y + 13.5, {
        maxWidth: contentWidth
      });
    }

    const today = new Date()
      .toISOString()
      .slice(0, 10);

    pdf.save(`wealthoria-return-address-labels-${quantity}-${today}.pdf`);

    setLabelNotice(
      `${quantity} return address label${quantity === 1 ? "" : "s"} generated successfully.`
    );

    alert(
      `${quantity} return address label${quantity === 1 ? "" : "s"} generated successfully.`
    );

  } catch (error) {
    console.error(
      "Return address label PDF error:",
      error
    );

    alert(
      error?.message ||
        "Unable to generate the return address labels. Please try again."
    );
  } finally {
    setLabelGenerating(false);
  }
};

const generateShippingLabelsPDF = async (ordersToPrint = null, options = {}) => {
  const { reprint = false } = options;

  if (labelGenerating) return;

  try {
    setLabelGenerating(true);

    /* =====================================================
       SELECT ORDERS
       - Generate Page Labels always generates the current page again.
       - Reprint intentionally generates one existing label again.
       - Shipped/delivered orders are always excluded.
       ===================================================== */

    const sourceOrders = Array.isArray(ordersToPrint)
      ? ordersToPrint
      : paginatedOrders;

    const indexedSourceOrders = sourceOrders.map((order, index) => ({
      order,
      pageRow: index + 1
    }));

    const eligibleRows = indexedSourceOrders.filter(({ order }) => {
      const shippingStatus = String(order.shippingStatus || "")
        .trim()
        .toLowerCase();

      return shippingStatus !== "shipped" && shippingStatus !== "delivered";
    });

    const labelOrders = eligibleRows.map(({ order }) => order);

    if (!labelOrders.length) {
      alert(
        reprint
          ? "No eligible order is available for reprint."
          : "No eligible orders are available on this page. Shipped and delivered orders are excluded."
      );
      return;
    }

    const totalLabelPages = Math.ceil(labelOrders.length / 18);
    const pageRowNumbers = eligibleRows.map(({ pageRow }) => pageRow);
    const rowRangeText = formatRowRanges(pageRowNumbers);

    if (!reprint) {
      const confirmed = window.confirm(
        `Generate ${labelOrders.length} shipping label${labelOrders.length === 1 ? "" : "s"} for the current page?\n\n` +
        `Page rows: ${rowRangeText}\n` +
        `${totalLabelPages} A4 page${totalLabelPages === 1 ? "" : "s"} will be created (18 labels per A4 page).\n\n` +
        `You can generate this page again later.`
      );
      if (!confirmed) return;
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
       GRID — 3 COLUMNS × 6 ROWS = 18 LABELS/A4
       ===================================================== */

    const columns = 3;
    const rows = 6;
    const labelsPerPage = columns * rows;

    const marginX = 2;
    const marginY = 2;
    const gapX = 2;

    const labelWidth =
      (pageWidth - marginX * 2 - gapX * (columns - 1)) / columns;

    const labelHeight = 43;

    const availableHeight = pageHeight - marginY * 2;

    const gapY =
      (availableHeight - labelHeight * rows) / (rows - 1);

    /* =====================================================
       DRAW LABELS
       ===================================================== */

    labelOrders.forEach((order, index) => {
      const position = index % labelsPerPage;

      if (index > 0 && position === 0) {
        pdf.addPage();
      }

      const column = position % columns;
      const row = Math.floor(position / columns);

      const x =
        marginX + column * (labelWidth + gapX);

      const y =
        marginY + row * (labelHeight + gapY);

      const customer = order.customer || {};
      const address = order.shippingAddress || {};

      const name =
        customer.name || address.name || "—";

      const phone =
        customer.phone || address.phone || "—";

      const completeAddress = [
        address.address,
        address.landmark,
        address.city
      ]
        .filter(Boolean)
        .join(", ");

      const state = address.state || "—";
      const pincode = address.pincode || "—";

      const paddingX = 2;
      const left = x + paddingX;
      const right = x + labelWidth - paddingX;
      const contentWidth = labelWidth - paddingX * 2;

      /* Dashed border */
      pdf.setDrawColor(140, 140, 140);
      pdf.setLineWidth(0.25);
      pdf.setLineDashPattern([1.2, 1.2], 0);
      pdf.rect(x, y, labelWidth, labelHeight);
      pdf.setLineDashPattern([], 0);

      /* Company */
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6);
      pdf.text(
        "WEALTHORIA EDUCATION PRIVATE LIMITED",
        left,
        y + 4.2,
        { maxWidth: contentWidth }
      );

      /* Divider */
      pdf.setDrawColor(100, 100, 100);
      pdf.setLineWidth(0.15);
      pdf.line(left, y + 5.8, right, y + 5.8);

      /* Deliver to */
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(5.5);
      pdf.text("DELIVER TO", left, y + 8.5);

      /* Customer name */
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      const nameLines = pdf.splitTextToSize(
        String(name),
        contentWidth
      );
      const safeNameLines = nameLines.slice(0, 2);
      pdf.text(safeNameLines, left, y + 12.5);

      /* Phone */
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.5);
      pdf.text(`Ph: ${phone}`, left, y + 18.5);

      /* Address */
      const addressLines = pdf.splitTextToSize(
        completeAddress || "Address not available",
        contentWidth
      );
      const safeAddressLines = addressLines.slice(0, 3);
      pdf.text(safeAddressLines, left, y + 22.5);

      /* State */
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6.5);
      pdf.text(`State: ${state}`, left, y + 32.5, {
        maxWidth: contentWidth
      });

      /* PIN */
      const pinY = y + 34;
      const pinHeight = 6;

      pdf.setFillColor(235, 235, 235);
      pdf.rect(
        left,
        pinY,
        contentWidth,
        pinHeight,
        "F"
      );

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.text(
        `PIN: ${pincode}`,
        left + 2,
        pinY + 4
      );
    });

    /* =====================================================
       SAVE PDF
       ===================================================== */

    const today = new Date()
      .toISOString()
      .slice(0, 10);

    const filePrefix = reprint
      ? "wealthoria-shipping-labels-reprint"
      : "wealthoria-shipping-labels";

    pdf.save(`${filePrefix}-${today}.pdf`);

    /* =====================================================
       RECORD LABEL GENERATION
       Every generation is recorded so the row always shows that a
       label exists and when it was last generated.
       ===================================================== */

    if (window.db?.batch) {
      const labelBatchId =
        `LBL-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const generatedAt = new Date().toISOString();

      for (let i = 0; i < labelOrders.length; i += 400) {
        const chunk = labelOrders.slice(i, i + 400);
        const batch = window.db.batch();

        chunk.forEach((order) => {
          const ref = window.db.collection("bookOrders").doc(order.id);
          batch.update(ref, {
            labelGenerated: true,
            labelGeneratedAt: generatedAt,
            labelBatchId,
            labelGenerationCount: Number(order.labelGenerationCount || 0) + 1
          });
        });

        await batch.commit();
      }

      setLabelNotice(
        reprint
          ? `Reprinted page row ${pageRowNumbers[0]}.`
          : `Page ${currentPage}: generated rows ${rowRangeText}. You can generate this page again anytime.`
      );

      alert(
        `${labelOrders.length} shipping label${labelOrders.length === 1 ? "" : "s"} generated successfully.\n\n` +
        `${reprint ? "Row" : "Page rows"}: ${rowRangeText}\n` +
        `Batch: ${labelBatchId}`
      );
    } else {
      alert("PDF generated, but Firestore is not available to record the label status.");
    }
  } catch (error) {
    console.error(
      "Shipping label PDF error:",
      error
    );

    alert(
      error?.message ||
        "Unable to generate the PDF. Please try again."
    );
  } finally {
    setLabelGenerating(false);
  }
};

/* =======================================================
   RESET LABEL GENERATION COUNT FOR CURRENT PAGE
======================================================= */

const resetLabelCountsForCurrentPage = async () => {
  const resettableOrders = paginatedOrders.filter((order) => {
    return (
      order.labelGenerated === true ||
      Number(order.labelGenerationCount || 0) > 0 ||
      order.labelBatchId ||
      order.labelGeneratedAt
    );
  });

  if (!resettableOrders.length) {
    alert(`No generated label counts to reset on Page ${currentPage}.`);
    return;
  }

  const confirmed = window.confirm(
    `Reset label count for ${resettableOrders.length} order${resettableOrders.length === 1 ? "" : "s"} on Page ${currentPage}?\n\n` +
    `Their label count will become 0.\n` +
    `The next time you generate them, the count will start from 1.`
  );

  if (!confirmed) return;

  try {
    setLabelGenerating(true);

    for (let i = 0; i < resettableOrders.length; i += 400) {
      const chunk = resettableOrders.slice(i, i + 400);
      const batch = window.db.batch();

      chunk.forEach((order) => {
        const ref = window.db
          .collection("bookOrders")
          .doc(order.id);

        batch.update(ref, {
          labelGenerated: false,
          labelGeneratedAt: null,
          labelBatchId: null,
          labelGenerationCount: 0
        });
      });

      await batch.commit();
    }

    setOrders((prev) =>
      prev.map((order) => {
        if (!resettableOrders.some((item) => item.id === order.id)) {
          return order;
        }

        return {
          ...order,
          labelGenerated: false,
          labelGeneratedAt: null,
          labelBatchId: null,
          labelGenerationCount: 0
        };
      })
    );

    setSelected((prev) => {
      if (!prev || !resettableOrders.some((item) => item.id === prev.id)) {
        return prev;
      }

      return {
        ...prev,
        labelGenerated: false,
        labelGeneratedAt: null,
        labelBatchId: null,
        labelGenerationCount: 0
      };
    });

    setLabelNotice(
      `Page ${currentPage}: label counts reset to 0. The next generation will start from 1.`
    );

    alert(
      `Label counts reset successfully for ${resettableOrders.length} order${resettableOrders.length === 1 ? "" : "s"}.\n\n` +
      `Next generation will start from count 1.`
    );
  } catch (error) {
    console.error("Reset label count error:", error);
    alert(
      error?.message ||
      "Unable to reset label counts. Please try again."
    );
  } finally {
    setLabelGenerating(false);
  }
};

/* =======================================================
   REPRINT ONE EXISTING LABEL
======================================================= */

const reprintShippingLabel = async (order) => {
  if (!order?.id) return;

  const confirmed = window.confirm(
    `Reprint the shipping label for ${
      order.bookingId || order.id
    }?\n\nThis will intentionally create a duplicate label.`
  );

  if (!confirmed) return;

  await generateShippingLabelsPDF([order], { reprint: true });
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
          alignItems: "center",
          gap: 20,
          marginBottom: 18,
          flexWrap: "wrap"
        }}
      >
        <div>
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
          <div
            style={{
              marginTop: 6,
              fontSize: 13,
              color: "#667085"
            }}
          >
            Showing {pageStart}-{pageEnd} of {filteredOrders.length} records · Page {currentPage} of {totalPages}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            justifyContent: "flex-end"
          }}
        >
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 750,
                color: "#344054"
              }}
            >
              {selectedCurrentPageOrders.length} labels selected
            </div>
            <div
              style={{
                marginTop: 3,
                fontSize: 11,
                color: "#667085"
              }}
            >
              {pageGeneratedLabelCount} already generated · 18 per A4
            </div>
          </div>



<button
  type="button"
  onClick={exportOrdersToExcel}
  disabled={filteredOrders.length === 0}
  style={{
    height: 42,
    padding: "0 15px",
    border: "1px solid #dfe3e8",
    borderRadius: 10,
    background:
      filteredOrders.length === 0
        ? "#f2f4f7"
        : "#fff",
    color:
      filteredOrders.length === 0
        ? "#98a2b3"
        : "#344054",
    fontSize: 13,
    fontWeight: 750,
    cursor:
      filteredOrders.length === 0
        ? "not-allowed"
        : "pointer",
    whiteSpace: "nowrap"
  }}
>
  Export Excel
</button>

<button
  type="button"
  onClick={() => setShowDuplicates((value) => !value)}
  style={{
    height: 42,
    padding: "0 15px",
    border: showDuplicates
      ? "1px solid #e6c84f"
      : "1px solid #dfe3e8",
    borderRadius: 10,
    background: showDuplicates
      ? "#fff8d8"
      : "#fff",
    color: showDuplicates
      ? "#7a5f00"
      : "#344054",
    fontSize: 13,
    fontWeight: 750,
    cursor: "pointer",
    whiteSpace: "nowrap"
  }}
>
  {showDuplicates
    ? "Show All Orders"
    : `Duplicates (${duplicateInfo.duplicateOrderIds.size})`}
</button>
          <button
            type="button"
            onClick={resetLabelCountsForCurrentPage}
            disabled={
              labelGenerating ||
              pageGeneratedLabelCount === 0
            }
            style={{
              height: 42,
              padding: "0 15px",
              border: "1px solid #dfe3e8",
              borderRadius: 10,
              background:
                labelGenerating || pageGeneratedLabelCount === 0
                  ? "#f2f4f7"
                  : "#fff",
              color:
                labelGenerating || pageGeneratedLabelCount === 0
                  ? "#98a2b3"
                  : "#344054",
              fontSize: 13,
              fontWeight: 750,
              cursor:
                labelGenerating || pageGeneratedLabelCount === 0
                  ? "not-allowed"
                  : "pointer",
              whiteSpace: "nowrap"
            }}
          >
            Reset Count
          </button>



<button
  type="button"
  onClick={exportOrdersToExcel}
  disabled={!filteredOrders.length}
  style={{
    height: 42,
    padding: "0 15px",
    border: "1px solid #dfe3e8",
    borderRadius: 10,
    background: "#fff",
    color: "#344054",
    fontSize: 13,
    fontWeight: 750,
    cursor: filteredOrders.length
      ? "pointer"
      : "not-allowed",
    whiteSpace: "nowrap"
  }}
>
  Export Excel
</button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <input
              type="number"
              min="1"
              step="1"
              value={returnLabelQuantity}
              onChange={(e) => setReturnLabelQuantity(e.target.value)}
              placeholder="Labels"
              aria-label="Number of return address labels"
              style={{
                width: 90,
                height: 42,
                padding: "0 10px",
                border: "1px solid #d0d5dd",
                borderRadius: 10,
                outline: "none",
                fontSize: 13,
                fontWeight: 650,
                color: "#344054",
                boxSizing: "border-box"
              }}
            />

            <button
              type="button"
              onClick={generateReturnAddressLabelsPDF}
              disabled={
                labelGenerating ||
                !returnLabelQuantity ||
                Number(returnLabelQuantity) <= 0
              }
              style={{
                height: 42,
                padding: "0 16px",
                border: "none",
                borderRadius: 10,
                background:
                  labelGenerating ||
                  !returnLabelQuantity ||
                  Number(returnLabelQuantity) <= 0
                    ? "#d0d5dd"
                    : "rgb(232 95 78)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 750,
                cursor:
                  labelGenerating ||
                  !returnLabelQuantity ||
                  Number(returnLabelQuantity) <= 0
                    ? "not-allowed"
                    : "pointer",
                whiteSpace: "nowrap"
              }}
            >
              {labelGenerating
                ? "Generating..."
                : "Generate Return Labels"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!selectedCurrentPageOrders.length) {
                alert("Please select at least one order.");
                return;
              }

              generateShippingLabelsPDF(selectedCurrentPageOrders);
            }}
            disabled={labelGenerating || selectedCurrentPageOrders.length === 0}
            style={{
              height: 42,
              padding: "0 16px",
              border: "none",
              borderRadius: 10,
              background:
                labelGenerating || selectedCurrentPageOrders.length === 0
                  ? "#d0d5dd"
                  : "rgb(232 95 78)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 750,
              cursor:
                labelGenerating || selectedCurrentPageOrders.length === 0
                  ? "not-allowed"
                  : "pointer",
              whiteSpace: "nowrap"
            }}
          >
            {labelGenerating
              ? "Generating..."
              : `Generate Selected Labels (${selectedCurrentPageOrders.length})`}
          </button>
        </div>
      </div>

      {labelNotice && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            borderRadius: 9,
            background: "#f8fafc",
            border: "1px solid #e4e7ec",
            color: "#475467",
            fontSize: 12,
            fontWeight: 650
          }}
        >
          {labelNotice}
        </div>
      )}

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
            Rows {pageStart}-{pageEnd}
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
                  "Select",
                  "Row",
                  "Booking ID",
                  "Name",
                  "Email",
                  "Phone",
                  "Qty",
                  "Amount",
                  "Delivery Status",
                  "Label",
                  "View",
                  "Send Email",
                  "Delete"
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
                    colSpan={12}
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
                    colSpan={12}
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
                paginatedOrders.map(
                  (order, pageIndex) => {
                    const customer =
  order.customer ||
  {};

const product =
  order.product ||
  {};

const pageRow = pageIndex + 1;

const isDuplicate =
  duplicateInfo.duplicateOrderIds.has(order.id);

return (
  <tr
    key={order.id}
    style={{
      borderBottom:
        "1px solid #edf0f3",

      background: isDuplicate
        ? "#fff8d8"
        : "transparent"
    }}
  >

                        {/* SELECT FOR SHIPPING LABEL */}
                        <td
                          style={{
                            padding: "14px",
                            textAlign: "center"
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedLabelOrders.includes(order.id)}
                            disabled={
                              labelGenerating ||
                              String(order.shippingStatus || "").trim().toLowerCase() === "shipped" ||
                              String(order.shippingStatus || "").trim().toLowerCase() === "delivered"
                            }
                            onChange={(e) => {
                              setSelectedLabelOrders((prev) =>
                                e.target.checked
                                  ? [...prev, order.id]
                                  : prev.filter((id) => id !== order.id)
                              );
                            }}
                            style={{
                              width: 17,
                              height: 17,
                              cursor: "pointer"
                            }}
                          />
                        </td>

                        {/* PAGE ROW */}
                        <td
                          style={{
                            padding: "14px",
                            fontSize: 12,
                            fontWeight: 800,
                            color: "#475467",
                            textAlign: "center",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {pageRow}
                        </td>

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

                        {/* LABEL */}
                        <td style={{ padding: "12px 14px", minWidth: 150 }}>
                          {order.labelGenerated === true ? (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                gap: 5
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 7,
                                  fontSize: 12,
                                  fontWeight: 750,
                                  color: "#344054"
                                }}
                              >
                                <span
                                  style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: "50%",
                                    background: "#12b76a",
                                    flexShrink: 0
                                  }}
                                />
                                Generated
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "#667085"
                                }}
                              >
                                Printed {Math.max(1, Number(order.labelGenerationCount || 1))} time{Math.max(1, Number(order.labelGenerationCount || 1)) === 1 ? "" : "s"}
                              </div>
                              <button
                                type="button"
                                onClick={() => reprintShippingLabel(order)}
                                disabled={labelGenerating}
                                style={{
                                  height: 30,
                                  padding: "0 10px",
                                  border: "1px solid #dfe3e8",
                                  borderRadius: 7,
                                  background: "#fff",
                                  color: "#344054",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: labelGenerating ? "not-allowed" : "pointer",
                                  opacity: labelGenerating ? 0.65 : 1
                                }}
                              >
                                Reprint
                              </button>
                            </div>
                          ) : (
                            <span
                              style={{
                                fontSize: 11,
                                color: "#98a2b3"
                              }}
                            >
                              Not generated
                            </span>
                          )}
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


                        <td style={{ padding: "12px 14px" }}>
  <button
    type="button"
    onClick={() => deleteOrder(order)}
    style={{
      height: 34,
      padding: "0 11px",
      border: "1px solid #f1c7c3",
      borderRadius: 7,
      background: "#fff",
      color: "#b42318",
      fontSize: 11,
      fontWeight: 750,
      cursor: "pointer",
      whiteSpace: "nowrap"
    }}
  >
    Delete
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

        {/* PAGINATION */}
        {filteredOrders.length > ORDERS_PER_PAGE && (
          <div
            style={{
              padding: "13px 16px",
              borderTop: "1px solid #e8ebef",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap"
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "#667085"
              }}
            >
              Showing {pageStart}-{pageEnd} of {filteredOrders.length} records · 50 per page
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                style={{
                  height: 36,
                  padding: "0 12px",
                  border: "1px solid #dfe3e8",
                  borderRadius: 8,
                  background: currentPage === 1 ? "#f2f4f7" : "#fff",
                  color: currentPage === 1 ? "#98a2b3" : "#344054",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: currentPage === 1 ? "not-allowed" : "pointer"
                }}
              >
                Previous
              </button>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                style={{
                  height: 36,
                  padding: "0 12px",
                  border: "1px solid #dfe3e8",
                  borderRadius: 8,
                  background: currentPage === totalPages ? "#f2f4f7" : "#fff",
                  color: currentPage === totalPages ? "#98a2b3" : "#344054",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer"
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
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

                <DetailField label="Shipping Label">
                  {selected.labelGenerated === true
                    ? "Generated"
                    : "Not generated"}
                </DetailField>

                <DetailField label="Label Batch ID">
                  {selected.labelBatchId}
                </DetailField>

                <DetailField label="Label Generated At">
                  {formatDate(selected.labelGeneratedAt)}
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

window.AdminGeneratelables =
  Generatelables;

export default Generatelables;