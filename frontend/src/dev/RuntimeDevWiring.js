import React, { useEffect } from "react";

import {
  useRuntimeTriggers
} from "../context/RuntimeTriggersContext";


export default function RuntimeDevWiring() {

  const triggers =
    useRuntimeTriggers();


  useEffect(() => {

    // =====================================================
    // MIC DEBUG
    // =====================================================

    const unregisterMic =
      triggers.registerTrigger({

        name:
          "mic-toggle-log",

        event:
          "media.micEnabled",

        condition:
        ({ state, changedKeys }) => {

          const call =
            state?.call;


          console.log(
            "[USER_LEFT TRIGGER] evaluating",
            {
              changedKeys,
              callId: call?.id,
              joined: call?.joined,
              participantLeft: call?.participantLeft,
              participants: call?.participants,
              remoteUsers: call?.remoteUsers,
            }
          );


          if (
            !call?.id ||
            !call?.joined
          ) {

            console.log(
              "[USER_LEFT TRIGGER] blocked - not joined"
            );

            return false;

          }


          const participants =
            call?.participants ?? 0;


          const passed =
            participants === 0;


          console.log(
            "[USER_LEFT TRIGGER] condition result",
            {
              participants,
              passed
            }
          );


          return passed;

        },

        actions:
          ["log.debug"],

      });


    // =====================================================
    // 1-TO-1 PARTICIPANT LEFT
    // =====================================================

    const unregisterParticipantLeft =
      triggers.registerTrigger({

        name:
          "one-to-one-participant-left",

        event:
          "call.participantLeft",

        condition:
          ({ state }) => {

            const call =
              state?.call;


            // We only terminate the local side
            // if we are currently in a call.

            if (
              !call?.id ||
              !call?.joined
            ) {

              return false;

            }


            // A 1-to-1 call has no remaining
            // remote participant after USER_LEFT.

            const participants =
              call?.participants ?? 0;


            return participants === 0;

          },

        actions:
          [
            "call.endCall"
          ],

      });


    return () => {

      unregisterMic?.();

      unregisterParticipantLeft?.();

    };

  }, [
    triggers
  ]);


  return null;

}