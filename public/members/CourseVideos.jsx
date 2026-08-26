/* global React, window */

const { useState, useEffect } = React;


/* =========================================================
   COURSE DATA
========================================================= */

const COURSE_VIDEOS = [
  {
    id: "course-1",
    title: "AI Adjacent Sectors",
    description:
      "Explore the sectors benefiting from the rapid growth of Artificial Intelligence.",
    category: "Fundamentals",
    level: "Intermediate",
    price: 199,
    videoProvider: "vdocipher",
    videoId: "48bc49d7ad7a4bd2b874d4738afbc39b",
    videoEmbedUrl: "",
    thumbnailUrl: ""
  }
];


/* =========================================================
   COURSE LEVEL SECTIONS
========================================================= */

const COURSE_LEVELS = [
  {
    id: "beginner",
    title: "Beginner Videos",
    subtitle: "Start with the fundamentals"
  },
  {
    id: "intermediate",
    title: "Intermediate Videos",
    subtitle: "Build practical market knowledge"
  },
  {
    id: "advanced",
    title: "Advanced Videos",
    subtitle: "Explore advanced market concepts"
  },
  {
    id: "expert",
    title: "Expert Videos",
    subtitle: "Professional-level learning"
  }
];


/* =========================================================
   COURSE VIDEOS
========================================================= */

