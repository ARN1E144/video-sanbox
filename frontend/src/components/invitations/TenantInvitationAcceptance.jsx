// src/components/invitations/TenantInvitationAcceptance.jsx

import React, {
  useEffect,
  useState,
} from "react";

import api from "../../services/api";

import {
  useAuth,
} from "../../context/AuthContext";


// =====================================================
// HELPERS
// =====================================================

function normaliseId(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    typeof value === "object"
  ) {
    return (
      value.id ??
      value._id ??
      value.projectId ??
      null
    );
  }

  return String(value);
}


// =====================================================
// INVITATION ACCEPTANCE
// =====================================================
//
// Handles:
//
//   ?invite=<token>
//
// Lifecycle:
//
//   preview invitation
//        ↓
//   show inviter / tenant / projects
//        ↓
//   accept invitation
//        ↓
//   backend creates/finds User
//        ↓
//   backend creates/finds Membership
//        ↓
//   backend creates ProjectMembership
//        ↓
//   backend returns authentication session
//        ↓
//   adoptSession()
//        ↓
//   normal authenticated application
//
// This component intentionally does NOT manage:
//
//   - ProjectContext
//   - ProjectSidebar
//   - project loading
//   - chat
//   - runtime state
//
// Those systems continue through their existing
// authenticated application lifecycle.
// =====================================================

