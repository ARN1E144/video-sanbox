#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// 🧭 ESM helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Force the correct path to the elements folder
const baseDir = path.join(
  __dirname,
  "..",
  "frontend",
  "src",
  "components",
  "elements"
);
const registryFile = path.join(baseDir, "registry.js");

console.log(`📍 Elements directory: ${baseDir}`);

// 🧱 Template generator functions
const templatesByType = {
  default: (name) => `import React from "react";
import { useTheme } from "../../context/ThemeContext";

export default function ${name}({ label, style }) {
  const theme = useTheme();
  return (
    <div
      className="w-full h-full flex items-center justify-center font-medium"
      style={{
        backgroundColor: style?.backgroundColor || theme.colors.surface,
        color: style?.color || theme.colors.textPrimary,
        borderRadius: style?.borderRadius || theme.radius.md,
        fontFamily: theme.typography.fontFamily,
      }}
    >
      {label || "${name}"}
    </div>
  );
}
`,

  videofeed: (name) => `import React from "react";
import { useTheme } from "../../context/ThemeContext";

export default function ${name}({ label, style }) {
  const theme = useTheme();
  return (
    <div
      className="flex items-center justify-center w-full h-full font-medium"
      style={{
        backgroundColor: style?.backgroundColor || theme.colors.background,
        color: style?.color || theme.colors.textPrimary,
        borderRadius: style?.borderRadius || theme.radius.md,
      }}
    >
      {label || "🎥 Video Feed"}
    </div>
  );
}
`,

  chatpanel: (name) => `import React from "react";
import { useTheme } from "../../context/ThemeContext";

export default function ${name}({ style }) {
  const theme = useTheme();
  return (
    <div
      className="w-full h-full p-3 overflow-y-auto text-sm"
      style={{
        backgroundColor: style?.backgroundColor || theme.colors.surface,
        color: style?.color || theme.colors.textPrimary,
        borderRadius: style?.borderRadius || theme.radius.md,
        fontFamily: theme.typography.fontFamily,
      }}
    >
      <div>Hello!</div>
      <div>👋 Hi!</div>
      <div>How are you?</div>
    </div>
  );
}
`,

  text: (name) => `import React from "react";
import { useTheme } from "../../context/ThemeContext";

export default function ${name}({ label, style }) {
  const theme = useTheme();
  return (
    <div
      className="w-full h-full flex items-center justify-center text-center"
      style={{
        color: style?.color || theme.colors.textPrimary,
        fontSize: style?.fontSize || theme.typography.baseSize,
        fontFamily: theme.typography.fontFamily,
      }}
    >
      {label || "Text Label"}
    </div>
  );
}
`,

  button: (name) => `import React from "react";
import { useTheme } from "../../context/ThemeContext";

export default function ${name}({ label, style }) {
  const theme = useTheme();
  return (
    <button
      className="w-full h-full flex items-center justify-center text-sm font-medium transition hover:opacity-90"
      style={{
        backgroundColor: style?.backgroundColor || theme.colors.accent,
        color: style?.color || theme.colors.textPrimary,
        borderRadius: style?.borderRadius || theme.radius.md,
        padding: style?.padding || theme.spacing.md,
        fontFamily: theme.typography.fontFamily,
      }}
    >
      {label || "Button"}
    </button>
  );
}
`,

  container: (name) => `import React from "react";
import { useTheme } from "../../context/ThemeContext";

export default function ${name}({ style }) {
  const theme = useTheme();
  return (
    <div
      className="w-full h-full"
      style={{
        backgroundColor: style?.backgroundColor || theme.colors.surface,
        borderRadius: style?.borderRadius || theme.radius.lg,
      }}
    ></div>
  );
}
`,

  appbar: (name) => `import React from "react";
import { useTheme } from "../../context/ThemeContext";

export default function ${name}({ label, style }) {
  const theme = useTheme();
  return (
    <div
      className="w-full h-full flex items-center px-4"
      style={{
        backgroundColor: style?.backgroundColor || theme.colors.background,
        color: style?.color || theme.colors.textPrimary,
        fontWeight: theme.typography.headingWeight,
        fontSize: style?.fontSize || 18,
        fontFamily: theme.typography.fontFamily,
      }}
    >
      {label || "App Header"}
    </div>
  );
}
`,
};

