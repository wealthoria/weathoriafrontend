const { useState } = React;


const StudentRegister = () => {
  const [darkMode, setDarkMode] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    experience: "",
    broker: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  if (formData.password !== formData.confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  try {
    // Create user in Firebase Authentication
    const userCredential =
      await window.auth.createUserWithEmailAndPassword(
        formData.email.trim().toLowerCase(),
        formData.password
      );

    const firebaseUser = userCredential.user;

    // Save student details in Firestore
    await window.db
      .collection("students")
      .doc(firebaseUser.uid)
      .set({
        full_name: formData.fullName,
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone,
        experience: formData.experience,
        broker: formData.broker,
        role: "student",
        created_at: new Date().toISOString(),
      });

   alert("Registration successful! Please login to continue.");

// Sign out the newly created user
await window.auth.signOut();

// Redirect to login page
window.location.hash = "#/student/login";

  } catch (error) {
    console.error(error);

    if (error.code === "auth/email-already-in-use") {
      alert("This email is already registered.");
    } else if (error.code === "auth/weak-password") {
      alert("Password should be at least 6 characters.");
    } else {
      alert(error.message);
    }
  }
};

  return (
    <div
      className={`register-container ${
        darkMode ? "dark-mode" : ""
      }`}
    >
      {/* ================= LEFT ================= */}

      <div className="left-panel">

        <div className="logo">
          <span className="logo-icon">W</span>
          <span className="logo-text">WEALTHORIA</span>
        </div>

        <div className="glow"></div>

        <div className="left-content">

          <h1>
            Start your
            <br />
            investment
            <br />
            learning
            <br />
            journey
          </h1>

          <div className="feature">

<i className="fa-solid fa-circle-check"></i>
            <span>
              Learn investing step by step
            </span>

          </div>

          <div className="feature">

<i className="fa-solid fa-circle-check"></i>
            <span>
              Track your learning progress
            </span>

          </div>

          <div className="feature">

<i className="fa-solid fa-circle-check"></i>
            <span>
              Learn at your own pace
            </span>

          </div>

        </div>

        <div className="quote">
          "Build knowledge, invest with confidence,
          and grow with Wealthoria."
        </div>

      </div>

      {/* ================= RIGHT ================= */}

      <div className="right-panel">

        <button
          className="theme-btn"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? (
  <i className="fa-solid fa-sun"></i>
) : (
  <i className="fa-solid fa-moon"></i>
)}
        </button>

        <form
          className="register-form"
          onSubmit={handleSubmit}
        >

          <h2>Create your account</h2>

          <p className="subtitle">
            Join Wealthoria and start your
            learning journey.
          </p>

          {/* Full Name */}

          <label>Full Name *</label>

          <input
            type="text"
            name="fullName"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={handleChange}
            required
          />

          {/* Email */}

          <label>Email Address *</label>

          <input
            type="email"
            name="email"
            placeholder="you@email.com"
            value={formData.email}
            onChange={handleChange}
            required
          />

          {/* Phone */}

          <label>Phone Number *</label>

          <input
            type="text"
            name="phone"
            maxLength={10}
            placeholder="Enter 10-digit phone number"
            value={formData.phone}
            onChange={handleChange}
            required
          />

                    {/* Investment Experience */}

          <label>Investment Experience *</label>

          <div className="experience-group">

            <label className="radio-item">
              <input
                type="radio"
                name="experience"
                value="Beginner"
                checked={formData.experience === "Beginner"}
                onChange={handleChange}
              />
              Beginner (0–1 year)
            </label>

            <label className="radio-item">
              <input
                type="radio"
                name="experience"
                value="Intermediate"
                checked={formData.experience === "Intermediate"}
                onChange={handleChange}
              />
              Intermediate (1–3 years)
            </label>

            <label className="radio-item">
              <input
                type="radio"
                name="experience"
                value="Advanced"
                checked={formData.experience === "Advanced"}
                onChange={handleChange}
              />
              Advanced (3–5 years)
            </label>

            <label className="radio-item">
              <input
                type="radio"
                name="experience"
                value="Expert"
                checked={formData.experience === "Expert"}
                onChange={handleChange}
              />
              Expert (5+ years)
            </label>

          </div>

          {/* Broker */}

          <label>Current Broker</label>

          <input
            type="text"
            name="broker"
            placeholder="e.g. Angel One, Groww, Zerodha"
            value={formData.broker}
            onChange={handleChange}
          />

          {/* Password */}

          <label>Password *</label>

          <div className="password-box">

            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <button
              type="button"
              className="eye-btn"
              onClick={() =>
                setShowPassword(!showPassword)
              }
            >
{showPassword ? (
  <i className="fa-solid fa-eye-slash"></i>
) : (
  <i className="fa-solid fa-eye"></i>
)}            </button>

          </div>

          {/* Confirm Password */}

          <label>Confirm Password *</label>

          <div className="password-box">

            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Enter password again"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />

            <button
              type="button"
              className="eye-btn"
              onClick={() =>
                setShowConfirmPassword(
                  !showConfirmPassword
                )
              }
            >
            {showConfirmPassword ? (
  <i className="fa-solid fa-eye-slash"></i>
) : (
  <i className="fa-solid fa-eye"></i>
)}
            </button>

          </div>

          {/* Button */}

          <button
            className="register-btn"
            type="submit"
          >
            Create Account
<i className="fa-solid fa-arrow-right"></i>          </button>

          <p className="login-link">
            Already have an account?
            <a href="#/student/login">
              Login
            </a>
          </p>

        </form>

      </div>

    </div>
  );
};

window.StudentRegister = StudentRegister;