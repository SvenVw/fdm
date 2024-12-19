import type { MetaFunction, LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { useLoaderData, Outlet } from "react-router";

// Components
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

// Blocks

// Services
import { auth } from "@/lib/auth.server"

export const meta: MetaFunction = () => {
  return [
    { title: "FDM App" },
    { name: "description", content: "Welcome to FDM!" },
  ];
};

export async function loader({
  request,
}: LoaderFunctionArgs) {

  // Get the session
  const session = await auth.api.getSession({
    headers: request.headers 
  })
  console.log(session)

  if (!session?.user) { 
    return redirect("/signin")
  }

  // Return user information from loader
  return {
    user: session.user,
  }
}

export default function App() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <SidebarProvider>
      <AppSidebar user={loaderData.user} />
      <Outlet />
    </SidebarProvider>

  );
}