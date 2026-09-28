import React from "react";
import { auth } from "../firebase";
/* global React, window */

const {
  useState,
  useEffect
} = React;

// Same categories as the admin upload screen (admin/uploads.jsx).
const NOTIFICATION_CATEGORIES = [
  "Newsletter",
  "Weekly Roundup",
  "Articles & Reports",
  "Ratio Analysis",
  "Vedios"
];

function AdminNotifications() {

  const API_BASE_URL =
    "https://asia-south1-wealthoria-6fc11.cloudfunctions.net";

  const { useAdminData } = window;

  const data = useAdminData();

  

  const [members, setMembers] = useState([]);

  const [sendMode, setSendMode] = useState("single");

  const [selectedMember, setSelectedMember] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  const [title, setTitle] = useState("");

  const [message, setMessage] = useState("");

const [contentItems, setContentItems] = useState([]);
const [selectedContent, setSelectedContent] = useState("");
const [selectedCategory, setSelectedCategory] = useState("");


  const [loadingMembers, setLoadingMembers] = useState(true);

  const [sending, setSending] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  /* =========================================================
     LOAD MEMBERS
  ========================================================= */

  useEffect(() => {

    loadMembers();

  }, []);
const loadMembers = async () => {
  try {
    setLoadingMembers(true);
    setError("");

    const user = auth.currentUser;

    if (!user) {
      throw new Error("Admin authentication required.");
    }

    const token = await user.getIdToken(true);

    const response = await fetch(
      `${API_BASE_URL}/api/admin/notifications/members`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok || !data?.success) {
      throw new Error(
        data?.message || "Unable to load members."
      );
    }

    setMembers(data.members || []);
  } catch (error) {
    console.error("Load members error:", error);

    setError(
      error.message || "Unable to load members."
    );
  } finally {
    setLoadingMembers(false);
  }
};

  /* =========================================================
     SELECT MEMBERS
  ========================================================= */

  const toggleMember = (uid) => {

    setSelectedMembers((current) => {

      if (current.includes(uid)) {

        return current.filter(
          (id) => id !== uid
        );

      }

      return [
        ...current,
        uid
      ];

    });

  };




// Published content from the admin data store (loaded from Firestore).
useEffect(() => {
  const items = Array.isArray(data?.content) ? data.content : [];
  setContentItems(items.filter((item) => item.status === "published"));
}, [data?.content]);

  /* =========================================================
     SEND NOTIFICATION
  ========================================================= */

  const sendNotification =
    async (event) => {

      event.preventDefault();

      setError("");
      setSuccess("");

      if (!title.trim()) {

        setError(
          "Please enter a notification title."
        );

        return;

      }

      if (!message.trim()) {

        setError(
          "Please enter a notification message."
        );

        return;

      }


      let userIds = [];


      /* SINGLE */

      if (sendMode === "single") {

        if (!selectedMember) {

          setError(
            "Please select a member."
          );

          return;

        }

        userIds = [
          selectedMember
        ];

      }


      /* SELECTED */

      if (sendMode === "selected") {

        if (
          selectedMembers.length === 0
        ) {

          setError(
            "Please select at least one member."
          );

          return;

        }

        userIds =
          selectedMembers;

      }


      /* ALL */

      if (sendMode === "all") {

        userIds =
          members
            .map(
              (member) =>
                member.uid
            )
            .filter(Boolean);

        if (
          userIds.length === 0
        ) {

          setError(
            "No members are available."
          );

          return;

        }

      }


      setSending(true);


      try {

     const user = auth.currentUser;

if (!user) {
  throw new Error("Admin authentication required.");
}

// Large sends are split by the server into rounds of ~100 seconds.
// Keep sending the remaining members until everyone is done.
const totals = {
  emailSentCount: 0,
  sentCount: 0,
  devicesReached: 0
};

let pendingIds = userIds;

for (let round = 1; pendingIds.length > 0 && round <= 20; round++) {
  const token = await user.getIdToken(round === 1);

  const response = await fetch(
    `${API_BASE_URL}/api/admin/notifications/send`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        userIds: pendingIds,
        title: title.trim(),
        message: message.trim(),
        category: selectedCategory || null,
        contentId: selectedContent || null,
      }),
    }
  );

  const data =
    await response.json();

  if (
    !response.ok ||
    !data?.success
  ) {
    throw new Error(
      data?.message ||
      "Unable to send notification."
    );
  }

  totals.emailSentCount += data.emailSentCount || 0;
  totals.sentCount += data.sentCount || 0;
  totals.devicesReached += data.devicesReached || 0;

  const remaining = Array.isArray(data.remainingUserIds)
    ? data.remainingUserIds
    : [];

  // Safety: stop if the server made no progress.
  if (remaining.length >= pendingIds.length) {
    throw new Error("Sending stopped making progress. Please try again.");
  }

  pendingIds = remaining;

  if (pendingIds.length > 0) {
    setSuccess(
      `Sent to ${userIds.length - pendingIds.length} of ${userIds.length} member(s)... continuing.`
    );
  }
}

