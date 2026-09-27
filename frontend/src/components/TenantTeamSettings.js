import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../services/api";


// =====================================================
// ROLE OPTIONS
// =====================================================

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


// =====================================================
// HELPERS
// =====================================================

function normaliseEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}


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
    return normaliseId(
      value?._id ??
      value?.id ??
      value?.userId ??
      value?.projectId ??
      null
    );
  }

  return String(value);
}



function getProjectId(project) {

  if (
    !project
  ) {
    return null;
  }

  // =====================================================
  // PROJECT MEMBERSHIP RESPONSE
  // =====================================================
  //
  // GET /tenant/:tenantId/members/:userId/projects
  // returns:
  //
  // {
  //   id: "<ProjectMembership ID>",
  //   projectId: "<Project ID>",
  //   role: "editor"
  // }
  //
  // The projectId field MUST take precedence over id.
  //
  if (
    project?.projectId
  ) {

    if (
      typeof project.projectId === "object"
    ) {

      return (
        project.projectId._id ||
        project.projectId.id ||
        null
      );

    }

    return project.projectId;

  }

  // =====================================================
  // PROJECT OBJECT
  // =====================================================
  //
  // /projects/tenant returns actual Project objects
  // where id / _id represents the Project itself.
  //

  return (
    project?._id ||
    project?.id ||
    null
  );
}



function getOwnerDisplay(project) {

  const owner =
    project?.owner;

  if (!owner) {
    return "Unknown";
  }

  const ownerName = [
    owner.firstName,
    owner.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    ownerName ||
    owner.email ||
    "Unknown"
  );
}


function getInvitationProjectName(project) {

  if (!project) {
    return "Unknown project";
  }

  if (
    typeof project.projectId === "object" &&
    project.projectId
  ) {
    return (
      project.projectId.name ||
      "Unnamed project"
    );
  }

  return (
    project.name ||
    "Unnamed project"
  );
}


function getInvitationProjectRole(project) {
  return project?.role || "viewer";
}


function getInvitationProjectId(project) {

  if (!project) {
    return null;
  }

  if (
    typeof project.projectId === "object" &&
    project.projectId
  ) {
    return (
      project.projectId?._id ||
      project.projectId?.id ||
      null
    );
  }

  return project.projectId || null;
}


function getMemberEmail(member) {

  return normaliseEmail(
    member?.email
  );
}


function getMemberName(member) {

  return [
    member?.firstName,
    member?.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}


function getMemberUserId(member) {

  return (
    member?.userId ||
    member?.user?._id ||
    member?.user?.id ||
    member?.id ||
    member?._id ||
    null
  );
}


function getCurrentUserIdFromSession() {

  try {

    const raw =
      localStorage.getItem("vs_auth");

    if (!raw) {
      return null;
    }

    const session =
      JSON.parse(raw);

    return (
      session?.me?.userId ||
      session?.me?.id ||
      session?.me?._id ||
      session?.user?.userId ||
      session?.user?.id ||
      session?.user?._id ||
      session?.userId ||
      session?.id ||
      session?._id ||
      null
    );

  } catch (error) {

    console.error(
      "Failed to read current user ID from session:",
      error
    );

    return null;
  }
}


function getTenantIdFromSession() {

  try {

    const raw =
      localStorage.getItem("vs_auth");

    if (!raw) {
      return null;
    }

    const session =
      JSON.parse(raw);

    return (
      session?.me?.membership?.tenantId ||
      session?.membership?.tenantId ||
      session?.tenant?.id ||
      session?.tenantId ||
      null
    );

  } catch (error) {

    console.error(
      "Failed to read tenant ID from session:",
      error
    );

    return null;
  }
}


// =====================================================
// STYLES
// =====================================================

const styles = {

  page: {
    padding: 24,
    maxWidth: 1100,
    color: "#fff",
    overflow: "auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },

  title: {
    margin: 0,
  },

  subtitle: {
    marginTop: 6,
    color: "#888",
  },

  primaryButton: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #444",
    background: "#1f1f1f",
    color: "#fff",
    cursor: "pointer",
  },

  secondaryButton: {
    padding: "9px 13px",
    borderRadius: 8,
    border: "1px solid #333",
    background: "#171717",
    color: "#aaa",
    cursor: "pointer",
  },

  actionButton: {
    padding: "9px 13px",
    borderRadius: 8,
    border: "1px solid #444",
    background: "#2a2a2a",
    color: "#fff",
    cursor: "pointer",
  },

  dangerButton: {
    padding: "9px 13px",
    borderRadius: 8,
    border: "1px solid #5a2525",
    background: "#261515",
    color: "#ff9b9b",
    cursor: "pointer",
  },

  disabledButton: {
    opacity: 0.5,
    cursor: "not-allowed",
  },

  error: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    background: "#2b1515",
    border: "1px solid #5a2525",
    color: "#ff9b9b",
  },

  success: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 10,
    background: "#122016",
    border: "1px solid #24452d",
  },

  successTitle: {
    margin: 0,
    fontSize: 15,
  },

  successText: {
    marginTop: 6,
    color: "#9aaa9e",
    fontSize: 13,
  },

  inviteLink: {
    marginTop: 12,
    padding: "10px 12px",
    borderRadius: 7,
    background: "#0b0b0b",
    border: "1px solid #242424",
    color: "#bbb",
    fontSize: 12,
    wordBreak: "break-all",
  },

  inviteLinkActions: {
    display: "flex",
    gap: 8,
    marginTop: 10,
    flexWrap: "wrap",
  },

  panel: {
    marginBottom: 24,
    padding: 20,
    border: "1px solid #292929",
    borderRadius: 12,
    background: "#151515",
  },

  editPanel: {
    marginTop: 14,
    padding: 18,
    border: "1px solid #303030",
    borderRadius: 10,
    background: "#111",
  },

  panelTitle: {
    marginTop: 0,
    marginBottom: 18,
  },

  field: {
    display: "grid",
    gap: 6,
  },

  label: {
    display: "block",
    color: "#aaa",
    fontSize: 13,
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #333",
    background: "#0e0e0e",
    color: "#fff",
  },

  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #333",
    background: "#0e0e0e",
    color: "#fff",
  },

  projectSection: {
    marginTop: 4,
  },

  projectSectionLabel: {
    marginBottom: 8,
    color: "#aaa",
    fontSize: 13,
  },

  projectRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
    padding: 10,
    borderRadius: 8,
    background: "#101010",
    border: "1px solid #222",
  },

  projectInfo: {
    flex: 1,
    minWidth: 0,
  },

  projectName: {
    fontWeight: 500,
  },

  projectOwner: {
    marginTop: 3,
    color: "#666",
    fontSize: 12,
  },

  projectRoleSelect: {
    flexShrink: 0,
    padding: "6px 8px",
    borderRadius: 6,
    background: "#181818",
    border: "1px solid #333",
    color: "#fff",
  },

  formActions: {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    marginTop: 4,
  },

  section: {
    marginBottom: 32,
  },

  sectionTitle: {
    marginBottom: 12,
  },

  list: {
    border: "1px solid #292929",
    borderRadius: 10,
    overflow: "hidden",
  },

  empty: {
    padding: 16,
    color: "#666",
  },

  memberRow: {
    display: "grid",
    gridTemplateColumns:
      "2fr 1fr 1fr auto auto",
    gap: 16,
    padding: 14,
    borderBottom: "1px solid #222",
    alignItems: "center",
  },

  memberName: {
    fontWeight: 500,
  },

  memberEmail: {
    color: "#777",
    fontSize: 13,
    marginTop: 3,
  },

  roleBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: 999,
    background: "#202020",
    fontSize: 12,
  },

  availability: {
    color: "#777",
    fontSize: 13,
  },

  memberState: {
    color: "#777",
    fontSize: 12,
  },

  memberActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    flexWrap: "wrap",
  },

  invitation: {
    padding: 14,
    marginBottom: 8,
    borderRadius: 8,
    background: "#151515",
    border: "1px solid #242424",
  },

  invitationHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },

  invitationHeaderActions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  invitationEmail: {
    fontWeight: 600,
  },

  invitationMeta: {
    marginTop: 4,
    color: "#777",
    fontSize: 13,
  },

  invitationProjects: {
    marginTop: 12,
    display: "grid",
    gap: 6,
  },

  invitationProject: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: "7px 9px",
    borderRadius: 6,
    background: "#101010",
    border: "1px solid #202020",
    fontSize: 12,
  },

  invitationProjectName: {
    color: "#bbb",
  },

  invitationProjectRole: {
    color: "#777",
  },

  invitationDate: {
    marginTop: 10,
    color: "#555",
    fontSize: 12,
  },

  editNotice: {
    marginBottom: 14,
    color: "#777",
    fontSize: 12,
    lineHeight: 1.5,
  },

  editEmail: {
    marginBottom: 16,
    padding: "9px 11px",
    borderRadius: 7,
    background: "#0b0b0b",
    border: "1px solid #222",
    color: "#aaa",
    fontSize: 13,
  },

  statePanel: {
    marginBottom: 20,
    padding: 14,
    borderRadius: 9,
    background: "#101010",
    border: "1px solid #242424",
  },

  stateTitle: {
    fontWeight: 600,
    fontSize: 13,
  },

  stateText: {
    marginTop: 5,
    color: "#777",
    fontSize: 12,
    lineHeight: 1.5,
  },

};


