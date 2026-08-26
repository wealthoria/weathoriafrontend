const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

const PORT = 5174;
const ROOT = __dirname;

const THUMBNAIL_DIR = path.join(
  ROOT,
  "public",
  "members",
  "course-thumbnails"
);
\n/* Serve uploaded thumbnails */\napp.use(\n  "/members",\n  express.static(\n    path.join(ROOT, "members")\n  )\n);\n
/* Allow the Wealthoria app running on localhost:5173
   to call this upload API on localhost:5174. */
app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "http://localhost:5173"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

fs.mkdirSync(
  THUMBNAIL_DIR,
  { recursive: true }
);

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(
      null,
      THUMBNAIL_DIR
    );
  },

  filename: (req, file, cb) => {

    const ext =
      path
        .extname(
          file.originalname || ""
        )
        .toLowerCase() || ".png";

    const base =
      path
        .basename(
          file.originalname || "thumbnail",
          ext
        )
        .replace(
          /[^a-zA-Z0-9_-]/g,
          "-"
        )
        .replace(
          /-+/g,
          "-"
        )
        .replace(
          /^-|-$/g,
          ""
        )
        .toLowerCase() ||
      "thumbnail";

    const randomNumber =
      Math.floor(
        100000 +
        Math.random() * 900000
      );

    cb(
      null,
      `${base}-${randomNumber}${ext}`
    );
  }
});

const upload =
  multer({
    storage,

    limits: {
      fileSize:
        5 * 1024 * 1024
    },

    fileFilter:
      (req, file, cb) => {

        const allowed = [
          "image/png",
          "image/jpeg",
          "image/webp"
        ];

        if (
          allowed.includes(
            file.mimetype
          )
        ) {
          cb(null, true);
          return;
        }

        cb(
          new Error(
            "Only PNG, JPG, JPEG and WebP images are allowed."
          )
        );
      }
  });


/*
  IMPORTANT:
  Your existing localhost:5173 server must serve
  /members/course-thumbnails/ files.

  This API only handles uploads and returns
  the relative URL.
*/

app.post(
  "/api/upload-course-thumbnail",
  upload.single("thumbnail"),
  (req, res) => {

    if (!req.file) {
      return res.status(400).json({
        message:
          "No thumbnail file was uploaded."
      });
    }

    const url =
      `/members/course-thumbnails/${encodeURIComponent(
        req.file.filename
      )}`;

    return res.json({
      success: true,
      filename:
        req.file.filename,
      url
    });
  }
);


app.use(
  (error, req, res, next) => {

    console.error(
      "Upload error:",
      error
    );

    return res.status(400).json({
      message:
        error?.message ||
        "Thumbnail upload failed."
    });
  }
);


app.listen(
  PORT,
  () => {

    console.log(
      `Thumbnail upload API running on http://localhost:${PORT}`
    );

    console.log(
      `Saving to ${THUMBNAIL_DIR}`
    );
  }
);