import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { MultiplayerProvider } from "@/hooks/useMultiplayer";

createRoot(document.getElementById("root")!).render(
  <MultiplayerProvider>
    <App />
  </MultiplayerProvider>
);
