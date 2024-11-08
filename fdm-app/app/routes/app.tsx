import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { redirect, json} from "@remix-run/node";
import {useLoaderData, Outlet } from "@remix-run/react";
import { getUserFromSession } from "@svenvw/fdm-core"

// Components
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

// Blocks

// Services
import { getSession, commitSession } from "@/services/session.server";
import { fdm } from "../fdm.server";

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
  const session = await getSession(
    request.headers.get("Cookie")
  );

  // Check if session is present
  if (!session.has("session_id")) {
    session.flash("error", "No session");

    return redirect("../login", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  // Validate the session
  const user = await getUserFromSession(fdm, String(session.get("session_id")))
  if (! user) {
    session.flash("error", "Invalid session");

    return redirect("../login", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  // Return user information from loader
  return json({
    user: user
  })
}

export default function App() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <SidebarProvider>
      <AppSidebar user={loaderData.user}/>
      <Outlet />
    </SidebarProvider>

  );
}
