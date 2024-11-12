import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Logo } from "@/features/ui/logo";
import { FileTextIcon, MessageCircleIcon } from "lucide-react";
import { Outlet } from "react-router";

const items = [
  {
    title: "Mis chats",
    icon: MessageCircleIcon,
    url: "/chat",
  },
  {
    title: "Mis documentos",
    icon: FileTextIcon,
    url: "/chat/documents",
  },
];

export function ChatLayout() {
  return (
    <SidebarProvider>
      <div className="grid">
        <Sidebar>
          <SidebarHeader className="flex flex-row p-4">
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="text-2xl">
                      <a href={item.url} className="my-2">
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarContent>
          <SidebarFooter>Volver</SidebarFooter>
        </Sidebar>
      </div>
      <Outlet />
    </SidebarProvider>
  );
}
