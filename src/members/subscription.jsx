import React from "react";

/* global React, window */

const { useState } = React;

// TEMPORARY FALLBACK FLAG: Set to true while Razorpay fee-bearer / banking update is in progress.
// Set to false as soon as Razorpay confirms Fee Bearer is reverted to Merchant.
const BANK_MAINTENANCE_MODE = true;

function MemberSubscription() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const goToLogin = () => {
    if (typeof window.membersNavigate === "function") {
      window.membersNavigate("/members/login");
      return;
    }

    window.history.pushState(
      {},
      "",
      "/members/login"
    );

    window.dispatchEvent(
      new PopStateEvent("popstate")
    );
  };

 const subscribeNow = async () => {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone.trim();

  setErrors({});

   
     if (!cleanName) {
  setErrors({ name: "Please enter your full name." });
  return;
}

const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
if (!emailPattern.test(cleanEmail)) {
  setErrors({ email: "Please enter a valid email address." });
  return;
}

const typoDomains = {
  "gamil.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmal.com": "gmail.com",
  "yaho.com": "yahoo.com",
  "outlok.com": "outlook.com"
};
const domain = cleanEmail.split("@")[1];
if (domain && typoDomains[domain]) {
  setErrors({ email: `Did you mean @${typoDomains[domain]}? Please check your email spelling.` });
  return;
}

if (!cleanPhone) {
  setErrors({ phone: "Please enter your phone number." });
  return;
}

if (!/^[0-9]{10}$/.test(cleanPhone)) {
  setErrors({ phone: "Please enter a valid 10 digit phone number." });
  return;
}

if (BANK_MAINTENANCE_MODE) {
  try {
    setLoading(true);

    const waitlistDoc = {
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      createdAt: window.firebase?.firestore?.FieldValue?.serverTimestamp() || new Date(),
      createdDateStr: new Date().toISOString(),
      source: "subscription_bank_maintenance",
      status: "new",
      notes: "Priority waitlist lead during bank maintenance (Nov 7 - 9, 2026)"
    };

    if (window.db) {
      // 1. Save to enquiries collection (guaranteed allow create: if true in Firestore security rules)
      await window.db.collection("enquiries").add({
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        type: "subscription_waitlist",
        interest: "Membership Priority Waitlist (Bank Maintenance)",
        message: "Customer requested priority membership activation when bank maintenance completes on Monday.",
        source: "subscription_page_fallback",
        status: "new",
        createdAt: window.firebase?.firestore?.FieldValue?.serverTimestamp() || new Date(),
        date: new Date().toLocaleDateString("en-IN")
      });

      // 2. Also try writing to dedicated subscription_waitlist without blocking on permissions
      try {
        await window.db.collection("subscription_waitlist").add(waitlistDoc);
      } catch (subErr) {
        console.warn("subscription_waitlist secondary write (safely stored in enquiries):", subErr);
      }
    }

    setIsSubmitted(true);
    setLoading(false);
    return;
  } catch (err) {
    console.error("Waitlist submission error:", err);
    alert("Unable to save your details right now. Please try again or WhatsApp our team directly.");
    setLoading(false);
    return;
  }
}

if (!password) {
  setErrors({ password: "Please create a password." });
  return;
}

if (password.length < 6) {
  setErrors({ password: "Password must be at least 6 characters." });
  return;
}

if (!confirmPassword) {
  setErrors({ confirmPassword: "Please confirm your password." });
  return;
}

if (password !== confirmPassword) {
  setErrors({ confirmPassword: "Passwords do not match." });
  return;
}
     

    if (typeof window.Razorpay !== "function") {

       setErrors("Razorpay is not loaded.");
return;
    
    }

    try {
      setLoading(true);

      /*
       * IMPORTANT:
       * We do NOT create a Firestore document here.
       * Member + subscription are created only after payment.
       */

      const response = await fetch(
        "https://asia-south1-wealthoria-6fc11.cloudfunctions.net/api/subscription/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
            password,
            
          })
        }
      );

      let data;

      try {
        data = await response.json();
      } catch (error) {
        console.error(
          "Subscription response parse error:",
          error
        );

        throw new Error(
          "Invalid response from subscription server."
        );
      }

   
      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
          "Unable to create subscription."
        );
      }

      const options = {
        key: data.key,

        subscription_id:
          data.subscriptionId,

        name: "Wealthoria",

        description:
          "₹99 Monthly Premium Membership",

        prefill: {
          name: cleanName,
          email: cleanEmail,
          contact: cleanPhone
        },

        notes: {
          plan:
            "Wealthoria Premium - Monthly"
        },

        theme: {
          color: "#ff843f"
        },

        modal: {
          // Checkout closed without paying: let the user try again.
          ondismiss: function () {
            setLoading(false);
          }
        },

        handler: async function (
          razorpayResponse
        ) {
          try {
         

            const finalSubscriptionId =
              razorpayResponse
                .razorpay_subscription_id ||
              data.subscriptionId;

            const finalPaymentId =
              razorpayResponse
                .razorpay_payment_id;

            if (
              !finalSubscriptionId ||
              !finalPaymentId
            ) {
              throw new Error(
                "Payment information is incomplete."
              );
            }

            /*
             * COMPLETE ON BACKEND
             *
             * Backend will:
             * 1. verify the Razorpay subscription/payment
             * 2. use existing members collection
             * 3. create member if needed
             * 4. hash password
             * 5. create subscription document
             * 6. save memberId into subscription
             */

            const completeResponse =
              await fetch(
                "https://asia-south1-wealthoria-6fc11.cloudfunctions.net/api/subscription/complete",
                {
                  method: "POST",

                  headers: {
                    "Content-Type":
                      "application/json"
                  },

                  body:
                    JSON.stringify({
                      name: cleanName,
                      email: cleanEmail,
                      phone: cleanPhone,
                      password,
                      subscriptionId:
                        finalSubscriptionId,
                      paymentId:
                        finalPaymentId,
                      razorpay_signature:
                        razorpayResponse
                          .razorpay_signature
                    })
                }
              );

            let completeData;

            try {
              completeData =
                await completeResponse.json();
            } catch (error) {
              console.error(
                "Completion response parse error:",
                error
              );

              throw new Error(
                "Invalid response from completion server."
              );
            }

          
            /*
             * 202 = payment received, Razorpay is still confirming it.
             * The membership activates automatically (webhook), so this
             * is NOT an error.
             */
            if (
              completeResponse.status === 202 &&
              completeData.pending
            ) {
              alert(
                "Payment received! Your membership is being activated and will be ready in a few minutes. You can log in shortly."
              );

              goToLogin();
              return;
            }

            if (
              !completeResponse.ok ||
              !completeData.success
            ) {
              throw new Error(
                completeData.message ||
                "Payment succeeded but account creation failed."
              );
            }

            if (typeof window.fbq === "function") {
              window.fbq("track", "Subscribe", {
                value: 99,
                currency: "INR",
                predicted_ltv: 99,
              });
            }

            alert(
              "Subscription successful! Your member account has been created."
            );

            goToLogin();

          } catch (error) {
            console.error(
              "Subscription completion error:",
              error
            );

            alert(
              error.message ||
              "Payment succeeded but account creation failed. Please contact support."
            );
          } finally {
            setLoading(false);
          }
        }
      };

      const razorpay =
        new window.Razorpay(options);

    razorpay.on(
  "payment.failed",
  function (paymentResponse) {
    // Razorpay shows the error and lets the user retry with another
    // method inside the same checkout, so do not reload the page here.
    console.error(
      "Payment failed:",
      paymentResponse?.error
    );
  }
);

      razorpay.open();

    } catch (error) {
      console.error(
        "Subscription error:",
        error
      );

      alert(
        error.message ||
        "Something went wrong. Please try again."
      );

      setLoading(false);
    }
  };

  return (
    <>
      <style>{`

       
        body {
          min-height: 100vh;

          font-family:
            "Poppins",
            sans-serif;

          background:
            radial-gradient(
              circle at top right,
              rgba(255, 132, 63, 0.08),
              transparent 30%
            ),
            #f7f8f5;

          color: #222;

          display: flex;
          align-items: center;
          justify-content: center;

          padding:
            30px 20px;
        }


        .members-field-error {
  margin-top: 6px;
  color: #e8473f;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
}
        .subscription-page {
          width: 100%;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .form-card {
          width: 100%;
          max-width: 470px;

          background: #ffffff;

          padding: 40px;

          border-radius: 24px;

          box-shadow:
            0 18px 50px
            rgba(0, 0, 0, 0.10);

          border:
            1px solid #eeeeee;
        }

        .brand {
          text-align: center;
          margin-bottom: 25px;
        }


        .members-form-error {
  margin: 0 0 14px;
  color: #e8473f;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.5;
}
        .brand-name {
          color: #ff6b35;

          font-size: 20px;

          font-weight: 800;

          letter-spacing: 2px;
        }

        .form-header {
          margin-bottom: 28px;
        }

        .form-header .eyebrow {
          display: block;

          margin-bottom: 8px;

          color: #ff6b35;

          font-size: 11px;

          font-weight: 700;

          letter-spacing: 1.4px;

          text-transform: uppercase;
        }

        .form-header h1 {
          margin: 0 0 10px;

          color: #222;

          font-size: 32px;

          line-height: 1.2;

          font-weight: 700;
        }

        .subscription-page .form-card .existing-member {
  margin-top: 14px !important;
  text-align: center !important;
  color: #777 !important;
  font-size: 13px !important;
  line-height: 1.5 !important;
}

.subscription-page .form-card .existing-member button {
  display: inline !important;

  width: auto !important;
  height: auto !important;

  margin: 0 !important;
  padding: 0 !important;

  border: none !important;
  border-radius: 0 !important;

  background: transparent !important;

  color: #e8473f !important;

  font-family: inherit !important;
  font-size: 13px !important;
  font-weight: 600 !important;

  cursor: pointer !important;

  box-shadow: none !important;
  opacity: 1 !important;

  text-decoration: none !important;
}

.subscription-page .form-card .existing-member button:hover {
  color: #c73530 !important;
  text-decoration: underline !important;
}

        .form-header p {
          margin: 0;

          color: #666;

          font-size: 14px;

          line-height: 1.7;
        }

        .input-group {
          margin-bottom: 20px;
        }

        .input-group label {
          display: block;

          margin-bottom: 7px;

          color: #333;

          font-size: 14px;

          font-weight: 600;
        }



        .pay-box h3 {
          margin: 0 0 5px;

          color: #222;

          font-size: 16px;

          font-weight: 600;
        }

        .pay-box p {
          margin: 0;

          color: #777;

          font-size: 13px;
        }



        .subscribe-button:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .existing-member {
          margin-top: 18px;

          text-align: center;

          color: #777;

          font-size: 13px;
        }

        .existing-member button {
          border: none;

          background: transparent;

          color: #ff6b35;

          font-weight: 700;

          cursor: pointer;

          padding: 0;
        }

        .secure {
          margin-top: 17px;

          text-align: center;

          color: #777;

          font-size: 12px;

          line-height: 1.5;
        }

        .form-note {
          margin-top: 8px;

          text-align: center;

          color: #999;

          font-size: 11px;

          line-height: 1.5;
        }

        @media (max-width: 600px) {

          body {
            padding: 15px;
          }

          .form-card {
            padding: 28px 22px;
            border-radius: 20px;
          }

          .form-header h1 {
            font-size: 28px;
          }

          .amount {
            font-size: 27px;
          }

        }

      `}</style>

      <div className="subscription-page">

        <div className="form-card">

          <div className="brand">
            <div className="brand-name">
              WEALTHORIA
            </div>
          </div>

          {isSubmitted ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 10 }}>
                Thank You, {name}!
              </h2>
              <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.6, maxWidth: 380, margin: "0 auto 20px" }}>
                We have securely received your details. Our team will contact you directly on <strong>Monday</strong> to activate your membership with priority access.
              </p>
              <div style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: "14px 18px",
                fontSize: 13,
                color: "#334155",
                textAlign: "left",
                maxWidth: 320,
                margin: "0 auto 24px"
              }}>
                <div style={{ marginBottom: 6 }}><strong>👤 Name:</strong> {name}</div>
                <div style={{ marginBottom: 6 }}><strong>📞 Phone:</strong> {phone}</div>
                <div><strong>📧 Email:</strong> {email}</div>
              </div>
              <button
                type="button"
                className="members-login-button"
                onClick={() => window.location.href = "/"}
                style={{ maxWidth: 220, margin: "0 auto" }}
              >
                Back to Home
              </button>
            </div>
          ) : (
            <>
              <div className="form-header">
                <span className="eyebrow">
                  WEALTHORIA PREMIUM
                </span>

                <h1>
                  {BANK_MAINTENANCE_MODE ? "Priority Membership Registration" : "Subscribe Now"}
                </h1>

                <p>
                  Start your Wealthoria Premium membership and access premium investment learning resources.
                </p>

                {BANK_MAINTENANCE_MODE && (
                  <div style={{
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    borderRadius: 14,
                    padding: "16px 18px",
                    marginTop: 18,
                    textAlign: "left"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 20 }}>🏦</span>
                      <strong style={{ color: "#92400e", fontSize: 14, fontWeight: 700 }}>
                        Notice: Scheduled Banking Partner Maintenance
                      </strong>
                    </div>
                    <p style={{ color: "#78350f", fontSize: 13, lineHeight: 1.55, margin: "0 0 10px 0" }}>
                      We are currently experiencing a temporary banking partner maintenance with auto-debit recurring mandates. We kindly request you to wait until <strong>Monday</strong>.
                    </p>
                    <p style={{ color: "#92400e", fontSize: 12.5, lineHeight: 1.5, margin: 0, fontWeight: 600 }}>
                      Please fill in your Name, Phone Number, and Email below. Once the update is completed on Monday, our team will personally contact you to activate your membership with priority access.
                    </p>
                  </div>
                )}
              </div>

              <div className="members-field">
                <label htmlFor="subscription-name">
                  Full Name
                </label>
                <input
                  id="subscription-name"
                  type="text"
                  placeholder="Enter your full name"
                  autoComplete="name"
                  value={name}
                  disabled={loading}
                  onChange={(event) => setName(event.target.value)}
                />
                {errors.name && (
                  <div className="members-field-error">
                    {errors.name}
                  </div>
                )}
              </div>

              <div className="members-field">
                <label htmlFor="subscription-email">
                  Email Address
                </label>
                <input
                  id="subscription-email"
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  value={email}
                  disabled={loading}
                  onChange={(event) => setEmail(event.target.value)}
                />
                {errors.email && (
                  <div className="members-field-error">
                    {errors.email}
                  </div>
                )}
              </div>

              <div className="members-field">
                <label htmlFor="subscription-phone">
                  Phone Number
                </label>
                <input
                  id="subscription-phone"
                  type="tel"
                  placeholder="Enter your 10 digit phone number"
                  autoComplete="tel"
                  maxLength={10}
                  value={phone}
                  disabled={loading}
                  onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))}
                />
                {errors.phone && (
                  <div className="members-field-error">
                    {errors.phone}
                  </div>
                )}
              </div>

              {!BANK_MAINTENANCE_MODE && (
                <>
                  <div className="members-field">
                    <label htmlFor="subscription-password">
                      Create Password
                    </label>
                    <input
                      id="subscription-password"
                      type="password"
                      placeholder="Create your password"
                      autoComplete="new-password"
                      value={password}
                      disabled={loading}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    {errors.password && (
                      <div className="members-field-error">
                        {errors.password}
                      </div>
                    )}
                  </div>

                  <div className="members-field">
                    <label htmlFor="subscription-confirm-password">
                      Confirm Password
                    </label>
                    <input
                      id="subscription-confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      disabled={loading}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                    {errors.confirmPassword && (
                      <div className="members-field-error">
                        {errors.confirmPassword}
                      </div>
                    )}
                  </div>
                </>
              )}

              <button
                className="members-login-button"
                type="submit"
                onClick={subscribeNow}
                disabled={loading}
              >
                {loading
                  ? "Submitting..."
                  : BANK_MAINTENANCE_MODE
                    ? "Register for Priority Activation"
                    : "Subscribe Now"}
              </button>

              <div className="members-login-subscribe">
                <span>Already a subscriber?{" "}</span>
                <button
                  type="button"
                  className="members-link"
                  onClick={goToLogin}
                >
                  Login here
                </button>
              </div>

              <div className="secure">
                {BANK_MAINTENANCE_MODE ? "🔒 Your details are securely recorded" : "Secure payment powered by Razorpay"}
              </div>

              <div className="form-note">
                {BANK_MAINTENANCE_MODE
                  ? "Our team will personally reach out to you on Monday."
                  : "Your payment information is securely processed."}
              </div>
            </>
          )}

        </div>

      </div>
    </>
  );
}

window.MemberSubscription =
  MemberSubscription;

