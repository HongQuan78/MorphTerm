import { appInfo } from "../shared/appInfo";

export function App() {
  const runtimeInfo = window.fluxTerm ?? {
    appInfo,
    platform: "browser"
  };

  return (
    <main className="app-shell">
      <section className="intro-panel" aria-labelledby="app-title">
        <p className="eyebrow">Desktop terminal scaffold</p>
        <h1 id="app-title">{runtimeInfo.appInfo.name}</h1>
        <p className="lede">
          A minimal Electron, React, and TypeScript foundation is ready. The
          terminal engine will live in the main process when V0.1 terminal work
          begins.
        </p>
        <dl className="status-grid" aria-label="Application status">
          <div>
            <dt>Version</dt>
            <dd>{runtimeInfo.appInfo.version}</dd>
          </div>
          <div>
            <dt>Platform</dt>
            <dd>{runtimeInfo.platform}</dd>
          </div>
          <div>
            <dt>Terminal</dt>
            <dd>Not implemented yet</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
