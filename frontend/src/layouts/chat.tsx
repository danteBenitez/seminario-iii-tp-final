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
import { FileText, PlusSquare } from "lucide-react";
import { Outlet } from "react-router";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserDocuments } from "@/features/chat/services/documents.service";
import { useStore } from "@/features/user/store";
import { Link } from "react-router-dom";

export function ChatLayout() {
  const userState = useStore((state) => state);

  const {
    data: documents,
    error,
    isLoading,
  } = useQuery({
    queryFn: () => getUserDocuments(userState.user_id),
    queryKey: ["documents", { user_id: userState.user_id }],
    enabled: !!userState.user_id,
  });

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
                <SidebarMenuItem key={"-nuevo-documento-"}>
                  <SidebarMenuButton asChild className="text-2xl">
                    <Link to={`/chat`}>
                      <PlusSquare />
                      <span className="text-lg text-clip">Nuevo Documento</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {documents &&
                  documents.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton asChild className="text-2xl">
                        <Link to={`/chat/${item.id}`}>
                          <FileText />
                          <span className="text-lg text-clip">
                            {item.original_filename}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarContent>
          {/* <SidebarFooter>Volver</SidebarFooter> */}
        </Sidebar>
      </div>
      <Outlet />
    </SidebarProvider>
  );
}
