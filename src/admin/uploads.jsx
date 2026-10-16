import React from "react";
import { createPortal } from "react-dom";
import AdminVideoCommentsModal from "./AdminVideoCommentsModal.jsx";

/* =========================================================================
   WEALTHORIA ADMIN — UPLOADS

   PDF
   -> Node backend
   -> backend/public/members/content-pdfs/
   -> Firestore collection: content

   VIDEO
   -> VdoCipher / external video hosting
   -> Video URL + VdoCipher URL + VdoCipher Video ID
   -> Thumbnail -> Node backend
   -> Metadata -> Firestore collection: content

   IMPORTANT:
   The actual VIDEO FILE is NOT uploaded to this server.
   VdoCipher remains the video host.

   Thumbnail
   -> Node backend
   -> backend/public/members/content-thumbnails/

   Metadata
   -> Firestore collection: content
   ========================================================================= */

const {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef
} = React;

const {
  useAdminAuth,
  useRole,
  useAdminData
} = window;

const {
  MIcon,
  useMToast,
  useConfirm
} = window;

const {
  Shell
} = window;


/* =========================================================
   CONFIG
   ========================================================= */

const API_BASE_URL = "https://asia-south1-wealthoria-6fc11.cloudfunctions.net";

const CATEGORIES = [
  "Newsletter",
  "Weekly Roundup",
  "Articles & Reports",
  "Vedios",
  "Ratio Analysis"
];

const MAX_PDF_SIZE =
  25 * 1024 * 1024;

const MAX_THUMBNAIL_SIZE =
  5 * 1024 * 1024;


/* =========================================================
   HELPERS
   ========================================================= */

function fmtSize(bytes) {
  if (!bytes) {
    return "0 KB";
  }

  if (bytes < 1024 * 1024) {
    return (
      (bytes / 1024).toFixed(0) +
      " KB"
    );
  }

  return (
    (bytes / 1024 / 1024).toFixed(1) +
    " MB"
  );
}


function detectType(file) {
  const name =
    (
      file?.name ||
      ""
    ).toLowerCase();

  if (
    file?.type ===
      "application/pdf" ||
    name.endsWith(".pdf")
  ) {
    return "pdf";
  }

  return "pdf";
}


function getAssetDate(value) {
  if (!value) return null;

  try {
    if (value && typeof value.toDate === "function") {
      const date = value.toDate();
      return Number.isNaN(date.getTime()) ? null : date;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    if (
      typeof value === "object" &&
      typeof value.seconds === "number"
    ) {
      const date = new Date(
        value.seconds * 1000 +
        Math.floor((value.nanoseconds || 0) / 1000000)
      );
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch (error) {
    return null;
  }
}

function getAssetMonthKey(item) {
  const date = getAssetDate(
    item?.publishedAt ||
    item?.createdAt ||
    item?.updatedAt
  );

  if (!date) return "undated";

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function formatAssetMonth(key) {
  if (key === "undated") return "Undated";

  const [year, month] = String(key).split("-");
  const date = new Date(
    Number(year),
    Number(month) - 1,
    1
  );

  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric"
  });
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  try {
    if (
      value &&
      typeof value.toDate ===
        "function"
    ) {
      return value
        .toDate()
        .toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
            year: "numeric"
          }
        );
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(value);
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );

  } catch (error) {
    return String(value);
  }
}


/* =========================================================
   FILE URL
   ========================================================= */

function hasThumbnail(item) {
  return Boolean(
    item?.thumbnailUrl ||
    item?.thumbnailPath ||
    item?.thumbnailName
  );
}


function getFileUrl(fileUrl) {
  if (!fileUrl) {
    return "";
  }

  if (
    fileUrl.startsWith("http://") ||
    fileUrl.startsWith("https://")
  ) {
    return fileUrl;
  }

  if (
    fileUrl.startsWith("/")
  ) {
    return (
      API_BASE_URL +
      fileUrl
    );
  }

  return (
    API_BASE_URL +
    "/" +
    fileUrl
  );
}


/* =========================================================
   UPLOAD FILE TO NODE BACKEND
   ========================================================= */


async function getAdminToken() {
  const currentUser = window.auth?.currentUser;

  if (!currentUser) {
    throw new Error(
      "Admin session not found. Please login again."
    );
  }

  return currentUser.getIdToken(true);
}

async function uploadFile(
  file,
  fieldName,
  endpoint,
  onProgress
) {
  if (!file) {
    throw new Error(
      "File is missing."
    );
  }

  const formData =
    new FormData();

  formData.append(
    fieldName,
    file
  );

  const token = await getAdminToken();
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const xhr =
        new XMLHttpRequest();

      xhr.open(
        "POST",
        `${API_BASE_URL}${endpoint}`
      );


      

  xhr.setRequestHeader(
  "Authorization",
  `Bearer ${token}`
  );

      
      xhr.upload.onprogress =
        (event) => {
          if (
            event.lengthComputable &&
            onProgress
          ) {
            const percent =
              Math.round(
                (
                  event.loaded /
                  event.total
                ) *
                  100
              );

            onProgress(
              percent
            );
          }
        };

      xhr.onload = () => {
        let data = null;

        try {
          data =
            JSON.parse(
              xhr.responseText
            );
        } catch (
          parseError
        ) {
          console.error(
            "Upload response parse error:",
            parseError
          );

          reject(
            new Error(
              "Invalid response from upload server."
            )
          );

          return;
        }

        if (
          xhr.status >= 200 &&
          xhr.status < 300 &&
          data?.success
        ) {
          resolve(data);
          return;
        }

        reject(
          new Error(
            data?.message ||
            "File upload failed."
          )
        );
      };

      xhr.onerror = () => {
        reject(
          new Error(
            "Unable to connect to the upload server."
          )
        );
      };

      xhr.onabort = () => {
        reject(
          new Error(
            "Upload cancelled."
          )
        );
      };

      xhr.send(
        formData
      );
    }
  );
}


/* =========================================================
   VIDEO MODAL
   ========================================================= */