setSuccess(
  `Email sent to ${totals.emailSentCount} member(s). ` +
  `Push notification sent to ${totals.sentCount} member(s) ` +
  `(${totals.devicesReached} device(s)).`
);

setTitle("");
setMessage("");
setSelectedMember("");
setSelectedMembers([]);
setSelectedCategory("");
setSelectedContent("");

// Refresh the page after 5 seconds
setTimeout(() => {
  window.location.reload();
}, 5000);

      } catch (error) {

        console.error(
          "Send notification error:",
          error
        );

        setError(
          error.message ||
          "Unable to send notification."
        );

      } finally {

        setSending(false);

      }

    };


  /* =========================================================
     UI
  ========================================================= */

  return (

    <section
      className="admin-notifications-page"
    >

      <div
        className="admin-notifications-card"
      >

        <div
          className="admin-notifications-header"
        >

          <div>

            <span>
              MEMBER PORTAL
            </span>

            <h2>
              Send Notification
            </h2>

            <p>
               Send a push notification and email
  to your members.

            </p>

          </div>

        </div>


        {error && (

          <div
            className="admin-notifications-error"
          >
            {error}
          </div>

        )}


        {success && (

          <div
            className="admin-notifications-success"
          >
            {success}
          </div>

        )}


        <form
          onSubmit={
            sendNotification
          }
        >


          {/* SEND MODE */}

          <div
            className="admin-notifications-field"
          >

            <label>
              Send To
            </label>

            <select
              value={sendMode}
              onChange={(event) => {

                setSendMode(
                  event.target.value
                );

                setSelectedMember("");
                setSelectedMembers([]);

              }}
              disabled={
                sending ||
                loadingMembers
              }
            >

              <option value="single">
                One Member
              </option>

              <option value="selected">
                Selected Members
              </option>

              <option value="all">
                All Members
              </option>

            </select>

          </div>


          {/* SINGLE */}

          {sendMode === "single" && (

            <div
              className="admin-notifications-field"
            >

              <label>
                Member
              </label>

              <select
                value={
                  selectedMember
                }
                onChange={(event) =>
                  setSelectedMember(
                    event.target.value
                  )
                }
                disabled={
                  loadingMembers ||
                  sending
                }
              >

                <option value="">
                  {
                    loadingMembers
                      ? "Loading members..."
                      : "Select member"
                  }
                </option>

                {members.map(
                  (member) => (

                    <option
                      key={
                        member.uid
                      }
                      value={
                        member.uid
                      }
                    >

                      {
                        member.name ||
                        member.email ||
                        member.uid
                      }

                      {
                        member.email
                          ? ` (${member.email})`
                          : ""
                      }

                    </option>

                  )
                )}

              </select>

            </div>

          )}


          {/* SELECTED MEMBERS */}

          {sendMode === "selected" && (

            <div
              className="admin-notification-member-list"
            >

              <label>
                Select Members
              </label>

              <div
                className="admin-notification-check-list"
              >

                {members.map(
                  (member) => (

                    <label
                      key={
                        member.uid
                      }
                      className="admin-notification-check-item"
                    >

                      <input
                        type="checkbox"

                        checked={
                          selectedMembers.includes(
                            member.uid
                          )
                        }

                        onChange={() =>
                          toggleMember(
                            member.uid
                          )
                        }

                        disabled={
                          sending
                        }
                      />

                      <span>
                        <strong>
                          {
                            member.name ||
                            "Member"
                          }
                        </strong>

                        <small>
                          {
                            member.email
                          }
                        </small>
                      </span>

                    </label>

                  )
                )}

              </div>

              <small>
                {
                  selectedMembers.length
                }{" "}
                member(s) selected
              </small>

            </div>

          )}


          {/* ALL */}

          {sendMode === "all" && (

            <div
              className="admin-notification-all-info"
            >

              <strong>
                All Members
              </strong>

              <span>
                This notification will be
                sent to{" "}
                {members.length}
                {" "}
                member(s).
              </span>

            </div>

          )}


          {/* TITLE */}

          <div
            className="admin-notifications-field"
          >

            <label>
              Notification Title
            </label>

            <input
              type="text"

              value={
                title
              }

              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }

              placeholder="New Weekly Roundup"

              maxLength={
                100
              }

              disabled={
                sending
              }

            />

          </div>


          {/* MESSAGE */}

          <div
            className="admin-notifications-field"
          >

            <label>
              Message
            </label>

            <textarea
              value={
                message
              }

              onChange={(event) =>
                setMessage(
                  event.target.value
                )
              }

              placeholder="Your latest Wealthoria report is now available."

              rows={
                6
              }

              maxLength={
                500
              }

              disabled={
                sending
              }

            />

          </div>



