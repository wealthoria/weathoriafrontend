/* global React, window */

const { useState } = React;

function MemberSubscription() {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const subscribeNow = async () => {

    const cleanName =
      name.trim();

    const cleanEmail =
      email.trim().toLowerCase();

    const cleanPhone =
      phone.trim();

    if (
      !cleanName ||
      !cleanEmail ||
      !cleanPhone
    ) {

      alert(
        "Please fill all fields."
      );

      return;
    }

    if (
      !/^\S+@\S+\.\S+$/.test(
        cleanEmail
      )
    ) {

      alert(
        "Please enter a valid email address."
      );

      return;
    }

    if (
      !/^[0-9]{10}$/.test(
        cleanPhone
      )
    ) {

      alert(
        "Please enter a valid 10 digit phone number."
      );

      return;
    }

    if (!window.db) {

      alert(
        "Firebase database is not available."
      );

      return;
    }

    if (
      typeof window.Razorpay !==
      "function"
    ) {

      alert(
        "Razorpay is not loaded."
      );

      return;
    }

    try {

      setLoading(true);

      /* =====================================================
         CHECK DUPLICATE EMAIL
      ===================================================== */

      const existing =
        await window.db
          .collection(
            "subscriptions"
          )
          .where(
            "email",
            "==",
            cleanEmail
          )
          .limit(1)
          .get();

      if (
        !existing.empty
      ) {

        alert(
          "This email is already subscribed."
        );

        setLoading(false);

        return;
      }


      /* =====================================================
         CREATE PENDING SUBSCRIPTION
      ===================================================== */

      const FieldValue =
        window.firebase
          ?.firestore
          ?.FieldValue;

      const docRef =
        await window.db
          .collection(
            "subscriptions"
          )
          .add({

            name:
              cleanName,

            email:
              cleanEmail,

            phone:
              cleanPhone,

            plan:
              "Wealthoria Premium - Yearly",

            amount:
              1,

            currency:
              "INR",

            status:
              "pending",

            subscriptionId:
              "",

            paymentId:
              "",

            customerId:
              "",

            nextBillingDate:
              "",

            createdAt:
              FieldValue
                ? FieldValue.serverTimestamp()
                : new Date().toISOString()

          });


      console.log(
        "Subscription document:",
        docRef.id
      );


      /* =====================================================
         CREATE RAZORPAY SUBSCRIPTION
      ===================================================== */

      const response =
        await fetch(
          "https://webinar-registration-backend.onrender.com/api/subscription/create",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({

                name:
                  cleanName,

                email:
                  cleanEmail,

                phone:
                  cleanPhone,

                firestoreId:
                  docRef.id,

                amount:
                  1

              })

          }
        );


      let data;

      try {

        data =
          await response.json();

      } catch (
        parseError
      ) {

        console.error(
          "Subscription response parse error:",
          parseError
        );

        throw new Error(
          "Invalid response from subscription server."
        );

      }


      console.log(
        "Backend response:",
        data
      );


      if (
        !response.ok ||
        !data.success
      ) {

        throw new Error(
          data.message ||
          "Unable to create subscription."
        );

      }


      /* =====================================================
         RAZORPAY
      ===================================================== */

      const options = {

        key:
          data.key,

        subscription_id:
          data.subscriptionId,

        name:
          "Wealthoria Premium",

        description:
          "₹999 Yearly Subscription",

        prefill: {

          name:
            cleanName,

          email:
            cleanEmail,

          contact:
            cleanPhone

        },

        notes: {

          firestoreId:
            docRef.id,

          plan:
            "Wealthoria Premium - Yearly",

          amount:
            "1"

        },

        theme: {

          color:
            "#ff843f"

        },

        handler:
          async function (
            razorpayResponse
          ) {

            console.log(
              "Razorpay response:",
              razorpayResponse
            );


            try {

              await window.db
                .collection(
                  "subscriptions"
                )
                .doc(
                  docRef.id
                )
                .update({

                  status:
                    "active",

                  subscriptionId:
                    razorpayResponse
                      .razorpay_subscription_id ||
                    data.subscriptionId,

                  paymentId:
                    razorpayResponse
                      .razorpay_payment_id ||
                    "",

                  updatedAt:
                    FieldValue
                      ? FieldValue.serverTimestamp()
                      : new Date().toISOString()

                });


              alert(
                "Your Wealthoria Premium subscription is active!"
              );

            } catch (
              updateError
            ) {

              console.error(
                "Firestore update error:",
                updateError
              );

              alert(
                "Payment was successful, but the subscription record could not be updated."
              );

            } finally {

              setLoading(
                false
              );

            }

          }

      };


      const razorpay =
        new window.Razorpay(
          options
        );


      razorpay.on(
        "payment.failed",
        function (
          paymentResponse
        ) {

          console.error(
            "Payment failed:",
            paymentResponse?.error
          );


          alert(
            paymentResponse?.error?.description ||
            "Subscription payment failed."
          );


          setLoading(
            false
          );

        }
      );


      razorpay.open();

    } catch (
      error
    ) {

      console.error(
        "Subscription error:",
        error
      );


      alert(
        error?.message ||
        "Something went wrong. Please try again."
      );


      setLoading(
        false
      );

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
          font-family: "Poppins", sans-serif;

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
          margin:
            0 0 10px;

          color: #222;

          font-size: 32px;

          line-height: 1.2;

          font-weight: 700;
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

          padding:
            0 16px;

          border:
            1px solid #dddddd;

          border-radius:
            14px;

          background:
            #fafafa;

          color:
            #222;

          font-family:
            "Poppins", sans-serif;

          font-size:
            15px;

          outline:
            none;

          transition:
            border-color .2s ease,
            box-shadow .2s ease,
            background .2s ease;
        }

        .input-group input::placeholder {
          color:
            #999;
        }

        .input-group input:hover {
          border-color:
            #ffb08a;
        }

        .input-group input:focus {
          background:
            #ffffff;

          border-color:
            #ff843f;

          box-shadow:
            0 0 0 4px
            rgba(255, 132, 63, 0.12);
        }

        .pay-box {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            15px;

          margin:
            25px 0;

          padding:
            19px 20px;

          background:
            #fff5f3;

          border:
            1px solid #ffd7cf;

          border-radius:
            16px;
        }

        .pay-box h3 {
          margin:
            0 0 5px;

          color:
            #222;

          font-size:
            16px;

          font-weight:
            600;
        }

        .pay-box p {
          margin:
            0;

          color:
            #777;

          font-size:
            13px;
        }

        .amount {
          color:
            #ff6b35;

          font-size:
            32px;

          font-weight:
            800;

          white-space:
            nowrap;
        }

        .subscribe-button {
          width:
            100%;

          height:
            58px;

          border:
            none;

          border-radius:
            14px;

          background:
            linear-gradient(
              135deg,
              #ff6b35,
              #ff8c42
            );

          color:
            #ffffff;

          font-family:
            "Poppins", sans-serif;

          font-size:
            16px;

          font-weight:
            700;

          cursor:
            pointer;

          box-shadow:
            0 12px 28px
            rgba(255, 107, 53, 0.30);

          transition:
            transform .2s ease,
            box-shadow .2s ease,
            opacity .2s ease;
        }

        .subscribe-button:hover:not(:disabled) {
          transform:
            translateY(-2px);

          box-shadow:
            0 16px 34px
            rgba(255, 107, 53, 0.35);
        }

        .subscribe-button:active {
          transform:
            translateY(0);
        }

        .subscribe-button:disabled {
          opacity:
            0.6;

          cursor:
            not-allowed;

          transform:
            none;

          box-shadow:
            none;
        }

        .secure {
          margin-top:
            17px;

          text-align:
            center;

          color:
            #777;

          font-size:
            12px;

          line-height:
            1.5;
        }

        .form-note {
          margin-top:
            8px;

          text-align:
            center;

          color:
            #999;

          font-size:
            11px;

          line-height:
            1.5;
        }

        @media (max-width: 600px) {

          body {
            padding:
              15px;
          }

          .form-card {
            padding:
              28px 22px;

            border-radius:
              20px;
          }

          .form-header h1 {
            font-size:
              28px;
          }

          .amount {
            font-size:
              27px;
          }

        }

        @media (max-width: 380px) {

          .form-card {
            padding:
              24px 18px;
          }

          .form-header h1 {
            font-size:
              25px;
          }

          .pay-box {
            padding:
              16px;
          }

        }

      `}</style>


      <div
        className="subscription-page"
      >

        <div
          className="form-card"
        >

          <div
            className="brand"
          >

            <div
              className="brand-name"
            >
              WEALTHORIA
            </div>

          </div>


          <div
            className="form-header"
          >

            <span
              className="eyebrow"
            >
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


          <div
            className="input-group"
          >

            <label
              htmlFor="subscription-name"
            >
              Full Name
            </label>

            <input
              id="subscription-name"
              type="text"
              placeholder="Enter your full name"
              autoComplete="name"
              value={name}
              onChange={
                (event) =>
                  setName(
                    event.target.value
                  )
              }
            />

          </div>


          <div
            className="input-group"
          >

            <label
              htmlFor="subscription-email"
            >
              Email Address
            </label>

            <input
              id="subscription-email"
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              value={email}
              onChange={
                (event) =>
                  setEmail(
                    event.target.value
                  )
              }
            />

          </div>


          <div
            className="input-group"
          >

            <label
              htmlFor="subscription-phone"
            >
              Phone Number
            </label>

            <input
              id="subscription-phone"
              type="tel"
              placeholder="Enter your phone number"
              autoComplete="tel"
              maxLength={10}
              value={phone}
              onChange={
                (event) =>
                  setPhone(
                    event.target.value.replace(
                      /\D/g,
                      ""
                    )
                  )
              }
            />

          </div>


          <div
            className="pay-box"
          >

            <div>

              <h3>
                Wealthoria Premium
              </h3>

              <p>
                1 Year Membership
              </p>

            </div>

            <div
              className="amount"
            >
              ₹1
            </div>

          </div>


          <button
            type="button"
            className="subscribe-button"
            onClick={
              subscribeNow
            }
            disabled={
              loading
            }
          >

            {
              loading
                ? "Please wait..."
                : "Subscribe Now"
            }

          </button>


          <div
            className="secure"
          >
            🔒 Secure payment powered by Razorpay
          </div>


          <div
            className="form-note"
          >
            Your payment information is securely processed.
          </div>

        </div>

      </div>
    </>
  );
}


/* =========================================================
   EXPORT
========================================================= */

window.MemberSubscription =
  MemberSubscription;

console.log(
  "Member Subscription JSX loaded successfully"
);