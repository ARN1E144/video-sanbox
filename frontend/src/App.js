import { PreviewProvider } from "./context/PreviewContext";
import { CanvasProvider } from "./context/CanvasContext";
import MainApp from "./MainApp";

function App() {
  return (
    <PreviewProvider>
      <CanvasProvider> 
        <MainApp />
      </CanvasProvider> 
    </PreviewProvider>
  );
}

export default App;
