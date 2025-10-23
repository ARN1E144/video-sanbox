import { useState } from "react";

export default function PromptForm({ onTemplateGenerated }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt) return;

    setLoading(true);
    try {
      onTemplateGenerated(prompt);
    } catch (err) {
      console.error(err);
      alert("Failed to generate template.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 flex w-full gap-3">
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your app idea..."
        className="flex-1 bg-panel text-text-primary placeholder-text-muted border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-5 py-2 rounded-lg bg-accent hover:bg-accent-light text-white font-medium transition disabled:opacity-60"
      >
        {loading ? "Generating..." : "Generate"}
      </button>
    </form>
  );
}
