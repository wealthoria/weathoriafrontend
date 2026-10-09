/* global React, window */

import React, { useState, useEffect, useMemo } from "react";

const { MIcon, db } = window;

const BOOK_PRODUCT_ID = "investment-science";
const BOOK_PRODUCT_NAME = "ಹೂಡಿಕೆಯ ವಿಜ್ಞಾನ";
const DEFAULT_BOOK_PRICE = 1499;

/* =========================================================
   COUPON CODE GENERATOR & DISCOUNT CALCULATOR
   ========================================================= */

function GenerateCoupon() {
  const [activeTab, setActiveTab] = useState("wealthoria"); // "wealthoria" | "influencer"
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all"); // "all" | "wealthoria" | "influencer"

  // STANDALONE INSTANT CALCULATOR STATE (Does not save to DB)
  const [calcBasePrice, setCalcBasePrice] = useState("1499");
  const [calcDiscountPercent, setCalcDiscountPercent] = useState("20");

  // Wealthoria Form State
  const [wealthoriaCode, setWealthoriaCode] = useState("");
  const [wealthoriaPrefix, setWealthoriaPrefix] = useState("WEALTH");
  const [wealthoriaBasePrice, setWealthoriaBasePrice] = useState("1499");
  const [wealthoriaQuantity, setWealthoriaQuantity] = useState("1");
  const [wealthoriaDiscountPercent, setWealthoriaDiscountPercent] = useState("20");
  const [wealthoriaExpiry, setWealthoriaExpiry] = useState(""); // optional

  // Influencer Form State
  const [influencerName, setInfluencerName] = useState("");
  const [influencerHandle, setInfluencerHandle] = useState("");
  const [influencerCode, setInfluencerCode] = useState("");
  const [influencerBasePrice, setInfluencerBasePrice] = useState("1499");
  const [influencerDiscountPercent, setInfluencerDiscountPercent] = useState("15");
  const [influencerCommission, setInfluencerCommission] = useState("150"); // ₹ payout per book
  const [influencerPhone, setInfluencerPhone] = useState("");
  const [influencerExpiry, setInfluencerExpiry] = useState(""); // optional

  // EDIT MODAL STATE
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [editCode, setEditCode] = useState("");
  const [editDiscountPercent, setEditDiscountPercent] = useState("");
  const [editBasePrice, setEditBasePrice] = useState("1499");
  const [editExpiry, setEditExpiry] = useState("");
  const [editStatus, setEditStatus] = useState("active");
  const [editInfluencerName, setEditInfluencerName] = useState("");
  const [editInfluencerHandle, setEditInfluencerHandle] = useState("");
  const [editInfluencerCommission, setEditInfluencerCommission] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Quick Test / Validator state
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState(null);

  const [orderUsageMap, setOrderUsageMap] = useState({});

  // Real-time listener for bookOrders to track exact live coupon usage
  useEffect(() => {
    if (!db || typeof db.collection !== "function") return;

    const unsubscribe = db.collection("bookOrders").onSnapshot(
      (snapshot) => {
        const counts = {};
        snapshot.docs.forEach((doc) => {
          const order = doc.data() || {};
          const code = String(order.couponCode || "").trim().toUpperCase();
          const cId = String(order.couponId || order.couponCodeId || "").trim();
          if (code) {
            counts[code] = (counts[code] || 0) + 1;
          }
          if (cId) {
            counts[cId] = (counts[cId] || 0) + 1;
          }
        });
        setOrderUsageMap(counts);
      },
      (err) => {
        console.warn("bookOrders usage listener error:", err);
      }
    );

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  // Load existing coupons from Firestore
  useEffect(() => {
    if (!db || typeof db.collection !== "function") {
      setLoading(false);
      return;
    }

    const unsubscribe = db
      .collection("coupons")
      .orderBy("createdAt", "desc")
      .onSnapshot(
        (snapshot) => {
          const rows = snapshot.docs.map((doc) => {
            const data = doc.data() || {};
            const code = (data.couponCode || data.code || doc.id).toUpperCase();
            const basePrice = Number(data.productPrice || DEFAULT_BOOK_PRICE);
            const discountPercent = Number(data.discountPercentage || data.discountValue || 0);
            const discountAmt = Math.round((basePrice * discountPercent) / 100);
            const finalPrice = Math.max(0, basePrice - discountAmt);
            return {
              id: doc.id,
              ...data,
              code,
              couponCode: code,
              productPrice: basePrice,
              discountPercentage: discountPercent,
              discountAmount: data.discountAmount || discountAmt,
              finalAmount: data.finalAmount || finalPrice
            };
          });
          setCoupons(rows);
          setLoading(false);
        },
        (error) => {
          console.warn("Coupons snapshot error:", error);
          setLoading(false);
        }
      );

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  const generateRandomSuffix = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let res = "";
    for (let i = 0; i < 4; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  // Standalone Calculator Logic
  const calcBaseNum = parseFloat(calcBasePrice) || 0;
  const calcDiscNum = parseFloat(calcDiscountPercent) || 0;
  const calcDiscAmt = Math.round((calcBaseNum * calcDiscNum) / 100);
  const calcFinalAmt = Math.max(0, calcBaseNum - calcDiscAmt);

  // Wealthoria Discount Calculations
  const wBaseNum = parseFloat(wealthoriaBasePrice) || DEFAULT_BOOK_PRICE;
  const wDiscountNum = parseFloat(wealthoriaDiscountPercent) || 0;
  const wDiscountAmount = Math.round((wBaseNum * wDiscountNum) / 100);
  const wFinalPrice = Math.max(0, wBaseNum - wDiscountAmount);

  // Influencer Discount Calculations
  const infBaseNum = parseFloat(influencerBasePrice) || DEFAULT_BOOK_PRICE;
  const infDiscountNum = parseFloat(influencerDiscountPercent) || 0;
  const infDiscountAmount = Math.round((infBaseNum * infDiscountNum) / 100);
  const infFinalPrice = Math.max(0, infBaseNum - infDiscountAmount);
  const infCommissionNum = parseFloat(influencerCommission) || 0;
  const infNetRevenue = Math.max(0, infFinalPrice - infCommissionNum);

  // Generate Wealthoria Prebook Coupons (with auto-generated document IDs)
  const handleGenerateWealthoria = async (e) => {
    e.preventDefault();
    const qty = parseInt(wealthoriaQuantity, 10);
    const disc = parseFloat(wealthoriaDiscountPercent);
    const baseP = parseFloat(wealthoriaBasePrice) || DEFAULT_BOOK_PRICE;

    if (!qty || qty < 1 || qty > 200) {
      alert("Please enter a valid quantity between 1 and 200.");
      return;
    }
    if (isNaN(disc) || disc < 1 || disc > 100) {
      alert("Please enter a valid discount percentage (1% - 100%).");
      return;
    }

    try {
      setGenerating(true);
      const batch = db.batch();
      const now = new Date();
      const baseCode = (wealthoriaCode || wealthoriaPrefix || "WEALTH").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");

      for (let i = 0; i < qty; i++) {
        let code = baseCode;
        if (qty > 1) {
          code = `${baseCode}-${generateRandomSuffix()}`;
        }
        // Use AUTO-GENERATED Firestore Document ID
        const docRef = db.collection("coupons").doc();
        const discountAmt = Math.round((baseP * disc) / 100);
        const finalPrice = Math.max(0, baseP - discountAmt);

        batch.set(docRef, {
          couponCode: code,
          code: code,
          productId: BOOK_PRODUCT_ID,
          productName: BOOK_PRODUCT_NAME,
          productPrice: baseP,
          discountPercentage: disc,
          discountAmount: discountAmt,
          finalAmount: finalPrice,
          type: "wealthoria",
          category: "Wealthoria Official Pre-book",
          timesUsed: 0,
          usedCount: 0,
          expiryDate: wealthoriaExpiry && wealthoriaExpiry.trim() ? wealthoriaExpiry.trim() : "2099-12-31",
          status: "active",
          isActive: true,
          createdAt: now,
          updatedAt: now
        });
      }

      await batch.commit();
      alert(`🎉 Successfully generated ${qty} Pre-book Coupon${qty === 1 ? "" : "s"}!`);
      if (qty === 1) setWealthoriaCode("");
    } catch (err) {
      console.error("Wealthoria coupon creation error:", err);
      alert(err.message || "Failed to generate pre-book coupons.");
    } finally {
      setGenerating(false);
    }
  };

  // Generate Influencer Prebook Coupon (with auto-generated document ID)
  const handleGenerateInfluencer = async (e) => {
    e.preventDefault();
    const name = influencerName.trim();
    let code = (influencerCode || influencerHandle || name).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    const disc = parseFloat(influencerDiscountPercent);
    const comm = parseFloat(influencerCommission) || 0;
    const baseP = parseFloat(influencerBasePrice) || DEFAULT_BOOK_PRICE;

    if (!name) {
      alert("Please enter the influencer's name.");
      return;
    }
    if (!code) {
      alert("Please enter a valid coupon code for this influencer.");
      return;
    }
    if (isNaN(disc) || disc < 1 || disc > 100) {
      alert("Please enter a valid discount percentage (1% - 100%).");
      return;
    }

    try {
      setGenerating(true);
      const now = new Date();
      // Use AUTO-GENERATED Firestore Document ID
      const docRef = db.collection("coupons").doc();
      const discountAmt = Math.round((baseP * disc) / 100);
      const finalPrice = Math.max(0, baseP - discountAmt);

      await docRef.set({
        couponCode: code,
        code: code,
        productId: BOOK_PRODUCT_ID,
        productName: BOOK_PRODUCT_NAME,
        productPrice: baseP,
        discountPercentage: disc,
        discountAmount: discountAmt,
        finalAmount: finalPrice,
        type: "influencer",
        category: "Influencer Pre-book Partner",
        influencerName: name,
        influencerHandle: influencerHandle.trim() || "",
        influencerPhone: influencerPhone.trim() || "",
        influencerCommission: comm,
        timesUsed: 0,
        usedCount: 0,
        expiryDate: influencerExpiry && influencerExpiry.trim() ? influencerExpiry.trim() : "2099-12-31",
        status: "active",
        isActive: true,
        createdAt: now,
        updatedAt: now
      });

      alert(`🌟 Influencer Pre-book coupon "${code}" created successfully for ${name}!`);
      setInfluencerName("");
      setInfluencerHandle("");
      setInfluencerCode("");
      setInfluencerPhone("");
    } catch (err) {
      console.error("Influencer coupon creation error:", err);
      alert(err.message || "Failed to create influencer coupon.");
    } finally {
      setGenerating(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (c) => {
    setEditingCoupon(c);
    setEditCode(c.couponCode || c.code || "");
    setEditDiscountPercent(String(c.discountPercentage || "20"));
    setEditBasePrice(String(c.productPrice || DEFAULT_BOOK_PRICE));
    setEditExpiry(c.expiryDate || "");
    setEditStatus(c.status || (c.isActive ? "active" : "inactive"));
    setEditInfluencerName(c.influencerName || "");
    setEditInfluencerHandle(c.influencerHandle || "");
    setEditInfluencerCommission(String(c.influencerCommission || "0"));
  };

  // Save Coupon Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingCoupon) return;

    const code = editCode.trim().toUpperCase();
    const disc = parseFloat(editDiscountPercent);
    const baseP = parseFloat(editBasePrice) || DEFAULT_BOOK_PRICE;

    if (!code) {
      alert("Coupon code cannot be empty.");
      return;
    }
    if (isNaN(disc) || disc < 1 || disc > 100) {
      alert("Please enter a valid discount percentage (1-100%).");
      return;
    }

    try {
      setSavingEdit(true);
      const discountAmt = Math.round((baseP * disc) / 100);
      const finalPrice = Math.max(0, baseP - discountAmt);
      const now = new Date();

      const updateData = {
        couponCode: code,
        code: code,
        discountPercentage: disc,
        productPrice: baseP,
        discountAmount: discountAmt,
        finalAmount: finalPrice,
        expiryDate: editExpiry && editExpiry.trim() ? editExpiry.trim() : "2099-12-31",
        status: editStatus,
        isActive: editStatus === "active",
        updatedAt: now
      };

      if (editingCoupon.type === "influencer") {
        updateData.influencerName = editInfluencerName.trim();
        updateData.influencerHandle = editInfluencerHandle.trim();
        updateData.influencerCommission = parseFloat(editInfluencerCommission) || 0;
      }

      await db.collection("coupons").doc(editingCoupon.id).update(updateData);
      alert(`Coupon "${code}" updated successfully!`);
      setEditingCoupon(null);
    } catch (err) {
      console.error("Error updating coupon:", err);
      alert("Failed to update coupon: " + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete coupon "${code || id}"?`)) return;
    try {
      await db.collection("coupons").doc(id).delete();
    } catch (err) {
      alert("Failed to delete coupon: " + err.message);
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleTestCode = () => {
    const q = testInput.trim().toUpperCase();
    if (!q) {
      setTestResult(null);
      return;
    }
    const match = coupons.find((c) => (c.couponCode || c.code || "").toUpperCase() === q);
    if (!match) {
      setTestResult({
        found: false,
        message: `Coupon "${q}" not found in database.`
      });
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const isExpired = match.expiryDate && match.expiryDate < today;

    setTestResult({
      found: true,
      match,
      isExpired,
      code: match.couponCode || match.code,
      discountPercent: match.discountPercentage,
      discountAmount: match.discountAmount,
      finalAmount: match.finalAmount,
      type: match.type
    });
  };

  // Filter coupons
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const cType = c.type || "wealthoria";
      if (filterType !== "all" && cType !== filterType) return false;

      const q = search.trim().toLowerCase();
      if (!q) return true;

      const codeStr = (c.couponCode || c.code || "").toLowerCase();
      const nameStr = (c.influencerName || "").toLowerCase();
      const handleStr = (c.influencerHandle || "").toLowerCase();

      return codeStr.includes(q) || nameStr.includes(q) || handleStr.includes(q);
    });
  }, [coupons, filterType, search]);

  const stats = useMemo(() => {
    let wealthoriaCount = 0;
    let influencerCount = 0;
    coupons.forEach((c) => {
      if (c.type === "influencer") influencerCount++;
      else wealthoriaCount++;
    });
    return {
      total: coupons.length,
      wealthoriaCount,
      influencerCount
    };
  }, [coupons]);

  return (
    <div
      className="admin-page"
      style={{
        maxWidth: 980,
        margin: "0 auto",
        padding: "16px 14px 40px",
        boxSizing: "border-box"
      }}
    >
      {/* Top Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #0d1b2a 0%, #1b263b 100%)",
          borderRadius: 14,
          padding: "20px 24px",
          color: "#fff",
          marginBottom: 16,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(225, 98, 43, 0.2)",
              border: "1px solid rgba(225, 98, 43, 0.4)",
              color: "#ff9d66",
              padding: "3px 10px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".05em",
              textTransform: "uppercase",
              marginBottom: 8
            }}
          >
            📖 Pre-Booking Promotion Engine
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "-.02em",
              color: "#fff"
            }}
          >
            Generate Pre-Book Coupon Code
          </h2>
          <div style={{ marginTop: 6, fontSize: 13, color: "#94a3b8" }}>
            Book: <strong style={{ color: "#fff" }}>{BOOK_PRODUCT_NAME}</strong> · Base Price: <strong style={{ color: "#ff9d66" }}>₹{DEFAULT_BOOK_PRICE}</strong>
          </div>
        </div>

        {/* Quick Product Badge */}
        <div
          style={{
            display: "flex",
            gap: 12,
            background: "rgba(255,255,255,0.06)",
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.1)"
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>Total Codes</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>{stats.total}</div>
          </div>
          <div style={{ width: 1, background: "rgba(255,255,255,0.15)" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>Wealthoria</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#38bdf8" }}>{stats.wealthoriaCount}</div>
          </div>
          <div style={{ width: 1, background: "rgba(255,255,255,0.15)" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>Influencer</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#a78bfa" }}>{stats.influencerCount}</div>
          </div>
        </div>
      </div>

      {/* =========================================================
          FEATURE 1: STANDALONE INSTANT DISCOUNT CALCULATOR
          (Simple, does not insert into table or DB)
          ========================================================= */}
      <div
        style={{
          background: "linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)",
          border: "1px solid #bbf7d0",
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>🧮</span>
            <div>
              <strong style={{ fontSize: 14, color: "#065f46" }}>Instant Price & Discount Calculator</strong>
              <div style={{ fontSize: 11, color: "#047857" }}>
                Test any amount (e.g. ₹1499, ₹999) & discount % without saving to database.
              </div>
            </div>
          </div>
          <span
            style={{
              background: "#dcfce7",
              color: "#15803d",
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 6
            }}
          >
            Sandbox / Calculation Tool
          </span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
          {/* Base Price Input */}
          <div style={{ minWidth: 140 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>
              Base Price (₹)
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#64748b" }}>₹</span>
              <input
                type="number"
                min="1"
                value={calcBasePrice}
                onChange={(e) => setCalcBasePrice(e.target.value)}
                placeholder="1499"
                style={{
                  width: 90,
                  padding: "7px 10px",
                  borderRadius: 6,
                  border: "1px solid #86efac",
                  fontSize: 14,
                  fontWeight: 700,
                  background: "#fff"
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
              {["499", "999", "1499", "1999"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCalcBasePrice(p)}
                  style={{
                    border: "none",
                    background: calcBasePrice === p ? "#16a34a" : "#fff",
                    color: calcBasePrice === p ? "#fff" : "#334155",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 5px",
                    borderRadius: 4,
                    cursor: "pointer"
                  }}
                >
                  ₹{p}
                </button>
              ))}
            </div>
          </div>

          {/* Discount Percentage Input */}
          <div style={{ minWidth: 140 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>
              Discount (%)
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input
                type="number"
                min="1"
                max="100"
                value={calcDiscountPercent}
                onChange={(e) => setCalcDiscountPercent(e.target.value)}
                placeholder="20"
                style={{
                  width: 70,
                  padding: "7px 10px",
                  borderRadius: 6,
                  border: "1px solid #86efac",
                  fontSize: 14,
                  fontWeight: 700,
                  background: "#fff"
                }}
              />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#64748b" }}>%</span>
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
              {["10", "15", "20", "25", "50"].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setCalcDiscountPercent(d)}
                  style={{
                    border: "none",
                    background: calcDiscountPercent === d ? "#16a34a" : "#fff",
                    color: calcDiscountPercent === d ? "#fff" : "#334155",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 5px",
                    borderRadius: 4,
                    cursor: "pointer"
                  }}
                >
                  {d}%
                </button>
              ))}
            </div>
          </div>

          {/* Result Card */}
          <div
            style={{
              flex: 1,
              minWidth: 260,
              background: "#fff",
              border: "1px solid #86efac",
              borderRadius: 8,
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12
            }}
          >
            <div>
              <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                Discount Amount
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#dc2626" }}>
                -₹{calcDiscAmt}{" "}
                <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>({calcDiscNum}%)</span>
              </div>
            </div>

            <div style={{ width: 1, height: 28, background: "#cbd5e1" }} />

            <div>
              <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                Final Customer Cost
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#16a34a" }}>
                ₹{calcFinalAmt}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setWealthoriaBasePrice(String(calcBaseNum));
                setWealthoriaDiscountPercent(String(calcDiscNum));
                setInfluencerBasePrice(String(calcBaseNum));
                setInfluencerDiscountPercent(String(calcDiscNum));
                alert(`Applied Base ₹${calcBaseNum} & ${calcDiscNum}% Discount to generation form!`);
              }}
              title="Copy to Generator Form"
              style={{
                background: "#059669",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "6px 12px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              <span>📋</span> Use in Form
            </button>
          </div>
        </div>
      </div>

      {/* Creation Mode Tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          background: "#f1f5f9",
          padding: 4,
          borderRadius: 10,
          marginBottom: 20
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("wealthoria")}
          style={{
            flex: 1,
            padding: "10px 16px",
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.2s",
            background: activeTab === "wealthoria" ? "#fff" : "transparent",
            color: activeTab === "wealthoria" ? "#0f172a" : "#64748b",
            boxShadow: activeTab === "wealthoria" ? "0 2px 6px rgba(0,0,0,0.08)" : "none"
          }}
        >
          <span>🏢</span> Wealthoria Pre-book Coupons
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("influencer")}
          style={{
            flex: 1,
            padding: "10px 16px",
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.2s",
            background: activeTab === "influencer" ? "#fff" : "transparent",
            color: activeTab === "influencer" ? "#0f172a" : "#64748b",
            boxShadow: activeTab === "influencer" ? "0 2px 6px rgba(0,0,0,0.08)" : "none"
          }}
        >
          <span>🌟</span> Influencer Pre-book Partner Codes
        </button>
      </div>

      {/* WEALTHORIA CREATION FORM */}
      {activeTab === "wealthoria" && (
        <form
          onSubmit={handleGenerateWealthoria}
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "20px 24px",
            marginBottom: 24,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                Generate Official Wealthoria Pre-book Coupon
              </h3>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                Saves to Firestore with auto-generated document ID. Expiry date is optional.
              </div>
            </div>
            <span
              style={{
                background: "#e0f2fe",
                color: "#0369a1",
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: 6
              }}
            >
              Pre-book Book Discount
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 16 }}>
            {/* Custom Code / Prefix */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Coupon Code / Prefix *
              </label>
              <input
                type="text"
                value={wealthoriaCode}
                onChange={(e) => setWealthoriaCode(e.target.value.toUpperCase())}
                placeholder="e.g. EARLYBIRD or WEALTH"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  boxSizing: "border-box"
                }}
              />
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                If quantity &gt; 1, random suffixes like <code style={{ color: "#0284c7" }}>-8A4F</code> will be appended.
              </div>
            </div>

            {/* Base Product Price */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Base Price (₹)
              </label>
              <input
                type="number"
                min="1"
                value={wealthoriaBasePrice}
                onChange={(e) => setWealthoriaBasePrice(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  fontWeight: 700,
                  boxSizing: "border-box"
                }}
                required
              />
            </div>

            {/* Discount Percentage */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Discount Percentage (%) *
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={wealthoriaDiscountPercent}
                  onChange={(e) => setWealthoriaDiscountPercent(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                    fontWeight: 700,
                    boxSizing: "border-box"
                  }}
                  required
                />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#64748b" }}>%</span>
              </div>
              <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                {["10", "15", "20", "25", "50"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setWealthoriaDiscountPercent(p)}
                    style={{
                      background: wealthoriaDiscountPercent === p ? "#0284c7" : "#f1f5f9",
                      color: wealthoriaDiscountPercent === p ? "#fff" : "#475569",
                      border: "none",
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Quantity to Generate
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={wealthoriaQuantity}
                onChange={(e) => setWealthoriaQuantity(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  boxSizing: "border-box"
                }}
                required
              />
            </div>

            {/* Expiry Date (OPTIONAL) */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Expiry Date <span style={{ color: "#94a3b8", fontWeight: 400 }}>(Optional)</span>
              </label>
              <input
                type="date"
                value={wealthoriaExpiry}
                onChange={(e) => setWealthoriaExpiry(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  boxSizing: "border-box"
                }}
              />
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                Leave empty for lifetime / no expiration.
              </div>
            </div>
          </div>

          {/* LIVE PRICE PREVIEW BOX */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "12px 16px",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 16
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: "#64748b" }}>Base Price</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", textDecoration: "line-through" }}>
                  ₹{wBaseNum}
                </div>
              </div>
              <div style={{ fontSize: 18, color: "#cbd5e1" }}>→</div>
              <div>
                <div style={{ fontSize: 11, color: "#0284c7" }}>Pre-book Discount ({wDiscountNum}%)</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0284c7" }}>-₹{wDiscountAmount}</div>
              </div>
              <div style={{ fontSize: 18, color: "#cbd5e1" }}>=</div>
              <div>
                <div style={{ fontSize: 11, color: "#16a34a" }}>Customer Final Price</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#16a34a" }}>₹{wFinalPrice}</div>
              </div>
            </div>

            <button
              type="submit"
              disabled={generating}
              style={{
                background: "#0284c7",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 20px",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6
              }}
            >
              {generating ? "Generating..." : `⚡ Generate ${wealthoriaQuantity} Coupon${wealthoriaQuantity === "1" ? "" : "s"}`}
            </button>
          </div>
        </form>
      )}

      {/* INFLUENCER CREATION FORM */}
      {activeTab === "influencer" && (
        <form
          onSubmit={handleGenerateInfluencer}
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "20px 24px",
            marginBottom: 24,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                Generate Influencer / Creator Pre-book Promo Code
              </h3>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                Saves with auto-generated document ID. Expiry date is optional.
              </div>
            </div>
            <span
              style={{
                background: "#f3e8ff",
                color: "#7e22ce",
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: 6
              }}
            >
              Influencer Affiliate
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 16 }}>
            {/* Influencer Name */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Influencer / Creator Name *
              </label>
              <input
                type="text"
                value={influencerName}
                onChange={(e) => setInfluencerName(e.target.value)}
                placeholder="e.g. Vijay Kumar"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  boxSizing: "border-box"
                }}
                required
              />
            </div>

            {/* Influencer Handle / Channel */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Handle / Social Channel
              </label>
              <input
                type="text"
                value={influencerHandle}
                onChange={(e) => setInfluencerHandle(e.target.value)}
                placeholder="e.g. @tech_kannada / YouTube"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* Custom Influencer Code */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Custom Coupon Code *
              </label>
              <input
                type="text"
                value={influencerCode}
                onChange={(e) => setInfluencerCode(e.target.value.toUpperCase())}
                placeholder="e.g. VIJAY20 or KANNADA15"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  boxSizing: "border-box"
                }}
                required
              />
            </div>

            {/* Base Price */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Base Price (₹)
              </label>
              <input
                type="number"
                min="1"
                value={influencerBasePrice}
                onChange={(e) => setInfluencerBasePrice(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  fontWeight: 700,
                  boxSizing: "border-box"
                }}
                required
              />
            </div>

            {/* Viewer Discount Percentage */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Customer Discount (%) *
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={influencerDiscountPercent}
                  onChange={(e) => setInfluencerDiscountPercent(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                    fontWeight: 700,
                    boxSizing: "border-box"
                  }}
                  required
                />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#64748b" }}>%</span>
              </div>
            </div>

            {/* Influencer Commission per Book */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Commission per Book Sold (₹)
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#64748b" }}>₹</span>
                <input
                  type="number"
                  min="0"
                  value={influencerCommission}
                  onChange={(e) => setInfluencerCommission(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                    fontWeight: 700,
                    boxSizing: "border-box"
                  }}
                />
              </div>
            </div>

            {/* Influencer Phone / Contact */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Contact Phone / WhatsApp
              </label>
              <input
                type="tel"
                value={influencerPhone}
                onChange={(e) => setInfluencerPhone(e.target.value)}
                placeholder="10 digit phone number"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* Expiry Date (OPTIONAL) */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Expiry Date <span style={{ color: "#94a3b8", fontWeight: 400 }}>(Optional)</span>
              </label>
              <input
                type="date"
                value={influencerExpiry}
                onChange={(e) => setInfluencerExpiry(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  boxSizing: "border-box"
                }}
              />
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                Leave empty for lifetime / no expiration.
              </div>
            </div>
          </div>

          {/* INFLUENCER ECONOMICS PREVIEW */}
          <div
            style={{
              background: "#faf5ff",
              border: "1px solid #e9d5ff",
              borderRadius: 8,
              padding: "12px 16px",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 16
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: "#64748b" }}>Base Price</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>₹{infBaseNum}</div>
              </div>
              <div style={{ fontSize: 14, color: "#cbd5e1" }}>-</div>
              <div>
                <div style={{ fontSize: 11, color: "#7e22ce" }}>Discount ({infDiscountNum}%)</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#7e22ce" }}>-₹{infDiscountAmount}</div>
              </div>
              <div style={{ fontSize: 14, color: "#cbd5e1" }}>=</div>
              <div>
                <div style={{ fontSize: 11, color: "#16a34a" }}>Customer Pays</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#16a34a" }}>₹{infFinalPrice}</div>
              </div>
              <div style={{ width: 1, height: 28, background: "#d8b4fe" }} />
              <div>
                <div style={{ fontSize: 11, color: "#c026d3" }}>Creator Commission</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#c026d3" }}>₹{infCommissionNum} / book</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#0284c7" }}>Net Wealthoria Revenue</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0284c7" }}>₹{infNetRevenue}</div>
              </div>
            </div>

            <button
              type="submit"
              disabled={generating}
              style={{
                background: "#7e22ce",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 20px",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6
              }}
            >
              {generating ? "Creating..." : "🌟 Create Influencer Code"}
            </button>
          </div>
        </form>
      )}

      {/* QUICK COUPON TESTER */}
      <div
        style={{
          background: "#fff",
          border: "1px dashed #cbd5e1",
          borderRadius: 10,
          padding: "12px 16px",
          marginBottom: 24,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 260 }}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
              Test Book Coupon Code
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleTestCode()}
                placeholder="Enter coupon code to preview discount..."
                style={{
                  flex: 1,
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase"
                }}
              />
              <button
                type="button"
                onClick={handleTestCode}
                style={{
                  background: "#334155",
                  color: "#fff",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Validate
              </button>
            </div>
          </div>
        </div>

        {testResult && (
          <div
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 12,
              background: testResult.found ? (testResult.isExpired ? "#fef3c7" : "#ecfdf5") : "#fee2e2",
              border: `1px solid ${testResult.found ? (testResult.isExpired ? "#fde68a" : "#a7f3d0") : "#fecaca"}`,
              color: testResult.found ? (testResult.isExpired ? "#92400e" : "#065f46") : "#991b1b"
            }}
          >
            {testResult.found ? (
              <div>
                <strong>{testResult.code}</strong>: {testResult.discountPercent}% Discount (-₹{testResult.discountAmount}) · Final Customer Price: <strong>₹{testResult.finalAmount}</strong>
                {testResult.isExpired && <span style={{ color: "#b45309", marginLeft: 6 }}>(⚠️ Expired)</span>}
              </div>
            ) : (
              <div>{testResult.message}</div>
            )}
          </div>
        )}
      </div>

      {/* EXISTING COUPONS LIST & SEARCH */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: "16px 20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 16
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
              Active Book Coupon Codes ({filteredCoupons.length})
            </h3>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              Manage and edit generated coupons for book purchases.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Filter Pill */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                fontSize: 12,
                color: "#334155"
              }}
            >
              <option value="all">All Types ({coupons.length})</option>
              <option value="wealthoria">Wealthoria Official ({stats.wealthoriaCount})</option>
              <option value="influencer">Influencer Partner ({stats.influencerCount})</option>
            </select>

            {/* Search Input */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code or creator..."
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                fontSize: 12,
                width: 180
              }}
            />
          </div>
        </div>

        {/* Table / List */}
        {loading ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "#64748b" }}>Loading coupons...</div>
        ) : filteredCoupons.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "#94a3b8" }}>
            No pre-booking coupons found. Generate one using the tabs above!
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f1f5f9", color: "#64748b", fontSize: 11, textTransform: "uppercase" }}>
                  <th style={{ padding: "10px 8px" }}>Doc ID / Code</th>
                  <th style={{ padding: "10px 8px" }}>Type / Creator</th>
                  <th style={{ padding: "10px 8px" }}>Discount</th>
                  <th style={{ padding: "10px 8px" }}>Customer Price</th>
                  <th style={{ padding: "10px 8px" }}>Commission</th>
                  <th style={{ padding: "10px 8px" }}>Times Used</th>
                  <th style={{ padding: "10px 8px" }}>Expiry</th>
                  <th style={{ padding: "10px 8px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoupons.map((c) => {
                  const code = c.couponCode || c.code || c.id;
                  const isInf = c.type === "influencer";
                  const basePrice = c.productPrice || DEFAULT_BOOK_PRICE;
                  const discPercent = c.discountPercentage || 0;
                  const discAmt = c.discountAmount || Math.round((basePrice * discPercent) / 100);
                  const finalPrice = c.finalAmount || Math.max(0, basePrice - discAmt);
                  const today = new Date().toISOString().split("T")[0];
                  const isExpired = c.expiryDate && c.expiryDate < today;

                  return (
                    <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {/* Code + Doc ID + Copy */}
                      <td style={{ padding: "10px 8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontWeight: 800,
                              fontSize: 13,
                              color: "#0f172a",
                              background: "#f1f5f9",
                              padding: "2px 6px",
                              borderRadius: 4
                            }}
                          >
                            {code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(code)}
                            title="Copy Code"
                            style={{
                              border: "none",
                              background: "none",
                              cursor: "pointer",
                              fontSize: 12,
                              padding: 2,
                              color: copiedCode === code ? "#16a34a" : "#64748b"
                            }}
                          >
                            {copiedCode === code ? "✓" : "📋"}
                          </button>
                        </div>
                        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2, fontFamily: "monospace" }}>
                          ID: {c.id}
                        </div>
                      </td>

                      {/* Type & Creator */}
                      <td style={{ padding: "10px 8px" }}>
                        {isInf ? (
                          <div>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                background: "#f3e8ff",
                                color: "#7e22ce",
                                padding: "2px 6px",
                                borderRadius: 4,
                                textTransform: "uppercase"
                              }}
                            >
                              Influencer
                            </span>
                            <div style={{ fontWeight: 600, color: "#1e293b", marginTop: 2 }}>
                              {c.influencerName || "Partner"}
                            </div>
                            {c.influencerHandle && (
                              <div style={{ fontSize: 11, color: "#94a3b8" }}>{c.influencerHandle}</div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                background: "#e0f2fe",
                                color: "#0369a1",
                                padding: "2px 6px",
                                borderRadius: 4,
                                textTransform: "uppercase"
                              }}
                            >
                              Wealthoria
                            </span>
                            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Official Campaign</div>
                          </div>
                        )}
                      </td>

                      {/* Discount */}
                      <td style={{ padding: "10px 8px" }}>
                        <span style={{ fontWeight: 700, color: "#0284c7" }}>{discPercent}%</span>
                        <div style={{ fontSize: 11, color: "#64748b" }}>-₹{discAmt} off</div>
                      </td>

                      {/* Customer Price */}
                      <td style={{ padding: "10px 8px" }}>
                        <span style={{ fontWeight: 800, color: "#16a34a" }}>₹{finalPrice}</span>
                        <div style={{ fontSize: 10, color: "#94a3b8", textDecoration: "line-through" }}>
                          ₹{basePrice}
                        </div>
                      </td>

                      {/* Commission */}
                      <td style={{ padding: "10px 8px" }}>
                        {isInf && c.influencerCommission ? (
                          <span style={{ fontWeight: 700, color: "#c026d3", fontSize: 12 }}>
                            ₹{c.influencerCommission} / order
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: 11 }}>—</span>
                        )}
                      </td>

                      {/* Times Used */}
                      <td style={{ padding: "10px 8px" }}>
                        {(() => {
                          const realUsage = Math.max(
                            Number(c.timesUsed || c.usedCount || 0),
                            orderUsageMap[code] || 0,
                            orderUsageMap[c.id] || 0
                          );

                          // Auto sync back to Firestore doc if count is higher
                          if (realUsage > Number(c.timesUsed || 0) && db) {
                            db.collection("coupons").doc(c.id).update({
                              timesUsed: realUsage,
                              usedCount: realUsage
                            }).catch(() => {});
                          }

                          return realUsage > 0 ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                background: "#ecfdf5",
                                color: "#047857",
                                border: "1px solid #a7f3d0",
                                fontWeight: 800,
                                fontSize: 12,
                                padding: "3px 8px",
                                borderRadius: 6
                              }}
                            >
                              🔥 {realUsage} {realUsage === 1 ? "order" : "orders"}
                            </span>
                          ) : (
                            <span style={{ fontWeight: 600, color: "#94a3b8" }}>0</span>
                          );
                        })()}
                      </td>

                      {/* Expiry */}
                      <td style={{ padding: "10px 8px" }}>
                        <div style={{ fontSize: 12, color: isExpired ? "#dc2626" : "#475569" }}>
                          {c.expiryDate && c.expiryDate !== "2099-12-31" ? c.expiryDate : "No Expiry"}
                        </div>
                        {isExpired && (
                          <span style={{ fontSize: 10, color: "#dc2626", fontWeight: 700 }}>EXPIRED</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "10px 8px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            title="Edit Coupon"
                            style={{
                              background: "#f1f5f9",
                              border: "1px solid #cbd5e1",
                              color: "#334155",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 600,
                              borderRadius: 4,
                              padding: "3px 8px"
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id, code)}
                            title="Delete Coupon"
                            style={{
                              background: "#fee2e2",
                              border: "1px solid #fca5a5",
                              color: "#ef4444",
                              cursor: "pointer",
                              fontSize: 12,
                              borderRadius: 4,
                              padding: "3px 6px"
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================
          EDIT COUPON MODAL
          ========================================================= */}
      {editingCoupon && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              maxWidth: 520,
              width: "100%",
              padding: "24px 28px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                  Edit Coupon Code
                </h3>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  Document ID: <code style={{ color: "#0284c7" }}>{editingCoupon.id}</code>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCoupon(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                  color: "#64748b"
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                {/* Coupon Code */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      boxSizing: "border-box"
                    }}
                    required
                  />
                </div>

                {/* Base Price */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Base Price (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editBasePrice}
                    onChange={(e) => setEditBasePrice(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      fontWeight: 700,
                      boxSizing: "border-box"
                    }}
                    required
                  />
                </div>

                {/* Discount Percentage */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Discount Percentage (%) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={editDiscountPercent}
                    onChange={(e) => setEditDiscountPercent(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      fontWeight: 700,
                      boxSizing: "border-box"
                    }}
                    required
                  />
                </div>

                {/* Expiry Date (OPTIONAL) */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Expiry Date <span style={{ color: "#94a3b8", fontWeight: 400 }}>(Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={editExpiry}
                    onChange={(e) => setEditExpiry(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      boxSizing: "border-box"
                    }}
                  />
                </div>
              </div>

              {/* Influencer-Specific Fields */}
              {editingCoupon.type === "influencer" && (
                <div
                  style={{
                    background: "#faf5ff",
                    border: "1px solid #e9d5ff",
                    borderRadius: 8,
                    padding: "12px",
                    marginBottom: 14
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#7e22ce", marginBottom: 8 }}>
                    Influencer Details
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#334155", marginBottom: 2 }}>
                        Influencer Name
                      </label>
                      <input
                        type="text"
                        value={editInfluencerName}
                        onChange={(e) => setEditInfluencerName(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          borderRadius: 6,
                          border: "1px solid #cbd5e1",
                          fontSize: 12,
                          boxSizing: "border-box"
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#334155", marginBottom: 2 }}>
                        Handle / Channel
                      </label>
                      <input
                        type="text"
                        value={editInfluencerHandle}
                        onChange={(e) => setEditInfluencerHandle(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          borderRadius: 6,
                          border: "1px solid #cbd5e1",
                          fontSize: 12,
                          boxSizing: "border-box"
                        }}
                      />
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#334155", marginBottom: 2 }}>
                        Commission per Order (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editInfluencerCommission}
                        onChange={(e) => setEditInfluencerCommission(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          borderRadius: 6,
                          border: "1px solid #cbd5e1",
                          fontSize: 12,
                          fontWeight: 700,
                          boxSizing: "border-box"
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Status */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                    boxSizing: "border-box"
                  }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive / Paused</option>
                </select>
              </div>

              {/* Price Calculation Preview in Edit Modal */}
              <div
                style={{
                  background: "#f1f5f9",
                  padding: "10px 14px",
                  borderRadius: 8,
                  marginBottom: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12
                }}
              >
                <div>
                  Base: <strong>₹{parseFloat(editBasePrice) || 0}</strong>
                </div>
                <div>
                  Discount: <strong style={{ color: "#0284c7" }}>-{editDiscountPercent}% (₹{Math.round(((parseFloat(editBasePrice) || 0) * (parseFloat(editDiscountPercent) || 0)) / 100)})</strong>
                </div>
                <div>
                  Customer Pays: <strong style={{ color: "#16a34a", fontSize: 14 }}>₹{Math.max(0, (parseFloat(editBasePrice) || 0) - Math.round(((parseFloat(editBasePrice) || 0) * (parseFloat(editDiscountPercent) || 0)) / 100))}</strong>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setEditingCoupon(null)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    color: "#475569",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  style={{
                    padding: "8px 20px",
                    borderRadius: 6,
                    border: "none",
                    background: "#0284c7",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

window.GenerateCoupon = GenerateCoupon;
export default GenerateCoupon;
