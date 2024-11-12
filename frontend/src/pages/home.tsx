import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/features/ui/logo";
import { MoveRight, UploadCloud } from "lucide-react";
import { useDropzone } from "react-dropzone";

export default function Home() {
  return (
    <main className="w-full h-auto grid place-items-center">
      <section className="flex justify-center w-full items-center flex-col gap-4 p-8 md:p-24 lg:p-36">
        <span className="border-2 p-2 rounded-full font-sans-accent px-3 hover:bg-primary-foreground flex items-center gap-2 text-xl">
          <Logo />
        </span>
        <h1 className="text-7xl max-w-[30ch] font-sans-accent font-bold animate-in m-7 text-center drop-shadow-lg z-1">
          Chatea con tus documentos. Aprovecha el potencial de la{" "}
          <span>IA</span>
        </h1>
        <p className="text-xl p-4 font-sans-accent max-w-[70ch] text-center z-1">
          Una <strong>chatbot</strong> inteligente con soporte para lectura de
          documentos. Alimenta la inteligencia artificial con la información que
          necesites resumir y hazle preguntas.
        </p>
        <Button className="text-xl p-6 flex items-center" asChild>
          <a href="#drag-drop">
            <span>Intentarlo ahora</span>
            <MoveRight />
          </a>
        </Button>
      </section>

      <section className="w-full flex justify-center items-center m-4">
        <div className="w-[80%] border border-1 rounded-md shadow-lg p-8 flex gap-2">
          <div className="py-4 px-5">
            <h2
              className="text-4xl font-sans-accent font-bold scroll-smooth"
              id="drag-drop"
            >
              Arrastra un archivo para comenzar
            </h2>
            <p className="py-3">
              Podrás hacerle preguntas ni bien termine la subida.
            </p>
            <div className="py-7">
              <h3 className="font-sans-accent font-bold">
                Archivos soportados
              </h3>
              <div className="flex gap-2 border border-1 rounded-full p-4 me-5 my-3">
                <img src="/icons/pdf.png" className="h-8 w-8" />
                <span className="text-xl text-bold">PDF</span>
              </div>
              <div className="flex gap-2 border border-1 rounded-full p-4 me-5 my-3">
                <img src="/icons/docx.png" className="h-8 w-8" />
                <span className="text-xl text-bold">DOCX</span>
              </div>
            </div>
          </div>
          <DragAndDrop />
        </div>
      </section>
    </main>
  );
}

export function DragAndDrop() {
  const { getRootProps, getInputProps } = useDropzone();

  return (
    <div className="w-1/2">
      <label
        {...getRootProps()}
        className="relative flex flex-col items-center justify-center w-full py-6 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 min-h-[25rem]"
      >
        <div className=" text-center">
          <div className=" border p-2 rounded-md max-w-min mx-auto">
            <UploadCloud size={20} />
          </div>

          <p className="mt-2 text-sm text-gray-600">
            <span className="font-semibold">Arrastra archivos</span>
          </p>
          <p className="text-xs text-gray-500">
            Haga click para subir un archivo.
          </p>
        </div>
      </label>

      <Input
        {...getInputProps()}
        id="dropzone-file"
        accept="image/png, image/jpeg"
        type="file"
        className="hidden"
      />
    </div>
  );
}
