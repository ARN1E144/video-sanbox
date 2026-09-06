export default {

  name: "Compliance",

  version: "1.0",

  category: "business",

  icon: "🛡️",


  builder: {

    roles: [
      "owner",
      "admin"
    ],

    visible: true

  },


  runtime: {

    roles: [
      "owner",
      "admin",
      "compliance_manager",
      "control_owner",
      "employee",
      "auditor"
    ]

  },


  bindings: {

    organisation: {
      type: "object"
    },

    framework: {
      type: "object"
    },

    controls: {
      type: "array"
    },

    evidence: {
      type: "array"
    },

    risks: {
      type: "array"
    },

    actions: {
      type: "array"
    },

    policies: {
      type: "array"
    },

    suppliers: {
      type: "array"
    },

    training: {
      type: "array"
    },

    audits: {
      type: "array"
    }

  },


  actions: {

    inputs: [

      "compliance.load",

      "compliance.createRisk",

      "compliance.updateRisk",

      "compliance.requestEvidence",

      "compliance.uploadEvidence",

      "compliance.reviewEvidence",

      "compliance.acceptEvidence",

      "compliance.rejectEvidence",

      "compliance.createAction",

      "compliance.assignAction",

      "compliance.completeAction",

      "compliance.createPolicy",

      "compliance.approvePolicy",

      "compliance.publishPolicy",

      "compliance.startAudit",

      "compliance.completeAudit",

      "compliance.analyseEvidence"

    ],

    outputs: []

  },


  events: {

    inputs: [],

    outputs: [

      "compliance.loaded",

      "compliance.evidenceRequested",

      "compliance.evidenceUploaded",

      "compliance.evidenceAccepted",

      "compliance.evidenceRejected",

      "compliance.controlStatusChanged",

      "compliance.riskCreated",

      "compliance.actionCreated",

      "compliance.actionCompleted",

      "compliance.policyApproved",

      "compliance.policyPublished",

      "compliance.auditStarted",

      "compliance.auditCompleted",

      "compliance.evidenceReviewRequired"

    ]

  },


  targets: {

    accepts: [

      "ComplianceDashboard",

      "ComplianceFramework",

      "ComplianceControl",

      "ComplianceEvidence",

      "ComplianceRisk",

      "ComplianceAction",

      "CompliancePolicy",

      "ComplianceAudit"

    ],

    rejects: []

  },


  validation: {

    required: [

      "framework"

    ]

  }

};