import { test } from "../test-db"
import {
    loadSessionFromFile,
    saveSessionToFile,
    testFileLine,
    writeTestFile,
} from "../test-io"
import { submitCookieBannerWithTimeout } from "../util"
import { magicLinkUrlFileName } from "../test-io"

const { expect } = test

test.describe.configure({ mode: "serial" })

test("User can sign in via email and complete creating their profile", async ({
    page,
    context,
    sql,
}) => {
    sql()`delete from "fdm-authn"."user" where email = 'xyz@example.com'`

    await writeTestFile(magicLinkUrlFileName, "")

    await page.goto("/")
    await submitCookieBannerWithTimeout(page)

    const loginSubmitButton = page.getByRole("button", { name: "e-mail" })
    await expect(
        loginSubmitButton,
        "Login submit button does not exist.",
    ).toBeVisible()

    const loginEmailBox = page.getByPlaceholder("e-mail")
    await expect(loginEmailBox, "Email input box does not exist.").toBeVisible()

    await loginEmailBox.fill("xyz@example.com")

    await loginSubmitButton.click()

    await page.waitForURL("**/check-your-email")
    const url = await testFileLine(magicLinkUrlFileName)
    console.log(url)
    await page.goto(url)

    const firstNameBox = page.getByLabel("Voornaam")
    await expect(firstNameBox, "There is no first name box.").toBeVisible()
    await firstNameBox.fill("Test")
    const lastNameBox = page.getByLabel("Achternaam")
    await expect(lastNameBox, "There is no last name box.").toBeVisible()
    await lastNameBox.fill("User")

    const nameSubmitButton = page.getByRole("button", { name: "Doorgaan" })
    await expect(nameSubmitButton, "There is no submit button.").toBeVisible()
    await nameSubmitButton.click()

    await page.waitForURL("/farm")

    await saveSessionToFile(context)
})

test.fixme(
    "User can create a farm business and select parcels",
    async ({ page, context }) => {
        // Load session from previous test if it is missing for some reason
        const currentCookies = await context.cookies()
        if (
            !currentCookies.find(
                (c) => c.name === "better-auth.session_token",
            ) ||
            !currentCookies.find((c) => c.name === "toast-session")
        ) {
            await loadSessionFromFile(context)
        }

        // Click the Create Business button
        await page.goto("/farm")
        const createBusinessButton = page.getByRole("link", {
            name: "Start wizard",
        })
        await expect(
            createBusinessButton,
            "There is no create business button",
        ).toBeVisible()
        await createBusinessButton.click()

        // Fill in the business creation form and submit
        const businessNameBox = page.getByLabel("bedrijfsnaam")
        await expect(
            businessNameBox,
            "There is no business name box",
        ).toBeVisible()
        await businessNameBox.fill("Example Business")

        const businessNameSubmitButton = page.getByRole("button", {
            name: "volgende",
        })
        await expect(
            businessNameSubmitButton,
            "There is no continue button after business name and address",
        ).toBeVisible()
        await businessNameSubmitButton.click()

        // Go to the Shape File Upload
        const shapeFileUploadButton = page.getByRole("button", {
            name: "Bestand uploaden",
        })
        await expect(
            shapeFileUploadButton,
            "There is no shape file upload button",
        ).toBeVisible()
        await shapeFileUploadButton.click()
    },
)
