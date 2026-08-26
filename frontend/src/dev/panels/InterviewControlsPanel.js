import React from "react";
import { useRuntimeValue } from "../../hooks/useRuntimeValue";
import { useActionContext } from "../../context/ActionContext";

export default function InterviewControlsPanel() {

  const interview =
    useRuntimeValue("interview") || {};

  const { runAction } = useActionContext();

  const startInterview = async () => {

    console.log(
      "[InterviewTest] Starting interview"
    );

    const result =
      await runAction(
        "interview.start"
      );

    console.log(
      "[InterviewTest] start result:",
      result
    );

  };


  const nextQuestion = async () => {

    console.log(
      "[InterviewTest] Next question"
    );

    const result =
      await runAction(
        "interview.nextQuestion"
      );

    console.log(
      "[InterviewTest] next result:",
      result
    );

  };

  const submitAnswer = async () => {

  console.log(
    "[InterviewTest] Submitting answer"
  );

  const result =
    await runAction(
      "interview.submitAnswer",
      {
        text:
          "I solved a difficult technical problem by breaking it into smaller components, identifying the root cause, testing each assumption, and then implementing the solution."
      }
    );

  console.log(
    "[InterviewTest] submit result:",
    result
  );

};

const evaluateInterview = async () => {

  console.log(
    "[InterviewTest] Evaluating interview"
  );

  const result =
    await runAction(
      "interview.evaluate"
    );

  console.log(
    "[InterviewTest] evaluation result:",
    result
  );

};

  return (
    <div>

      <div
        style={{
          fontWeight: "bold",
          marginBottom: 10,
        }}
      >
        AI Interview
      </div>


      <div
        style={{
          fontSize: 11,
          color: "#aaa",
          marginBottom: 10,
        }}
      >

        <div>
          Status: {interview.status}
        </div>

        <div>
          Question:{" "}
          {interview.currentQuestionIndex + 1}
          {" / "}
          {interview.questions?.length || 0}
        </div>

      </div>


      <div
        style={{
          background: "#111",
          border: "1px solid #333",
          borderRadius: 6,
          padding: 10,
          marginBottom: 10,
          fontSize: 12,
        }}
      >

        {interview.currentQuestion ||
          "No active question"}

      </div>


      <div
        style={{
          display: "flex",
          gap: 8,
        }}
      >

        <button
          onClick={startInterview}
          style={{
            flex: 1,
            minHeight: 36,
            cursor: "pointer",
          }}
        >
          Start Interview
        </button>

        <button
            onClick={submitAnswer}
            disabled={
                interview.status !== "active"
            }
            style={{
                flex: 1,
                minHeight: 36,
                cursor:
                interview.status === "active"
                    ? "pointer"
                    : "not-allowed",
            }}
            >
            Submit Test Answer
        </button>


        <button
          onClick={nextQuestion}
          disabled={
            interview.status !== "active"
          }
          style={{
            flex: 1,
            minHeight: 36,
            cursor:
              interview.status === "active"
                ? "pointer"
                : "not-allowed",
          }}
        >
          Next Question
        </button>

        <button
            onClick={evaluateInterview}
            disabled={
                interview.status !== "completed"
            }
            style={{
                flex: 1,
                minHeight: 36,
                cursor:
                interview.status === "completed"
                    ? "pointer"
                    : "not-allowed",
            }}
            >
            Evaluate Interview
        </button>

      </div>

    </div>
  );
}