import { expect } from "@playwright/test"

export async function submitCookieBanner(page: Page) {
    const cookieSubmitButton = page.getByRole("button", { name: "accept" })
    await expect(cookieSubmitButton).toBeVisible()
    await cookieSubmitButton.click()
}
