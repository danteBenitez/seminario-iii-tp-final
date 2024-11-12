import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import { getStreamedResponse } from "../services/chat.service";

export function Chat() {
  const [context, setContext] = useState<
    {
      page_content: string;
      metadata: string;
    }[]
  >([]);
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const getResponse = async () => {
      for await (const value of getStreamedResponse({
        text: "¿Qué es Clean Code?",
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
  }, []);

  return (
    <div>
      <div></div>
      <Markdown>{answer}</Markdown>
    </div>
  );
}

export default Chat;
