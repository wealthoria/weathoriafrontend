/* global React, window */

const { useState } = React;

function MemberSubscription() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

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

    if (
      !cleanName ||
      !cleanEmail ||
      !cleanPhone ||
      !password ||
      !confirmPassword
    ) {
      alert("Please fill all fields.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      alert("Please enter a valid email address.");
      return;
    }

    if (!/^[0-9]{10}$/.test(cleanPhone)) {
      alert("Please enter a valid 10 digit phone number.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (typeof window.Razorpay !== "function") {
      alert("Razorpay is not loaded.");
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
        "https://webinar-registration-backend.onrender.com/api/subscription/create",
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

      console.log(
        "Subscription create response:",
        data
      );

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
          "₹999 Yearly Premium Membership",

        prefill: {
          name: cleanName,
          email: cleanEmail,
          contact: cleanPhone
        },

        notes: {
          plan:
            "Wealthoria Premium - Yearly"
        },

        theme: {
          color: "#ff843f"
        },

        handler: async function (
          razorpayResponse
        ) {
          try {
            console.log(
              "Razorpay success:",
              razorpayResponse
            );

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
                "https://webinar-registration-backend.onrender.com/api/subscription/complete",
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
                        finalPaymentId
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

            console.log(
              "Subscription completion:",
              completeData
            );

            if (
              !completeResponse.ok ||
              !completeData.success
            ) {
              throw new Error(
                completeData.message ||
                "Payment succeeded but account creation failed."
              );
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
          console.error(
            "Payment failed:",
            paymentResponse?.error
          );

          alert(
            paymentResponse?.error?.description ||
            "Subscription payment failed."
          );

          setLoading(false);
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

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          min-height: 100%;
        }

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

        .input-group input {
          width: 100%;

          height: 58px;

          padding: 0 16px;

          border:
            1px solid #dddddd;

          border-radius: 14px;

          background: #fafafa;

          color: #222;

          font-family:
            "Poppins",
            sans-serif;

          font-size: 15px;

          outline: none;

          transition:
            border-color .2s ease,
            box-shadow .2s ease,
            background .2s ease;
        }

        .input-group input:focus {
          background: #ffffff;

          border-color: #ff843f;

          box-shadow:
            0 0 0 4px
            rgba(255, 132, 63, 0.12);
        }

        .pay-box {
          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 15px;

          margin: 25px 0;

          padding: 19px 20px;

          background: #fff5f3;

          border:
            1px solid #ffd7cf;

          border-radius: 16px;
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

        .amount {
          color: #ff6b35;

          font-size: 32px;

          font-weight: 800;

          white-space: nowrap;
        }

        .subscribe-button {
          width: 100%;

          height: 58px;

          border: none;

          border-radius: 14px;

          background:
            linear-gradient(
              135deg,
              #ff6b35,
              #ff8c42
            );

          color: #ffffff;

          font-family:
            "Poppins",
            sans-serif;

          font-size: 16px;

          font-weight: 700;

          cursor: pointer;

          box-shadow:
            0 12px 28px
            rgba(255, 107, 53, 0.30);
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

          <div className="form-header">

            <span className="eyebrow">
              WEALTHORIA PREMIUM
            </span>

            <h1>
              Subscribe Now
            </h1>

            <p>
              Start your Wealthoria Premium membership
              and access premium investment learning
              resources.
            </p>

          </div>

          <div className="input-group">

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
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
            />

          </div>

          <div className="input-group">

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
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
            />

          </div>

          <div className="input-group">

            <label htmlFor="subscription-phone">
              Phone Number
            </label>

            <input
              id="subscription-phone"
              type="tel"
              placeholder="Enter your phone number"
              autoComplete="tel"
              maxLength={10}
              value={phone}
              disabled={loading}
              onChange={(event) =>
                setPhone(
                  event.target.value.replace(
                    /\D/g,
                    ""
                  )
                )
              }
            />

          </div>

          <div className="input-group">

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
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
            />

          </div>

          <div className="input-group">

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
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
            />

          </div>

          <div className="pay-box">

            <div>
              <h3>
                Wealthoria Premium
              </h3>

              <p>
                1 Year Membership
              </p>
            </div>

            <div className="amount">
              ₹999
            </div>

          </div>

          <button
            type="button"
            className="subscribe-button"
            onClick={subscribeNow}
            disabled={loading}
          >
            {loading
              ? "Processing..."
              : "Subscribe Now"}
          </button>

          <div className="existing-member">

            Already a subscriber?{" "}

            <button
              type="button"
              onClick={goToLogin}
            >
              Login here
            </button>

          </div>

          <div className="secure">
            🔒 Secure payment powered by Razorpay
          </div>

          <div className="form-note">
            Your payment information is securely processed.
          </div>

        </div>

      </div>
    </>
  );
}

window.MemberSubscription =
  MemberSubscription;

console.log(
  "Member Subscription JSX loaded successfully"
);