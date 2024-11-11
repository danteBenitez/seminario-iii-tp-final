import { useEffect, useState } from "react";
import ReactJson from "react-json-view";
import Markdown from "react-markdown";
import "./App.css";

async function* readStream<T>(
  reader: ReadableStreamDefaultReader<T>
): AsyncGenerator<ReadableStreamReadResult<T>> {
  let read = await reader.read();
  yield read;
  while (!read.done) {
    read = await reader.read();
    yield read;
  }
}

function App() {
  const [context, setContext] = useState<
    {
      page_content: string;
      metadata: string;
    }[]
  >([]);
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("http://localhost:8000/api/answer", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({ text: "¿Qué es Clean Code?" }),
    }).then(async (response) => {
      if (!response.body) throw new Error("No body");
      const stream = response.body?.pipeThrough(new TextDecoderStream());
      if (!stream) throw new Error("Couldn't get stream");
      for await (const chunk of readStream(stream.getReader())) {
        if (chunk.done) break;
        console.log({ value: chunk.value });
        try {
          const obj = JSON.parse(chunk.value);
          console.log({ obj });
          if ("context" in obj) {
            console.log("context: ", obj.context);
            setContext((context) => [...context, obj.context]);
          }
          if ("answer" in obj) {
            setAnswer((answer) => answer + obj.answer);
          }
        } catch (err) {
          void err;
        }
      }
    });

    return () => controller.abort();
  }, []);

  return (
    <div>
      <div>
        <ReactJson src={{ context }} />
      </div>
      <Markdown>{answer}</Markdown>
    </div>
  );
}

export default App;