// =====================================================
// COMPONENT
// =====================================================

export default function TenantTeamSettings() {

  // ===================================================
  // TEAM STATE
  // ===================================================

  const [
    members,
    setMembers,
  ] = useState([]);

  const [
    invitations,
    setInvitations,
  ] = useState([]);

  const [
    tenantProjects,
    setTenantProjects,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    inviting,
    setInviting,
  ] = useState(false);

  const [
    updatingInvitation,
    setUpdatingInvitation,
  ] = useState(false);

  const [
    removingMemberId,
    setRemovingMemberId,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState("");


  // ===================================================
  // INVITE FORM
  // ===================================================

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


  // ===================================================
  // CREATED INVITATION
  // ===================================================

  const [
    createdInvite,
    setCreatedInvite,
  ] = useState(null);

  const [
    copiedInvite,
    setCopiedInvite,
  ] = useState(false);


  // ===================================================
  // INVITATION EDITOR
  // ===================================================

  const [
    editingInvitation,
    setEditingInvitation,
  ] = useState(null);

  const [
    editTenantRole,
    setEditTenantRole,
  ] = useState("member");

  const [
    editProjects,
    setEditProjects,
  ] = useState({});


  // ===================================================
  // MEMBER ACCESS EDITOR
  // ===================================================

  const [
    editingMember,
    setEditingMember,
  ] = useState(null);

  const [
    editMemberTenantRole,
    setEditMemberTenantRole,
  ] = useState("member");

  const [
    editMemberProjects,
    setEditMemberProjects,
  ] = useState({});

  const [
    loadingMemberAccess,
    setLoadingMemberAccess,
  ] = useState(false);

  const [
    updatingMember,
    setUpdatingMember,
  ] = useState(false);


  // ===================================================
  // CURRENT USER
  // ===================================================

  const currentUserId =
    useMemo(
      () =>
        normaliseId(
          getCurrentUserIdFromSession()
        ),
      []
    );


  // ===================================================
  // EMAIL RELATIONSHIP
  // ===================================================

  const emailRelationship =
    useMemo(() => {

      const normalised =
        normaliseEmail(email);

      if (!normalised) {

        return {
          type: "empty",
          member: null,
          invitation: null,
        };

      }


      const invitation =
        invitations.find(
          item =>
            normaliseEmail(
              item?.email
            ) === normalised
        );

      if (invitation) {

        return {
          type: "pending",
          member: null,
          invitation,
        };

      }


      const member =
        members.find(
          item =>
            getMemberEmail(item) ===
            normalised
        );

      if (member) {

        return {
          type: "member",
          member,
          invitation: null,
        };

      }


      return {
        type: "new",
        member: null,
        invitation: null,
      };

    }, [
      email,
      invitations,
      members,
    ]);


  // ===================================================
  // LOAD TEAM
  // ===================================================

  async function loadTeam(
    options = {}
  ) {

    const {
      initial = false,
    } = options;

    if (initial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {

      setError("");

      const [
        teamResponse,
        invitationResponse,
        projectResponse,
      ] = await Promise.all([
        api.get(
          "/data/members?limit=100"
        ),
        api.get(
          "/tenant/invitations"
        ),
        api.get(
          "/projects/tenant"
        ),
      ]);

      const nextMembers =
        teamResponse.data?.members || [];

      const nextInvitations =
        invitationResponse.data?.invitations ||
        [];

      const nextProjects =
        projectResponse.data?.projects ||
        [];

      setMembers(
        nextMembers
      );

      setInvitations(
        nextInvitations
      );

      setTenantProjects(
        nextProjects
      );

      return {
        members: nextMembers,
        invitations: nextInvitations,
        projects: nextProjects,
      };

    } catch (requestError) {

      console.error(
        "Failed to load team:",
        requestError
      );

      setError(
        requestError?.response?.data?.error ||
        requestError?.response?.data?.message ||
        requestError?.message ||
        "Failed to load team."
      );

      return {
        members: [],
        invitations: [],
        projects: [],
      };

    } finally {

      if (initial) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }

    }

  }


  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {

    loadTeam({
      initial: true,
    });

  }, []);


  // ===================================================
  // PROJECT ASSIGNMENTS
  // ===================================================

  function buildProjectAssignments(
    projectState
  ) {

    return Object.entries(
      projectState || {}
    )
      .filter(
        ([, value]) =>
          value?.selected
      )
      .map(
        ([projectId, value]) => ({
          projectId,
          role:
            value?.role ||
            "viewer",
        })
      );

  }


  function toggleProject(
    projectId,
    setter
  ) {

    setter(
      previous => ({
        ...previous,

        [projectId]: {
          selected:
            !(
              previous?.[projectId]?.selected
            ),

          role:
            previous?.[projectId]?.role ||
            "viewer",
        },
      })
    );

  }


  function setProjectRole(
    projectId,
    role,
    setter
  ) {

    setter(
      previous => ({
        ...previous,

        [projectId]: {
          selected:
            previous?.[projectId]?.selected ||
            false,

          role,
        },
      })
    );

  }


  // ===================================================
  // INVITE FORM RESET
  // ===================================================

  function resetInviteFields() {

    setEmail("");
    setTenantRole("member");
    setSelectedProjects({});

  }


  function clearCreatedInvite() {

    setCreatedInvite(null);
    setCopiedInvite(false);

  }


  function resetInviteForm() {

    resetInviteFields();
    clearCreatedInvite();

  }


  function openInvite() {

    setError("");
    clearCreatedInvite();
    setShowInvite(true);

  }


  function closeInvite() {

    if (inviting) {
      return;
    }

    setShowInvite(false);
    resetInviteFields();

  }


  // ===================================================
  // INVITE MEMBER
  // ===================================================

  async function handleInvite() {

    const normalisedEmail =
      normaliseEmail(email);

    if (!normalisedEmail) {

      setError(
        "Please enter an email address."
      );

      return;
    }


    // -------------------------------------------------
    // Existing pending invitation
    // -------------------------------------------------

    if (
      emailRelationship.type ===
      "pending"
    ) {

      startEditingInvitation(
        emailRelationship.invitation
      );

      return;
    }


    // -------------------------------------------------
    // Existing member
    // -------------------------------------------------

    if (
      emailRelationship.type ===
      "member"
    ) {

      await handleManageMember(
        emailRelationship.member
      );

      return;
    }


    try {

      setInviting(true);
      setError("");

      const projects =
        buildProjectAssignments(
          selectedProjects
        );

      const response =
        await api.post(
          "/tenant/invitations",
          {
            email:
              normalisedEmail,

            tenantRole,

            projects,
          }
        );

      const invitation =
        response.data?.invitation ||
        response.data ||
        null;

      let inviteLink =
        response.data?.inviteLink ||
        response.data?.url ||
        null;

      const devInviteToken =
        response.data?.devInviteToken ||
        invitation?.devInviteToken ||
        null;


      // -------------------------------------------------
      // Development invite-token fallback
      // -------------------------------------------------

      if (
        !inviteLink &&
        devInviteToken
      ) {

        inviteLink =
          `${window.location.origin}/?invite=${encodeURIComponent(
            devInviteToken
          )}`;

      }


      // -------------------------------------------------
      // Preserve the generated invitation.
      //
      // IMPORTANT:
      // Do NOT call resetInviteForm() here because that
      // clears createdInvite immediately.
      // -------------------------------------------------

      setCreatedInvite({
        invitation,
        inviteLink,
        devInviteToken,
      });

      setCopiedInvite(false);

      resetInviteFields();

      await loadTeam();

    } catch (requestError) {

      console.error(
        "Failed to create invitation:",
        requestError
      );

      const status =
        requestError?.response?.status;


      // ------------------------------------------------
      // Backend duplicate protection
      // ------------------------------------------------

      if (status === 409) {

        const refreshed =
          await loadTeam();

        const duplicateInvitation =
          refreshed.invitations.find(
            item =>
              normaliseEmail(
                item?.email
              ) === normalisedEmail
          );

        if (duplicateInvitation) {

          setError("");

          startEditingInvitation(
            duplicateInvitation
          );

          return;
        }

      }


      setError(
        requestError?.response?.data?.error ||
        requestError?.response?.data?.message ||
        requestError?.message ||
        "Failed to create invitation."
      );

    } finally {

      setInviting(false);

    }

  }


  // ===================================================
  // INVITATION EDITOR
  // ===================================================

  function startEditingInvitation(
    invitation
  ) {

    setError("");
    setShowInvite(false);

    setEditingInvitation(
      invitation
    );

    setEditTenantRole(
      invitation?.tenantRole ||
      "member"
    );

    const nextProjects = {};

    (
      invitation?.projects ||
      []
    ).forEach(
      project => {

        const projectId =
          getInvitationProjectId(
            project
          );

        if (!projectId) {
          return;
        }

        nextProjects[projectId] = {
          selected: true,
          role:
            getInvitationProjectRole(
              project
            ),
        };

      }
    );

    setEditProjects(
      nextProjects
    );

  }


  function cancelEditingInvitation() {

    if (updatingInvitation) {
      return;
    }

    setEditingInvitation(null);
    setEditTenantRole("member");
    setEditProjects({});

  }


  function buildEditProjectAssignments() {

    return buildProjectAssignments(
      editProjects
    );

  }


  async function handleUpdateInvitation() {

    if (!editingInvitation?._id) {
      return;
    }

    try {

      setUpdatingInvitation(true);
      setError("");

      await api.patch(
        `/tenant/invitations/${editingInvitation._id}`,
        {
          tenantRole:
            editTenantRole,

          projects:
            buildEditProjectAssignments(),
        }
      );

      await loadTeam();

      cancelEditingInvitation();

    } catch (requestError) {

      console.error(
        "Failed to update invitation:",
        requestError
      );

      setError(
        requestError?.response?.data?.error ||
        requestError?.response?.data?.message ||
        requestError?.message ||
        "Failed to update invitation."
      );

    } finally {

      setUpdatingInvitation(false);

    }

  }


  async function handleRevokeInvitation(
    invitation
  ) {

    if (!invitation?._id) {
      return;
    }

    const confirmed =
      window.confirm(
        `Revoke the invitation for ${invitation.email}?`
      );

    if (!confirmed) {
      return;
    }

    try {

      setError("");

      await api.delete(
        `/tenant/invitations/${invitation._id}`
      );

      if (
        editingInvitation?._id ===
        invitation._id
      ) {
        cancelEditingInvitation();
      }

      await loadTeam();

    } catch (requestError) {

      console.error(
        "Failed to revoke invitation:",
        requestError
      );

      setError(
        requestError?.response?.data?.error ||
        requestError?.response?.data?.message ||
        requestError?.message ||
        "Failed to revoke invitation."
      );

    }

  }


  // ===================================================
  // MEMBER ACCESS
  // ===================================================

  async function handleManageMember(
    member
  ) {

    if (!member) {
      return;
    }

    const userId =
      getMemberUserId(member);

    if (!userId) {

      setError(
        "Unable to determine this member's user ID."
      );

      return;
    }

    const tenantId =
      getTenantIdFromSession();

    if (!tenantId) {

      setError(
        "Unable to determine the current tenant."
      );

      return;
    }

    try {

      setLoadingMemberAccess(true);
      setError("");

      const response =
        await api.get(
          `/tenant/${tenantId}/members/${userId}/projects`
        );

      const data =
        response.data || {};


      setEditingMember(
        member
      );

      setEditMemberTenantRole(
        data?.role ||
        member?.role ||
        "member"
      );

      const nextProjects = {};

      const returnedProjects =
        data?.projects ||
        data?.projectMemberships ||
        [];

      returnedProjects.forEach(
        project => {

          const projectId =
            getProjectId(project);

          if (!projectId) {
            return;
          }

          const role =
            project?.role ||
            project?.membership?.role ||
            "viewer";

          nextProjects[projectId] = {
            selected: true,
            role,
          };

        }
      );

      setEditMemberProjects(
        nextProjects
      );

    } catch (requestError) {

      console.error(
        "Failed to load member access:",
        requestError
      );

      setError(
        requestError?.response?.data?.error ||
        requestError?.response?.data?.message ||
        requestError?.message ||
        "Failed to load member access."
      );

    } finally {

      setLoadingMemberAccess(false);

    }

  }


  function cancelEditingMember() {

    if (updatingMember) {
      return;
    }

    setEditingMember(null);
    setEditMemberTenantRole("member");
    setEditMemberProjects({});

  }


  async function handleUpdateMember() {

    if (!editingMember) {
      return;
    }

    const userId =
      getMemberUserId(
        editingMember
      );

    const tenantId =
      getTenantIdFromSession();

    if (!userId || !tenantId) {

      setError(
        "Unable to determine the member or tenant."
      );

      return;
    }

    const isTenantOwner =
      editingMember?.role ===
      "owner";

    try {

      setUpdatingMember(true);
      setError("");


      // -------------------------------------------------
      // Tenant role
      //
      // Owner role is protected.
      // -------------------------------------------------

      if (!isTenantOwner) {

        await api.patch(
          `/tenant/${tenantId}/members/${userId}/role`,
          {
            role:
              editMemberTenantRole,
          }
        );

      }


      // -------------------------------------------------
      // Project access
      // -------------------------------------------------

      console.log( "[TeamSettings] Saving member project access", 
        { editMemberProjects, 
          assignments: buildProjectAssignments( editMemberProjects ), } );

      await api.patch(
        `/tenant/${tenantId}/members/${userId}/projects`,
        {
          projects:
            buildProjectAssignments(
              editMemberProjects
            ),
        }
      );


      await loadTeam();

      cancelEditingMember();

    } catch (requestError) {

      console.error(
        "Failed to update member access:",
        requestError
      );

      setError(
        requestError?.response?.data?.error ||
        requestError?.response?.data?.message ||
        requestError?.message ||
        "Failed to update member access."
      );

    } finally {

      setUpdatingMember(false);

    }

  }


  // ===================================================
  // REMOVE MEMBER
  // ===================================================

  async function handleRemoveMember(
    member
  ) {

    if (!member) {
      return;
    }

    const userId =
      getMemberUserId(member);

    if (!userId) {

      setError(
        "Unable to determine this member's user ID."
      );

      return;
    }

    const normalisedUserId =
      normaliseId(userId);

    const isOwner =
      member?.role ===
      "owner";

    const isCurrentUser =
      normalisedUserId ===
      currentUserId;


    // -------------------------------------------------
    // Owner protection
    // -------------------------------------------------

    if (isOwner) {

      setError(
        "The tenant owner cannot be removed."
      );

      return;
    }


    // -------------------------------------------------
    // Self-removal protection
    // -------------------------------------------------

    if (isCurrentUser) {

      setError(
        "You cannot remove yourself from the tenant."
      );

      return;
    }


    const displayName =
      getMemberName(member) ||
      getMemberEmail(member) ||
      "this member";

    const confirmed =
      window.confirm(
        `Remove ${displayName} from this tenant?\n\nThis will remove their tenant membership and non-owner project access. Their global user account will not be deleted.`
      );

    if (!confirmed) {
      return;
    }


    const tenantId =
      getTenantIdFromSession();

    if (!tenantId) {

      setError(
        "Unable to determine the current tenant."
      );

      return;
    }


    try {

      setRemovingMemberId(
        normalisedUserId
      );

      setError("");


      await api.delete(
        `/tenant/${tenantId}/members/${userId}`
      );


      // -------------------------------------------------
      // If the removed member was being edited,
      // close the editor.
      // -------------------------------------------------

      if (
        editingMember &&
        normaliseId(
          getMemberUserId(
            editingMember
          )
        ) === normalisedUserId
      ) {

        setEditingMember(null);
        setEditMemberTenantRole("member");
        setEditMemberProjects({});

      }


      await loadTeam();

    } catch (requestError) {

      console.error(
        "Failed to remove member:",
        requestError
      );

      setError(
        requestError?.response?.data?.error ||
        requestError?.response?.data?.message ||
        requestError?.message ||
        "Failed to remove member."
      );

    } finally {

      setRemovingMemberId(null);

    }

  }


  // ===================================================
  // COPY INVITE LINK
  // ===================================================

  async function handleCopyInviteLink() {

    if (!createdInvite?.inviteLink) {
      return;
    }

    try {

      await navigator.clipboard.writeText(
        createdInvite.inviteLink
      );

      setCopiedInvite(true);

      window.setTimeout(
        () => {
          setCopiedInvite(false);
        },
        2000
      );

    } catch (copyError) {

      console.error(
        "Failed to copy invite link:",
        copyError
      );

      setError(
        "Failed to copy the invitation link."
      );

    }

  }


  // ===================================================
  // RENDER
  // ===================================================

  if (loading) {

    return (
      <div style={styles.page}>

        <div style={styles.statePanel}>

          <div style={styles.stateTitle}>
            Loading team...
          </div>

          <div style={styles.stateText}>
            Loading members, invitations and project access.
          </div>

        </div>

      </div>
    );

  }


  return (
    <div style={styles.page}>

      {/* =================================================
          HEADER
      ================================================= */}

      <div style={styles.header}>

        <div>

          <h2 style={styles.title}>
            Team & Members
          </h2>

          <div style={styles.subtitle}>
            Manage tenant members, roles and project access.
          </div>

        </div>


        <button
          type="button"
          style={styles.primaryButton}
          onClick={openInvite}
        >
          Invite member
        </button>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}


      {/* =================================================
          CREATED INVITATION
      ================================================= */}

      {createdInvite && (
        <div style={styles.success}>

          <h3 style={styles.successTitle}>
            Invitation created
          </h3>

          <div style={styles.successText}>
            The invitation has been created successfully.
          </div>

          {createdInvite.inviteLink && (
            <>
              <div style={styles.inviteLink}>
                {createdInvite.inviteLink}
              </div>

              <div style={styles.inviteLinkActions}>

                <button
                  type="button"
                  style={styles.actionButton}
                  onClick={
                    handleCopyInviteLink
                  }
                >
                  {copiedInvite
                    ? "Copied"
                    : "Copy invite link"}
                </button>

              </div>
            </>
          )}

        </div>
      )}


      {/* =================================================
          INVITE MEMBER
      ================================================= */}

      {showInvite && (
        <div style={styles.panel}>

          <h3 style={styles.panelTitle}>
            Invite a member
          </h3>


          <div
            style={{
              display: "grid",
              gap: 16,
            }}
          >

            <div style={styles.field}>

              <label style={styles.label}>
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={
                  event =>
                    setEmail(
                      event.target.value
                    )
                }
                placeholder="person@example.com"
                style={styles.input}
                disabled={inviting}
              />

            </div>


            {/* =========================================
                EXISTING MEMBER
            ========================================= */}

            {emailRelationship.type ===
              "member" && (
              <div style={styles.statePanel}>

                <div style={styles.stateTitle}>
                  User is already a tenant member
                </div>

                <div style={styles.stateText}>
                  This user already belongs to the tenant.
                  Manage their existing access instead of
                  creating another invitation.
                </div>

                <div
                  style={{
                    marginTop: 12,
                  }}
                >

                  <button
                    type="button"
                    style={styles.actionButton}
                    onClick={() =>
                      handleManageMember(
                        emailRelationship.member
                      )
                    }
                    disabled={
                      loadingMemberAccess
                    }
                  >
                    {loadingMemberAccess
                      ? "Loading access..."
                      : "Manage member access"}
                  </button>

                </div>

              </div>
            )}


            {/* =========================================
                PENDING INVITATION
            ========================================= */}

            {emailRelationship.type ===
              "pending" && (
              <div style={styles.statePanel}>

                <div style={styles.stateTitle}>
                  Invitation already pending
                </div>

                <div style={styles.stateText}>
                  An invitation already exists for this
                  email address. Edit the pending invitation
                  instead of creating another one.
                </div>

                <div
                  style={{
                    marginTop: 12,
                  }}
                >

                  <button
                    type="button"
                    style={styles.actionButton}
                    onClick={() =>
                      startEditingInvitation(
                        emailRelationship.invitation
                      )
                    }
                  >
                    Edit pending invitation
                  </button>

                </div>

              </div>
            )}


            {/* =========================================
                NEW USER INVITATION FORM
            ========================================= */}

            {(
              emailRelationship.type ===
              "new" ||
              emailRelationship.type ===
              "empty"
            ) && (
              <>

                <div style={styles.field}>

                  <label style={styles.label}>
                    Tenant role
                  </label>

                  <select
                    value={tenantRole}
                    onChange={
                      event =>
                        setTenantRole(
                          event.target.value
                        )
                    }
                    style={styles.select}
                    disabled={inviting}
                  >

                    {ROLE_OPTIONS.map(
                      option => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      )
                    )}

                  </select>

                </div>


                <div
                  style={
                    styles.projectSection
                  }
                >

                  <div
                    style={
                      styles.projectSectionLabel
                    }
                  >
                    Project access
                  </div>


                  {tenantProjects.length === 0 ? (

                    <div
                      style={styles.empty}
                    >
                      No tenant projects available.
                    </div>

                  ) : (

                    tenantProjects.map(
                      project => {

                        const projectId =
                          getProjectId(
                            project
                          );

                        if (!projectId) {
                          return null;
                        }

                        const projectState =
                          selectedProjects?.[
                            projectId
                          ] || {};

                        return (
                          <div
                            key={projectId}
                            style={
                              styles.projectRow
                            }
                          >

                            <input
                              type="checkbox"
                              checked={
                                !!projectState.selected
                              }
                              onChange={() =>
                                toggleProject(
                                  projectId,
                                  setSelectedProjects
                                )
                              }
                              disabled={
                                inviting
                              }
                            />

                            <div
                              style={
                                styles.projectInfo
                              }
                            >

                              <div
                                style={
                                  styles.projectName
                                }
                              >
                                {
                                  project?.name ||
                                  "Unnamed project"
                                }
                              </div>

                              <div
                                style={
                                  styles.projectOwner
                                }
                              >
                                Owner:{" "}
                                {getOwnerDisplay(
                                  project
                                )}
                              </div>

                            </div>


                            {projectState.selected && (
                              <select
                                value={
                                  projectState.role ||
                                  "viewer"
                                }
                                onChange={
                                  event =>
                                    setProjectRole(
                                      projectId,
                                      event.target.value,
                                      setSelectedProjects
                                    )
                                }
                                style={
                                  styles.projectRoleSelect
                                }
                                disabled={
                                  inviting
                                }
                              >

                                {PROJECT_ROLE_OPTIONS.map(
                                  option => (
                                    <option
                                      key={
                                        option.value
                                      }
                                      value={
                                        option.value
                                      }
                                    >
                                      {option.label}
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


                <div style={styles.formActions}>

                  <button
                    type="button"
                    style={styles.secondaryButton}
                    onClick={closeInvite}
                    disabled={inviting}
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    style={{
                      ...styles.primaryButton,
                      ...(inviting
                        ? styles.disabledButton
                        : {}),
                    }}
                    onClick={
                      handleInvite
                    }
                    disabled={
                      inviting ||
                      !normaliseEmail(email)
                    }
                  >
                    {inviting
                      ? "Sending..."
                      : "Send invitation"}
                  </button>

                </div>

              </>
            )}

          </div>

        </div>
      )}


      {/* =================================================
          MEMBER ACCESS EDITOR
      ================================================= */}

      {editingMember && (
        <div style={styles.panel}>

          <h3 style={styles.panelTitle}>
            Manage member access
          </h3>


          <div style={styles.editNotice}>

            {editingMember?.role ===
            "owner"
              ? "The tenant owner cannot have their tenant role modified here, but their project access can still be managed."
              : "Manage this member's tenant role and project access."}

          </div>


          <div style={styles.editEmail}>

            <strong>
              {getMemberName(
                editingMember
              ) || "Unnamed member"}
            </strong>

            {" · "}

            {getMemberEmail(
              editingMember
            )}

          </div>


          {loadingMemberAccess ? (

            <div style={styles.statePanel}>

              <div style={styles.stateTitle}>
                Loading member access...
              </div>

              <div style={styles.stateText}>
                Loading tenant role and project memberships.
              </div>

            </div>

          ) : (

            <div
              style={{
                display: "grid",
                gap: 18,
              }}
            >

              {/* =======================================
                  TENANT ROLE
              ======================================= */}

              <div style={styles.field}>

                <label style={styles.label}>
                  Tenant role
                </label>

                <select
                  value={
                    editMemberTenantRole
                  }
                  onChange={
                    event =>
                      setEditMemberTenantRole(
                        event.target.value
                      )
                  }
                  style={styles.select}
                  disabled={
                    updatingMember ||
                    editingMember?.role ===
                      "owner"
                  }
                >

                  {editingMember?.role ===
                    "owner" && (
                    <option value="owner">
                      Owner
                    </option>
                  )}

                  {ROLE_OPTIONS.map(
                    option => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    )
                  )}

                </select>

                {editingMember?.role ===
                  "owner" && (
                  <div
                    style={{
                      color: "#666",
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    Owner role is protected.
                  </div>
                )}

              </div>


              {/* =======================================
                  PROJECT ACCESS
              ======================================= */}

              <div
                style={
                  styles.projectSection
                }
              >

                <div
                  style={
                    styles.projectSectionLabel
                  }
                >
                  Project access
                </div>


                {tenantProjects.length ===
                0 ? (

                  <div
                    style={styles.empty}
                  >
                    No tenant projects available.
                  </div>

                ) : (

                  tenantProjects.map(
                    project => {

                      const projectId =
                        getProjectId(
                          project
                        );

                      if (!projectId) {
                        return null;
                      }

                      const projectState =
                        editMemberProjects?.[
                          projectId
                        ] || {};

                      return (
                        <div
                          key={projectId}
                          style={
                            styles.projectRow
                          }
                        >

                          <input
                            type="checkbox"
                            checked={
                              !!projectState.selected
                            }
                            onChange={() =>
                              toggleProject(
                                projectId,
                                setEditMemberProjects
                              )
                            }
                            disabled={
                              updatingMember
                            }
                          />


                          <div
                            style={
                              styles.projectInfo
                            }
                          >

                            <div
                              style={
                                styles.projectName
                              }
                            >
                              {
                                project?.name ||
                                "Unnamed project"
                              }
                            </div>

                            <div
                              style={
                                styles.projectOwner
                              }
                            >
                              Owner:{" "}
                              {getOwnerDisplay(
                                project
                              )}
                            </div>

                          </div>


                          {projectState.selected && (
                            <select
                              value={
                                projectState.role ||
                                "viewer"
                              }
                              onChange={
                                event =>
                                  setProjectRole(
                                    projectId,
                                    event.target.value,
                                    setEditMemberProjects
                                  )
                              }
                              style={
                                styles.projectRoleSelect
                              }
                              disabled={
                                updatingMember
                              }
                            >

                              {PROJECT_ROLE_OPTIONS.map(
                                option => (
                                  <option
                                    key={
                                      option.value
                                    }
                                    value={
                                      option.value
                                    }
                                  >
                                    {option.label}
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


              {/* =======================================
                  ACTIONS
              ======================================= */}

              <div
                style={
                  styles.formActions
                }
              >

                <button
                  type="button"
                  style={
                    styles.secondaryButton
                  }
                  onClick={
                    cancelEditingMember
                  }
                  disabled={
                    updatingMember
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  style={{
                    ...styles.primaryButton,
                    ...(updatingMember
                      ? styles.disabledButton
                      : {}),
                  }}
                  onClick={
                    handleUpdateMember
                  }
                  disabled={
                    updatingMember
                  }
                >
                  {updatingMember
                    ? "Saving..."
                    : "Save changes"}
                </button>

              </div>

            </div>

          )}

        </div>
      )}


      {/* =================================================
          MEMBERS
      ================================================= */}

      <section style={styles.section}>

        <h3 style={styles.sectionTitle}>
          Members
        </h3>


        <div style={styles.list}>

          {members.length === 0 ? (

            <div style={styles.empty}>
              No members found.
            </div>

          ) : (

            members.map(
              member => {

                const userId =
                  getMemberUserId(
                    member
                  );

                const normalisedUserId =
                  normaliseId(userId);

                const isOwner =
                  member?.role ===
                  "owner";

                const isCurrentUser =
                  normalisedUserId ===
                  currentUserId;

                const isRemoving =
                  removingMemberId ===
                  normalisedUserId;

                const name =
                  getMemberName(
                    member
                  ) ||
                  member?.email ||
                  "Unnamed member";

                const canRemove =
                  !isOwner &&
                  !isCurrentUser &&
                  !!userId;


                return (
                  <div
                    key={
                      normalisedUserId ||
                      member?.email
                    }
                    style={
                      styles.memberRow
                    }
                  >

                    <div>

                      <div
                        style={
                          styles.memberName
                        }
                      >
                        {name}
                      </div>

                      <div
                        style={
                          styles.memberEmail
                        }
                      >
                        {
                          getMemberEmail(
                            member
                          )
                        }
                      </div>

                    </div>


                    <div>

                      <span
                        style={
                          styles.roleBadge
                        }
                      >
                        {member?.role ||
                          "member"}
                      </span>

                    </div>


                    <div
                      style={
                        styles.availability
                      }
                    >
                      {member?.isAvailable
                        ? "Available"
                        : "Unavailable"}
                    </div>


                    <div
                      style={
                        styles.memberState
                      }
                    >
                      {isOwner
                        ? "Tenant owner"
                        : isCurrentUser
                          ? "You"
                          : ""}
                    </div>


                    <div
                      style={
                        styles.memberActions
                      }
                    >

                      <button
                        type="button"
                        style={
                          styles.actionButton
                        }
                        onClick={() =>
                          handleManageMember(
                            member
                          )
                        }
                        disabled={
                          loadingMemberAccess ||
                          isRemoving
                        }
                      >
                        {loadingMemberAccess &&
                        editingMember &&
                        normaliseId(
                          getMemberUserId(
                            editingMember
                          )
                        ) ===
                          normalisedUserId
                          ? "Loading..."
                          : "Manage access"}
                      </button>


                      {canRemove && (
                        <button
                          type="button"
                          style={{
                            ...styles.dangerButton,
                            ...(isRemoving
                              ? styles.disabledButton
                              : {}),
                          }}
                          onClick={() =>
                            handleRemoveMember(
                              member
                            )
                          }
                          disabled={
                            isRemoving ||
                            !!removingMemberId
                          }
                        >
                          {isRemoving
                            ? "Removing..."
                            : "Remove"}
                        </button>
                      )}

                    </div>

                  </div>
                );

              }
            )

          )}

        </div>

      </section>


      {/* =================================================
          PENDING INVITATIONS
      ================================================= */}

      <section style={styles.section}>

        <h3 style={styles.sectionTitle}>
          Pending invitations
        </h3>


        <div style={styles.list}>

          {invitations.length === 0 ? (

            <div style={styles.empty}>
              No pending invitations.
            </div>

          ) : (

            invitations.map(
              invitation => {

                const isEditing =
                  editingInvitation?._id ===
                  invitation?._id;

                return (
                  <div
                    key={
                      invitation?._id
                    }
                    style={
                      styles.invitation
                    }
                  >

                    <div
                      style={
                        styles.invitationHeader
                      }
                    >

                      <div>

                        <div
                          style={
                            styles.invitationEmail
                          }
                        >
                          {
                            invitation?.email
                          }
                        </div>

                        <div
                          style={
                            styles.invitationMeta
                          }
                        >
                          Tenant role:{" "}
                          {
                            invitation?.tenantRole ||
                            "member"
                          }
                        </div>

                      </div>


                      <div
                        style={
                          styles.invitationHeaderActions
                        }
                      >

                        <button
                          type="button"
                          style={
                            styles.actionButton
                          }
                          onClick={() =>
                            startEditingInvitation(
                              invitation
                            )
                          }
                          disabled={
                            updatingInvitation
                          }
                        >
                          Edit access
                        </button>


                        <button
                          type="button"
                          style={
                            styles.dangerButton
                          }
                          onClick={() =>
                            handleRevokeInvitation(
                              invitation
                            )
                          }
                          disabled={
                            updatingInvitation
                          }
                        >
                          Revoke
                        </button>

                      </div>

                    </div>


                    {/* =================================
                        INVITATION PROJECTS
                    ================================= */}

                    {(
                      invitation?.projects ||
                      []
                    ).length > 0 && (

                      <div
                        style={
                          styles.invitationProjects
                        }
                      >

                        {(
                          invitation.projects ||
                          []
                        ).map(
                          (
                            project,
                            projectIndex
                          ) => {

                            const projectId =
                              getInvitationProjectId(
                                project
                              );

                            const projectKey =
                              projectId ||
                              `${invitation?._id || "invitation"}-${projectIndex}`;

                            return (
                              <div
                                key={
                                  projectKey
                                }
                                style={
                                  styles.invitationProject
                                }
                              >

                                <span
                                  style={
                                    styles.invitationProjectName
                                  }
                                >
                                  {
                                    getInvitationProjectName(
                                      project
                                    )
                                  }
                                </span>

                                <span
                                  style={
                                    styles.invitationProjectRole
                                  }
                                >
                                  {
                                    getInvitationProjectRole(
                                      project
                                    )
                                  }
                                </span>

                              </div>
                            );

                          }
                        )}

                      </div>

                    )}


                    {invitation?.createdAt && (
                      <div
                        style={
                          styles.invitationDate
                        }
                      >
                        Created{" "}
                        {new Date(
                          invitation.createdAt
                        ).toLocaleString()}
                      </div>
                    )}


                    {/* =================================
                        INVITATION EDIT PANEL
                    ================================= */}

                    {isEditing && (

                      <div
                        style={
                          styles.editPanel
                        }
                      >

                        <h4
                          style={{
                            marginTop: 0,
                            marginBottom: 14,
                          }}
                        >
                          Edit invitation access
                        </h4>


                        <div
                          style={
                            styles.editNotice
                          }
                        >
                          Change the pending invitation's
                          tenant role and project access.
                        </div>


                        <div
                          style={
                            styles.editEmail
                          }
                        >
                          {
                            invitation?.email
                          }
                        </div>


                        <div
                          style={{
                            display: "grid",
                            gap: 18,
                          }}
                        >

                          <div
                            style={
                              styles.field
                            }
                          >

                            <label
                              style={
                                styles.label
                              }
                            >
                              Tenant role
                            </label>

                            <select
                              value={
                                editTenantRole
                              }
                              onChange={
                                event =>
                                  setEditTenantRole(
                                    event.target.value
                                  )
                              }
                              style={
                                styles.select
                              }
                              disabled={
                                updatingInvitation
                              }
                            >

                              {ROLE_OPTIONS.map(
                                option => (
                                  <option
                                    key={
                                      option.value
                                    }
                                    value={
                                      option.value
                                    }
                                  >
                                    {
                                      option.label
                                    }
                                  </option>
                                )
                              )}

                            </select>

                          </div>


                          <div
                            style={
                              styles.projectSection
                            }
                          >

                            <div
                              style={
                                styles.projectSectionLabel
                              }
                            >
                              Project access
                            </div>


                            {tenantProjects.length ===
                            0 ? (

                              <div
                                style={
                                  styles.empty
                                }
                              >
                                No tenant projects available.
                              </div>

                            ) : (

                              tenantProjects.map(
                                project => {

                                  const projectId =
                                    getProjectId(
                                      project
                                    );

                                  if (!projectId) {
                                    return null;
                                  }

                                  const projectState =
                                    editProjects?.[
                                      projectId
                                    ] || {};

                                  return (
                                    <div
                                      key={
                                        projectId
                                      }
                                      style={
                                        styles.projectRow
                                      }
                                    >

                                      <input
                                        type="checkbox"
                                        checked={
                                          !!projectState.selected
                                        }
                                        onChange={() =>
                                          toggleProject(
                                            projectId,
                                            setEditProjects
                                          )
                                        }
                                        disabled={
                                          updatingInvitation
                                        }
                                      />

                                      <div
                                        style={
                                          styles.projectInfo
                                        }
                                      >

                                        <div
                                          style={
                                            styles.projectName
                                          }
                                        >
                                          {
                                            project?.name ||
                                            "Unnamed project"
                                          }
                                        </div>

                                        <div
                                          style={
                                            styles.projectOwner
                                          }
                                        >
                                          Owner:{" "}
                                          {
                                            getOwnerDisplay(
                                              project
                                            )
                                          }
                                        </div>

                                      </div>


                                      {projectState.selected && (
                                        <select
                                          value={
                                            projectState.role ||
                                            "viewer"
                                          }
                                          onChange={
                                            event =>
                                              setProjectRole(
                                                projectId,
                                                event.target.value,
                                                setEditProjects
                                              )
                                          }
                                          style={
                                            styles.projectRoleSelect
                                          }
                                          disabled={
                                            updatingInvitation
                                          }
                                        >

                                          {PROJECT_ROLE_OPTIONS.map(
                                            option => (
                                              <option
                                                key={
                                                  option.value
                                                }
                                                value={
                                                  option.value
                                                }
                                              >
                                                {
                                                  option.label
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
                            style={
                              styles.formActions
                            }
                          >

                            <button
                              type="button"
                              style={
                                styles.secondaryButton
                              }
                              onClick={
                                cancelEditingInvitation
                              }
                              disabled={
                                updatingInvitation
                              }
                            >
                              Cancel
                            </button>

                            <button
                              type="button"
                              style={{
                                ...styles.primaryButton,
                                ...(updatingInvitation
                                  ? styles.disabledButton
                                  : {}),
                              }}
                              onClick={
                                handleUpdateInvitation
                              }
                              disabled={
                                updatingInvitation
                              }
                            >
                              {updatingInvitation
                                ? "Saving..."
                                : "Save changes"}
                            </button>

                          </div>

                        </div>

                      </div>

                    )}

                  </div>
                );

              }
            )

          )}

        </div>

      </section>


      {/* =================================================
          REFRESH
      ================================================= */}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
        }}
      >

        <button
          type="button"
          style={{
            ...styles.secondaryButton,
            ...(refreshing
              ? styles.disabledButton
              : {}),
          }}
          onClick={() =>
            loadTeam()
          }
          disabled={
            refreshing
          }
        >
          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </div>

    </div>
  );

}