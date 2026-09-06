// =====================================================
// DOMAIN CONTRACT REGISTRY
// =====================================================

import complianceContract
  from "./Compliance.contract.js";


// =====================================================
// REGISTRY
// =====================================================

export const domainRegistry = {

  compliance: {

    contract:
      complianceContract,

  },

};


// =====================================================
// DEBUG
// =====================================================

console.log(
  "[DOMAIN REGISTRY LOADED]",
  {
    domains:
      Object.keys(
        domainRegistry
      ),
  }
);


// =====================================================
// EXPORT
// =====================================================

export default domainRegistry;