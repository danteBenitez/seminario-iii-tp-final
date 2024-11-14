import { useEffect, useState } from "react";
import { getStreamedResponse } from "../services/chat.service";

export function useStreamerResponse({
  question,
  documentId,
}: {
  question?: string;
  documentId: string;
}) {
  const [context, setContext] = useState<
    {
      page_content: string;
      metadata: string;
    }[]
  >([]);

  const [answer, setAnswer] = useState("");

  useEffect(() => {
    if (!question) {
      return;
    }
    const controller = new AbortController();
    const getResponse = async () => {
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
    };

    getResponse();

    return () => controller.abort();
  }, [documentId, question]);

  if (!question) {
    return null;
  }

  return answer;
}

export default useStreamerResponse;
