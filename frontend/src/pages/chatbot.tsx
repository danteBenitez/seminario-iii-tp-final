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
  const className = clsx({
    "w-full flex items-center justify-center overflow-y-auto": isFirstMessage,
    "w-full flex flex-col overflow-y-clip": !isFirstMessage,
  });

  if (!param.id) {
    return (
      <main className={"flex justify-center  self-center w-full h-full"}>
        <DragAndDrop />
      </main>
    );
  }

  return (
    <main className={className}>
      <ChatHeader />
      <MessageList messages={messages} />
      <ChatInput variant={isFirstMessage ? "centered" : "bottom"} />
    </main>
  );
}

export function ChatInput(props: { variant: "centered" | "bottom" }) {
  if (props.variant == "centered") {
    return (
      <div className="w-full px-2 md:px-32 flex flex-col justify-center items-center gap-9">
        <div className="flex">
          <Logo />
        </div>
        <h2 className="font-sans-accent text-7xl font-bold text-center">
          ¿Qué quieres preguntar hoy?
        </h2>
        <div className="relative flex w-full h-[4rem] rounded-full border border-1 drop-shadow-lg focus-within:ring-2">
          <Bot className="absolute top-5 left-5 text-2xl" />
          <Input
            type="text"
            placeholder="¿Qué receta vas a hacer hoy?"
            className="mx-12 h-[4rem] rounded-full drop-shadow-lg focus-visible:ring-0 border-0"
          />
          <Button className="absolute top-3 right-5 text-2xl flex items-center justify-center m-0 py-3">
            <Send />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-auto w-full px-12 py-4 rounded-full flex flex-col sticky bottom-0">
      <Textarea
        name=""
        className="rounded-md h-[4.5rem] text-2xl focus-visible:ring-2 focus-visible:ring-blue-300 bg-background"
        placeholder="Ingresa una pregunta sobre el documento"
      />
      <div className="border border-1 rounded-full justify-end absolute top-9 right-14">
        <Button className="text-2xl flex items-center justify-center m-0 py-3">
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
  return (
    <div className="flex flex-col gap-5 p-12 mt-7 overflow-y-scroll">
      {props.messages?.map((msg) => {
        const className = clsx({
          "bg-gray-200 ms-auto p-7 rounded-lg max-w-[50%] text-right":
            !msg.is_ai,
          "bg-white me-auto p-7 rounded-lg border border-1 drop-shadow-md max-w-[50%]":
            msg.is_ai,
        });
        return <div className={className}>{msg.contents}</div>;
      })}
    </div>
  );
}
