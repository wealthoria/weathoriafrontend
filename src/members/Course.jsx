import React from "react";

const CourseVideos = () => {
  return (
    <section className="wd-courses-page">
      <div className="wd-courses-card">

        <div className="wd-courses-icon">
          ▶
        </div>

        <h1>Courses</h1>

        <p>
          Courses are charged per lesson, giving you the freedom to choose
          exactly what you want to learn. Simply select and purchase the
          lessons that are relevant to you.
        </p>

        <div className="wd-courses-info">
          <span>🎓</span>
          <div>
            <strong>Learn at your own pace</strong>
            <small>
              Select only the lessons that are relevant to you.
            </small>
          </div>
        </div>

        <div className="wd-courses-status">
          Courses are coming soon.
        </div>

      </div>
    </section>
  );
};

window.CourseVideos = CourseVideos;

export default CourseVideos;