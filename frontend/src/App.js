import { PreviewProvider } from "./context/PreviewContext";
import { CanvasProvider } from "./context/CanvasContext";
import { ProjectProvider } from "./context/ProjectContext";
import { ActionProvider } from "./context/ActionContext";
import MainApp from "./MainApp";

function App() {
  return (
    <ActionProvider>
    <ProjectProvider>
      <CanvasProvider>
        <PreviewProvider>
          <MainApp />
        </PreviewProvider>
      </CanvasProvider>
    </ProjectProvider>
</ActionProvider>

  );
}

export default App;
