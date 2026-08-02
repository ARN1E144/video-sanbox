import React from "react";

import Section from "../components/Section";
import StatusRow from "../components/StatusRow";

import { useRuntimeValue } from "../../hooks/useRuntimeValue";
import { useRuntimeState } from "../../context/RuntimeStateContext";


export default function RuntimeSection() {


    const runtime =
        useRuntimeState();



    // =====================================================
    // RUNTIME
    // =====================================================

    const runtimeReady =
        runtime.runtimeReady;



    // =====================================================
    // CALL STATE
    // =====================================================

    const callId =
        useRuntimeValue(
            "call.id"
        );


    const channel =
        useRuntimeValue(
            "call.channel"
        );


    const state =
        useRuntimeValue(
            "call.state"
        );


    const joined =
        useRuntimeValue(
            "call.joined"
        );


    const micEnabled =
    useRuntimeValue(
        "media.micEnabled"
    );


    const videoEnabled =
        useRuntimeValue(
            "media.videoEnabled"
        );


    const remoteUsers =
        useRuntimeValue(
            "call.remoteUsers"
        );


    const participants =
        useRuntimeValue(
            "call.participants"
        );


    const availableCalls =
        useRuntimeValue(
            "calls.available"
        );



    // =====================================================
    // UI
    // =====================================================

    return (

        <Section
            title="Runtime"
        >

            <StatusRow
                label="Runtime Ready"
                value={runtimeReady}
            />


            <StatusRow
                label="Call ID"
                value={callId}
            />


            <StatusRow
                label="Channel"
                value={channel}
            />


            <StatusRow
                label="State"
                value={state}
            />


            <StatusRow
                label="Joined"
                value={joined}
            />


            <StatusRow
                label="Mic Enabled"
                value={micEnabled}
            />


            <StatusRow
                label="Video Enabled"
                value={videoEnabled}
            />


            <StatusRow
                label="Remote Users"
                value={
                    remoteUsers?.length ?? 0
                }
            />


            <StatusRow
                label="Participants"
                value={
                    participants?.length ?? 0
                }
            />


            <StatusRow
                label="Available Calls"
                value={
                    availableCalls?.length ?? 0
                }
            />

        </Section>

    );

}