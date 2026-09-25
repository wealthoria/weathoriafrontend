import React from "react";

const Course = () => {
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
    </section>
  );
};

export default Course;