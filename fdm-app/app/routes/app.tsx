import type { MetaFunction } from "@remix-run/node";
import { Outlet } from "@remix-run/react";

// Components
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

// Blocks

export const meta: MetaFunction = () => {
  return [
    { title: "FDM App" },
    { name: "description", content: "Welcome to FDM!" },
  ];
};

export default function App() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <Outlet />
    </SidebarProvider>

  );
}