export default function TenantInvitationAcceptance({
  token,
}) {

  const {
    adoptSession,
  } =
    useAuth();


  const [
    invitation,
    setInvitation,
  ] =
    useState(null);


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    accepting,
    setAccepting,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    accepted,
    setAccepted,
  ] =
    useState(false);


  const [
    firstName,
    setFirstName,
  ] =
    useState("");


  const [
    lastName,
    setLastName,
  ] =
    useState("");


  const [
    password,
    setPassword,
  ] =
    useState("");


  // ===================================================
  // LOAD INVITATION
  // ===================================================

  useEffect(() => {

    let cancelled = false;


    async function loadInvitation() {

      if (
        !token
      ) {

        setError(
          "This invitation link is missing its invitation token."
        );

        setLoading(false);

        return;

      }


      try {

        setLoading(true);

        setError("");


        const response =
          await api.get(
            `/tenant/invitations/preview/${encodeURIComponent(
              token
            )}`
          );


        if (
          cancelled
        ) {
          return;
        }


        const data =
          response?.data;


        if (
          !data?.ok ||
          !data?.invitation
        ) {

          throw new Error(
            data?.message ||
            "This invitation could not be loaded."
          );

        }


        setInvitation(
          data.invitation
        );

      }
      catch (err) {

        if (
          cancelled
        ) {
          return;
        }


        console.error(
          "[TenantInvitationAcceptance] preview failed",
          err
        );


        setError(
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "This invitation is invalid, expired, or no longer available."
        );

      }
      finally {

        if (
          !cancelled
        ) {

          setLoading(false);

        }

      }

    }


    loadInvitation();


    return () => {

      cancelled = true;

    };

  }, [
    token,
  ]);


  // ===================================================
  // ACCEPT INVITATION
  // ===================================================

  async function handleAccept() {

    if (
      !token ||
      accepting
    ) {
      return;
    }


    setError("");


    try {

      setAccepting(true);


      const response =
        await api.post(
          "/tenant/invitations/accept",
          {
            token,

            firstName:
              firstName.trim() ||
              undefined,

            lastName:
              lastName.trim() ||
              undefined,

            password:
              password ||
              undefined,
          }
        );


      const data =
        response?.data;


      if (
        !data?.ok ||
        !data?.tokens?.accessToken
      ) {

        throw new Error(
          data?.message ||
          data?.error ||
          "The invitation could not be accepted."
        );

      }


      console.log(
        "[TenantInvitationAcceptance] accepted",
        {
          invitation:
            data.invitation,
          user:
            data.user,
          membership:
            data.membership,
        }
      );


      // -------------------------------------------------
      // Establish the authenticated application session.
      //
      // AuthContext owns authentication state.
      // ProjectContext will subsequently discover the
      // user's accessible projects through its normal
      // authenticated lifecycle.
      // -------------------------------------------------

      await adoptSession({
        tokens:
          data.tokens,

        user:
          data.user,

        membership:
          data.membership,
      });


      setAccepted(true);

    }
    catch (err) {

      console.error(
        "[TenantInvitationAcceptance] acceptance failed",
        err
      );


      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "The invitation could not be accepted."
      );

    }
    finally {

      setAccepting(false);

    }

  }


  // ===================================================
  // LOADING
  // ===================================================

  if (
    loading
  ) {

    return (
      <InvitationShell>

        <div
          style={{
            fontSize: "15px",
            opacity: 0.75,
          }}
        >
          Loading invitation...
        </div>

      </InvitationShell>
    );

  }


  // ===================================================
  // ERROR
  // ===================================================

  if (
    error &&
    !invitation
  ) {

    return (
      <InvitationShell>

        <InvitationHeader />

        <div
          style={{
            marginTop: "24px",
            padding: "16px",
            borderRadius: "10px",
            background:
              "rgba(127, 29, 29, 0.25)",
            border:
              "1px solid rgba(248, 113, 113, 0.35)",
            color: "#fecaca",
            lineHeight: 1.5,
          }}
        >
          {error}
        </div>

        <button
          type="button"
          onClick={() => {
            window.location.href = "/";
          }}
          style={secondaryButtonStyle}
        >
          Return to Confo
        </button>

      </InvitationShell>
    );

  }


  // ===================================================
  // ACCEPTED
  // ===================================================
  //
  // IMPORTANT:
  //
  // Do NOT use AuthContext session here.
  //
  // This component can be rendered before AuthGate and
  // an already-authenticated user may open an invitation.
  //
  // The invitation should only display this state after
  // this component has actually completed acceptance.
  // ===================================================

  if (
    accepted
  ) {

    return (
      <InvitationShell>

        <InvitationHeader />

        <div
          style={{
            marginTop: "28px",
            textAlign: "center",
          }}
        >

          <div
            style={{
              fontSize: "28px",
              marginBottom: "12px",
            }}
          >
            ✓
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: "22px",
            }}
          >
            Invitation accepted
          </h2>

          <p
            style={{
              marginTop: "10px",
              color: "#94a3b8",
              lineHeight: 1.5,
            }}
          >
            Your account has been added to the
            organisation and its assigned projects.
          </p>

          <button
            type="button"
            onClick={() => {

              window.history.replaceState(
                {},
                "",
                "/"
              );

              window.location.reload();

            }}
            style={primaryButtonStyle}
          >
            Continue to Confo
          </button>

        </div>

      </InvitationShell>
    );

  }


  // ===================================================
  // INVITATION
  // ===================================================

  const projects =
    Array.isArray(
      invitation?.projects
    )
      ? invitation.projects
      : [];


  return (
    <InvitationShell>

      <InvitationHeader />


      {/* ===============================================
          INVITATION SUMMARY
      =============================================== */}

      <div
        style={{
          marginTop: "28px",
        }}
      >

        <h1
          style={{
            margin: 0,
            fontSize: "28px",
            lineHeight: 1.2,
          }}
        >
          You're invited
        </h1>


        <p
          style={{
            marginTop: "12px",
            color: "#94a3b8",
            lineHeight: 1.6,
          }}
        >
          {invitation.inviter?.name
            ? `${invitation.inviter.name} has invited you`
            : "You have been invited"}
          {" "}
          to join{" "}
          <strong
            style={{
              color: "#fff",
            }}
          >
            {invitation.tenant?.name ||
              "this organisation"}
          </strong>
          .
        </p>

      </div>


      {/* ===============================================
          INVITER
      =============================================== */}

      {invitation.inviter && (

        <InvitationSection
          title="Invited by"
        >

          <div
            style={{
              fontWeight: 600,
            }}
          >
            {invitation.inviter.name ||
              invitation.inviter.email}
          </div>

          {invitation.inviter.email && (

            <div
              style={{
                marginTop: "4px",
                color: "#94a3b8",
                fontSize: "13px",
              }}
            >
              {invitation.inviter.email}
            </div>

          )}

        </InvitationSection>

      )}


      {/* ===============================================
          TENANT ROLE
      =============================================== */}

      <InvitationSection
        title="Organisation access"
      >

        <AccessRow
          label="Role"
          value={
            invitation.tenantRole ||
            "member"
          }
        />

      </InvitationSection>


      {/* ===============================================
          PROJECT ACCESS
      =============================================== */}

      <InvitationSection
        title="Project access"
      >

        {projects.length === 0 ? (

          <div
            style={{
              color: "#94a3b8",
              fontSize: "14px",
            }}
          >
            No specific projects have been assigned.
          </div>

        ) : (

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >

            {projects.map(
              (
                project,
                index
              ) => {

                const projectId =
                  normaliseId(
                    project?.projectId ??
                    project?.id ??
                    project?._id
                  );


                return (
                  <div
                    key={
                      projectId ||
                      index
                    }
                    style={{
                      padding: "14px",
                      borderRadius: "10px",
                      background:
                        "rgba(15, 23, 42, 0.7)",
                      border:
                        "1px solid rgba(148, 163, 184, 0.14)",
                    }}
                  >

                    <div
                      style={{
                        fontWeight: 600,
                      }}
                    >
                      {project?.name ||
                        project?.projectName ||
                        "Project"}
                    </div>


                    <div
                      style={{
                        marginTop: "6px",
                        color: "#94a3b8",
                        fontSize: "13px",
                      }}
                    >
                      Role:{" "}
                      <span
                        style={{
                          color: "#e2e8f0",
                        }}
                      >
                        {project?.role ||
                          "viewer"}
                      </span>
                    </div>

                  </div>
                );

              }
            )}

          </div>

        )}

      </InvitationSection>


      {/* ===============================================
          ACCEPTANCE FORM
      =============================================== */}

      <InvitationSection
        title="Accept invitation"
      >

        <div
          style={{
            color: "#94a3b8",
            fontSize: "14px",
            lineHeight: 1.5,
            marginBottom: "14px",
          }}
        >
          If you are creating a new account, enter
          your details below. Existing accounts can
          leave these fields blank.
        </div>


        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr",
            gap: "12px",
            marginBottom: "12px",
          }}
        >

          <Input
            label="First name"
            value={firstName}
            onChange={
              setFirstName
            }
            placeholder="First name"
          />

          <Input
            label="Last name"
            value={lastName}
            onChange={
              setLastName
            }
            placeholder="Last name"
          />

        </div>


        <Input
          label="Password"
          type="password"
          value={password}
          onChange={
            setPassword
          }
          placeholder="Leave blank if you already have an account"
        />


        {error && (

          <div
            style={{
              marginTop: "14px",
              padding: "12px",
              borderRadius: "8px",
              background:
                "rgba(127, 29, 29, 0.25)",
              border:
                "1px solid rgba(248, 113, 113, 0.35)",
              color: "#fecaca",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>

        )}


        <button
          type="button"
          disabled={
            accepting
          }
          onClick={
            handleAccept
          }
          style={{
            ...primaryButtonStyle,
            width: "100%",
            marginTop: "18px",
            opacity:
              accepting
                ? 0.6
                : 1,
            cursor:
              accepting
                ? "wait"
                : "pointer",
          }}
        >
          {accepting
            ? "Accepting invitation..."
            : "Accept invitation"}
        </button>

      </InvitationSection>


      <div
        style={{
          marginTop: "18px",
          color: "#64748b",
          fontSize: "12px",
          textAlign: "center",
        }}
      >
        Invitation links expire after their configured
        expiry period.
      </div>

    </InvitationShell>
  );

}


