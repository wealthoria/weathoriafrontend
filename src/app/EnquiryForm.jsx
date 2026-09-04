import React from "react";

/* global React, window */

const { useState } = React;
const { AppCtx } = window;

/*
 * Wealthoria Enquiry Form
 * Replaces the existing <Consultation /> component.
 * Uses the existing Wealthoria consultation content and class names
 * so the existing consultation design can be reused.
 */

function EnquiryForm() {
  const { t } = React.useContext(AppCtx);
  const form = t.consult.form;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    interest: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = form.errName;
    }

    if (!formData.email.trim()) {
      nextErrors.email = form.errEmail;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = form.errEmail;
    }

    if (!formData.phone.trim()) {
      nextErrors.phone = form.errPhone;
    } else if (!/^[0-9+\-\s]{10,15}$/.test(formData.phone.trim())) {
      nextErrors.phone = form.errPhone;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      /*
       * Add your enquiry API here when the backend endpoint is ready.
       *
       * Example:
       *
       * const response = await fetch(
       *   "YOUR_BACKEND_URL/api/enquiry",
       *   {
       *     method: "POST",
       *     headers: {
       *       "Content-Type": "application/json",
       *     },
       *     body: JSON.stringify(formData),
       *   }
       * );
       *
       * if (!response.ok) throw new Error("Failed to submit enquiry");
       */

      setSubmitted(true);
    } catch (error) {
      console.error("Enquiry submission failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="consult" className="consult-section">
      <div className="consult-inner">

        {/* LEFT SIDE */}
        <div className="consult-content">
          <div className="section-eyebrow">
            {t.consult.eyebrow}
          </div>

          <h2>{t.consult.title}</h2>

          <p className="consult-sub">
            {t.consult.sub}
          </p>

          <div className="consult-points">
            {t.consult.points.map((item, index) => (
              <div className="consult-point" key={index}>
                <div className="consult-point-icon">
                  {item.ic}
                </div>

                <div>
                  <h4>{item.t}</h4>
                  <p>{item.d}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="consult-contacts">
            {t.consult.contacts.map((contact, index) => (
              <a
                key={index}
                href={contact.href}
                className="consult-contact"
              >
                <span>{contact.ic}</span>
                <span>{contact.v}</span>
              </a>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE - NEW ENQUIRY FORM */}
        <div className="consult-form-wrap">
          {submitted ? (
            <div className="consult-success">
              <div className="consult-success-icon">âœ“</div>

              <h3>{form.successTitle}</h3>

              <p>{form.successMsg}</p>
            </div>
          ) : (
            <form
              className="consult-form"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="consult-form-row">
                <div className="consult-field">
                  <label htmlFor="enquiry-name">
                    {form.name}
                  </label>

                  <input
                    id="enquiry-name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={form.placeholderName}
                  />

                  {errors.name && (
                    <span className="consult-error">
                      {errors.name}
                    </span>
                  )}
                </div>

                <div className="consult-field">
                  <label htmlFor="enquiry-email">
                    {form.email}
                  </label>

                  <input
                    id="enquiry-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={form.placeholderEmail}
                  />

                  {errors.email && (
                    <span className="consult-error">
                      {errors.email}
                    </span>
                  )}
                </div>
              </div>

              <div className="consult-form-row">
                <div className="consult-field">
                  <label htmlFor="enquiry-phone">
                    {form.phone}
                  </label>

                  <input
                    id="enquiry-phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={form.placeholderPhone}
                  />

                  {errors.phone && (
                    <span className="consult-error">
                      {errors.phone}
                    </span>
                  )}
                </div>

                <div className="consult-field">
                  <label htmlFor="enquiry-city">
                    {form.city}
                  </label>

                  <input
                    id="enquiry-city"
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder={form.placeholderCity}
                  />
                </div>
              </div>

              <div className="consult-field">
                <label htmlFor="enquiry-interest">
                  {form.interest}
                </label>

                <select
                  id="enquiry-interest"
                  name="interest"
                  value={formData.interest}
                  onChange={handleChange}
                >
                  <option value="">
                    {form.interest}
                  </option>

                  {form.interestOpts.map((option, index) => (
                    <option value={option} key={index}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="consult-field">
                <label htmlFor="enquiry-message">
                  {form.message}
                </label>

                <textarea
                  id="enquiry-message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={form.placeholderMsg}
                  rows="5"
                />
              </div>

              <button
                type="submit"
                className="consult-submit"
                disabled={loading}
              >
                {loading ? "Sending..." : form.submit}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

window.EnquiryForm = EnquiryForm;
