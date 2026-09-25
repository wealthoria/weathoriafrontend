const CourseVideos = () => {
  return (
    <section className="wd-course-coming-soon">
      <img
        src="/assets/course-desktop.png"
        alt="Wealthoria Courses Coming Soon"
        className="wd-course-image wd-course-desktop"
      />

      <img
        src="/assets/course-tablet.png"
        alt="Wealthoria Courses Coming Soon"
        className="wd-course-image wd-course-tablet"
      />

      <img
        src="/assets/course-mobile.png"
        alt="Wealthoria Courses Coming Soon"
        className="wd-course-image wd-course-mobile"
      />
    </section>
  );
};

window.CourseVideos = CourseVideos;

export default CourseVideos;