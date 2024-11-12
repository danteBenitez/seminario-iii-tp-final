export async function* readStream<T>(
    reader: ReadableStreamDefaultReader<T>
): AsyncGenerator<ReadableStreamReadResult<T>> {
    let read = await reader.read();
    yield read;
    while (!read.done) {
        read = await reader.read();
        yield read;
    }
}