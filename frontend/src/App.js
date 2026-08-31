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
// IMPORTANT:
//
// This component must:
// - live at module scope
// - be rendered below ActionProvider
// - be rendered only for authenticated users
//
// The hook itself performs:
//   initial fetch
//   5 second polling
//   call.fetchPendingInvitations
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

      intervalMs:
        5000,

    });


  // ---------------------------------------------------
  // DEVELOPMENT DIAGNOSTICS
  // ---------------------------------------------------

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


  // ---------------------------------------------------
  // Expose refresh only through runtime/hook.
  //
  // We deliberately do not render anything.
  // ---------------------------------------------------

  React.useEffect(() => {

    console.log(
      "[GroupCallInvitationRuntime] refresh available",
      typeof refresh === "function"
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
                GROUP INVITATION POLLING

                MUST be below ActionProvider because
                useGroupCallInvitations() uses
                useActionContext().
            ========================================= */}

            <GroupCallInvitationRuntime />


            <RuntimeTriggersProvider>

              <RuntimeDevWiring />

              <ContractTest />


              <ProjectProvider>

                <CanvasProvider>

                  <PreviewProvider>

                    <MainApp />

                    <ConfoRenderer />

                    <RuntimeTestPanel />

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