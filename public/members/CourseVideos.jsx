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


  /* =======================================================
     SEARCH
  ======================================================= */

  const [searchQuery, setSearchQuery] = useState("");


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
     "http://api.wealthoria.in/api/payment/create-course-order",
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
                "http://api.wealthoria.in/api/payment/verify-course-payment",
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

            alert(
              "Payment successful. Course unlocked."
            );


            setPurchasedCourses(
              (current) => {

                if (
                  current.includes(
                    course.id
                  )
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
      onContextMenu={(event) =>
        event.preventDefault()
      }
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
          COURSE GRID
      ================================================= */}

      <div className="member-course-grid">


        {coursesLoading ? (

          <div className="member-course-empty">
            <div className="member-course-empty-icon">⏳</div>
            <h3>Loading courses...</h3>
            <p>
              Please wait while we load the latest courses.
            </p>
          </div>

        ) : filteredCourses.length > 0 ? (

          filteredCourses.map((course) => {

            const purchased =
              isPurchased(course.id);


            return (

              <article
                className="member-course-card"
                key={course.id}
              >


                {/* =========================================
                    THUMBNAIL
                ========================================= */}

                <div className="member-course-thumbnail">

                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      onContextMenu={(event) =>
                        event.preventDefault()
                      }
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: "#20242b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: 700,
                        padding: "20px",
                        textAlign: "center"
                      }}
                    >
                      {course.title}
                    </div>
                  )}


                  {/* DARK OVERLAY */}

                  <div className="member-course-overlay">


                    {/* PLAY BUTTON */}

                    <button
                      type="button"
                      className="member-course-play"
                      onClick={() =>
                        openCourse(course)
                      }
                      aria-label={
                        `Watch ${course.title}`
                      }
                    >
                      ▶
                    </button>


                  </div>


                  {/* PREVIEW LABEL */}

                  {!purchased && (

                    <span className="member-course-preview-badge">
                      30 SEC PREVIEW
                    </span>

                  )}


                  {/* UNLOCKED LABEL */}

                  {purchased && (

                    <span className="member-course-unlocked-badge">
                      ✓ UNLOCKED
                    </span>

                  )}

                </div>


                {/* =========================================
                    COURSE DETAILS
                ========================================= */}

                <div className="member-course-body">


                  <span className="member-course-category">
                    {course.level || "Intermediate"}
                  </span>

                  {course.category && (
                    <span
                      style={{
                        display: "inline-block",
                        marginLeft: "8px",
                        fontSize: "12px",
                        opacity: 0.75
                      }}
                    >
                      {course.category}
                    </span>
                  )}


                  <h3>
                    {course.title}
                  </h3>


                  <p>
                    {course.description}
                  </p>


                  {/* COURSE FOOTER */}

                  <div className="member-course-footer">


                    <div className="member-course-price">

                      <small>
                        Course
                      </small>


                      <strong>
                        ₹{course.price}
                      </strong>

                    </div>


                    <button
                      type="button"
                      className="member-course-button"
                      onClick={() =>
                        openCourse(course)
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

          })

        ) : (

          /* =================================================
             NO SEARCH RESULTS
          ================================================= */

          <div className="member-course-empty">

            <div className="member-course-empty-icon">
              🔍
            </div>

            <h3>
              No courses found
            </h3>

            <p>
              Try searching for another course,
              category or topic.
            </p>

            <button
              type="button"
              onClick={() =>
                setSearchQuery("")
              }
            >
              View All Courses
            </button>

          </div>

        )}

      </div>


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