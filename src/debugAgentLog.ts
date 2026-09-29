/** Debug-mode ingest — do not log secrets. */
export function agentLog(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string,
  runId = "pre-fix",
) {
  // #region agent log
  fetch("http://127.0.0.1:7348/ingest/3fa97668-a9f4-4d61-9362-51b6a1e28d66", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "293462" },
    body: JSON.stringify({
      sessionId: "293462",
      location,
      message,
      data,
      timestamp: Date.now(),
      hypothesisId,
      runId,
    }),
  }).catch(() => {});
  // #endregion
}
