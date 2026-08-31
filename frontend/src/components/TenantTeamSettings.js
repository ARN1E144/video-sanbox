import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../services/api";
import { useProjectContext } from "../context/ProjectContext";

const ROLE_OPTIONS = [
  {
    value: "admin",
    label: "Admin",
  },
  {
    value: "builder",
    label: "Builder",
  },
  {
    value: "member",
    label: "Member",
  },
];

const PROJECT_ROLE_OPTIONS = [
  {
    value: "admin",
    label: "Admin",
  },
  {
    value: "editor",
    label: "Editor",
  },
  {
    value: "viewer",
    label: "Viewer",
  },
];

export default function TenantTeamSettings() {
  const {
    projects = [],
  } = useProjectContext();

  const [
    members,
    setMembers,
  ] = useState([]);

  const [
    invitations,
    setInvitations,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    showInvite,
    setShowInvite,
  ] = useState(false);

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    tenantRole,
    setTenantRole,
  ] = useState("member");

  const [
    selectedProjects,
    setSelectedProjects,
  ] = useState({});

  const projectList =
    useMemo(
      () => projects || [],
      [projects]
    );

  async function loadTeam() {
  try {
    setLoading(true);
    setError("");

    const [
      teamResponse,
      invitationResponse,
    ] = await Promise.all([
      api.get("/data/members?limit=100"),
      api.get("/tenant/invitations"),
    ]);

    setMembers(
      teamResponse.data?.members || []
    );

    setInvitations(
      invitationResponse.data?.invitations || []
    );
  } catch (err) {
    console.error(
      "[TenantTeamSettings] LOAD TEAM FAILED",
      {
        message:
          err?.message,

        status:
          err?.response?.status,

        data:
          err?.response?.data,

        url:
          err?.config?.url,
      }
    );

    setError(
      err?.response?.data?.error ||
        `Failed to load team${
          err?.response?.status
            ? ` (${err.response.status})`
            : ""
        }`
    );
  } finally {
    setLoading(false);
  }
}

  useEffect(() => {
    loadTeam();
  }, []);

  function toggleProject(
    projectId
  ) {
    setSelectedProjects(
      previous => {
        const current =
          previous[projectId];

        if (current) {
          const copy = {
            ...previous,
          };

          delete copy[
            projectId
          ];

          return copy;
        }

        return {
          ...previous,

          [projectId]: {
            role: "viewer",
          },
        };
      }
    );
  }

  function setProjectRole(
    projectId,
    role
  ) {
    setSelectedProjects(
      previous => ({
        ...previous,

        [projectId]: {
          ...(previous[
            projectId
          ] || {}),
          role,
        },
      })
    );
  }

  async function handleInvite() {
    if (!email.trim()) {
      return;
    }

    try {
      setError("");

      const projectAssignments =
        Object.entries(
          selectedProjects
        ).map(
          ([
            projectId,
            config,
          ]) => ({
            projectId,
            role:
              config.role ||
              "viewer",
          })
        );

        console.log(
        "[TenantTeamSettings] SELECTED PROJECTS",
        selectedProjects
        );

        console.log(
        "[TenantTeamSettings] PROJECT ASSIGNMENTS",
        projectAssignments
        );

      const response =
        await api.post(
          "/tenant/invitations",
          {
            email:
              email.trim(),
            tenantRole,
            projects:
              projectAssignments,
          }
        );

      const devToken =
        response.data
          ?.devInviteToken;

      if (devToken) {
        console.log(
          "[TenantTeamSettings] DEV INVITE TOKEN:",
          devToken
        );

        window.alert(
          `Invitation created.\n\nDevelopment invite token:\n${devToken}`
        );
      }

      setEmail("");
      setTenantRole(
        "member"
      );
      setSelectedProjects(
        {}
      );
      setShowInvite(false);

      await loadTeam();
    } catch (err) {
      console.error(
        "[TenantTeamSettings] Invite failed",
        err
      );

      setError(
        err.response?.data?.error ||
          "Failed to invite user"
      );
    }
  }

  if (loading) {
    return (
      <div
        style={{
          padding: 24,
          color: "#aaa",
        }}
      >
        Loading team…
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 1100,
        color: "#fff",
        overflow: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
            }}
          >
            Team & Members
          </h2>

          <div
            style={{
              marginTop: 6,
              color: "#888",
            }}
          >
            Manage tenant members,
            roles and project access.
          </div>
        </div>

        <button
          onClick={() =>
            setShowInvite(
              previous =>
                !previous
            )
          }
          style={{
            padding:
              "10px 14px",
            borderRadius: 8,
            border:
              "1px solid #444",
            background:
              "#1f1f1f",
            color: "#fff",
            cursor:
              "pointer",
          }}
        >
          Invite member
        </button>
      </div>

      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            background:
              "#2b1515",
            border:
              "1px solid #5a2525",
            color: "#ff9b9b",
          }}
        >
          {error}
        </div>
      )}

      {showInvite && (
        <div
          style={{
            marginBottom: 24,
            padding: 20,
            border:
              "1px solid #292929",
            borderRadius: 12,
            background:
              "#151515",
          }}
        >
          <h3
            style={{
              marginTop: 0,
            }}
          >
            Invite a member
          </h3>

          <div
            style={{
              display: "grid",
              gap: 14,
            }}
          >
            <div>
              <label
                style={{
                  display:
                    "block",
                  marginBottom: 6,
                  color: "#aaa",
                }}
              >
                Email
              </label>

              <input
                value={email}
                onChange={e =>
                  setEmail(
                    e.target.value
                  )
                }
                placeholder="person@example.com"
                style={{
                  width: "100%",
                  boxSizing:
                    "border-box",
                  padding:
                    "10px 12px",
                  borderRadius: 8,
                  border:
                    "1px solid #333",
                  background:
                    "#0e0e0e",
                  color:
                    "#fff",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display:
                    "block",
                  marginBottom: 6,
                  color: "#aaa",
                }}
              >
                Tenant role
              </label>

              <select
                value={
                  tenantRole
                }
                onChange={e =>
                  setTenantRole(
                    e.target.value
                  )
                }
                style={{
                  width: "100%",
                  padding:
                    "10px 12px",
                  borderRadius: 8,
                  border:
                    "1px solid #333",
                  background:
                    "#0e0e0e",
                  color:
                    "#fff",
                }}
              >
                {ROLE_OPTIONS.map(
                  role => (
                    <option
                      key={
                        role.value
                      }
                      value={
                        role.value
                      }
                    >
                      {role.label}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <div
                style={{
                  marginBottom: 8,
                  color: "#aaa",
                }}
              >
                Project access
              </div>

              {projectList.length ===
              0 ? (
                <div
                  style={{
                    color: "#666",
                  }}
                >
                  No projects available.
                </div>
              ) : (
                projectList.map(
                  project => {
                    const id =
                      project._id ||
                      project.id;

                    const selected =
                      selectedProjects[
                        id
                      ];

                    return (
                      <div
                        key={id}
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: 10,
                          marginBottom: 8,
                          padding: 10,
                          borderRadius: 8,
                          background:
                            "#101010",
                          border:
                            "1px solid #222",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={
                            !!selected
                          }
                          onChange={() =>
                            toggleProject(
                              id
                            )
                          }
                        />

                        <div
                          style={{
                            flex: 1,
                          }}
                        >
                          {project.name}
                        </div>

                        {selected && (
                          <select
                            value={
                              selected.role ||
                              "viewer"
                            }
                            onChange={e =>
                              setProjectRole(
                                id,
                                e.target
                                  .value
                              )
                            }
                            style={{
                              padding:
                                "6px 8px",
                              borderRadius:
                                6,
                              background:
                                "#181818",
                              border:
                                "1px solid #333",
                              color:
                                "#fff",
                            }}
                          >
                            {PROJECT_ROLE_OPTIONS.map(
                              role => (
                                <option
                                  key={
                                    role.value
                                  }
                                  value={
                                    role.value
                                  }
                                >
                                  {
                                    role.label
                                  }
                                </option>
                              )
                            )}
                          </select>
                        )}
                      </div>
                    );
                  }
                )
              )}
            </div>

            <div
              style={{
                display:
                  "flex",
                gap: 8,
                justifyContent:
                  "flex-end",
              }}
            >
              <button
                onClick={() =>
                  setShowInvite(
                    false
                  )
                }
                style={{
                  padding:
                    "9px 13px",
                  borderRadius: 8,
                  border:
                    "1px solid #333",
                  background:
                    "#171717",
                  color:
                    "#aaa",
                }}
              >
                Cancel
              </button>

              <button
                onClick={
                  handleInvite
                }
                style={{
                  padding:
                    "9px 13px",
                  borderRadius: 8,
                  border:
                    "1px solid #444",
                  background:
                    "#2a2a2a",
                  color:
                    "#fff",
                }}
              >
                Create invitation
              </button>
            </div>
          </div>
        </div>
      )}

      <section
        style={{
            marginBottom: 32,
        }}
        >
        <h3>
            Members
        </h3>

        <div
            style={{
            border:
                "1px solid #292929",
            borderRadius: 10,
            overflow:
                "hidden",
            }}
        >
            {members.length === 0 ? (
            <div
                style={{
                padding: 16,
                color: "#666",
                }}
            >
                No members found.
            </div>
            ) : (
            members.map(
                member => (
                <div
                    key={member.id}
                    style={{
                    display:
                        "grid",
                    gridTemplateColumns:
                        "2fr 1fr 1fr",
                    gap: 16,
                    padding: 14,
                    borderBottom:
                        "1px solid #222",
                    alignItems:
                        "center",
                    }}
                >
                    {/* USER */}

                    <div>
                    <div
                        style={{
                        fontWeight:
                            500,
                        }}
                    >
                        {member.firstName || ""}
                        {" "}
                        {member.lastName || ""}
                    </div>

                    <div
                        style={{
                        color:
                            "#777",
                        fontSize:
                            13,
                        marginTop:
                            3,
                        }}
                    >
                        {member.email}
                    </div>
                    </div>

                    {/* ROLE */}

                    <div>
                    <span
                        style={{
                        padding:
                            "4px 8px",
                        borderRadius:
                            999,
                        background:
                            "#202020",
                        fontSize:
                            12,
                        }}
                    >
                        {member.role || "member"}
                    </span>
                    </div>

                    {/* AVAILABILITY */}

                    <div
                    style={{
                        color:
                        "#777",
                        fontSize:
                        13,
                    }}
                    >
                    {member.isAvailable
                        ? "Available"
                        : "Unavailable"}
                    </div>
                </div>
                )
            )
            )}
        </div>
        </section>

      <section>
        <h3>
          Pending invitations
        </h3>

        {invitations.length ===
        0 ? (
          <div
            style={{
              color: "#666",
            }}
          >
            No pending invitations.
          </div>
        ) : (
          invitations.map(
            invitation => (
              <div
                key={
                  invitation._id
                }
                style={{
                  padding: 12,
                  marginBottom: 8,
                  borderRadius: 8,
                  background:
                    "#151515",
                  border:
                    "1px solid #242424",
                }}
              >
                <strong>
                  {
                    invitation.email
                  }
                </strong>

                <div
                  style={{
                    marginTop: 4,
                    color:
                      "#777",
                    fontSize:
                      13,
                  }}
                >
                  Tenant role:{" "}
                  {
                    invitation.tenantRole
                  }
                </div>
              </div>
            )
          )
        )}
      </section>
    </div>
  );
}