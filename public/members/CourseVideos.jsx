/* global React, window */

const { useState, useEffect } = React;


/* =========================================================
   COURSE DATA
========================================================= */

const COURSE_VIDEOS = [
  {
    id: "course-1",
    title: "Stock Market Basics",
    description:
      "Understand the basics of the stock market before you start investing.",
    category: "Investing",
    price: 199,
    youtubeId: "WqrNyi8bR0k"
  },

  {
    id: "course-2",
    title: "Trading Basics",
    description:
      "Learn the fundamentals of trading and understand how markets work.",
    category: "Trading",
    price: 299,
    youtubeId: "2XRfKcIk-_k"
  },

  {
    id: "course-3",
    title: "Technical Analysis",
    description:
      "Learn charts, trends, support, resistance and technical indicators.",
    category: "Technical Analysis",
    price: 399,
    youtubeId: "_zc-QR0-Wfk"
  },

  {
    id: "course-4",
    title: "Fundamental Analysis",
    description:
      "Learn how to understand company fundamentals and financial statements.",
    category: "Investing",
    price: 499,
    youtubeId: "OKiLxaVzpBQ"
  }
];


/* =========================================================
   COURSE VIDEOS
========================================================= */

function CourseVideos() {

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

  const [timeLeft, setTimeLeft] = useState(10);


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

    setTimeLeft(10);

  };


  /* =======================================================
     CLOSE COURSE
  ======================================================= */

  const closeCourse = () => {

    setShowPreview(false);

    setSelectedCourse(null);

    setPreviewEnded(false);

    setTimeLeft(10);

  };


  /* =======================================================
     10 SECOND PREVIEW TIMER
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

  const buyCourse = (course) => {

    /*
      TEMPORARY DEMO PURCHASE.

      Later you can replace this with
      Razorpay + Firebase purchase logic.
    */

    const confirmPurchase = window.confirm(
      `Buy ${course.title} for ₹${course.price}?`
    );


    if (!confirmPurchase) {
      return;
    }


    setPurchasedCourses((current) => {

      if (current.includes(course.id)) {
        return current;
      }

      return [
        ...current,
        course.id
      ];

    });


    setPreviewEnded(false);

    setTimeLeft(10);


    alert(
      "Course unlocked successfully!"
    );

  };


  /* =======================================================
     FILTER COURSES
  ======================================================= */

  const filteredCourses =
    COURSE_VIDEOS.filter((course) => {

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

    <section className="member-course-page">


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


        {filteredCourses.length > 0 ? (

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

                  <img
                    src={
                      `https://img.youtube.com/vi/` +
                      `${course.youtubeId}/hqdefault.jpg`
                    }
                    alt={course.title}
                  />


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
                      10 SEC PREVIEW
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
                    {course.category}
                  </span>


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


                <iframe
                  src={
                    `https://www.youtube.com/embed/` +
                    `${selectedCourse.youtubeId}` +
                    `?autoplay=1&rel=0`
                  }
                  title={
                    selectedCourse.title
                  }
                  allow={
                    "accelerometer; " +
                    "autoplay; " +
                    "clipboard-write; " +
                    "encrypted-media; " +
                    "gyroscope; " +
                    "picture-in-picture"
                  }
                  allowFullScreen
                />


                {/* =====================================
                    LOCK SCREEN
                ===================================== */}

                {!isPurchased(
                  selectedCourse.id
                ) &&
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
                        Your 10-second preview has
                        ended. Purchase this course
                        to watch the complete video.
                      </p>


                      <button
                        type="button"
                        className="member-course-buy"
                        onClick={() =>
                          buyCourse(
                            selectedCourse
                          )
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