// =====================================================
// SHELL
// =====================================================

function InvitationShell({
  children,
}) {

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "48px 20px",
        background: "#020617",
        color: "#fff",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, sans-serif",
      }}
    >

      <div
        style={{
          width: "100%",
          maxWidth: "620px",
          boxSizing: "border-box",
        }}
      >

        {children}

      </div>

    </div>
  );

}


// =====================================================
// HEADER
// =====================================================

function InvitationHeader() {

  return (
    <div>

      <div
        style={{
          fontSize: "18px",
          fontWeight: 700,
          letterSpacing: "-0.02em",
        }}
      >
        Confo
      </div>

      <div
        style={{
          marginTop: "6px",
          color: "#64748b",
          fontSize: "13px",
        }}
      >
        Application platform
      </div>

    </div>
  );

}


// =====================================================
// SECTION
// =====================================================

function InvitationSection({
  title,
  children,
}) {

  return (
    <section
      style={{
        marginTop: "22px",
        padding: "18px",
        borderRadius: "12px",
        background:
          "rgba(15, 23, 42, 0.55)",
        border:
          "1px solid rgba(148, 163, 184, 0.12)",
      }}
    >

      <div
        style={{
          marginBottom: "12px",
          fontSize: "13px",
          fontWeight: 700,
          color: "#cbd5e1",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {title}
      </div>

      {children}

    </section>
  );

}


// =====================================================
// ACCESS ROW
// =====================================================

function AccessRow({
  label,
  value,
}) {

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "16px",
        fontSize: "14px",
      }}
    >

      <span
        style={{
          color: "#94a3b8",
        }}
      >
        {label}
      </span>

      <span
        style={{
          fontWeight: 600,
          color: "#e2e8f0",
          textTransform: "capitalize",
        }}
      >
        {value}
      </span>

    </div>
  );

}


// =====================================================
// INPUT
// =====================================================

function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
}) {

  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        fontSize: "13px",
        color: "#cbd5e1",
      }}
    >

      {label}

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        autoComplete={
          type === "password"
            ? "new-password"
            : "off"
        }
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "11px 12px",
          borderRadius: "8px",
          border:
            "1px solid rgba(148, 163, 184, 0.2)",
          background: "#0f172a",
          color: "#fff",
          outline: "none",
        }}
      />

    </label>
  );

}


// =====================================================
// BUTTON STYLES
// =====================================================

const primaryButtonStyle = {

  border: "none",

  borderRadius: "8px",

  padding:
    "12px 16px",

  background:
    "#2563eb",

  color:
    "#fff",

  fontWeight:
    600,

  fontSize:
    "14px",

  cursor:
    "pointer",

};


const secondaryButtonStyle = {

  marginTop:
    "18px",

  border:
    "1px solid rgba(148, 163, 184, 0.2)",

  borderRadius:
    "8px",

  padding:
    "11px 16px",

  background:
    "transparent",

  color:
    "#cbd5e1",

  fontWeight:
    600,

  fontSize:
    "14px",

  cursor:
    "pointer",

};
