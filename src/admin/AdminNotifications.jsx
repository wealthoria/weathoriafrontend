import React from "react";

/* global React, window */

const {
  useState,
  useEffect
} = React;

function AdminNotifications() {

 const API_BASE_URL =
  "https://webinar-registration-backend.onrender.com";

  const [members, setMembers] =
    useState([]);

  const [sendMode, setSendMode] =
    useState("single");

  const [selectedMember, setSelectedMember] =
    useState("");

  const [selectedMembers, setSelectedMembers] =
    useState([]);

  const [title, setTitle] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [loadingMembers, setLoadingMembers] =
    useState(true);

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

      const response =
        await fetch(
          `${API_BASE_URL}/api/admin/notifications/members`
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
          "Unable to load members."
        );
      }

      setMembers(
        data.members || []
      );

    } catch (error) {

      console.error(
        "Load members error:",
        error
      );

      setError(
        error.message ||
        "Unable to load members."
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

        const response =
          await fetch(
            `${API_BASE_URL}/api/admin/notifications/send`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify({

                  userIds,

                  title:
                    title.trim(),

                  message:
                    message.trim()

                })
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


        setSuccess(
          data.message ||
          "Notification sent successfully."
        );


        setTitle("");
        setMessage("");
        setSelectedMember("");
        setSelectedMembers([]);

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
              Send a push notification
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


window.AdminNotifications =
  AdminNotifications;

console.log(
  "AdminNotifications loaded successfully"
);
