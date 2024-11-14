import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import useStreamedResponse from "@/features/chat/hooks/chat";
import {
  getUserDocumentMessages,
  Message,
} from "@/features/chat/services/chat.service";
import { getUserDocument } from "@/features/chat/services/documents.service";
import { useStore } from "@/features/user/store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { Book, Bot, Send } from "lucide-react";
import { useState } from "react";
import Markdown from "react-markdown";
import { useParams } from "react-router-dom";
import { DragAndDrop } from "./home";

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
    staleTime: Infinity,
    enabled: !!param.id && !!userState.user_id,
  });

  if (!param.id) {
    return (
      <main className={"flex justify-center self-center w-full h-full"}>
        <DragAndDrop />
      </main>
    );
  }

  return (
    <main className={"flex flex-col w-full"}>
      <ChatHeader />
      <MessageList messages={messages} documentId={param.id} />
    </main>
  );
}

export function ChatInput(props: { onSubmit: (message: string) => void }) {
  const [text, setText] = useState("");

  return (
    <div className="mt-auto w-full px-12 py-4 rounded-full flex flex-col sticky bottom-0">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key == "Enter" && e.ctrlKey) {
            props.onSubmit(text);
            setText("");
          }
        }}
        className="rounded-md h-[4.5rem] text-2xl focus-visible:ring-2 focus-visible:ring-blue-300 bg-background"
        placeholder="Ingresa una pregunta sobre el documento"
      />
      <div className="border border-1 rounded-full justify-end absolute top-9 right-14">
        <Button
          onClick={() => {
            props.onSubmit(text);
            setText("");
          }}
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

export function MessageList(props: {
  messages: Message[] | undefined;
  documentId: string;
}) {
  const [question, setQuestion] = useState("");

  const handleMessageSubmit = (message: string) => {
    setQuestion(message);
  };

  const client = useQueryClient();

  return (
    <>
      <div className="flex flex-col flex-1 m-5 gap-2">
        {props.messages?.map((msg, i) => {
          return <MessageItem key={`message-${i}`} msg={msg} />;
        })}
        {question && <MessageItem msg={{ contents: question, is_ai: false }} />}
        {question && (
          <AnswerPreview
            question={question}
            documentId={props.documentId}
            onFinish={() => {
              setQuestion("");
              client.invalidateQueries({
                queryKey: ["messages"],
              });
            }}
          />
        )}
      </div>
      <ChatInput onSubmit={handleMessageSubmit} />
    </>
  );
}

function AnswerPreview({
  question,
  documentId,
  onFinish,
}: {
  question: string;
  documentId: string;
  onFinish: () => void;
}) {
  const result = useStreamedResponse({ question, documentId });

  if (!result) {
    return null;
  }
  const { answer, status } = result;

  if (status == "ended") {
    onFinish();
  } else if (status == "pending") {
    return null;
  }

  return (
    <MessageItem
      msg={{ contents: answer, is_ai: true }}
      isStreaming={status == "streaming"}
    />
  );
}

function MessageItem({
  msg,
  isStreaming = false,
}: {
  msg: Message;
  isStreaming?: boolean;
}) {
  const className = clsx({
    "bg-gray-200 ms-auto p-7 rounded-lg max-w-[50%] text-right": !msg.is_ai,
    "bg-white me-auto p-7 rounded-lg border border-1 drop-shadow-md max-w-[70%]":
      msg.is_ai,
  });
  return (
    <div className={className}>
      {msg.is_ai ? (
        <Bot className={isStreaming ? "animate-bounce" : ""} />
      ) : (
        <Send />
      )}
      <Markdown>{msg.contents}</Markdown>
    </div>
  );
}
