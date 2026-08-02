

import api from "../../services/api";

export default async function fetchAvailableCalls(ctx) {

  try {

    const { data } = await api.get(
      "/calls/available"
    );


    const calls = data?.calls || [];


    // =====================================================
    // 🔥 SINGLE SOURCE OF TRUTH
    // Available calls are discovery state,
    // not the active call state.
    // =====================================================

    ctx.patch?.("calls", {

      available: calls,

      loading: false,

      lastUpdated: Date.now(),

    });


    return {

      ok: true,

      result: {

        availableCalls: calls

      }

    };


  } catch (err) {

    console.error(
      "[fetchAvailableCalls]",
      err
    );


    ctx.patch?.("calls", {

      loading: false,

    });


    return {

      ok:false,

      error:err.message

    };

  }

}
