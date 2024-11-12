import { readStream } from "../../../utils/read-stream";

const resolveUrl = (url: string) => {
    return new URL(import.meta.env.VITE_API_URL, url);
}

export async function* getStreamedResponse({ text, controller }: { text: string, controller: AbortController }) {
    const response = await fetch(resolveUrl('/api/answer'), {
        method: "POST",
        headers: {
            "content-type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({ text }),
    })

    if (!response.body) throw new Error("No body");

    const stream = response.body?.pipeThrough(new TextDecoderStream());
    if (!stream) throw new Error("Couldn't get stream");

    for await (const chunk of readStream(stream.getReader())) {
        if (chunk.done) break;
        yield JSON.parse(chunk.value);
    }
}