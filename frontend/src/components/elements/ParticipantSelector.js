import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../../services/api";

import {
  useRuntimeState,
} from "../../context/RuntimeStateContext";


// =====================================================
// PARTICIPANT SELECTOR
// =====================================================
//
// Loads members from the current tenant.
//
// Selected participant is written to:
//
//   call.recipientId
//
// This allows:
//
//   ParticipantSelector
//          ↓
//   runtime.call.recipientId
//          ↓
//   call.startCall
//
// =====================================================

export default function ParticipantSelector({
  label = "Invite Participant",
  placeholder = "Select participant",
  roleFilter = null,
}) {

  const runtime =
    useRuntimeState();


  const [
    members,
    setMembers,
  ] =
    useState([]);


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    error,
    setError,
  ] =
    useState(null);


  const [
    selectedId,
    setSelectedId,
  ] =
    useState(
      () =>
        runtime.get?.(
          "call.recipientId"
        ) || ""
    );


  // ===================================================
  // LOAD TENANT MEMBERS
  // ===================================================

  useEffect(() => {

    let cancelled =
      false;


    async function loadMembers() {

      try {

        setLoading(true);

        setError(null);


        const response =
          await api.get(
            "/data/members"
          );


        const loadedMembers =
          Array.isArray(
            response?.data?.members
          )
            ? response.data.members
            : [];


        if (
          cancelled
        ) {

          return;

        }


        setMembers(
          loadedMembers
        );


        console.log(
          "[ParticipantSelector] Members loaded",
          {
            count:
              loadedMembers.length,
          }
        );

      }
      catch (
        requestError
      ) {

        if (
          cancelled
        ) {

          return;

        }


        console.error(
          "[ParticipantSelector] Failed to load members",
          requestError
        );


        setMembers([]);


        setError(
          requestError?.response?.data?.error ||
          requestError?.response?.data?.message ||
          requestError?.message ||
          "Failed to load participants."
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


    loadMembers();


    return () => {

      cancelled = true;

    };

  }, []);


  // ===================================================
  // OPTIONAL ROLE FILTER
  // ===================================================

  const availableMembers =
    useMemo(() => {

      if (
        !roleFilter
      ) {

        return members;

      }


      if (
        Array.isArray(
          roleFilter
        )
      ) {

        return members.filter(
          member =>
            roleFilter.includes(
              member?.role
            )
        );

      }


      return members.filter(
        member =>
          member?.role ===
          roleFilter
      );

    }, [
      members,
      roleFilter,
    ]);


  // ===================================================
  // SELECTION
  // ===================================================

  const handleChange =
    event => {

      const nextId =
        event.target.value;


      setSelectedId(
        nextId
      );


      runtime.patch(
        "call",
        {

          recipientId:
            nextId ||
            null,

        }
      );


      console.log(
        "[ParticipantSelector] Recipient changed",
        {

          recipientId:
            nextId ||
            null,

        }
      );

    };


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

      }}
    >

      <div
        style={{
          marginBottom:
            6,

          color:
            "#888",

          fontSize:
            11,

          fontWeight:
            600,

        }}
      >
        {label}
      </div>


      {loading && (

        <div
          style={{
            padding:
              "9px 10px",

            border:
              "1px solid #333",

            borderRadius:
              7,

            background:
              "#111",

            color:
              "#777",

            fontSize:
              12,

          }}
        >
          Loading participants...
        </div>

      )}


      {!loading &&
        error && (

          <div
            style={{
              padding:
                9,

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


      {!loading &&
        !error && (

          <select
            value={
              selectedId
            }

            onChange={
              handleChange
            }

            style={{
              width:
                "100%",

              padding:
                "9px 10px",

              boxSizing:
                "border-box",

              border:
                "1px solid #333",

              borderRadius:
                7,

              background:
                "#111",

              color:
                selectedId
                  ? "#fff"
                  : "#777",

              fontSize:
                12,

              outline:
                "none",

              cursor:
                "pointer",

            }}
          >

            <option
              value=""
            >
              {placeholder}
            </option>


            {availableMembers.map(
              member => {

                const name =
                  `${member?.firstName || ""} ${member?.lastName || ""}`
                    .trim();


                const displayName =
                  name ||
                  member?.email ||
                  "Unnamed user";


                return (

                  <option
                    key={
                      member.id
                    }

                    value={
                      member.id
                    }
                  >
                    {displayName}
                    {member?.email
                      ? ` — ${member.email}`
                      : ""}
                  </option>

                );

              }
            )}

          </select>

      )}


      {!loading &&
        !error &&
        availableMembers.length ===
          0 && (

          <div
            style={{
              marginTop:
                6,

              color:
                "#666",

              fontSize:
                10,

            }}
          >
            No participants available.
          </div>

      )}

    </div>

  );

}