<div className="admin-notifications-field">

  <label>
    Category to Open
  </label>

  <select
    value={selectedCategory}
    onChange={(event) => {
      setSelectedCategory(event.target.value);
      setSelectedContent("");
    }}
    disabled={sending}
  >
    <option value="">
      Member dashboard (no category)
    </option>

    {NOTIFICATION_CATEGORIES.map((category) => (
      <option key={category} value={category}>
        {category === "Vedios" ? "Videos" : category}
      </option>
    ))}
  </select>

</div>

{selectedCategory && (
  <div className="admin-notifications-field">

    <label>
      PDF / Content to Open
    </label>

    <select
      value={selectedContent}
      onChange={(event) =>
        setSelectedContent(event.target.value)
      }
      disabled={sending}
    >
      <option value="">
        Just open the {selectedCategory === "Vedios" ? "Videos" : selectedCategory} page
      </option>

      {contentItems
        .filter((item) => item.category === selectedCategory)
        .sort((a, b) =>
          String(b.publishedAt || b.createdAt || "").localeCompare(
            String(a.publishedAt || a.createdAt || "")
          )
        )
        .map((item) => {
          const isVideo =
            String(item.type || "").toLowerCase() === "video";

          const id = item.firestoreId || item.id;

          return (
            <option key={id} value={id}>
              {isVideo ? "🎥 " : "📄 "}
              {item.title || item.pdfName || "Untitled"}
            </option>
          );
        })}
    </select>

    <small style={{ display: "block", marginTop: 6, opacity: 0.75 }}>
      Tapping the notification opens this in the member&apos;s dashboard
      (members log in first if needed).
    </small>

  </div>
)}

          <button
            type="submit"

            className="admin-notifications-send"

            disabled={
              sending ||
              loadingMembers
            }
          >

            {
              sending
                ? "Sending..."
                : sendMode === "all"
                  ? "Send to All Members"
                  : sendMode === "selected"
                    ? "Send to Selected Members"
                    : "Send Notification"
            }

          </button>


        </form>

      </div>

    </section>

  );

}


window.AdminNotifications = AdminNotifications;
