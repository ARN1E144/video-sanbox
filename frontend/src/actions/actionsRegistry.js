// src/actions/actionsRegistry.js

export const ACTIONS = [
  {
    id: "console_log",
    label: "Console Log",
    description: "Log a message to the browser console",
    params: [
      { name: "message", label: "Message", type: "text", default: "Button clicked!" }
    ],
    handler: (params) => {
      console.log(params.message);
    },
  },
  {
    id: "navigate",
    label: "Navigate",
    description: "Navigate to another screen (placeholder)",
    params: [
      { name: "path", label: "Path", type: "text", default: "/dashboard" }
    ],
    handler: (params) => {
      alert(`Would navigate to: ${params.path}`);
    },
  },
  {
    id: "db_create",
    label: "DB: Create Record",
    description: "Simulated DB write (will be wired to MongoDB later)",
    params: [
      { name: "collection", label: "Collection", type: "text", default: "users" },
      { name: "role", label: "Role", type: "text", default: "operative" }
    ],
    handler: (params) => {
      alert(`Simulated DB write to ${params.collection} with role ${params.role}`);
    },
  }
];
