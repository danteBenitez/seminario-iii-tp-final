import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Bot, FileText } from "lucide-react";

export function Header() {
  return (
    <header className="border border-b border-1 flex items-center justify-between px-4">
      <div className="p-4 flex items-center gap-2 text-2xl">
        <FileText className="size-8" />
        <span className="text-2xl font-sans-accent">DocChat</span>
      </div>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <Button variant={"default"} className="text-xl">
              <Bot className="text-xl" />
              <span className="text-xl">Chatear</span>
            </Button>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
}
