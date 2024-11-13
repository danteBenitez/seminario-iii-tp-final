import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/features/ui/logo";
import { useStore } from "@/features/user/store";
import clsx from "clsx";
import { Book, Bot, Send } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { DragAndDrop } from "./home";
import { useQuery } from "@tanstack/react-query";
import {
  getUserDocumentMessages,
  Message,
} from "@/features/chat/services/chat.service";
import { getUserDocument } from "@/features/chat/services/documents.service";
import useStreamerResponse from "@/features/chat/hooks/chat";

export default function ChatBot() {
  const userState = useStore((state) => state);

  const param = useParams();

  const {
    data: messages,
    error,
    isLoading,
  } = useQuery({
    queryFn: () =>
      getUserDocumentMessages(userState.user_id || "", param.id || ""),
    queryKey: [
      "messages",
      { user_id: userState.user_id, document_id: param.id },
    ],
    enabled: !!param.id && !!userState.user_id,
  });

  const isFirstMessage = messages?.length == 0;
  const className = "flex flex-col justify-center  self-center w-full h-full";

  if (!param.id) {
    return (
      <main
        className={"flex flex-col justify-center  self-center w-full h-full"}
      >
        <DragAndDrop />
      </main>
    );
  }

  return (
    <main className={"flex flex-col justify-center w-full h-full"}>
      <ChatHeader />
      <MessageList messages={messages} />
    </main>
  );
}

export function ChatInput(props: { onSubmit: (message: string) => void }) {
  const [text, setText] = useState("");

  return (
    <div className="mt-auto w-full px-12 py-4 rounded-full flex flex-col sticky bottom-0">
      <Textarea
        onChange={(e) => setText(e.target.value)}
        className="rounded-md h-[4.5rem] text-2xl focus-visible:ring-2 focus-visible:ring-blue-300 bg-background"
        placeholder="Ingresa una pregunta sobre el documento"
      />
      <div className="border border-1 rounded-full justify-end absolute top-9 right-14">
        <Button
          onClick={() => props.onSubmit(text)}
          className="text-2xl flex items-center justify-center m-0 py-3"
        >
          <Send />
        </Button>
      </div>
    </div>
  );
}

export function ChatHeader() {
  const userState = useStore((state) => state);

  const param = useParams();

  const {
    data: document,
    error,
    isLoading,
  } = useQuery({
    queryFn: () => getUserDocument(userState.user_id || "", param.id || ""),
    queryKey: [
      "document",
      { user_id: userState.user_id, document_id: param.id },
    ],
    enabled: !!param.id && !!userState.user_id,
  });

  return (
    <h1 className="sticky top-0 p-4 border border-b flex gap-2 font-bold text-xl z-10 bg-background/30 backdrop-blur-md">
      <Book />
      <span>{!isLoading && document?.original_filename}</span>
    </h1>
  );
}

export function MessageList(props: { messages: Message[] | undefined }) {
  const [question, setQuestion] = useState("");

  const handleMessageSubmit = (message: string) => {
    setQuestion(message);
  };

  return (
    <>
      <div className="flex-col gap-5 p-12 mt-7 overflow-y-scroll">
        {props.messages?.map((msg) => {
          return <MessageItem msg={msg} />;
        })}
        {question && <AnswerPreview question={question} />}
      </div>
      <ChatInput onSubmit={handleMessageSubmit} />
    </>
  );
}

function AnswerPreview({ question }: { question: string }) {
  const answer = useStreamerResponse({ question });

  if (!answer) {
    return null;
  }

  return <MessageItem msg={{ contents: answer, is_ai: true }} />;
}

function MessageItem({ msg }: { msg: Message }) {
  const className = clsx({
    "bg-gray-200 ms-auto p-7 rounded-lg max-w-[50%] text-right": !msg.is_ai,
    "bg-white me-auto p-7 rounded-lg border border-1 drop-shadow-md max-w-[50%]":
      msg.is_ai,
  });
  return <div className={className}>{msg.contents}</div>;
}