function VideoModal({
  onCancel,
  onSave
}) {
  const [
    title,
    setTitle
  ] = useState("");

  const [
    description,
    setDescription
  ] = useState("");

  const [
    category,
    setCategory
  ] = useState("Vedios");

  const [
    tagsStr,
    setTagsStr
  ] = useState("");

  const [
    publishedAt,
    setPublishedAt
  ] = useState(
    new Date()
      .toISOString()
      .slice(0, 10)
  );

  const [
    status,
    setStatus
  ] = useState("published");

  const [
    videoUrl,
    setVideoUrl
  ] = useState("");

  const [
    vdocipherUrl,
    setVdocipherUrl
  ] = useState("");

  const [
    vdocipherVideoId,
    setVdocipherVideoId
  ] = useState("");

  const [
    thumbnailFile,
    setThumbnailFile
  ] = useState(null);

  const [
    thumbnailPreview,
    setThumbnailPreview
  ] = useState("");

  const thumbnailInputRef =
    useRef(null);


  useEffect(() => {
    return () => {
      if (thumbnailPreview) {
        URL.revokeObjectURL(
          thumbnailPreview
        );
      }
    };
  }, [
    thumbnailPreview
  ]);


  /* =======================================================
     THUMBNAIL
     ======================================================= */

  const chooseThumbnail =
    (event) => {
      const file =
        event.target.files?.[0];

      event.target.value = "";

      if (!file) {
        return;
      }

      const validTypes = [
        "image/png",
        "image/jpeg",
        "image/webp"
      ];

      if (
        !validTypes.includes(
          file.type
        )
      ) {
        alert(
          "Thumbnail must be PNG, JPG or WebP."
        );

        return;
      }

      if (
        file.size >
        MAX_THUMBNAIL_SIZE
      ) {
        alert(
          "Thumbnail must be smaller than 5 MB."
        );

        return;
      }

      if (thumbnailPreview) {
        URL.revokeObjectURL(
          thumbnailPreview
        );
      }

      setThumbnailFile(
        file
      );

      setThumbnailPreview(
        URL.createObjectURL(
          file
        )
      );
    };


  /* =======================================================
     SAVE
     ======================================================= */

  const save = () => {
    const cleanTitle =
      title.trim();

    const cleanDescription =
      description.trim();

    const cleanVideoUrl =
      videoUrl.trim();

    const cleanVdocipherUrl =
      vdocipherUrl.trim();

    const cleanVdocipherId =
      vdocipherVideoId.trim();


    if (!cleanTitle) {
      alert(
        "Title is required."
      );

      return;
    }
onSave({
      type: "video",

      title:
        cleanTitle,

      description:
        cleanDescription,

      category,

      tags:
        tagsStr
          .split(",")
          .map(
            (tag) =>
              tag.trim()
          )
          .filter(Boolean),

      publishedAt,

      status,

      videoUrl:
        cleanVideoUrl,

      vdocipherUrl:
        cleanVdocipherUrl,

      vdocipherVideoId:
        cleanVdocipherId,

      thumbnailFile
    });
  };


  const modalContent = (
    <div
      className="mscrim open"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(10, 12, 16, 0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        padding: 20,
        boxSizing: "border-box"
      }}
      onClick={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onCancel();
        }
      }}
    >
      <div
        className="mmodal upload-edit-modal"
        role="dialog"
        aria-modal="true"
        style={{
          width: "94vw",
          maxWidth: 720,
          maxHeight: "92vh",
          overflowY: "auto",
          background: "var(--surface, #ffffff)",
          borderRadius: 16,
          boxShadow: "0 25px 60px -15px rgba(0,0,0,0.35)",
          display: "flex",
          flexDirection: "column",
          margin: "auto"
        }}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="edit-modal-header"
        >
          <div>
            <span
              className="edit-modal-eyebrow"
            >
              VIDEO CONTENT
            </span>

            <h3>
              Add video
            </h3>
          </div>

          <button
            type="button"
            className="row-act"
            onClick={
              onCancel
            }
            style={{
              width: 34,
              height: 34
            }}
          >
            ×
          </button>
        </div>


        {/* =================================================
            TITLE
        ================================================= */}

        <div className="field">
          <label>
            Title <span className="required-star">*</span>
          </label>

          <input
            className="input"
            value={title}
            onChange={(event) =>
              setTitle(
                event.target.value
              )
            }
            placeholder="Enter video title"
          />
        </div>


        {/* =================================================
            DESCRIPTION
        ================================================= */}

        <div className="field">
          <label>
            Description
          </label>

          <textarea
            className="textarea"
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value
              )
            }
            placeholder="Short description"
          />
        </div>


        {/* =================================================
            VIDEO URL
        ================================================= */}

        <div className="field">
          <label>
            Video URL
          </label>

          <input
            className="input"
            type="url"
            value={videoUrl}
            onChange={(event) =>
              setVideoUrl(
                event.target.value
              )
            }
            placeholder="https://..."
          />

          <small
            style={{
              display: "block",
              marginTop: 6,
              opacity: 0.65
            }}
          >
            Public or player URL for this video.
          </small>
        </div>


        {/* =================================================
            VDOCIPHER URL
        ================================================= */}

        <div className="field">
          <label>
            VdoCipher URL
          </label>

          <input
            className="input"
            type="url"
            value={vdocipherUrl}
            onChange={(event) =>
              setVdocipherUrl(
                event.target.value
              )
            }
            placeholder="https://player.vdocipher.com/..."
          />

          <small
            style={{
              display: "block",
              marginTop: 6,
              opacity: 0.65
            }}
          >
            VdoCipher player or video URL.
          </small>
        </div>


        {/* =================================================
            VDOCIPHER VIDEO ID
        ================================================= */}

        <div className="field">
          <label>
            VdoCipher Video ID
          </label>

          <input
            className="input"
            value={
              vdocipherVideoId
            }
            onChange={(event) =>
              setVdocipherVideoId(
                event.target.value
              )
            }
            placeholder="Enter VdoCipher video ID"
          />
        </div>


        {/* =================================================
            CATEGORY + DATE
        ================================================= */}

        <div className="field-grid2">

          <div className="field">
            <label>
              Category
            </label>

            <select
              className="select"
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value
                )
              }
            >
              {CATEGORIES.map(
                (item) => (
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


          <div className="field">
            <label>
              Publish Date
            </label>

            <input
              className="input"
              type="date"
              value={
                publishedAt
              }
              onChange={(event) =>
                setPublishedAt(
                  event.target.value
                )
              }
            />
          </div>

        </div>


        {/* =================================================
            THUMBNAIL
        ================================================= */}

        <div className="field">

          <label>
            Thumbnail
          </label>

          <input
            ref={
              thumbnailInputRef
            }
            type="file"
            accept="
              image/png,
              image/jpeg,
              image/webp
            "
            hidden
            onChange={
              chooseThumbnail
            }
          />

          <button
            type="button"
            className="btn btn-ghost btn-block btn-sm"
            onClick={() =>
              thumbnailInputRef
                .current
                ?.click()
            }
          >
            <MIcon
              name="image"
              size={15}
            />

            Choose thumbnail
          </button>

        </div>


        {/* =================================================
            THUMBNAIL PREVIEW
        ================================================= */}

        {thumbnailPreview && (
          <div
            style={{
              marginTop: 12
            }}
          >
            <img
              src={
                thumbnailPreview
              }
              alt="Video thumbnail preview"
              style={{
                width: "100%",
                height: 220,
                objectFit: "cover",
                borderRadius: 10,
                display: "block"
              }}
            />
          </div>
        )}


        {/* =================================================
            TAGS
        ================================================= */}

        <div className="field">
          <label>
            Tags (comma separated)
          </label>

          <input
            className="input"
            value={tagsStr}
            onChange={(event) =>
              setTagsStr(
                event.target.value
              )
            }
            placeholder="e.g. investing, market, beginner"
          />
        </div>


        {/* =================================================
            STATUS
        ================================================= */}

        <div className="field">
          <label>
            Status
          </label>

          <select
            className="select"
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value
              )
            }
          >
            <option value="published">
              Published
            </option>

            <option value="draft">
              Draft
            </option>
          </select>
        </div>


        {/* =================================================
            INFORMATION
        ================================================= */}

        <div
          style={{
            marginTop: 12,
            padding: 14,
            borderRadius: 10,
            background:
              "rgba(0,0,0,.035)",
            fontSize: 13,
            lineHeight: 1.6
          }}
        >
          <strong>
            Video storage
          </strong>

          <div
            style={{
              marginTop: 5,
              opacity: 0.72
            }}
          >
            The actual video stays on VdoCipher.
            This form only saves the video URLs,
            VdoCipher Video ID and metadata to
            Firestore.
          </div>
        </div>


        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="mactions">

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={
              onCancel
            }
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-green btn-sm"
            onClick={
              save
            }
          >
            Save video
          </button>

        </div>

      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : modalContent;
}


/* =========================================================
   EDIT CONTENT MODAL
   ========================================================= */

function EditContentModal({
  asset,
  onCancel,
  onSave
}) {
  const [
    title,
    setTitle
  ] = useState(
    asset.title ||
    asset.name ||
    ""
  );

  const [
    description,
    setDescription
  ] = useState(
    asset.description ||
    ""
  );

  const [
    category,
    setCategory
  ] = useState(
    asset.category ||
    "Newsletter"
  );

  const [
    tagsStr,
    setTagsStr
  ] = useState(
    Array.isArray(asset.tags)
      ? asset.tags.join(", ")
      : ""
  );

  const [
    publishedAt,
    setPublishedAt
  ] = useState(
    String(
      asset.publishedAt ||
      new Date()
        .toISOString()
        .slice(0, 10)
    ).slice(0, 10)
  );

  const [
    status,
    setStatus
  ] = useState(
    asset.status ||
    "published"
  );

  const [
    pdfFile,
    setPdfFile
  ] = useState(null);

  const [
    thumbnailFile,
    setThumbnailFile
  ] = useState(null);

  const [
    pdfName,
    setPdfName
  ] = useState("");

  const [
    thumbnailName,
    setThumbnailName
  ] = useState("");


  /* VIDEO FIELDS */

  const [
    videoUrl,
    setVideoUrl
  ] = useState(
    asset.videoUrl ||
    ""
  );

  const [
    vdocipherUrl,
    setVdocipherUrl
  ] = useState(
    asset.vdocipherUrl ||
    ""
  );

  const [
    vdocipherVideoId,
    setVdocipherVideoId
  ] = useState(
    asset.vdocipherVideoId ||
    ""
  );


  const pdfInputRef =
    useRef(null);

  const thumbnailInputRef =
    useRef(null);


  /* =======================================================
     PDF
     ======================================================= */

  const choosePdf = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    event.target.value =
      "";

    if (!file) {
      return;
    }

    const isPdf =
      file.type ===
        "application/pdf" ||
      file.name
        .toLowerCase()
        .endsWith(".pdf");

    if (!isPdf) {
      alert(
        "Please choose a PDF file."
      );

      return;
    }

    if (
      file.size >
      MAX_PDF_SIZE
    ) {
      alert(
        "PDF must be smaller than 25 MB."
      );

      return;
    }

    setPdfFile(file);
    setPdfName(file.name);
  };


  /* =======================================================
     THUMBNAIL
     ======================================================= */

  const chooseThumbnail = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    event.target.value =
      "";

    if (!file) {
      return;
    }

    const validTypes = [
      "image/png",
      "image/jpeg",
      "image/webp"
    ];

    if (
      !validTypes.includes(
        file.type
      )
    ) {
      alert(
        "Thumbnail must be PNG, JPG or WebP."
      );

      return;
    }

    if (
      file.size >
      MAX_THUMBNAIL_SIZE
    ) {
      alert(
        "Thumbnail must be smaller than 5 MB."
      );

      return;
    }

    setThumbnailFile(
      file
    );

    setThumbnailName(
      file.name
    );
  };


  /* =======================================================
     SAVE
     ======================================================= */

  const save = () => {
    const cleanTitle =
      title.trim();

    const cleanDescription =
      description.trim();

    const isVideo =
      (
        asset.type ||
        ""
      ).toLowerCase() ===
      "video";


    if (!cleanTitle) {
      alert(
        "Title is required."
      );

      return;
    }
if (isVideo) {

      const cleanVideoUrl =
        videoUrl.trim();

      const cleanVdocipherUrl =
        vdocipherUrl.trim();

      const cleanVdocipherId =
        vdocipherVideoId.trim();
onSave({
        type: "video",

        title:
          cleanTitle,

        description:
          cleanDescription,

        category,

        tags:
          tagsStr
            .split(",")
            .map(
              (tag) =>
                tag.trim()
            )
            .filter(Boolean),

        publishedAt,

        status,

        videoUrl:
          cleanVideoUrl,

        vdocipherUrl:
          cleanVdocipherUrl,

        vdocipherVideoId:
          cleanVdocipherId,

        pdfFile:
          null,

        thumbnailFile
      });

      return;
    }


    onSave({
      type: "pdf",

      title:
        cleanTitle,

      description:
        cleanDescription,

      category,

      tags:
        tagsStr
          .split(",")
          .map(
            (tag) =>
              tag.trim()
          )
          .filter(Boolean),

      publishedAt,

      status,

      pdfFile,

      thumbnailFile
    });
  };


  const isVideo =
    (
      asset.type ||
      ""
    ).toLowerCase() ===
    "video";


  const modalContent = (
    <div
      className="mscrim open"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(10, 12, 16, 0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        padding: 20,
        boxSizing: "border-box"
      }}
      onClick={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onCancel();
        }
      }}
    >
      <div
        className="mmodal upload-edit-modal"
        role="dialog"
        aria-modal="true"
        style={{
          maxWidth: 720,
          width: "94vw",
          maxHeight: "92vh",
          overflowY: "auto",
          margin: "auto",
          borderRadius: 16,
          background: "var(--surface, #ffffff)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
        }}
      >

        <div
          className="edit-modal-header"
        >
          <div>

            <span
              className="edit-modal-eyebrow"
            >
              EDIT CONTENT
            </span>

            <h3>
              Edit upload
            </h3>

          </div>

          <button
            type="button"
            className="row-act"
            onClick={
              onCancel
            }
            style={{
              width: 34,
              height: 34
            }}
          >
            ×
          </button>

        </div>


        {/* TITLE */}

        <div className="field">
          <label>
            Title <span className="required-star">*</span>
          </label>

          <input
            className="input"
            value={title}
            onChange={(event) =>
              setTitle(
                event.target.value
              )
            }
          />
        </div>


        {/* DESCRIPTION */}

        <div className="field">
          <label>
            Description
          </label>

          <textarea
            className="textarea"
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value
              )
            }
            placeholder="Short description"
          />
        </div>


        {/* VIDEO INFORMATION */}

        {isVideo && (
          <React.Fragment>

            <div className="field">
              <label>
                Video URL
              </label>

              <input
                className="input"
                type="url"
                value={
                  videoUrl
                }
                onChange={(event) =>
                  setVideoUrl(
                    event.target.value
                  )
                }
                placeholder="https://..."
              />
            </div>


            <div className="field">
              <label>
                VdoCipher URL
              </label>

              <input
                className="input"
                type="url"
                value={
                  vdocipherUrl
                }
                onChange={(event) =>
                  setVdocipherUrl(
                    event.target.value
                  )
                }
                placeholder="https://player.vdocipher.com/..."
              />
            </div>


            <div className="field">
              <label>
                VdoCipher Video ID
              </label>

              <input
                className="input"
                value={
                  vdocipherVideoId
                }
                onChange={(event) =>
                  setVdocipherVideoId(
                    event.target.value
                  )
                }
                placeholder="VdoCipher Video ID"
              />
            </div>

          </React.Fragment>
        )}


        {/* CATEGORY + DATE */}

        <div
          className="field-grid2"
        >

          <div className="field">

            <label>
              Category
            </label>

            <select
              className="select"
              value={
                category
              }
              onChange={(event) =>
                setCategory(
                  event.target.value
                )
              }
            >

              {CATEGORIES.map(
                (item) => (
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


          <div className="field">

            <label>
              Publish Date
            </label>

            <input
              className="input"
              type="date"
              value={
                publishedAt
              }
              onChange={(event) =>
                setPublishedAt(
                  event.target.value
                )
              }
            />

          </div>

        </div>


        {/* TAGS */}

        <div className="field">

          <label>
            Tags (comma separated)
          </label>

          <input
            className="input"
            value={
              tagsStr
            }
            onChange={(event) =>
              setTagsStr(
                event.target.value
              )
            }
            placeholder="e.g. market, stocks, beginner"
          />

        </div>


        {/* STATUS */}

        <div className="field">

          <label>
            Status
          </label>

          <select
            className="select"
            value={
              status
            }
            onChange={(event) =>
              setStatus(
                event.target.value
              )
            }
          >

            <option value="published">
              Published
            </option>

            <option value="draft">
              Draft
            </option>

          </select>

        </div>


        {/* PDF */}

        {!isVideo && (
          <div
            className="edit-upload-box"
          >

            <div>

              <strong>
                PDF
              </strong>

              <span>
                {pdfName ||
                  asset.pdfName ||
                  "Keep existing PDF"}
              </span>

            </div>


            <input
              ref={
                pdfInputRef
              }
              type="file"
              accept=".pdf,application/pdf"
              hidden
              onChange={
                choosePdf
              }
            />


            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() =>
                pdfInputRef
                  .current
                  ?.click()
              }
            >
              Upload PDF
            </button>

          </div>
        )}


        {/* THUMBNAIL */}

        <div
          className="edit-upload-box"
        >

          <div>

            <strong>
              Thumbnail
            </strong>

            <span>
              {thumbnailName ||
                asset.thumbnailName ||
                "Keep existing thumbnail"}
            </span>

          </div>


          <input
            ref={
              thumbnailInputRef
            }
            type="file"
            accept="
              image/png,
              image/jpeg,
              image/webp
            "
            hidden
            onChange={
              chooseThumbnail
            }
          />


          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() =>
              thumbnailInputRef
                .current
                ?.click()
            }
          >
            Upload
          </button>

        </div>


        {/* ACTIONS */}

        <div className="mactions">

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={
              onCancel
            }
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-green btn-sm"
            onClick={
              save
            }
          >
            Save changes
          </button>

        </div>

      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : modalContent;
}


