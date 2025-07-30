import { expect, type Page, test } from "@playwright/test"

async function submitCookieBanner(page: Page) {
    const cookieSubmitButton = page.getByRole("button", { name: "accept" })
    await expect(cookieSubmitButton).toBeVisible()
    await cookieSubmitButton.click()
}

test("Sign-in via magic link", async ({ browser }) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await page.goto("/")

    await submitCookieBanner(page)

    const loginSubmitButton = page.getByRole("button", { name: "e-mail" })
    await expect(loginSubmitButton, "Login submit button exists.").toBeVisible()

    const loginEmailBox = page.getByPlaceholder("e-mail")
    await expect(loginSubmitButton, "Email input box exists.").toBeVisible()

    await loginEmailBox.fill("xyz@gmail.com")

    await loginSubmitButton.click()

    const message = page.getByText("aanmelden...")
    expect(message).toBeDefined()

    await page.waitForURL("**/check-your-email")

    return ctx.close()
})
