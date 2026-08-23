// src/actions/call/endCall.js

import api from "../../services/api";
import { CALL_IDLE_STATE } from "../../runtime/models/callIdleState";


export default async function endCall(ctx) {

    const agora =
        ctx.agora;

    const currentCall =
        ctx.get("call");


    console.log(
        "[CALL] END START",
        {
            currentCall,
        }
    );


    try {

        // =====================================================
        // 1. VALIDATE CALL
        // =====================================================

        const callId =
            currentCall?.id;


        if (!callId) {

            console.warn(
                "[CALL] END BLOCKED - missing call ID"
            );


            return {

                ok: false,

                error:
                    "MISSING_CALL_ID",

            };

        }


        // =====================================================
        // 2. END BACKEND CALL
        // =====================================================

        console.log(
            "[CALL] ENDING BACKEND CALL",
            {
                callId,
            }
        );


        const {
            data
        } =
            await api.post(
                `/calls/${callId}/end`
            );


        console.log(
            "[CALL] BACKEND END RESPONSE",
            data
        );


        if (!data?.ok) {

            console.error(
                "[CALL] BACKEND END FAILED",
                {
                    callId,
                    data,
                }
            );


            return {

                ok: false,

                error:
                    "BACKEND_END_FAILED",

            };

        }


        // =====================================================
        // 3. LEAVE AGORA
        // =====================================================

        if (
            agora &&
            currentCall?.joined
        ) {

            console.log(
                "[CALL] LEAVING AGORA",
                {
                    callId,
                }
            );


            await agora.leaveCall();

        }


        // =====================================================
        // 4. RESET RUNTIME CALL
        // =====================================================

        console.log(
            "[CALL] BEFORE IDLE PATCH",
            {
                call:
                    ctx.get("call"),
            }
        );


        ctx.patch?.(
            "call",
            {
                ...CALL_IDLE_STATE,

                endedAt:
                    Date.now(),
            }
        );


        console.log(
            "[CALL] AFTER IDLE PATCH",
            {
                call:
                    ctx.get("call"),
            }
        );


        // =====================================================
        // 5. SUCCESS
        // =====================================================

        return {

            ok: true,

            result: {

                state:
                    "idle",

            },

            ended:
                true,

        };


    } catch (error) {

        console.error(
            "[CALL] END FAILED",
            error
        );


        console.error(
            "[CALL] END RESPONSE",
            error?.response?.data
        );


        console.error(
            "[CALL] END STATUS",
            error?.response?.status
        );


        return {

            ok: false,

            error:
                error?.response?.data?.error ||
                error?.message ||
                "CALL_END_FAILED",

        };

    }

}