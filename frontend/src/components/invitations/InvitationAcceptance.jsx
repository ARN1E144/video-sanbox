// src/components/invitations/InvitationAcceptance.jsx

import React from "react";

import TenantInvitationAcceptance from "./TenantInvitationAcceptance";


// =====================================================
// GLOBAL INVITATION ACCEPTANCE
// =====================================================
//
// InvitationAcceptance is the platform-level entry point
// for invitation URLs.
//
// Current flow:
//
//   /?invite=<token>
//          ↓
//   InvitationAcceptance
//          ↓
//   TenantInvitationAcceptance
//
// The important architectural boundary is that App.js
// does NOT need to know what kind of invitation it is.
//
// Future invitation types can be added here:
//
//   tenant
//   project
//   training
//   groupCall
//   conversation
//
// without changing the global application entry point.
//
// =====================================================
//
// Invitation contract:
//
//   Invitation = business object
//   Token      = transport credential
//   URL        = delivery mechanism
//   Acceptance = authorization transition
//
// =====================================================


export default function InvitationAcceptance({
  token,
}) {

  // ===================================================
  // TOKEN VALIDATION
  // ===================================================

  if (
    !token
  ) {

    return (

      <div
        style={{
          minHeight:
            "100vh",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          background:
            "#090909",

          color:
            "#fff",

          fontFamily:
            "Inter, system-ui, sans-serif",

          padding:
            24,
        }}
      >

        <div
          style={{
            width:
              "100%",

            maxWidth:
              520,

            padding:
              32,

            border:
              "1px solid #2a2a2a",

            borderRadius:
              12,

            background:
              "#151515",

            textAlign:
              "center",
          }}
        >

          <h1
            style={{
              margin:
                "0 0 12px",

              fontSize:
                22,
            }}
          >
            Invitation unavailable
          </h1>


          <p
            style={{
              margin:
                0,

              color:
                "#aaa",

              lineHeight:
                1.6,
            }}
          >
            No invitation token was provided.
          </p>

        </div>

      </div>

    );

  }


  // ===================================================
  // CURRENT INVITATION ADAPTER
  // ===================================================
  //
  // Tenant invitations are currently the first concrete
  // invitation type implemented by Confo.
  //
  // Keeping this dispatch boundary here means future
  // invitation types do not require changes to App.js.
  //
  // ===================================================

  return (

    <TenantInvitationAcceptance
      token={
        token
      }
    />

  );

}