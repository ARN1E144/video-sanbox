// src/components/elements/ParticipantSelector.js

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import api from "../../services/api";

import {
  useRuntimeState,
} from "../../context/RuntimeStateContext";

import {
  useAuth,
} from "../../context/AuthContext";


const PAGE_SIZE =
  25;

const SEARCH_DEBOUNCE_MS =
  300;


// =====================================================
// HELPERS
// =====================================================

function normaliseId(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return null;

  }


  if (
    typeof value === "object"
  ) {

    value =
      value?.userId ||
      value?.id ||
      value?._id ||
      null;

  }


  if (
    value === null ||
    value === undefined
  ) {

    return null;

  }


  const id =
    String(
      value
    ).trim();


  return id ||
    null;

}


function normaliseIds(
  values
) {

  if (
    !Array.isArray(
      values
    )
  ) {

    return [];

  }


  return [
    ...new Set(

      values

        .map(
          normaliseId
        )

        .filter(Boolean)

    ),
  ];

}


function getDisplayName(
  member
) {

  const fullName =
    [
      member?.firstName,
      member?.lastName,
    ]

      .filter(Boolean)

      .map(
        value =>
          String(
            value
          ).trim()
      )

      .filter(Boolean)

      .join(" ")

      .trim();


  return (
    fullName ||
    member?.email ||
    "Unnamed user"
  );

}


function getInitials(
  member
) {

  const name =
    getDisplayName(
      member
    );


  if (
    !name
  ) {

    return "?";

  }


  const parts =
    name
      .split(
        /\s+/
      )
      .filter(Boolean);


  if (
    parts.length >= 2
  ) {

    return (
      parts[0][0] +
      parts[parts.length - 1][0]
    )
      .toUpperCase();

  }


  return name
    .slice(
      0,
      2
    )
    .toUpperCase();

}


// =====================================================
// NORMALISE MEMBER
// =====================================================

function normaliseMember(
  member
) {

  if (
    !member
  ) {

    return null;

  }


  const id =
    normaliseId(
      member?.id ??
      member?._id
    );


  if (
    !id
  ) {

    return null;

  }


  return {

    ...member,

    id,

  };

}


// =====================================================
// AVATAR
// =====================================================

function MemberAvatar({
  member,
  selected = false,
}) {

  const initials =
    getInitials(
      member
    );


  return (

    <div
      style={{
        width:
          34,

        height:
          34,

        minWidth:
          34,

        borderRadius:
          "50%",

        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "center",

        background:
          selected
            ? "#1d4ed8"
            : "#263244",

        border:
          selected
            ? "1px solid #3b82f6"
            : "1px solid #3b4759",

        color:
          "#fff",

        fontSize:
          11,

        fontWeight:
          700,

        boxSizing:
          "border-box",

        userSelect:
          "none",
      }}
    >

      {initials}

    </div>

  );

}


// =====================================================
// COMPONENT
// =====================================================

