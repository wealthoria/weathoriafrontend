/* global React, window */

const {
  useState,
  useEffect
} = React;

const {
  useAdminAuth
} = window;

const {
  Shell
} = window;


/* =========================================================
   COURSE LEVELS
========================================================= */

const COURSE_LEVELS = [
  {
    id: "beginner",
    label: "Beginner",
    description: "Start with the fundamentals"
  },
  {
    id: "intermediate",
    label: "Intermediate",
    description: "Build practical knowledge"
  },
  {
    id: "advanced",
    label: "Advanced",
    description: "Advanced market concepts"
  },
  {
    id: "expert",
    label: "Expert",
    description: "Professional-level learning"
  }
];


/* =========================================================
   CATEGORY

   For now only Fundamentals.
========================================================= */

const COURSE_CATEGORIES = [
  "Fundamentals"
];


/* =========================================================
   COURSE LIST
========================================================= */

function CoursesList() {

  const [selectedLevel, setSelectedLevel] =
    useState("beginner");

  const [courses, setCourses] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [showForm, setShowForm] =
    useState(false);

  const [editingCourse, setEditingCourse] =
    useState(null);

  const [previewCourse, setPreviewCourse] =
    useState(null);


  /* =======================================================
     LOAD COURSES FROM FIRESTORE
  ======================================================= */

  useEffect(() => {

    if (!window.db) {

      console.error(
        "Firestore window.db is not available"
      );

      setLoading(false);

      return;
    }


    const unsubscribe =
      window.db
        .collection("courses")
        .onSnapshot(

          (snapshot) => {

            const rows =
              snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
              }));

            console.log(
              "Courses loaded from Firestore:",
              rows
            );

            setCourses(rows);

            setLoading(false);

          },

          (error) => {

            console.error(
              "Error loading courses:",
              error
            );

            setLoading(false);

          }

        );


    return () => unsubscribe();

  }, []);


  /* =======================================================
     FILTER BY LEVEL
  ======================================================= */

  const filteredCourses =
    courses.filter(
      (course) =>
        course.level === selectedLevel
    );


  /* =======================================================
     ADD COURSE
  ======================================================= */

  const openAddCourse = () => {

    setEditingCourse(null);

    setShowForm(true);

  };


  /* =======================================================
     EDIT COURSE
  ======================================================= */

  const openEditCourse = (course) => {

    setEditingCourse(course);

    setShowForm(true);

  };


  /* =======================================================
     DELETE COURSE
  ======================================================= */

  const deleteCourse = async (course) => {

    const confirmed =
      window.confirm(
        `Delete "${course.title}"?`
      );


    if (!confirmed) return;


    try {

      await window.db
        .collection("courses")
        .doc(course.id)
        .delete();


      console.log(
        "Course deleted:",
        course.id
      );


    } catch (error) {

      console.error(
        "Error deleting course:",
        error
      );

      window.alert(
        error.message ||
        "Unable to delete course."
      );

    }

  };


  /* =======================================================
     UI
  ======================================================= */

  return (

    <Shell
      title="Courses"
      subtitle="Create and manage Wealthoria courses"
    >

      <div className="course-manager">


        {/* ===============================================
            LEFT SIDEBAR
        =============================================== */}

        <aside className="course-level-sidebar">

          <div className="course-level-heading">

            <span className="course-level-small">
              COURSE LEVELS
            </span>

            <h3>
              Learning Path
            </h3>

          </div>


          <div className="course-level-list">

            {COURSE_LEVELS.map(
              (level, index) => (

                <button
                  key={level.id}
                  type="button"
                  className={
                    selectedLevel === level.id
                      ? "course-level-btn active"
                      : "course-level-btn"
                  }
                  onClick={() => {

                    setSelectedLevel(
                      level.id
                    );

                    setShowForm(false);

                  }}
                >

                  <span className="course-level-number">

                    {index + 1}

                  </span>


                  <span className="course-level-info">

                    <strong>
                      {level.label}
                    </strong>

                    <small>
                      {level.description}
                    </small>

                  </span>


                  <span className="course-level-count">

                    {
                      courses.filter(
                        course =>
                          course.level ===
                          level.id
                      ).length
                    }

                  </span>

                </button>

              )
            )}

          </div>

        </aside>


        {/* ===============================================
            RIGHT CONTENT
        =============================================== */}

        <main className="course-main">


          {showForm ? (

            <CourseForm

              level={selectedLevel}

              course={editingCourse}

              onCancel={() => {

                setShowForm(false);

                setEditingCourse(null);

              }}

              onSaved={() => {

                setShowForm(false);

                setEditingCourse(null);

              }}

            />

          ) : (

            <React.Fragment>


              {/* =========================================
                  HEADER
              ========================================= */}

              <div className="course-page-head">

                <div>

                  <span className="course-eyebrow">

                    {
                      COURSE_LEVELS.find(
                        item =>
                          item.id ===
                          selectedLevel
                      )?.label
                    }

                  </span>


                  <h2>

                    {
                      COURSE_LEVELS.find(
                        item =>
                          item.id ===
                          selectedLevel
                      )?.label
                    } Courses

                  </h2>


                  <p>

                    Manage courses available
                    at this learning level.

                  </p>

                </div>


                <button
                  type="button"
                  className="btn btn-green"
                  onClick={openAddCourse}
                >

                  + Add Course

                </button>

              </div>


              {/* =========================================
                  COURSES
              ========================================= */}

              {loading ? (

                <div className="course-empty">

                  Loading courses...

                </div>

              ) : filteredCourses.length === 0 ? (

                <div className="course-empty">

                  <div className="course-empty-icon">

                    ▷

                  </div>


                  <h3>

                    No {
                      COURSE_LEVELS.find(
                        item =>
                          item.id ===
                          selectedLevel
                      )?.label
                    } courses yet

                  </h3>


                  <p>

                    Create your first course
                    for this learning level.

                  </p>


                  <button
                    type="button"
                    className="btn btn-green"
                    onClick={openAddCourse}
                  >

                    + Add Course

                  </button>

                </div>

              ) : (

                <div className="course-card-grid">

                  {filteredCourses.map(
                    course => (

                      <div
                        className="course-manage-card"
                        key={course.id}
                      >


                        {/* COURSE THUMBNAIL */}

                        <div
                          style={{
                            position: "relative",
                            width: "100%",
                            aspectRatio: "16 / 9",
                            marginBottom: "16px",
                            borderRadius: "14px",
                            overflow: "hidden",
                            background: "#111"
                          }}
                        >

                          {course.thumbnailUrl ? (

                            <img
                              src={course.thumbnailUrl}
                              alt={course.title || "Course thumbnail"}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block"
                              }}
                            />

                          ) : (

                            <div
                              style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontWeight: 700,
                                textAlign: "center",
                                padding: "20px",
                                background:
                                  "linear-gradient(135deg,#16212b,#334155)"
                              }}
                            >
                              {course.title || "Course thumbnail"}
                            </div>

                          )}


                          {(course.videoEmbedUrl || course.videoId) && (

                            <button
                              type="button"
                              onClick={() =>
                                setPreviewCourse(course)
                              }
                              aria-label={
                                `Preview ${course.title || "course"} video`
                              }
                              style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                transform:
                                  "translate(-50%, -50%)",
                                width: "62px",
                                height: "62px",
                                borderRadius: "50%",
                                border: 0,
                                background: "#e8473f",
                                color: "#fff",
                                fontSize: "25px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow:
                                  "0 8px 25px rgba(0,0,0,.35)"
                              }}
                            >
                              ▶
                            </button>

                          )}

                        </div>


                        <div className="course-card-top">

                          <span
                            className={
                              course.status ===
                              "published"
                                ? "course-status published"
                                : "course-status draft"
                            }
                          >

                            {
                              course.status ||
                              "draft"
                            }

                          </span>


                          <span className="course-category">

                            {
                              course.category ||
                              "Fundamentals"
                            }

                          </span>

                        </div>


                        <h3>

                          {
                            course.title ||
                            "Untitled course"
                          }

                        </h3>


                        <p className="course-description">

                          {
                            course.description ||
                            "No description"
                          }

                        </p>


                        <div className="course-card-meta">

                          <span>

                            ₹{
                              Number(
                                course.price || 0
                              ).toLocaleString(
                                "en-IN"
                              )
                            }

                          </span>


                          {(course.videoEmbedUrl || course.videoId) && (

                            <button
                              type="button"
                              onClick={() =>
                                setPreviewCourse(course)
                              }
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                border: 0,
                                background: "transparent",
                                color: "inherit",
                                fontWeight: 700,
                                cursor: "pointer",
                                padding: 0
                              }}
                            >
                              ▶ Preview VdoCipher
                            </button>

                          )}

                        </div>


                        <div className="course-card-actions">

                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() =>
                              openEditCourse(
                                course
                              )
                            }
                          >

                            Edit

                          </button>


                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() =>
                              deleteCourse(
                                course
                              )
                            }
                          >

                            Delete

                          </button>

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </React.Fragment>

          )}

        </main>

      </div>


      {/* VDOCIPHER PREVIEW */}

      {previewCourse && (

        <div
          onClick={() =>
            setPreviewCourse(null)
          }
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "rgba(0,0,0,.78)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
        >

          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            style={{
              width: "min(900px, 100%)",
              background: "#fff",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow:
                "0 30px 80px rgba(0,0,0,.45)"
            }}
          >

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid #eee"
              }}
            >

              <div>

                <strong>
                  {previewCourse.title}
                </strong>

                <div
                  style={{
                    color: "#777",
                    fontSize: "12px",
                    marginTop: "4px"
                  }}
                >
                  VdoCipher video preview
                </div>

              </div>


              <button
                type="button"
                onClick={() =>
                  setPreviewCourse(null)
                }
                style={{
                  border: 0,
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "#f3f3f3",
                  fontSize: "22px",
                  cursor: "pointer"
                }}
                aria-label="Close preview"
              >
                ×
              </button>

            </div>


            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "16 / 9",
                background: "#000"
              }}
            >

              {previewCourse.videoEmbedUrl ? (

                <iframe
                  src={previewCourse.videoEmbedUrl}
                  title={
                    previewCourse.title ||
                    "VdoCipher video"
                  }
                  allow="autoplay; encrypted-media; fullscreen"
                  allowFullScreen
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    border: 0
                  }}
                />

              ) : (

                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    padding: "20px",
                    textAlign: "center"
                  }}
                >
                  VdoCipher Embed URL is missing.
                  Click Edit and add the VdoCipher embed URL.
                </div>

              )}

            </div>


            <div
              style={{
                padding: "14px 20px",
                color: "#777",
                fontSize: "13px"
              }}
            >
              Click outside the player or × to close.
            </div>

          </div>

        </div>

      )}


    </Shell>

  );

}


