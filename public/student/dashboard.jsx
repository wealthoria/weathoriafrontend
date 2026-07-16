/* global React, window */
/* =========================================================================
   Student Portal — Dashboard (/student/dashboard)
   ========================================================================= */
const { useApp, Icon } = window;
const { useAuth } = window;
const { useCourses } = window;
const { useRouter, PIcon, ProgressBar, ThumbArt } = window;

function DashboardScreen({ onEnroll, onResume }) {
  const { theme } = useApp();
  const { user } = useAuth();
  const { purchased, browse, lastCourse, getProgress } = useCourses();
  const { navigate } = useRouter();

  // a11y: focus the dashboard heading after mount (e.g. just after login)
  React.useEffect(() => {
    const h = document.querySelector(".dash-hello h1");
    if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  }, []);

  const firstName = (user?.name || "there").split(" ")[0];
  const completed = purchased.filter((c) => getProgress(c.id) >= 100).length;
  const inProgress = purchased.length - completed;
  const lastPct = lastCourse ? getProgress(lastCourse.id) : 0;
  const lastLessonIdx = lastCourse ? Math.min(lastCourse.lessonList.length - 1, (window.STUDENT_DATA.SEED_ENROLLMENTS[lastCourse.id]?.lastLessonIndex ?? 0)) : 0;

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="dash pwrap">
      {/* welcome */}
      <div className="dash-hero reveal-up">
        <span className="avatar lg">{firstName.charAt(0).toUpperCase()}</span>
        <div className="dash-hello">
          <span className="eyebrow">{greet}</span>
          <h1>Welcome back, {firstName}</h1>
          <p>{inProgress > 0 ? `You have ${inProgress} course${inProgress > 1 ? "s" : ""} in progress. Keep the momentum going.` : "Ready to start something new?"}</p>
        </div>
        <div className="dash-stats">
          <div className="dstat"><div className="n">{purchased.length}</div><div className="l">Enrolled</div></div>
          <div className="dstat"><div className="n">{inProgress}</div><div className="l">In progress</div></div>
          <div className="dstat"><div className="n">{completed}</div><div className="l">Completed</div></div>
        </div>
      </div>

      {/* continue learning */}
      {lastCourse && (
        <div style={{ marginTop: 28 }} className="reveal-up">
          <div className="continue">
            <div className="ct-body">
              <div className="ct-ey">Continue learning</div>
              <div className="ct-title">{lastCourse.title}</div>
              <div className="ct-lesson">Up next: Lesson {lastLessonIdx + 1} of {lastCourse.lessons} &middot; {lastCourse.lessonList[lastLessonIdx]}</div>
              <div className="ct-prog">
                <ProgressBar value={lastPct} showPct={false} />
                <span className="ct-pct">{lastPct}%</span>
              </div>
            </div>
            <button className="btn btn-green" onClick={() => onResume(lastCourse)}>
              {lastPct >= 100 ? "Review" : "Continue"}<Icon name="play" size={15} />
            </button>
          </div>
        </div>
      )}

      {/* my courses */}
      <div className="sec-head">
        <h2>My courses</h2>
        <button className="link-coral" onClick={() => navigate("/student/collection")}>View collection</button>
      </div>
      {purchased.length ? (
        <div className="course-grid">
          {purchased.map((c) => (
            <window.CourseCard key={c.id} course={c} variant="owned" progress={getProgress(c.id)} onResume={onResume} theme={theme} />
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: "center", padding: 36 }}>
          <p style={{ font: "var(--body-md)", color: "var(--body)", margin: 0 }}>You have not enrolled in any courses yet. Browse below to get started.</p>
        </div>
      )}

      {/* browse */}
      <div className="sec-head" style={{ marginTop: 48 }}>
        <h2>Browse courses</h2>
        <span className="count">{browse.length} available</span>
      </div>
      {browse.length ? (
        <div className="course-grid">
          {browse.map((c) => (
            <window.CourseCard key={c.id} course={c} variant="browse" onEnroll={onEnroll} theme={theme} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <div className="eic"><PIcon name="award" size={30} /></div>
          <h3>You own every course</h3>
          <p>You have enrolled in the full Wealthoria library. New programs are added regularly.</p>
        </div>
      )}
    </div>
  );
}

window.DashboardScreen = DashboardScreen;
