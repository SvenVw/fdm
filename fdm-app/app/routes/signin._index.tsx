import { zodResolver } from "@hookform/resolvers/zod"
import {
    Calculator,
    CheckCircle2,
    Cookie,
    Layers,
    MoveDown,
    Sprout,
    Target,
} from "lucide-react"
import { useEffect, useRef } from "react"
import type {
    ActionFunctionArgs,
    LoaderFunctionArgs,
    MetaFunction,
} from "react-router"
import { Form, redirect, useSearchParams } from "react-router"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import { redirectWithSuccess } from "remix-toast"
import { toast } from "sonner"
import { z } from "zod"
import { LoadingSpinner } from "~/components/custom/loadingspinner"
import { Button } from "~/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormMessage,
} from "~/components/ui/form"
import { Input } from "~/components/ui/input"
import { auth } from "~/lib/auth.server"
import { signIn } from "~/lib/auth-client"
import { clientConfig } from "~/lib/config"
import { handleActionError, handleLoaderError } from "~/lib/error"
import { modifySearchParams } from "~/lib/url-utils"
import { cn } from "~/lib/utils"
import { extractFormValuesFromRequest } from "../lib/form"

export const meta: MetaFunction = () => {
    return [
        { title: `Aanmelden | ${clientConfig.name}` },
        {
            name: "description",
            content: `Meld je aan bij ${clientConfig.name} om toegang te krijgen tot je dashboard en je bedrijfsgegevens te beheren.`,
        },
    ]
}

const FormSchema = z.object({
    timeZone: z.string().optional(),
    email: z.coerce
        .string({
            required_error:
                "Voor aanmelden met e-mail hebben we je e-mailadres nodig",
        })
        .email({
            message: "Dit is geen geldig e-mailadres",
        }),
})

/**
 * Checks for an existing user session and redirects authenticated users.
 *
 * This asynchronous loader function retrieves the user session from the request headers
 * via the authentication API. If a valid session exists, the function redirects the user
 * to the "/farm" route; otherwise, it returns an empty object. Any errors during session
 * retrieval are processed by {@link handleLoaderError} and thrown.
 *
 * @param request - The HTTP request object whose headers are used to retrieve the session.
 *
 * @returns A redirect response to "/farm" if a session exists, or an empty object otherwise.
 *
 * @throws {Error} If session retrieval fails, the error processed by {@link handleLoaderError} is thrown.
 */
export async function loader({ request }: LoaderFunctionArgs) {
    try {
        // Get the session
        const session = await auth.api.getSession({
            headers: request.headers,
        })

        // If user has an session redirect to app
        if (session?.session) {
            return redirect("/farm")
        }

        // Return user information from loader
        return {}
    } catch (error) {
        throw handleLoaderError(error)
    }
}

/**Normalizes the given address to be a safe redirect, or `/farm` by default.
 *
 * @param address address to check for safety, null if not specified
 * @returns the normalized, safe redirect address
 */
function getSafeRedirect(address: string | null) {
    return address?.startsWith("/") && !address.startsWith("//")
        ? address
        : "/farm"
}

/**
 * Renders the sign-in page with social authentication options.
 *
 * This component displays a structured interface for user sign-in. It provides social sign-in buttons for Microsoft and Google,
 * along with information about service benefits and a link to the privacy policy. If a social sign-in attempt fails, a toast notification
 * is displayed and the error is logged to the console.
 *
 * @returns A React element representing the sign-in page.
 */
