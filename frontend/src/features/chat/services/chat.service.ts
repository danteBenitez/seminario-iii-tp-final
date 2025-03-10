import { resolveUrl } from "@/utils/resolve-url";
import { readStream } from "../../../utils/read-stream";


export type Message = {
  contents: string;
  is_ai: boolean;
};

export async function getUserDocumentMessages(
  user_id: string,
  document_id: string
) {
  try {
    if (user_id == "" || document_id == "") {
      throw new Error("No se ha proporcionado un usuario ni documento");
    }

    const response = await fetch(
      resolveUrl(`/api/users/${user_id}/${document_id}/messages`)
    );

    if (!response.ok) {
      throw new Error("Error al obtener las mensajes.");
    }

    const data = await response.json();

    console.log("getUserDocumentMessages", data);

    return data as Message[];
  } catch (error) {
    console.log(error);
  }
}

export async function* getStreamedResponse({
  text,
  document_id,
  controller,
}: {
  text: string;
  document_id: string;
  controller: AbortController;
}) {
  const response = await fetch(resolveUrl("/api/answer"), {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    signal: controller.signal,
    body: JSON.stringify({ text, document_id }),
  });

  if (!response.body) throw new Error("No body");

  const stream = response.body?.pipeThrough(new TextDecoderStream());
  if (!stream) throw new Error("Couldn't get stream");

  for await (const chunk of readStream(stream.getReader())) {
    if (chunk.done) break;
    yield chunk.value;
  }
}
