
/* =========================================================================
   WEALTHORIA ADMIN — UPLOADS

   SAME EXISTING DESIGN
   --------------------
   PDF
   -> Node backend
   -> backend/public/members/content-pdfs/

   Thumbnail
   -> Node backend
   -> backend/public/members/content-thumbnails/

   Metadata
   -> Firestore collection: content

   Categories:
   -> Newsletter
   -> Weekly Roundup
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

const API_BASE_URL =
  "https://webinar-registration-backend.onrender.com";

const CATEGORIES = [
  "Newsletter",
  "Weekly Roundup"
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

  if (
    bytes <
    1024 * 1024
  ) {

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
   IMPORTANT
   FIRESTORE STORES RELATIVE SERVER URLS

   Example:
   /members/content-thumbnails/file.png

   Browser needs:
   http://localhost:10000/members/content-thumbnails/file.png
========================================================= */

function getFileUrl(
  fileUrl
) {

  if (!fileUrl) {
    return "";
  }

  if (
    fileUrl.startsWith(
      "http://"
    ) ||
    fileUrl.startsWith(
      "https://"
    )
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


      xhr.upload.onprogress =
        (
          event
        ) => {

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


      xhr.onload =
        () => {

          let data =
            null;

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

            resolve(
              data
            );

            return;

          }


          reject(
            new Error(
              data?.message ||
              "File upload failed."
            )
          );

        };


      xhr.onerror =
        () => {

          reject(
            new Error(
              "Unable to connect to the upload server."
            )
          );

        };


      xhr.onabort =
        () => {

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
   UPLOADS SCREEN
========================================================= */

function UploadsScreen() {

  const {
    user
  } = useAdminAuth();


  const {isAdmin} = useRole();


  const data =useAdminData();


  const { push} = useMToast();


  const confirm =
    useConfirm();


  const inputRef =
    useRef(null);

const [editingAsset, setEditingAsset] = useState(null);
const [pdfAsset, setPdfAsset] = useState(null);
const [expandedDescriptionId, setExpandedDescriptionId] = useState(null);
const [expandedTagsId, setExpandedTagsId] = useState(null);
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


  const perPage =
    8;


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
              (
                file
              ) =>
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

              id:
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

              progress:
                0,

              file:
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
                              progress:
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

                  console.log(
                    "PDF uploaded:",
                    result
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


                  setMetaQueue(
                    (
                      current
                    ) => [

                      ...current,

                      {

                        id:
                          id,

                        name:
                          file.name,

                        size:
                          fmtSize(
                            file.size
                          ),

                        type:
                          "pdf",

                        file:
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
     CONTENT FROM FIRESTORE
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
              new Date(
                a.createdAt ||
                a.updatedAt ||
                a.publishedAt ||
                0
              ).getTime();


            const bDate =
              new Date(
                b.createdAt ||
                b.updatedAt ||
                b.publishedAt ||
                0
              ).getTime();


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
     DELETE CONTENT
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
         * First delete Firestore record.
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
         * Then ask backend to delete
         * physical files.
         */

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

  const saveEditedAsset = async (
    meta
  ) => {

    if (!editingAsset) {
      return;
    }

    try {

      if (!window.db) {
        throw new Error(
          "Firestore is not initialized."
        );
      }

      const now =
        new Date().toISOString();

      const updateData = {
        title:
          meta.title.trim(),

        description:
          meta.description.trim(),

        category:
          meta.category,

        tags:
          Array.isArray(meta.tags)
            ? meta.tags
            : [],

        publishedAt:
          meta.publishedAt,

        status:
          meta.status,

        updatedAt:
          now,

        modified:
          now.slice(0, 10)
      };


      let newPdf = null;
      let newThumbnail = null;


      /* =====================================================
         OPTIONAL PDF REPLACEMENT
      ===================================================== */

      if (meta.pdfFile) {

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
         OPTIONAL THUMBNAIL REPLACEMENT
      ===================================================== */

      if (meta.thumbnailFile) {

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
         UPDATE EXISTING FIRESTORE DOCUMENT
      ===================================================== */

      await window.db
        .collection("content")
        .doc(editingAsset.id)
        .set(
          updateData,
          {
            merge: true
          }
        );


      /* =====================================================
         DELETE OLD FILES ONLY AFTER SUCCESSFUL UPDATE
      ===================================================== */

      if (
        editingAsset.pdfPath &&
        newPdf
      ) {

        try {

          await fetch(
            `${API_BASE_URL}/api/delete-content-files`,
            {
              method: "POST",

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

        } catch (error) {

          console.warn(
            "Old PDF cleanup failed:",
            error
          );

        }

      }


      if (
        editingAsset.thumbnailPath &&
        newThumbnail
      ) {

        try {

          await fetch(
            `${API_BASE_URL}/api/delete-content-files`,
            {
              method: "POST",

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

        } catch (error) {

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


      setEditingAsset(null);


    } catch (error) {

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
            DROPZONE
        ================================================= */}

        <div
          className={
            `dropzone ${
              drag
                ? "drag"
                : ""
            }`
          }

          onDragOver={
            (
              event
            ) => {

              event.preventDefault();

              setDrag(
                true
              );

            }
          }

          onDragLeave={
            (
              event
            ) => {

              event.preventDefault();

              setDrag(
                false
              );

            }
          }

          onDrop={
            onDrop
          }

          onClick={() =>
            inputRef
              .current
              ?.click()
          }
        >

          <div
            className="dz-ic"
          >

            <MIcon
              name="upload"
              size={26}
            />

          </div>


          <h3>

            {
              drag
                ? "Drop files to upload"
                : "Drag and drop files here"
            }

          </h3>


          <p>
            or click to browse.
            Newsletter and Weekly Roundup PDFs.
          </p>


          <div
            className="dz-hint"
          >
            Up to 8 files at a time.
            Maximum PDF size 25 MB.
          </div>


          <input
            ref={
              inputRef
            }

            type="file"

            accept=".pdf,application/pdf"

            multiple

            hidden

            onChange={
              (
                event
              ) => {

                if (
                  event.target
                    .files
                    ?.length
                ) {

                  startUploads(
                    event.target.files
                  );

                }


                event.target.value =
                  "";

              }
            }

          />

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
            marginTop:
              24
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


          <select
            className="selectmini"
            value={
              type
            }

            onChange={
              (
                event
              ) =>
                setType(
                  event.target.value
                )
            }
          >

            <option
              value="all"
            >
              All types
            </option>


            <option
              value="pdf"
            >
              PDF
            </option>

          </select>


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

            <option
              value="all"
            >
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

            <option
              value="recent"
            >
              Newest first
            </option>


            <option
              value="name"
            >
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
              Upload your first file using
              the box above, or adjust your filters.
            </p>

          </div>

        ) : (

          <React.Fragment>

            <div
              className="asset-grid"
            >

              {pageRows.map(
                (
                  item
                ) => (

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

                      style={{
                        background:
                          item.thumbnailUrl
                            ? "transparent"
                            : "linear-gradient(135deg,#fde7e1,#f9d2c4)"
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
                            width:
                              46,

                            height:
                              46,

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
                            name="file"
                            size={22}
                          />

                        </span>

                      )}


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
                        PDF
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
                            item.pdfSize
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
{item.description && (
  <div className="asset-description-wrap">

    {expandedDescriptionId === item.id ? (
      <p className="asset-description expanded">
        {item.description}
        <span
          className="asset-inline-toggle"
          role="button"
          tabIndex={0}
          onClick={() => setExpandedDescriptionId(null)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setExpandedDescriptionId(null);
            }
          }}
        >
          less
        </span>
      </p>
    ) : (
      <p className="asset-description">
        {item.description.length > 150
          ? item.description.slice(0, 150).trimEnd() + "..."
          : item.description}

        {item.description.length > 150 && (
          <span
            className="asset-inline-toggle"
            role="button"
            tabIndex={0}
            onClick={() => setExpandedDescriptionId(item.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setExpandedDescriptionId(item.id);
              }
            }}
          >
            ...
          </span>
        )}
      </p>
    )}

  </div>
)}

{Array.isArray(item.tags) && item.tags.length > 0 && (
  <div className="asset-tags-wrap">

    {expandedTagsId === item.id ? (
      <div className="atags asset-tags-expanded">
        {item.tags.map((tag) => (
          <span
            className="badge badge-soft"
            key={tag}
          >
            {tag}
          </span>
        ))}

        <span
          className="asset-inline-toggle"
          role="button"
          tabIndex={0}
          onClick={() => setExpandedTagsId(null)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setExpandedTagsId(null);
            }
          }}
        >
          less
        </span>
      </div>
    ) : (
      <div className="atags">
        {item.tags.slice(0, 4).map((tag) => (
          <span
            className="badge badge-soft"
            key={tag}
          >
            {tag}
          </span>
        ))}

        {item.tags.length > 4 && (
          <span
            className="asset-inline-toggle asset-tags-more"
            role="button"
            tabIndex={0}
            onClick={() => setExpandedTagsId(item.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setExpandedTagsId(item.id);
              }
            }}
          >
            ...
          </span>
        )}
      </div>
    )}

  </div>
)}

<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 10
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
      boxShadow:
        "inset 0 0 0 1px var(--hair)"
    }}
  >
    ✎
    <span style={{ marginLeft: 5 }}>
      Edit
    </span>
  </button>


  {/* OPEN PDF */}
  {item.pdfUrl && (
    <button
      type="button"
      className="row-act"
      title="Open PDF"
      onClick={() =>
        setPdfAsset(item)
      }
      style={{
        width: 34,
        height: 34,
        justifyContent: "center",
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


  {/* DELETE */}
  <button
    type="button"
    className="row-act danger"
    title="Delete"
    onClick={() =>
      removeAsset(item)
    }
    style={{
      width: 34,
      height: 34,
      justifyContent: "center",
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

                )
              )}

            </div>


            {/* =============================================
                PAGER
            ============================================= */}

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
                          index +
                            1
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
{pdfAsset && pdfAsset.pdfUrl && (
  <div
    className="mscrim open"
    onClick={(event) => {
      if (
        event.target === event.currentTarget
      ) {
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
        padding: 12
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
        <strong>
          {pdfAsset.title ||
            "PDF Preview"}
        </strong>

        <button
          type="button"
          className="row-act"
          onClick={() =>
            setPdfAsset(null)
          }
          style={{
            width: 34,
            height: 34
          }}
        >
          ×
        </button>
      </div>

      <iframe
        src={`${getFileUrl(
          pdfAsset.pdfUrl
        )}#toolbar=0&navpanes=0`}
        title={
          pdfAsset.title ||
          "PDF Preview"
        }
        style={{
          width: "100%",
          height:
            "calc(100% - 44px)",
          border: 0,
          display: "block"
        }}
      />
    </div>
  </div>
)}

        {/* =================================================
            METADATA MODAL
        ================================================= */}

        {editingAsset && (
          <EditContentModal

            asset={
              editingAsset
            }

            onCancel={() =>
              setEditingAsset(null)
            }

            onSave={
              saveEditedAsset
            }

          />
        )}


        {metaQueue.length >
          0 && (

          <MetadataModal

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

                  if (
                    !meta.thumbnailFile
                  ) {

                    throw new Error(
                      "Please choose a thumbnail."
                    );

                  }


                  /* =====================================
                     UPLOAD THUMBNAIL
                  ===================================== */

                  const thumbnailResult =
                    await uploadFile(
                      meta.thumbnailFile,

                      "thumbnail",

                      "/api/upload-content-thumbnail",

                      () => {}
                    );


                  /* =====================================
                     FIRESTORE
                  ===================================== */

                  if (
                    !window.db
                  ) {

                    throw new Error(
                      "Firestore is not initialized."
                    );

                  }


                  const now =
                    new Date()
                      .toISOString();


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
                      metaQueue[0]
                        .pdfUrl,

                    pdfPath:
                      metaQueue[0]
                        .pdfPath,

                    pdfName:
                      metaQueue[0]
                        .pdfFilename ||
                      metaQueue[0]
                        .file
                        ?.name ||
                      metaQueue[0]
                        .name,

                    pdfSize:
                      metaQueue[0]
                        .pdfSize ||
                      metaQueue[0]
                        .file
                        ?.size ||
                      0,

                    thumbnailUrl:
                      thumbnailResult
                        .url,

                    thumbnailPath:
                      thumbnailResult
                        .path,

                    thumbnailName:
                      thumbnailResult
                        .filename ||
                      meta.thumbnailFile
                        .name,

                    thumbnailSize:
                      thumbnailResult
                        .size ||
                      meta.thumbnailFile
                        .size,

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


                  console.log(
                    "Content saved to Firestore:",
                    docRef.id
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
   METADATA MODAL
========================================================= */


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
  ] = useState(
    ""
  );


  const [
    thumbnailName,
    setThumbnailName
  ] = useState(
    ""
  );


  const pdfInputRef =
    useRef(null);

  const thumbnailInputRef =
    useRef(null);


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

    setPdfName(
      file.name
    );

  };


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


    if (!cleanDescription) {

      alert(
        "Description is required."
      );

      return;
    }


    onSave({

      title:
        cleanTitle,

      description:
        cleanDescription,

      category:
        category,

      tags:
        tagsStr
          .split(",")
          .map(
            (tag) =>
              tag.trim()
          )
          .filter(Boolean),

      publishedAt:
        publishedAt,

      status:
        status,

      pdfFile:
        pdfFile,

      thumbnailFile:
        thumbnailFile
    });

  };


  return (

    <div
      className="mscrim open"
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


        <div className="field">

          <label>
            Title
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


        <div
          className="field-grid2"
        >

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
              value={publishedAt}
              onChange={(event) =>
                setPublishedAt(
                  event.target.value
                )
              }
            />

          </div>

        </div>


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
            placeholder="e.g. market, stocks, beginner"
          />

        </div>


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


        {/* =====================================================
            REPLACE PDF
        ===================================================== */}

        <div className="edit-upload-box">

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
            ref={pdfInputRef}
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


        {/* =====================================================
            REPLACE THUMBNAIL
        ===================================================== */}

        <div className="edit-upload-box">

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
            ref={thumbnailInputRef}
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
            onClick={save}
          >
            Save changes
          </button>

        </div>

      </div>

    </div>

  );

}


function MetadataModal({
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
     CHOOSE THUMBNAIL
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


      const validTypes =
        [
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
     RENDER
  ======================================================= */

  return (

    <div
      className="mscrim open"

      onClick={
        (
          event
        ) => {

          if (
            event.target ===
            event.currentTarget
          ) {

            onCancel();

          }

        }
      }
    >

      <div
        className="mmodal"

        role="dialog"

        aria-modal="true"
      >

        <h3>
          Add details
        </h3>


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

          Add metadata before it joins the library.

        </p>


        {/* ===============================================
            TITLE
        =============================================== */}

        <div
          className="field"
        >

          <label>
            Title
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


        {/* ===============================================
            DESCRIPTION
        =============================================== */}

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


        {/* ===============================================
            CATEGORY + THUMBNAIL
        =============================================== */}

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

        </div>


        {/* ===============================================
            PREVIEW
        =============================================== */}

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


        {/* ===============================================
            TAGS
        =============================================== */}

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


        {/* ===============================================
            DATE + STATUS
        =============================================== */}

        <div
          className="field-grid2"
        >

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

              <option
                value="published"
              >
                Published
              </option>


              <option
                value="draft"
              >
                Draft
              </option>

            </select>

          </div>

        </div>


        {/* ===============================================
            ACTIONS
        =============================================== */}

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

            onClick={() => {

              const cleanTitle =
                title.trim();


              const cleanDescription =
                description.trim();


              if (
                !cleanTitle
              ) {

                alert(
                  "Title is required."
                );

                return;

              }


              if (
                !cleanDescription
              ) {

                alert(
                  "Description is required."
                );

                return;

              }


              if (
                !thumbnailFile
              ) {

                alert(
                  "Please choose a thumbnail."
                );

                return;

              }


              onSave({

                title:
                  cleanTitle,

                description:
                  cleanDescription,

                category:
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

                thumbnailFile:
                  thumbnailFile,

                publishedAt:
                  publishedAt,

                status:
                  status

              });

            }}
          >

            Save to library

          </button>

        </div>

      </div>

    </div>

  );

}


/* =========================================================
   EXPORT
========================================================= */

window.UploadsScreen =
  UploadsScreen;


