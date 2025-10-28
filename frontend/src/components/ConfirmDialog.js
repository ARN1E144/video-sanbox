import React from "react";

export default function ConfirmDialog({ title, message, onSave, onDiscard, onCancel }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-panel rounded-lg shadow-xl p-5 w-[320px] border border-border">
        <h3 className="text-lg font-semibold mb-2 text-text-primary">{title}</h3>
        <p className="text-sm text-text-muted mb-4">{message}</p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onDiscard}
            className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-sm"
          >
            Discard
          </button>
          <button
            onClick={onSave}
            className="px-3 py-1 rounded bg-accent hover:bg-accent-light text-white text-sm"
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