/* =========================================================
   ADD / EDIT COURSE FORM
========================================================= */

function CourseForm({
  level,
  course,
  onCancel,
  onSaved
}) {

  const auth =
    typeof useAdminAuth === "function"
      ? useAdminAuth()
      : {};


  const user =
    auth?.user || null;


  const [title, setTitle] =
    useState(course?.title || "");

  const [description, setDescription] =
    useState(
      course?.description || ""
    );

  const [price, setPrice] =
    useState(
      course?.price ?? ""
    );

  const [category, setCategory] =
    useState(
      course?.category ||
      "Fundamentals"
    );

  const [videoId, setVideoId] =
    useState(
      course?.videoId || ""
    );

  const [videoEmbedUrl, setVideoEmbedUrl] =
    useState(
      course?.videoEmbedUrl || ""
    );

  const [thumbnailUrl, setThumbnailUrl] =
    useState(
      course?.thumbnailUrl || ""
    );

  const [thumbnailFile, setThumbnailFile] =
    useState(null);

  const [thumbnailPreview, setThumbnailPreview] =
    useState(
      course?.thumbnailUrl || ""
    );

  const [uploadingThumbnail, setUploadingThumbnail] =
    useState(false);

  const [status, setStatus] =
    useState(
      course?.status || "draft"
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");


  const isEditing =
    Boolean(course?.id);


  const levelName =
    COURSE_LEVELS.find(
      item => item.id === level
    )?.label || "Course";


  /* =======================================================
     SAVE
  ======================================================= */

  const save = async (event) => {

    event.preventDefault();

    setError("");


    if (!title.trim()) {

      setError(
        "Please enter the course title."
      );

      return;

    }


    if (
      price !== "" &&
      Number(price) < 0
    ) {

      setError(
        "Price cannot be negative."
      );

      return;

    }


    setSaving(true);


    try {

      if (!window.db) {

        throw new Error(
          "Firestore is not connected."
        );

      }


      const now =
        window.firebase
          ?.firestore
          ?.FieldValue
          ?.serverTimestamp
          ? window.firebase
              .firestore
              .FieldValue
              .serverTimestamp()
          : new Date();


      /* ===============================================
         UPLOAD THUMBNAIL TO LOCAL SERVER

         The server stores:
         members/course-thumbnails/

         and returns the public URL.
      =============================================== */

      let finalThumbnailUrl =
        thumbnailUrl.trim();

      if (thumbnailFile) {

        setUploadingThumbnail(true);

        const formData =
          new FormData();

        formData.append(
          "thumbnail",
          thumbnailFile
        );

        formData.append(
          "courseTitle",
          title.trim()
        );

        const response =
          await fetch(
            "http://localhost:5174/api/upload-course-thumbnail",
            {
              method: "POST",
              body: formData
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message ||
            "Thumbnail upload failed."
          );
        }

        finalThumbnailUrl =
          result.url;

        setThumbnailUrl(
          finalThumbnailUrl
        );

        setUploadingThumbnail(false);
      }


      const payload = {

        level: level,

        title:
          title.trim(),

        description:
          description.trim(),

        price:
          Number(price || 0),

        category,

        videoProvider: "vdocipher",

        videoId:
          videoId.trim(),

        videoEmbedUrl:
          videoEmbedUrl.trim(),

        thumbnailUrl:
          finalThumbnailUrl,

        status,

        updatedAt: now

      };


      /* ===============================================
         EDIT EXISTING COURSE
      =============================================== */

      if (isEditing) {

        await window.db
          .collection("courses")
          .doc(course.id)
          .update(payload);


        console.log(
          "Course updated:",
          course.id
        );

      }


      /* ===============================================
         CREATE NEW COURSE
      =============================================== */

      else {

        payload.createdAt =
          now;

        payload.createdBy =
          user?.uid || "";

        payload.createdByName =
          user?.name ||
          user?.displayName ||
          user?.email ||
          "Admin";


        const doc =
          await window.db
            .collection("courses")
            .add(payload);


        console.log(
          "Course created:",
          doc.id
        );

      }


      onSaved();


    } catch (error) {

      setUploadingThumbnail(false);

      console.error(
        "Error saving course:",
        error
      );


      setError(
        error?.message ||
        "Unable to save course."
      );


    } finally {

      setSaving(false);

    }

  };


  /* =======================================================
     FORM
  ======================================================= */

  return (

    <div className="course-form-wrap">


      <div className="course-form-head">

        <div>

          <button
            type="button"
            className="course-back"
            onClick={onCancel}
          >

            ← Back to {levelName}

          </button>


          <h2>

            {
              isEditing
                ? "Edit Course"
                : `Add ${levelName} Course`
            }

          </h2>


          <p>

            Add the course information
            and learning video.

          </p>

        </div>

      </div>


      {error && (

        <div className="form-alert">

          ⚠ {error}

        </div>

      )}


      <form
        onSubmit={save}
        className="course-editor-form"
      >


        {/* =============================================
            BASIC INFORMATION
        ============================================= */}

        <div className="course-form-card">

          <div className="course-form-card-head">

            <span className="course-step">
              01
            </span>

            <div>

              <h3>
                Course information
              </h3>

              <p>
                Basic information shown
                to students.
              </p>

            </div>

          </div>


          <div className="field">

            <label>
              Course title
            </label>

            <input
              className="input"
              type="text"
              value={title}
              onChange={
                event =>
                  setTitle(
                    event.target.value
                  )
              }
              placeholder="Example: Stock Market Fundamentals"
              disabled={saving}
            />

          </div>


          <div className="field">

            <label>
              Description
            </label>

            <textarea
              className="input course-textarea"
              value={description}
              onChange={
                event =>
                  setDescription(
                    event.target.value
                  )
              }
              placeholder="What will students learn in this course?"
              disabled={saving}
            />

          </div>


          <div className="course-form-two">


            <div className="field">

              <label>
                Price (₹)
              </label>

              <input
                className="input"
                type="number"
                min="0"
                value={price}
                onChange={
                  event =>
                    setPrice(
                      event.target.value
                    )
                }
                placeholder="999"
                disabled={saving}
              />

            </div>


            <div className="field">

              <label>
                Category
              </label>

              <select
                className="input"
                value={category}
                onChange={
                  event =>
                    setCategory(
                      event.target.value
                    )
                }
                disabled={saving}
              >

                {COURSE_CATEGORIES.map(
                  item => (

                    <option
                      key={item}
                      value={item}
                    >

                      {item}

                    </option>

                  )
                )}

              </select>

            </div>

          </div>

        </div>


        {/* =============================================
            VIDEO
        ============================================= */}

        <div className="course-form-card">

          <div className="course-form-card-head">

            <span className="course-step">
              02
            </span>

            <div>
              <h3>Course video</h3>
              <p>
                Add your VdoCipher video ID, embed URL and thumbnail.
              </p>
            </div>

          </div>

          <div className="field">

            <label>VdoCipher Video ID</label>

            <input
              className="input"
              type="text"
              value={videoId}
              onChange={(event) =>
                setVideoId(event.target.value)
              }
              placeholder="Example: 48bc49d7ad7a4bd2b874d4738afbc39b"
              disabled={saving}
            />

          </div>

          <div className="field">

            <label>VdoCipher Embed URL</label>

            <input
              className="input"
              type="url"
              value={videoEmbedUrl}
              onChange={(event) =>
                setVideoEmbedUrl(event.target.value)
              }
              placeholder="https://player.vdocipher.com/v2/?otp=..."
              disabled={saving}
            />

            <small style={{
              display: "block",
              marginTop: "6px",
              color: "#777",
              lineHeight: 1.5
            }}>
              Paste only the URL inside the VdoCipher iframe src.
            </small>

          </div>

          {videoEmbedUrl && (
            <div
              style={{
                marginTop: "16px",
                position: "relative",
                width: "100%",
                paddingTop: "56.25%",
                overflow: "hidden",
                borderRadius: "12px"
              }}
            >
              <iframe
                src={videoEmbedUrl}
                title="VdoCipher course video preview"
                allowFullScreen
                allow="encrypted-media"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  border: 0
                }}
              />
            </div>
          )}

          <div
            className="field"
            style={{ marginTop: "20px" }}
          >

            <label>
              Course Thumbnail
            </label>

            <input
              className="input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={saving || uploadingThumbnail}
              onChange={(event) => {

                const file =
                  event.target.files?.[0];

                if (!file) return;

                if (file.size > 5 * 1024 * 1024) {

                  setError(
                    "Thumbnail must be smaller than 5 MB."
                  );

                  event.target.value = "";
                  return;

                }

                setError("");

                setThumbnailFile(file);

                setThumbnailPreview(
                  URL.createObjectURL(file)
                );

              }}
            />

            <small
              style={{
                display: "block",
                marginTop: "7px",
                color: "#777",
                lineHeight: 1.5
              }}
            >
              PNG, JPG or WebP. Maximum 5 MB.
              The image is stored in
              members/course-thumbnails/ with a random filename.
            </small>

          </div>


          {thumbnailPreview && (

            <div
              style={{
                marginTop: "14px"
              }}
            >

              <div
                style={{
                  fontWeight: 700,
                  marginBottom: "8px"
                }}
              >
                Thumbnail Preview
              </div>

              <img
                src={thumbnailPreview}
                alt="Course thumbnail preview"
                style={{
                  display: "block",
                  width: "320px",
                  maxWidth: "100%",
                  aspectRatio: "16 / 9",
                  objectFit: "cover",
                  borderRadius: "12px",
                  border: "1px solid #ddd"
                }}
              />

            </div>

          )}

        </div>


        {/* =============================================
            PUBLISH
        ============================================= */}

        <div className="course-form-card">

          <div className="course-form-card-head">

            <span className="course-step">
              03
            </span>

            <div>

              <h3>
                Publishing
              </h3>

              <p>
                Choose whether students
                can see this course.
              </p>

            </div>

          </div>


          <div className="field">

            <label>
              Status
            </label>

            <select
              className="input"
              value={status}
              onChange={
                event =>
                  setStatus(
                    event.target.value
                  )
              }
              disabled={saving}
            >

              <option value="draft">
                Draft
              </option>

              <option value="published">
                Published
              </option>

            </select>

          </div>

        </div>


        {/* =============================================
            BUTTONS
        ============================================= */}

        <div className="course-save-bar">

          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={saving}
          >

            Cancel

          </button>


          <button
            type="submit"
            className="btn btn-green"
            disabled={saving}
          >

            {
              uploadingThumbnail
                ? "Uploading thumbnail..."
                : saving
                  ? "Saving..."
                  : isEditing
                    ? "Update Course"
                    : "Save Course"
            }

          </button>

        </div>

      </form>

    </div>

  );

}


/* =========================================================
   VDOCIPHER PREVIEW
========================================================= */

function VdoCipherPreview({ embedUrl }) {
  if (!embedUrl) return null;

  return (
    <div
      style={{
        marginTop: "16px",
        position: "relative",
        width: "100%",
        paddingTop: "56.25%",
        overflow: "hidden",
        borderRadius: "12px"
      }}
    >
      <iframe
        src={embedUrl}
        title="VdoCipher course video preview"
        allowFullScreen
        allow="encrypted-media"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: 0
        }}
      />
    </div>
  );
}


/* =========================================================
   ROUTER COMPATIBILITY

   Your app.jsx already expects CourseBuilder.
========================================================= */

function CourseBuilder() {

  return <CoursesList />;

}


/* =========================================================
   EXPORT
========================================================= */

window.CoursesList =
  CoursesList;

window.CourseBuilder =
  CourseBuilder;


console.log(
  "ADMIN COURSES LOADED"
);