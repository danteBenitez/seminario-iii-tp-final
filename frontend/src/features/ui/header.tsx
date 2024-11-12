import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Bot } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "./logo";

export function Header() {
  return (
    <header className="border border-b border-1 flex items-center justify-between px-4">
      <div className="p-4 flex items-center gap-2 text-2xl">
        <Logo />
      </div>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link to="/chat">
              <Button variant={"default"} className="text-xl">
                <Bot className="text-xl" />
                <span className="text-xl">Chatear</span>
              </Button>
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
}
