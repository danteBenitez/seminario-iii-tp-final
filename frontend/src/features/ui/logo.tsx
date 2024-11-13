import { Bot } from "lucide-react";
import { Link } from "react-router-dom";

export function Logo() {
  return (
    <Link to={"/"} className="flex justify-center items-center gap-2">
      <Bot className="size-8" />
      <span className="text-2xl font-sans-accent">DocChat</span>
    </Link>
  );
}
