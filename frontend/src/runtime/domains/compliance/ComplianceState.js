/**
 * Canonical runtime state for the Compliance domain.
 *
 * This is deliberately UI-independent.
 * Components consume this state through runtime bindings.
 */

export const createInitialComplianceState = () => ({
  organisation: null,

  framework: null,

  controls: [],

  evidence: [],

  risks: [],

  actions: [],

  policies: [],

  suppliers: [],

  training: [],

  audits: [],

  notifications: [],

  activity: [],

  // Derived / computed compliance metrics.
  metrics: {
    overallScore: 0,

    controlsSatisfied: 0,

    controlsOutstanding: 0,

    evidenceComplete: 0,

    overdueActions: 0,

    openRisks: 0,

    policiesDueReview: 0,

    auditReadiness: 0,
  },
});

export default createInitialComplianceState;