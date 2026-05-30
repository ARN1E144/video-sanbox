import { PreviewProvider } from "./context/PreviewContext";
import { CanvasProvider } from "./context/CanvasContext";
import { ProjectProvider } from "./context/ProjectContext";
import { ActionProvider } from "./context/ActionContext";
import { AuthProvider } from "./context/AuthContext";
import { RuntimeEventProvider } from "./context/RuntimeEventContext";
import { RuntimeTriggersProvider } from "./context/RuntimeTriggersContext";
import { RuntimeStateProvider } from "./context/RuntimeStateContext";
import { RuntimeDebuggerProvider } from "./context/RuntimeDebuggerContext";
import RuntimeTestPanel from "./dev/RuntimeTestPanel";
import RuntimeDevWiring from "./dev/RuntimeDevWiring";

import MainApp from "./MainApp";

function App() {
  return (
      <RuntimeDebuggerProvider>

      <AuthProvider>

        <RuntimeEventProvider>

          <RuntimeStateProvider>

            <ActionProvider>

              <RuntimeTriggersProvider>

                <RuntimeDevWiring /> {/* DEV WIRED TRIGGERS (ONLY IN DEV) */}

                <ProjectProvider>

                  <CanvasProvider>

                    <PreviewProvider>

                      <MainApp />

                      <RuntimeTestPanel />

                      {/* 🔥 DEV WIRED TRIGGERS (ONLY IN DEV) */}
                      <RuntimeDevWiring />

                    </PreviewProvider>

                  </CanvasProvider>

                </ProjectProvider>

              </RuntimeTriggersProvider>

            </ActionProvider>

          </RuntimeStateProvider>

        </RuntimeEventProvider>

      </AuthProvider>

    </RuntimeDebuggerProvider>
  );
}

export default App;