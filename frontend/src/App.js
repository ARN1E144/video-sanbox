
import React from "react";

import { PreviewProvider } from "./context/PreviewContext";
import { CanvasProvider } from "./context/CanvasContext";
import { ProjectProvider } from "./context/ProjectContext";
import { ActionProvider } from "./context/ActionContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

import { RuntimeEventProvider } from "./context/RuntimeEventContext";
import { RuntimeTriggersProvider } from "./context/RuntimeTriggersContext";
import { RuntimeStateProvider } from "./context/RuntimeStateContext";
import { RuntimeDebuggerProvider } from "./context/RuntimeDebuggerContext";
import {
  RuntimeAuthProvider,
  useRuntimeAuth,
} from "./context/RuntimeAuthContext";

import RuntimeBootstrap from "./runtime/RuntimeBootstrap";
import RuntimeDevWiring from "./dev/RuntimeDevWiring";
import RuntimeTestPanel from "./dev/RuntimeTestPanel";
import ConfoTest from "./dev/ConfoTest";
import ConfoRenderer from "./runtime/confos/ConfoRenderer";
import ContractTest from "./dev/ContractTest";

import MainApp from "./MainApp";
import AuthPortal from "./components/AuthPortal";


// =====================================================
// RUNTIME AUTH DEBUG
// =====================================================

function RuntimeAuthDebug() {
  const runtimeAuth = useRuntimeAuth();

  console.log(
    "%c 🔒 [RUNTIME AUTH]",
    "background-color:#DC2626;color:white;font-weight:bold;padding:3px 8px;border-radius:4px;",
    runtimeAuth
  );

  return null;
}


// =====================================================
// LOADING SCREEN
// =====================================================

function AuthLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#020617",
        color: "#fff",
        fontFamily: "sans-serif",
      }}
    >
      Loading...
    </div>
  );
}


// =====================================================
// AUTH GATE
//
// IMPORTANT:
//
// ProjectProvider is deliberately NOT mounted until
// authentication has completed.
//
// This prevents:
//
//   ProjectProvider
//        ↓
//   GET /api/projects
//        ↓
//   401
//
// when there is no authenticated user.
// =====================================================

function AuthGate() {
  const {
    session,
    loading,
  } = useAuth();

  // ---------------------------------------------------
  // AUTH HYDRATION
  // ---------------------------------------------------

  if (loading) {
    return <AuthLoading />;
  }

  // ---------------------------------------------------
  // NOT AUTHENTICATED
  // ---------------------------------------------------

  if (!session?.tokens?.accessToken) {
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

            <RuntimeTriggersProvider>

              <RuntimeDevWiring />

              <ContractTest />

              <ProjectProvider>

                <CanvasProvider>

                  <PreviewProvider>

                    <MainApp />

                    <ConfoRenderer />

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
