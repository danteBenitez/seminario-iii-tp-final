import { Header } from "@/features/ui/header";
import { Outlet } from "react-router";

export default function MainLayout() {
  return (
    <div className="grid grid-rows-[auto_1fr] h-full">
      <Header />
      <Outlet />
    </div>
  );
}
