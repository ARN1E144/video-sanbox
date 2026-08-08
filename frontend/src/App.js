import { useEffect } from "react";
import { PreviewProvider } from "./context/PreviewContext";
import { CanvasProvider } from "./context/CanvasContext";
import { ProjectProvider } from "./context/ProjectContext";
import { ActionProvider } from "./context/ActionContext";
import { AuthProvider } from "./context/AuthContext";
import agoraEngine from "./services/agoraEngine";
import { useRuntimeState } from "./context/RuntimeStateContext";
import { RuntimeEventProvider } from "./context/RuntimeEventContext";
import { RuntimeTriggersProvider } from "./context/RuntimeTriggersContext";
import { RuntimeStateProvider } from "./context/RuntimeStateContext";
import { RuntimeDebuggerProvider } from "./context/RuntimeDebuggerContext";
import RuntimeTestPanel from "./dev/RuntimeTestPanel";
import RuntimeBootstrap from "./runtime/RuntimeBootstrap";
import RuntimeDevWiring from "./dev/RuntimeDevWiring";
import ConfoTest from "./dev/ConfoTest";
import ConfoRenderer from "./runtime/confos/ConfoRenderer";
import ContractTest from "./dev/ContractTest";
import MainApp from "./MainApp";

import { 
  RuntimeAuthProvider,
  useRuntimeAuth
} from "./context/RuntimeAuthContext";



function RuntimeAuthDebug(){

  const runtimeAuth = useRuntimeAuth();

  console.log(
    "%c 🔒 [RUNTIME AUTH]",
    "background-color:#DC2626;color:white;font-weight:bold;padding:3px 8px;border-radius:4px;",
    runtimeAuth
  );

  return null;
}


function App() {

  return (
    <RuntimeDebuggerProvider>

      <AuthProvider>

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

      </AuthProvider>

    </RuntimeDebuggerProvider>
  );
}

export default App;