function CourseVideos() {

  /* =======================================================
     LOAD RAZORPAY CHECKOUT SDK
  ======================================================= */

  useEffect(() => {

    if (window.Razorpay) {
      return;
    }

    const existing =
      document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );

    if (existing) {
      return;
    }

    const script =
      document.createElement("script");

    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";

    script.async = true;

    script.onload = () => {
      console.log(
        "Razorpay Checkout SDK loaded"
      );
    };

    script.onerror = () => {
      console.error(
        "Unable to load Razorpay Checkout SDK"
      );
    };

    document.head.appendChild(script);

  }, []);


  useEffect(() => {

    const STYLE_ID =
      "wealthoria-course-level-sections";

    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style =
      document.createElement("style");

    style.id = STYLE_ID;

    style.textContent = `
      .member-course-level-buttons {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        margin: 26px 0 30px;
      }

      .member-course-level-btn {
        min-width: 120px;
        padding: 11px 20px;
        border: 1px solid #dedede;
        border-radius: 999px;
        background: #ffffff;
        color: #555;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        transition:
          background .2s ease,
          border-color .2s ease,
          color .2s ease,
          transform .2s ease;
      }

      .member-course-level-btn:hover {
        border-color: #e8473f;
        color: #e8473f;
        transform: translateY(-1px);
      }

      .member-course-level-btn.active {
        background: #e8473f;
        border-color: #e8473f;
        color: #ffffff;
      }

      .member-course-sections {
        width: 100%;
      }

      .member-course-level-section {
        width: 100%;
      }

      .member-course-level-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(0,0,0,.08);
      }

      .member-course-level-head h3 {
        margin: 4px 0 0;
        font-size: 18px;
        line-height: 1.3;
      }

      .member-course-level-count {
        font-size: 12px;
        font-weight: 700;
        opacity: .65;
        white-space: nowrap;
      }

      .member-course-grid {
        display: grid;
        grid-template-columns:
          repeat(4, minmax(0, 1fr));
        gap: 16px;
      }

      .member-course-level-empty {
        padding: 44px 20px;
        text-align: center;
        border: 1px dashed #d8d8d8;
        border-radius: 16px;
        background: rgba(0,0,0,.015);
      }

      .member-course-level-empty-icon {
        font-size: 28px;
        margin-bottom: 8px;
      }

      .member-course-level-empty h3 {
        margin: 0 0 6px;
        font-size: 17px;
      }

      .member-course-level-empty p {
        margin: 0;
        font-size: 13px;
        color: #777;
      }

      .course-thumb-fallback {
        width: 100%;
        height: 100%;
        min-height: 150px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        text-align: center;
        background:
          linear-gradient(
            135deg,
            #20242b,
            #334155
          );
        color: #ffffff;
        font-weight: 700;
      }

      .member-course-body > p {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      @media (max-width: 1100px) {
        .member-course-grid {
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
        }
      }

      @media (max-width: 760px) {
        .member-course-grid {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
        }

        .member-course-level-head {
          align-items: flex-start;
          flex-direction: column;
        }
      }

      @media (max-width: 480px) {
        .member-course-grid {
          grid-template-columns: 1fr;
        }

        .member-course-level-btn {
          min-width: 0;
          flex: 1 1 calc(50% - 10px);
        }
      }
    `;

    document.head.appendChild(style);

    return () => {
      const node =
        document.getElementById(STYLE_ID);

      if (node) {
        node.remove();
      }
    };

  }, []);


  /* =======================================================
     SEARCH
  ======================================================= */

  const [searchQuery, setSearchQuery] = useState("");

  /* =======================================================
     SELECTED COURSE LEVEL
  ======================================================= */

  const [selectedLevel, setSelectedLevel] =
    useState(null);


  /* =======================================================
     SELECTED COURSE
  ======================================================= */

  const [selectedCourse, setSelectedCourse] = useState(null);


  /* =======================================================
     VIDEO PREVIEW
  ======================================================= */

  const [showPreview, setShowPreview] = useState(false);

  const [previewEnded, setPreviewEnded] = useState(false);

  const [timeLeft, setTimeLeft] = useState(30);


  /* =======================================================
     PURCHASED COURSES
  ======================================================= */

  const [purchasedCourses, setPurchasedCourses] = useState(() => {

    try {

      const saved =
        localStorage.getItem(
          "wealthoria-purchased-courses"
        );

      if (!saved) {
        return [];
      }

      return JSON.parse(saved);

    } catch (error) {

      console.error(
        "Error loading purchased courses:",
        error
      );

      return [];

    }

  });


  /* =======================================================
     COURSES FROM FIRESTORE
  ======================================================= */

  const [firestoreCourses, setFirestoreCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  useEffect(() => {

    if (!window.db) {
      setCoursesLoading(false);
      return;
    }

    const unsubscribe = window.db
      .collection("courses")
      .where("status", "==", "published")
      .onSnapshot(
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));

          setFirestoreCourses(data);
          setCoursesLoading(false);
        },
        (error) => {
          console.error("Error loading courses:", error);
          setCoursesLoading(false);
        }
      );

    return () => unsubscribe();

  }, []);


  /* =======================================================
     SAVE PURCHASED COURSES
  ======================================================= */

  useEffect(() => {

    try {

      localStorage.setItem(
        "wealthoria-purchased-courses",
        JSON.stringify(purchasedCourses)
      );

    } catch (error) {

      console.error(
        "Error saving purchased courses:",
        error
      );

    }

  }, [purchasedCourses]);


  /* =======================================================
     CHECK PURCHASE
  ======================================================= */

  const isPurchased = (courseId) => {

    return purchasedCourses.includes(courseId);

  };


  /* =======================================================
     OPEN COURSE
  ======================================================= */

  const openCourse = (course) => {

    setSelectedCourse(course);

    setShowPreview(true);

    setPreviewEnded(false);

    setTimeLeft(30);

  };


  /* =======================================================
     CLOSE COURSE
  ======================================================= */

  const closeCourse = () => {

    setShowPreview(false);

    setSelectedCourse(null);

    setPreviewEnded(false);

    setTimeLeft(30);

  };


  /* =======================================================
     30 SECOND PREVIEW TIMER
  ======================================================= */

  useEffect(() => {

    if (!showPreview) {
      return;
    }

    if (!selectedCourse) {
      return;
    }

    /* Purchased courses have full access */

    if (isPurchased(selectedCourse.id)) {
      return;
    }

    if (previewEnded) {
      return;
    }


    const timer = setInterval(() => {

      setTimeLeft((current) => {

        if (current <= 1) {

          clearInterval(timer);

          setPreviewEnded(true);

          return 0;

        }

        return current - 1;

      });

    }, 1000);


    return () => {

      clearInterval(timer);

    };

  }, [
    showPreview,
    selectedCourse,
    previewEnded,
    purchasedCourses
  ]);


  /* =======================================================
     BUY COURSE
  ======================================================= */
