// src/App.js

import React from "react";

import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext";

import AuthPortal
  from "./components/AuthPortal";

import {
  RuntimeAuthProvider,
  useRuntimeAuth,
} from "./context/RuntimeAuthContext";

import {
  RuntimeEventProvider,
} from "./context/RuntimeEventContext";

import {
  RuntimeStateProvider,
} from "./context/RuntimeStateContext";

import RuntimeBootstrap
  from "./runtime/RuntimeBootstrap";

import {
  ActionProvider,
} from "./context/ActionContext";

import {
  RuntimeTriggersProvider,
} from "./context/RuntimeTriggersContext";

import RuntimeDevWiring
  from "./dev/RuntimeDevWiring";

import ContractTest
  from "./dev/ContractTest";

import {
  ProjectProvider,
} from "./context/ProjectContext";

import {
  CanvasProvider,
} from "./context/CanvasContext";

import {
  PreviewProvider,
} from "./context/PreviewContext";

import MainApp
  from "./MainApp";

import ConfoRenderer
  from "./runtime/confos/ConfoRenderer";

import RuntimeTestPanel
  from "./dev/RuntimeTestPanel";

import ConfoTest
  from "./dev/ConfoTest";

import useGroupCallInvitations
  from "./hooks/useGroupCallInvitations";

import useGroupCallSync
  from "./hooks/useGroupCallSync";

import GroupCallSocketRuntime
  from "./runtime/GroupCallSocketRuntime";


// =====================================================
// LOADING
// =====================================================

function AuthLoading() {

  return (
    <div
      style={{
        minHeight:
          "100vh",

        width:
          "100%",

        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "center",

        background:
          "#020617",

        color:
          "#fff",

        fontFamily:
          "sans-serif",
      }}
    >

      Loading...

    </div>
  );

}


// =====================================================
// RUNTIME AUTH DEBUG
// =====================================================

function RuntimeAuthDebug() {

  const runtimeAuth =
    useRuntimeAuth();


  console.log(
    "[RUNTIME AUTH DEBUG]",
    runtimeAuth
  );


  return null;

}


// =====================================================
// GROUP CALL INVITATION RUNTIME
// =====================================================
//
// Responsible for:
//
//   - discovering pending invitations
//   - initial fetch
//   - temporary polling fallback
//
// Realtime invitation delivery can later move to
// Socket.IO while this remains as reconciliation.
//
// =====================================================

function GroupCallInvitationRuntime() {

  const {
    refresh,
    isPolling,
  } =
    useGroupCallInvitations({

      enabled:
        true,

    });


  React.useEffect(() => {

    console.log(
      "[GroupCallInvitationRuntime] mounted",
      {
        isPolling,
      }
    );


    return () => {

      console.log(
        "[GroupCallInvitationRuntime] unmounted"
      );

    };

  }, [
    isPolling,
  ]);


  React.useEffect(() => {

    console.log(
      "[GroupCallInvitationRuntime] refresh available",
      typeof refresh ===
        "function"
    );

  }, [
    refresh,
  ]);


  return null;

}


// =====================================================
// GROUP CALL SYNC RUNTIME
// =====================================================
//
// Responsible for:
//
//   - detecting an active joined group call
//   - refreshing authoritative server state
//   - refreshing participant identity mappings
//   - polling as a temporary reconciliation layer
//
// =====================================================

function GroupCallRuntimeSync() {

  const {
    refresh,
    isActive,
  } =
    useGroupCallSync({

      enabled:
        true,

    });


  React.useEffect(() => {

    console.log(
      "[GroupCallRuntimeSync] mounted",
      {
        isActive,
      }
    );


    return () => {

      console.log(
        "[GroupCallRuntimeSync] unmounted"
      );

    };

  }, []);


  React.useEffect(() => {

    console.log(
      "[GroupCallRuntimeSync] active",
      {
        isActive,
      }
    );

  }, [
    isActive,
  ]);


  React.useEffect(() => {

    console.log(
      "[GroupCallRuntimeSync] refresh available",
      typeof refresh ===
        "function"
    );

  }, [
    refresh,
  ]);


  return null;

}


// =====================================================
// AUTH GATE
// =====================================================

function AuthGate() {

  const {
    session,
    loading,
  } =
    useAuth();


  // ---------------------------------------------------
  // AUTH HYDRATION
  // ---------------------------------------------------

  if (
    loading
  ) {

    return (
      <AuthLoading />
    );

  }


  // ---------------------------------------------------
  // NOT AUTHENTICATED
  // ---------------------------------------------------

  if (
    !session?.tokens?.accessToken
  ) {

    return (
      <AuthPortal />
    );

  }


  // ---------------------------------------------------
  // AUTHENTICATED
  // ---------------------------------------------------

  return (
    <AuthenticatedApp />
  );

}


// =====================================================
// AUTHENTICATED APPLICATION
// =====================================================

function AuthenticatedApp() {

  return (

    <RuntimeAuthProvider>

      <RuntimeAuthDebug />

      <RuntimeEventProvider>

        <RuntimeStateProvider>

          <RuntimeBootstrap />

          <ActionProvider>

            {/* =========================================
                GROUP INVITATION RUNTIME
            ========================================= */}

            <GroupCallInvitationRuntime />


            {/* =========================================
                ACTIVE GROUP CALL SYNC
            ========================================= */}

            <GroupCallRuntimeSync />


            {/* =========================================
                GROUP CALL SOCKET RUNTIME
            =========================================
            
            Responsibilities:

              authenticated socket connection
              group-call room membership
              realtime participant events
              realtime call-ended events
              unexpected host disconnect handling

            Must remain mounted independently of
            MainApp's current screen/view.
            ========================================= */}

            <GroupCallSocketRuntime />


            {/* =========================================
                RUNTIME TRIGGERS
            ========================================= */}

            <RuntimeTriggersProvider>

              <RuntimeDevWiring />

              <ContractTest />


              {/* =======================================
                  PROJECT RUNTIME
              ======================================= */}

              <ProjectProvider>

                <CanvasProvider>

                  <PreviewProvider>

                    {/* =================================
                        APPLICATION UI
                    ================================= */}

                    <MainApp />


                    {/* =================================
                        CONFO RENDERER
                    ================================= */}

                    <ConfoRenderer />


                    {/* =================================
                        RUNTIME TEST PANEL
                    ================================= */}

                    <RuntimeTestPanel />


                    {/* =================================
                        CONFO TEST
                    ================================= */}

                    <ConfoTest />

                  </PreviewProvider>

                </CanvasProvider>

              </ProjectProvider>

            </RuntimeTriggersProvider>

          </ActionProvider>

        </RuntimeStateProvider>

      </RuntimeEventProvider>

    </RuntimeAuthProvider>

  );

}


// =====================================================
// ROOT APP
// =====================================================

function App() {

  return (

    <AuthProvider>

      <AuthGate />

    </AuthProvider>

  );

}


export default App;