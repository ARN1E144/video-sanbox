// =====================================================
// COMPLIANCE EVIDENCE COMPONENT CONTRACT
// =====================================================

export default {

  // =====================================================
  // IDENTITY
  // =====================================================

  name:
    "ComplianceEvidence",

  type:
    "ComplianceEvidence",

  version:
    1,

  category:
    "business",


  // =====================================================
  // BUILDER
  // =====================================================

  builder: {

    roles: [
      "owner",
      "admin",
      "builder",
    ],

  },


  // =====================================================
  // RUNTIME
  // =====================================================

  runtime: {

    roles: [
      "owner",
      "admin",
      "builder",
      "compliance_manager",
      "control_owner",
      "employee",
      "auditor",
    ],

  },


  // =====================================================
  // ACTIONS
  // =====================================================

  actions: {

    outputs: [],

    inputs: [

      "compliance.load",

      "compliance.requestEvidence",

      "compliance.uploadEvidence",

      "compliance.analyseEvidence",

      "compliance.acceptEvidence",

      "compliance.rejectEvidence",

    ],

  },


  // =====================================================
  // TARGETS
  // =====================================================

  targets: {

    accepts: [

      "ControlButton",

      "Text",

      "TextLabel",

      "Container",

      "FilePreview",

    ],

    rejects: [],

    runtime: [

      "compliance.evidence",

      "compliance.controls",

      "compliance.framework",

    ],

  },


  // =====================================================
  // VALIDATION
  // =====================================================

  validation: {

    required: [],

  },


  // =====================================================
  // EDITABLE PROPERTIES
  // =====================================================

  editableProps: {

    controlId: {

      type:
        "string",

      label:
        "Control ID",

    },

    showStatus: {

      type:
        "boolean",

      label:
        "Show Status",

    },

    showAssessment: {

      type:
        "boolean",

      label:
        "Show AI Assessment",

    },

    showActions: {

      type:
        "boolean",

      label:
        "Show Actions",

    },

    compact: {

      type:
        "boolean",

      label:
        "Compact",

    },

  },


  // =====================================================
  // BINDINGS
  // =====================================================

  bindings: {

    evidence:
      true,

    controls:
      true,

    framework:
      true,

  },


  // =====================================================
  // CAPABILITIES
  // =====================================================

  capabilities: {

    compliance:
      true,

    evidence:
      true,

    aiAssessment:
      true,

    humanReview:
      true,

  },

};