// 🪄 Default metadata by type
const defaultMeta = {
  button: {
    category: "controls",
    icon: "🔘",
    editableProps: {
      label: "Button",
      style: {
        backgroundColor: "#7C3AED",
        color: "#FFFFFF",
        borderRadius: "8px",
        padding: "16px",
      },
    },
  },
  videofeed: {
    category: "media",
    icon: "🎥",
    editableProps: {
      label: "Video Feed",
      style: { backgroundColor: "#000000", borderRadius: "12px" },
    },
  },
  chatpanel: {
    category: "media",
    icon: "💬",
    editableProps: {
      style: { backgroundColor: "#1A1A1D", color: "#FFFFFF" },
    },
  },
  text: {
    category: "text",
    icon: "🔤",
    editableProps: {
      label: "Text",
      style: { color: "#FFFFFF", fontSize: "16px" },
    },
  },
  container: {
    category: "layout",
    icon: "⬛",
    editableProps: {
      style: { backgroundColor: "#1A1A1D", borderRadius: "12px" },
    },
  },
  appbar: {
    category: "layout",
    icon: "🧭",
    editableProps: {
      label: "App Header",
      style: { backgroundColor: "#000000", color: "#FFFFFF", fontSize: "18px" },
    },
  },
  default: {
    category: "misc",
    icon: "🧩",
    editableProps: {
      label: "Component",
      style: { backgroundColor: "#1A1A1D", color: "#FFFFFF" },
    },
  },
};

// 🧱 Core elements for full scaffold
const coreElements = [
  { name: "VideoFeed", type: "videofeed" },
  { name: "ChatPanel", type: "chatpanel" },
  { name: "TextLabel", type: "text" },
  { name: "ControlButton", type: "button" },
  { name: "Container", type: "container" },
  { name: "AppBar", type: "appbar" },
];

// 📁 Ensure directory exists
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, { recursive: true });
  console.log(`📁 Created folder: ${baseDir}`);
}

// 🧰 CLI args
const args = process.argv.slice(2);
const newElementName = args[0];
const typeArg = args.find((arg) => arg.startsWith("--type="));
const type = typeArg ? typeArg.split("=")[1].toLowerCase() : "default";

// ✨ Helpers
function createElementFile(name, template) {
  const filePath = path.join(baseDir, `${name}.js`);
  if (fs.existsSync(filePath)) {
    console.log(`⚠️  ${name}.js already exists. Skipping.`);
    return false;
  }
  fs.writeFileSync(filePath, template.trim() + "\n");
  console.log(`✅ Created ${name}.js`);
  return true;
}

function createMetaFile(name, type) {
  const filePath = path.join(baseDir, `${name}.meta.json`);
  if (fs.existsSync(filePath)) {
    console.log(`⚠️  ${name}.meta.json already exists. Skipping.`);
    return false;
  }
  const defaults = defaultMeta[type] || defaultMeta.default;
  const meta = { name, type, ...defaults };
  fs.writeFileSync(filePath, JSON.stringify(meta, null, 2));
  console.log(`📝 Created ${name}.meta.json`);
  return true;
}

function updateRegistry() {
  const files = fs
    .readdirSync(baseDir)
    .filter((f) => f.endsWith(".js") && f !== "registry.js");

  let imports = "";
  let exports = "export const COMPONENTS = {\n";

  files.forEach((file) => {
    const name = file.replace(".js", "");
    imports += `import ${name} from "./${file}";\n`;
    exports += `  ${name},\n`;
  });

  exports += "};\n";

  fs.writeFileSync(registryFile, imports + "\n" + exports);
  console.log(`🪄 Updated registry.js with ${files.length} components.`);
}

// 🆕 Single element creation
if (newElementName) {
  const formattedName =
    newElementName.charAt(0).toUpperCase() + newElementName.slice(1);
  const templateFn = templatesByType[type] || templatesByType.default;
  createElementFile(formattedName, templateFn(formattedName));
  createMetaFile(formattedName, type);
  updateRegistry();
  process.exit(0);
}

// 🧱 Full scaffold creation
for (const el of coreElements) {
  const templateFn = templatesByType[el.type] || templatesByType.default;
  createElementFile(el.name, templateFn(el.name));
  createMetaFile(el.name, el.type);
}
updateRegistry();
console.log("\n🚀 Element creation completed successfully!");
