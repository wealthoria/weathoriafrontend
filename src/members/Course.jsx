import React from "react";

const CourseVideos = () => {
  return (
    <section className="wd-course-coming-soon">

      {/* Desktop */}
      <img
        src="/assets/course-desktop.png"
        alt="Wealthoria Courses Coming Soon"
        className="wd-course-image wd-course-desktop"
      />

      {/* Tablet */}
      <img
        src="/assets/course-tablet.png"
        alt="Wealthoria Courses Coming Soon"
        className="wd-course-image wd-course-tablet"
      />

      {/* Mobile */}
      <img
        src="/assets/course-mobile.png"
        alt="Wealthoria Courses Coming Soon"
        className="wd-course-image wd-course-mobile"
      />

      <p className="wd-course-description">
        Courses are charged per lesson, giving you the freedom to choose
        exactly what you want to learn. Simply select and purchase the
        lessons that are relevant to you.
      </p>

    </section>
  );
};

window.CourseVideos = CourseVideos;

export default CourseVideos;