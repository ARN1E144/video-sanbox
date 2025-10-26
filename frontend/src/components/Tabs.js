export default function Tabs({ activeTab, setActiveTab, tabs }) {
  return (
    <div className="flex mb-3 border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`flex-1 py-1 text-sm transition ${
            activeTab === tab
              ? "text-accent border-b-2 border-accent"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