export default function SignIn() {
    const [searchParams, setSearchParams] = useSearchParams() // Get search params
    const moreInfoRef = useRef<HTMLDivElement>(null)

    const rawRedirectTo = searchParams.get("redirectTo")
    const redirectTo = getSafeRedirect(rawRedirectTo) // Validate redirectTo to prevent open redirect

    useEffect(() => {
        if (rawRedirectTo && rawRedirectTo !== redirectTo) {
            setSearchParams((searchParams) => {
                searchParams.delete("redirectTo")
                return searchParams
            })
        }
    }, [rawRedirectTo, redirectTo, setSearchParams])

    const socialProviderNewUserCallbackUrl = modifySearchParams(
        "/welcome",
        (searchParams) => searchParams.set("redirectTo", redirectTo),
    )

    const handleSignInError = (provider: string, error: unknown) => {
        toast(
            `Er is helaas iets misgegaan bij het aanmelden met ${provider}. Probeer het opnieuw.`,
        )
        console.error("Social sign-in failed:", error)
    }
    const openCookieSettings = () => {
        if (window?.openCookieSettings) {
            window.openCookieSettings()
        }
    }
    const onOpenCookieSettings = () => {
        openCookieSettings()
    }

    const scrollToMoreInfo = () => {
        moreInfoRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            email: "",
            timeZone: undefined,
        },
    })

    useEffect(() => {
        const timeZone = Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone
        form.setValue("timeZone", timeZone)
    }, [form.setValue])

    return (
        <div>
            <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
                <div className="relative flex min-h-screen flex-col bg-muted/20">
                    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
                        <div className="mx-auto grid w-full max-w-sm gap-6">
                            <Card className="shadow-xl">
                                <CardHeader className="text-center">
                                    <div className="flex justify-center mb-4">
                                        <div className="flex aspect-square size-16 items-center justify-center rounded-lg bg-[#122023]">
                                            <img
                                                className="size-12"
                                                src={clientConfig.logomark}
                                                alt={clientConfig.name}
                                            />
                                        </div>
                                    </div>
                                    <CardTitle className="text-2xl">
                                        {clientConfig.name}
                                    </CardTitle>
                                    <CardDescription>
                                        Meld je aan om toegang te krijgen tot je
                                        dashboard.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid w-full items-center gap-4">
                                        <div className="flex flex-col space-y-1.5">
                                            <Button
                                                variant={"outline"}
                                                className={cn("w-full gap-2")}
                                                onClick={async () => {
                                                    try {
                                                        await signIn.social({
                                                            provider:
                                                                "microsoft",
                                                            callbackURL:
                                                                redirectTo,
                                                            newUserCallbackURL:
                                                                socialProviderNewUserCallbackUrl,
                                                        })
                                                    } catch (error) {
                                                        handleSignInError(
                                                            "Microsoft",
                                                            error,
                                                        )
                                                    }
                                                }}
                                            >
                                                <svg
                                                    role="img"
                                                    aria-label="Microsoft logo"
                                                    width="1024"
                                                    height="1024"
                                                    viewBox="0 0 1024 1024"
                                                    fill="none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        d="M44.522 44.5217H489.739V489.739H44.522V44.5217Z"
                                                        fill="#F35325"
                                                    />
                                                    <path
                                                        d="M534.261 44.5217H979.478V489.739H534.261V44.5217Z"
                                                        fill="#81BC06"
                                                    />
                                                    <path
                                                        d="M44.522 534.261H489.739V979.478H44.522V534.261Z"
                                                        fill="#05A6F0"
                                                    />
                                                    <path
                                                        d="M534.261 534.261H979.478V979.478H534.261V534.261Z"
                                                        fill="#FFBA08"
                                                    />
                                                </svg>
                                                Aanmelden met Microsoft
                                            </Button>
                                        </div>
                                        <div className="flex flex-col space-y-1.5">
                                            <Button
                                                variant={"outline"}
                                                className={cn("w-full gap-2")}
                                                onClick={async () => {
                                                    try {
                                                        await signIn.social({
                                                            provider: "google",
                                                            callbackURL:
                                                                redirectTo,
                                                            newUserCallbackURL:
                                                                socialProviderNewUserCallbackUrl,
                                                            // prompt: "select_account",
                                                        })
                                                    } catch (error) {
                                                        handleSignInError(
                                                            "Google",
                                                            error,
                                                        )
                                                    }
                                                }}
                                            >
                                                <svg
                                                    role="img"
                                                    aria-label="Google logo"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="0.98em"
                                                    height="1em"
                                                    viewBox="0 0 256 262"
                                                >
                                                    <path
                                                        fill="#4285F4"
                                                        d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                                                    />

                                                    <path
                                                        fill="#34A853"
                                                        d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                                                    />

                                                    <path
                                                        fill="#FBBC05"
                                                        d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
                                                    />

                                                    <path
                                                        fill="#EB4335"
                                                        d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                                                    />
                                                </svg>
                                                Aanmelden met Google
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-background px-2 text-muted-foreground">
                                                Of
                                            </span>
                                        </div>
                                    </div>
                                    <RemixFormProvider {...form}>
                                        <Form
                                            id="formSigninMagicLink"
                                            onSubmit={form.handleSubmit}
                                            method="POST"
                                        >
                                            <fieldset
                                                disabled={
                                                    form.formState.isSubmitting
                                                }
                                            >
                                                <div className="grid w-full items-center gap-4">
                                                    <div className="flex flex-col space-y-1.5">
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="timeZone"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Input
                                                                            type="hidden"
                                                                            {...field}
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="email"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder="E-mailadres"
                                                                            aria-required="true"
                                                                            {...field}
                                                                        />
                                                                    </FormControl>
                                                                    <FormDescription />
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                    <Button
                                                        type="submit"
                                                        className="w-full"
                                                    >
                                                        {form.formState
                                                            .isSubmitting ? (
                                                            <div className="flex items-center space-x-2">
                                                                <LoadingSpinner />
                                                                <span>
                                                                    Aanmelden...
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            "Aanmelden met e-mail"
                                                        )}
                                                    </Button>
                                                </div>
                                            </fieldset>
                                        </Form>
                                    </RemixFormProvider>
                                </CardContent>
                                <CardFooter className="flex justify-center">
                                    <p className="text-sm font-medium text-muted-foreground text-center">
                                        Door verder te gaan, gaat u akkoord met
                                        het{" "}
                                        <a
                                            href={clientConfig.privacy_url}
                                            aria-label="Lees ons privacybeleid"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="underline hover:text-primary focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                        >
                                            Privacybeleid
                                        </a>
                                    </p>
                                </CardFooter>
                            </Card>
                            <div className="text-center text-sm">
                                <Button
                                    variant={"outline"}
                                    onClick={scrollToMoreInfo}
                                >
                                    {`Lees meer over ${clientConfig.name}`}{" "}
                                    <MoveDown className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-6 text-xs text-muted-foreground">
                        <Button
                            variant="link"
                            className="h-auto p-0 text-muted-foreground hover:text-foreground flex items-center gap-1"
                            onClick={onOpenCookieSettings}
                        >
                            <Cookie className="h-3 w-3" />
                            <span>Cookie instellingen</span>
                        </Button>
                    </div>
                </div>
                <div className="hidden bg-muted lg:block">
                    <img
                        src="https://images.unsplash.com/photo-1717702576954-c07131c54169?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        alt='Photo by <a href="https://unsplash.com/@tombelgium?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Tom De Decker</a> on <a href="https://unsplash.com/photos/a-tractor-plowing-a-field-at-sunset-_dnc3j1oVlk?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>'
                        width="1920"
                        height="1080"
                        loading="lazy"
                        className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                    />
                </div>
            </div>
            <div ref={moreInfoRef} className="bg-muted/10 py-24">
                <div className="container mx-auto max-w-6xl px-4 lg:px-8">
                    <div className="mb-24 grid items-center gap-12 lg:grid-cols-2">
                        <div>
                            <div className="mb-6 inline-flex items-center rounded-full border border-green-100 bg-green-200 px-3 py-1 text-sm font-medium text-green-800">
                                <span className="mr-2 flex h-2 w-2 rounded-full bg-green-500"></span>
                                Innovatie in de praktijk
                            </div>
                            <h2 className="mb-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                                Samen leren en innoveren
                            </h2>
                            <div className="mb-8 space-y-4 text-lg leading-relaxed text-muted-foreground">
                                <p>
                                    {clientConfig.name} is een initiatief van
                                    het Nutriënten Management Instituut (NMI).
                                    Het platform is volop in ontwikkeling, maar
                                    nu al inzetbaar voor uw bedrijf. FDM is
                                    bovendien een open-source platform. Dit
                                    betekent transparantie en de mogelijkheid
                                    voor derden om bij te dragen aan de
                                    doorontwikkeling. Door twee innovatieve
                                    projecten samen te brengen, faciliteren we
                                    kennisdeling en versnellen we de transitie
                                    naar een duurzamere landbouw:
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex gap-2">
                                        <span className="mt-2 flex h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                        <span>
                                            <strong className="text-foreground">
                                                Doelsturing:
                                            </strong>{" "}
                                            In samenwerking met LTO Noord, ZLTO,
                                            LVVN, NVWA en RVO testen we hoe
                                            doelsturing werkt in de praktijk,
                                            met de Stikstofbalans als basis.
                                        </span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="mt-2 flex h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                        <span>
                                            <strong className="text-foreground">
                                                PPS BAAT:
                                            </strong>{" "}
                                            Samen met Wageningen University
                                            maken we bemestingsadvies
                                            toegankelijker. Krijg inzicht in
                                            zowel opbrengst als milieu-impact
                                            voor een bewuste meststofkeuze.
                                        </span>
                                    </li>
                                </ul>
                            </div>
                            <div className="border-t border-border pt-6">
                                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Partners
                                </p>
                                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-foreground/80">
                                    <span>LTO Noord</span>•
                                    <span>ZLTO</span>•
                                    <span>Wageningen University</span>•
                                    <span>LVVN</span>•<span>NVWA</span>•
                                    <span>RVO</span>
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute -inset-4 -z-10 rounded-3xl bg-linear-to-tr from-primary/20 to-blue-500/20 blur-2xl opacity-70" />

                            <Card className="border-muted/40 bg-background shadow-xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <Target className="h-5 w-5 text-primary" />
                                        Uitgangspunten
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-6">
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">
                                                Praktijktoets
                                            </h4>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Leren en ontdekken hoe
                                                doelsturing werkt in de echte
                                                wereld.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">
                                                Transparant & Deelbaar
                                            </h4>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Als open-source platform
                                                faciliteren we kennisdeling en
                                                versnellen we innovatie.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">
                                                In ontwikkeling
                                            </h4>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Een groeiend platform dat
                                                continu wordt verbeterd op basis
                                                van uw feedback.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        <Card className="border-none bg-background shadow-md transition-all hover:shadow-lg">
                            <CardHeader>
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-700">
                                    <Sprout className="h-6 w-6" />
                                </div>
                                <CardTitle>Nutriëntenbalans</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="leading-relaxed text-muted-foreground">
                                    Real-time inzicht in de aanvoer en afvoer
                                    van nutriënten op bedrijfsniveau. Stuur op
                                    efficiëntie en minimaliseer verliezen naar
                                    het milieu.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-none bg-background shadow-md transition-all hover:shadow-lg">
                            <CardHeader>
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                                    <Layers className="h-6 w-6" />
                                </div>
                                <CardTitle>Bodemkwaliteit & OS</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="leading-relaxed text-muted-foreground">
                                    Monitor de ontwikkeling van organische stof
                                    per perceel. Werk aan een weerbare bodem die
                                    basis biedt voor een duurzame teelt.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-none bg-background shadow-md transition-all hover:shadow-lg">
                            <CardHeader>
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                                    <Calculator className="h-6 w-6" />
                                </div>
                                <CardTitle>Bemestingsadvies</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="leading-relaxed text-muted-foreground">
                                    Integraal advies dat productiedoelen
                                    verenigt met milieurandvoorwaarden.
                                    Gebaseerd op de laatste wetenschappelijke
                                    richtlijnen (PPS BAAT).
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}