/* =========================================================
   UPLOADS SCREEN
   ========================================================= */

function UploadsScreen() {

  const {
    user
  } = useAdminAuth();

  const {
    isAdmin
  } = useRole();

  const data =
    useAdminData();

  const {
    push
  } = useMToast();

  const confirm =
    useConfirm();

  const inputRef =
    useRef(null);


  const [
    editingAsset,
    setEditingAsset
  ] = useState(null);


  const [
    pdfAsset,
    setPdfAsset
  ] = useState(null);


  const [
    videoAsset,
    setVideoAsset
  ] = useState(null);


  const [
    videoModalOpen,
    setVideoModalOpen
  ] = useState(false);


  const [
    expandedDescriptionId,
    setExpandedDescriptionId
  ] = useState(null);


  const [
    expandedTagsId,
    setExpandedTagsId
  ] = useState(null);

  const [videoLikes, setVideoLikes] = useState({});
  const [videoComments, setVideoComments] = useState({});
  const [activeCommentsVideo, setActiveCommentsVideo] = useState(null);

  // Real-time listeners for video likes and comments
  useEffect(() => {
    if (!window.db) return;

    const unsubLikes = window.db
      .collection("videolikes")
      .onSnapshot(
        (snapshot) => {
          if (!snapshot) return;
          const counts = {};
          snapshot.docs.forEach((doc) => {
            const data = doc.data() || {};
            const vid = data.videoId;
            if (vid) {
              counts[vid] = (counts[vid] || 0) + 1;
            }
          });
          setVideoLikes(counts);
        },
        (err) => console.warn("Admin videolikes listener error:", err)
      );

    const unsubComments = window.db
      .collection("videocomments")
      .onSnapshot(
        (snapshot) => {
          if (!snapshot) return;
          const grouped = {};
          snapshot.docs.forEach((doc) => {
            const data = doc.data() || {};
            const vid = data.videoId;
            if (!vid) return;
            if (!grouped[vid]) grouped[vid] = [];
            grouped[vid].push({
              id: doc.id,
              videoId: data.videoId,
              userName: data.userName || "Member",
              comment: data.comment || "",
              createdAt: data.createdAt,
              userId: data.userId,
              parentId: data.parentId || null,
              replyToUser: data.replyToUser || "",
              replyToUserId: data.replyToUserId || "",
              isAdminReply: Boolean(data.isAdminReply || data.role === "admin"),
              role: data.role || (data.isAdminReply ? "admin" : "member")
            });
          });
          setVideoComments(grouped);
        },
        (err) => console.warn("Admin videocomments listener error:", err)
      );

    return () => {
      if (typeof unsubLikes === "function") unsubLikes();
      if (typeof unsubComments === "function") unsubComments();
    };
  }, []);


  /* =======================================================
     STATE
     ======================================================= */

  const [
    drag,
    setDrag
  ] = useState(false);


  const [
    uploading,
    setUploading
  ] = useState([]);


  const [
    metaQueue,
    setMetaQueue
  ] = useState([]);


  const [
    cat,
    setCat
  ] = useState("all");


  const [
    type,
    setType
  ] = useState("all");


  const [
    sort,
    setSort
  ] = useState("recent");


  const [
    page,
    setPage
  ] = useState(1);


  const perPage = 20;


  /* =======================================================
     START PDF UPLOADS
     ======================================================= */

  const startUploads =
    useCallback(
      (
        fileList
      ) => {

        const files =
          Array.from(
            fileList
          )
            .filter(
              (file) =>
                file.type ===
                  "application/pdf" ||
                file.name
                  .toLowerCase()
                  .endsWith(".pdf")
            )
            .slice(
              0,
              8
            );


        if (
          files.length ===
          0
        ) {
          push(
            "Please select PDF files."
          );

          return;
        }


        files.forEach(
          (
            file
          ) => {

            if (
              file.size >
              MAX_PDF_SIZE
            ) {
              push(
                `${file.name} is larger than 25 MB.`
              );

              return;
            }


            const id =
              "up" +
              Math.random()
                .toString(36)
                .slice(
                  2,
                  8
                );


            const task = {
              id,

              name:
                file.name,

              size:
                fmtSize(
                  file.size
                ),

              type:
                detectType(
                  file
                ),

              progress: 0,

              file
            };


            setUploading(
              (
                current
              ) => [
                ...current,
                task
              ]
            );


            uploadFile(
              file,
              "pdf",
              "/api/upload-content-pdf",
              (
                progress
              ) => {

                setUploading(
                  (
                    current
                  ) =>
                    current.map(
                      (
                        item
                      ) =>
                        item.id ===
                        id
                          ? {
                              ...item,
                              progress
                            }
                          : item
                    )
                );

              }
            )

              .then(
                (
                  result
                ) => {

              

                  setUploading(
                    (
                      current
                    ) =>
                      current.filter(
                        (
                          item
                        ) =>
                          item.id !==
                          id
                      )
                  );


                  setMetaQueue(
                    (
                      current
                    ) => [
                      ...current,
                      {
                        id,

                        name:
                          file.name,

                        size:
                          fmtSize(
                            file.size
                          ),

                        type:
                          "pdf",

                        file,

                        progress:
                          100,

                        pdfUrl:
                          result.url,

                        pdfPath:
                          result.path,

                        pdfFilename:
                          result.filename,

                        pdfSize:
                          result.size
                      }
                    ]
                  );

                }
              )

              .catch(
                (
                  error
                ) => {

                  console.error(
                    "PDF upload error:",
                    error
                  );


                  setUploading(
                    (
                      current
                    ) =>
                      current.filter(
                        (
                          item
                        ) =>
                          item.id !==
                          id
                      )
                  );


                  push(
                    error?.message ||
                    `Failed to upload ${file.name}.`
                  );

                }
              );

          }
        );

      },
      [
        push
      ]
    );


  /* =======================================================
     DROP
     ======================================================= */

  const onDrop =
    (
      event
    ) => {

      event.preventDefault();

      setDrag(false);


      if (
        event.dataTransfer
          .files
          ?.length
      ) {

        startUploads(
          event.dataTransfer.files
        );

      }
    };


  /* =======================================================
     FIRESTORE CONTENT
     ======================================================= */

  const scoped =
    useMemo(
      () => {

        const all =
          Array.isArray(
            data?.content
          )
            ? data.content
            : [];


        if (
          isAdmin
        ) {
          return all;
        }


        return all.filter(
          (
            item
          ) =>
            (
              item.ownerId ||
              item.createdBy
            ) ===
            (
              user?.id ||
              user?.uid
            )
        );

      },
      [
        data?.content,
        isAdmin,
        user?.id,
        user?.uid
      ]
    );


  /* =======================================================
     FILTER
     ======================================================= */

  const filtered =
    useMemo(
      () => {

        let rows =
          scoped.filter(
            (
              item
            ) => {

              const categoryMatch =
                cat ===
                  "all" ||
                item.category ===
                  cat;


              const typeMatch =
                type ===
                  "all" ||
                (
                  item.type ||
                  "pdf"
                ) ===
                  type;


              return (
                categoryMatch &&
                typeMatch
              );

            }
          );


        rows = [
          ...rows
        ];


        rows.sort(
          (
            a,
            b
          ) => {

            if (
              sort ===
              "name"
            ) {

              return String(
                a.title ||
                a.name ||
                ""
              ).localeCompare(
                String(
                  b.title ||
                  b.name ||
                  ""
                )
              );

            }


            const aDate =
              getAssetDate(
                a.publishedAt ||
                a.createdAt ||
                a.updatedAt
              )?.getTime() || 0;


            const bDate =
              getAssetDate(
                b.publishedAt ||
                b.createdAt ||
                b.updatedAt
              )?.getTime() || 0;


            return (
              bDate -
              aDate
            );

          }
        );


        return rows;

      },
      [
        scoped,
        cat,
        type,
        sort
      ]
    );


  /* =======================================================
     PAGINATION
     ======================================================= */

  const pages =
    Math.max(
      1,
      Math.ceil(
        filtered.length /
        perPage
      )
    );


  const pageRows =
    filtered.slice(
      (
        page -
        1
      ) *
        perPage,

      page *
        perPage
    );

  /* =======================================================
     GROUP ASSETS BY MONTH + YEAR
     Newest month appears first.
     ======================================================= */

  const groupedPageRows =
    useMemo(
      () => {
        const groups = [];
        const groupMap = new Map();

        pageRows.forEach((item) => {
          const key = getAssetMonthKey(item);

          if (!groupMap.has(key)) {
            const group = {
              key,
              items: []
            };

            groupMap.set(key, group);
            groups.push(group);
          }

          groupMap.get(key).items.push(item);
        });

        return groups;
      },
      [pageRows]
    );



  useEffect(
    () => {

      if (
        page >
        pages
      ) {

        setPage(
          1
        );

      }

    },
    [
      page,
      pages
    ]
  );


  /* =======================================================
     DELETE
     ======================================================= */

  const removeAsset =
    async (
      item
    ) => {

      const ok =
        await confirm({
          title:
            "Delete asset?",

          message:
            `"${item.title || item.name}" will be removed from the library.`,

          confirm:
            "Delete",

          danger:
            true,

          icon:
            "trash"
        });


      if (!ok) {
        return;
      }


      try {

        /*
         * Delete Firestore record first.
         */

        await window.db
          .collection(
            "content"
          )
          .doc(
            item.id
          )
          .delete();


        /*
         * PDFs and thumbnails are physical
         * backend files.
         *
         * Video files are NOT physical
         * backend files, so their URLs
         * are not deleted here.
         */

        if (
          item.pdfPath ||
          item.thumbnailPath
        ) {

          try {

            const response =
              await fetch(
                `${API_BASE_URL}/api/delete-content-files`,
                {
                  method:
                    "POST",

                  headers: {
                    "Content-Type":
                      "application/json"
                  },

                  body:
                    JSON.stringify({
                      pdfPath:
                        item.pdfPath ||
                        "",

                      thumbnailPath:
                        item.thumbnailPath ||
                        ""
                    })
                }
              );


            if (
              !response.ok
            ) {

              console.warn(
                "Physical file delete failed."
              );

            }

          } catch (
            fileError
          ) {

            console.warn(
              "Physical file delete request failed:",
              fileError
            );

          }

        }


        if (
          data.refreshContent
        ) {

          await data.refreshContent();

        }


        push(
          `Deleted ${
            item.title ||
            item.name ||
            "content"
          }`
        );


      } catch (
        error
      ) {

        console.error(
          "Delete asset error:",
          error
        );


        push(
          error?.message ||
          "Unable to delete content."
        );

      }

    };


  /* =======================================================
     SAVE EDITED CONTENT
     ======================================================= */

  const saveEditedAsset =
    async (
      meta
    ) => {

      if (
        !editingAsset
      ) {
        return;
      }


      try {

        if (!window.db) {
          throw new Error(
            "Firestore is not initialized."
          );
        }


        const now =
          new Date()
            .toISOString();


        const isVideo =
          (
            editingAsset.type ||
            ""
          ).toLowerCase() ===
          "video";


        const updateData = {
          type:
            isVideo
              ? "video"
              : "pdf",

          title:
            meta.title.trim(),

          description:
            meta.description.trim(),

          category:
            meta.category,

          tags:
            Array.isArray(
              meta.tags
            )
              ? meta.tags
              : [],

          publishedAt:
            meta.publishedAt,

          status:
            meta.status,

          updatedAt:
            now,

          modified:
            now.slice(
              0,
              10
            )
        };


        let newPdf =
          null;

        let newThumbnail =
          null;


        /* =====================================================
           VIDEO UPDATE
        ===================================================== */

        if (
          isVideo
        ) {

          Object.assign(
            updateData,
            {
              videoUrl:
                meta.videoUrl ||
                "",

              vdocipherUrl:
                meta.vdocipherUrl ||
                "",

              vdocipherVideoId:
                meta.vdocipherVideoId ||
                ""
            }
          );

        }


        /* =====================================================
           OPTIONAL PDF REPLACEMENT
        ===================================================== */

        if (
          !isVideo &&
          meta.pdfFile
        ) {

          newPdf =
            await uploadFile(
              meta.pdfFile,
              "pdf",
              "/api/upload-content-pdf",
              () => {}
            );


          Object.assign(
            updateData,
            {
              pdfUrl:
                newPdf.url,

              pdfPath:
                newPdf.path,

              pdfName:
                newPdf.filename ||
                meta.pdfFile.name,

              pdfSize:
                newPdf.size ||
                meta.pdfFile.size
            }
          );

        }


        /* =====================================================
           OPTIONAL THUMBNAIL
        ===================================================== */

        if (
          meta.thumbnailFile
        ) {

          newThumbnail =
            await uploadFile(
              meta.thumbnailFile,
              "thumbnail",
              "/api/upload-content-thumbnail",
              () => {}
            );


          Object.assign(
            updateData,
            {
              thumbnailUrl:
                newThumbnail.url,

              thumbnailPath:
                newThumbnail.path,

              thumbnailName:
                newThumbnail.filename ||
                meta.thumbnailFile.name,

              thumbnailSize:
                newThumbnail.size ||
                meta.thumbnailFile.size
            }
          );

        }


        /* =====================================================
           FIRESTORE UPDATE
        ===================================================== */

        await window.db
          .collection(
            "content"
          )
          .doc(
            editingAsset.id
          )
          .set(
            updateData,
            {
              merge:
                true
            }
          );


        /* =====================================================
           DELETE OLD PDF
        ===================================================== */

        if (
          editingAsset.pdfPath &&
          newPdf
        ) {

          try {

            await fetch(
              `${API_BASE_URL}/api/delete-content-files`,
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                body:
                  JSON.stringify({
                    pdfPath:
                      editingAsset.pdfPath,

                    thumbnailPath:
                      ""
                  })
              }
            );

          } catch (
            error
          ) {

            console.warn(
              "Old PDF cleanup failed:",
              error
            );

          }

        }


        /* =====================================================
           DELETE OLD THUMBNAIL
        ===================================================== */

        if (
          editingAsset.thumbnailPath &&
          newThumbnail
        ) {

          try {

            await fetch(
              `${API_BASE_URL}/api/delete-content-files`,
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                body:
                  JSON.stringify({
                    pdfPath:
                      "",

                    thumbnailPath:
                      editingAsset.thumbnailPath
                  })
              }
            );

          } catch (
            error
          ) {

            console.warn(
              "Old thumbnail cleanup failed:",
              error
            );

          }

        }


        if (
          data.refreshContent
        ) {

          await data.refreshContent();

        }


        push(
          "Content updated successfully."
        );


        setEditingAsset(
          null
        );


      } catch (
        error
      ) {

        console.error(
          "Edit content error:",
          error
        );


        push(
          error?.message ||
          "Unable to update content."
        );

      }

    };


  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <Shell
      title="Uploads"
      subtitle={
        `${scoped.length} asset${
          scoped.length !==
          1
            ? "s"
            : ""
        }`
      }
    >

      <div
        className="reveal-fade"
      >


        {/* =================================================
        {/* HIDDEN FILE INPUT */}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf, application/pdf"
          multiple
          hidden
          onChange={(event) => {
            if (event.target.files?.length) {
              startUploads(event.target.files);
            }
            event.target.value = "";
          }}
        />

        {/* =================================================
            TOP UPLOAD BAR
        ================================================= */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 16,
            flexWrap: "wrap",
            background: "var(--surface, #ffffff)",
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid var(--hair, #e2e8f0)",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              className="btn btn-green"
              onClick={() => inputRef.current?.click()}
              style={{ display: "inline-flex", alignItems: "center", gap: 7 }}
            >
              <MIcon name="upload" size={16} />
              <span>Upload PDF</span>
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setVideoModalOpen(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: 7 }}
            >
              <MIcon name="play" size={16} />
              <span>Add Video</span>
            </button>
          </div>

          <div
            style={{
              fontSize: 12,
              color: "var(--mute, #64748b)",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <span>PDFs up to 25 MB</span>
            <span style={{ opacity: 0.4 }}>&bull;</span>
            <span>VdoCipher Videos</span>
          </div>
        </div>


        {/* =================================================
            UPLOADING
        ================================================= */}

        {uploading.length >
          0 && (

          <div
            className="uplist"
          >

            {uploading.map(
              (
                item
              ) => (

                <div
                  className="upitem"
                  key={
                    item.id
                  }
                >

                  <div
                    className="uic"
                  >
                    <MIcon
                      name="file"
                      size={20}
                    />
                  </div>


                  <div
                    className="ubody"
                  >

                    <div
                      className="un"
                    >
                      {
                        item.name
                      }
                    </div>


                    <div
                      className="us"
                    >
                      {
                        item.size
                      }

                      &middot;

                      {
                        item.progress
                      }%
                    </div>


                    <div
                      className="upbar"
                    >

                      <i
                        style={{
                          width:
                            item.progress +
                            "%"
                        }}
                      />

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        )}


        {/* =================================================
            TOOLBAR
        ================================================= */}

        <div
          className="toolbar"
          style={{
            marginTop: 10
          }}
        >

          <div
            style={{
              font:
                "var(--body-md-strong)",

              color:
                "var(--ink)",

              marginRight:
                "auto"
            }}
          >
            Asset library
          </div>


          {/* TYPE */}

          <select
            className="selectmini"
            value={
              type
            }
            onChange={
              (
                event
              ) => {

                setType(
                  event.target.value
                );

                setPage(
                  1
                );

              }
            }
          >

            <option value="all">
              All types
            </option>

            <option value="pdf">
              PDF
            </option>

            <option value="video">
              Video
            </option>

          </select>


          {/* CATEGORY */}

          <select
            className="selectmini"
            value={
              cat
            }
            onChange={
              (
                event
              ) => {

                setCat(
                  event.target.value
                );

                setPage(
                  1
                );

              }
            }
          >

            <option value="all">
              All categories
            </option>


            {CATEGORIES.map(
              (
                category
              ) => (

                <option
                  key={
                    category
                  }
                  value={
                    category
                  }
                >
                  {
                    category
                  }
                </option>

              )
            )}

          </select>


          {/* SORT */}

          <select
            className="selectmini"
            value={
              sort
            }
            onChange={
              (
                event
              ) =>
                setSort(
                  event.target.value
                )
            }
          >

            <option value="recent">
              Newest first
            </option>

            <option value="name">
              Name A-Z
            </option>

          </select>

        </div>


        {/* =================================================
            CONTENT
        ================================================= */}

        {filtered.length ===
        0 ? (

          <div
            className="mempty"
          >

            <div
              className="eic"
            >
              <MIcon
                name="image"
                size={28}
              />
            </div>


            <h3>
              No assets
            </h3>


            <p>
              Upload your first PDF
              or add a video using
              the buttons above.
            </p>

          </div>

        ) : (

          <React.Fragment>

            {groupedPageRows.map((group) => {
              const bucketMap = new Map();

              group.items.forEach((item) => {
                const isVid =
                  (item.type || "").toLowerCase() === "video" ||
                  (item.category || "").toLowerCase() === "vedios" ||
                  (item.category || "").toLowerCase() === "videos";
                const catName = isVid
                  ? "Videos"
                  : (item.category || "Articles & Reports");

                if (!bucketMap.has(catName)) {
                  bucketMap.set(catName, []);
                }
                bucketMap.get(catName).push(item);
              });

              const CATEGORY_ORDER = [
                "Videos",
                "Articles & Reports",
                "Weekly Roundup",
                "Newsletter",
                "Ratio Analysis"
              ];

              const sortedCategories = Array.from(bucketMap.keys()).sort((a, b) => {
                const idxA = CATEGORY_ORDER.indexOf(a);
                const idxB = CATEGORY_ORDER.indexOf(b);
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return a.localeCompare(b);
              });

              return (
                <section


                  className="asset-month-group"


                  key={group.key}


                >


                  <div className="asset-month-title">


                    <span>{formatAssetMonth(group.key)}</span>


                    <span className="month-line" />


                    <span


                      style={{


                        fontSize: 10,


                        color: "var(--mute)",


                        fontWeight: 500


                      }}


                    >


                      {group.items.length}


                    </span>


                  </div>


            


                  {sortedCategories.map((catName, catIdx) => {
                    const catItems = bucketMap.get(catName);
                    const isVidCategory = catName === "Videos";

                    return (
                      <div
                        key={catName}
                        className="asset-subcategory-group"
                        style={{
                          marginBottom: 18
                        }}
                      >
                        <div
                          className="asset-subcategory-title"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            margin: catIdx === 0 ? "8px 0 10px" : "18px 0 10px",
                            padding: "2px 0"
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: "0.04em",
                              textTransform: "uppercase",
                              color: isVidCategory ? "#2563eb" : "var(--ink)",
                              background: isVidCategory
                                ? "rgba(37, 99, 235, 0.08)"
                                : "var(--canvas-soft, rgba(0, 0, 0, 0.04))",
                              padding: "3px 8px",
                              borderRadius: 6,
                              border: isVidCategory
                                ? "1px solid rgba(37, 99, 235, 0.2)"
                                : "1px solid var(--hair, #e2e8f0)"
                            }}
                          >
                            <MIcon
                              name={isVidCategory ? "video" : catName === "Articles & Reports" ? "reports" : "file"}
                              size={12}
                            />
                            <span>{catName}</span>
                          </span>

                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              color: "var(--mute)",
                              padding: "1px 6px",
                              borderRadius: 9999,
                              background: "var(--canvas-soft, rgba(0, 0, 0, 0.03))",
                              border: "1px solid var(--hair, #e2e8f0)"
                            }}
                          >
                            {catItems.length} {catItems.length === 1 ? "item" : "items"}
                          </span>

                          <span
                            style={{
                              flex: 1,
                              height: 1,
                              background: "var(--hair, #e2e8f0)",
                              opacity: 0.5
                            }}
                          />
                        </div>

                        <div className="asset-month-grid">
                          {catItems.map((item) => {

                  const itemIsVideo =
                    (
                      item.type ||
                      ""
                    ).toLowerCase() ===
                    "video";


                  return (

                    <div
                      className="asset"
                      key={
                        item.id
                      }
                    >

                      {/* ===================================
                          THUMBNAIL
                      =================================== */}

                      <div
  className="athumb"
  role="button"
  tabIndex={0}
  onClick={() => {
    if (itemIsVideo) {
      setVideoAsset(item);
    } else if (item.pdfUrl) {
      setPdfAsset(item);
    }
  }}
  onKeyDown={(event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      if (itemIsVideo) {
        setVideoAsset(item);
      } else if (item.pdfUrl) {
        setPdfAsset(item);
      }
    }
  }}
  style={{
    background:
      item.thumbnailUrl
        ? "transparent"
        : "linear-gradient(135deg,#fde7e1,#f9d2c4)",
    cursor:
      itemIsVideo || item.pdfUrl
        ? "pointer"
        : "default"
  }}
>

                        {item.thumbnailUrl ? (

                          <img
                            src={
                              getFileUrl(
                                item.thumbnailUrl
                              )
                            }

                            alt={
                              item.title ||
                              "Thumbnail"
                            }

                            onError={
                              (
                                event
                              ) => {

                                console.error(
                                  "Thumbnail failed to load:",
                                  getFileUrl(
                                    item.thumbnailUrl
                                  )
                                );

                                event.currentTarget.style.display =
                                  "none";

                              }
                            }

                            style={{
                              width:
                                "100%",

                              height:
                                "100%",

                              objectFit:
                                "cover",

                              display:
                                "block"
                            }}
                          />

                        ) : (

                          <span
                            style={{
                              width: 46,
                              height: 46,
                              borderRadius:
                                "50%",
                              background:
                                "rgba(255,255,255,.82)",
                              display:
                                "grid",
                              placeItems:
                                "center",
                              color:
                                "var(--ink-deep)"
                            }}
                          >

                            <MIcon
                              name={
                                itemIsVideo
                                  ? "play"
                                  : "file"
                              }
                              size={22}
                            />

                          </span>

                        )}


                        {/* TYPE BADGE */}

                        <span
                          className="badge badge-soft tag"

                          style={{
                            position:
                              "absolute",

                            top:
                              10,

                            left:
                              10
                          }}
                        >
                          {
                            itemIsVideo
                              ? "VIDEO"
                              : "PDF"
                          }
                        </span>

                      </div>


                      {/* ===================================
                          BODY
                      =================================== */}

                      <div
                        className="abody"
                      >

                        <h4>
                          {
                            item.title ||
                            item.name ||
                            "Untitled"
                          }
                        </h4>


                        <div
                          className="am"
                        >

                          <span>
                            {
                              itemIsVideo
                                ? "VdoCipher"
                                : item.pdfSize
                                  ? fmtSize(
                                      item.pdfSize
                                    )
                                  : (
                                      item.size ||
                                      "PDF"
                                    )
                            }
                          </span>


                          <span>
                            {
                              item.category ||
                              "Uncategorized"
                            }
                          </span>

                        </div>


                        {/* VIDEO ID */}

                        {itemIsVideo &&
                          item.vdocipherVideoId && (

                          <div
                            style={{
                              marginTop: 7,
                              fontSize: 11,
                              opacity: 0.6,
                              wordBreak:
                                "break-all"
                            }}
                          >
                            ID:{" "}
                            {
                              item.vdocipherVideoId
                            }
                          </div>

                        )}


                        {/* DESCRIPTION */}

                        {item.description && (

                          <div
                            className="asset-description-wrap"
                          >

                            {expandedDescriptionId ===
                            item.id ? (

                              <p
                                className="asset-description expanded"
                              >

                                {
                                  item.description
                                }

                                <span
                                  className="asset-inline-toggle"

                                  role="button"

                                  tabIndex={0}

                                  onClick={() =>
                                    setExpandedDescriptionId(
                                      null
                                    )
                                  }

                                  onKeyDown={
                                    (
                                      event
                                    ) => {

                                      if (
                                        event.key ===
                                          "Enter" ||
                                        event.key ===
                                          " "
                                      ) {

                                        event.preventDefault();

                                        setExpandedDescriptionId(
                                          null
                                        );

                                      }

                                    }
                                  }
                                >
                                  less
                                </span>

                              </p>

                            ) : (

                              <p
                                className="asset-description"
                              >

                                {
                                  item.description.length >
                                  150
                                    ? item.description
                                        .slice(
                                          0,
                                          150
                                        )
                                        .trimEnd() +
                                      "..."
                                    : item.description
                                }


                                {item.description.length >
                                  150 && (

                                  <span
                                    className="asset-inline-toggle"

                                    role="button"

                                    tabIndex={0}

                                    onClick={() =>
                                      setExpandedDescriptionId(
                                        item.id
                                      )
                                    }

                                    onKeyDown={
                                      (
                                        event
                                      ) => {

                                        if (
                                          event.key ===
                                            "Enter" ||
                                          event.key ===
                                            " "
                                        ) {

                                          event.preventDefault();

                                          setExpandedDescriptionId(
                                            item.id
                                          );

                                        }

                                      }
                                    }
                                  >
                                    ...
                                  </span>

                                )}

                              </p>

                            )}

                          </div>

                        )}


                        {/* TAGS */}

                        {Array.isArray(
                          item.tags
                        ) &&
                        item.tags.length >
                          0 && (

                          <div
                            className="asset-tags-wrap"
                          >

                            {expandedTagsId ===
                            item.id ? (

                              <div
                                className="atags asset-tags-expanded"
                              >

                                {item.tags.map(
                                  (
                                    tag
                                  ) => (

                                    <span
                                      className="badge badge-soft"
                                      key={
                                        tag
                                      }
                                    >
                                      {
                                        tag
                                      }
                                    </span>

                                  )
                                )}


                                <span
                                  className="asset-inline-toggle"

                                  role="button"

                                  tabIndex={0}

                                  onClick={() =>
                                    setExpandedTagsId(
                                      null
                                    )
                                  }

                                  onKeyDown={
                                    (
                                      event
                                    ) => {

                                      if (
                                        event.key ===
                                          "Enter" ||
                                        event.key ===
                                          " "
                                      ) {

                                        event.preventDefault();

                                        setExpandedTagsId(
                                          null
                                        );

                                      }

                                    }
                                  }
                                >
                                  less
                                </span>

                              </div>

                            ) : (

                              <div
                                className="atags"
                              >

                                {item.tags
                                  .slice(
                                    0,
                                    4
                                  )
                                  .map(
                                    (
                                      tag
                                    ) => (

                                      <span
                                        className="badge badge-soft"
                                        key={
                                          tag
                                        }
                                      >
                                        {
                                          tag
                                        }
                                      </span>

                                    )
                                  )}


                                {item.tags.length >
                                  4 && (

                                  <span
                                    className="asset-inline-toggle asset-tags-more"

                                    role="button"

                                    tabIndex={0}

                                    onClick={() =>
                                      setExpandedTagsId(
                                        item.id
                                      )
                                    }

                                    onKeyDown={
                                      (
                                        event
                                      ) => {

                                        if (
                                          event.key ===
                                            "Enter" ||
                                          event.key ===
                                            " "
                                        ) {

                                          event.preventDefault();

                                          setExpandedTagsId(
                                            item.id
                                          );

                                        }

                                      }
                                    }
                                  >
                                    ...
                                  </span>

                                )}

                              </div>

                            )}

                          </div>

                        )}


                        {/* LIKES & COMMENTS (VIDEOS) */}
                        {itemIsVideo && (() => {
                          const likesCount = videoLikes[item.id] || 0;
                          const commentsCount = (videoComments[item.id] || []).length;

                          return (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "7px 10px",
                                marginTop: 10,
                                background: "var(--canvas-soft, rgba(0, 0, 0, 0.02))",
                                borderRadius: 8,
                                fontSize: 11.5,
                                border: "1px solid var(--hair, #e2e8f0)",
                                gap: 8
                              }}
                            >
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  color: likesCount > 0 ? "#e11d48" : "var(--mute, #94a3b8)",
                                  fontWeight: 600,
                                  fontSize: 11.5
                                }}
                                title={`${likesCount} Like${likesCount === 1 ? "" : "s"}`}
                              >
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill={likesCount > 0 ? "#e11d48" : "none"}
                                  stroke={likesCount > 0 ? "#e11d48" : "currentColor"}
                                  strokeWidth="2"
                                >
                                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
                                </svg>
                                <span>{likesCount}</span>
                              </span>

                              {commentsCount > 0 ? (
                                <div style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                      color: "var(--ink, #1e293b)",
                                      fontWeight: 600,
                                      fontSize: 11.5
                                    }}
                                    title={`${commentsCount} comment${commentsCount === 1 ? "" : "s"}`}
                                  >
                                    <svg
                                      width="12"
                                      height="12"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      style={{ opacity: 0.7 }}
                                    >
                                      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 1 1 16.1-3.8Z" />
                                    </svg>
                                    <span>{commentsCount}</span>
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => setActiveCommentsVideo(item)}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 3.5,
                                      background: "var(--ink, #0f172a)",
                                      color: "var(--canvas, #ffffff)",
                                      border: "none",
                                      borderRadius: 5,
                                      padding: "3px 8px",
                                      fontSize: 10.5,
                                      fontWeight: 600,
                                      letterSpacing: "0.01em",
                                      cursor: "pointer",
                                      boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                                      transition: "all 0.15s ease"
                                    }}
                                    title="Reply to comments"
                                  >
                                    <svg
                                      width="10"
                                      height="10"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <polyline points="9 17 4 12 9 7" />
                                      <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                                    </svg>
                                    <span>Reply</span>
                                  </button>
                                </div>
                              ) : (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    color: "var(--mute, #94a3b8)",
                                    fontSize: 11,
                                    fontWeight: 500
                                  }}
                                  title="No comments"
                                >
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{ opacity: 0.6 }}
                                  >
                                    <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 1 1 16.1-3.8Z" />
                                  </svg>
                                  <span>0 comments</span>
                                </span>
                              )}
                            </div>
                          );
                        })()}

                        {/* ===================================
                            ACTIONS
                        =================================== */}

                        <div
                          style={{
                            display:
                              "flex",

                            alignItems:
                              "center",

                            gap:
                              6,

                            marginTop:
                              10
                          }}
                        >

                          {/* EDIT */}

                          <button
  type="button"
  className="row-act"
  title="Edit"
  onClick={() =>
    setEditingAsset(item)
  }
  style={{
    flex: 1,
    height: 34,
    justifyContent: "center",
    boxShadow: "inset 0 0 0 1px var(--hair)"
  }}
>
  <MIcon name="edit" size={15} />

  <span
    style={{
      marginLeft: 5
    }}
  >
    Edit
  </span>
</button>


                          {/* OPEN PDF */}

                          {!itemIsVideo &&
                            item.pdfUrl && (

                            <button
                              type="button"
                              className="row-act"
                              title="Open PDF"

                              onClick={() =>
                                setPdfAsset(
                                  item
                                )
                              }

                              style={{
                                width: 34,
                                height: 34,
                                justifyContent:
                                  "center",
                                boxShadow:
                                  "inset 0 0 0 1px var(--hair)"
                              }}
                            >

                              <MIcon
                                name="eye"
                                size={15}
                              />

                            </button>

                          )}


                          {/* OPEN VIDEO */}

                          {itemIsVideo && (

                            <button
                              type="button"
                              className="row-act"
                              title="Open Video"

                              onClick={() =>
                                setVideoAsset(
                                  item
                                )
                              }

                              style={{
                                width: 34,
                                height: 34,
                                justifyContent:
                                  "center",
                                boxShadow:
                                  "inset 0 0 0 1px var(--hair)"
                              }}
                            >

                              <MIcon
                                name="play"
                                size={15}
                              />

                            </button>

                          )}


                          {/* VIEW COMMENTS (VIDEO) */}

                          {itemIsVideo && (videoComments[item.id] || []).length > 0 && (
                            <button
                              type="button"
                              className="row-act"
                              title="View Comments & Reply"
                              onClick={() =>
                                setActiveCommentsVideo(item)
                              }
                              style={{
                                width: 34,
                                height: 34,
                                justifyContent: "center",
                                boxShadow: "inset 0 0 0 1px var(--hair)",
                                color: "#2563eb"
                              }}
                            >
                              <MIcon
                                name="chat"
                                size={15}
                              />
                            </button>
                          )}


                          {/* DELETE */}

                          <button
                            type="button"
                            className="row-act danger"
                            title="Delete"

                            onClick={() =>
                              removeAsset(
                                item
                              )
                            }

                            style={{
                              width: 34,
                              height: 34,
                              justifyContent:
                                "center",
                              boxShadow:
                                "inset 0 0 0 1px var(--hair)"
                            }}
                          >

                            <MIcon
                              name="trash"
                              size={15}
                            />

                          </button>

                        </div>


                        {/* PUBLISHED */}

                        <div
                          style={{
                            marginTop:
                              10,

                            fontSize:
                              11,

                            opacity:
                              0.5
                          }}
                        >
                          Published:
                          {" "}
                          {
                            formatDate(
                              item.publishedAt
                            )
                          }
                        </div>

                      </div>

                    </div>

                  );


                      }
                    )}
                        </div>
                      </div>
                    );
                  })}
                </section>
              );
            })}

            {/* =================================================
                PAGER
            ================================================= */}

            {pages >
              1 && (

              <div
                className="pager"
              >

                <span>
                  Page{" "}
                  {
                    page
                  }
                  {" "}
                  of{" "}
                  {
                    pages
                  }
                </span>


                <button
                  className="pbtn"
                  disabled={
                    page ===
                    1
                  }

                  onClick={() =>
                    setPage(
                      (
                        current
                      ) =>
                        current -
                        1
                    )
                  }
                >
                  <MIcon
                    name="chevronL"
                    size={16}
                  />
                </button>


                {Array.from(
                  {
                    length:
                      pages
                  }
                ).map(
                  (
                    _,
                    index
                  ) => (

                    <button
                      key={
                        index
                      }

                      className={
                        `pbtn ${
                          page ===
                          index + 1
                            ? "on"
                            : ""
                        }`
                      }

                      onClick={() =>
                        setPage(
                          index +
                            1
                        )
                      }
                    >
                      {
                        index +
                        1
                      }
                    </button>

                  )
                )}


                <button
                  className="pbtn"

                  disabled={
                    page ===
                    pages
                  }

                  onClick={() =>
                    setPage(
                      (
                        current
                      ) =>
                        current +
                        1
                    )
                  }
                >

                  <MIcon
                    name="chevronR"
                    size={16}
                  />

                </button>

              </div>

            )}

          </React.Fragment>

        )}


        {/* =================================================
            PDF PREVIEW
        ================================================= */}

        {pdfAsset &&
          pdfAsset.pdfUrl &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              className="mscrim open"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: "100vw",
                height: "100vh",
                zIndex: 999999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(10, 12, 16, 0.65)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                padding: 20,
                boxSizing: "border-box"
              }}
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  setPdfAsset(null);
                }
              }}
            >
              <div
                className="mmodal"
                style={{
                  width: "94vw",
                  maxWidth: 1100,
                  height: "88vh",
                  padding: 14,
                  margin: "auto",
                  borderRadius: 16,
                  background: "var(--surface, #ffffff)",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: 10
                  }}
                >
                  <strong>{pdfAsset.title || "PDF Preview"}</strong>
                  <button
                    type="button"
                    className="row-act"
                    onClick={() => setPdfAsset(null)}
                    style={{ width: 34, height: 34 }}
                  >
                    ×
                  </button>
                </div>

                <iframe
                  src={`${getFileUrl(pdfAsset.pdfUrl)}#toolbar=0&navpanes=0`}
                  title={pdfAsset.title || "PDF Preview"}
                  style={{
                    width: "100%",
                    height: "calc(100% - 44px)",
                    border: 0,
                    borderRadius: 10,
                    display: "block"
                  }}
                />
              </div>
            </div>,
            document.body
          )}


        {/* =================================================
            VIDEO PREVIEW
        ================================================= */}

        {videoAsset &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              className="mscrim open"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: "100vw",
                height: "100vh",
                zIndex: 999999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(10, 12, 16, 0.65)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                padding: 20,
                boxSizing: "border-box"
              }}
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  setVideoAsset(null);
                }
              }}
            >
              <div
                className="mmodal"
                style={{
                  width: "94vw",
                  maxWidth: 1000,
                  maxHeight: "90vh",
                  overflowY: "auto",
                  padding: 20,
                  margin: "auto",
                  borderRadius: 16,
                  background: "var(--surface, #ffffff)",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                }}
              >

              <div
                style={{
                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "space-between",

                  paddingBottom:
                    14
                }}
              >

                <div>

                  <strong>
                    {
                      videoAsset.title ||
                      "Video"
                    }
                  </strong>

                  <div
                    style={{
                      fontSize:
                        12,

                      opacity:
                        0.6,

                      marginTop:
                        4
                    }}
                  >
                    VdoCipher Video
                  </div>

                </div>


                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        const itemToEdit = videoAsset;
                        setVideoAsset(null);
                        setEditingAsset(itemToEdit);
                      }}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}
                      title="Edit / update video details"
                    >
                      <MIcon name="pencil" size={14} />
                      <span>Edit Video</span>
                    </button>

                    <button
                      type="button"
                      className="row-act"
                      onClick={() => setVideoAsset(null)}
                      style={{ width: 34, height: 34 }}
                    >
                      ×
                    </button>
                  </div>

              </div>


              {/* VIDEO PLAYER */}

              {videoAsset.vdocipherUrl ? (

                <iframe
                  src={
                    videoAsset.vdocipherUrl
                  }

                  title={
                    videoAsset.title ||
                    "Video player"
                  }

                  allow="
                    autoplay;
                    fullscreen;
                    encrypted-media;
                    picture-in-picture
                  "

                  allowFullScreen

                  style={{
                    width:
                      "100%",

                    aspectRatio:
                      "16 / 9",

                    border:
                      0,

                    borderRadius:
                      10,

                    display:
                      "block",

                    background:
                      "#000"
                  }}
                />

              ) : videoAsset.videoUrl ? (

                <video
                  src={
                    videoAsset.videoUrl
                  }

                  controls

                  poster={
                    videoAsset.thumbnailUrl
                      ? getFileUrl(
                          videoAsset.thumbnailUrl
                        )
                      : undefined
                  }

                  style={{
                    width:
                      "100%",

                    aspectRatio:
                      "16 / 9",

                    borderRadius:
                      10,

                    display:
                      "block",

                    background:
                      "#000"
                  }}
                />

              ) : (

                <div
                  style={{
                    padding:
                      40,

                    textAlign:
                      "center"
                  }}
                >
                  Video URL is not available.
                </div>

              )}


              {/* VIDEO DETAILS */}

              <div
                style={{
                  marginTop:
                    16,

                  display:
                    "grid",

                  gap:
                    8
                }}
              >

                {videoAsset.videoUrl && (

                  <div
                    style={{
                      fontSize:
                        13,

                      wordBreak:
                        "break-all"
                    }}
                  >
                    <strong>
                      Video URL:
                    </strong>{" "}
                    {
                      videoAsset.videoUrl
                    }
                  </div>

                )}


                {videoAsset.vdocipherUrl && (

                  <div
                    style={{
                      fontSize:
                        13,

                      wordBreak:
                        "break-all"
                    }}
                  >
                    <strong>
                      VdoCipher URL:
                    </strong>{" "}
                    {
                      videoAsset.vdocipherUrl
                    }
                  </div>

                )}


                {videoAsset.vdocipherVideoId && (

                  <div
                    style={{
                      fontSize:
                        13,

                      wordBreak:
                        "break-all"
                    }}
                  >
                    <strong>
                      VdoCipher Video ID:
                    </strong>{" "}
                    {
                      videoAsset.vdocipherVideoId
                    }
                  </div>

                )}

              </div>


              {/* VIDEO LIKES & COMMENTS SUMMARY */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 14,
                  padding: "10px 14px",
                  background: "var(--surface-muted, #f8fafc)",
                  borderRadius: 10,
                  border: "1px solid var(--hair, #e2e8f0)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#e11d48", fontWeight: 700, fontSize: 13 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="#e11d48" stroke="#e11d48" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
                    </svg>
                    {videoLikes[videoAsset.id] || 0} Likes
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#2563eb", fontWeight: 700, fontSize: 13 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 1 1 16.1-3.8Z" />
                    </svg>
                    {(videoComments[videoAsset.id] || []).length} Comments
                  </span>
                </div>

                {(videoComments[videoAsset.id] || []).length > 0 ? (
                  <button
                    type="button"
                    className="btn btn-green btn-sm"
                    onClick={() =>
                      setActiveCommentsVideo(videoAsset)
                    }
                    style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    <MIcon name="chat" size={14} />
                    <span>View & Reply to Comments</span>
                  </button>
                ) : (
                  <span style={{ fontSize: 12, color: "var(--mute, #94a3b8)", fontStyle: "italic" }}>
                    No comments to reply to
                  </span>
                )}
              </div>

            </div>

          </div>,
          document.body
        )}


        {/* =================================================
            ADMIN VIDEO COMMENTS & REPLIES MODAL
        ================================================= */}

        {activeCommentsVideo && (
          <AdminVideoCommentsModal
            video={activeCommentsVideo}
            likesCount={videoLikes[activeCommentsVideo.id] || 0}
            onClose={() => setActiveCommentsVideo(null)}
          />
        )}


        {/* =================================================
            EDIT MODAL
        ================================================= */}

        {editingAsset && (

          <EditContentModal
            asset={
              editingAsset
            }

            onCancel={() =>
              setEditingAsset(
                null
              )
            }

            onSave={
              saveEditedAsset
            }
          />

        )}


        {/* =================================================
            VIDEO ADD MODAL
        ================================================= */}

        {videoModalOpen && (

          <VideoModal

            onCancel={() =>
              setVideoModalOpen(
                false
              )
            }

            onSave={
              async (
                meta
              ) => {

                try {

                  if (!window.db) {
                    throw new Error(
                      "Firestore is not initialized."
                    );
                  }
/* =====================================
                     UPLOAD THUMBNAIL
                  ===================================== */

                  let thumbnailResult = null;

                  if (meta.thumbnailFile) {
                    thumbnailResult =
                      await uploadFile(
                        meta.thumbnailFile,
                        "thumbnail",
                        "/api/upload-content-thumbnail",
                        () => {}
                      );
                  }


                  /* =====================================
                     FIRESTORE
                  ===================================== */

                  const now =
                    new Date()
                      .toISOString();


                  const item = {

                    type:
                      "video",

                    title:
                      meta.title,

                    description:
                      meta.description,

                    category:
                      meta.category,

                    tags:
                      meta.tags,

                    videoUrl:
                      meta.videoUrl,

                    vdocipherUrl:
                      meta.vdocipherUrl,

                    vdocipherVideoId:
                      meta.vdocipherVideoId,

                    thumbnailUrl:
                      thumbnailResult?.url || "",

                    thumbnailPath:
                      thumbnailResult?.path || "",

                    thumbnailName:
                      thumbnailResult?.filename || "",

                    thumbnailSize:
                      thumbnailResult?.size || 0,

                    publishedAt:
                      meta.publishedAt,

                    status:
                      meta.status,

                    ownerId:
                      user?.id ||
                      user?.uid ||
                      "",

                    ownerName:
                      user?.name ||
                      user?.displayName ||
                      user?.email ||
                      "Admin",

                    createdBy:
                      user?.id ||
                      user?.uid ||
                      "",

                    createdByName:
                      user?.name ||
                      user?.displayName ||
                      user?.email ||
                      "Admin",

                    createdAt:
                      now,

                    updatedAt:
                      now,

                    modified:
                      now.slice(
                        0,
                        10
                      )

                  };


                  const docRef =
                    await window.db
                      .collection(
                        "content"
                      )
                      .add(
                        item
                      );



                  if (
                    data.refreshContent
                  ) {

                    await data.refreshContent();

                  }


                  push(
                    "Video added successfully."
                  );


                  setVideoModalOpen(
                    false
                  );


                } catch (
                  error
                ) {

                  console.error(
                    "Error saving video:",
                    error
                  );


                  push(
                    error?.message ||
                    "Unable to save video."
                  );

                }

              }
            }

          />

        )}


        {/* =================================================
            PDF METADATA MODAL
        ================================================= */}

        {metaQueue.length >
          0 && (

          <PdfMetadataModal
            asset={
              metaQueue[0]
            }

            onCancel={() => {

              setMetaQueue(
                (
                  current
                ) =>
                  current.slice(
                    1
                  )
              );

            }}

            onSave={
              async (
                meta
              ) => {

                try {
/* =====================================
                     THUMBNAIL
                  ===================================== */

                  let thumbnailResult = null;

                  if (meta.thumbnailFile) {
                    thumbnailResult =
                      await uploadFile(
                        meta.thumbnailFile,
                        "thumbnail",
                        "/api/upload-content-thumbnail",
                        () => {}
                      );
                  }


                  if (!window.db) {

                    throw new Error(
                      "Firestore is not initialized."
                    );

                  }


                  const now =
                    new Date()
                      .toISOString();


                  const queued =
                    metaQueue[0];


                  const item = {

                    type:
                      "pdf",

                    title:
                      meta.title,

                    description:
                      meta.description,

                    category:
                      meta.category,

                    tags:
                      meta.tags,

                    pdfUrl:
                      queued.pdfUrl,

                    pdfPath:
                      queued.pdfPath,

                    pdfName:
                      queued.pdfFilename ||
                      queued.file?.name ||
                      queued.name,

                    pdfSize:
                      queued.pdfSize ||
                      queued.file?.size ||
                      0,

                    thumbnailUrl:
                      thumbnailResult?.url || "",

                    thumbnailPath:
                      thumbnailResult?.path || "",

                    thumbnailName:
                      thumbnailResult?.filename || "",

                    thumbnailSize:
                      thumbnailResult?.size || 0,

                    publishedAt:
                      meta.publishedAt,

                    status:
                      meta.status,

                    ownerId:
                      user?.id ||
                      user?.uid ||
                      "",

                    ownerName:
                      user?.name ||
                      user?.displayName ||
                      user?.email ||
                      "Admin",

                    createdBy:
                      user?.id ||
                      user?.uid ||
                      "",

                    createdByName:
                      user?.name ||
                      user?.displayName ||
                      user?.email ||
                      "Admin",

                    createdAt:
                      now,

                    updatedAt:
                      now,

                    modified:
                      now.slice(
                        0,
                        10
                      )

                  };


                  const docRef =
                    await window.db
                      .collection(
                        "content"
                      )
                      .add(
                        item
                      );


                

                  if (
                    data.refreshContent
                  ) {

                    await data.refreshContent();

                  }


                  push(
                    `${meta.category} added successfully.`
                  );


                  setMetaQueue(
                    (
                      current
                    ) =>
                      current.slice(
                        1
                      )
                  );


                } catch (
                  error
                ) {

                  console.error(
                    "Error saving content:",
                    error
                  );


                  push(
                    error?.message ||
                    "Unable to save content."
                  );

                }

              }
            }
          />

        )}

      </div>

    </Shell>
  );
}


