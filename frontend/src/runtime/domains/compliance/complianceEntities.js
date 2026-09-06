/**
 * Compliance domain entity factories.
 *
 * These provide predictable shapes for runtime data.
 * They do not contain business logic.
 */

export function createOrganisation(data = {}) {
  return {
    id: data.id ?? null,
    name: data.name ?? "",
    industry: data.industry ?? "",
    ownerId: data.ownerId ?? null,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

export function createFramework(data = {}) {
  return {
    id: data.id ?? null,
    name: data.name ?? "",
    version: data.version ?? "",
    status: data.status ?? "active",
    controlCount: data.controlCount ?? 0,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

export function createControl(data = {}) {
  return {
    id: data.id ?? null,
    frameworkId: data.frameworkId ?? null,

    reference: data.reference ?? "",

    title: data.title ?? "",

    summary: data.summary ?? "",

    theme: data.theme ?? "",

    ownerId: data.ownerId ?? null,

    status: data.status ?? "not_assessed",

    riskLevel: data.riskLevel ?? "medium",

    evidenceRequired: data.evidenceRequired ?? true,

    evidenceIds: Array.isArray(data.evidenceIds)
      ? data.evidenceIds
      : [],

    actionIds: Array.isArray(data.actionIds)
      ? data.actionIds
      : [],

    lastReviewedAt: data.lastReviewedAt ?? null,

    nextReviewAt: data.nextReviewAt ?? null,
  };
}

export function createEvidence(data = {}) {
  return {
    id: data.id ?? null,

    controlId: data.controlId ?? null,

    name: data.name ?? "",

    description: data.description ?? "",

    type: data.type ?? "document",

    source: data.source ?? "upload",

    url: data.url ?? null,

    uploadedBy: data.uploadedBy ?? null,

    uploadedAt: data.uploadedAt ?? null,

    expiresAt: data.expiresAt ?? null,

    status: data.status ?? "pending",

    aiAssessment: data.aiAssessment ?? null,

    reviewedBy: data.reviewedBy ?? null,

    reviewedAt: data.reviewedAt ?? null,
  };
}

export function createRisk(data = {}) {
  return {
    id: data.id ?? null,

    title: data.title ?? "",

    description: data.description ?? "",

    ownerId: data.ownerId ?? null,

    likelihood: data.likelihood ?? 1,

    impact: data.impact ?? 1,

    score: data.score ?? 1,

    status: data.status ?? "open",

    treatment: data.treatment ?? "accept",

    treatmentPlan: data.treatmentPlan ?? "",

    dueDate: data.dueDate ?? null,

    createdAt: data.createdAt ?? null,

    updatedAt: data.updatedAt ?? null,
  };
}

export function createAction(data = {}) {
  return {
    id: data.id ?? null,

    title: data.title ?? "",

    description: data.description ?? "",

    ownerId: data.ownerId ?? null,

    sourceType: data.sourceType ?? null,

    sourceId: data.sourceId ?? null,

    status: data.status ?? "open",

    priority: data.priority ?? "medium",

    dueDate: data.dueDate ?? null,

    completedAt: data.completedAt ?? null,

    createdAt: data.createdAt ?? null,
  };
}

export function createPolicy(data = {}) {
  return {
    id: data.id ?? null,

    name: data.name ?? "",

    description: data.description ?? "",

    ownerId: data.ownerId ?? null,

    status: data.status ?? "draft",

    version: data.version ?? 1,

    publishedAt: data.publishedAt ?? null,

    nextReviewAt: data.nextReviewAt ?? null,

    documentUrl: data.documentUrl ?? null,
  };
}

export function createSupplier(data = {}) {
  return {
    id: data.id ?? null,

    name: data.name ?? "",

    category: data.category ?? "",

    ownerId: data.ownerId ?? null,

    riskLevel: data.riskLevel ?? "medium",

    status: data.status ?? "active",

    reviewDueAt: data.reviewDueAt ?? null,

    lastReviewedAt: data.lastReviewedAt ?? null,
  };
}

export function createTrainingRecord(data = {}) {
  return {
    id: data.id ?? null,

    userId: data.userId ?? null,

    course: data.course ?? "",

    status: data.status ?? "required",

    assignedAt: data.assignedAt ?? null,

    completedAt: data.completedAt ?? null,

    expiresAt: data.expiresAt ?? null,
  };
}

export function createAudit(data = {}) {
  return {
    id: data.id ?? null,

    name: data.name ?? "",

    frameworkId: data.frameworkId ?? null,

    auditorId: data.auditorId ?? null,

    status: data.status ?? "planned",

    startedAt: data.startedAt ?? null,

    completedAt: data.completedAt ?? null,

    findingIds: Array.isArray(data.findingIds)
      ? data.findingIds
      : [],
  };
}