export default function ParticipantSelector({

  label =
    "Select Participants",

  placeholder =
    "Search participants...",

  roleFilter =
    "",

  multiple =
    true,

  selectionPath =
    "call.selectedParticipantIds",

  collapsible =
    true,

  defaultCollapsed =
    false,

}) {

  // ===================================================
  // CONTEXT
  // ===================================================

  const {
    session,
  } =
  useAuth();


  const runtime =
    useRuntimeState();


  // ===================================================
  // CURRENT USER
  // ===================================================

  const currentUserId =
    normaliseId(
      session?.user?.id
    ) ||
    normaliseId(
      session?.userId
    ) ||
    normaliseId(
      runtime.get?.(
        "auth.userId"
      )
    ) ||
    normaliseId(
      runtime.get?.(
        "auth.user.id"
      )
    ) ||
    normaliseId(
      runtime.get?.(
        "user.id"
      )
    );


  // ===================================================
  // SELECTION PATH
  // ===================================================

  const resolvedSelectionPath =
    typeof selectionPath ===
      "string" &&
    selectionPath.trim()

      ? selectionPath.trim()

      : "call.selectedParticipantIds";


  // ===================================================
  // INITIAL SELECTION
  // ===================================================

  const initialRuntimeSelection =
    normaliseIds(
      runtime.get?.(
        resolvedSelectionPath
      )
    );


  // ===================================================
  // STATE
  // ===================================================

  const [
    search,
    setSearch,
  ] =
  useState(
    ""
  );


  const [
    members,
    setMembers,
  ] =
  useState(
    []
  );


  const [
    selectedIds,
    setSelectedIds,
  ] =
  useState(
    initialRuntimeSelection
  );


  const [
    selectedMembersMap,
    setSelectedMembersMap,
  ] =
  useState(
    {}
  );


  const [
    loading,
    setLoading,
  ] =
  useState(
    false
  );


  const [
    loadingMore,
    setLoadingMore,
  ] =
  useState(
    false
  );


  const [
    error,
    setError,
  ] =
  useState(
    null
  );


  const [
    page,
    setPage,
  ] =
  useState(
    1
  );


  const [
    hasNext,
    setHasNext,
  ] =
  useState(
    false
  );


  // ===================================================
  // COLLAPSE STATE
  // ===================================================

  const [
    collapsed,
    setCollapsed,
  ] =
  useState(
    Boolean(
      defaultCollapsed
    )
  );


  // ===================================================
  // REFS
  // ===================================================

  const searchTimeoutRef =
    useRef(
      null
    );


  const loadingRef =
    useRef(
      false
    );


  const selectedIdsRef =
    useRef(
      initialRuntimeSelection
    );


  const mountedRef =
    useRef(
      false
    );


  // ===================================================
  // KEEP REF CURRENT
  // ===================================================

  useEffect(() => {

    selectedIdsRef.current =
      selectedIds;

  }, [
    selectedIds,
  ]);


  // ===================================================
  // DEBUG
  // ===================================================

  console.log(
    "[ParticipantSelector] RENDER",
    {

      selectionPath:
        resolvedSelectionPath,

      currentUserId,

      selectedIds,

      runtimeSelection:
        runtime.get?.(
          resolvedSelectionPath
        ),

      collapsed,

    }
  );


  // ===================================================
  // TOGGLE COLLAPSE
  // ===================================================

  const handleToggleCollapse =
    useCallback(
      () => {

        if (
          !collapsible
        ) {

          return;

        }


        setCollapsed(
          previous =>
            !previous
        );

      },
      [
        collapsible,
      ]
    );


  // ===================================================
  // WRITE RUNTIME SELECTION
  // ===================================================

  const writeSelection =
    useCallback(
      nextIds => {

        const normalisedIds =
          normaliseIds(
            nextIds
          );


        selectedIdsRef.current =
          normalisedIds;


        setSelectedIds(
          normalisedIds
        );


        runtime.set(
          resolvedSelectionPath,
          normalisedIds
        );


        console.log(
          "[ParticipantSelector] RUNTIME SELECTION WRITTEN",
          {

            selectionPath:
              resolvedSelectionPath,

            participantIds:
              normalisedIds,

            runtimeValue:
              runtime.get?.(
                resolvedSelectionPath
              ),

          }
        );

      },
      [
        resolvedSelectionPath,
        runtime,
      ]
    );


  // ===================================================
  // RUNTIME SELECTION SUBSCRIPTION
  // ===================================================

  useEffect(() => {

    mountedRef.current =
      true;


    const unsubscribe =
      runtime.subscribe?.(
        resolvedSelectionPath,
        value => {

          if (
            !mountedRef.current
          ) {

            return;

          }


          const nextIds =
            normaliseIds(
              value
            );


          selectedIdsRef.current =
            nextIds;


          setSelectedIds(
            nextIds
          );


          setSelectedMembersMap(
            previous => {

              const next = {};


              nextIds.forEach(
                id => {

                  if (
                    previous[id]
                  ) {

                    next[id] =
                      previous[id];

                  }

                }
              );


              return next;

            }
          );


          console.log(
            "[ParticipantSelector] RUNTIME SELECTION SYNCHRONISED",
            {

              selectionPath:
                resolvedSelectionPath,

              participantIds:
                nextIds,

            }
          );

        }
      );


    return () => {

      mountedRef.current =
        false;

      unsubscribe?.();

    };

  }, [
    resolvedSelectionPath,
    runtime,
  ]);


  // ===================================================
  // LOAD MEMBERS
  // ===================================================

  const loadMembers =
    useCallback(
      async ({
        nextPage =
          1,

        append =
          false,

        searchValue =
          "",
      } = {}) => {

        if (
          loadingRef.current
        ) {

          return;

        }


        loadingRef.current =
          true;


        if (
          append
        ) {

          setLoadingMore(
            true
          );

        }
        else {

          setLoading(
            true
          );

        }


        try {

          setError(
            null
          );


          const params =
            new URLSearchParams({

              search:
                searchValue,

              page:
                String(
                  nextPage
                ),

              limit:
                String(
                  PAGE_SIZE
                ),

            });


          if (
            roleFilter
          ) {

            params.set(
              "role",
              roleFilter
            );

          }


          const response =
            await api.get(
              `/data/members?${params.toString()}`
            );


          const loadedMembers =
            Array.isArray(
              response?.data?.members
            )

              ? response.data.members

                  .map(
                    normaliseMember
                  )

                  .filter(Boolean)

                  .filter(
                    member =>
                      !currentUserId ||
                      normaliseId(
                        member.id
                      ) !==
                      currentUserId
                  )

              : [];


          const pagination =
            response?.data?.pagination ||
            {};


          setMembers(
            previous =>
              append

                ? [
                    ...previous,
                    ...loadedMembers,
                  ]

                : loadedMembers
          );


          setSelectedMembersMap(
            previous => {

              const next = {
                ...previous,
              };


              loadedMembers.forEach(
                member => {

                  const memberId =
                    normaliseId(
                      member.id
                    );


                  if (
                    selectedIdsRef.current.includes(
                      memberId
                    )
                  ) {

                    next[memberId] =
                      member;

                  }

                }
              );


              return next;

            }
          );


          setPage(
            nextPage
          );


          setHasNext(
            Boolean(
              pagination.hasNext
            )
          );


          console.log(
            "[ParticipantSelector] MEMBERS LOADED",
            {

              selectionPath:
                resolvedSelectionPath,

              search:
                searchValue,

              page:
                nextPage,

              count:
                loadedMembers.length,

            }
          );

        }
        catch (
          requestError
        ) {

          console.error(
            "[ParticipantSelector] MEMBER LOAD FAILED",
            requestError
          );


          setError(
            requestError?.response?.data?.error ||
            requestError?.message ||
            "Failed to load participants."
          );

        }
        finally {

          loadingRef.current =
            false;

          setLoading(
            false
          );

          setLoadingMore(
            false
          );

        }

      },
      [
        currentUserId,
        resolvedSelectionPath,
        roleFilter,
      ]
    );


  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {

    loadMembers({
      nextPage:
        1,

      append:
        false,

      searchValue:
        "",
    });

  }, [
    loadMembers,
  ]);


  // ===================================================
  // SEARCH
  // ===================================================

  useEffect(() => {

    window.clearTimeout(
      searchTimeoutRef.current
    );


    searchTimeoutRef.current =
      window.setTimeout(
        () => {

          loadMembers({

            nextPage:
              1,

            append:
              false,

            searchValue:
              search.trim(),

          });

        },
        SEARCH_DEBOUNCE_MS
      );


    return () => {

      window.clearTimeout(
        searchTimeoutRef.current
      );

    };

  }, [
    search,
    loadMembers,
  ]);


  // ===================================================
  // TOGGLE PARTICIPANT
  // ===================================================

  const toggleParticipant =
    useCallback(
      member => {

        const memberId =
          normaliseId(
            member?.id
          );


        if (
          !memberId
        ) {

          return;

        }


        if (
          currentUserId &&
          memberId ===
            currentUserId
        ) {

          return;

        }


        const currentIds =
          selectedIdsRef.current;


        const alreadySelected =
          currentIds.includes(
            memberId
          );


        let nextIds;


        if (
          alreadySelected
        ) {

          nextIds =
            currentIds.filter(
              id =>
                id !==
                memberId
            );

        }
        else if (
          multiple
        ) {

          nextIds = [
            ...currentIds,
            memberId,
          ];

        }
        else {

          nextIds = [
            memberId,
          ];

        }


        setSelectedMembersMap(
          previous => {

            const next = {
              ...previous,
            };


            if (
              !multiple
            ) {

              Object.keys(
                next
              ).forEach(
                id => {

                  if (
                    !nextIds.includes(
                      id
                    )
                  ) {

                    delete next[id];

                  }

                }
              );

            }


            if (
              nextIds.includes(
                memberId
              )
            ) {

              next[memberId] =
                normaliseMember(
                  member
                );

            }
            else {

              delete next[
                memberId
              ];

            }


            return next;

          }
        );


        writeSelection(
          nextIds
        );


        console.log(
          "[ParticipantSelector] PARTICIPANT TOGGLED",
          {

            memberId,

            alreadySelected,

            nextIds,

            selectionPath:
              resolvedSelectionPath,

          }
        );

      },
      [
        currentUserId,
        multiple,
        resolvedSelectionPath,
        writeSelection,
      ]
    );


  // ===================================================
  // REMOVE PARTICIPANT
  // ===================================================

  const removeParticipant =
    useCallback(
      memberId => {

        const id =
          normaliseId(
            memberId
          );


        if (
          !id
        ) {

          return;

        }


        const nextIds =
          selectedIdsRef.current.filter(
            selectedId =>
              selectedId !==
              id
          );


        setSelectedMembersMap(
          previous => {

            const next = {
              ...previous,
            };


            delete next[id];


            return next;

          }
        );


        writeSelection(
          nextIds
        );


        console.log(
          "[ParticipantSelector] PARTICIPANT REMOVED",
          {

            memberId:
              id,

            nextIds,

          }
        );

      },
      [
        writeSelection,
      ]
    );


  // ===================================================
  // LOAD MORE
  // ===================================================

  const loadMore =
    useCallback(
      () => {

        if (
          !hasNext ||
          loadingMore
        ) {

          return;

        }


        loadMembers({

          nextPage:
            page + 1,

          append:
            true,

          searchValue:
            search.trim(),

        });

      },
      [
        hasNext,
        loadingMore,
        loadMembers,
        page,
        search,
      ]
    );


  // ===================================================
  // SELECTED MEMBERS
  // ===================================================

  const selectedMembers =
    useMemo(
      () =>
        selectedIds

          .map(
            id =>
              selectedMembersMap[
                String(
                  id
                )
              ] ||

              members.find(
                member =>
                  normaliseId(
                    member.id
                  ) ===
                  normaliseId(
                    id
                  )
              )
          )

          .filter(Boolean),

      [
        selectedIds,
        selectedMembersMap,
        members,
      ]
    );


  // ===================================================
  // SELECTABLE MEMBERS
  // ===================================================

  const selectableMembers =
    useMemo(
      () =>
        members.filter(
          member =>
            !currentUserId ||
            normaliseId(
              member.id
            ) !==
            currentUserId
        ),

      [
        members,
        currentUserId,
      ]
    );


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <div
      style={{
        width:
          "100%",

        boxSizing:
          "border-box",

        padding:
          12,

        border:
          "1px solid #292929",

        borderRadius:
          12,

        background:
          "#111827",

        color:
          "#fff",

        boxShadow:
          "0 4px 16px rgba(0,0,0,0.20)",
      }}
    >

      {/* =============================================
          HEADER
      ============================================= */}

      <button
        type="button"

        onClick={
          handleToggleCollapse
        }

        disabled={
          !collapsible
        }

        aria-expanded={
          !collapsed
        }

        aria-label={
          collapsed
            ? `Expand ${label}`
            : `Collapse ${label}`
        }

        style={{
          width:
            "100%",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "space-between",

          gap:
            10,

          margin:
            0,

          padding:
            0,

          border:
            "none",

          background:
            "transparent",

          color:
            "#fff",

          textAlign:
            "left",

          cursor:
            collapsible
              ? "pointer"
              : "default",
        }}
      >

        <div
          style={{
            display:
              "flex",

            alignItems:
              "center",

            gap:
              9,

            minWidth:
              0,

            flex:
              1,
          }}
        >

          <div
            style={{
              width:
                24,

              height:
                24,

              minWidth:
                24,

              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              border:
                "1px solid #334155",

              borderRadius:
                6,

              background:
                "#172033",

              color:
                "#94a3b8",

              fontSize:
                12,

              fontWeight:
                700,

              userSelect:
                "none",
            }}
          >

            {collapsed
              ? "+"
              : "−"
            }

          </div>


          <div
            style={{
              minWidth:
                0,

              flex:
                1,
            }}
          >

            <div
              style={{
                fontSize:
                  13,

                fontWeight:
                  700,

                color:
                  "#fff",

                overflow:
                  "hidden",

                textOverflow:
                  "ellipsis",

                whiteSpace:
                  "nowrap",
              }}
            >

              {label}

            </div>


            <div
              style={{
                marginTop:
                  3,

                fontSize:
                  10,

                color:
                  "#6b7280",

                overflow:
                  "hidden",

                textOverflow:
                  "ellipsis",

                whiteSpace:
                  "nowrap",
              }}
            >

              {selectedIds.length ===
                0

                ? "Choose people to invite"

                : `${selectedIds.length} participant${
                    selectedIds.length ===
                    1
                      ? ""
                      : "s"
                  } selected`
              }

            </div>

          </div>

        </div>


        <div
          style={{
            padding:
              "4px 8px",

            border:
              "1px solid #334155",

            borderRadius:
              999,

            background:
              "#172033",

            color:
              "#94a3b8",

            fontSize:
              9,

            fontWeight:
              600,

            whiteSpace:
              "nowrap",

            flexShrink:
              0,
          }}
        >

          {multiple
            ? "MULTI SELECT"
            : "SELECT ONE"
          }

        </div>

      </button>


      {/* =============================================
          COLLAPSIBLE CONTENT
      ============================================= */}

      {!collapsed && (

        <>

          {/* =========================================
              SEARCH
          ========================================= */}

          <div
            style={{
              position:
                "relative",

              marginTop:
                10,

              marginBottom:
                10,
            }}
          >

            <div
              style={{
                position:
                  "absolute",

                left:
                  10,

                top:
                  "50%",

                transform:
                  "translateY(-50%)",

                color:
                  "#64748b",

                fontSize:
                  13,

                pointerEvents:
                  "none",
              }}
            >

              🔍

            </div>


            <input
              type="text"

              value={
                search
              }

              onChange={
                event =>
                  setSearch(
                    event.target.value
                  )
              }

              placeholder={
                placeholder
              }

              style={{
                width:
                  "100%",

                boxSizing:
                  "border-box",

                padding:
                  "9px 10px 9px 32px",

                border:
                  "1px solid #334155",

                borderRadius:
                  8,

                background:
                  "#0f172a",

                color:
                  "#fff",

                fontSize:
                  11,

                outline:
                  "none",
              }}
            />

          </div>


          {/* =========================================
              SELECTED PARTICIPANTS
          ========================================= */}

          {selectedMembers.length >
            0 && (

            <div
              style={{
                marginBottom:
                  10,
              }}
            >

              <div
                style={{
                  marginBottom:
                    6,

                  fontSize:
                    9,

                  fontWeight:
                    700,

                  color:
                    "#64748b",

                  textTransform:
                    "uppercase",

                  letterSpacing:
                    "0.06em",
                }}
              >

                Selected participants

              </div>


              <div
                style={{
                  display:
                    "flex",

                  flexDirection:
                    "column",

                  gap:
                    5,
                }}
              >

                {selectedMembers.map(
                  member => (

                    <div
                      key={
                        member.id
                      }

                      style={{
                        display:
                          "flex",

                        alignItems:
                          "center",

                        gap:
                          9,

                        padding:
                          "7px 8px",

                        border:
                          "1px solid #24416e",

                        borderRadius:
                          8,

                        background:
                          "#14213a",
                      }}
                    >

                      <MemberAvatar
                        member={
                          member
                        }

                        selected
                      />


                      <div
                        style={{
                          minWidth:
                            0,

                          flex:
                            1,
                        }}
                      >

                        <div
                          style={{
                            fontSize:
                              11,

                            fontWeight:
                              600,

                            color:
                              "#fff",

                            overflow:
                              "hidden",

                            textOverflow:
                              "ellipsis",

                            whiteSpace:
                              "nowrap",
                          }}
                        >

                          {getDisplayName(
                            member
                          )}

                        </div>


                        <div
                          style={{
                            marginTop:
                              2,

                            fontSize:
                              9,

                            color:
                              "#64748b",

                            overflow:
                              "hidden",

                            textOverflow:
                              "ellipsis",

                            whiteSpace:
                              "nowrap",
                          }}
                        >

                          {member.email ||
                            "Participant"
                          }

                        </div>

                      </div>


                      <div
                        style={{
                          display:
                            "flex",

                          alignItems:
                            "center",

                          gap:
                            6,
                        }}
                      >

                        <span
                          style={{
                            color:
                              "#60a5fa",

                            fontSize:
                              9,

                            fontWeight:
                              600,
                          }}
                        >

                          Selected

                        </span>


                        <button
                          type="button"

                          onClick={() =>
                            removeParticipant(
                              member.id
                            )
                          }

                          style={{
                            width:
                              24,

                            height:
                              24,

                            border:
                              "1px solid #334155",

                            borderRadius:
                              6,

                            background:
                              "#0f172a",

                            color:
                              "#94a3b8",

                            cursor:
                              "pointer",

                            fontSize:
                              12,

                            lineHeight:
                              1,
                          }}
                        >

                          ×

                        </button>

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>

          )}


          {/* =========================================
              AVAILABLE PARTICIPANTS
          ========================================= */}

          <div>

            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "space-between",

                marginBottom:
                  6,
              }}
            >

              <div
                style={{
                  fontSize:
                    9,

                  fontWeight:
                    700,

                  color:
                    "#64748b",

                  textTransform:
                    "uppercase",

                  letterSpacing:
                    "0.06em",
                }}
              >

                Available participants

              </div>


              {selectableMembers.length >
                0 && (

                <div
                  style={{
                    fontSize:
                      9,

                    color:
                      "#475569",
                  }}
                >

                  {selectableMembers.length} available

                </div>

              )}

            </div>


            <div
              style={{
                maxHeight:
                  250,

                overflowY:
                  "auto",

                border:
                  "1px solid #293548",

                borderRadius:
                  9,

                background:
                  "#0f172a",
              }}
            >

              {loading && (

                <div
                  style={{
                    padding:
                      18,

                    color:
                      "#64748b",

                    fontSize:
                      10,

                    textAlign:
                      "center",
                  }}
                >

                  Loading participants...

                </div>

              )}


              {!loading &&
                selectableMembers.length ===
                  0 && (

                <div
                  style={{
                    padding:
                      18,

                    color:
                      "#64748b",

                    fontSize:
                      10,

                    textAlign:
                      "center",
                  }}
                >

                  No participants found.

                </div>

              )}


              {!loading &&
                selectableMembers.map(
                  (
                    member,
                    index
                  ) => {

                    const memberId =
                      normaliseId(
                        member.id
                      );


                    const selected =
                      selectedIds.includes(
                        memberId
                      );


                    return (

                      <button
                        key={
                          memberId
                        }

                        type="button"

                        onClick={() =>
                          toggleParticipant(
                            member
                          )
                        }

                        style={{
                          width:
                            "100%",

                          display:
                            "flex",

                          alignItems:
                            "center",

                          gap:
                            9,

                          padding:
                            "9px 10px",

                          border:
                            "none",

                          borderBottom:
                            index ===
                            selectableMembers.length - 1

                              ? "none"

                              : "1px solid #1e293b",

                          background:
                            selected
                              ? "#172a46"
                              : "transparent",

                          color:
                            "#fff",

                          textAlign:
                            "left",

                          cursor:
                            "pointer",

                          boxSizing:
                            "border-box",

                          transition:
                            "background 120ms ease",
                        }}
                      >

                        <MemberAvatar
                          member={
                            member
                          }

                          selected={
                            selected
                          }
                        />


                        <div
                          style={{
                            minWidth:
                              0,

                            flex:
                              1,
                          }}
                        >

                          <div
                            style={{
                              display:
                                "flex",

                              alignItems:
                                "center",

                              gap:
                                6,

                              minWidth:
                                0,
                            }}
                          >

                            <span
                              style={{
                                minWidth:
                                  0,

                                flex:
                                  1,

                                fontSize:
                                  11,

                                fontWeight:
                                  600,

                                color:
                                  "#f8fafc",

                                overflow:
                                  "hidden",

                                textOverflow:
                                  "ellipsis",

                                whiteSpace:
                                  "nowrap",
                              }}
                            >

                              {getDisplayName(
                                member
                              )}

                            </span>


                            {member.role && (

                              <span
                                style={{
                                  flexShrink:
                                    0,

                                  padding:
                                    "2px 5px",

                                  border:
                                    "1px solid #334155",

                                  borderRadius:
                                    4,

                                  color:
                                    "#64748b",

                                  fontSize:
                                    8,

                                  textTransform:
                                    "uppercase",
                                }}
                              >

                                {member.role}

                              </span>

                            )}

                          </div>


                          <div
                            style={{
                              marginTop:
                                2,

                              fontSize:
                                9,

                              color:
                                "#64748b",

                              overflow:
                                "hidden",

                              textOverflow:
                                "ellipsis",

                              whiteSpace:
                                "nowrap",
                            }}
                          >

                            {member.email ||
                              "Tenant member"
                            }

                          </div>

                        </div>


                        <div
                          style={{
                            flexShrink:
                              0,

                            minWidth:
                              60,

                            padding:
                              "5px 7px",

                            border:
                              selected
                                ? "1px solid #2563eb"
                                : "1px solid #334155",

                            borderRadius:
                              6,

                            background:
                              selected
                                ? "#1d4ed8"
                                : "#172033",

                            color:
                              selected
                                ? "#fff"
                                : "#94a3b8",

                            fontSize:
                              9,

                            fontWeight:
                              600,

                            textAlign:
                              "center",
                          }}
                        >

                          {selected
                            ? "Selected"
                            : "Invite"
                          }

                        </div>

                      </button>

                    );

                  }
                )}

            </div>

          </div>


          {/* =========================================
              ERROR
          ========================================= */}

          {error && (

            <div
              style={{
                marginTop:
                  8,

                padding:
                  8,

                border:
                  "1px solid #6b1d1d",

                borderRadius:
                  7,

                background:
                  "#321515",

                color:
                  "#fca5a5",

                fontSize:
                  10,
              }}
            >

              {error}

            </div>

          )}


          {/* =========================================
              LOAD MORE
          ========================================= */}

          {hasNext && (

            <button
              type="button"

              onClick={
                loadMore
              }

              disabled={
                loadingMore
              }

              style={{
                width:
                  "100%",

                marginTop:
                  8,

                padding:
                  "7px 10px",

                border:
                  "1px solid #334155",

                borderRadius:
                  7,

                background:
                  "#172033",

                color:
                  "#94a3b8",

                fontSize:
                  10,

                cursor:
                  loadingMore
                    ? "default"
                    : "pointer",
              }}
            >

              {loadingMore
                ? "Loading..."
                : "Load more participants"
              }

            </button>

          )}


          {/* =========================================
              RUNTIME DEBUG
          ========================================= */}

          <div
            style={{
              marginTop:
                8,

              fontSize:
                8,

              color:
                "#374151",

              overflow:
                "hidden",

              textOverflow:
                "ellipsis",

              whiteSpace:
                "nowrap",
            }}
          >

            Runtime:
            {" "}
            {resolvedSelectionPath}

          </div>

        </>

      )}

    </div>

  );

}
