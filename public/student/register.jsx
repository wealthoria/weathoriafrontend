/* global React, window */

const { useState } = React;
const { useApp, Icon } = window;
const { useRouter } = window;

function RegisterScreen() {
  const { theme, toggleTheme } = useApp();
  const { navigate } = useRouter();

 const [form, setForm] = useState({
  full_name: "",
  email: "",
  phone: "",
  place: "",
  experience: "",
  current_broker: "",
  password: "",
  confirm_password: "",
});

  const [fieldErr, setFieldErr] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const experienceOptions = [
    {
      value: "beginner",
      title: "Beginner",
      text: "0 - 1 year",
    },
    {
      value: "intermediate",
      title: "Intermediate",
      text: "1 - 3 years",
    },
    {
      value: "advanced",
      title: "Advanced",
      text: "3 - 5 years",
    },
    {
      value: "expert",
      title: "Expert",
      text: "5+ years",
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFieldErr((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const selectExperience = (value) => {
    setForm((prev) => ({
      ...prev,
      experience:
        prev.experience === value ? "" : value,
    }));

    setFieldErr((prev) => ({
      ...prev,
      experience: "",
    }));
  };

  const submit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    const fe = {};

    if (!form.full_name.trim()) {
      fe.full_name = "Full name is required";
    }

    if (!form.email.trim()) {
      fe.email = "Email is required";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {
      fe.email = "Enter a valid email address";
    }

    if (!form.phone.trim()) {
      fe.phone = "Phone number is required";
    } else if (
      !/^[6-9]\d{9}$/.test(form.phone.trim())
    ) {
      fe.phone =
        "Enter a valid 10-digit phone number";
    }

    if (!form.experience) {
      fe.experience =
        "Please select your experience level";
    }

    if (!form.password) {
      fe.password = "Password is required";
    } else if (form.password.length < 6) {
      fe.password =
        "Password must be at least 6 characters";
    }

    if (!form.confirm_password) {
      fe.confirm_password =
        "Please confirm your password";
    } else if (
      form.password !== form.confirm_password
    ) {
      fe.confirm_password =
        "Passwords do not match";
    }

    setFieldErr(fe);

    if (Object.keys(fe).length > 0) {
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            full_name: form.full_name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
             place: form.place.trim(),
            experience: form.experience,
            current_broker:
              form.current_broker.trim(),
            password: form.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Registration failed"
        );
      }

      setMessage(
        "Account created successfully. Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/student/login");
      }, 1500);
    } catch (err) {
      console.error("REGISTER ERROR:", err);

      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to backend server"
          : err.message || "Registration failed"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth register-auth">

      {/* LEFT SIDE */}

      <aside className="auth-brand">
        <div
          className="ab-top"
          onClick={() => {
            window.location.href =
              "wealthoria.html";
          }}
          style={{ cursor: "pointer" }}
        >
          <img
            src="assets/logo-mark.png"
            alt="Wealthoria"
            style={{ height: 34 }}
          />

          <span className="ab-word">
            Wealthoria
          </span>
        </div>

        <div className="ab-mid">
          <h2>
            Start your investment learning journey
          </h2>

          <ul className="ab-list">
            <li>
              <span className="ab-tick">
                <Icon
                  name="check"
                  size={15}
                  stroke={3}
                />
              </span>
              Learn investing step by step
            </li>

            <li>
              <span className="ab-tick">
                <Icon
                  name="check"
                  size={15}
                  stroke={3}
                />
              </span>
              Track your learning progress
            </li>

            <li>
              <span className="ab-tick">
                <Icon
                  name="check"
                  size={15}
                  stroke={3}
                />
              </span>
              Learn at your own pace
            </li>
          </ul>

          <div className="ab-quote">
            "Build knowledge, invest with confidence,
            and grow with Wealthoria."
          </div>
        </div>
      </aside>


      {/* RIGHT SIDE */}

      <main className="auth-main register-main">

        <button
          className="theme-toggle port"
          onClick={toggleTheme}
          type="button"
          aria-label="Toggle theme"
          style={{
            position: "absolute",
            top: 20,
            right: 20,
          }}
        >
          <Icon
            name={
              theme === "dark"
                ? "sun"
                : "moon"
            }
            size={18}
          />
        </button>


        <div className="auth-card register-card reveal-up">

          <div className="auth-mark-sm">
            <img
              src="assets/logo-mark.png"
              alt="Wealthoria"
              style={{ height: 28 }}
            />

            <span className="w">
              Wealthoria
            </span>
          </div>


          <div className="auth-head">
            <h1>Create your account</h1>

            <p>
              Join Wealthoria and start your
              learning journey.
            </p>
          </div>


          {error && (
            <div className="form-alert">
              <Icon name="shield" size={16} />
              {error}
            </div>
          )}


          {message && (
            <div className="form-alert success">
              <Icon name="check" size={16} />
              {message}
            </div>
          )}


          <form onSubmit={submit} noValidate>

            {/* FULL NAME */}

            <div
              className={`field ${
                fieldErr.full_name
                  ? "invalid"
                  : ""
              }`}
            >
              <label>Full Name *</label>

              <input
                className="input"
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                autoComplete="name"
              />

              {fieldErr.full_name && (
                <div className="err">
                  {fieldErr.full_name}
                </div>
              )}
            </div>


            {/* EMAIL */}

            <div
              className={`field ${
                fieldErr.email ? "invalid" : ""
              }`}
            >
              <label>Email Address *</label>

              <input
                className="input"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@email.com"
                autoComplete="email"
              />

              {fieldErr.email && (
                <div className="err">
                  {fieldErr.email}
                </div>
              )}
            </div>


            {/* PHONE */}

            <div
              className={`field ${
                fieldErr.phone ? "invalid" : ""
              }`}
            >
              <label>Phone Number *</label>

              <input
                className="input"
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter 10-digit phone number"
                maxLength="10"
                autoComplete="tel"
              />

              {fieldErr.phone && (
                <div className="err">
                  {fieldErr.phone}
                </div>
              )}
            </div>


              {/* PLACE */}

{/* PLACE */}

<div className="field">
  <label>Place</label>

  <input
    className="input"
    type="text"
    name="place"
    value={form.place}
    onChange={handleChange}
    placeholder="Enter your city or place"
    autoComplete="address-level2"
  />
</div>

            {/* EXPERIENCE */}

            <div
              className={`field ${
                fieldErr.experience
                  ? "invalid"
                  : ""
              }`}
            >
              <label>
                Investment Experience *
              </label>

              <p className="register-field-help">
                Select your experience level
              </p>

              <div className="register-experience-list">
                {experienceOptions.map((item) => {
                  const checked =
                    form.experience === item.value;

                  return (
                    <label
                      key={item.value}
                      className={`register-experience-option ${
                        checked ? "selected" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          selectExperience(item.value)
                        }
                      />

                      <span className="register-checkbox">
                        {checked && (
                          <Icon
                            name="check"
                            size={13}
                            stroke={3}
                          />
                        )}
                      </span>

                      <span className="register-experience-text">
                        <strong>
                          {item.title}
                        </strong>

                        <small>
                          {item.text}
                        </small>
                      </span>
                    </label>
                  );
                })}
              </div>

              {fieldErr.experience && (
                <div className="err">
                  {fieldErr.experience}
                </div>
              )}
            </div>


            {/* CURRENT BROKER */}

            <div className="field">
              <label>Current Broker</label>

              <input
                className="input register-broker-input"
                type="text"
                name="current_broker"
                value={form.current_broker}
                onChange={handleChange}
                placeholder="e.g. Angel One, Groww, Zerodha"
              />
            </div>


            {/* PASSWORD */}

            <div
              className={`field ${
                fieldErr.password
                  ? "invalid"
                  : ""
              }`}
            >
              <label>Password *</label>

              <input
                className="input"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                autoComplete="new-password"
              />

              {fieldErr.password && (
                <div className="err">
                  {fieldErr.password}
                </div>
              )}
            </div>


            {/* CONFIRM PASSWORD */}

            <div
              className={`field ${
                fieldErr.confirm_password
                  ? "invalid"
                  : ""
              }`}
            >
              <label>Confirm Password *</label>

              <input
                className="input"
                type="password"
                name="confirm_password"
                value={form.confirm_password}
                onChange={handleChange}
                placeholder="Enter password again"
                autoComplete="new-password"
              />

              {fieldErr.confirm_password && (
                <div className="err">
                  {fieldErr.confirm_password}
                </div>
              )}
            </div>


            <button
              className="btn btn-green btn-block"
              type="submit"
              disabled={busy}
            >
              {busy
                ? "Creating account..."
                : "Create Account"}

              {!busy && (
                <Icon name="arrow" size={18} />
              )}
            </button>

          </form>


          <div className="auth-foot">
            Already have an account?{" "}

            <button
              type="button"
              className="link-coral"
              onClick={() =>
                navigate("/student/login")
              }
            >
              Log in
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}

window.RegisterScreen = RegisterScreen;