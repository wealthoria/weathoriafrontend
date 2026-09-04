import React from "react";

/* global React, window */

/* =========================================================================
   Wealthoria Admin — Members
   Clean members table + search + CSV/Excel export
   ========================================================================= */

const {
  useState,
  useEffect,
  useMemo
} = React;

const {
  Shell,
  MIcon
} = window;


/* =========================================================================
   HELPERS
   ========================================================================= */

function displayValue(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return String(value);
}


function formatMemberDate(value) {

  if (!value) {
    return "—";
  }

  try {

    if (
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
      return "—";
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

    return "—";

  }
}


/* =========================================================================
   CSV HELPER
   ========================================================================= */

function csvCell(value) {

  const text =
    value === null ||
    value === undefined
      ? ""
      : String(value);

  return `"${text
    .replace(/"/g, '""')
    .replace(/\r?\n/g, " ")
  }"`;

}


function downloadBlob(
  blob,
  filename
) {

  const url =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement(
      "a"
    );

  link.href = url;

  link.download =
    filename;

  document.body.appendChild(
    link
  );

  link.click();

  document.body.removeChild(
    link
  );

  setTimeout(() => {

    URL.revokeObjectURL(
      url
    );

  }, 1000);

}


/* =========================================================================
   EXPORT CSV
   ========================================================================= */
function exportMembersCSV(members) {

  const headers = [
    "Member Name",
    "Email",
    "Phone Number",
    "Member ID",
    "Role",
    "Status",
    "Notifications",
    "Joined Date"
  ];

  const rows = members.map((member) => [
    member.name,
    member.email,
    member.phone,
    member.uid,
    member.role,
    member.status,
    member.notificationEnabled
      ? "Enabled"
      : "Not enabled",
    formatMemberDate(member.joinedAt)
  ]);

  const csv = [
    headers.map(csvCell).join(","),

    ...rows.map((row) =>
      row.map(csvCell).join(",")
    )

  ].join("\r\n");

  const blob = new Blob(
    [
      "\uFEFF" + csv
    ],
    {
      type:
        "text/csv;charset=utf-8;"
    }
  );

  downloadBlob(
    blob,
    "wealthoria-members.csv"
  );
}

/* =========================================================================
   EXPORT EXCEL
   ========================================================================= */

function exportMembersExcel(
  members
) {

  /*
     Creates an Excel-compatible .xls file.
     It opens directly in Microsoft Excel
     without requiring another npm package.
  */

  const rows =
    members.map(
      (member) => [

        member.name,

        member.email,

        member.phone,

        member.uid,

        member.role,

        member.status,


        member.notificationEnabled
          ? "Enabled"
          : "Not enabled",

        formatMemberDate(
          member.joinedAt
        )

      ]
    );


  const headers = [

    "Member Name",
    "Email",
    "Phone Number",
    "Member ID",
    "Role",
    "Status",
    
    "Notifications",
    "Joined Date"

  ];


  const escapeHtml =
    (value) => {

      return String(
        value === null ||
        value === undefined
          ? ""
          : value
      )
        .replace(
          /&/g,
          "&amp;"
        )
        .replace(
          /</g,
          "&lt;"
        )
        .replace(
          />/g,
          "&gt;"
        )
        .replace(
          /"/g,
          "&quot;"
        )
        .replace(
          /'/g,
          "&#39;"
        );

    };


  const headerHtml =
    headers
      .map(
        (header) =>
          `<th>${escapeHtml(
            header
          )}</th>`
      )
      .join("");


  const bodyHtml =
    rows
      .map(
        (row) =>
          `<tr>${row
            .map(
              (cell) =>
                `<td>${escapeHtml(
                  cell
                )}</td>`
            )
            .join("")}</tr>`
      )
      .join("");


  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>

  body {
    font-family:
      Arial,
      sans-serif;
  }

  table {
    border-collapse:
      collapse;
    width: 100%;
  }

  th {
    background:
      #e8473f;
    color:
      #ffffff;
    font-weight:
      bold;
    border:
      1px solid #d9d9d9;
    padding:
      8px;
    text-align:
      left;
  }

  td {
    border:
      1px solid #d9d9d9;
    padding:
      8px;
    vertical-align:
      top;
  }

</style>
</head>
<body>

<table>

<thead>
<tr>
${headerHtml}
</tr>
</thead>

<tbody>
${bodyHtml}
</tbody>

</table>

</body>
</html>`;


  const blob =
    new Blob(
      [
        "\uFEFF",
        html
      ],
      {
        type:
          "application/vnd.ms-excel;charset=utf-8;"
      }
    );


  downloadBlob(
    blob,
    "wealthoria-members.xls"
  );

}


/* =========================================================================
   MEMBERS SCREEN
   ========================================================================= */

function UsersScreen() {

  const [members, setMembers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");


  /* =======================================================
     LOAD MEMBERS
  ======================================================= */

  useEffect(() => {

    if (!window.db) {

      setError(
        "Firebase Firestore is not available."
      );

      setLoading(
        false
      );

      return;
    }


    let unsubscribe =
      null;


    try {

      unsubscribe =
        window.db
          .collection(
            "members"
          )
          .onSnapshot(

            (snapshot) => {

              const rows =
                snapshot.docs.map(
                  (doc) => {

                    const data =
                      doc.data() ||
                      {};


                    return {

                      id:
                        doc.id,

                      uid:
                        data.uid ||
                        data.userId ||
                        doc.id,

                      name:
                        data.name ||
                        data.fullName ||
                        data.displayName ||
                        data.username ||
                        "—",

                      email:
                        data.email ||
                        data.emailAddress ||
                        "—",

                      phone:
                        data.phone ||
                        data.phoneNumber ||
                        data.mobile ||
                        data.mobileNumber ||
                        "—",

                      role:
                        data.role ||
                        "member",

                      status:
                        data.status ||
                        (
                          data.active === false
                            ? "inactive"
                            : "active"
                        ),

                      joinedAt:
                        data.createdAt ||
                        data.joinedAt ||
                        data.registeredAt ||
                        data.createdOn ||
                        null,

                      city:
                        data.city ||
                        "",

                      state:
                        data.state ||
                        "",

                      country:
                        data.country ||
                        "",

                      occupation:
                        data.occupation ||
                        data.job ||
                        "",

                      company:
                        data.company ||
                        "",

                      gender:
                        data.gender ||
                        "",

                      dateOfBirth:
                        data.dateOfBirth ||
                        data.dob ||
                        "",

                      notificationEnabled:
                        Boolean(
                          data.fcmToken
                        )

                    };

                  }
                );


              rows.sort(
                (a, b) => {

                  return String(
                    a.name
                  )
                    .toLowerCase()
                    .localeCompare(
                      String(
                        b.name
                      )
                        .toLowerCase()
                    );

                }
              );


              setMembers(
                rows
              );


              setLoading(
                false
              );

              setError("");

            },


            (firebaseError) => {

              console.error(
                "Members Firestore error:",
                firebaseError
              );


              setError(
                firebaseError?.message ||
                "Unable to load members."
              );


              setLoading(
                false
              );

            }

          );

    } catch (error) {

      console.error(
        "Members initialization error:",
        error
      );


      setError(
        error?.message ||
        "Unable to load members."
      );


      setLoading(
        false
      );

    }


    return () => {

      if (
        typeof unsubscribe ===
        "function"
      ) {

        unsubscribe();

      }

    };

  }, []);


  /* =======================================================
     SEARCH
  ======================================================= */

  const filteredMembers =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();


      if (!query) {

        return members;

      }


      return members.filter(
        (member) => {

          const searchable =
            [

              member.uid,

              member.name,

              member.email,

              member.phone,

              member.role,

              member.status,

              member.city,

              member.state,

              member.country,

              member.occupation,

              member.company,

              member.gender,

              member.dateOfBirth

            ]
              .map(
                (value) =>
                  String(
                    value || ""
                  )
                    .toLowerCase()
              );


          return searchable.some(
            (value) =>
              value.includes(
                query
              )
          );

        }
      );

    }, [
      members,
      search
    ]);


  /* =======================================================
     EXPORT CURRENT FILTERED RESULTS
  ======================================================= */

  const handleCSVExport =
    () => {

      exportMembersCSV(
        filteredMembers
      );

    };


  const handleExcelExport =
    () => {

      exportMembersExcel(
        filteredMembers
      );

    };


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <Shell
      title="Members"
      subtitle={
        `${members.length} registered members`
      }
    >

      <div
        className="members-admin-page"
        style={{
          width: "100%"
        }}
      >


        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div
          style={{
            display:
              "flex",

            alignItems:
              "flex-end",

            justifyContent:
              "space-between",

            gap:
              20,

            marginBottom:
              22,

            flexWrap:
              "wrap"
          }}
        >


          <div>

            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                gap:
                  10,

                marginBottom:
                  6
              }}
            >

              <h2
                style={{
                  margin: 0,

                  fontSize:
                    26,

                  lineHeight:
                    1.2,

                  fontWeight:
                    800,

                  color:
                    "var(--ink, #111827)"
                }}
              >
                Members
              </h2>


              <span
                style={{
                  display:
                    "inline-flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  minWidth:
                    32,

                  height:
                    24,

                  padding:
                    "0 8px",

                  borderRadius:
                    999,

                  background:
                    "#fde9e5",

                  color:
                    "#c94337",

                  fontSize:
                    12,

                  fontWeight:
                    800
                }}
              >
                {members.length}
              </span>

            </div>


            <p
              style={{
                margin:
                  0,

                fontSize:
                  14,

                color:
                  "var(--muted, #6b7280)"
              }}
            >
              View, search and export your
              registered members.
            </p>

          </div>


          {/* =================================================
              EXPORT BUTTONS
          ================================================= */}

          <div
            style={{
              display:
                "flex",

              gap:
                10,

              flexWrap:
                "wrap"
            }}
          >

            <button
              type="button"
              onClick={
                handleCSVExport
              }
              disabled={
                loading ||
                filteredMembers.length === 0
              }
              style={{
                height:
                  42,

                padding:
                  "0 15px",

                display:
                  "inline-flex",

                alignItems:
                  "center",

                gap:
                  8,

                border:
                  "1px solid #d9dde3",

                borderRadius:
                  10,

                background:
                  "#ffffff",

                color:
                  "#25313f",

                fontSize:
                  13,

                fontWeight:
                  700,

                cursor:
                  loading ||
                  filteredMembers.length === 0
                    ? "not-allowed"
                    : "pointer",

                opacity:
                  loading ||
                  filteredMembers.length === 0
                    ? 0.5
                    : 1
              }}
            >

              <MIcon
                name="download"
                size={16}
              />

              Export CSV

            </button>


            <button
              type="button"
              onClick={
                handleExcelExport
              }
              disabled={
                loading ||
                filteredMembers.length === 0
              }
              style={{
                height:
                  42,

                padding:
                  "0 15px",

                display:
                  "inline-flex",

                alignItems:
                  "center",

                gap:
                  8,

                border:
                  "1px solid #d7e6db",

                borderRadius:
                  10,

                background:
                  "#edf8ef",

                color:
                  "#217a36",

                fontSize:
                  13,

                fontWeight:
                  700,

                cursor:
                  loading ||
                  filteredMembers.length === 0
                    ? "not-allowed"
                    : "pointer",

                opacity:
                  loading ||
                  filteredMembers.length === 0
                    ? 0.5
                    : 1
              }}
            >

              <MIcon
                name="download"
                size={16}
              />

              Export Excel

            </button>

          </div>

        </div>


        {/* =================================================
            TOOLBAR
        ================================================= */}

        <div
          style={{
            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "space-between",

            gap:
              14,

            marginBottom:
              16,

            padding:
              14,

            background:
              "var(--surface, #ffffff)",

            border:
              "1px solid var(--line, #e5e7eb)",

            borderRadius:
              12,

            flexWrap:
              "wrap"
          }}
        >


          {/* SEARCH */}

          <div
            style={{
              position:
                "relative",

              width:
                "min(520px, 100%)"
            }}
          >

            <MIcon
              name="search"
              size={17}
              style={{
                position:
                  "absolute",

                left:
                  14,

                top:
                  "50%",

                transform:
                  "translateY(-50%)",

                color:
                  "#8a939e",

                pointerEvents:
                  "none"
              }}
            />


            <input
              type="text"
              value={
                search
              }
              onChange={
                (event) =>
                  setSearch(
                    event.target.value
                  )
              }
              placeholder={
                "Search name, email, phone number or member ID..."
              }
              aria-label="Search members"
              style={{
                width:
                  "100%",

                height:
                  44,

                padding:
                  "0 42px",

                border:
                  "1px solid #dfe3e8",

                borderRadius:
                  9,

                outline:
                  "none",

                background:
                  "#ffffff",

                color:
                  "#202833",

                fontSize:
                  14
              }}
            />

          </div>


          {/* SEARCH RESULT */}

          <div
            style={{
              fontSize:
                13,

              color:
                "var(--muted, #6b7280)",

              whiteSpace:
                "nowrap"
            }}
          >

            {search
              ? `${filteredMembers.length} result${filteredMembers.length === 1 ? "" : "s"}`
              : `${members.length} members`
            }

          </div>

        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div
            style={{
              marginBottom:
                16,

              padding:
                "13px 15px",

              borderRadius:
                10,

              border:
                "1px solid #f1c5c0",

              background:
                "#fff3f1",

              color:
                "#b42318",

              fontSize:
                13
            }}
          >

            {error}

          </div>

        )}


        {/* =================================================
            TABLE
        ================================================= */}

        <div
          style={{
            background:
              "var(--surface, #ffffff)",

            border:
              "1px solid var(--line, #e5e7eb)",

            borderRadius:
              14,

            overflow:
              "hidden",

            boxShadow:
              "0 4px 16px rgba(25,35,45,0.04)"
          }}
        >


          {loading ? (

            <div
              style={{
                minHeight:
                  240,

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                color:
                  "var(--muted, #6b7280)",

                fontSize:
                  14
              }}
            >

              Loading members...

            </div>


          ) : filteredMembers.length === 0 ? (

            <div
              style={{
                minHeight:
                  240,

                display:
                  "flex",

                flexDirection:
                  "column",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                padding:
                  30,

                textAlign:
                  "center"
              }}
            >

              <div
                style={{
                  width:
                    48,

                  height:
                    48,

                  borderRadius:
                    "50%",

                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  background:
                    "#f3f5f7",

                  marginBottom:
                    12
                }}
              >

                <MIcon
                  name="search"
                  size={20}
                />

              </div>


              <strong
                style={{
                  fontSize:
                    15,

                  marginBottom:
                    5
                }}
              >
                No members found
              </strong>


              <span
                style={{
                  fontSize:
                    13,

                  color:
                    "var(--muted, #6b7280)"
                }}
              >
                Try another name, email,
                phone number or member ID.
              </span>

            </div>


          ) : (

            <div
              style={{
                width:
                  "100%",

                overflowX:
                  "auto"
              }}
            >

              <table
                style={{
                  width:
                    "100%",

                  minWidth:
                    1280,

                  borderCollapse:
                    "collapse"
                }}
              >


                {/* =================================================
                    HEAD
                ================================================= */}

                <thead>

                  <tr
                    style={{
                      background:
                        "#f8fafb",

                      borderBottom:
                        "1px solid #e4e7eb"
                    }}
                  >

                    {[
                      "#",
                      "MEMBER",
                      "EMAIL",
                      "PHONE",
                      "MEMBER ID",
                      "ROLE",
                      "STATUS",
                      
                      "NOTIFICATIONS",
                      "JOINED"
                    ].map(
                      (heading) => (

                        <th
                          key={
                            heading
                          }
                          style={{
                            padding:
                              "13px 14px",

                            textAlign:
                              "left",

                            fontSize:
                              11,

                            fontWeight:
                              800,

                            letterSpacing:
                              "0.04em",

                            color:
                              "#6b7280",

                            whiteSpace:
                              "nowrap"
                          }}
                        >
                          {heading}
                        </th>

                      )
                    )}

                  </tr>

                </thead>


                {/* =================================================
                    BODY
                ================================================= */}

                <tbody>

                  {filteredMembers.map(
                    (
                      member,
                      index
                    ) => (

                      <tr
                        key={
                          member.id
                        }
                        style={{
                          borderBottom:
                            "1px solid #eef0f2"
                        }}
                      >


                        {/* INDEX */}

                        <td
                          style={{
                            padding:
                              "15px 14px",

                            color:
                              "#8a939e",

                            fontSize:
                              12
                          }}
                        >
                          {index + 1}
                        </td>


                        {/* MEMBER */}

                        <td
                          style={{
                            padding:
                              "15px 14px"
                          }}
                        >

                          <div
                            style={{
                              display:
                                "flex",

                              alignItems:
                                "center",

                              gap:
                                10
                            }}
                          >

                            <div
                              style={{
                                width:
                                  38,

                                height:
                                  38,

                                flex:
                                  "0 0 38px",

                                display:
                                  "flex",

                                alignItems:
                                  "center",

                                justifyContent:
                                  "center",

                                borderRadius:
                                  "50%",

                                background:
                                  "#fde9e5",

                                color:
                                  "#c94337",

                                fontWeight:
                                  800,

                                fontSize:
                                  14
                              }}
                            >

                              {String(
                                member.name
                              )
                                .charAt(0)
                                .toUpperCase()}

                            </div>


                            <div
                              style={{
                                minWidth:
                                  140
                              }}
                            >

                              <div
                                style={{
                                  fontSize:
                                    13,

                                  fontWeight:
                                    750,

                                  color:
                                    "#202833"
                                }}
                              >
                                {displayValue(
                                  member.name
                                )}
                              </div>


                              <div
                                style={{
                                  marginTop:
                                    3,

                                  fontSize:
                                    11,

                                  color:
                                    "#89929d"
                                }}
                              >
                                Member
                              </div>

                            </div>

                          </div>

                        </td>


                        {/* EMAIL */}

                        <td
                          style={{
                            padding:
                              "15px 14px",

                            fontSize:
                              13,

                            color:
                              "#374151",

                            whiteSpace:
                              "nowrap"
                          }}
                        >
                          {displayValue(
                            member.email
                          )}
                        </td>


                        {/* PHONE */}

                        <td
                          style={{
                            padding:
                              "15px 14px",

                            fontSize:
                              13,

                            color:
                              "#374151",

                            whiteSpace:
                              "nowrap"
                          }}
                        >
                          {displayValue(
                            member.phone
                          )}
                        </td>


                        {/* MEMBER ID */}

                        <td
                          style={{
                            padding:
                              "15px 14px",

                            fontFamily:
                              "ui-monospace, SFMono-Regular, Menlo, monospace",

                            fontSize:
                              11,

                            color:
                              "#59636e",

                            maxWidth:
                              190,

                            wordBreak:
                              "break-all"
                          }}
                        >
                          {displayValue(
                            member.uid
                          )}
                        </td>


                        {/* ROLE */}

                        <td
                          style={{
                            padding:
                              "15px 14px",

                            fontSize:
                              12,

                            color:
                              "#4b5563"
                          }}
                        >
                          {displayValue(
                            member.role
                          )}
                        </td>


                        {/* STATUS */}

                        <td
                          style={{
                            padding:
                              "15px 14px"
                          }}
                        >

                          <span
                            style={{
                              display:
                                "inline-flex",

                              alignItems:
                                "center",

                              gap:
                                6,

                              padding:
                                "5px 9px",

                              borderRadius:
                                999,

                              background:
                                String(
                                  member.status
                                )
                                  .toLowerCase() ===
                                "active"
                                  ? "#eaf7ed"
                                  : "#f1f3f5",

                              color:
                                String(
                                  member.status
                                )
                                  .toLowerCase() ===
                                "active"
                                  ? "#217a36"
                                  : "#69727c",

                              fontSize:
                                11,

                              fontWeight:
                                750
                            }}
                          >

                            <span
                              style={{
                                width:
                                  6,

                                height:
                                  6,

                                borderRadius:
                                  "50%",

                                background:
                                  String(
                                    member.status
                                  )
                                    .toLowerCase() ===
                                  "active"
                                    ? "#2ead4b"
                                    : "#9aa1a8"
                              }}
                            />

                            {displayValue(
                              member.status
                            )}

                          </span>

                        </td>






                        {/* NOTIFICATION */}

                        <td
                          style={{
                            padding:
                              "15px 14px",

                            whiteSpace:
                              "nowrap"
                          }}
                        >

                          <span
                            style={{
                              fontSize:
                                11,

                              fontWeight:
                                700,

                              color:
                                member.notificationEnabled
                                  ? "#217a36"
                                  : "#7a838d"
                            }}
                          >

                            {member.notificationEnabled
                              ? "Enabled"
                              : "Not enabled"}

                          </span>

                        </td>


                        {/* JOINED */}

                        <td
                          style={{
                            padding:
                              "15px 14px",

                            whiteSpace:
                              "nowrap",

                            fontSize:
                              12,

                            color:
                              "#66717d"
                          }}
                        >
                          {formatMemberDate(
                            member.joinedAt
                          )}
                        </td>


                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>


        {/* =================================================
            FOOTER
        ================================================= */}

        {!loading &&
          filteredMembers.length > 0 && (

          <div
            style={{
              display:
                "flex",

              justifyContent:
                "space-between",

              alignItems:
                "center",

              gap:
                12,

              marginTop:
                12,

              flexWrap:
                "wrap",

              fontSize:
                12,

              color:
                "var(--muted, #6b7280)"
            }}
          >

            <span>
              Showing{" "}
              <strong
                style={{
                  color:
                    "#374151"
                }}
              >
                {filteredMembers.length}
              </strong>{" "}
              of{" "}
              <strong
                style={{
                  color:
                    "#374151"
                }}
              >
                {members.length}
              </strong>{" "}
              members
            </span>


            <span>
              Export uses the currently
              filtered results.
            </span>

          </div>

        )}

      </div>

    </Shell>

  );

}


/* =========================================================================
   EXPORT
   ========================================================================= */

window.UsersScreen =
  UsersScreen;
