import {
  Sidebar,
  SidebarContent,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Logo } from "@/features/ui/logo";
import { FileText, PlusSquare, X } from "lucide-react";
import { Outlet } from "react-router";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  deleteUserDocument,
  getUserDocuments,
} from "@/features/chat/services/documents.service";
import Spinner from "@/features/ui/spinner";
import { useStore } from "@/features/user/store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { useState } from "react";
import { Link } from "react-router-dom";

export function ChatLayout() {
  const userState = useStore((state) => state);

  const {
    data: documents,
    error,
    isLoading,
    refetch,
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
                      <SidebarMenuButton className="text-3xl h-[5rem] flex gap-2 relative">
                        <DocumentLogoWithDelete
                          document_id={item.id.toString()}
                        />
                        <Link
                          to={`/chat/${item.id}`}
                          className="flex items-center group"
                        >
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

export function DocumentLogoWithDelete({
  document_id,
}: {
  document_id: string;
}) {
  const [open, setOpen] = useState(false);
  const userState = useStore();
  const client = useQueryClient();
  const { mutateAsync: deleteDoc, isLoading } = useMutation({
    mutationFn: (document_id: string) =>
      deleteUserDocument(userState.user_id ?? "", document_id),
    onSuccess() {
      client.invalidateQueries({
        queryKey: ["documents"],
      });
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <FileText
        className={clsx("group-hover:opacity-0 absolute my-auto", {
          "opacity-0": isLoading,
        })}
      />
      <AlertDialogTrigger className="z-10">
        {!isLoading && (
          <X className="group-hover:opacity-100 opacity-0 transition-opacity duration-200" />
        )}
        {isLoading && <Spinner />}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿Estás seguro de que quieres eliminar el documento?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede revertir.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-md">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant={"destructive"}
            className="rounded-md"
            onClick={() => deleteDoc(document_id)}
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
