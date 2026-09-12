import React, { useEffect, useState } from "react";

const API_BASE_URL =
  "https://asia-south1-wealthoria-6fc11.cloudfunctions.net/api";

const CREATE_ORDER_URL = `${API_BASE_URL}/prebook/create-order`;
const VERIFY_PAYMENT_URL = `${API_BASE_URL}/prebook/verify-payment`;

const TEST_PRICE = 1; // Testing price. Change to 999 only when backend is restored to ₹999.

const emptyForm = {
  name: "",
  email: "",
  phone: "",

  shippingName: "",
  shippingPhone: "",
  address: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",

  billingSameAsDelivery: true,
  billingName: "",
  billingPhone: "",
  billingAddress: "",
  billingLandmark: "",
  billingCity: "",
  billingState: "",
  billingPincode: "",
  billingCountry: "India",
};

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function validate(form) {
  const errors = {};

  if (!form.name.trim()) errors.name = "Name is required.";
  if (!form.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  const phone = form.phone.replace(/\D/g, "");
  if (!phone) {
    errors.phone = "Phone number is required.";
  } else if (phone.length !== 10) {
    errors.phone = "Enter a valid 10 digit mobile number.";
  }

  if (!form.address.trim()) errors.address = "Delivery address is required.";
  if (!form.city.trim()) errors.city = "City is required.";
  if (!form.state.trim()) errors.state = "State is required.";

  const pincode = form.pincode.replace(/\D/g, "");
  if (!pincode) {
    errors.pincode = "Pincode is required.";
  } else if (pincode.length !== 6) {
    errors.pincode = "Enter a valid 6 digit pincode.";
  }

  if (!form.billingSameAsDelivery) {
    if (!form.billingName.trim()) {
      errors.billingName = "Billing name is required.";
    }
    if (!form.billingPhone.trim()) {
      errors.billingPhone = "Billing phone is required.";
    }
    if (!form.billingAddress.trim()) {
      errors.billingAddress = "Billing address is required.";
    }
    if (!form.billingCity.trim()) {
      errors.billingCity = "Billing city is required.";
    }
    if (!form.billingState.trim()) {
      errors.billingState = "Billing state is required.";
    }

    const billingPincode = form.billingPincode.replace(/\D/g, "");
    if (!billingPincode) {
      errors.billingPincode = "Billing pincode is required.";
    } else if (billingPincode.length !== 6) {
      errors.billingPincode = "Enter a valid 6 digit pincode.";
    }
  }

  return errors;
}

function Field({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  placeholder = "",
  maxLength,
  autoComplete,
}) {
  return (
    <div className="prebook-field">
      <label htmlFor={`prebook-${name}`}>
        {label} <span>*</span>
      </label>

      <input
        id={`prebook-${name}`}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
      />

      {error && <div className="prebook-error">{error}</div>}
    </div>
  );
}

export default function PrebookForm() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    // One reusable global opener. Any Pre-book button can call this.
    window.openBookPrebookPopup = () => {
      setOpen(true);
      setErrorMessage("");
      setErrors({});
      setSuccess(null);
      document.body.style.overflow = "hidden";
    };

    return () => {
      delete window.openBookPrebookPopup;
      document.body.style.overflow = "";
    };
  }, []);

  const close = () => {
    if (processing) return;

    setOpen(false);
    setErrorMessage("");
    setErrors({});
    setSuccess(null);
    setForm(emptyForm);
    document.body.style.overflow = "";
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    let nextValue = type === "checkbox" ? checked : value;

    if (
      ["phone", "shippingPhone", "billingPhone"].includes(name)
    ) {
      nextValue = value.replace(/\D/g, "").slice(0, 10);
    }

    if (["pincode", "billingPincode"].includes(name)) {
      nextValue = value.replace(/\D/g, "").slice(0, 6);
    }

    setForm((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    setErrorMessage("");
  };

  const submitPayment = async (event) => {
    event.preventDefault();

    const validationErrors = validate(form);

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);

      const firstError = Object.keys(validationErrors)[0];
      document
        .getElementById(`prebook-${firstError}`)
        ?.focus();

      return;
    }

    try {
      setProcessing(true);
      setErrorMessage("");

      const razorpayLoaded = await loadRazorpayScript();

      if (!razorpayLoaded) {
        throw new Error(
          "Unable to load Razorpay. Please check your internet connection and try again."
        );
      }

      /*
       * Backend is the source of truth for the payable amount.
       * We intentionally do not send an amount from the browser.
       */
      const createResponse = await fetch(CREATE_ORDER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product: {
            name: "ಹೂಡಿಕೆಯ ವಿಜ್ಞಾನ",
            quantity: 1,
          },
        }),
      });

      const createData = await createResponse.json();

      if (!createResponse.ok || !createData?.success) {
        throw new Error(
          createData?.message || "Unable to create pre-book order."
        );
      }

      const orderId = createData.orderId;
      const keyId = createData.keyId;

      if (!orderId || !keyId) {
        throw new Error("Invalid payment order received from server.");
      }

      const shippingAddress = {
        name: form.name.trim(),
        phone: form.phone.replace(/\D/g, ""),
        address: form.address.trim(),
        landmark: form.landmark.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.replace(/\D/g, ""),
        country: "India",
      };

      const billingAddress = form.billingSameAsDelivery
        ? {
            ...shippingAddress,
            sameAsDelivery: true,
          }
        : {
            name: form.billingName.trim(),
            phone: form.billingPhone.replace(/\D/g, ""),
            address: form.billingAddress.trim(),
            landmark: form.billingLandmark.trim(),
            city: form.billingCity.trim(),
            state: form.billingState.trim(),
            pincode: form.billingPincode.replace(/\D/g, ""),
            country: "India",
            sameAsDelivery: false,
          };

      const options = {
        key: keyId,
        amount: createData.amount,
        currency: createData.currency || "INR",
        name: "Wealthoria",
        description: "Pre-book — ಹೂಡಿಕೆಯ ವಿಜ್ಞಾನ",
        order_id: orderId,

        prefill: {
          name: form.name.trim(),
          email: form.email.trim(),
          contact: form.phone.replace(/\D/g, ""),
        },

        notes: {
          product: "ಹೂಡಿಕೆಯ ವಿಜ್ಞಾನ",
          source: "website",
        },

        theme: {
          color: "#e8473f",
        },

        handler: async (paymentResponse) => {
          try {
            setProcessing(true);

            const verifyResponse = await fetch(VERIFY_PAYMENT_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id:
                  paymentResponse.razorpay_order_id,
                razorpay_payment_id:
                  paymentResponse.razorpay_payment_id,
                razorpay_signature:
                  paymentResponse.razorpay_signature,

                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.replace(/\D/g, ""),

                shippingAddress,
                billingAddress,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok || !verifyData?.success) {
              throw new Error(
                verifyData?.message ||
                  "Payment was received, but order verification failed."
              );
            }

            setSuccess({
              bookingId: verifyData.bookingId,
              orderId:
                verifyData.orderId ||
                paymentResponse.razorpay_order_id,
              paymentId:
                verifyData.paymentId ||
                paymentResponse.razorpay_payment_id,
              emailSent: verifyData.emailSent === true,
            });

            setForm(emptyForm);
          } catch (error) {
            console.error("Pre-book payment verification error:", error);
            setErrorMessage(
              error.message ||
                "Unable to verify the payment. Please contact Wealthoria support with your Razorpay payment ID."
            );
          } finally {
            setProcessing(false);
          }
        },

        modal: {
          ondismiss: () => {
            setProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response) => {
        console.error("Razorpay payment failed:", response?.error);

        setProcessing(false);
        setErrorMessage(
          response?.error?.description ||
            "Payment failed. Please try again."
        );
      });

      razorpay.open();
    } catch (error) {
      console.error("Pre-book checkout error:", error);

      setProcessing(false);
      setErrorMessage(
        error.message ||
          "Unable to start checkout. Please try again."
      );
    }
  };

  if (!open) return null;

  return (
    <div
      className="prebook-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prebook-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !processing) {
          close();
        }
      }}
    >
      <div className="prebook-modal">
        <button
          type="button"
          className="prebook-close"
          onClick={close}
          disabled={processing}
          aria-label="Close"
        >
          ×
        </button>

        {success ? (
          <div className="prebook-success">
            <div className="prebook-success-mark">✓</div>

            <div className="prebook-eyebrow">
              Pre-booking confirmed
            </div>

            <h2>Thank you for pre-booking</h2>

            <p>
              Your payment was successful and your order has been
              confirmed.
            </p>

            <div className="prebook-booking-card">
              <span>Booking ID</span>
              <strong>{success.bookingId || "Confirmed"}</strong>
            </div>

            <div className="prebook-success-details">
              <div>
                <span>Order ID</span>
                <b>{success.orderId}</b>
              </div>

              <div>
                <span>Payment ID</span>
                <b>{success.paymentId}</b>
              </div>
            </div>

            <p className="prebook-success-note">
              A confirmation email will be sent to your registered
              email address.
            </p>

            <button
              type="button"
              className="prebook-primary"
              onClick={close}
            >
              Done
            </button>
          </div>
        ) : (
          <div className="prebook-layout">
            <aside className="prebook-info">
              <div className="prebook-brand">WEALTHORIA</div>

              <div className="prebook-eyebrow">
                PRE-BOOKING OPEN
              </div>

              <h2>ಹೂಡಿಕೆಯ ವಿಜ್ಞಾನ</h2>

              <p>
                Share market ಅನ್ನು ಮೂಲದಿಂದ ಕಲಿಸುವ ಕನ್ನಡ ಪುಸ್ತಕ.
                42 ಅಧ್ಯಾಯಗಳು ಮತ್ತು 565 ಪುಟಗಳು.
              </p>

              <div className="prebook-price">
                <strong>₹{TEST_PRICE}</strong>
                <span>₹1499</span>
              </div>

              <div className="prebook-test-note">
                Testing checkout — final pre-booking price is ₹999.
              </div>

              <ul>
                <li>Shipment starts October 1, 2026</li>
                <li>Free delivery across India</li>
                <li>Full refund before dispatch</li>
                <li>Delivery in 5–8 working days after dispatch</li>
              </ul>
            </aside>

            <div className="prebook-form-area">
              <div className="prebook-heading">
                <div className="prebook-eyebrow">
                  SECURE YOUR COPY
                </div>

                <h1 id="prebook-title">Pre-book your book</h1>

                <p>
                  Enter your details and delivery address to continue
                  to secure payment.
                </p>
              </div>

              <form onSubmit={submitPayment} noValidate>
                <div className="prebook-section-title">
                  Customer Details
                </div>

                <Field
                  label="Full Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  error={errors.name}
                  placeholder="Enter your full name"
                  autoComplete="name"
                />

                <Field
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  error={errors.email}
                  placeholder="you@example.com"
                  autoComplete="email"
                />

                <Field
                  label="Phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  error={errors.phone}
                  placeholder="10 digit mobile number"
                  maxLength={10}
                  autoComplete="tel"
                />

                <div className="prebook-section-title">
                  Delivery Address
                </div>

                <div className="prebook-field">
                  <label htmlFor="prebook-address">
                    Address <span>*</span>
                  </label>

                  <textarea
                    id="prebook-address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="House / flat, street, area"
                    autoComplete="street-address"
                    aria-invalid={Boolean(errors.address)}
                  />

                  {errors.address && (
                    <div className="prebook-error">
                      {errors.address}
                    </div>
                  )}
                </div>

                <Field
                  label="Landmark"
                  name="landmark"
                  value={form.landmark}
                  onChange={handleChange}
                  placeholder="Nearby landmark (optional)"
                />

                <div className="prebook-grid-2">
                  <Field
                    label="City"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    error={errors.city}
                    placeholder="City"
                    autoComplete="address-level2"
                  />

                  <Field
                    label="State"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    error={errors.state}
                    placeholder="State"
                    autoComplete="address-level1"
                  />
                </div>

                <div className="prebook-grid-2">
                  <Field
                    label="Pincode"
                    name="pincode"
                    value={form.pincode}
                    onChange={handleChange}
                    error={errors.pincode}
                    placeholder="6 digit pincode"
                    maxLength={6}
                    autoComplete="postal-code"
                  />

                  <div className="prebook-field">
                    <label htmlFor="prebook-country">Country</label>
                    <input
                      id="prebook-country"
                      value="India"
                      readOnly
                    />
                  </div>
                </div>

                <div className="prebook-section-title">
                  Billing Address
                </div>

                <label className="prebook-checkbox">
                  <input
                    type="checkbox"
                    name="billingSameAsDelivery"
                    checked={form.billingSameAsDelivery}
                    onChange={handleChange}
                  />
                  <span>Billing address is same as delivery address</span>
                </label>

                {!form.billingSameAsDelivery && (
                  <>
                    <Field
                      label="Billing Name"
                      name="billingName"
                      value={form.billingName}
                      onChange={handleChange}
                      error={errors.billingName}
                      placeholder="Billing full name"
                    />

                    <Field
                      label="Billing Phone"
                      name="billingPhone"
                      type="tel"
                      value={form.billingPhone}
                      onChange={handleChange}
                      error={errors.billingPhone}
                      placeholder="10 digit mobile number"
                      maxLength={10}
                    />

                    <div className="prebook-field">
                      <label htmlFor="prebook-billingAddress">
                        Billing Address <span>*</span>
                      </label>

                      <textarea
                        id="prebook-billingAddress"
                        name="billingAddress"
                        value={form.billingAddress}
                        onChange={handleChange}
                        placeholder="Billing address"
                        aria-invalid={Boolean(errors.billingAddress)}
                      />

                      {errors.billingAddress && (
                        <div className="prebook-error">
                          {errors.billingAddress}
                        </div>
                      )}
                    </div>

                    <Field
                      label="Billing Landmark"
                      name="billingLandmark"
                      value={form.billingLandmark}
                      onChange={handleChange}
                      placeholder="Optional"
                    />

                    <div className="prebook-grid-2">
                      <Field
                        label="Billing City"
                        name="billingCity"
                        value={form.billingCity}
                        onChange={handleChange}
                        error={errors.billingCity}
                        placeholder="City"
                      />

                      <Field
                        label="Billing State"
                        name="billingState"
                        value={form.billingState}
                        onChange={handleChange}
                        error={errors.billingState}
                        placeholder="State"
                      />
                    </div>

                    <div className="prebook-grid-2">
                      <Field
                        label="Billing Pincode"
                        name="billingPincode"
                        value={form.billingPincode}
                        onChange={handleChange}
                        error={errors.billingPincode}
                        placeholder="6 digit pincode"
                        maxLength={6}
                      />

                      <div className="prebook-field">
                        <label>Country</label>
                        <input value="India" readOnly />
                      </div>
                    </div>
                  </>
                )}

                {errorMessage && (
                  <div className="prebook-alert" role="alert">
                    {errorMessage}
                  </div>
                )}

                <div className="prebook-total">
                  <span>Pre-book amount</span>
                  <strong>₹{TEST_PRICE}</strong>
                </div>

                <button
                  type="submit"
                  className="prebook-primary"
                  disabled={processing}
                >
                  {processing
                    ? "Processing..."
                    : `Pay ₹${TEST_PRICE} & Pre-book`}
                </button>

                <p className="prebook-secure">
                  You will be redirected to Razorpay's secure checkout
                  to complete payment.
                </p>
              </form>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .prebook-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 22px;
          background: rgba(17, 32, 31, 0.72);
          backdrop-filter: blur(7px);
          overflow-y: auto;
        }

        .prebook-modal {
          position: relative;
          width: min(1120px, 100%);
          max-height: calc(100vh - 44px);
          overflow: hidden;
          background: #f7f8f3;
          color: #11201f;
          border-radius: 24px;
          box-shadow: 0 28px 80px rgba(17, 32, 31, 0.28);
        }

        .prebook-layout {
          display: grid;
          grid-template-columns: 0.8fr 1.2fr;
          min-height: 680px;
          max-height: calc(100vh - 44px);
        }

        .prebook-info {
          position: relative;
          overflow: hidden;
          padding: 52px 42px;
          color: #f3f5ef;
          background:
            radial-gradient(circle at 90% 12%, rgba(244,130,60,.28), transparent 30%),
            #11201f;
        }

        .prebook-info::after {
          content: "";
          position: absolute;
          width: 260px;
          height: 260px;
          right: -130px;
          bottom: -100px;
          border: 1px solid rgba(244,130,60,.25);
          border-radius: 50%;
        }

        .prebook-brand {
          margin-bottom: 72px;
          font-family: Georgia, serif;
          font-size: 18px;
          letter-spacing: .13em;
        }

        .prebook-eyebrow {
          margin-bottom: 12px;
          color: #e8473f;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .14em;
        }

        .prebook-info .prebook-eyebrow {
          color: #f4823c;
        }

        .prebook-info h2 {
          margin: 0 0 16px;
          font-family: "Noto Serif Kannada", "Nirmala UI", serif;
          font-size: clamp(30px, 4vw, 44px);
          line-height: 1.25;
          color: #f3f5ef;
        }

        .prebook-info p {
          max-width: 40ch;
          margin: 0 0 28px;
          color: rgba(243,245,239,.75);
          line-height: 1.75;
        }

        .prebook-price {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 8px;
        }

        .prebook-price strong {
          font-family: Georgia, serif;
          font-size: 46px;
          color: #fff;
        }

        .prebook-price span {
          color: rgba(243,245,239,.55);
          font-family: Georgia, serif;
          text-decoration: line-through;
        }

        .prebook-test-note {
          margin-bottom: 28px;
          color: #f4823c;
          font-size: 12px;
        }

        .prebook-info ul {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .prebook-info li {
          position: relative;
          margin: 0;
          padding: 8px 0 8px 24px;
          color: rgba(243,245,239,.8);
          font-size: 14px;
        }

        .prebook-info li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #f4823c;
          font-weight: 700;
        }

        .prebook-form-area {
          min-width: 0;
          overflow-y: auto;
          padding: 48px 54px 42px;
          background: #f7f8f3;
        }

        .prebook-heading {
          margin-bottom: 26px;
        }

        .prebook-heading h1 {
          margin: 0 0 7px;
          color: #11201f;
          font-size: 30px;
          line-height: 1.25;
        }

        .prebook-heading p {
          margin: 0;
          color: #69716a;
          font-size: 14px;
        }

        .prebook-section-title {
          margin: 28px 0 14px;
          padding-bottom: 9px;
          border-bottom: 1px solid rgba(17,32,31,.12);
          color: #11201f;
          font-size: 15px;
          font-weight: 700;
        }

        .prebook-field {
          margin-bottom: 16px;
        }

        .prebook-field label {
          display: block;
          margin-bottom: 6px;
          color: #273532;
          font-size: 13px;
          font-weight: 600;
        }

        .prebook-field label span {
          color: #e8473f;
        }

        .prebook-field input,
        .prebook-field textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid rgba(17,32,31,.16);
          border-radius: 12px;
          background: #fff;
          color: #11201f;
          padding: 12px 13px;
          outline: none;
          font: inherit;
          font-size: 14px;
          transition: border-color .15s ease, box-shadow .15s ease;
        }

        .prebook-field input {
          height: 47px;
        }

        .prebook-field textarea {
          min-height: 84px;
          resize: vertical;
        }

        .prebook-field input:focus,
        .prebook-field textarea:focus {
          border-color: #e8473f;
          box-shadow: 0 0 0 3px rgba(232,71,63,.09);
        }

        .prebook-field input[readonly] {
          background: #eef0ea;
          color: #59625d;
        }

        .prebook-field input[aria-invalid="true"],
        .prebook-field textarea[aria-invalid="true"] {
          border-color: #e8473f;
        }

        .prebook-error {
          margin-top: 5px;
          color: #bf392e;
          font-size: 12px;
        }

        .prebook-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .prebook-checkbox {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin: 2px 0 8px;
          color: #4d5752;
          cursor: pointer;
          font-size: 13px;
        }

        .prebook-checkbox input {
          width: 17px;
          height: 17px;
          margin: 0;
          accent-color: #e8473f;
        }

        .prebook-alert {
          margin: 18px 0 12px;
          padding: 12px 14px;
          border: 1px solid rgba(191,57,46,.2);
          border-radius: 12px;
          background: #fde7e1;
          color: #9e3028;
          font-size: 13px;
          line-height: 1.5;
        }

        .prebook-total {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 22px;
          padding: 16px 0;
          border-top: 1px solid rgba(17,32,31,.12);
          color: #4e5954;
          font-size: 14px;
        }

        .prebook-total strong {
          color: #11201f;
          font-family: Georgia, serif;
          font-size: 24px;
        }

        .prebook-primary {
          width: 100%;
          min-height: 52px;
          border: 0;
          border-radius: 24px;
          background: linear-gradient(120deg, #e8473f 0%, #f4823c 100%);
          color: #fff;
          cursor: pointer;
          font: inherit;
          font-size: 15px;
          font-weight: 700;
          transition: transform .12s ease, opacity .12s ease;
        }

        .prebook-primary:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .prebook-primary:disabled {
          opacity: .62;
          cursor: not-allowed;
        }

        .prebook-secure {
          margin: 10px 0 0;
          color: #7a827c;
          text-align: center;
          font-size: 11.5px;
          line-height: 1.6;
        }

        .prebook-close {
          position: absolute;
          top: 14px;
          right: 14px;
          z-index: 5;
          width: 40px;
          height: 40px;
          border: 1px solid rgba(17,32,31,.1);
          border-radius: 50%;
          background: rgba(255,255,255,.94);
          color: #11201f;
          cursor: pointer;
          font-size: 25px;
          line-height: 1;
        }

        .prebook-close:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .prebook-success {
          max-width: 600px;
          margin: 0 auto;
          padding: 70px 44px;
          text-align: center;
        }

        .prebook-success-mark {
          display: grid;
          place-items: center;
          width: 66px;
          height: 66px;
          margin: 0 auto 22px;
          border-radius: 50%;
          background: #e8473f;
          color: #fff;
          font-size: 32px;
          font-weight: 700;
        }

        .prebook-success h2 {
          margin: 0 0 10px;
          color: #11201f;
          font-size: 28px;
        }

        .prebook-success > p {
          margin: 0 auto 24px;
          color: #69716a;
          line-height: 1.7;
        }

        .prebook-booking-card {
          margin: 22px 0;
          padding: 20px;
          border: 1px solid rgba(17,32,31,.12);
          border-radius: 16px;
          background: #fff;
        }

        .prebook-booking-card span {
          display: block;
          margin-bottom: 5px;
          color: #717a73;
          font-size: 12px;
        }

        .prebook-booking-card strong {
          color: #e8473f;
          font-family: Georgia, serif;
          font-size: 26px;
        }

        .prebook-success-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          text-align: left;
        }

        .prebook-success-details div {
          min-width: 0;
          padding: 14px;
          border: 1px solid rgba(17,32,31,.1);
          border-radius: 12px;
          background: #fff;
        }

        .prebook-success-details span {
          display: block;
          margin-bottom: 5px;
          color: #7a827c;
          font-size: 11px;
        }

        .prebook-success-details b {
          display: block;
          overflow-wrap: anywhere;
          color: #273532;
          font-size: 12px;
        }

        .prebook-success-note {
          margin: 22px 0 !important;
          font-size: 13px;
        }

        @media (max-width: 850px) {
          .prebook-overlay {
            padding: 8px;
            align-items: flex-start;
          }

          .prebook-modal {
            max-height: calc(100vh - 16px);
          }

          .prebook-layout {
            display: flex;
            flex-direction: column;
            max-height: calc(100vh - 16px);
            overflow-y: auto;
          }

          .prebook-info {
            flex: none;
            padding: 30px 24px;
          }

          .prebook-brand {
            margin-bottom: 35px;
          }

          .prebook-info h2 {
            font-size: 30px;
          }

          .prebook-form-area {
            flex: none;
            overflow: visible;
            padding: 34px 22px 30px;
          }
        }

        @media (max-width: 520px) {
          .prebook-grid-2,
          .prebook-success-details {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .prebook-success {
            padding: 60px 22px 40px;
          }
        }
      `}</style>
    </div>
  );
}
