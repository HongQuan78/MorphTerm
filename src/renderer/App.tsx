import { AppMenuBar } from "./AppMenuBar";
import { TerminalView } from "./TerminalView";

export function App() {
  return (
    <main className="app-shell">
      <AppMenuBar />
      <TerminalView />
    </main>
  );
}
