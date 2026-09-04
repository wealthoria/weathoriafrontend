import React from "react";

/* global React, window */

/* =========================================================================
   AdminDataContext

   Firestore is the source of truth.

   Collections:
   - content
   - uploads
   - courses
   - students

   Admin actions:
   - create
   - update
   - delete
   - publish / unpublish

   localStorage is NOT used for database data.
   ========================================================================= */

const {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} = React;


/* =========================================================
   CONTEXT
========================================================= */

const AdminDataContext =
  createContext(null);


/* =========================================================
   HOOK
========================================================= */

function useAdminData() {

  return useContext(
    AdminDataContext
  );

}


/* =========================================================
   FIRESTORE HELPERS
========================================================= */

function getDB() {

  if (!window.db) {

    throw new Error(
      "Firestore is not initialized."
    );

  }

  return window.db;

}


/* =========================================================
   ADMIN DATA PROVIDER
========================================================= */

function AdminDataProvider({
  children
}) {

  const [content, setContent] =
    useState([]);

  const [uploads, setUploads] =
    useState([]);

  const [courses, setCourses] =
    useState([]);

  const [students, setStudents] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);


  /* =======================================================
     LOAD CONTENT FROM FIRESTORE
  ======================================================= */
const loadContent = useCallback(async () => {
  try {
    const snapshot = await getDB()
      .collection("content")
      .get();

   const items = snapshot.docs.map((doc) => ({
  ...doc.data(),
  id: doc.data().id || doc.id,
  firestoreId: doc.id
}));
    setContent(items);

    console.log("Firestore content loaded:", items);

  } catch (err) {
    console.error("Error loading content:", err);
    setError(err.message);
  }
}, []);


  /* =======================================================
     LOAD ALL DATA
  ======================================================= */

  const loadData =
    useCallback(async () => {

      setLoading(true);
      setError(null);

      try {

        await Promise.all([
          loadContent()
        ]);

      } catch (err) {

        console.error(
          "Error loading admin data:",
          err
        );

        setError(
          err.message
        );

      } finally {

        setLoading(false);

      }

    }, [loadContent]);


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {

    loadData();

  }, [loadData]);


  /* =======================================================
     ADD CONTENT
  ======================================================= */

  const addContent =
    useCallback(
      async (item) => {

        try {

          const db =
            getDB();

          /* Remove local fake ID.
             Firestore creates the real ID. */

          const {
            id,
            ...dataToSave
          } = item;
const docRef = await db
  .collection("content")
  .add({
    ...item,
    createdAt: new Date().toISOString(),
    modified: new Date().toISOString().slice(0, 10)
  });

const savedItem = {
  ...item,
  firestoreId: docRef.id,
  modified: new Date().toISOString().slice(0, 10)
};

setContent((prev) => [
  savedItem,
  ...prev
]);

          console.log(
            "Content added:",
            savedItem
          );

          return savedItem;

        } catch (err) {

          console.error(
            "Error saving content:",
            err
          );

          throw err;

        }

      },
      []
    );


  /* =======================================================
     UPDATE CONTENT
  ======================================================= */
const updateContent = useCallback(
  async (id, patch) => {
    try {
      if (!id) {
        throw new Error("Content ID is missing.");
      }

      const item = content.find((c) => c.id === id);

      if (!item) {
        throw new Error("Content not found.");
      }

      const firestoreId =
        item.firestoreId || item.id;

      const updateData = {
        ...patch,
        modified: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString()
      };

      await getDB()
        .collection("content")
        .doc(firestoreId)
        .update(updateData);

      setContent((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                ...updateData
              }
            : c
        )
      );

      console.log(
        "Content updated in Firestore:",
        firestoreId
      );

    } catch (err) {
      console.error(
        "Error updating content:",
        err
      );

      throw err;
    }
  },
  [content]
);

  /* =======================================================
     DELETE CONTENT
  ======================================================= */
const deleteContent = useCallback(
  async (ids) => {
    try {
      if (!Array.isArray(ids)) {
        ids = [ids];
      }

      const db = getDB();

      const itemsToDelete = content.filter(
        (item) => ids.includes(item.id)
      );

      await Promise.all(
        itemsToDelete.map((item) => {
          const firestoreId =
            item.firestoreId || item.id;

          return db
            .collection("content")
            .doc(firestoreId)
            .delete();
        })
      );

      setContent((prev) =>
        prev.filter(
          (item) => !ids.includes(item.id)
        )
      );

      console.log(
        "Content deleted from Firestore:",
        ids
      );

    } catch (err) {
      console.error(
        "Error deleting content:",
        err
      );

      throw err;
    }
  },
  [content]
);

  /* =======================================================
     PUBLISH / UNPUBLISH
  ======================================================= */
const setContentStatus = useCallback(
  async (ids, status) => {
    try {
      if (!Array.isArray(ids)) {
        ids = [ids];
      }

      const db = getDB();

      const modified =
        new Date().toISOString().slice(0, 10);

      const items = content.filter(
        (item) => ids.includes(item.id)
      );

      await Promise.all(
        items.map((item) => {
          const firestoreId =
            item.firestoreId || item.id;

          return db
            .collection("content")
            .doc(firestoreId)
            .update({
              status,
              modified,
              updatedAt:
                new Date().toISOString()
            });
        })
      );

      setContent((prev) =>
        prev.map((item) =>
          ids.includes(item.id)
            ? {
                ...item,
                status,
                modified
              }
            : item
        )
      );

    } catch (err) {
      console.error(
        "Error updating content status:",
        err
      );

      throw err;
    }
  },
  [content]
);

  /* =======================================================
     REFRESH CONTENT
  ======================================================= */

  const refreshContent =
    useCallback(
      async () => {

        await loadContent();

      },
      [loadContent]
    );


  /* =======================================================
     VALUE
  ======================================================= */

  const value = {

    content,

    uploads,

    students,

    courses,

    loading,

    error,

    addContent,

    updateContent,

    deleteContent,

    setContentStatus,

    refreshContent,

    /* Existing functions kept so
       other Admin pages don't crash. */

    addUpload: async () => {
      console.warn(
        "addUpload is not connected to Firestore yet."
      );
    },

    deleteUpload: async () => {
      console.warn(
        "deleteUpload is not connected to Firestore yet."
      );
    },

    setStudentStatus: async () => {
      console.warn(
        "setStudentStatus is not connected to Firestore yet."
      );
    },

    deleteStudent: async () => {
      console.warn(
        "deleteStudent is not connected to Firestore yet."
      );
    },

    saveCourse: async () => {
      console.warn(
        "saveCourse is not connected to Firestore yet."
      );
    },

    deleteCourse: async () => {
      console.warn(
        "deleteCourse is not connected to Firestore yet."
      );
    },

    resetAll: async () => {

      await loadContent();

    }

  };


  return (

    <AdminDataContext.Provider
      value={value}
    >

      {children}

    </AdminDataContext.Provider>

  );

}


/* =========================================================
   EXPORT
========================================================= */

Object.assign(
  window,
  {
    AdminDataContext,
    useAdminData,
    AdminDataProvider
  }
);


console.log(
  "ADMIN STORE LOADED - FIRESTORE MODE"
);
