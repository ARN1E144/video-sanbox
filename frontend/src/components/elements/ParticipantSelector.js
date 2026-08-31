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


const PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 300;


export default function ParticipantSelector({

  label =
    "Invite Participants",

  placeholder =
    "Search participants...",

  roleFilter =
    "",

  // ---------------------------------------------------
  // Runtime state destination
  //
  // Examples:
  //
  // call.selectedParticipantIds
  // training.participantIds
  // ---------------------------------------------------

  selectionPath =
    "call.selectedParticipantIds",

}) {

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
    session?.user?.id ||
    runtime.get?.("auth.user.id") ||
    runtime.get?.("user.id") ||
    null;


  console.log(
    "[ParticipantSelector] CURRENT USER DEBUG",
    {
      currentUserId,
      selectionPath,
    }
  );


  // ===================================================
  // INITIAL SELECTION
  // ===================================================

  const initialSelectedIds =
    runtime.get?.(
      selectionPath
    );


  // ===================================================
  // STATE
  // ===================================================

  const [
    search,
    setSearch,
  ] =
    useState("");


  const [
    members,
    setMembers,
  ] =
    useState([]);


  const [
    selectedIds,
    setSelectedIds,
  ] =
    useState(
      Array.isArray(
        initialSelectedIds
      )
        ? initialSelectedIds.map(
            id =>
              String(id)
          )
        : []
    );


  const [
    selectedMembersMap,
    setSelectedMembersMap,
  ] =
    useState({});


  const [
    loading,
    setLoading,
  ] =
  useState(false);


  const [
    loadingMore,
    setLoadingMore,
  ] =
  useState(false);


  const [
    error,
    setError,
  ] =
  useState(null);


  const [
    page,
    setPage,
  ] =
  useState(1);


  const [
    hasNext,
    setHasNext,
  ] =
  useState(false);


  const searchTimeoutRef =
    useRef(null);


  const loadingRef =
    useRef(false);


  // ===================================================
  // NORMALISE MEMBER
  // ===================================================

  const normaliseMember =
    useCallback(
      member => {

        if (!member) {
          return null;
        }


        return {

          ...member,

          id:
            String(
              member.id ??
              member._id ??
              ""
            ),

        };

      },
      []
    );


  // ===================================================
  // LOAD MEMBERS
  // ===================================================

  const loadMembers =
    useCallback(
      async ({
        nextPage = 1,
        append = false,
        searchValue = "",
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
                      String(
                        member.id
                      ) !==
                      String(
                        currentUserId
                      )
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


          // --------------------------------------------
          // Preserve selected member objects
          // --------------------------------------------

          if (
            loadedMembers.length > 0
          ) {

            setSelectedMembersMap(
              previous => {

                const next = {
                  ...previous,
                };


                loadedMembers.forEach(
                  member => {

                    const id =
                      String(
                        member.id
                      );


                    if (
                      selectedIds.includes(
                        id
                      )
                    ) {

                      next[id] =
                        member;

                    }

                  }
                );


                return next;

              }
            );

          }


          setPage(
            nextPage
          );


          setHasNext(
            Boolean(
              pagination.hasNext
            )
          );


          console.log(
            "[ParticipantSelector] Members loaded",
            {
              selectionPath,
              search:
                searchValue,
              page:
                nextPage,
              count:
                loadedMembers.length,
              total:
                pagination.total,
            }
          );

        }
        catch (
          requestError
        ) {

          console.error(
            "[ParticipantSelector] Failed to load members",
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
        normaliseMember,
        roleFilter,
        selectedIds,
        selectionPath,
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
    roleFilter,
    currentUserId,
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
  // RUNTIME SYNC
  // ===================================================
  //
  // This is now generic.
  //
  // Group call:
  //
  // call.selectedParticipantIds
  //
  // Training:
  //
  // training.participantIds
  //
  // ===================================================

  const syncSelectedParticipants =
    useCallback(
      nextIds => {

        const normalisedIds =
          [
            ...new Set(
              nextIds
                .map(
                  id =>
                    String(id).trim()
                )
                .filter(Boolean)
            ),
          ];


        runtime.set(
          selectionPath,
          normalisedIds
        );


        console.log(
          "[ParticipantSelector] Selection changed",
          {
            selectionPath,
            participantIds:
              normalisedIds,
          }
        );

      },
      [
        runtime,
        selectionPath,
      ]
    );


  // ===================================================
  // TOGGLE PARTICIPANT
  // ===================================================

  const toggleParticipant =
    useCallback(
      member => {

        const memberId =
          String(
            member?.id ||
            ""
          );


        if (
          !memberId
        ) {

          return;

        }


        if (
          currentUserId &&
          memberId ===
            String(
              currentUserId
            )
        ) {

          return;

        }


        setSelectedIds(
          previous => {

            const exists =
              previous.includes(
                memberId
              );


            const next =
              exists

                ? previous.filter(
                    id =>
                      id !==
                      memberId
                  )

                : [
                    ...previous,
                    memberId,
                  ];


            setSelectedMembersMap(
              previousMembers => {

                const nextMembers = {
                  ...previousMembers,
                };


                if (
                  exists
                ) {

                  delete nextMembers[
                    memberId
                  ];

                }
                else {

                  nextMembers[
                    memberId
                  ] =
                    normaliseMember(
                      member
                    );

                }


                return nextMembers;

              }
            );


            syncSelectedParticipants(
              next
            );


            return next;

          }
        );

      },
      [
        currentUserId,
        normaliseMember,
        syncSelectedParticipants,
      ]
    );


  // ===================================================
  // REMOVE SELECTED
  // ===================================================

  const removeParticipant =
    useCallback(
      memberId => {

        const id =
          String(
            memberId
          );


        setSelectedIds(
          previous => {

            const next =
              previous.filter(
                selectedId =>
                  selectedId !==
                  id
              );


            setSelectedMembersMap(
              previousMembers => {

                const nextMembers = {
                  ...previousMembers,
                };


                delete nextMembers[
                  id
                ];


                return nextMembers;

              }
            );


            syncSelectedParticipants(
              next
            );


            return next;

          }
        );

      },
      [
        syncSelectedParticipants,
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
                String(id)
              ] ||
              members.find(
                member =>
                  String(
                    member.id
                  ) ===
                  String(id)
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
            String(
              member.id
            ) !==
            String(
              currentUserId
            )
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

        color:
          "#fff",
      }}
    >

      {/* =============================================
          LABEL
      ============================================= */}

      <div
        style={{
          marginBottom:
            7,

          fontSize:
            11,

          fontWeight:
            600,

          color:
            "#888",
        }}
      >
        {label}
      </div>


      {/* =============================================
          SEARCH
      ============================================= */}

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
            "9px 10px",

          border:
            "1px solid #333",

          borderRadius:
            7,

          background:
            "#111",

          color:
            "#fff",

          fontSize:
            12,

          outline:
            "none",
        }}

      />


      {/* =============================================
          SELECTION COUNT
      ============================================= */}

      <div
        style={{
          marginTop:
            7,

          marginBottom:
            7,

          fontSize:
            11,

          color:
            "#999",
        }}
      >

        {selectedIds.length === 0
          ? "No participants selected"
          : `${selectedIds.length} participant${selectedIds.length === 1 ? "" : "s"} selected`}

      </div>


      {/* =============================================
          SELECTED CHIPS
      ============================================= */}

      {selectedMembers.length > 0 && (

        <div
          style={{
            display:
              "flex",

            flexWrap:
              "wrap",

            gap:
              5,

            marginBottom:
              9,
          }}
        >

          {selectedMembers.map(
            member => (

              <button

                key={
                  member.id
                }

                type="button"

                onClick={() =>
                  removeParticipant(
                    member.id
                  )
                }

                style={{
                  border:
                    "1px solid #334155",

                  borderRadius:
                    999,

                  background:
                    "#1e293b",

                  color:
                    "#fff",

                  padding:
                    "4px 8px",

                  fontSize:
                    10,

                  cursor:
                    "pointer",
                }}

              >

                {`${member.firstName || ""} ${member.lastName || ""}`.trim() ||
                  member.email}

                {" ×"}

              </button>

            )
          )}

        </div>

      )}


      {/* =============================================
          ERROR
      ============================================= */}

      {error && (

        <div
          style={{
            marginBottom:
              7,

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
              11,
          }}
        >
          {error}
        </div>

      )}


      {/* =============================================
          RESULTS
      ============================================= */}

      <div
        style={{
          maxHeight:
            220,

          overflowY:
            "auto",

          border:
            "1px solid #292929",

          borderRadius:
            8,

          background:
            "#0d0d0d",
        }}
      >

        {loading && (

          <div
            style={{
              padding:
                12,

              color:
                "#777",

              fontSize:
                11,

              textAlign:
                "center",
            }}
          >
            Loading participants...
          </div>

        )}


        {!loading &&
          selectableMembers.length === 0 && (

          <div
            style={{
              padding:
                12,

              color:
                "#777",

              fontSize:
                11,

              textAlign:
                "center",
            }}
          >
            No participants found.
          </div>

        )}


        {!loading &&
          selectableMembers.map(
            member => {

              const memberId =
                String(
                  member.id
                );


              const selected =
                selectedIds.includes(
                  memberId
                );


              const displayName =
                `${member.firstName || ""} ${member.lastName || ""}`
                  .trim() ||
                member.email ||
                "Unnamed user";


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
                      "1px solid #202020",

                    background:
                      selected
                        ? "#182235"
                        : "transparent",

                    color:
                      "#fff",

                    textAlign:
                      "left",

                    cursor:
                      "pointer",
                  }}

                >

                  <span
                    style={{
                      width:
                        16,

                      height:
                        16,

                      display:
                        "flex",

                      alignItems:
                        "center",

                      justifyContent:
                        "center",

                      flexShrink:
                        0,

                      border:
                        selected
                          ? "1px solid #2563eb"
                          : "1px solid #555",

                      borderRadius:
                        4,

                      background:
                        selected
                          ? "#2563eb"
                          : "transparent",

                      fontSize:
                        10,
                    }}
                  >

                    {selected
                      ? "✓"
                      : ""}

                  </span>


                  <span
                    style={{
                      minWidth:
                        0,

                      flex:
                        1,
                    }}
                  >

                    <span
                      style={{
                        display:
                          "block",

                        fontSize:
                          12,

                        fontWeight:
                          600,

                        whiteSpace:
                          "nowrap",

                        overflow:
                          "hidden",

                        textOverflow:
                          "ellipsis",
                      }}
                    >
                      {displayName}
                    </span>


                    <span
                      style={{
                        display:
                          "block",

                        marginTop:
                          2,

                        fontSize:
                          10,

                        color:
                          "#777",

                        whiteSpace:
                          "nowrap",

                        overflow:
                          "hidden",

                        textOverflow:
                          "ellipsis",
                      }}
                    >
                      {member.email}
                    </span>

                  </span>


                  {member.role && (

                    <span
                      style={{
                        fontSize:
                          9,

                        color:
                          "#777",
                      }}
                    >
                      {member.role}
                    </span>

                  )}

                </button>

              );

            }
          )}

      </div>


      {/* =============================================
          LOAD MORE
      ============================================= */}

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
              7,

            padding:
              "8px 10px",

            border:
              "1px solid #333",

            borderRadius:
              7,

            background:
              "#151515",

            color:
              "#aaa",

            fontSize:
              11,

            cursor:
              loadingMore
                ? "default"
                : "pointer",
          }}

        >

          {loadingMore
            ? "Loading..."
            : "Load more"}

        </button>

      )}

    </div>

  );

}