/* global React, window */

import React, { useEffect, useMemo, useState } from "react";
import { auth } from "../firebase";
const { MIcon } = window;

const API_BASE_URL =
  typeof window !== "undefined" && window.WEALTHORIA_API_BASE !== undefined
    ? window.WEALTHORIA_API_BASE
    : typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        !window.location.hostname.endsWith("wealthoria.in"))
      ? ""
      : "https://asia-south1-wealthoria-6fc11.cloudfunctions.net";

async function getAdminToken() {
  const currentUser = auth?.currentUser || window.auth?.currentUser;
  if (!currentUser) {
    throw new Error("Admin authentication required. Please login again.");
  }
  return currentUser.getIdToken(true);
}

/* =========================================================
   HELPERS
========================================================= */

function safeTimestamp(value) {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (value instanceof Date) return value.getTime();
  if (value?.toDate && typeof value.toDate === "function") {
    try {
      return value.toDate().getTime();
    } catch {
      // fallback
    }
  }
  if (value?.seconds !== undefined) return Number(value.seconds) * 1000;
  if (value?._seconds !== undefined) return Number(value._seconds) * 1000;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function getOrderTime(order) {
  if (!order) return 0;
  return (
    safeTimestamp(order.createdAt) ||
    safeTimestamp(order.updatedAt) ||
    safeTimestamp(order.orderDate) ||
    safeTimestamp(order.date) ||
    safeTimestamp(order.timestamp) ||
    0
  );
}

function toDateInputValue(date) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function getOrderFormattedDate(order) {
  const time = getOrderTime(order);
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
  if (value === undefined || value === null || value === "") return "—";
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
    return { label: "Paid", background: "#eefbf2", color: "#198754", border: "#ccefd7" };
  }
  if (value === "failed" || value === "cancelled" || value === "canceled") {
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
  if (value === "confirmed" || value === "completed" || value === "delivered") {
    return {
      label: value.charAt(0).toUpperCase() + value.slice(1),
      background: "#eefbf2",
      color: "#198754",
      border: "#ccefd7"
    };
  }
  if (value === "cancelled" || value === "canceled") {
    return { label: "Cancelled", background: "#fff3f2", color: "#b42318", border: "#f8d5d1" };
  }
  return {
    label: value ? value.charAt(0).toUpperCase() + value.slice(1) : "Pending",
    background: "#fff8e8",
    color: "#9a6700",
    border: "#f4dfaa"
  };
}

function getShippingMeta(status) {
  const value = String(status || "").toLowerCase();
  if (value === "delivered") {
    return { label: "Delivered", background: "#eefbf2", color: "#198754", border: "#ccefd7" };
  }
  if (value === "shipped" || value === "in_transit") {
    return {
      label: value === "in_transit" ? "In Transit" : "Shipped",
      background: "#eef7ff",
      color: "#246bce",
      border: "#cfe3ff"
    };
  }
  if (value === "cancelled" || value === "failed") {
    return {
      label: value.charAt(0).toUpperCase() + value.slice(1),
      background: "#fff3f2",
      color: "#b42318",
      border: "#f8d5d1"
    };
  }
  return {
    label: value ? value.charAt(0).toUpperCase() + value.slice(1) : "Pending",
    background: "#f5f7fa",
    color: "#667085",
    border: "#e1e6ec"
  };
}

/* Split text into 2 lines, each max 30 chars, breaking at word boundaries */
function splitAddress30(text, max = 30) {
  const words = String(text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines = ["", ""];
  let li = 0;
  let truncated = false;

  for (let word of words) {
    while (word.length > max) {
      if (lines[li]) { li += 1; }
      if (li > 1) { truncated = true; word = ""; break; }
      lines[li] = word.slice(0, max);
      word = word.slice(max);
      li += 1;
      if (li > 1 && word) { truncated = true; word = ""; break; }
    }
    if (!word) continue;
    if (li > 1) { truncated = true; continue; }

    const next = lines[li] ? `${lines[li]} ${word}` : word;
    if (next.length <= max) {
      lines[li] = next;
    } else {
      li += 1;
      if (li > 1) { truncated = true; continue; }
      lines[li] = word;
    }
  }
  return { line1: lines[0], line2: lines[1], truncated };
}

function cleanPhone10(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
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

/* Shared style for header buttons */
const headerBtn = (disabled) => ({
  height: 42,
  padding: "0 15px",
  border: "1px solid #dfe3e8",
  borderRadius: 10,
  background: disabled ? "#f2f4f7" : "#fff",
  color: disabled ? "#98a2b3" : "#344054",
  fontSize: 13,
  fontWeight: 750,
  cursor: disabled ? "not-allowed" : "pointer",
  whiteSpace: "nowrap"
});

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ type, value }) {
  let meta;
  if (type === "payment") meta = getPaymentMeta(value);
  else if (type === "shipping") meta = getShippingMeta(value);
  else meta = getOrderMeta(value);

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
    <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border, #e8ebef)" }}>
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
        <div style={{ fontSize: 13, lineHeight: 1.7, color: "#475467" }}>
          {lines.map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 13, color: "#98a2b3" }}>No address available</div>
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
  const [couponFilter, setCouponFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [datePreset, setDatePreset] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
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

  const ORDERS_PER_PAGE = 50;

  /* =======================================================
     FIRESTORE LISTENER
  ======================================================= */

  useEffect(() => {
    if (!window.db || typeof window.db.collection !== "function") {
      setError("Firestore database is not available.");
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = window.db.collection("bookOrders").onSnapshot(
      (snapshot) => {
        const rows = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

        // Strict descending order: newest orders first
        rows.sort((a, b) => {
          const timeDiff = getOrderTime(b) - getOrderTime(a);
          if (timeDiff !== 0) return timeDiff;
          const numA = parseInt(String(a.bookingId || "").replace(/\D/g, ""), 10) || 0;
          const numB = parseInt(String(b.bookingId || "").replace(/\D/g, ""), 10) || 0;
          if (numA !== numB) return numB - numA;
          return String(b.id || "").localeCompare(String(a.id || ""));
        });

        setOrders(rows);
        setError("");
        setLoading(false);
      },
      (err) => {
        console.error("Pre-book orders listener failed:", err);
        setError("Unable to load pre-book orders.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /* =======================================================
     DUPLICATE DETECTION
     Duplicate if EMAIL or PHONE appears more than once
  ======================================================= */

  const duplicateInfo = useMemo(() => {
    const emailMap = new Map();
    const phoneMap = new Map();

    orders.forEach((order) => {
      const customer = order.customer || {};
      const email = String(customer.email || "").trim().toLowerCase();
      const phone = String(customer.phone || "").replace(/\D/g, "");

      if (email) {
        if (!emailMap.has(email)) emailMap.set(email, []);
        emailMap.get(email).push(order.id);
      }

      if (phone) {
        if (!phoneMap.has(phone)) phoneMap.set(phone, []);
        phoneMap.get(phone).push(order.id);
      }
    });

    const duplicateOrderIds = new Set();
    const duplicateDetails = new Map();

    emailMap.forEach((ids, email) => {
      if (ids.length > 1) {
        ids.forEach((id) => {
          duplicateOrderIds.add(id);
          const existing = duplicateDetails.get(id) || { emails: [], phones: [] };
          if (!existing.emails.includes(email)) existing.emails.push(email);
          duplicateDetails.set(id, existing);
        });
      }
    });

    phoneMap.forEach((ids, phone) => {
      if (ids.length > 1) {
        ids.forEach((id) => {
          duplicateOrderIds.add(id);
          const existing = duplicateDetails.get(id) || { emails: [], phones: [] };
          if (!existing.phones.includes(phone)) existing.phones.push(phone);
          duplicateDetails.set(id, existing);
        });
      }
    });

    return { duplicateOrderIds, duplicateDetails };
  }, [orders]);

  /* =======================================================
     COUPON STATS
  ======================================================= */

  const couponStats = useMemo(() => {
    let withCoupon = 0;
    let withoutCoupon = 0;
    let withCouponAmount = 0;
    let withoutCouponAmount = 0;
    const codeData = {};

    orders.forEach((order) => {
      const code = String(order.couponCode || "").trim().toUpperCase();
      const amt = Number(order.amount) || 0;
      const disc = Number(order.discountAmount) || 0;

      if (code) {
        withCoupon += 1;
        withCouponAmount += amt;
        if (!codeData[code]) {
          codeData[code] = { count: 0, totalAmount: 0, totalDiscount: 0 };
        }
        codeData[code].count += 1;
        codeData[code].totalAmount += amt;
        codeData[code].totalDiscount += disc;
      } else {
        withoutCoupon += 1;
        withoutCouponAmount += amt;
      }
    });

    const uniqueCoupons = Object.entries(codeData)
      .map(([code, data]) => ({ code, ...data }))
      .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));

    return { withCoupon, withoutCoupon, withCouponAmount, withoutCouponAmount, uniqueCoupons };
  }, [orders]);

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = orders.filter((order) => {
      if (showDuplicates && !duplicateInfo.duplicateOrderIds.has(order.id)) {
        return false;
      }

      const paymentStatus = String(order.paymentStatus || "").toLowerCase();
      const shippingStatus = String(order.shippingStatus || "").toLowerCase();
      const orderCouponCode = String(order.couponCode || "").trim().toUpperCase();

      if (paymentFilter !== "all" && paymentStatus !== paymentFilter) return false;
      if (shippingFilter !== "all" && shippingStatus !== shippingFilter) return false;

      if (couponFilter === "with_coupon" && !orderCouponCode) return false;
      if (couponFilter === "without_coupon" && orderCouponCode) return false;
      if (couponFilter.startsWith("code:")) {
        const targetCode = couponFilter.slice(5).toUpperCase();
        if (orderCouponCode !== targetCode) return false;
      }

      // Date filtering using robust getOrderTime
      const orderMs = getOrderTime(order);
      if (startDate) {
        const startMs = new Date(`${startDate}T00:00:00`).getTime();
        if (!orderMs || orderMs < startMs) return false;
      }

      if (endDate) {
        const endMs = new Date(`${endDate}T23:59:59.999`).getTime();
        if (!orderMs || orderMs > endMs) return false;
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
        order.couponCode,
        order.couponId,
        order.couponCodeId,
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

    // Sort strictly by descending order (newest first) or ascending if selected
    result.sort((a, b) => {
      const timeDiff = getOrderTime(b) - getOrderTime(a);
      const numA = parseInt(String(a.bookingId || "").replace(/\D/g, ""), 10) || 0;
      const numB = parseInt(String(b.bookingId || "").replace(/\D/g, ""), 10) || 0;

      if (sortOrder === "asc") {
        if (timeDiff !== 0) return -timeDiff;
        if (numA !== numB) return numA - numB;
        return String(a.id || "").localeCompare(String(b.id || ""));
      } else {
        // Default descending: newest first
        if (timeDiff !== 0) return timeDiff;
        if (numA !== numB) return numB - numA;
        return String(b.id || "").localeCompare(String(a.id || ""));
      }
    });

    return result;
  }, [orders, search, paymentFilter, shippingFilter, couponFilter, startDate, endDate, showDuplicates, duplicateInfo, sortOrder]);

  /* =======================================================
     FILTERED METRICS (Total amount & discount for filtered orders / coupon)
  ======================================================= */

  const filteredMetrics = useMemo(() => {
    let totalAmount = 0;
    let totalDiscount = 0;

    filteredOrders.forEach((o) => {
      totalAmount += Number(o.amount) || 0;
      totalDiscount += Number(o.discountAmount) || 0;
    });

    const avgAmount = filteredOrders.length ? Math.round(totalAmount / filteredOrders.length) : 0;

    return {
      totalAmount,
      totalDiscount,
      avgAmount,
      orderCount: filteredOrders.length
    };
  }, [filteredOrders]);

  /* =======================================================
     DATE PRESET HANDLER
  ======================================================= */

  const handleDatePresetChange = (preset) => {
    setDatePreset(preset);
    const now = new Date();

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "today") {
      const todayStr = toDateInputValue(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "yesterday") {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = toDateInputValue(y);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === "7days") {
      const endStr = toDateInputValue(now);
      const start = new Date();
      start.setDate(start.getDate() - 6);
      setStartDate(toDateInputValue(start));
      setEndDate(endStr);
    } else if (preset === "30days") {
      const endStr = toDateInputValue(now);
      const start = new Date();
      start.setDate(start.getDate() - 29);
      setStartDate(toDateInputValue(start));
      setEndDate(endStr);
    } else if (preset === "this_month") {
      const startStr = toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));
      const endStr = toDateInputValue(now);
      setStartDate(startStr);
      setEndDate(endStr);
    }
  };

  /* =======================================================
     PAGINATION — 50 RECORDS PER PAGE
  ======================================================= */

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, paymentFilter, shippingFilter, couponFilter, startDate, endDate, showDuplicates, sortOrder]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ORDERS_PER_PAGE;
    return filteredOrders.slice(start, start + ORDERS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const pageStart = filteredOrders.length ? (currentPage - 1) * ORDERS_PER_PAGE + 1 : 0;
  const pageEnd = Math.min(currentPage * ORDERS_PER_PAGE, filteredOrders.length);

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
    let paidRevenue = 0;
    let pendingShipping = 0;
    let shipped = 0;
    let delivered = 0;

    orders.forEach((order) => {
      const paymentStatus = String(order.paymentStatus || "").toLowerCase();
      const shippingStatus = String(order.shippingStatus || "").toLowerCase();
      const amount = Number(order.amount) || 0;

      if (paymentStatus === "paid") {
        paid += 1;
        paidRevenue += amount;
      }
      if (shippingStatus === "pending" || !shippingStatus) pendingShipping += 1;
      if (shippingStatus === "shipped" || shippingStatus === "in_transit") shipped += 1;
      if (shippingStatus === "delivered") delivered += 1;
    });

    return { total: orders.length, paid, paidRevenue, pendingShipping, shipped, delivered };
  }, [orders]);

  /* =======================================================
     LOAD SheetJS (only when an export is clicked)
  ======================================================= */

  const loadXLSX = async () => {
    if (window.XLSX) return;

    await new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[data-wealthoria-xlsx="true"]');

      if (existingScript) {
        existingScript.addEventListener("load", resolve);
        existingScript.addEventListener("error", reject);
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

    if (!window.XLSX) {
      throw new Error("Excel export library is not available.");
    }
  };

  /* =======================================================
     EXPORT PRE-BOOK ORDERS TO EXCEL
     Columns: RECEIVER NAME | Phone Number | Book ID
     (no email)
  ======================================================= */

  const exportOrdersToExcel = async () => {
    try {
      if (!filteredOrders.length) {
        alert(
          showDuplicates
            ? "No duplicate orders available to export."
            : "No orders available to export."
        );
        return;
      }

      await loadXLSX();

      const excelRows = filteredOrders.map((order) => {
        const customer = order.customer || {};
        const address = (customer.address || "").slice(0, 60);

        return {
          "RECEIVER NAME": customer.name || "",

          "RECEIVER ADD LINE 1": address.slice(0, 30),
          "RECEIVER ADD LINE 2": address.slice(30, 60),
          "RECEIVER CITY": customer.city || "",
          "RECEIVER STATE": customer.state || "",
          "RECEIVER PINCODE": customer.pincode || "",
          "DROP OFF PINCODE": "5700002",
          "SENDER MOBILE NO": 9019759001,
          "RECEIVER MOBILE NO": customer.phone,
          "Phone Number": customer.phone || "",
          "Book ID": order.bookingId || "",
          "Order Date": getOrderFormattedDate(order),
          "Amount": order.amount ? `₹${order.amount}` : "",
          "Coupon Code": order.couponCode || "",
          "Discount Amount": order.discountAmount ? `₹${order.discountAmount}` : ""
        };
      });

      const worksheet = window.XLSX.utils.json_to_sheet(excelRows);
      worksheet["!cols"] = [{ wch: 28 }, { wch: 18 }, { wch: 22 }];

      const workbook = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(workbook, worksheet, "Pre-book Orders");

      const today = new Date().toISOString().slice(0, 10);
      const fileName = showDuplicates
        ? `wealthoria-duplicate-orders-${today}.xlsx`
        : `wealthoria-prebook-orders-${today}.xlsx`;

      window.XLSX.writeFile(workbook, fileName);
    } catch (err) {
      console.error("Excel export error:", err);
      alert(err?.message || "Unable to export Excel file.");
    }
  };

  /* =======================================================
     EXPORT CURRENT PAGE — COURIER FORMAT
     RECEIVER NAME | RECEIVER ADD LINE 1 | RECEIVER ADD LINE 2 |
     RECEIVER CITY | RECEIVER STATE | RECEIVER PINCODE |
     DROP OFF PINCODE | SENDER MOBILE NO | RECEIVER MOBILE NO
  ======================================================= */

  const exportPageCourierFormat = async () => {
    try {
      if (!orders.length) {
        alert("No orders to export.");
        return;
      }

      await loadXLSX();

      // Sort by Book ID in ascending order
      const sortedOrders = [...orders].sort((a, b) => {
        const idA = String(a.bookingId || "");
        const idB = String(b.bookingId || "");

        return idA.localeCompare(idB, undefined, {
          numeric: true,
          sensitivity: "base"
        });
      });

      const rows = sortedOrders.map((order) => {
        const customer = order.customer || {};
        const addr = order.shippingAddress || {};

        // New orders: the customer typed Address Line 1 and
        // Line 2 (max 30 characters each), so use them as typed.
        const typedLine1 = String(addr.address || "").trim();
        const typedLine2 = String(addr.landmark || "").trim();

        let addressLine1 = typedLine1;
        let addressLine2 = typedLine2;

        // Older orders: one long address -> join and split 30 + 30.
        if (typedLine1.length > 30 || typedLine2.length > 30) {
          const fullAddress = [typedLine1, typedLine2]
            .filter(Boolean)
            .join(", ");

          addressLine1 = fullAddress.slice(0, 30);
          addressLine2 = fullAddress.slice(30, 60);
        }

        return {
          "RECEIVER NAME": customer.name || addr.name || "",

          "RECEIVER ADD LINE 1": addressLine1,

          "RECEIVER ADD LINE 2": addressLine2,

          "RECEIVER CITY": addr.city || "",

          "RECEIVER STATE": addr.state || "",

          "RECEIVER PINCODE": addr.pincode || "",

          "DROP OFF PINCODE": "570002",

          "SENDER MOBILE NO": "",

          "RECEIVER MOBILE NO": cleanPhone10(
            customer.phone || addr.phone || ""
          ),

          "Book ID": order.bookingId || ""
        };
      });

      const ws = window.XLSX.utils.json_to_sheet(rows);

      ws["!cols"] = [
        { wch: 28 }, // RECEIVER NAME
        { wch: 32 }, // RECEIVER ADD LINE 1
        { wch: 32 }, // RECEIVER ADD LINE 2
        { wch: 18 }, // RECEIVER CITY
        { wch: 18 }, // RECEIVER STATE
        { wch: 18 }, // RECEIVER PINCODE
        { wch: 18 }, // DROP OFF PINCODE
        { wch: 20 }, // SENDER MOBILE NO
        { wch: 20 }, // RECEIVER MOBILE NO
        { wch: 18 }  // Book ID
      ];

      const wb = window.XLSX.utils.book_new();

      window.XLSX.utils.book_append_sheet(
        wb,
        ws,
        "ArticleDetails"
      );

      const today = new Date().toISOString().slice(0, 10);

      window.XLSX.writeFile(
        wb,
        `wealthoria-courier-${today}.xlsx`
      );

    } catch (err) {
      console.error("Courier export error:", err);

      alert(
        err?.message ||
        "Unable to export Excel file."
      );
    }
  };


  const icon = (name, size = 17) => (MIcon ? <MIcon name={name} size={size} /> : null);

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

    if (!window.confirm(`Are you sure you want to ${actionText}?`)) return;

    try {
      setUpdatingStatus(true);
      setStatusError("");
      setStatusSuccess("");

      const token = await getAdminToken();

      const response = await fetch(
        `${API_BASE_URL}/api/admin/notifications/prebook-orders/${encodeURIComponent(order.id)}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ shippingStatus: newStatus })
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Unable to update delivery status.");
      }

      setOrders((prev) =>
        prev.map((item) =>
          item.id === order.id
            ? { ...item, shippingStatus: newStatus, updatedAt: new Date().toISOString() }
            : item
        )
      );

      setSelected((prev) =>
        prev?.id === order.id
          ? { ...prev, shippingStatus: newStatus, updatedAt: new Date().toISOString() }
          : prev
      );

      setStatusSuccess(`Delivery status updated to ${newStatus}.`);
    } catch (err) {
      console.error("Delivery status update error:", err);
      setStatusError(err.message || "Unable to update delivery status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const deleteOrder = async (order) => {
    if (!order?.id) return;

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete order ${order.bookingId || order.id
      }?\n\nThis cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const ref = window.db.collection("bookOrders").doc(order.id);
      await ref.delete();

      setSelected((prev) => (prev?.id === order.id ? null : prev));

      alert("Order deleted successfully.");
    } catch (err) {
      console.error("Delete order error:", err);
      alert(err?.message || "Unable to delete the order. Please try again.");
    }
  };

  /* =======================================================
     SEND PRE-BOOK EMAIL
  ======================================================= */

  const sendPrebookEmail = async () => {
    if (!emailOrder) return;

    const email = String(emailOrder.customer?.email || "").trim();

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

      const token = await getAdminToken();

      const response = await fetch(
        `${API_BASE_URL}/api/admin/notifications/prebook-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
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
        throw new Error(data?.message || "Unable to send email.");
      }

      setEmailSuccess("Email sent successfully.");

      setTimeout(() => {
        setEmailOrder(null);
        setEmailError("");
        setEmailSuccess("");
      }, 1200);
    } catch (err) {
      console.error("Pre-book email error:", err);
      setEmailError(err.message || "Unable to send email.");
    } finally {
      setSendingEmail(false);
    }
  };

  /* =======================================================
     LOAD jsPDF
  ======================================================= */

  const loadJsPDF = () => {
    return new Promise((resolve, reject) => {
      if (window.jspdf?.jsPDF) {
        resolve(window.jspdf.jsPDF);
        return;
      }

      const existingScript = document.querySelector('script[data-wealthoria-jspdf="true"]');

      if (existingScript) {
        existingScript.addEventListener("load", () => {
          if (window.jspdf?.jsPDF) resolve(window.jspdf.jsPDF);
          else reject(new Error("jsPDF loaded but was not available."));
        });
        existingScript.addEventListener("error", () => {
          reject(new Error("Unable to load jsPDF."));
        });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.async = true;
      script.dataset.wealthoriaJspdf = "true";

      script.onload = () => {
        if (window.jspdf?.jsPDF) resolve(window.jspdf.jsPDF);
        else reject(new Error("jsPDF loaded but was not available."));
      };

      script.onerror = () => reject(new Error("Unable to load jsPDF."));

      document.head.appendChild(script);
    });
  };

  /* =======================================================
     GENERATE SHIPPING LABEL PDF
     3 COLUMNS × 6 ROWS = 18 LABELS PER A4 PAGE
  ======================================================= */

  const generateShippingLabelsPDF = async (ordersToPrint = null, options = {}) => {
    const { reprint = false } = options;

    if (labelGenerating) return;

    try {
      setLabelGenerating(true);

      const sourceOrders = Array.isArray(ordersToPrint) ? ordersToPrint : paginatedOrders;

      const indexedSourceOrders = sourceOrders.map((order, index) => ({
        order,
        pageRow: index + 1
      }));

      const eligibleRows = indexedSourceOrders.filter(({ order }) => {
        const shippingStatus = String(order.shippingStatus || "").trim().toLowerCase();
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

      const jsPDF = await loadJsPDF();

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageWidth = 210;
      const pageHeight = 297;

      const columns = 3;
      const rows = 6;
      const labelsPerPage = columns * rows;

      const marginX = 2;
      const marginY = 2;
      const gapX = 2;

      const labelWidth = (pageWidth - marginX * 2 - gapX * (columns - 1)) / columns;
      const labelHeight = 43;
      const availableHeight = pageHeight - marginY * 2;
      const gapY = (availableHeight - labelHeight * rows) / (rows - 1);

      labelOrders.forEach((order, index) => {
        const position = index % labelsPerPage;

        if (index > 0 && position === 0) pdf.addPage();

        const column = position % columns;
        const row = Math.floor(position / columns);

        const x = marginX + column * (labelWidth + gapX);
        const y = marginY + row * (labelHeight + gapY);

        const customer = order.customer || {};
        const address = order.shippingAddress || {};

        const name = customer.name || address.name || "—";
        const phone = customer.phone || address.phone || "—";

        const completeAddress = [address.address, address.landmark, address.city]
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
        pdf.text("WEALTHORIA EDUCATION PRIVATE LIMITED", left, y + 4.2, {
          maxWidth: contentWidth
        });

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
        const nameLines = pdf.splitTextToSize(String(name), contentWidth);
        pdf.text(nameLines.slice(0, 2), left, y + 12.5);

        /* Phone */
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6.5);
        pdf.text(`Ph: ${phone}`, left, y + 18.5);

        /* Address */
        const addressLines = pdf.splitTextToSize(
          completeAddress || "Address not available",
          contentWidth
        );
        pdf.text(addressLines.slice(0, 3), left, y + 22.5);

        /* State */
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(6.5);
        pdf.text(`State: ${state}`, left, y + 32.5, { maxWidth: contentWidth });

        /* PIN */
        const pinY = y + 34;
        const pinHeight = 6;

        pdf.setFillColor(235, 235, 235);
        pdf.rect(left, pinY, contentWidth, pinHeight, "F");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.text(`PIN: ${pincode}`, left + 2, pinY + 4);
      });

      const today = new Date().toISOString().slice(0, 10);

      const filePrefix = reprint
        ? "wealthoria-shipping-labels-reprint"
        : "wealthoria-shipping-labels";

      pdf.save(`${filePrefix}-${today}.pdf`);

      /* RECORD LABEL GENERATION */

      if (window.db?.batch) {
        const labelBatchId = `LBL-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
    } catch (err) {
      console.error("Shipping label PDF error:", err);
      alert(err?.message || "Unable to generate the PDF. Please try again.");
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
          const ref = window.db.collection("bookOrders").doc(order.id);
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
          if (!resettableOrders.some((item) => item.id === order.id)) return order;
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
        if (!prev || !resettableOrders.some((item) => item.id === prev.id)) return prev;
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
    } catch (err) {
      console.error("Reset label count error:", err);
      alert(err?.message || "Unable to reset label counts. Please try again.");
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
      `Reprint the shipping label for ${order.bookingId || order.id
      }?\n\nThis will intentionally create a duplicate label.`
    );

    if (!confirmed) return;

    await generateShippingLabelsPDF([order], { reprint: true });
  };

  /* =======================================================
     RENDER
  ======================================================= */

  const exportDisabled = filteredOrders.length === 0;
  const courierDisabled = paginatedOrders.length === 0;
  const resetDisabled = labelGenerating || pageGeneratedLabelCount === 0;
  const generateDisabled = labelGenerating || selectedCurrentPageOrders.length === 0;

  return (
    <div
      className="admin-page prebook-orders-page"
      style={{ maxWidth: 1600, margin: "0 auto", paddingBottom: 32 }}
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
              color: "#667085",
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap"
            }}
          >
            <span>
              Showing {pageStart}-{pageEnd} of {filteredOrders.length} records · Page {currentPage} of {totalPages}
            </span>
            {couponFilter !== "all" && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "2px 9px",
                  borderRadius: 6,
                  background: "#ecfdf3",
                  border: "1px solid #a6f4c5",
                  color: "#027a48",
                  fontWeight: 750,
                  fontSize: 12
                }}
              >
                🏷️ {couponFilter.startsWith("code:") ? couponFilter.slice(5) : "Coupon Filtered"} Total: ₹{filteredMetrics.totalAmount.toLocaleString("en-IN")}
              </span>
            )}
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
            <div style={{ fontSize: 13, fontWeight: 750, color: "#344054" }}>
              {selectedCurrentPageOrders.length} labels selected
            </div>
            <div style={{ marginTop: 3, fontSize: 11, color: "#667085" }}>
              {pageGeneratedLabelCount} already generated · 18 per A4
            </div>
          </div>

          {/* EXPORT EXCEL (all filtered orders) */}
          <button
            type="button"
            onClick={exportOrdersToExcel}
            disabled={exportDisabled}
            style={headerBtn(exportDisabled)}
          >
            Export Excel
          </button>

          {/* EXPORT PAGE — COURIER FORMAT */}
          <button
            type="button"
            onClick={exportPageCourierFormat}
            disabled={courierDisabled}
            style={headerBtn(courierDisabled)}
          >
            Export Page (Courier)
          </button>

          <button
            type="button"
            onClick={() => setShowDuplicates((value) => !value)}
            style={{
              height: 42,
              padding: "0 15px",
              border: showDuplicates ? "1px solid #e6c84f" : "1px solid #dfe3e8",
              borderRadius: 10,
              background: showDuplicates ? "#fff8d8" : "#fff",
              color: showDuplicates ? "#7a5f00" : "#344054",
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
            disabled={resetDisabled}
            style={headerBtn(resetDisabled)}
          >
            Reset Count
          </button>

          <button
            type="button"
            onClick={() => {
              if (!selectedCurrentPageOrders.length) {
                alert("Please select at least one order.");
                return;
              }
              generateShippingLabelsPDF(selectedCurrentPageOrders);
            }}
            disabled={generateDisabled}
            style={{
              height: 42,
              padding: "0 16px",
              border: "none",
              borderRadius: 10,
              background: generateDisabled ? "#d0d5dd" : "rgb(232 95 78)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 750,
              cursor: generateDisabled ? "not-allowed" : "pointer",
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
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 14,
          marginBottom: 20
        }}
      >
        {[
          ["Total orders", counts.total, "inbox", "#f5f7fa"],
          ["Paid", counts.paid, "check", "#f0fbf3"],
          ["Paid Revenue", `₹${counts.paidRevenue.toLocaleString("en-IN")}`, "credit-card", "#ecfdf3"],
          ["Pending shipping", counts.pendingShipping, "package", "#fff8e8"],
          ["Shipped", counts.shipped, "truck", "#f2f7ff"],
          ["Delivered", counts.delivered, "check", "#f0fbf3"]
        ].map(([label, value, iconName, iconBg]) => (
          <div
            key={label}
            style={{
              minWidth: 0,
              padding: 16,
              borderRadius: 14,
              border: "1px solid var(--border, #e8ebef)",
              background: "var(--card, #fff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--muted, #667085)",
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
                  color: "var(--ink, #17191c)"
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
        ))}
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
            border: "1px solid #f8d5d1",
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
          COUPON / FILTER STATS HIGHLIGHT BANNER
      =================================================== */}

      {couponFilter !== "all" && (
        <div
          style={{
            background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf3 100%)",
            border: "1px solid #a6f4c5",
            borderRadius: 14,
            padding: "16px 20px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            boxShadow: "0 2px 8px rgba(16, 185, 129, 0.08)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "#d1fae5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22
              }}
            >
              🏷️
            </div>
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#027a48",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em"
                }}
              >
                {couponFilter.startsWith("code:")
                  ? `Coupon Selected: ${couponFilter.slice(5)}`
                  : couponFilter === "with_coupon"
                    ? "Orders With Coupon"
                    : "Orders Without Coupon"}
              </div>
              <div style={{ fontSize: 13, color: "#344054", marginTop: 2 }}>
                {filteredMetrics.orderCount} order{filteredMetrics.orderCount === 1 ? "" : "s"} found
                {startDate || endDate ? ` (${startDate || "start"} to ${endDate || "today"})` : ""}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#667085",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em"
                }}
              >
                Total Amount
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 850,
                  color: "#027a48",
                  marginTop: 2
                }}
              >
                ₹{filteredMetrics.totalAmount.toLocaleString("en-IN")}
              </div>
            </div>

            {filteredMetrics.totalDiscount > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#667085",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em"
                  }}
                >
                  Total Discounts
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#b42318",
                    marginTop: 2
                  }}
                >
                  -₹{filteredMetrics.totalDiscount.toLocaleString("en-IN")}
                </div>
              </div>
            )}

            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#667085",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em"
                }}
              >
                Avg Order Value
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#344054",
                  marginTop: 2
                }}
              >
                ₹{filteredMetrics.avgAmount.toLocaleString("en-IN")}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCouponFilter("all")}
              style={{
                height: 36,
                padding: "0 13px",
                border: "1px solid #a6f4c5",
                borderRadius: 8,
                background: "#fff",
                color: "#027a48",
                fontSize: 12,
                fontWeight: 750,
                cursor: "pointer"
              }}
            >
              Clear Coupon Filter
            </button>
          </div>
        </div>
      )}

      {/* ===================================================
          FILTER BAR
      =================================================== */}

      <div
        style={{
          background: "var(--card, #fff)",
          border: "1px solid var(--border, #e8ebef)",
          borderRadius: 14,
          padding: 14,
          marginBottom: 14,
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap"
        }}
      >
        <div style={{ position: "relative", flex: "1 1 320px", minWidth: 240 }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search booking, customer, email, phone, Razorpay, AWB..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              height: 42,
              border: "1px solid #dfe3e8",
              borderRadius: 10,
              padding: "0 13px",
              fontSize: 13,
              outline: "none",
              background: "var(--card, #fff)",
              color: "var(--ink, #17191c)"
            }}
          />
        </div>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          style={{
            height: 42,
            border: "1px solid #dfe3e8",
            borderRadius: 10,
            padding: "0 12px",
            fontSize: 13,
            background: "var(--card, #fff)",
            color: "var(--ink, #17191c)"
          }}
        >
          <option value="all">All payments</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>

        <select
          value={shippingFilter}
          onChange={(e) => setShippingFilter(e.target.value)}
          style={{
            height: 42,
            border: "1px solid #dfe3e8",
            borderRadius: 10,
            padding: "0 12px",
            fontSize: 13,
            background: "var(--card, #fff)",
            color: "var(--ink, #17191c)"
          }}
        >
          <option value="all">All shipping</option>
          <option value="pending">Pending</option>
          <option value="shipped">Shipped</option>
          <option value="in_transit">In Transit</option>
          <option value="delivered">Delivered</option>
        </select>

        <select
          value={couponFilter}
          onChange={(e) => setCouponFilter(e.target.value)}
          style={{
            height: 42,
            border: "1px solid #dfe3e8",
            borderRadius: 10,
            padding: "0 12px",
            fontSize: 13,
            background: "var(--card, #fff)",
            color: "var(--ink, #17191c)"
          }}
        >
          <option value="all">All coupons ({orders.length})</option>
          <option value="with_coupon">
            With coupon ({couponStats.withCoupon} · ₹{couponStats.withCouponAmount.toLocaleString("en-IN")})
          </option>
          <option value="without_coupon">
            Without coupon ({couponStats.withoutCoupon} · ₹{couponStats.withoutCouponAmount.toLocaleString("en-IN")})
          </option>
          {couponStats.uniqueCoupons.length > 0 && (
            <optgroup label="Coupons Used">
              {couponStats.uniqueCoupons.map(({ code, count, totalAmount }) => (
                <option key={code} value={`code:${code}`}>
                  {code} ({count} orders · ₹{totalAmount.toLocaleString("en-IN")})
                </option>
              ))}
            </optgroup>
          )}
        </select>

        {/* DATE PRESET FILTER */}
        <select
          value={datePreset}
          onChange={(e) => handleDatePresetChange(e.target.value)}
          style={{
            height: 42,
            border: "1px solid #dfe3e8",
            borderRadius: 10,
            padding: "0 12px",
            fontSize: 13,
            background: "var(--card, #fff)",
            color: "var(--ink, #17191c)"
          }}
        >
          <option value="all">All dates</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="7days">Last 7 days</option>
          <option value="30days">Last 30 days</option>
          <option value="this_month">This month</option>
          <option value="custom">Custom date range...</option>
        </select>

        {/* CUSTOM DATE PICKERS */}
        {(datePreset === "custom" || startDate || endDate) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#f8fafc",
              padding: "2px 8px",
              borderRadius: 10,
              border: "1px solid #dfe3e8"
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: "#667085" }}>From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset("custom");
              }}
              style={{
                height: 36,
                border: "1px solid #dfe3e8",
                borderRadius: 7,
                padding: "0 8px",
                fontSize: 12,
                background: "#fff",
                color: "var(--ink, #17191c)"
              }}
            />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#667085" }}>To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset("custom");
              }}
              style={{
                height: 36,
                border: "1px solid #dfe3e8",
                borderRadius: 7,
                padding: "0 8px",
                fontSize: 12,
                background: "#fff",
                color: "var(--ink, #17191c)"
              }}
            />
          </div>
        )}

        {/* SORT ORDER */}
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          style={{
            height: 42,
            border: "1px solid #dfe3e8",
            borderRadius: 10,
            padding: "0 12px",
            fontSize: 13,
            background: "var(--card, #fff)",
            color: "var(--ink, #17191c)",
            fontWeight: 700
          }}
          title="Sort order"
        >
          <option value="desc">⬇️ Newest First (Desc)</option>
          <option value="asc">⬆️ Oldest First (Asc)</option>
        </select>

        <button
          type="button"
          onClick={() => {
            setSearch("");
            setPaymentFilter("all");
            setShippingFilter("all");
            setCouponFilter("all");
            setSortOrder("desc");
            setDatePreset("all");
            setStartDate("");
            setEndDate("");
          }}
          style={{
            height: 42,
            padding: "0 14px",
            border: "1px solid #dfe3e8",
            borderRadius: 10,
            background: "var(--card, #fff)",
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
          background: "var(--card, #fff)",
          border: "1px solid var(--border, #e8ebef)",
          borderRadius: 16,
          overflow: "hidden"
        }}
      >
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid var(--border, #e8ebef)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700 }}>Orders</div>
          <div style={{ fontSize: 12, color: "#667085" }}>
            Rows {pageStart}-{pageEnd}
          </div>
        </div>

        <div style={{ overflowX: "auto", width: "100%" }}>
          <table style={{ width: "100%", minWidth: 1380, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e8ebef" }}>
                {[
                  "Select",
                  "Row",
                  "Booking ID",
                  "Date",
                  "Name",
                  "Email",
                  "Phone",
                  "Qty",
                  "Amount",
                  "Coupon",
                  "Delivery Status",
                  "Label",
                  "View",
                  "Send Email",
                  "Delete"
                ].map((heading, index) => (
                  <th
                    key={`${heading}-${index}`}
                    style={{
                      textAlign: "left",
                      padding: "13px 14px",
                      fontSize: 11,
                      fontWeight: 750,
                      color: "#667085",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={15}
                    style={{ padding: 50, textAlign: "center", color: "#667085", fontSize: 13 }}
                  >
                    Loading pre-book orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={15}
                    style={{ padding: 50, textAlign: "center", color: "#667085", fontSize: 13 }}
                  >
                    {orders.length === 0
                      ? "No pre-book orders found."
                      : "No orders match your search or filters."}
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order, pageIndex) => {
                  const customer = order.customer || {};
                  const product = order.product || {};
                  const pageRow = pageIndex + 1;
                  const isDuplicate = duplicateInfo.duplicateOrderIds.has(order.id);
                  const rowShipping = String(order.shippingStatus || "").trim().toLowerCase();

                  return (
                    <tr
                      key={order.id}
                      style={{
                        borderBottom: "1px solid #edf0f3",
                        background: isDuplicate ? "#fff8d8" : "transparent"
                      }}
                    >
                      {/* SELECT FOR SHIPPING LABEL */}
                      <td style={{ padding: "14px", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={selectedLabelOrders.includes(order.id)}
                          disabled={
                            labelGenerating ||
                            rowShipping === "shipped" ||
                            rowShipping === "delivered"
                          }
                          onChange={(e) => {
                            setSelectedLabelOrders((prev) =>
                              e.target.checked
                                ? [...prev, order.id]
                                : prev.filter((id) => id !== order.id)
                            );
                          }}
                          style={{ width: 17, height: 17, cursor: "pointer" }}
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

                      {/* DATE */}
                      <td
                        style={{
                          padding: "14px",
                          fontSize: 12,
                          color: "#475467",
                          whiteSpace: "nowrap"
                        }}
                      >
                        <div style={{ fontWeight: 650, color: "var(--ink, #17191c)" }}>
                          {getOrderFormattedDate(order)}
                        </div>
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
                      <td style={{ padding: "14px", fontSize: 13, whiteSpace: "nowrap" }}>
                        {valueOrDash(customer.email)}
                      </td>

                      {/* PHONE */}
                      <td style={{ padding: "14px", fontSize: 13, whiteSpace: "nowrap" }}>
                        {valueOrDash(customer.phone)}
                      </td>

                      {/* QTY */}
                      <td style={{ padding: "14px", fontSize: 13, textAlign: "center" }}>
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

                      {/* COUPON */}
                      <td style={{ padding: "14px", whiteSpace: "nowrap" }}>
                        {order.couponCode ? (
                          <div style={{ display: "inline-flex", flexDirection: "column", gap: 3 }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "4px 8px",
                                borderRadius: 6,
                                background: "#ecfdf3",
                                border: "1px solid #a6f4c5",
                                color: "#027a48",
                                fontSize: 11,
                                fontWeight: 750,
                                letterSpacing: "0.02em"
                              }}
                            >
                              🏷️ {order.couponCode}
                            </span>
                            {Number(order.discountAmount) > 0 && (
                              <span style={{ fontSize: 11, color: "#475467", fontWeight: 650 }}>
                                -₹{order.discountAmount} {order.discountPercentage ? `(${order.discountPercentage}%)` : ""}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "#98a2b3", fontSize: 13 }}>—</span>
                        )}
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
                                  order.shippingStatus === "shipped" ? "delivered" : "shipped"
                                )
                              }
                              style={{
                                height: 34,
                                padding: "0 11px",
                                border: "none",
                                borderRadius: 7,
                                background:
                                  order.shippingStatus === "shipped" ? "#067647" : "#175cd3",
                                color: "#fff",
                                fontSize: 11,
                                fontWeight: 750,
                                cursor: updatingStatus ? "not-allowed" : "pointer",
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
                            <div style={{ fontSize: 11, color: "#667085" }}>
                              Printed {Math.max(1, Number(order.labelGenerationCount || 1))} time
                              {Math.max(1, Number(order.labelGenerationCount || 1)) === 1 ? "" : "s"}
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
                          <span style={{ fontSize: 11, color: "#98a2b3" }}>Not generated</span>
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
                            setEmailSubject(`Wealthoria – Pre-booking Confirmation ${bookingId}`);
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

                      {/* DELETE */}
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
                })
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
            <div style={{ fontSize: 12, color: "#667085" }}>
              Showing {pageStart}-{pageEnd} of {filteredOrders.length} records · 50 per page
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
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
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Send Email</div>
                <div style={{ fontSize: 12, color: "#667085" }}>
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
                    cursor: sendingEmail ? "not-allowed" : "pointer",
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
          onClick={() => setSelected(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, .48)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(1050px, 100%)",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "var(--card, #fff)",
              borderRadius: 18,
              boxShadow: "0 25px 80px rgba(0,0,0,.22)"
            }}
          >
            {/* MODAL HEADER */}
            <div
              style={{
                padding: "18px 20px",
                borderBottom: "1px solid var(--border, #e8ebef)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 15,
                position: "sticky",
                top: 0,
                background: "var(--card, #fff)",
                zIndex: 2
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#667085",
                    fontWeight: 700,
                    marginBottom: 4,
                    textTransform: "uppercase"
                  }}
                >
                  Booking
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, display: "flex", alignItems: "center", gap: 12 }}>
                  <span>{valueOrDash(selected.bookingId)}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#667085" }}>
                    📅 {getOrderFormattedDate(selected)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
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
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* MODAL BODY */}
            <div style={{ padding: 20 }}>
              {/* SUMMARY */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gap: 12,
                  marginBottom: 20
                }}
              >
                {[
                  ["Payment", "payment", selected.paymentStatus],
                  ["Order", "order", selected.orderStatus],
                  ["Shipping", "shipping", selected.shippingStatus]
                ].map(([label, type, value]) => (
                  <div
                    key={label}
                    style={{ padding: 14, border: "1px solid #e8ebef", borderRadius: 12 }}
                  >
                    <div style={{ fontSize: 11, color: "#667085", marginBottom: 5 }}>{label}</div>
                    <StatusBadge type={type} value={value} />
                  </div>
                ))}

                <div style={{ padding: 14, border: "1px solid #e8ebef", borderRadius: 12 }}>
                  <div style={{ fontSize: 11, color: "#667085", marginBottom: 5 }}>Amount</div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>
                    ₹{valueOrDash(selected.amount)}
                  </div>
                </div>
              </div>

              {/* CUSTOMER + PRODUCT */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 20,
                  marginBottom: 20
                }}
              >
                <div
                  style={{
                    border: "1px solid #e8ebef",
                    borderRadius: 14,
                    padding: "4px 16px 12px"
                  }}
                >
                  <h3 style={{ margin: "12px 0 4px", fontSize: 15 }}>Customer</h3>
                  <DetailField label="Order Date">{getOrderFormattedDate(selected)}</DetailField>
                  <DetailField label="Name">{selected.customer?.name}</DetailField>
                  <DetailField label="Email">{selected.customer?.email}</DetailField>
                  <DetailField label="Phone">{selected.customer?.phone}</DetailField>
                </div>

                <div
                  style={{
                    border: "1px solid #e8ebef",
                    borderRadius: 14,
                    padding: "4px 16px 12px"
                  }}
                >
                  <h3 style={{ margin: "12px 0 4px", fontSize: 15 }}>Product</h3>
                  <DetailField label="Book">{selected.product?.name}</DetailField>
                  <DetailField label="Quantity">{selected.product?.quantity || 1}</DetailField>
                  <DetailField label="SKU">{selected.product?.sku}</DetailField>
                  <DetailField label="Unit price">₹{selected.product?.unitPrice}</DetailField>
                </div>
              </div>

              {/* ADDRESSES */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginBottom: 20
                }}
              >
                <AddressBox title="Delivery Address" address={selected.shippingAddress} />
                <AddressBox title="Billing Address" address={selected.billingAddress} />
              </div>

              {/* PAYMENT */}
              <div
                style={{
                  border: "1px solid #e8ebef",
                  borderRadius: 14,
                  padding: "4px 16px 12px",
                  marginBottom: 20
                }}
              >
                <h3 style={{ margin: "12px 0 4px", fontSize: 15 }}>Payment & Coupon Details</h3>
                <DetailField label="Razorpay Order ID">{selected.razorpayOrderId}</DetailField>
                <DetailField label="Razorpay Payment ID">{selected.razorpayPaymentId}</DetailField>
                <DetailField label="Payment Status">
                  <StatusBadge type="payment" value={selected.paymentStatus} />
                </DetailField>
                <DetailField label="Currency">{selected.currency || "INR"}</DetailField>
                <DetailField label="Coupon Applied">
                  {selected.couponCode ? (
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 6,
                        background: "#ecfdf3",
                        border: "1px solid #a6f4c5",
                        color: "#027a48",
                        fontWeight: 750,
                        fontSize: 12
                      }}
                    >
                      🏷️ {selected.couponCode}
                    </span>
                  ) : (
                    "None"
                  )}
                </DetailField>
                {selected.couponCode && (
                  <>
                    <DetailField label="Discount Amount">
                      {selected.discountAmount ? `₹${selected.discountAmount}` : "—"}
                    </DetailField>
                    <DetailField label="Discount Percentage">
                      {selected.discountPercentage ? `${selected.discountPercentage}%` : "—"}
                    </DetailField>
                    <DetailField label="Coupon ID">
                      {selected.couponId || selected.couponCodeId || "—"}
                    </DetailField>
                  </>
                )}
              </div>

              {/* SYSTEM DETAILS */}
              <div
                style={{
                  border: "1px solid #e8ebef",
                  borderRadius: 14,
                  padding: "4px 16px 12px"
                }}
              >
                <h3 style={{ margin: "12px 0 4px", fontSize: 15 }}>Order Information</h3>
                <DetailField label="Booking ID">{selected.bookingId}</DetailField>
                <DetailField label="Order ID">{selected.id}</DetailField>
                <DetailField label="Source">{selected.source}</DetailField>
                <DetailField label="Email Sent">
                  {selected.emailSent === true ? "Yes" : "No"}
                </DetailField>
                <DetailField label="Shipping Label">
                  {selected.labelGenerated === true ? "Generated" : "Not generated"}
                </DetailField>
                <DetailField label="Label Batch ID">{selected.labelBatchId}</DetailField>
                <DetailField label="Label Generated At">
                  {formatDate(selected.labelGeneratedAt)}
                </DetailField>
                <DetailField label="Created">{formatDate(selected.createdAt)}</DetailField>
                <DetailField label="Updated">{formatDate(selected.updatedAt)}</DetailField>
                <DetailField label="Shipping Error">{selected.shippingError}</DetailField>
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

window.AdminPrebookOrders = PrebookOrders;

export default PrebookOrders;
