import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/node"
import { json, redirect } from "@remix-run/node"
import { Form } from "@remix-run/react"
import { signUpUser, getUserFromSession } from "@svenvw/fdm-core"

// Components
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Services
import { getSession, commitSession, destroySession } from "@/services/session.server";
import { fdm } from "../services/fdm.server";
import { Check } from "lucide-react"

export async function loader({
  request,
}: LoaderFunctionArgs) {

  const session = await getSession(
    request.headers.get("Cookie")
  );


  if (session.has("session_id")) {
    // Check if session is valid
    const user = await getUserFromSession(fdm, String(session.get("session_id")))
    if (!user) {
      session.flash("error", "Invalid session");

      return redirect("../signup", {
        headers: {
          "Set-Cookie": await destroySession(session),
        },
      });
    }

    // Redirect to the app page if they are already signed in.
    return redirect("../app");
  }

  const data = { error: session.get("error") };

  return json(data, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export default function SignUp() {
  return (
    <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
      <div className="flex h-screen items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            {/* <img src="logo.png" alt="Logo FDM"/> */}
            <h1 className="text-3xl font-bold">FDM</h1>
            <p className="text-balance text-muted-foreground">
              Maak een account aan en krijg toegang tot:
            </p>
            <div className="space-y-5">
              <div>
                <div
                  key="nutrientenbalans"
                  className="mb-4 grid grid-cols-[25px_1fr] space-x-2 items-start pb-4 last:mb-0 last:pb-0"
                >
                  <span><Check /> </span>
                  <div className="space-y-1">
                    <p className="text-sm text-left font-medium leading-none">
                      Nutriëntenbalans
                    </p>
                    <p className="text-sm text-left text-muted-foreground">
                      Aanvoer en afvoer van nutriënten op bedrijfsniveau
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div
                  key="osbalans"
                  className="mb-4 grid grid-cols-[25px_1fr] space-x-2 items-start pb-4 last:mb-0 last:pb-0"
                >
                  <span><Check /> </span>
                  <div className="space-y-1">
                    <p className="text-sm text-left font-medium leading-none">
                      OS Balans
                    </p>
                    <p className="text-sm text-left text-muted-foreground">
                      Opbouw van organische stof per perceel
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <div
                  key="baat"
                  className="mb-4 grid grid-cols-[25px_1fr] space-x-2 items-start pb-4 last:mb-0 last:pb-0"
                >
                  <span><Check /> </span>
                  <div className="space-y-1">
                    <p className="text-sm text-left font-medium leading-none">
                      Meststofkeuzeadviestool
                    </p>
                    <p className="text-sm text-left text-muted-foreground">
                      Integraal bemestingsadvies dat rekening houdt met productie en milieu
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Form method="post">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstname">Voornaam</Label>
                <Input
                  id="firstname"
                  name="firstname"
                  type="text"
                  placeholder=""
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="surname">Achternaam</Label>
                <Input
                  id="surname"
                  name="surname"
                  type="text"
                  placeholder=""
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder=""
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" />
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Ik ga akkoord met de Algemene Voorwaarden en Privacyverklaring
                  </label>
                </div>
              </div>
              <Button type="submit" className="">
                Registreren
              </Button>
              <div className="mt-4 text-center text-sm">
                Wil je eerst meer weten over FDM? Kijk dan bij onze <a href="#" className="underline">
                  Veelgestelde Vragen
                </a>
              </div>
            </div>
          </Form>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        <img src="https://images.unsplash.com/photo-1717702576954-c07131c54169?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt=""
          width="1920"
          height="1080"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale" />
      </div>
    </div >
  )
}

export async function action({
  request,
}: ActionFunctionArgs) {

  const session = await getSession(
    request.headers.get("Cookie")
  );

  const form = await request.formData()
  const firstname = String(form.get("firstname"))
  const surname = String(form.get("surname"))
  const email = String(form.get("email"))

  // sign up user
  const session_id = await signUpUser(fdm, firstname, surname, email)
  session.set("session_id", session_id)

  // Login succeeded, send them to the home page.
  return redirect("../app", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });

}