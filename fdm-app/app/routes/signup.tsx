import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/node"
import { json, redirect } from "@remix-run/node"
import { Form } from "@remix-run/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRemixForm, RemixFormProvider } from "remix-hook-form"
import { z } from "zod"
import { signUpUser, getUserFromSession } from "@svenvw/fdm-core"

// Components
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

// Services
import { getSession, commitSession, destroySession } from "@/services/session.server";
import { fdm } from "../services/fdm.server";
import { Check } from "lucide-react"
import { LoadingSpinner } from "@/components/custom/loadingspinner"

const FormSchema = z.object({
  firstname: z.string({
    required_error: "Voornaam is verplicht",
  }).min(2, {
    message: "Voornaam moet minimaal 2 karakters bevatten",
  }),
  surname: z.string({
    required_error: "Achternaam is verplicht",
  }).min(2, {
    message: "Achternaam moet minimaal 2 karakters bevatten",
  }),
  email: z.string({
    required_error: "E-mail is verplicht",
  }).email({
    message: "Voer een geldig emailadres in",
  }),
  agreed: z.boolean().default(false).refine((val) => val === true, {
    message: "Je moet akkoord gaan met de Algemene Voorwaarden en Privacyverklaring"
  })
})

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

  const form = useRemixForm<z.infer<typeof FormSchema>>({
    mode: "onTouched",
    resolver: zodResolver(FormSchema),
    defaultValues: {
      agreed: false,
    },
  })


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
          <RemixFormProvider {...form}>
            <Form id="formFarm" onSubmit={form.handleSubmit} method="POST">
              <fieldset
                disabled={form.formState.isSubmitting}
              >
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <FormField
                      control={form.control}
                      name="firstname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Voornaam</FormLabel>
                          <FormControl>
                            <Input {...field} type="text" required />
                          </FormControl>
                          <FormDescription />
                          <FormMessage />
                        </FormItem>
                      )}
                    />                   
                  </div>
                  <div className="grid gap-2">
                    <FormField
                      control={form.control}
                      name="surname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Achternaam</FormLabel>
                          <FormControl>
                            <Input {...field} type="text" required />
                          </FormControl>
                          <FormDescription />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" required />
                          </FormControl>
                          <FormDescription />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-2">
                    <FormField
                      control={form.control}
                      name="agreed"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-0 leading-none">
                            <FormLabel>
                              Ik ga akkoord met de Algemene Voorwaarden en Privacyverklaring
                            </FormLabel>
                            {/* <FormMessage className="text-sm font-light" />                                      */}
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit">
                    {form.formState.isSubmitting
                      ? <div className="flex items-center space-x-2">
                        <LoadingSpinner />
                        <span>Registeren...</span>
                      </div>
                      : "Registeren"}
                  </Button>
                  <div className="mt-4 text-center text-sm">
                    Wil je eerst meer weten over FDM? Kijk dan bij onze <a href="#" className="underline">
                      Veelgestelde Vragen
                    </a>
                  </div>
                </div>
              </fieldset>
            </Form>
          </RemixFormProvider>
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
  const firstname = String(form.get("firstname")).replace(/['"]+/g, '')
  const surname = String(form.get("surname")).replace(/['"]+/g, '')
  const email = String(form.get("email")).replace(/['"]+/g, '')
  const agreed = Boolean(form.get("agreed"))

  if (agreed !== true) {
    throw new Error('User did not agree with Terms and Conditions')
  }

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