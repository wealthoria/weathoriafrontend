import React from "react";

const CourseVideos = () => {
  return (
    <section className="wd-courses-page">

      <div className="wd-courses-orb wd-courses-orb-one"></div>
      <div className="wd-courses-orb wd-courses-orb-two"></div>

      <div className="wd-courses-content">

        <div className="wd-courses-badge">
          <span className="wd-courses-badge-dot"></span>
          Wealthoria Learning
        </div>

        <h1 className="wd-courses-title">
          Learn what matters.
          <span> Grow with confidence.</span>
        </h1>

        <p className="wd-courses-description">
          Courses are charged per lesson, giving you the freedom to choose
          exactly what you want to learn. Simply select and purchase the
          lessons that are relevant to you.
        </p>

        <div className="wd-courses-flow">

          <div className="wd-course-step">
            <div className="wd-course-step-number">01</div>

            <div className="wd-course-step-icon">
              ◇
            </div>

            <h3>Choose</h3>

            <p>
              Select the lessons that match your learning goals.
            </p>
          </div>

          <div className="wd-course-connector">
            <span></span>
          </div>

          <div className="wd-course-step">
            <div className="wd-course-step-number">02</div>

            <div className="wd-course-step-icon">
              ▶
            </div>

            <h3>Learn</h3>

            <p>
              Learn through focused lessons at your own pace.
            </p>
          </div>

          <div className="wd-course-connector">
            <span></span>
          </div>

          <div className="wd-course-step">
            <div className="wd-course-step-number">03</div>

            <div className="wd-course-step-icon">
              ↗
            </div>

            <h3>Grow</h3>

            <p>
              Build knowledge that supports better decisions.
            </p>
          </div>

        </div>

        <div className="wd-courses-coming">
          <span className="wd-courses-pulse"></span>
          Courses are coming soon
        </div>

      </div>
    </section>
  );
};

window.CourseVideos = CourseVideos;

export default CourseVideos;