const buyCourse = async (course) => {

  try {

    if (!course?.id) {
      alert("Course information is missing.");
      return;
    }

    if (!window.auth?.currentUser) {
      alert("Please login first.");
      return;
    }

    /* =====================================================
       1. CREATE RAZORPAY ORDER
    ===================================================== */

    const response = await fetch(
   "https://webinar-registration-backend.onrender.com/api/payment/create-course-order",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          courseId: course.id,
          amount: Number(course.price || 0)
        })
      }
    );


    const data = await response.json();


    if (!response.ok) {

      throw new Error(
        data?.message ||
        "Unable to create payment."
      );

    }


    /* =====================================================
       2. OPEN RAZORPAY
    ===================================================== */

    const options = {

      key: data.keyId,

      amount: data.amount,

      currency: data.currency || "INR",

      name: "Wealthoria",

      description:
        course.title,

      order_id:
        data.orderId,


      handler:
        async function (paymentResponse) {

          try {

            /* =============================================
               3. VERIFY PAYMENT
            ============================================= */

            const verifyResponse =
              await fetch(
                "https://webinar-registration-backend.onrender.com/api/payment/verify-course-payment",
                {
                  method: "POST",

                  headers: {
                    "Content-Type":
                      "application/json"
                  },

                  body: JSON.stringify({

                    courseId:
                      course.id,

                    razorpay_order_id:
                      paymentResponse.razorpay_order_id,

                    razorpay_payment_id:
                      paymentResponse.razorpay_payment_id,

                    razorpay_signature:
                      paymentResponse.razorpay_signature

                  })
                }
              );


            const verifyData =
              await verifyResponse.json();


            if (!verifyResponse.ok) {

              throw new Error(
                verifyData?.message ||
                "Payment verification failed."
              );

            }


            /* =============================================
               4. PAYMENT SUCCESS
            ============================================= */
/* =====================================================
   SAVE COURSE PURCHASE TO FIRESTORE
===================================================== */

if (window.db && window.auth?.currentUser) {

  await window.db
    .collection("coursePurchases")
    .add({

      userId:
        window.auth.currentUser.uid,

      userEmail:
        window.auth.currentUser.email || "",

      courseId:
        String(course.id),

      courseTitle:
        course.title || "",

      amount:
        Number(course.price || 0),

      razorpayOrderId:
        paymentResponse.razorpay_order_id,

      razorpayPaymentId:
        paymentResponse.razorpay_payment_id,

      status:
        "paid",

      paidAt:
        new Date(),

      createdAt:
        new Date()

    });

  console.log(
    "Course purchase saved to Firestore"
  );

}


/* =====================================================
   UNLOCK COURSE
===================================================== */

alert(
  "Payment successful. Course unlocked."
);

setPurchasedCourses(
  (current) => {

    if (
      current.includes(course.id)
    ) {

      return current;

    }

    return [
      ...current,
      course.id
    ];

  }
);


            setPreviewEnded(false);

            setTimeLeft(30);


          } catch (error) {

            console.error(
              "Payment verification error:",
              error
            );


            alert(
              error.message ||
              "Payment verification failed."
            );

          }

        },


      prefill: {

        name:
          window.auth.currentUser
            ?.displayName || "",

        email:
          window.auth.currentUser
            ?.email || ""

      },


      theme: {

        color:
          "#e8473f"

      },

      modal: {

        ondismiss: function () {

          console.log(
            "Razorpay checkout closed."
          );

        }

      }

    };


    if (
      typeof window.Razorpay !==
      "function"
    ) {

      throw new Error(
        "Razorpay Checkout is still loading. Please wait a moment and try again."
      );

    }


    const razorpay =
      new window.Razorpay(
        options
      );


    razorpay.open();


  } catch (error) {

    console.error(
      "Course payment error:",
      error
    );


    alert(
      error.message ||
      "Unable to start payment."
    );

  }

};
  /* =======================================================
     FILTER COURSES
  ======================================================= */

  const availableCourses =
    firestoreCourses.length > 0
      ? firestoreCourses
      : COURSE_VIDEOS;

  const filteredCourses =
    availableCourses.filter((course) => {

      const search =
        searchQuery
          .trim()
          .toLowerCase();

      if (!search) {
        return true;
      }

      return (
        course.title
          .toLowerCase()
          .includes(search)
        ||
        course.category
          .toLowerCase()
          .includes(search)
        ||
        course.description
          .toLowerCase()
          .includes(search)
      );

    });


  /* =======================================================
     PAGE
  ======================================================= */

  return (

    <section
      className="member-course-page"
      
    >


      {/* =================================================
          SEARCH BAR
      ================================================= */}

      <div className="member-course-search">

        <span
          className="member-course-search-icon"
          aria-hidden="true"
        >
          🔍
        </span>


        <input
          type="text"
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) =>
            setSearchQuery(e.target.value)
          }
        />


        {searchQuery && (

          <button
            type="button"
            className="member-course-search-clear"
            onClick={() =>
              setSearchQuery("")
            }
            aria-label="Clear search"
          >
            ×
          </button>

        )}

      </div>


      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="member-course-header">

        <div>

          <span className="member-eyebrow">
            LEARNING
          </span>


          <h2>
            Course Videos
          </h2>


          <p>
            Learn practical investing and trading
            concepts through our video courses.
          </p>

        </div>

      </div>


      {/* =================================================
          COURSE LEVEL BUTTONS
      ================================================= */}

      <div className="member-course-level-buttons">

        {COURSE_LEVELS.map((level) => (

          <button
            key={level.id}
            type="button"
            className={
              selectedLevel === level.id
                ? "member-course-level-btn active"
                : "member-course-level-btn"
            }
            onClick={() =>
              setSelectedLevel(
                selectedLevel === level.id
                  ? null
                  : level.id
              )
            }
          >
            {level.title.replace(" Videos", "")}
          </button>

        ))}

      </div>


      {/* =================================================
          COURSE LIST
      ================================================= */}

      {coursesLoading ? (

        <div className="member-course-empty">

          <div className="member-course-empty-icon">
            ⏳
          </div>

          <h3>
            Loading courses...
          </h3>

          <p>
            Please wait while we load the latest courses.
          </p>

        </div>

      ) : !selectedLevel ? (

        <div className="member-course-level-empty">

          <div className="member-course-level-empty-icon">
            🎓
          </div>

          <h3>
            Choose a course level
          </h3>

          <p>
            Select Beginner, Intermediate, Advanced,
            or Expert to view the available videos.
          </p>

        </div>

      ) : (

        <div className="member-course-sections">

          {COURSE_LEVELS
            .filter(
              (level) =>
                level.id === selectedLevel
            )
            .map((level) => {

              const levelCourses =
                filteredCourses.filter(
                  (course) =>
                    String(
                      course.level || ""
                    ).toLowerCase() ===
                    level.id
                );


              return (

                <section
                  key={level.id}
                  className="member-course-level-section"
                >

                  {/* LEVEL HEADER */}

                  <div className="member-course-level-head">

                    <div>

                      <span className="member-eyebrow">
                        {level.title}
                      </span>

                      <h3>
                        {level.subtitle}
                      </h3>

                    </div>

                    <span className="member-course-level-count">
                      {levelCourses.length}{" "}
                      {levelCourses.length === 1
                        ? "Video"
                        : "Videos"}
                    </span>

                  </div>


                  {/* NO VIDEOS */}

                  {levelCourses.length === 0 ? (

                    <div className="member-course-level-empty">

                      <div className="member-course-level-empty-icon">
                        🎬
                      </div>

                      <h3>
                        No {level.title.replace(" Videos", "")} videos yet
                      </h3>

                      <p>
                        Courses added to this level will appear here.
                      </p>

                    </div>

                  ) : (

                    <div className="member-course-grid">

                      {levelCourses.map((course) => {

                        const purchased =
                          isPurchased(
                            course.id
                          );


                        return (

                          <article
                            className="member-course-card"
                            key={course.id}
                          >

                            {/* THUMBNAIL */}

                            <div className="member-course-thumbnail">

                              {course.thumbnailUrl ? (

                                <img
                                  src={
                                    course.thumbnailUrl
                                  }
                                  alt={
                                    course.title
                                  }
                                  onContextMenu={(event) =>
                                    event.preventDefault()
                                  }
                                />

                              ) : (

                                <div
                                  className="course-thumb-fallback"
                                >
                                  {course.title}
                                </div>

                              )}


                              <div className="member-course-overlay">

                                <button
                                  type="button"
                                  className="member-course-play"
                                  onClick={() =>
                                    openCourse(
                                      course
                                    )
                                  }
                                  aria-label={
                                    `Watch ${course.title}`
                                  }
                                >
                                  ▶
                                </button>

                              </div>


                              {!purchased && (

                                <span className="member-course-preview-badge">
                                  30 SEC PREVIEW
                                </span>

                              )}


                              {purchased && (

                                <span className="member-course-unlocked-badge">
                                  ✓ UNLOCKED
                                </span>

                              )}

                            </div>


                            {/* COURSE DETAILS */}

                            <div className="member-course-body">

                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "7px",
                                  marginBottom: "6px",
                                  flexWrap: "wrap"
                                }}
                              >

                                <span className="member-course-category">
                                  {level.title.replace(
                                    " Videos",
                                    ""
                                  )}
                                </span>

                                {course.category && (

                                  <span
                                    style={{
                                      fontSize: "11px",
                                      opacity: 0.65
                                    }}
                                  >
                                    {course.category}
                                  </span>

                                )}

                              </div>


                              <h3>
                                {course.title}
                              </h3>


                              <p>
                                {course.description}
                              </p>


                              <div className="member-course-footer">

                                <div className="member-course-price">

                                  <small>
                                    Course
                                  </small>

                                  <strong>
                                    ₹
                                    {Number(
                                      course.price || 0
                                    ).toLocaleString(
                                      "en-IN"
                                    )}
                                  </strong>

                                </div>


                                <button
                                  type="button"
                                  className="member-course-button"
                                  onClick={() =>
                                    openCourse(
                                      course
                                    )
                                  }
                                >
                                  {purchased
                                    ? "Watch Course →"
                                    : "Preview →"}
                                </button>

                              </div>

                            </div>

                          </article>

                        );

                      })}

                    </div>

                  )}

                </section>

              );

            })}

        </div>

      )}
      {/* =================================================
          VIDEO MODAL
      ================================================= */}

      {showPreview &&
        selectedCourse && (

          <div
            className="member-course-modal"
            onClick={(event) => {

              if (
                event.target ===
                event.currentTarget
              ) {

                closeCourse();

              }

            }}
          >


            <div className="member-course-modal-card">


              {/* =========================================
                  MODAL HEADER
              ========================================= */}

              <div className="member-course-modal-header">

                <div>

                  <span className="member-course-category">
                    {selectedCourse.category}
                  </span>


                  <h3>
                    {selectedCourse.title}
                  </h3>

                </div>


                <button
                  type="button"
                  className="member-course-close"
                  onClick={closeCourse}
                  aria-label="Close"
                >
                  ×
                </button>

              </div>

{/* =========================================
    VIDEO
========================================= */}

<div className="member-course-video">

  {/* VIDEO PLAYS ONLY WHILE PREVIEW IS ACTIVE
      OR AFTER THE COURSE IS PURCHASED */}

  {(isPurchased(selectedCourse.id) || !previewEnded) && (
    
    selectedCourse.videoEmbedUrl ? (

      <iframe
      key={
    selectedCourse.videoEmbedUrl +
    "-" +
    (isPurchased(selectedCourse.id)
      ? "full"
      : "preview")
  }
  src={(() => {
    const url =
      selectedCourse.videoEmbedUrl;

    if (isPurchased(selectedCourse.id)) {
      return url;
    }

    return url.includes("?")
      ? `${url}&controls=off`
      : `${url}?controls=off`;
  })()}
        src={selectedCourse.videoEmbedUrl}
        title={selectedCourse.title}
        allow="autoplay; encrypted-media; fullscreen"
        allowFullScreen
        onContextMenu={(event) =>
          event.preventDefault()
        }
        style={{
          width: "100%",
          height: "100%",
          border: 0
        }}
      />

    ) : (

      <div
        style={{
          height: "100%",
          minHeight: "360px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          background: "#111"
        }}
      >
        Video player is not available.
      </div>

    )

  )}


  {/* =========================================
      PREVIEW ENDED
  ========================================= */}

  {!isPurchased(selectedCourse.id) &&
    previewEnded && (

      <div className="member-course-lock">

        <div className="member-course-lock-icon">
          🔒
        </div>

        <span className="member-course-lock-label">
          PREVIEW ENDED
        </span>

        <h3>
          Buy to watch more
        </h3>

        <p>
          Your 30-second preview has ended.
          Purchase this course to watch the
          complete video.
        </p>

        <button
          type="button"
          className="member-course-buy"
          onClick={() =>
            buyCourse(selectedCourse)
          }
        >
          Buy to Watch More · ₹
          {selectedCourse.price}
        </button>

      </div>

    )}

</div>

              {/* =========================================
                  PREVIEW TIMER
              ========================================= */}

              {!isPurchased(
                selectedCourse.id
              ) &&
                !previewEnded && (

                  <div className="member-course-timer">

                    Free preview ends in

                    <strong>
                      {" "}
                      {timeLeft}
                    </strong>

                    {" "}seconds

                  </div>

                )}


              {/* =========================================
                  PURCHASED MESSAGE
              ========================================= */}

              {isPurchased(
                selectedCourse.id
              ) && (

                <div className="member-course-unlocked">

                  <span>
                    ✓
                  </span>

                  You have full access
                  to this course.

                </div>

              )}


              {/* =========================================
                  BUY FOOTER
              ========================================= */}

              {!isPurchased(
                selectedCourse.id
              ) &&
                previewEnded && (

                  <div className="member-course-modal-footer">

                    <div>

                      <span>
                        Full course access
                      </span>


                      <strong>
                        ₹{selectedCourse.price}
                      </strong>

                    </div>


                    <button
                      type="button"
                      className="member-course-buy"
                      onClick={() =>
                        buyCourse(
                          selectedCourse
                        )
                      }
                    >
                      Buy Now
                    </button>

                  </div>

                )}

            </div>

          </div>

        )}

    </section>

  );

}


/* =========================================================
   EXPORT
========================================================= */

window.CourseVideos = CourseVideos;