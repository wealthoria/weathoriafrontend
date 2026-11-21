/* global React, window */

import React, { useEffect, useMemo, useState } from "react";
import { auth } from "../firebase";
const { MIcon } = window;

const API_BASE_URL =
  typeof window !== "undefined" && window.WEALTHORIA_API_BASE !== undefined
    ? window.WEALTHORIA_API_BASE
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
    address.address || address.line1 || address.street,
    address.landmark || address.line2,
    address.city,
    address.state,
    address.pincode || address.postalCode || address.zip,
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

function AddressBox({ title, address, onEdit }) {
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
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 750,
            color: "var(--ink, #17191c)"
          }}
        >
          {title}
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              border: "1px solid #b2ddff",
              background: "#eff8ff",
              color: "#175cd3",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4
            }}
          >
            ✏️ Edit {title.includes("Delivery") ? "Delivery" : "Billing"}
          </button>
        )}
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
   METRIC & INVENTORY ICONS (Crisp inline SVGs)
========================================================= */
function MetricIcon({ type, color = "#2563eb", size = 20 }) {
  if (type === "orders") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8v13H3V8" /><path d="M1 3h22v5H1z" /><path d="M10 12h4" />
      </svg>
    );
  }
  if (type === "paid") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    );
  }
  if (type === "revenue") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    );
  }
  if (type === "pending") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    );
  }
  if (type === "shipped") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="1" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    );
  }
  if (type === "delivered") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
      </svg>
    );
  }
  if (type === "book") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    );
  }
  if (type === "stock") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
      </svg>
    );
  }
  if (type === "plus") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    );
  }
  return null;
}

/* =========================================================
   MAIN PAGE
========================================================= */

