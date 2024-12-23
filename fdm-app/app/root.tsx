import { useEffect } from "react";
import { data, Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from "react-router";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { getToast } from "remix-toast";
import { Toaster } from "@/components/ui/sonner"
import { toast as notify } from "sonner";

import styles from "~/tailwind.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { toast, headers } = await getToast(request);
    return data({ toast }, { headers });
  } catch (error) {
    console.error('Failed to get toast:', error);
    return data({ toast: null }, {});
  }
}

export function Layout() {
  const loaderData = useLoaderData<typeof loader>();
  const toast = loaderData?.toast;

  // Hook to show the toasts
  useEffect(() => {
    if (toast && toast.type === "error") {
      notify.error(toast.message);
    }
    if (toast && toast.type === "success") { 
      notify.success(toast.message);
    }
  }, [toast]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <Toaster />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
