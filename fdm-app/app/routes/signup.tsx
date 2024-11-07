// Components
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export async function loader() {
  return null
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
              Vul je e-mailadres en wachtwoord om je te registreren
            </p>
          </div>
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
              Inloggen
            </Button>
          </div>
          {/* <div className="mt-4 text-center text-sm">
                        Heb je geen account?
                        <a href="#" className="underline">
                            Registreren
                        </a>
                    </div> */}
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        <img src="https://images.unsplash.com/photo-1653474343781-120bc83b73f1?q=80&w=1965&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt=""
          width="1920"
          height="1080"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale" />
      </div>
    </div>
  )
}

export async function action() {
  return null
}