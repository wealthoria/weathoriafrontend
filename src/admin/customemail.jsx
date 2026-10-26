/* global React, window */
import React, { useState } from "react";
import { auth } from "../firebase";

const { MIcon } = window;

const API_BASE_URL =
  typeof window !== "undefined" && window.WEALTHORIA_API_BASE !== undefined
    ? window.WEALTHORIA_API_BASE
    : "https://asia-south1-wealthoria-6fc11.cloudfunctions.net";

const SUPPORT_EMAIL = "support@wealthoria.in";
const SUPPORT_PHONE = "+91 90197 59001";

/* =========================================================================
   SIMPLE EMAIL TEMPLATES
   ========================================================================= */

const TEMPLATES = {
  prebook: {
    label: "📦 Pre-Book Delivery (5-6 Days)",
    subject: "Your 'Investment Science' Book is Dispatched - Delivery in 5-6 Working Days",
    body: `Dear Customer,

Thank you for purchasing "Investment Science" (ಹೂಡಿಕೆಯ ವಿಜ್ಞಾನ).

Your book has been dispatched from our fulfillment center and is on its way to your delivery address!

• Expected delivery time: 5 to 6 working days.

If you do not receive your parcel within 5 - 6 working days, or if you need any assistance with your shipment, please reply directly to this email or contact us:
• WhatsApp / Phone: ${SUPPORT_PHONE}
• Email: ${SUPPORT_EMAIL}

Warm regards,
Wealthoria Fulfillment Team`
  },

  login: {
    label: "🔑 Login & Forgot Password Help",
    subject: "Steps to Reset Password & Login to Wealthoria Member Portal",
    body: `Dear Member,

If you are facing difficulty logging into your Wealthoria Member Portal account, please follow these simple steps:

1. Open the Member Login page:
   https://wealthoria.in/members/login

2. Click on "Forgot Password?" below the login form.

3. Enter your registered email address and submit to receive the password reset link.

4. Check your email inbox and spam folder for the password reset email from Wealthoria.

5. Click the link to set your new password, then return to https://wealthoria.in/members/login and log in.

⚠️ IF IT IS STILL NOT WORKING AT ALL:
Please contact our support team directly:
• WhatsApp / Phone: ${SUPPORT_PHONE}
• Email: ${SUPPORT_EMAIL}

We will verify your account and help you access your portal immediately.

Warm regards,
Wealthoria Support Team`
  },

  subscription: {
    label: "💳 Subscription Status",
    subject: "Wealthoria Membership Subscription Update",
    body: `Dear Member,

This is an update regarding your Wealthoria Member Portal subscription.

To ensure uninterrupted access to all premium video lessons, market analysis, and weekly research reports, please check your subscription status at:
https://wealthoria.in/subscription

If you have already paid or need assistance verifying your payment, please contact us:
• WhatsApp / Phone: ${SUPPORT_PHONE}
• Email: ${SUPPORT_EMAIL}

Warm regards,
Wealthoria Team`
  },

  blank: {
    label: "📝 Blank / Custom",
    subject: "",
    body: `Dear Member,



Warm regards,
Wealthoria Team
Email: ${SUPPORT_EMAIL} | Phone: ${SUPPORT_PHONE}`
  }
};

/* =========================================================================
   SIMPLE CUSTOM EMAIL COMPONENT
   ========================================================================= */

