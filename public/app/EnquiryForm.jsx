/* global React, window */

/* global React, window */

const { useState } = React;
const { useApp, Icon, Reveal } = window;

function EnquiryForm() {
  const { t } = useApp();
  const c = t.consult;
  const F = c.form;

  const [vals, setVals] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    interest: F.interestOpts[0] || "",
    message: ""
  });

  const [errs, setErrs] = useState({});
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => {
    setVals((prev) => ({
      ...prev,
      [key]: e.target.value
    }));

    if (errs[key]) {
      setErrs((prev) => ({
        ...prev,
        [key]: false
      }));
    }
  };

  const validate = () => {
    const errors = {};

    if (!vals.name.trim()) {
      errors.name = true;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vals.email.trim())) {
      errors.email = true;
    }

    if (vals.phone.replace(/\D/g, "").length < 10) {
      errors.phone = true;
    }

    setErrs(errors);

    return Object.keys(errors).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      /*
       * Keep the backend/API here when ready.
       */

      setDone(true);
    } catch (error) {
      console.error("Enquiry submission failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDone(false);

    setVals({
      name: "",
      email: "",
      phone: "",
      city: "",
      interest: F.interestOpts[0] || "",
      message: ""
    });

    setErrs({});
  };

  return (
    <section className="band band-soft" id="consult">

      <div className="wrap consult-grid">

        {/* =========================================================
            LEFT SIDE
            ========================================================= */}

        <Reveal className="consult">

          <span className="eyebrow">
            {c.eyebrow}
          </span>

          <h2
            className="h2"
            style={{ lineHeight: "1" }}
          >
            {c.title}
          </h2>

          <p className="sub">
            {c.sub}
          </p>

          <div className="pts">

            {c.points.map((item, index) => (
              <div className="pt" key={index}>

                <div className="iconwrap">
                  <Icon
                    name={item.ic}
                    size={20}
                  />
                </div>

                <div>
                  <h4>{item.t}</h4>
                  <p>{item.d}</p>
                </div>

              </div>
            ))}

          </div>

          <div className="contacts">

            {c.contacts.map((contact, index) => (
              <a
                key={index}
                href={contact.href}
              >
                <Icon
                  name={contact.ic}
                  size={18}
                />

                {contact.v}
              </a>
            ))}

          </div>

        </Reveal>


        {/* =========================================================
            RIGHT SIDE
            ========================================================= */}

        <Reveal delay={100}>

          <div className="formcard">

            {done ? (

              <div className="form-success">

                <div className="ok">
                  <Icon
                    name="check"
                    size={30}
                    stroke={3}
                  />
                </div>

                <h3>
                  {F.successTitle}
                </h3>

                <p>
                  {F.successMsg}
                </p>

                <button
                  className="btn btn-ghost"
                  style={{ marginTop: 22 }}
                  onClick={resetForm}
                >
                  <Icon
                    name="arrow"
                    size={16}
                    style={{
                      transform: "rotate(180deg)"
                    }}
                  />

                  Back
                </button>

              </div>

            ) : (

              <form
                onSubmit={submit}
                noValidate
              >

                {/* NAME */}

                <div
                  className={`field ${
                    errs.name ? "invalid" : ""
                  }`}
                >

                  <label>
                    {F.name}

                    <span className="req">
                      *
                    </span>
                  </label>

                  <input
                    className="input"
                    value={vals.name}
                    onChange={set("name")}
                    placeholder={F.placeholderName}
                  />

                  <div className="err">
                    {F.errName}
                  </div>

                </div>


                {/* EMAIL + PHONE */}

                <div className="field row2">

                  <div
                    className={
                      errs.email
                        ? "invalid field"
                        : "field"
                    }
                    style={{ margin: 0 }}
                  >

                    <label>
                      {F.email}

                      <span className="req">
                        *
                      </span>
                    </label>

                    <input
                      className="input"
                      value={vals.email}
                      onChange={set("email")}
                      placeholder={F.placeholderEmail}
                      inputMode="email"
                    />

                    <div className="err">
                      {F.errEmail}
                    </div>

                  </div>


                  <div
                    className={
                      errs.phone
                        ? "invalid field"
                        : "field"
                    }
                    style={{ margin: 0 }}
                  >

                    <label>
                      {F.phone}

                      <span className="req">
                        *
                      </span>
                    </label>

                    <input
                      className="input"
                      value={vals.phone}
                      onChange={set("phone")}
                      placeholder={F.placeholderPhone}
                      inputMode="tel"
                    />

                    <div className="err">
                      {F.errPhone}
                    </div>

                  </div>

                </div>


                {/* CITY */}

                <div className="field">

                  <label>
                    {F.city}
                  </label>

                  <input
                    className="input"
                    value={vals.city}
                    onChange={set("city")}
                    placeholder={F.placeholderCity}
                  />

                </div>


                {/* INTEREST */}

                <div className="field">

                  <label>
                    {F.interest}
                  </label>

                  <select
                    className="select"
                    value={vals.interest}
                    onChange={set("interest")}
                  >

                    {F.interestOpts.map((option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>
                    ))}

                  </select>

                </div>


                {/* MESSAGE */}

                <div className="field">

                  <label>
                    {F.message}
                  </label>

                  <textarea
                    className="textarea"
                    value={vals.message}
                    onChange={set("message")}
                    placeholder={F.placeholderMsg}
                  />

                </div>


                {/* SUBMIT */}

                <button
                  className="btn btn-green btn-block"
                  type="submit"
                  disabled={loading}
                >

                  {loading ? "Sending..." : F.submit}

                  <Icon
                    name="arrow"
                    size={18}
                  />

                </button>

              </form>

            )}

          </div>

        </Reveal>

      </div>

    </section>
  );
}

window.EnquiryForm = EnquiryForm;