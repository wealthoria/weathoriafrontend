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
   VECTOR SVG ICONS FOR FILE ATTACHMENTS
   ========================================================================= */

const PaperclipIcon = ({ size = 18, color = "currentColor", strokeWidth = 2, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ verticalAlign: "middle", flexShrink: 0, ...style }}
  >
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const UploadCloudIcon = ({ size = 26, color = "currentColor", strokeWidth = 2, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ verticalAlign: "middle", flexShrink: 0, ...style }}
  >
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M12 12v9" />
    <path d="m16 16-4-4-4 4" />
  </svg>
);

const PdfFileIcon = ({ size = 20, color = "#dc2626", style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ verticalAlign: "middle", flexShrink: 0, ...style }}
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M10 13v4" />
    <path d="M10 13h1.5a1.5 1.5 0 0 1 0 3H10" />
  </svg>
);

const DocumentIcon = ({ size = 20, color = "#64748b", style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ verticalAlign: "middle", flexShrink: 0, ...style }}
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" x2="8" y1="13" y2="13" />
    <line x1="16" x2="8" y1="17" y2="17" />
  </svg>
);

const TrashIcon = ({ size = 15, color = "currentColor", style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ verticalAlign: "middle", flexShrink: 0, ...style }}
  >
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" x2="10" y1="11" y2="17" />
    <line x1="14" x2="14" y1="11" y2="17" />
  </svg>
);

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

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/* =========================================================================
   CUSTOM EMAIL COMPONENT WITH FILE ATTACHMENTS (IMAGE, PDF, ETC.)
   ========================================================================= */