const Customemail = () => {
  const [activeTemplate, setActiveTemplate] = useState("prebook");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(TEMPLATES.prebook.subject);
  const [message, setMessage] = useState(TEMPLATES.prebook.body);

  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleApplyTemplate = (key) => {
    const t = TEMPLATES[key];
    if (!t) return;
    setActiveTemplate(key);
    setSubject(t.subject);
    setMessage(t.body);
    setError("");
    setSuccess(`Loaded "${t.label}" template`);
    setTimeout(() => setSuccess(""), 2000);
  };

  const handleSend = async (isTest = false) => {
    const currentUser = auth?.currentUser || window.auth?.currentUser;
    if (!currentUser) {
      setError("Admin authentication required. Please log in again.");
      return;
    }

    const to = isTest ? (currentUser.email || SUPPORT_EMAIL) : email.trim();

    if (!to) {
      setError("Please enter a recipient email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!subject.trim()) {
      setError("Please enter an email subject.");
      return;
    }

    if (!message.trim()) {
      setError("Please enter the email message.");
      return;
    }

    try {
      setSending(true);
      setError("");
      setSuccess("");

      const token = await currentUser.getIdToken(true);

      const response = await fetch(`${API_BASE_URL}/api/admin/notifications/prebook-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email: to,
          subject: subject.trim(),
          message: message.trim()
        })
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to send email.");
      }

      setSuccess(
        isTest
          ? `Test email sent successfully to ${to}!`
          : `Email sent successfully to ${to}!`
      );

      if (!isTest) {
        setEmail("");
      }
    } catch (err) {
      setError(err.message || "Failed to send email. Please check your connection.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "20px 16px 48px" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: "var(--text, #111827)" }}>
          Send Custom Email
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "var(--muted, #64748b)" }}>
          Send quick operational emails for pre-book delivery, login assistance, or subscriptions.
        </p>
      </div>

      {/* Main Card */}
      <div
        style={{
          background: "var(--surface, #ffffff)",
          border: "1px solid var(--border, #e2e8f0)",
          borderRadius: 14,
          padding: 24,
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)"
        }}
      >
        {/* Alerts */}
        {error && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 8,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontSize: 14,
              marginBottom: 16
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 8,
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#047857",
              fontSize: 14,
              marginBottom: 16
            }}
          >
            {success}
          </div>
        )}

        {/* 1. Quick Template Selector */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
            Choose Email Template:
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(TEMPLATES).map(([key, t]) => {
              const isActive = activeTemplate === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleApplyTemplate(key)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: isActive ? "2px solid #0284c7" : "1px solid #cbd5e1",
                    background: isActive ? "#f0f9ff" : "#ffffff",
                    color: isActive ? "#0369a1" : "#334155",
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Recipient Email */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1e293b", marginBottom: 6 }}>
            Recipient Email Address <span style={{ color: "#e11d48" }}>*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. customer@gmail.com"
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 14,
              boxSizing: "border-box",
              outline: "none"
            }}
          />
        </div>

        {/* 3. Subject Line */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1e293b", marginBottom: 6 }}>
            Subject Line <span style={{ color: "#e11d48" }}>*</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter email subject"
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 14,
              fontWeight: 500,
              boxSizing: "border-box",
              outline: "none"
            }}
          />
        </div>

        {/* 4. Message Body */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1e293b", marginBottom: 6 }}>
            Message Body <span style={{ color: "#e11d48" }}>*</span>
          </label>
          <textarea
            rows={10}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your email message..."
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 13.5,
              lineHeight: 1.6,
              boxSizing: "border-box",
              fontFamily: "inherit",
              outline: "none",
              resize: "vertical"
            }}
          />
        </div>

        {/* 5. Buttons */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            disabled={sending}
            onClick={() => handleSend(false)}
            style={{
              flex: 2,
              padding: "12px 24px",
              borderRadius: 8,
              border: "none",
              background: sending ? "#94a3b8" : "#0284c7",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 700,
              cursor: sending ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8
            }}
          >
            {MIcon && <MIcon name="send" size={16} />}
            <span>{sending ? "Sending..." : "Send Email"}</span>
          </button>

          <button
            type="button"
            disabled={sending}
            onClick={() => handleSend(true)}
            style={{
              flex: 1,
              padding: "12px 18px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#475569",
              fontSize: 13,
              fontWeight: 600,
              cursor: sending ? "not-allowed" : "pointer"
            }}
          >
            Send Test to Me
          </button>
        </div>
      </div>
    </div>
  );
};

// Router globals
window.Customemail = Customemail;
window.AdminCustomEmail = Customemail;

export default Customemail;