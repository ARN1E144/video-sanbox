import api from "../../services/api";
import {
  createInitialComplianceState,
} from "../../runtime/domains/compliance/ComplianceState";

export default async function loadCompliance(ctx) {
  try {
    console.log(
      "[compliance.load] Loading compliance data..."
    );

    const { data } = await api.get("/compliance");

    const response = data || {};

    const initialState =
      createInitialComplianceState();

    // =====================================================
    // NORMALISE API RESPONSE
    // =====================================================

    const organisation =
      response.organisation ??
      initialState.organisation;

    const framework =
      response.framework ??
      initialState.framework;

    const controls =
      Array.isArray(response.controls)
        ? response.controls
        : [];

    const evidence =
      Array.isArray(response.evidence)
        ? response.evidence
        : [];

    const risks =
      Array.isArray(response.risks)
        ? response.risks
        : [];

    const actions =
      Array.isArray(response.actions)
        ? response.actions
        : [];

    const policies =
      Array.isArray(response.policies)
        ? response.policies
        : [];

    const suppliers =
      Array.isArray(response.suppliers)
        ? response.suppliers
        : [];

    const training =
      Array.isArray(response.training)
        ? response.training
        : [];

    const audits =
      Array.isArray(response.audits)
        ? response.audits
        : [];

    const notifications =
      Array.isArray(response.notifications)
        ? response.notifications
        : [];

    const activity =
      Array.isArray(response.activity)
        ? response.activity
        : [];

    // =====================================================
    // DERIVED COMPLIANCE METRICS
    // =====================================================

    const metrics = {
      ...initialState.metrics,
      ...(response.metrics || {}),
    };

    // =====================================================
    // WRITE TO RUNTIME STATE
    //
    // Compliance owns the "compliance" namespace.
    //
    // Result:
    //
    // runtime.compliance.organisation
    // runtime.compliance.framework
    // runtime.compliance.controls
    // runtime.compliance.evidence
    // runtime.compliance.risks
    // runtime.compliance.actions
    // runtime.compliance.policies
    // runtime.compliance.suppliers
    // runtime.compliance.training
    // runtime.compliance.audits
    // runtime.compliance.notifications
    // runtime.compliance.activity
    // runtime.compliance.metrics
    // =====================================================

    ctx.patch?.(
      "compliance",
      {
        organisation,

        framework,

        controls,

        evidence,

        risks,

        actions,

        policies,

        suppliers,

        training,

        audits,

        notifications,

        activity,

        metrics,

        loading: false,

        loaded: true,

        lastUpdated: Date.now(),

        error: null,
      }
    );

    console.log(
      "[compliance.load] Runtime state updated",
      {
        organisation,
        framework,

        controls: controls.length,
        evidence: evidence.length,
        risks: risks.length,
        actions: actions.length,
        policies: policies.length,
        suppliers: suppliers.length,
        training: training.length,
        audits: audits.length,

        metrics,
      }
    );

    return {
      ok: true,

      result: {
        organisation,

        framework,

        controls,

        evidence,

        risks,

        actions,

        policies,

        suppliers,

        training,

        audits,

        notifications,

        activity,

        metrics,
      },
    };
  } catch (err) {
    console.error(
      "[compliance.load]",
      err
    );

    ctx.patch?.(
      "compliance",
      {
        loading: false,

        loaded: false,

        error:
          err?.message ||
          "Failed to load compliance data",
      }
    );

    return {
      ok: false,

      error:
        err?.message ||
        "Failed to load compliance data",
    };
  }
}