/* =========================================================
   PDF METADATA MODAL
========================================================= */

function PdfMetadataModal({
  asset,
  onCancel,
  onSave
}) {

  const [
    title,
    setTitle
  ] = useState(
    asset.name
  );


  const [
    description,
    setDescription
  ] = useState(
    ""
  );


  const [
    category,
    setCategory
  ] = useState(
    "Newsletter"
  );


  const [
    tagsStr,
    setTagsStr
  ] = useState(
    ""
  );


  const [
    publishedAt,
    setPublishedAt
  ] = useState(
    new Date()
      .toISOString()
      .slice(
        0,
        10
      )
  );


  const [
    status,
    setStatus
  ] = useState(
    "published"
  );


  const [
    thumbnailFile,
    setThumbnailFile
  ] = useState(
    null
  );


  const [
    thumbnailPreview,
    setThumbnailPreview
  ] = useState(
    ""
  );


  const thumbnailInputRef =
    useRef(null);


  useEffect(
    () => {

      return () => {

        if (
          thumbnailPreview
        ) {

          URL.revokeObjectURL(
            thumbnailPreview
          );

        }

      };

    },
    [
      thumbnailPreview
    ]
  );


  /* =======================================================
     THUMBNAIL
     ======================================================= */

  const chooseThumbnail =
    (
      event
    ) => {

      const file =
        event.target.files?.[0];


      event.target.value =
        "";


      if (!file) {
        return;
      }


      const validTypes = [
        "image/png",
        "image/jpeg",
        "image/webp"
      ];


      if (
        !validTypes.includes(
          file.type
        )
      ) {

        alert(
          "Thumbnail must be PNG, JPG or WebP."
        );

        return;
      }


      if (
        file.size >
        MAX_THUMBNAIL_SIZE
      ) {

        alert(
          "Thumbnail must be smaller than 5 MB."
        );

        return;
      }


      if (
        thumbnailPreview
      ) {

        URL.revokeObjectURL(
          thumbnailPreview
        );

      }


      setThumbnailFile(
        file
      );


      setThumbnailPreview(
        URL.createObjectURL(
          file
        )
      );

    };


  /* =======================================================
     SAVE
     ======================================================= */

  const save = () => {

    const cleanTitle =
      title.trim();


    const cleanDescription =
      description.trim();


    if (!cleanTitle) {

      alert(
        "Title is required."
      );

      return;
    }
onSave({

      title:
        cleanTitle,

      description:
        cleanDescription,

      category,

      tags:
        tagsStr
          .split(",")
          .map(
            (
              tag
            ) =>
              tag.trim()
          )
          .filter(
            Boolean
          ),

      thumbnailFile,

      publishedAt,

      status

    });

  };


  const modalContent = (
    <div
      className="mscrim open"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(10, 12, 16, 0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        padding: 20,
        boxSizing: "border-box"
      }}
      onClick={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onCancel();
        }
      }}
    >
      <div
        className="mmodal upload-edit-modal"
        role="dialog"
        aria-modal="true"
        style={{
          maxWidth: 680,
          width: "94vw",
          maxHeight: "92vh",
          overflowY: "auto",
          margin: "auto",
          borderRadius: 16,
          background: "var(--surface, #ffffff)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
        }}
      >

        <div
          className="edit-modal-header"
        >

          <div>

            <span
              className="edit-modal-eyebrow"
            >
              PDF CONTENT
            </span>

            <h3>
              Add details
            </h3>

          </div>


          <button
            type="button"
            className="row-act"
            onClick={
              onCancel
            }

            style={{
              width:
                34,

              height:
                34
            }}
          >
            ×
          </button>

        </div>


        <p
          className="mtext"
          style={{
            marginBottom:
              16
          }}
        >

          Uploaded{" "}

          <b>
            {
              asset.name
            }
          </b>

          {" "}

          (
          {
            asset.size
          }
          ).

          Add metadata before
          it joins the library.

        </p>


        {/* TITLE */}

        <div
          className="field"
        >

          <label>
            Title <span className="required-star">*</span>
          </label>

          <input
            className="input"
            value={
              title
            }

            onChange={
              (
                event
              ) =>
                setTitle(
                  event.target.value
                )
            }

            placeholder="Enter title"
          />

        </div>


        {/* DESCRIPTION */}

        <div
          className="field"
        >

          <label>
            Description
          </label>

          <textarea
            className="textarea"
            value={
              description
            }

            onChange={
              (
                event
              ) =>
                setDescription(
                  event.target.value
                )
            }

            placeholder="Short description"
          />

        </div>


        {/* CATEGORY */}

        <div
          className="field-grid2"
        >

          <div
            className="field"
          >

            <label>
              Category
            </label>

            <select
              className="select"
              value={
                category
              }

              onChange={
                (
                  event
                ) =>
                  setCategory(
                    event.target.value
                  )
              }
            >

              {CATEGORIES.map(
                (
                  item
                ) => (

                  <option
                    key={
                      item
                    }

                    value={
                      item
                    }
                  >
                    {
                      item
                    }
                  </option>

                )
              )}

            </select>

          </div>


          <div
            className="field"
          >

            <label>
              Publish Date
            </label>

            <input
              className="input"
              type="date"

              value={
                publishedAt
              }

              onChange={
                (
                  event
                ) =>
                  setPublishedAt(
                    event.target.value
                  )
              }
            />

          </div>

        </div>


        {/* THUMBNAIL */}

        <div
          className="field"
        >

          <label>
            Thumbnail
          </label>


          <input
            ref={
              thumbnailInputRef
            }

            type="file"

            accept="
              image/png,
              image/jpeg,
              image/webp
            "

            hidden

            onChange={
              chooseThumbnail
            }
          />


          <button
            type="button"

            className="btn btn-ghost btn-block btn-sm"

            onClick={() =>
              thumbnailInputRef
                .current
                ?.click()
            }
          >

            <MIcon
              name="image"
              size={15}
            />

            Choose

          </button>

        </div>


        {/* PREVIEW */}

        {thumbnailPreview && (

          <div
            style={{
              marginTop:
                12
            }}
          >

            <img
              src={
                thumbnailPreview
              }

              alt="Thumbnail preview"

              style={{
                width:
                  "100%",

                height:
                  180,

                objectFit:
                  "cover",

                borderRadius:
                  10,

                display:
                  "block"
              }}
            />

          </div>

        )}


        {/* TAGS */}

        <div
          className="field"
        >

          <label>
            Tags (comma separated)
          </label>

          <input
            className="input"

            value={
              tagsStr
            }

            onChange={
              (
                event
              ) =>
                setTagsStr(
                  event.target.value
                )
            }

            placeholder="e.g. sip, beginner, market"
          />

        </div>


        {/* STATUS */}

        <div
          className="field"
        >

          <label>
            Status
          </label>

          <select
            className="select"

            value={
              status
            }

            onChange={
              (
                event
              ) =>
                setStatus(
                  event.target.value
                )
            }
          >

            <option value="published">
              Published
            </option>

            <option value="draft">
              Draft
            </option>

          </select>

        </div>


        {/* ACTIONS */}

        <div
          className="mactions"
        >

          <button
            className="btn btn-ghost btn-sm"

            onClick={
              onCancel
            }
          >
            Discard
          </button>


          <button
            className="btn btn-green btn-sm"

            onClick={
              save
            }
          >
            Save to library
          </button>

        </div>

      </div>

    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : modalContent;
}


/* =========================================================
   EXPORT
========================================================= */

window.UploadsScreen =
  UploadsScreen;
