import type { MetaFunction, LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { useLoaderData, Outlet } from "react-router";

// Components
import { SidebarProvider } from "@/components/ui/sidebar"
import { SidebarApp } from "@/components/custom/sidebar-app"

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
      <SidebarApp user={loaderData.user} />
      <Outlet />
    </SidebarProvider>

  );
}

export async function action({
  request,
}: ActionFunctionArgs) {

  // Get the session token
  const session = await auth.api.getSession({
    headers: request.headers
  })

  // Revoke the session
  await auth.api.revokeSession({
    headers: request.headers,
    body: {
      token: session?.session.token
    }
  })

  return redirect("/signin")
}