function PrebookOrders({
  collectionName = "bookOrders",
  bookTitle = "Hoodikeya Vijnana",
  bookSubtitle = "ಹೂಡಿಕೆಯ ವಿಜ್ಞಾನ",
  defaultPrice = 1499,
  sku = "HOODIKEYA-VIJNANA"
} = {}) {
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

  /* --- ART OF PRICE LEADS & ABANDONED CHECKOUTS --- */
  const [activeLeadTab, setActiveLeadTab] = useState("captured"); // "captured" or "abandoned"
  const [draftLeads, setDraftLeads] = useState([]);
  const [copiedLeadId, setCopiedLeadId] = useState(null);

  /* --- STOCK & INVENTORY STATE --- */
  const [stockConfig, setStockConfig] = useState(() => {
    try {
      const cached = localStorage.getItem(`wealthoria_stock_${collectionName}`);
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return { kannadaTotalStock: 0, englishTotalStock: 0, updatedAt: null };
  });
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockModalTab, setStockModalTab] = useState("all"); // "kannada", "english", "all"
  const [stockForm, setStockForm] = useState({
    kannadaAdd: "",
    kannadaTotal: "",
    englishAdd: "",
    englishTotal: "",
    mode: "add" // "add" or "set"
  });
  const [savingStock, setSavingStock] = useState(false);

  const openStockModal = (tab = "all") => {
    setStockModalTab(tab);
    setStockForm({
      kannadaAdd: "",
      kannadaTotal: String(stockConfig.kannadaTotalStock || 0),
      englishAdd: "",
      englishTotal: String(stockConfig.englishTotalStock || 0),
      mode: "add"
    });
    setShowStockModal(true);
  };

  const handleSaveStock = async (e) => {
    if (e) e.preventDefault();
    setSavingStock(true);
    try {
      let finalKannada = stockConfig.kannadaTotalStock || 0;
      let finalEnglish = stockConfig.englishTotalStock || 0;

      if (stockForm.mode === "add") {
        const addKn = parseInt(stockForm.kannadaAdd, 10);
        if (!isNaN(addKn) && addKn > 0) finalKannada += addKn;
        const addEn = parseInt(stockForm.englishAdd, 10);
        if (!isNaN(addEn) && addEn > 0) finalEnglish += addEn;
      } else {
        const totKn = parseInt(stockForm.kannadaTotal, 10);
        if (!isNaN(totKn) && totKn >= 0) finalKannada = totKn;
        const totEn = parseInt(stockForm.englishTotal, 10);
        if (!isNaN(totEn) && totEn >= 0) finalEnglish = totEn;
      }

      const updatedPayload = {
        kannadaTotalStock: Math.max(0, finalKannada),
        englishTotalStock: Math.max(0, finalEnglish),
        updatedAt: new Date().toISOString(),
        updatedBy: "Admin"
      };

      if (window.db && typeof window.db.collection === "function") {
        await window.db.collection("prebookStock").doc(collectionName).set(updatedPayload, { merge: true });
      }

      setStockConfig(updatedPayload);
      try {
        localStorage.setItem(`wealthoria_stock_${collectionName}`, JSON.stringify(updatedPayload));
      } catch (_) {}

      setShowStockModal(false);
    } catch (err) {
      console.error("Save stock error:", err);
      alert(err.message || "Failed to update stock. Please try again.");
    } finally {
      setSavingStock(false);
    }
  };

  useEffect(() => {
    setSelected(null);
    setCurrentPage(1);
    setSearch("");
    setOrders([]);
    setLoading(true);
  }, [collectionName]);

  /* --- EDIT ORDER STATE --- */
  const [editingOrder, setEditingOrder] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    deliveryName: "",
    deliveryPhone: "",
    deliveryAddress: "",
    deliveryLandmark: "",
    deliveryCity: "",
    deliveryState: "",
    deliveryPincode: "",
    deliveryCountry: "India",
    billingSameAsDelivery: true,
    billingName: "",
    billingPhone: "",
    billingAddress: "",
    billingLandmark: "",
    billingCity: "",
    billingState: "",
    billingPincode: "",
    billingCountry: "India",
    shippingStatus: "pending",
    paymentStatus: "paid",
    trackingId: "",
    courierName: "",
    notes: ""
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  const openEditModal = (order, targetSection = "all") => {
    setEditingOrder(order);
    const cust = order.customer || {};
    const ship = order.shippingAddress || {};
    const bill = order.billingAddress || {};

    const shipAddress = ship.address || ship.line1 || ship.street || "";
    const billAddress = bill.address || bill.line1 || bill.street || "";

    const isSameAsDelivery =
      bill.sameAsDelivery !== false &&
      (bill.sameAsDelivery === true ||
        !billAddress ||
        (billAddress === shipAddress &&
          String(bill.pincode || bill.postalCode || "").trim() ===
            String(ship.pincode || ship.postalCode || "").trim()));

    setEditForm({
      name: cust.name || ship.name || "",
      email: cust.email || "",
      phone: cust.phone || ship.phone || "",

      // Delivery Address
      deliveryName: ship.name || cust.name || "",
      deliveryPhone: ship.phone || cust.phone || "",
      deliveryAddress: shipAddress,
      deliveryLandmark: ship.landmark || ship.line2 || "",
      deliveryCity: ship.city || "",
      deliveryState: ship.state || "",
      deliveryPincode: ship.pincode || ship.postalCode || ship.zip || "",
      deliveryCountry: ship.country || "India",

      // Billing Address
      billingSameAsDelivery: targetSection === "billing" ? false : isSameAsDelivery,
      billingName: bill.name || ship.name || cust.name || "",
      billingPhone: bill.phone || ship.phone || cust.phone || "",
      billingAddress: billAddress || shipAddress,
      billingLandmark: bill.landmark || bill.line2 || ship.landmark || ship.line2 || "",
      billingCity: bill.city || ship.city || "",
      billingState: bill.state || ship.state || "",
      billingPincode: bill.pincode || bill.postalCode || bill.zip || ship.pincode || ship.postalCode || "",
      billingCountry: bill.country || "India",

      // Status & Logistics
      shippingStatus: order.shippingStatus || "pending",
      paymentStatus: order.paymentStatus || order.status || "paid",
      trackingId: order.trackingId || order.trackingNumber || "",
      courierName: order.courierName || order.courier || "",
      notes: order.adminNotes || order.notes || ""
    });
    setEditError("");
    setEditSuccess("");
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "billingSameAsDelivery" && value === true) {
        next.billingName = prev.deliveryName;
        next.billingPhone = prev.deliveryPhone;
        next.billingAddress = prev.deliveryAddress;
        next.billingLandmark = prev.deliveryLandmark;
        next.billingCity = prev.deliveryCity;
        next.billingState = prev.deliveryState;
        next.billingPincode = prev.deliveryPincode;
        next.billingCountry = prev.deliveryCountry || "India";
      }

      if (next.billingSameAsDelivery) {
        if (field === "deliveryName") next.billingName = value;
        if (field === "deliveryPhone") next.billingPhone = value;
        if (field === "deliveryAddress") next.billingAddress = value;
        if (field === "deliveryLandmark") next.billingLandmark = value;
        if (field === "deliveryCity") next.billingCity = value;
        if (field === "deliveryState") next.billingState = value;
        if (field === "deliveryPincode") next.billingPincode = value;
        if (field === "deliveryCountry") next.billingCountry = value;
      }

      return next;
    });
  };

  const saveOrderEdit = async (e) => {
    if (e) e.preventDefault();
    if (!editingOrder?.id) return;

    setSavingEdit(true);
    setEditError("");
    setEditSuccess("");

    try {
      const updatedCustomer = {
        ...(editingOrder.customer || {}),
        name: editForm.name.trim() || editForm.deliveryName.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim() || editForm.deliveryPhone.trim()
      };

      const updatedShippingAddress = {
        ...(editingOrder.shippingAddress || {}),
        name: editForm.deliveryName.trim() || editForm.name.trim(),
        phone: editForm.deliveryPhone.trim() || editForm.phone.trim(),
        address: editForm.deliveryAddress.trim(),
        line1: editForm.deliveryAddress.trim(),
        street: editForm.deliveryAddress.trim(),
        landmark: editForm.deliveryLandmark.trim(),
        line2: editForm.deliveryLandmark.trim(),
        city: editForm.deliveryCity.trim(),
        state: editForm.deliveryState.trim(),
        pincode: editForm.deliveryPincode.trim(),
        postalCode: editForm.deliveryPincode.trim(),
        zip: editForm.deliveryPincode.trim(),
        country: editForm.deliveryCountry.trim() || "India"
      };

      const updatedBillingAddress = editForm.billingSameAsDelivery
        ? {
            ...updatedShippingAddress,
            sameAsDelivery: true
          }
        : {
            ...(editingOrder.billingAddress || {}),
            name: editForm.billingName.trim() || updatedShippingAddress.name,
            phone: editForm.billingPhone.trim() || updatedShippingAddress.phone,
            address: editForm.billingAddress.trim(),
            line1: editForm.billingAddress.trim(),
            street: editForm.billingAddress.trim(),
            landmark: editForm.billingLandmark.trim(),
            line2: editForm.billingLandmark.trim(),
            city: editForm.billingCity.trim(),
            state: editForm.billingState.trim(),
            pincode: editForm.billingPincode.trim(),
            postalCode: editForm.billingPincode.trim(),
            zip: editForm.billingPincode.trim(),
            country: editForm.billingCountry.trim() || "India",
            sameAsDelivery: false
          };

      const updatePayload = {
        customer: updatedCustomer,
        shippingAddress: updatedShippingAddress,
        billingAddress: updatedBillingAddress,
        shippingStatus: editForm.shippingStatus,
        paymentStatus: editForm.paymentStatus,
        trackingId: editForm.trackingId.trim(),
        courierName: editForm.courierName.trim(),
        adminNotes: editForm.notes.trim()
      };

      await window.db.collection(collectionName).doc(editingOrder.id).update(updatePayload);

      // Optimistically update table row
      setOrders((prev) =>
        prev.map((ord) => (ord.id === editingOrder.id ? { ...ord, ...updatePayload } : ord))
      );

      // Also update currently viewed order if open
      setSelected((prev) => (prev && prev.id === editingOrder.id ? { ...prev, ...updatePayload } : prev));

      setEditSuccess("Delivery and Billing addresses updated successfully!");
      setTimeout(() => {
        setEditingOrder(null);
        setEditSuccess("");
      }, 1200);
    } catch (err) {
      console.error("Failed to update order:", err);
      setEditError(err.message || "Failed to update order details.");
    } finally {
      setSavingEdit(false);
    }
  };

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

    let unsubscribe = null;
    let unsubAuth = null;
    let isSubscribed = false;

    let unsubStock = null;
    let unsubDrafts = null;
    const startListener = () => {
      if (isSubscribed) return;
      isSubscribed = true;

      // Listen to abandoned/draft leads for artOfPriceOrders
      if (collectionName === "artOfPriceOrders") {
        try {
          unsubDrafts = window.db.collection("artOfPriceDrafts").onSnapshot(
            (draftSnap) => {
              if (draftSnap) {
                const list = draftSnap.docs
                  .map((d) => ({ id: d.id, ...d.data() }))
                  .filter((d) => {
                    const payStatus = String(d.paymentStatus || d.status || "").trim().toLowerCase();
                    return payStatus !== "paid" && payStatus !== "confirmed" && (d.customer?.phone || d.customer?.name);
                  })
                  .sort((a, b) => getOrderTime(b) - getOrderTime(a));
                setDraftLeads(list);
              }
            },
            (err) => console.warn("Drafts listener notice:", err.message)
          );
        } catch (_) {}
      }

      // Listen to prebookStock
      try {
        unsubStock = window.db.collection("prebookStock").doc(collectionName).onSnapshot(
          (docSnap) => {
            if (docSnap && docSnap.exists) {
              const data = docSnap.data();
              const cfg = {
                kannadaTotalStock: Number(data.kannadaTotalStock) || 0,
                englishTotalStock: Number(data.englishTotalStock) || 0,
                updatedAt: data.updatedAt || null
              };
              setStockConfig(cfg);
              try {
                localStorage.setItem(`wealthoria_stock_${collectionName}`, JSON.stringify(cfg));
              } catch (_) {}
            }
          },
          (err) => console.warn("Stock snapshot listener warning:", err.message)
        );
      } catch (_) {}

      unsubscribe = window.db.collection(collectionName).onSnapshot(
        (snapshot) => {
          const rows = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data()
            }))
            .filter((order) => {
              const payStatus = String(order.paymentStatus || order.status || "").trim().toLowerCase();

              // Strictly exclude any failed, cancelled, unpaid, pending, created, or draft orders
              if (
                payStatus === "failed" ||
                payStatus === "cancelled" ||
                payStatus === "canceled" ||
                payStatus === "unpaid" ||
                payStatus === "pending" ||
                payStatus === "payment_pending" ||
                payStatus === "created" ||
                payStatus === "draft"
              ) {
                return false;
              }

              // Check for genuine Razorpay payment ID (must not be 'null', 'undefined', empty, etc.)
              const rawPaymentId =
                order.razorpayPaymentId ||
                order.paymentId ||
                order.payment_id ||
                (order.payment && typeof order.payment === "object" ? order.payment.id : order.payment);

              const cleanPaymentId = String(rawPaymentId || "").trim().toLowerCase();
              const hasValidPaymentId =
                cleanPaymentId !== "" &&
                cleanPaymentId !== "null" &&
                cleanPaymentId !== "undefined" &&
                cleanPaymentId !== "n/a" &&
                cleanPaymentId !== "none" &&
                cleanPaymentId !== "-";

              const isPaidStatus =
                payStatus === "paid" ||
                payStatus === "captured" ||
                payStatus === "success" ||
                payStatus === "confirmed";

              // For artOfPriceOrders, strictly display ONLY successfully captured Razorpay orders
              if (collectionName === "artOfPriceOrders") {
                return isPaidStatus && hasValidPaymentId;
              }

              // Allow legacy direct customer details form orders for standard bookOrders
              const source = String(order.source || "").trim().toLowerCase();
              const isDirectBookOrder =
                source === "customer-details-page" ||
                order.orderStatus === "confirmed" ||
                (Boolean(order.bookingId) && !order.razorpayOrderId);

              if (isDirectBookOrder) {
                return true;
              }

              return isPaidStatus && hasValidPaymentId;
            });

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
    };

    if (window.auth) {
      if (window.auth.currentUser) {
        startListener();
      }
      unsubAuth = window.auth.onAuthStateChanged((user) => {
        if (user) {
          startListener();
        }
      });
    } else {
      startListener();
    }

    return () => {
      if (typeof unsubAuth === "function") unsubAuth();
      if (typeof unsubscribe === "function") unsubscribe();
      if (typeof unsubStock === "function") unsubStock();
      if (typeof unsubDrafts === "function") unsubDrafts();
    };
  }, [collectionName]);

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
        order.edition,
        order.editionLabel,
        order.sku,
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
     STOCK & EDITION INVENTORY CALCULATION
  ======================================================= */
  const stockMetrics = useMemo(() => {
    let kannadaBooked = 0;
    let englishBooked = 0;

    orders.forEach((order) => {
      const payStatus = String(order.paymentStatus || order.status || "").trim().toLowerCase();
      const orderStatus = String(order.orderStatus || "").trim().toLowerCase();
      const isCancelled =
        payStatus === "failed" ||
        payStatus === "cancelled" ||
        payStatus === "canceled" ||
        orderStatus === "cancelled";

      if (!isCancelled) {
        const qty = Math.max(1, Number(order.quantity || order.product?.quantity) || 1);
        const ed = String(order.edition || order.product?.edition || "").trim().toLowerCase();
        const sku = String(order.sku || order.product?.sku || "").trim().toUpperCase();
        const isEnglish = ed === "english" || ed === "en" || sku.includes("-EN");

        if (isEnglish) {
          englishBooked += qty;
        } else {
          kannadaBooked += qty;
        }
      }
    });

    const kannadaTotal = stockConfig.kannadaTotalStock || 0;
    const englishTotal = stockConfig.englishTotalStock || 0;

    const kannadaInStock = Math.max(0, kannadaTotal - kannadaBooked);
    const englishInStock = Math.max(0, englishTotal - englishBooked);

    const totalStock = kannadaTotal + englishTotal;
    const totalBooked = kannadaBooked + englishBooked;
    const totalInStock = kannadaInStock + englishInStock;

    return {
      kannadaTotal,
      kannadaBooked,
      kannadaInStock,
      englishTotal,
      englishBooked,
      englishInStock,
      totalStock,
      totalBooked,
      totalInStock
    };
  }, [orders, stockConfig]);

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
          "Edition": order.editionLabel || (order.edition === "english" || (order.sku && (order.sku.includes("-EN") || order.sku.endsWith("-EN"))) ? "English" : "Kannada"),
          "SKU": order.sku || order.product?.sku || (order.edition === "english" ? "THE-ART-OF-PRICE-EN-EDITION" : "THE-ART-OF-PRICE-KN-EDITION"),
          "Quantity": order.quantity || order.product?.quantity || 1,
          "Order Date": getOrderFormattedDate(order),
          "Amount": order.amount ? `₹${order.amount}` : "",
          "Coupon Code": order.couponCode || "",
          "Discount Amount": order.discountAmount ? `₹${order.discountAmount}` : ""
        };
      });

      const worksheet = window.XLSX.utils.json_to_sheet(excelRows);
      worksheet["!cols"] = [{ wch: 28 }, { wch: 18 }, { wch: 22 }];

      const workbook = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(workbook, worksheet, bookTitle.slice(0, 31));

      const today = new Date().toISOString().slice(0, 10);
      const safePrefix = bookTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const fileName = showDuplicates
        ? `wealthoria-${safePrefix}-duplicate-orders-${today}.xlsx`
        : `wealthoria-${safePrefix}-orders-${today}.xlsx`;

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

          "Book ID": order.bookingId || "",

          "Quantity": order.quantity || order.product?.quantity || 1
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

      let apiSuccess = false;
      let apiMessage = "";

      try {
        const token = await getAdminToken();
        const response = await fetch(
          `${API_BASE_URL}/api/admin/notifications/prebook-orders/${encodeURIComponent(order.id)}/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ shippingStatus: newStatus, collectionName })
          }
        );

        const data = await response.json().catch(() => ({}));
        if (response.ok && data?.success) {
          apiSuccess = true;
        } else {
          apiMessage = data?.message || "Server returned error";
        }
      } catch (fetchErr) {
        console.warn("API status call failed, trying direct Firestore update:", fetchErr.message);
      }

      // If API failed or was unreachable, fallback to direct Firestore update
      if (!apiSuccess) {
        if (window.db && typeof window.db.collection === "function") {
          const updatePayload = {
            shippingStatus: newStatus,
            updatedAt: new Date().toISOString()
          };
          if (newStatus === "delivered") updatePayload.orderStatus = "completed";
          else if (newStatus === "cancelled") updatePayload.orderStatus = "cancelled";
          else updatePayload.orderStatus = "confirmed";

          await window.db.collection(collectionName).doc(order.id).update(updatePayload);
          apiSuccess = true;
        } else {
          throw new Error(apiMessage || "Unable to update delivery status.");
        }
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
      // Secondary fallback
      if (window.db && typeof window.db.collection === "function") {
        try {
          const updatePayload = {
            shippingStatus: newStatus,
            updatedAt: new Date().toISOString()
          };
          if (newStatus === "delivered") updatePayload.orderStatus = "completed";
          else if (newStatus === "cancelled") updatePayload.orderStatus = "cancelled";
          else updatePayload.orderStatus = "confirmed";

          await window.db.collection(collectionName).doc(order.id).update(updatePayload);
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
          return;
        } catch (dbErr) {
          console.error("Secondary direct Firestore update failed:", dbErr);
        }
      }
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
      const ref = window.db.collection(collectionName).doc(order.id);
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
        if (reprint) return true;
        const shippingStatus = String(order.shippingStatus || "").trim().toLowerCase();
        return shippingStatus !== "delivered";
      });

      const labelOrders = eligibleRows.map(({ order }) => order);

      if (!labelOrders.length) {
        alert(
          reprint
            ? "No eligible order is available for reprint."
            : "No eligible orders are available on this page. Delivered orders are excluded."
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

        const editionCode = order.edition === "english" || (order.sku && (order.sku.includes("-EN") || order.sku.endsWith("-EN"))) ? "EN" : "KN";

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.text(`PIN: ${pincode}  [${editionCode}]`, left + 2, pinY + 4);
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
            const ref = window.db.collection(collectionName).doc(order.id);
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
          const ref = window.db.collection(collectionName).doc(order.id);
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
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {couponFilter !== "all" && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                borderRadius: 8,
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

          {/* MANAGE STOCK BUTTON */}
          <button
            type="button"
            onClick={() => openStockModal("all")}
            style={{
              height: 42,
              padding: "0 15px",
              border: "1px solid #fed7aa",
              borderRadius: 10,
              background: "#fffaf5",
              color: "#c2410c",
              fontSize: 13,
              fontWeight: 750,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              whiteSpace: "nowrap"
            }}
          >
            <MetricIcon type="stock" color="#c2410c" size={16} />
            Stock ({stockMetrics.totalInStock} left)
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
          BOOK INVENTORY & EDITION STOCK CONTROL HUB
      =================================================== */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: "20px 22px",
          marginBottom: 20,
          boxShadow: "0 1px 3px rgba(16, 24, 40, 0.05), 0 1px 2px rgba(16, 24, 40, 0.02)"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 16,
            paddingBottom: 14,
            borderBottom: "1px solid #f1f3f5"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2563eb",
                boxShadow: "0 1px 2px rgba(37, 99, 235, 0.12)"
              }}
            >
              <MetricIcon type="stock" color="#2563eb" size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 750, color: "#111827" }}>
                  Book Inventory &amp; Stock Control
                </h3>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 20,
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    color: "#166534"
                  }}
                >
                  Live Calculation
                </span>
              </div>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                Add stock for Kannada &amp; English editions &bull; Automatically calculates booked copies and remaining in-stock
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => openStockModal("kannada")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                height: 36,
                padding: "0 14px",
                borderRadius: 9,
                border: "1px solid #fed7aa",
                background: "#fffaf5",
                color: "#c2410c",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              <MetricIcon type="plus" color="#c2410c" size={13} />
              + Add Kannada Stock
            </button>

            <button
              type="button"
              onClick={() => openStockModal("english")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                height: 36,
                padding: "0 14px",
                borderRadius: 9,
                border: "1px solid #bae6fd",
                background: "#f0f9ff",
                color: "#0369a1",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              <MetricIcon type="plus" color="#0369a1" size={13} />
              + Add English Stock
            </button>

            <button
              type="button"
              onClick={() => openStockModal("all")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                height: 36,
                padding: "0 14px",
                borderRadius: 9,
                border: "none",
                background: "linear-gradient(135deg, #e8473f 0%, #f4823c 100%)",
                color: "#ffffff",
                fontSize: 12.5,
                fontWeight: 750,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(232,71,63,0.25)"
              }}
            >
              <MetricIcon type="stock" color="#ffffff" size={14} />
              Manage Stock
            </button>
          </div>
        </div>

        {/* DUAL EDITION INVENTORY CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16
          }}
        >
          {/* KANNADA EDITION CARD */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #fed7aa",
              borderRadius: 14,
              padding: "16px 18px",
              position: "relative",
              boxShadow: "0 1px 2px rgba(234, 88, 12, 0.05)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: "#ffedd5",
                    color: "#c2410c",
                    letterSpacing: "0.4px"
                  }}
                >
                  ಕನ್ನಡ
                </span>
                <span style={{ fontSize: 13, fontWeight: 750, color: "#9a3412" }}>
                  Kannada Edition
                </span>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: stockMetrics.kannadaInStock > 3 ? "#f0fdf4" : stockMetrics.kannadaInStock > 0 ? "#fefce8" : "#fef2f2",
                  color: stockMetrics.kannadaInStock > 3 ? "#15803d" : stockMetrics.kannadaInStock > 0 ? "#a16207" : "#b91c1c",
                  border: `1px solid ${stockMetrics.kannadaInStock > 3 ? "#bbf7d0" : stockMetrics.kannadaInStock > 0 ? "#fef08a" : "#fecaca"}`
                }}
              >
                {stockMetrics.kannadaTotal === 0
                  ? "No Stock Set"
                  : stockMetrics.kannadaInStock > 0
                    ? `${stockMetrics.kannadaInStock} In Stock`
                    : "Sold Out"}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 32, fontWeight: 850, color: "#111827", lineHeight: 1 }}>
                {stockMetrics.kannadaInStock}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>
                in stock
              </span>
            </div>

            <div style={{ fontSize: 12.5, color: "#4b5563", marginBottom: 12, fontWeight: 550 }}>
              <strong style={{ color: "#c2410c", fontWeight: 750 }}>{stockMetrics.kannadaBooked}</strong> booked out of{" "}
              <strong style={{ color: "#111827", fontWeight: 750 }}>{stockMetrics.kannadaTotal}</strong> total books
            </div>

            {/* Progress Bar */}
            <div style={{ width: "100%", height: 7, borderRadius: 10, background: "#f3f4f6", overflow: "hidden", marginBottom: 12 }}>
              <div
                style={{
                  height: "100%",
                  borderRadius: 10,
                  width: `${stockMetrics.kannadaTotal > 0 ? Math.min(100, Math.round((stockMetrics.kannadaBooked / stockMetrics.kannadaTotal) * 100)) : 0}%`,
                  background: "linear-gradient(90deg, #ea580c 0%, #f97316 100%)",
                  transition: "width 0.4s ease"
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px dashed #fed7aa" }}>
              <span style={{ fontSize: 11, color: "#9a3412", fontWeight: 600 }}>
                SKU: THE-ART-OF-PRICE-KN-EDITION
              </span>
              <button
                type="button"
                onClick={() => openStockModal("kannada")}
                style={{
                  fontSize: 12,
                  fontWeight: 750,
                  color: "#ea580c",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0
                }}
              >
                + Add Stock &rarr;
              </button>
            </div>
          </div>

          {/* ENGLISH EDITION CARD */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #bae6fd",
              borderRadius: 14,
              padding: "16px 18px",
              position: "relative",
              boxShadow: "0 1px 2px rgba(2, 132, 199, 0.05)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: "#e0f2fe",
                    color: "#0369a1",
                    letterSpacing: "0.4px"
                  }}
                >
                  English
                </span>
                <span style={{ fontSize: 13, fontWeight: 750, color: "#0369a1" }}>
                  English Edition
                </span>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: stockMetrics.englishInStock > 3 ? "#f0fdf4" : stockMetrics.englishInStock > 0 ? "#fefce8" : "#fef2f2",
                  color: stockMetrics.englishInStock > 3 ? "#15803d" : stockMetrics.englishInStock > 0 ? "#a16207" : "#b91c1c",
                  border: `1px solid ${stockMetrics.englishInStock > 3 ? "#bbf7d0" : stockMetrics.englishInStock > 0 ? "#fef08a" : "#fecaca"}`
                }}
              >
                {stockMetrics.englishTotal === 0
                  ? "No Stock Set"
                  : stockMetrics.englishInStock > 0
                    ? `${stockMetrics.englishInStock} In Stock`
                    : "Sold Out"}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 32, fontWeight: 850, color: "#111827", lineHeight: 1 }}>
                {stockMetrics.englishInStock}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>
                in stock
              </span>
            </div>

            <div style={{ fontSize: 12.5, color: "#4b5563", marginBottom: 12, fontWeight: 550 }}>
              <strong style={{ color: "#0284c7", fontWeight: 750 }}>{stockMetrics.englishBooked}</strong> booked out of{" "}
              <strong style={{ color: "#111827", fontWeight: 750 }}>{stockMetrics.englishTotal}</strong> total books
            </div>

            {/* Progress Bar */}
            <div style={{ width: "100%", height: 7, borderRadius: 10, background: "#f3f4f6", overflow: "hidden", marginBottom: 12 }}>
              <div
                style={{
                  height: "100%",
                  borderRadius: 10,
                  width: `${stockMetrics.englishTotal > 0 ? Math.min(100, Math.round((stockMetrics.englishBooked / stockMetrics.englishTotal) * 100)) : 0}%`,
                  background: "linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)",
                  transition: "width 0.4s ease"
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px dashed #bae6fd" }}>
              <span style={{ fontSize: 11, color: "#0369a1", fontWeight: 600 }}>
                SKU: THE-ART-OF-PRICE-EN-EDITION
              </span>
              <button
                type="button"
                onClick={() => openStockModal("english")}
                style={{
                  fontSize: 12,
                  fontWeight: 750,
                  color: "#0284c7",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0
                }}
              >
                + Add Stock &rarr;
              </button>
            </div>
          </div>

          {/* COMBINED TOTAL OVERVIEW CARD */}
          <div
            style={{
              background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
              border: "1px solid #cbd5e1",
              borderRadius: 14,
              padding: "16px 18px",
              position: "relative"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: "#e2e8f0",
                    color: "#334155"
                  }}
                >
                  Combined
                </span>
                <span style={{ fontSize: 13, fontWeight: 750, color: "#334155" }}>
                  Total Inventory
                </span>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: "#ffffff",
                  color: "#334155",
                  border: "1px solid #cbd5e1"
                }}
              >
                {stockMetrics.totalStock > 0
                  ? `${Math.round((stockMetrics.totalBooked / stockMetrics.totalStock) * 100)}% Booked`
                  : "0% Booked"}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 32, fontWeight: 850, color: "#0f172a", lineHeight: 1 }}>
                {stockMetrics.totalInStock}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>
                total in stock
              </span>
            </div>

            <div style={{ fontSize: 12.5, color: "#475467", marginBottom: 12, fontWeight: 550 }}>
              <strong>{stockMetrics.totalBooked}</strong> total booked out of{" "}
              <strong>{stockMetrics.totalStock}</strong> total books
            </div>

            {/* Progress Bar */}
            <div style={{ width: "100%", height: 7, borderRadius: 10, background: "#e2e8f0", overflow: "hidden", marginBottom: 12 }}>
              <div
                style={{
                  height: "100%",
                  borderRadius: 10,
                  width: `${stockMetrics.totalStock > 0 ? Math.min(100, Math.round((stockMetrics.totalBooked / stockMetrics.totalStock) * 100)) : 0}%`,
                  background: "linear-gradient(90deg, #334155 0%, #64748b 100%)",
                  transition: "width 0.4s ease"
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px dashed #cbd5e1" }}>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                {stockMetrics.kannadaBooked} KN &middot; {stockMetrics.englishBooked} EN
              </span>
              <button
                type="button"
                onClick={() => openStockModal("all")}
                style={{
                  fontSize: 12,
                  fontWeight: 750,
                  color: "#334155",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0
                }}
              >
                Adjust Stock &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================
          SUMMARY CARDS (MODERN REDESIGN)
      =================================================== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 20
        }}
      >
        {[
          {
            label: "Total Orders",
            value: counts.total,
            type: "orders",
            color: "#2563eb",
            bgColor: "#eff6ff",
            accent: "#3b82f6",
            sub: "All pre-booking entries"
          },
          {
            label: "Paid Orders",
            value: counts.paid,
            type: "paid",
            color: "#059669",
            bgColor: "#ecfdf5",
            accent: "#10b981",
            sub: counts.total > 0 ? `${Math.round((counts.paid / counts.total) * 100)}% payment rate` : "Confirmed"
          },
          {
            label: "Paid Revenue",
            value: `₹${counts.paidRevenue.toLocaleString("en-IN")}`,
            type: "revenue",
            color: "#16a34a",
            bgColor: "#f0fdf4",
            accent: "#22c55e",
            sub: "Total collected"
          },
          {
            label: "Pending Shipping",
            value: counts.pendingShipping,
            type: "pending",
            color: "#d97706",
            bgColor: "#fffbeb",
            accent: "#f59e0b",
            sub: counts.pendingShipping > 0 ? "Awaiting dispatch" : "All dispatched"
          },
          {
            label: "Shipped",
            value: counts.shipped,
            type: "shipped",
            color: "#4f46e5",
            bgColor: "#eef2ff",
            accent: "#6366f1",
            sub: "In transit"
          },
          {
            label: "Delivered",
            value: counts.delivered,
            type: "delivered",
            color: "#0d9488",
            bgColor: "#f0fdfa",
            accent: "#14b8a6",
            sub: "Completed delivery"
          }
        ].map((card) => (
          <div
            key={card.label}
            style={{
              minWidth: 0,
              padding: "16px 18px",
              borderRadius: 14,
              border: "1px solid #e5e7eb",
              borderTop: `3px solid ${card.accent}`,
              background: "#ffffff",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 10,
              boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04), 0 1px 2px rgba(16, 24, 40, 0.02)"
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: 6
                  }}
                >
                  {card.label}
                </div>
                <div
                  style={{
                    fontSize: 26,
                    lineHeight: 1.1,
                    fontWeight: 850,
                    color: "#111827"
                  }}
                >
                  {card.value}
                </div>
              </div>

              <div
                style={{
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: card.bgColor
                }}
              >
                <MetricIcon type={card.type} color={card.color} size={20} />
              </div>
            </div>

            <div style={{ fontSize: 11.5, color: "#9ca3af", fontWeight: 550, borderTop: "1px solid #f9fafb", paddingTop: 8 }}>
              {card.sub}
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
            placeholder="Search by coupon code (e.g. WEALTH20), booking ID, customer, email, phone..."
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
        {/* TABLE TAB HEADER: CAPTURED VS ABANDONED LEADS */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--border, #e8ebef)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            background: "#fcfdfd"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setActiveLeadTab("captured")}
              style={{
                height: 38,
                padding: "0 14px",
                borderRadius: 8,
                border: activeLeadTab === "captured" ? "2px solid #16a34a" : "1px solid #d0d5dd",
                background: activeLeadTab === "captured" ? "#ecfdf5" : "#ffffff",
                color: activeLeadTab === "captured" ? "#065f46" : "#344054",
                fontWeight: 750,
                fontSize: 13,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 7
              }}
            >
              <span>✓ Captured & Paid Orders</span>
              <span
                style={{
                  background: activeLeadTab === "captured" ? "#16a34a" : "#f2f4f7",
                  color: activeLeadTab === "captured" ? "#ffffff" : "#475467",
                  padding: "1px 7px",
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 800
                }}
              >
                {filteredOrders.length}
              </span>
            </button>

            {collectionName === "artOfPriceOrders" && (
              <button
                type="button"
                onClick={() => setActiveLeadTab("abandoned")}
                style={{
                  height: 38,
                  padding: "0 14px",
                  borderRadius: 8,
                  border: activeLeadTab === "abandoned" ? "2px solid #ea580c" : "1px solid #d0d5dd",
                  background: activeLeadTab === "abandoned" ? "#fff7ed" : "#ffffff",
                  color: activeLeadTab === "abandoned" ? "#9a3412" : "#344054",
                  fontWeight: 750,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7
                }}
              >
                <span>⚠️ Abandoned / Follow-up Leads</span>
                <span
                  style={{
                    background: activeLeadTab === "abandoned" ? "#ea580c" : "#f2f4f7",
                    color: activeLeadTab === "abandoned" ? "#ffffff" : "#475467",
                    padding: "1px 7px",
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 800
                  }}
                >
                  {draftLeads.length}
                </span>
              </button>
            )}
          </div>

          <div style={{ fontSize: 12, color: "#667085" }}>
            {activeLeadTab === "captured"
              ? `Rows ${pageStart}-${pageEnd} of ${filteredOrders.length}`
              : `${draftLeads.length} leads requiring follow-up`}
          </div>
        </div>

        {activeLeadTab === "abandoned" && collectionName === "artOfPriceOrders" ? (
          /* ABANDONED LEADS FOLLOW-UP TABLE */
          <div style={{ overflowX: "auto", width: "100%" }}>
            <table style={{ width: "100%", minWidth: 1280, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fff7ed", borderBottom: "1px solid #fed7aa" }}>
                  {[
                    "#",
                    "Draft / Order ID",
                    "Attempted At",
                    "Edition",
                    "Customer Name",
                    "Mobile Number",
                    "Email",
                    "Delivery Address",
                    "Qty & Offer",
                    "Status",
                    "Follow-up Actions"
                  ].map((h, i) => (
                    <th
                      key={i}
                      style={{
                        textAlign: "left",
                        padding: "13px 14px",
                        fontSize: 11,
                        fontWeight: 750,
                        color: "#9a3412",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {draftLeads.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      style={{ padding: 50, textAlign: "center", color: "#667085", fontSize: 13 }}
                    >
                      No abandoned leads found. All orders captured successfully!
                    </td>
                  </tr>
                ) : (
                  draftLeads.map((lead, idx) => {
                    const cust = lead.customer || {};
                    const ship = lead.shippingAddress || {};
                    const phone = String(cust.phone || ship.phone || "").replace(/\D/g, "").slice(-10);
                    const name = cust.name || ship.name || "Customer";
                    const email = cust.email || "";
                    const isKn = String(lead.edition || "").toLowerCase().includes("kannada");
                    const editionLabel = isKn ? "Kannada (ಕನ್ನಡ)" : "English";
                    const fullAddress = [ship.address, ship.address2 || ship.landmark, ship.city, ship.state, ship.pincode].filter(Boolean).join(", ");
                    const attemptTime = getOrderTime(lead);
                    const timeStr = attemptTime
                      ? new Date(attemptTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
                      : "—";
                    const qty = lead.quantity || 1;
                    const waMsg = `Hello ${name}, this is Wealthoria Team. We noticed you started pre-booking 'The Art of Price' (${editionLabel} Edition) with delivery to ${ship.city || 'your address'}. Would you like any assistance completing your pre-booking? Free Pan-India Delivery is included! Link: https://www.wealthoria.in/the-art-of-price-prebook.html?edition=${isKn ? 'kannada' : 'english'}`;
                    const waUrl = `https://wa.me/91${phone}?text=${encodeURIComponent(waMsg)}`;

                    return (
                      <tr key={lead.id || idx} style={{ borderBottom: "1px solid #edf0f3" }}>
                        <td style={{ padding: "12px 14px", fontSize: 12, color: "#667085", fontWeight: 700 }}>{idx + 1}</td>
                        <td style={{ padding: "12px 14px", fontSize: 12, fontWeight: 750, color: "#111" }}>
                          <div>{lead.bookingId || lead.id}</div>
                          <div style={{ fontSize: 10, color: "#98a2b3", fontFamily: "monospace" }}>{lead.id}</div>
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: 12, color: "#475467", whiteSpace: "nowrap" }}>{timeStr}</td>
                        <td style={{ padding: "12px 14px", fontSize: 12 }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "3px 8px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 750,
                              background: isKn ? "#fff7ed" : "#f0f9ff",
                              color: isKn ? "#c2410c" : "#0284c7",
                              border: isKn ? "1px solid #fed7aa" : "1px solid #bae6fd"
                            }}
                          >
                            {editionLabel}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 750, color: "#111" }}>{name}</td>
                        <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "#111", whiteSpace: "nowrap" }}>
                          {phone || "—"}
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: 12, color: "#475467" }}>{email || "—"}</td>
                        <td style={{ padding: "12px 14px", fontSize: 12, color: "#475467", maxWidth: 280 }}>
                          <div style={{ wordBreak: "break-word" }}>{fullAddress || "—"}</div>
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: 12, fontWeight: 750, color: "#111", whiteSpace: "nowrap" }}>
                          {qty} copy (₹{qty * 999})
                        </td>
                        <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "3px 8px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 750,
                              background: "#fef3f2",
                              color: "#b42318",
                              border: "1px solid #fee4e2"
                            }}
                          >
                            Cancelled / Incomplete
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {phone && (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  padding: "6px 11px",
                                  borderRadius: 6,
                                  background: "#25D366",
                                  color: "#ffffff",
                                  fontSize: 12,
                                  fontWeight: 750,
                                  textDecoration: "none",
                                  boxShadow: "0 1px 2px rgba(0,0,0,0.06)"
                                }}
                                title="Chat on WhatsApp with pre-composed follow-up"
                              >
                                💬 WhatsApp
                              </a>
                            )}
                            {phone && (
                              <a
                                href={`tel:${phone}`}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  padding: "6px 10px",
                                  borderRadius: 6,
                                  background: "#0284c7",
                                  color: "#ffffff",
                                  fontSize: 12,
                                  fontWeight: 750,
                                  textDecoration: "none"
                                }}
                                title="Call Customer"
                              >
                                📞 Call
                              </a>
                            )}
                            {email && (
                              <a
                                href={`mailto:${email}?subject=${encodeURIComponent("The Art of Price Pre-booking assistance")}&body=${encodeURIComponent(waMsg)}`}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  padding: "6px 9px",
                                  borderRadius: 6,
                                  background: "#64748b",
                                  color: "#ffffff",
                                  fontSize: 12,
                                  fontWeight: 750,
                                  textDecoration: "none"
                                }}
                                title="Send Email"
                              >
                                ✉️ Email
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const copyText = `Customer: ${name}\nPhone: ${phone}\nEmail: ${email}\nEdition: ${editionLabel}\nAddress: ${fullAddress}`;
                                navigator.clipboard.writeText(copyText);
                                setCopiedLeadId(lead.id || idx);
                                setTimeout(() => setCopiedLeadId(null), 2000);
                              }}
                              style={{
                                padding: "6px 8px",
                                borderRadius: 6,
                                border: "1px solid #d0d5dd",
                                background: copiedLeadId === (lead.id || idx) ? "#dcfce7" : "#ffffff",
                                color: copiedLeadId === (lead.id || idx) ? "#15803d" : "#344054",
                                fontSize: 11,
                                fontWeight: 750,
                                cursor: "pointer"
                              }}
                              title="Copy details"
                            >
                              {copiedLeadId === (lead.id || idx) ? "✓ Copied" : "📋 Copy"}
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (window.confirm(`Delete abandoned lead for ${name}?`)) {
                                  try {
                                    await window.db.collection("artOfPriceDrafts").doc(lead.id).delete();
                                  } catch (err) {
                                    alert("Delete failed: " + err.message);
                                  }
                                }
                              }}
                              style={{
                                padding: "6px 8px",
                                borderRadius: 6,
                                border: "1px solid #fee4e2",
                                background: "#fff",
                                color: "#d92d20",
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: "pointer"
                              }}
                              title="Dismiss / Delete lead"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* STANDARD CAPTURED ORDERS TABLE */
          <div style={{ overflowX: "auto", width: "100%" }}>
          <table style={{ width: "100%", minWidth: 1380, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e8ebef" }}>
                {[
                  "Select",
                  "Row",
                  "Booking ID",
                  "Date",
                  "Edition",
                  "Name",
                  "Email",
                  "Phone",
                  "Qty",
                  "Amount",
                  "Coupon",
                  "Delivery Status",
                  "Label",
                  "View",
                  "Edit",
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
                    colSpan={17}
                    style={{ padding: 50, textAlign: "center", color: "#667085", fontSize: 13 }}
                  >
                    Loading pre-book orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={17}
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

                      {/* EDITION */}
                      <td style={{ padding: "14px", whiteSpace: "nowrap" }}>
                        {order.edition === "english" || (order.sku && (order.sku.includes("-EN") || order.sku.endsWith("-EN"))) ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "4px 8px",
                              borderRadius: 6,
                              background: "#e0f2fe",
                              color: "#0369a1",
                              border: "1px solid #bae6fd",
                              fontSize: 11,
                              fontWeight: 750
                            }}
                          >
                            📘 English
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "4px 8px",
                              borderRadius: 6,
                              background: "#fef3c7",
                              color: "#92400e",
                              border: "1px solid #fde68a",
                              fontSize: 11,
                              fontWeight: 750
                            }}
                          >
                            📙 ಕನ್ನಡ
                          </span>
                        )}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                setCouponFilter(`code:${order.couponCode}`);
                              }}
                              title={`Click to filter all orders by coupon "${order.couponCode}"`}
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
                                letterSpacing: "0.02em",
                                cursor: "pointer"
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

                      {/* EDIT */}
                      <td style={{ padding: "14px" }}>
                        <button
                          type="button"
                          onClick={() => openEditModal(order)}
                          title="Edit customer details & address"
                          style={{
                            height: 34,
                            padding: "0 12px",
                            border: "1px solid #b2ddff",
                            borderRadius: 8,
                            background: "#eff8ff",
                            color: "#175cd3",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Edit
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
                            setEmailSubject(`Wealthoria – Order Confirmation ${bookingId}`);
                            setEmailMessage(
                              `Dear ${name},\n\n` +
                              `Thank you for purchasing the book "${bookTitle}" with Wealthoria.\n\n` +
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
        )}

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

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => openEditModal(selected)}
                  style={{
                    height: 36,
                    padding: "0 14px",
                    background: "#eff8ff",
                    border: "1px solid #b2ddff",
                    color: "#175cd3",
                    borderRadius: 9,
                    fontSize: 12,
                    fontWeight: 750,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit Order Details
                </button>

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
                  <DetailField label="Book">{selected.product?.name || selected.bookTitle}</DetailField>
                  <DetailField label="Edition">
                    {selected.editionLabel || (selected.edition === "english" || (selected.sku && (selected.sku.includes("-EN") || selected.sku.endsWith("-EN"))) ? "English Edition" : "Kannada (ಕನ್ನಡ ಆವೃತ್ತಿ)")}
                  </DetailField>
                  <DetailField label="SKU">{selected.sku || selected.product?.sku || (selected.edition === "english" ? "THE-ART-OF-PRICE-EN-EDITION" : "THE-ART-OF-PRICE-KN-EDITION")}</DetailField>
                  <DetailField label="Quantity">{selected.product?.quantity || selected.quantity || 1}</DetailField>
                  <DetailField label="Unit price">₹{selected.product?.unitPrice || selected.amount}</DetailField>
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
                <AddressBox
                  title="Delivery Address"
                  address={selected.shippingAddress}
                  onEdit={() => openEditModal(selected, "delivery")}
                />
                <AddressBox
                  title="Billing Address"
                  address={selected.billingAddress}
                  onEdit={() => openEditModal(selected, "billing")}
                />
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

              {/* DANGER / DELETE ACTION */}
              <div
                style={{
                  marginTop: 20,
                  display: "flex",
                  justifyContent: "flex-end"
                }}
              >
                <button
                  type="button"
                  onClick={async () => {
                    if (
                      window.confirm(
                        `Are you sure you want to permanently delete order "${selected.bookingId || selected.id}" for ${selected.customer?.name || "this customer"} from Firestore?`
                      )
                    ) {
                      try {
                        await window.db.collection(collectionName).doc(selected.id).delete();
                        setSelected(null);
                      } catch (err) {
                        alert("Failed to delete order: " + err.message);
                      }
                    }
                  }}
                  style={{
                    height: 38,
                    padding: "0 16px",
                    background: "#fff1f0",
                    border: "1px solid #ffa39e",
                    color: "#cf1322",
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  🗑️ Delete Order Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          EDIT ORDER MODAL
      ========================================================= */}
      {editingOrder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1050,
            padding: 16
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !savingEdit) {
              setEditingOrder(null);
            }
          }}
        >
          <div
            style={{
              background: "var(--card, #fff)",
              color: "var(--ink, #17191c)",
              borderRadius: 16,
              width: "100%",
              maxWidth: 720,
              maxHeight: "92vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid #e8ebef"
            }}
          >
            {/* MODAL HEADER */}
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #e8ebef",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                position: "sticky",
                top: 0,
                background: "var(--card, #fff)",
                zIndex: 2
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      background: "#eff8ff",
                      color: "#175cd3",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                      Edit Order Details
                    </h2>
                    <div style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>
                      Booking ID: <b>{editingOrder.bookingId || editingOrder.id}</b>
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !savingEdit && setEditingOrder(null)}
                style={{
                  width: 32,
                  height: 32,
                  border: "none",
                  background: "#f2f4f7",
                  borderRadius: "50%",
                  fontSize: 16,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#475467"
                }}
              >
                ✕
              </button>
            </div>

            {/* FORM BODY */}
            <form onSubmit={saveOrderEdit} style={{ padding: "20px 24px" }}>
              {editError && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "#fef3f2",
                    border: "1px solid #fee4e2",
                    borderRadius: 10,
                    color: "#b42318",
                    fontSize: 13,
                    fontWeight: 650,
                    marginBottom: 18
                  }}
                >
                  ⚠️ {editError}
                </div>
              )}

              {editSuccess && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "#ecfdf3",
                    border: "1px solid #d1fadf",
                    borderRadius: 10,
                    color: "#027a48",
                    fontSize: 13,
                    fontWeight: 650,
                    marginBottom: 18
                  }}
                >
                  ✓ {editSuccess}
                </div>
              )}

              {/* SECTION 1: CUSTOMER INFORMATION */}
              <div style={{ marginBottom: 20 }}>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 750,
                    color: "#344054",
                    margin: "0 0 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  👤 Customer Information
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12
                  }}
                >
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => handleEditChange("name", e.target.value)}
                      style={{
                        width: "100%",
                        height: 38,
                        borderRadius: 8,
                        border: "1px solid #d0d5dd",
                        padding: "0 12px",
                        fontSize: 13,
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={editForm.phone}
                      onChange={(e) => handleEditChange("phone", e.target.value)}
                      style={{
                        width: "100%",
                        height: 38,
                        borderRadius: 8,
                        border: "1px solid #d0d5dd",
                        padding: "0 12px",
                        fontSize: 13,
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => handleEditChange("email", e.target.value)}
                      style={{
                        width: "100%",
                        height: 38,
                        borderRadius: 8,
                        border: "1px solid #d0d5dd",
                        padding: "0 12px",
                        fontSize: 13,
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: DELIVERY ADDRESS */}
              <div
                style={{
                  marginBottom: 22,
                  padding: "16px",
                  background: "#fcfcfd",
                  border: "1px solid #eaecf0",
                  borderRadius: 12
                }}
              >
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 750,
                    color: "#1d2939",
                    margin: "0 0 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  🚚 Delivery Address (Shipping)
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      Recipient Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.deliveryName}
                      onChange={(e) => handleEditChange("deliveryName", e.target.value)}
                      placeholder="Receiver name"
                      style={{
                        width: "100%",
                        height: 38,
                        borderRadius: 8,
                        border: "1px solid #d0d5dd",
                        padding: "0 12px",
                        fontSize: 13,
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      Recipient Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={editForm.deliveryPhone}
                      onChange={(e) => handleEditChange("deliveryPhone", e.target.value)}
                      placeholder="10-digit mobile number"
                      style={{
                        width: "100%",
                        height: 38,
                        borderRadius: 8,
                        border: "1px solid #d0d5dd",
                        padding: "0 12px",
                        fontSize: 13,
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      Delivery Address / Street (Line 1)
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.deliveryAddress}
                      onChange={(e) => handleEditChange("deliveryAddress", e.target.value)}
                      placeholder="House / Flat / Street / Area"
                      style={{
                        width: "100%",
                        height: 38,
                        borderRadius: 8,
                        border: "1px solid #d0d5dd",
                        padding: "0 12px",
                        fontSize: 13,
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      Landmark / Line 2 (Optional)
                    </label>
                    <input
                      type="text"
                      value={editForm.deliveryLandmark}
                      onChange={(e) => handleEditChange("deliveryLandmark", e.target.value)}
                      placeholder="Near landmark, apartment name..."
                      style={{
                        width: "100%",
                        height: 38,
                        borderRadius: 8,
                        border: "1px solid #d0d5dd",
                        padding: "0 12px",
                        fontSize: 13,
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.deliveryCity}
                      onChange={(e) => handleEditChange("deliveryCity", e.target.value)}
                      style={{
                        width: "100%",
                        height: 38,
                        borderRadius: 8,
                        border: "1px solid #d0d5dd",
                        padding: "0 12px",
                        fontSize: 13,
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      State
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.deliveryState}
                      onChange={(e) => handleEditChange("deliveryState", e.target.value)}
                      style={{
                        width: "100%",
                        height: 38,
                        borderRadius: 8,
                        border: "1px solid #d0d5dd",
                        padding: "0 12px",
                        fontSize: 13,
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      Pincode
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.deliveryPincode}
                      onChange={(e) => handleEditChange("deliveryPincode", e.target.value)}
                      style={{
                        width: "100%",
                        height: 38,
                        borderRadius: 8,
                        border: "1px solid #d0d5dd",
                        padding: "0 12px",
                        fontSize: 13,
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      Country
                    </label>
                    <input
                      type="text"
                      value={editForm.deliveryCountry}
                      onChange={(e) => handleEditChange("deliveryCountry", e.target.value)}
                      style={{
                        width: "100%",
                        height: 38,
                        borderRadius: 8,
                        border: "1px solid #d0d5dd",
                        padding: "0 12px",
                        fontSize: 13,
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: BILLING ADDRESS */}
              <div
                style={{
                  marginBottom: 22,
                  padding: "16px",
                  background: "#fcfcfd",
                  border: "1px solid #eaecf0",
                  borderRadius: 12
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12
                  }}
                >
                  <h3
                    style={{
                      fontSize: 14,
                      fontWeight: 750,
                      color: "#1d2939",
                      margin: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    💳 Billing Address
                  </h3>

                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12,
                      fontWeight: 650,
                      color: "#344054",
                      cursor: "pointer",
                      userSelect: "none"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={editForm.billingSameAsDelivery}
                      onChange={(e) => handleEditChange("billingSameAsDelivery", e.target.checked)}
                      style={{ cursor: "pointer", width: 16, height: 16 }}
                    />
                    Same as delivery address
                  </label>
                </div>

                {!editForm.billingSameAsDelivery ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 10 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                        Billing Name
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.billingName}
                        onChange={(e) => handleEditChange("billingName", e.target.value)}
                        placeholder="Billing name"
                        style={{
                          width: "100%",
                          height: 38,
                          borderRadius: 8,
                          border: "1px solid #d0d5dd",
                          padding: "0 12px",
                          fontSize: 13,
                          boxSizing: "border-box"
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                        Billing Phone
                      </label>
                      <input
                        type="tel"
                        required
                        value={editForm.billingPhone}
                        onChange={(e) => handleEditChange("billingPhone", e.target.value)}
                        placeholder="Billing phone number"
                        style={{
                          width: "100%",
                          height: 38,
                          borderRadius: 8,
                          border: "1px solid #d0d5dd",
                          padding: "0 12px",
                          fontSize: 13,
                          boxSizing: "border-box"
                        }}
                      />
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                        Billing Address / Street (Line 1)
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.billingAddress}
                        onChange={(e) => handleEditChange("billingAddress", e.target.value)}
                        placeholder="Billing house / street / area"
                        style={{
                          width: "100%",
                          height: 38,
                          borderRadius: 8,
                          border: "1px solid #d0d5dd",
                          padding: "0 12px",
                          fontSize: 13,
                          boxSizing: "border-box"
                        }}
                      />
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                        Billing Landmark / Line 2 (Optional)
                      </label>
                      <input
                        type="text"
                        value={editForm.billingLandmark}
                        onChange={(e) => handleEditChange("billingLandmark", e.target.value)}
                        placeholder="Landmark or additional address info"
                        style={{
                          width: "100%",
                          height: 38,
                          borderRadius: 8,
                          border: "1px solid #d0d5dd",
                          padding: "0 12px",
                          fontSize: 13,
                          boxSizing: "border-box"
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                        Billing City
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.billingCity}
                        onChange={(e) => handleEditChange("billingCity", e.target.value)}
                        style={{
                          width: "100%",
                          height: 38,
                          borderRadius: 8,
                          border: "1px solid #d0d5dd",
                          padding: "0 12px",
                          fontSize: 13,
                          boxSizing: "border-box"
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                        Billing State
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.billingState}
                        onChange={(e) => handleEditChange("billingState", e.target.value)}
                        style={{
                          width: "100%",
                          height: 38,
                          borderRadius: 8,
                          border: "1px solid #d0d5dd",
                          padding: "0 12px",
                          fontSize: 13,
                          boxSizing: "border-box"
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                        Billing Pincode
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.billingPincode}
                        onChange={(e) => handleEditChange("billingPincode", e.target.value)}
                        style={{
                          width: "100%",
                          height: 38,
                          borderRadius: 8,
                          border: "1px solid #d0d5dd",
                          padding: "0 12px",
                          fontSize: 13,
                          boxSizing: "border-box"
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                        Billing Country
                      </label>
                      <input
                        type="text"
                        value={editForm.billingCountry}
                        onChange={(e) => handleEditChange("billingCountry", e.target.value)}
                        style={{
                          width: "100%",
                          height: 38,
                          borderRadius: 8,
                          border: "1px solid #d0d5dd",
                          padding: "0 12px",
                          fontSize: 13,
                          boxSizing: "border-box"
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "10px 14px",
                      background: "#f0f9ff",
                      border: "1px solid #b9e6fe",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "#026aa2",
                      fontWeight: 600
                    }}
                  >
                    ℹ️ Billing address is synced automatically with the delivery address above. Uncheck the box to provide a distinct billing address.
                  </div>
                )}
              </div>

              {/* SECTION 4: ORDER & SHIPPING STATUS */}
              <div style={{ marginBottom: 20 }}>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 750,
                    color: "#344054",
                    margin: "0 0 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  📦 Logistics & Order Status
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      Delivery / Shipping Status
                    </label>
                    <select
                      value={editForm.shippingStatus}
                      onChange={(e) => handleEditChange("shippingStatus", e.target.value)}
                      style={{
                        width: "100%",
                        height: 38,
                        borderRadius: 8,
                        border: "1px solid #d0d5dd",
                        padding: "0 10px",
                        fontSize: 13,
                        background: "#fff",
                        boxSizing: "border-box"
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="shipped">Shipped</option>
                      <option value="in_transit">In Transit</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      Payment Status
                    </label>
                    <select
                      value={editForm.paymentStatus}
                      onChange={(e) => handleEditChange("paymentStatus", e.target.value)}
                      style={{
                        width: "100%",
                        height: 38,
                        borderRadius: 8,
                        border: "1px solid #d0d5dd",
                        padding: "0 10px",
                        fontSize: 13,
                        background: "#fff",
                        boxSizing: "border-box"
                      }}
                    >
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      Courier Partner (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. India Post / DTDC / BlueDart"
                      value={editForm.courierName}
                      onChange={(e) => handleEditChange("courierName", e.target.value)}
                      style={{
                        width: "100%",
                        height: 38,
                        borderRadius: 8,
                        border: "1px solid #d0d5dd",
                        padding: "0 12px",
                        fontSize: 13,
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      Tracking Number / Consignment No.
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Tracking code"
                      value={editForm.trackingId}
                      onChange={(e) => handleEditChange("trackingId", e.target.value)}
                      style={{
                        width: "100%",
                        height: 38,
                        borderRadius: 8,
                        border: "1px solid #d0d5dd",
                        padding: "0 12px",
                        fontSize: 13,
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      Admin Notes / Remarks
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Add any internal shipping or customer remarks..."
                      value={editForm.notes}
                      onChange={(e) => handleEditChange("notes", e.target.value)}
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        border: "1px solid #d0d5dd",
                        padding: "8px 12px",
                        fontSize: 13,
                        fontFamily: "inherit",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER ACTIONS */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 12,
                  marginTop: 24,
                  paddingTop: 16,
                  borderTop: "1px solid #e8ebef"
                }}
              >
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={() => setEditingOrder(null)}
                  style={{
                    height: 40,
                    padding: "0 18px",
                    border: "1px solid #d0d5dd",
                    borderRadius: 8,
                    background: "#fff",
                    color: "#344054",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: savingEdit ? "not-allowed" : "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  style={{
                    height: 40,
                    padding: "0 22px",
                    border: "none",
                    borderRadius: 8,
                    background: "#175cd3",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 750,
                    cursor: savingEdit ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 1px 2px rgba(16, 24, 40, 0.05)"
                  }}
                >
                  {savingEdit ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          ADD / MANAGE STOCK MODAL (KANNADA & ENGLISH)
      ========================================================= */}
      {showStockModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: 16
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !savingStock) {
              setShowStockModal(false);
            }
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 18,
              width: "100%",
              maxWidth: 620,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e5e7eb",
              overflow: "hidden"
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #f1f3f5",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: "#eff6ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <MetricIcon type="stock" color="#2563eb" size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#111827" }}>
                    Manage Book Stock &amp; Inventory
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                    Set or add stock for Kannada and English editions
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowStockModal(false)}
                disabled={savingStock}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  color: "#9ca3af",
                  cursor: "pointer",
                  padding: "4px 8px"
                }}
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveStock} style={{ padding: "20px 24px" }}>
              {/* Mode Selector */}
              <div
                style={{
                  display: "flex",
                  borderRadius: 10,
                  background: "#f3f4f6",
                  padding: 4,
                  marginBottom: 20
                }}
              >
                <button
                  type="button"
                  onClick={() => setStockForm((prev) => ({ ...prev, mode: "add" }))}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "none",
                    background: stockForm.mode === "add" ? "#ffffff" : "transparent",
                    color: stockForm.mode === "add" ? "#111827" : "#6b7280",
                    fontWeight: 750,
                    fontSize: 13,
                    cursor: "pointer",
                    boxShadow: stockForm.mode === "add" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                  }}
                >
                  + Add Books to Existing Stock
                </button>
                <button
                  type="button"
                  onClick={() => setStockForm((prev) => ({ ...prev, mode: "set" }))}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "none",
                    background: stockForm.mode === "set" ? "#ffffff" : "transparent",
                    color: stockForm.mode === "set" ? "#111827" : "#6b7280",
                    fontWeight: 750,
                    fontSize: 13,
                    cursor: "pointer",
                    boxShadow: stockForm.mode === "set" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                  }}
                >
                  Set Total Stock Count
                </button>
              </div>

              {/* KANNADA STOCK SECTION */}
              <div
                style={{
                  background: "#fffaf5",
                  border: "1px solid #fed7aa",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 5, background: "#ffedd5", color: "#c2410c" }}>
                      ಕನ್ನಡ
                    </span>
                    <strong style={{ fontSize: 14, color: "#9a3412" }}>Kannada Edition</strong>
                  </div>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>
                    Current: <strong>{stockMetrics.kannadaTotal}</strong> total &bull; <strong>{stockMetrics.kannadaBooked}</strong> booked &bull; <strong style={{ color: "#16a34a" }}>{stockMetrics.kannadaInStock} in stock</strong>
                  </span>
                </div>

                {stockForm.mode === "add" ? (
                  <div>
                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 650, color: "#374151", marginBottom: 6 }}>
                      Books to Add to Kannada:
                    </label>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 10"
                        value={stockForm.kannadaAdd}
                        onChange={(e) => setStockForm((prev) => ({ ...prev, kannadaAdd: e.target.value }))}
                        style={{
                          flex: 1,
                          height: 40,
                          padding: "0 12px",
                          borderRadius: 8,
                          border: "1px solid #d1d5db",
                          fontSize: 14,
                          fontWeight: 700
                        }}
                      />
                      <div style={{ display: "flex", gap: 6 }}>
                        {[5, 10, 25, 50, 100].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() =>
                              setStockForm((prev) => ({
                                ...prev,
                                kannadaAdd: String((parseInt(prev.kannadaAdd, 10) || 0) + amt)
                              }))
                            }
                            style={{
                              padding: "6px 10px",
                              borderRadius: 6,
                              border: "1px solid #fed7aa",
                              background: "#ffffff",
                              color: "#c2410c",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            +{amt}
                          </button>
                        ))}
                      </div>
                    </div>
                    {parseInt(stockForm.kannadaAdd, 10) > 0 && (
                      <div style={{ marginTop: 8, fontSize: 12, color: "#16a34a", fontWeight: 650 }}>
                        &rarr; New Total: {stockMetrics.kannadaTotal + parseInt(stockForm.kannadaAdd, 10)} books &bull; Available: {Math.max(0, stockMetrics.kannadaTotal + parseInt(stockForm.kannadaAdd, 10) - stockMetrics.kannadaBooked)} in stock
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 650, color: "#374151", marginBottom: 6 }}>
                      Total Kannada Stock Count:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={stockForm.kannadaTotal}
                      onChange={(e) => setStockForm((prev) => ({ ...prev, kannadaTotal: e.target.value }))}
                      style={{
                        width: "100%",
                        height: 40,
                        padding: "0 12px",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        fontSize: 14,
                        fontWeight: 700
                      }}
                    />
                    <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
                      Available in stock will be: <strong>{Math.max(0, (parseInt(stockForm.kannadaTotal, 10) || 0) - stockMetrics.kannadaBooked)}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* ENGLISH STOCK SECTION */}
              <div
                style={{
                  background: "#f0f9ff",
                  border: "1px solid #bae6fd",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 5, background: "#e0f2fe", color: "#0369a1" }}>
                      English
                    </span>
                    <strong style={{ fontSize: 14, color: "#0369a1" }}>English Edition</strong>
                  </div>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>
                    Current: <strong>{stockMetrics.englishTotal}</strong> total &bull; <strong>{stockMetrics.englishBooked}</strong> booked &bull; <strong style={{ color: "#16a34a" }}>{stockMetrics.englishInStock} in stock</strong>
                  </span>
                </div>

                {stockForm.mode === "add" ? (
                  <div>
                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 650, color: "#374151", marginBottom: 6 }}>
                      Books to Add to English:
                    </label>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 10"
                        value={stockForm.englishAdd}
                        onChange={(e) => setStockForm((prev) => ({ ...prev, englishAdd: e.target.value }))}
                        style={{
                          flex: 1,
                          height: 40,
                          padding: "0 12px",
                          borderRadius: 8,
                          border: "1px solid #d1d5db",
                          fontSize: 14,
                          fontWeight: 700
                        }}
                      />
                      <div style={{ display: "flex", gap: 6 }}>
                        {[5, 10, 25, 50, 100].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() =>
                              setStockForm((prev) => ({
                                ...prev,
                                englishAdd: String((parseInt(prev.englishAdd, 10) || 0) + amt)
                              }))
                            }
                            style={{
                              padding: "6px 10px",
                              borderRadius: 6,
                              border: "1px solid #bae6fd",
                              background: "#ffffff",
                              color: "#0369a1",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            +{amt}
                          </button>
                        ))}
                      </div>
                    </div>
                    {parseInt(stockForm.englishAdd, 10) > 0 && (
                      <div style={{ marginTop: 8, fontSize: 12, color: "#16a34a", fontWeight: 650 }}>
                        &rarr; New Total: {stockMetrics.englishTotal + parseInt(stockForm.englishAdd, 10)} books &bull; Available: {Math.max(0, stockMetrics.englishTotal + parseInt(stockForm.englishAdd, 10) - stockMetrics.englishBooked)} in stock
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 650, color: "#374151", marginBottom: 6 }}>
                      Total English Stock Count:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={stockForm.englishTotal}
                      onChange={(e) => setStockForm((prev) => ({ ...prev, englishTotal: e.target.value }))}
                      style={{
                        width: "100%",
                        height: 40,
                        padding: "0 12px",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        fontSize: 14,
                        fontWeight: 700
                      }}
                    />
                    <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
                      Available in stock will be: <strong>{Math.max(0, (parseInt(stockForm.englishTotal, 10) || 0) - stockMetrics.englishBooked)}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 14, borderTop: "1px solid #f1f3f5" }}>
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  disabled={savingStock}
                  style={{
                    height: 40,
                    padding: "0 18px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    background: "#ffffff",
                    color: "#374151",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: savingStock ? "not-allowed" : "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStock}
                  style={{
                    height: 40,
                    padding: "0 22px",
                    borderRadius: 8,
                    border: "none",
                    background: "linear-gradient(135deg, #e8473f 0%, #f4823c 100%)",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 750,
                    cursor: savingStock ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 6px rgba(232, 71, 63, 0.25)"
                  }}
                >
                  {savingStock ? "Saving Stock..." : "Save & Update Stock"}
                </button>
              </div>
            </form>
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
