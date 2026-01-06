import { PreviewProvider } from "./context/PreviewContext";
import { CanvasProvider } from "./context/CanvasContext";
import { ProjectProvider } from "./context/ProjectContext";
import { ActionProvider } from "./context/ActionContext";
import { AuthProvider } from "./context/AuthContext";
import MainApp from "./MainApp";

function App() {
  return (
  <AuthProvider>
    <ActionProvider>
    <ProjectProvider>
      <CanvasProvider>
        <PreviewProvider>
          <MainApp />
        </PreviewProvider>
      </CanvasProvider>
    </ProjectProvider>
</ActionProvider>
</AuthProvider>

  );
}

export default App;
