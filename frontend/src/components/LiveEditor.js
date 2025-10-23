import React, { useState } from "react";
import { LiveProvider, LiveEditor, LivePreview, LiveError } from "react-live";

export default function LiveEditorWrapper({ code, previewOnly = false }) {
  return (
    <LiveProvider code={code} scope={{ React, useState }}>
      {previewOnly ? (
        <div className="h-full w-full bg-panel rounded-xl overflow-auto border border-border relative shadow-soft">
          <LivePreview className="w-full h-full p-4 text-text-primary" />
          <LiveError className="text-red-500 text-xs p-2 absolute bottom-0 left-0 bg-red-900 bg-opacity-20 w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 h-[70vh]">
          {/* Editor */}
          <div className="flex flex-col bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-3 py-2 bg-panel border-b border-border text-sm font-semibold text-text-primary">
              Editor
            </div>
            <LiveEditor className="flex-1 p-3 text-sm font-mono leading-relaxed bg-surface text-text-primary outline-none" />
          </div>

          {/* Preview */}
          <div className="flex flex-col bg-panel border border-border rounded-xl overflow-hidden">
            <div className="px-3 py-2 bg-surface border-b border-border text-sm font-semibold text-text-primary">
              Preview
            </div>
            <div className="flex-1 p-3 overflow-auto text-text-primary">
              <LivePreview className="w-full h-full" />
            </div>
            <LiveError className="text-red-500 text-xs p-2 bg-red-900 bg-opacity-20 border-t border-red-800" />
          </div>
        </div>
      )}
    </LiveProvider>
  );
}
