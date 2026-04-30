const integrations = ["GitHub", "Google Drive", "Notion"];

export function IntegrationsPlaceholder() {
  return (
    <div className="rounded-card border border-border-strong bg-bg-elev p-6">
      <h2 className="text-xl font-medium text-text">Integrations</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {integrations.map((name) => (
          <div
            key={name}
            className="rounded-2xl border border-border-strong p-4"
          >
            <p className="font-medium text-text">{name}</p>
            <p className="mt-1 text-xs text-text-dim">Phase 2</p>
          </div>
        ))}
      </div>
    </div>
  );
}
