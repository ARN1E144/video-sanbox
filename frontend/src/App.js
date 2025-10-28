import { PreviewProvider } from "./context/PreviewContext";
import { CanvasProvider } from "./context/CanvasContext";
import { ProjectProvider } from "./context/ProjectContext";
import MainApp from "./MainApp";

function App() {
  return (
    <ProjectProvider>
      <PreviewProvider>
        <CanvasProvider> 
          <MainApp />
        </CanvasProvider> 
      </PreviewProvider>
    </ProjectProvider>
  );
}

export default App;