export async function action({ request }: ActionFunctionArgs) {
    // Get the URL object to extract search params
    const url = new URL(request.url)
    const redirectTo = url.searchParams.get("redirectTo") || "/farm"
    // Validate redirectTo to prevent open redirect
    let safeRedirectTo = getSafeRedirect(redirectTo)

    // Get form values
    const formValues = await extractFormValuesFromRequest(request, FormSchema)
    const { email } = formValues

    // Validate timezone and use undefined if invalid
    let timeZone: string | undefined
    if (formValues.timeZone) {
        try {
            Intl.DateTimeFormat(undefined, { timeZone: formValues.timeZone })
            timeZone = formValues.timeZone
        } catch (_) {}
    }

    if (timeZone) {
        const safeRedirectToUrl = new URL(
            safeRedirectTo,
            "http://localhost:9999",
        )
        safeRedirectToUrl.searchParams.set("timeZone", timeZone)
        safeRedirectTo = `${safeRedirectToUrl.pathname}${safeRedirectToUrl.search}${safeRedirectToUrl.hash}`
    }

    try {
        // This will trigger the sendMagicLink hook in fdm-core, which sends the email
        await auth.api.signInMagicLink({
            body: {
                email: email,
                callbackURL: safeRedirectTo,
            },
            headers: request.headers,
        })
        return redirectWithSuccess(
            "/signin/check-your-email",
            `Aanmeldlink is verstuurd naar ${email}.`,
        )
    } catch (error) {
        console.error("Error sending magic link") // Don't log full error details
        handleActionError(error)
    }
}