const Customemail = () => {
  const [activeTemplate, setActiveTemplate] = useState("prebook");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(TEMPLATES.prebook.subject);
  const [message, setMessage] = useState(TEMPLATES.prebook.body);

  // Attachments State
  const [attachments, setAttachments] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const MAX_TOTAL_BYTES = 20 * 1024 * 1024; // 20 MB total limit
  const MAX_SINGLE_FILE_BYTES = 12 * 1024 * 1024; // 12 MB single file limit

  const totalAttachmentBytes = attachments.reduce((sum, a) => sum + (a.size || 0), 0);

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

  const handleFiles = (fileList) => {
    if (!fileList || !fileList.length) return;
    setError("");

    const newFiles = Array.from(fileList);
    let currentTotal = totalAttachmentBytes;

    newFiles.forEach((file) => {
      if (file.size > MAX_SINGLE_FILE_BYTES) {
        setError(`"${file.name}" is too large (${formatFileSize(file.size)}). Max allowed per file is 12 MB.`);
        return;
      }
      if (currentTotal + file.size > MAX_TOTAL_BYTES) {
        setError(`Cannot attach "${file.name}". Total attachment size would exceed 20 MB limit.`);
        return;
      }
      currentTotal += file.size;

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        setAttachments((prev) => [
          ...prev,
          {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            size: file.size,
            type: file.type || "application/octet-stream",
            dataUrl,
            isImage: file.type ? file.type.startsWith("image/") : false,
            isPdf: file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
          }
        ]);
      };
      reader.onerror = () => {
        setError(`Failed to read "${file.name}".`);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (id) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
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

    if (totalAttachmentBytes > MAX_TOTAL_BYTES) {
      setError(`Total attachments (${formatFileSize(totalAttachmentBytes)}) exceed the 20 MB limit.`);
      return;
    }

    try {
      setSending(true);
      setError("");
      setSuccess("");

      const token = await currentUser.getIdToken(true);

      const payload = {
        email: to,
        subject: subject.trim(),
        message: message.trim(),
        attachments: attachments.map((a) => ({
          filename: a.name,
          contentType: a.type,
          content: a.dataUrl
        }))
      };

      const response = await fetch(`${API_BASE_URL}/api/admin/notifications/prebook-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to send email.");
      }

      const attachNote = attachments.length > 0 ? ` with ${attachments.length} attachment${attachments.length > 1 ? "s" : ""}` : "";
      setSuccess(
        isTest
          ? `Test email sent successfully to ${to}${attachNote}!`
          : `Email sent successfully to ${to}${attachNote}!`
      );

      if (!isTest) {
        setEmail("");
        setAttachments([]);
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
          Send custom emails with attachments (images, PDFs, documents) for pre-book delivery, login help, or member updates.
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

        {/* 5. Attachments Section (Image, PDF, Documents) */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", display: "flex", alignItems: "center", gap: 7, margin: 0 }}>
              <PaperclipIcon size={16} color="#0284c7" strokeWidth={2.2} />
              <span>Attachments (Images, PDFs, Documents, etc.)</span>
            </label>
            {attachments.length > 0 && (
              <span style={{ fontSize: 12, color: totalAttachmentBytes > MAX_TOTAL_BYTES ? "#dc2626" : "#64748b", fontWeight: 600 }}>
                {attachments.length} {attachments.length === 1 ? "file" : "files"} ({formatFileSize(totalAttachmentBytes)} / 20 MB)
              </span>
            )}
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer && e.dataTransfer.files) {
                handleFiles(e.dataTransfer.files);
              }
            }}
            onClick={() => {
              const fileInput = document.getElementById("custom-email-file-input");
              if (fileInput) fileInput.click();
            }}
            style={{
              border: dragOver ? "2px dashed #0284c7" : "2px dashed #cbd5e1",
              background: dragOver ? "#f0f9ff" : "#f8fafc",
              borderRadius: 12,
              padding: "24px 18px",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            <input
              id="custom-email-file-input"
              type="file"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  handleFiles(e.target.files);
                  e.target.value = "";
                }
              }}
              style={{ display: "none" }}
            />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  background: "#e0f2fe",
                  border: "1px solid #bae6fd",
                  color: "#0284c7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(2, 132, 199, 0.12)"
                }}
              >
                <UploadCloudIcon size={26} color="#0284c7" strokeWidth={2.2} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <span>Click to browse or drag & drop files here</span>
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  Supports Images (PNG, JPG, WEBP), PDF documents, Excel, Word, or any file format (Up to 12 MB per file, 20 MB total)
                </div>
              </div>
            </div>
          </div>

          {/* Attached Files List */}
          {attachments.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {attachments.map((file) => (
                <div
                  key={file.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    gap: 12,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                    {file.isImage ? (
                      <img
                        src={file.dataUrl}
                        alt={file.name}
                        style={{
                          width: 40,
                          height: 40,
                          objectFit: "cover",
                          borderRadius: 6,
                          border: "1px solid #e2e8f0",
                          flexShrink: 0
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          background: file.isPdf ? "#fee2e2" : "#f1f5f9",
                          color: file.isPdf ? "#dc2626" : "#475569",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}
                      >
                        {file.isPdf ? (
                          <PdfFileIcon size={22} color="#dc2626" />
                        ) : (
                          <DocumentIcon size={22} color="#475569" />
                        )}
                      </div>
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#1e293b",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                        title={file.name}
                      >
                        {file.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                        {formatFileSize(file.size)} • {file.type || "file"}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveAttachment(file.id);
                    }}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      color: "#64748b",
                      cursor: "pointer",
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s ease",
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#fee2e2";
                      e.currentTarget.style.borderColor = "#fecaca";
                      e.currentTarget.style.color = "#dc2626";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#f8fafc";
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.color = "#64748b";
                    }}
                    title="Remove attachment"
                  >
                    <TrashIcon size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 6. Buttons */}
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
              gap: 8,
              boxShadow: "0 2px 4px rgba(2, 132, 199, 0.2)"
            }}
          >
            {MIcon && <MIcon name="send" size={16} />}
            <span>
              {sending
                ? `Sending${attachments.length ? ` with ${attachments.length} attachment${attachments.length > 1 ? "s" : ""}` : ""}...`
                : attachments.length > 0
                ? `Send Email (${attachments.length} attachment${attachments.length > 1 ? "s" : ""})`
                : "Send Email"}
            </span>
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
