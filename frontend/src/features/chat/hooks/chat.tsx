import { useEffect, useState } from "react";
import { getStreamedResponse } from "../services/chat.service";

type StreamingStatus = "started" | "pending" | "streaming" | "ended";

export function useStreamedResponse({
  question,
  documentId,
}: {
  question?: string;
  documentId: string;
}) {
  const [status, setStatus] = useState<StreamingStatus>("pending");
  const [context, setContext] = useState<
    {
      page_content: string;
      metadata: string;
    }[]
  >([]);

  const [answer, setAnswer] = useState("");

  useEffect(() => {
    if (!question || !documentId) {
      return;
    }
    const controller = new AbortController();
    const getResponse = async () => {
      setStatus("streaming");
      for await (const value of getStreamedResponse({
        text: question,
        document_id: documentId,
        controller,
      })) {
        if ("context" in value) {
          setContext((context) => [...context, value.context]);
        }
        if ("answer" in value) {
          setAnswer((answer) => answer + value.answer);
        }
      }
      setStatus("ended");
    };

    getResponse();

    return () => controller.abort();
  }, [documentId, question]);

  if (!question) {
    return null;
  }

  return { answer, status, context };
}

export default useStreamedResponse;
