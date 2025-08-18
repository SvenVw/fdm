import { expect } from "@playwright/test"

export async function submitCookieBanner(page: Page) {
    const cookieSubmitButton = page.getByRole("button", { name: "accept" })
    await expect(cookieSubmitButton).toBeVisible()
    await cookieSubmitButton.click()
}

export async function submitCookieBannerWithTimeout(
    page: Page,
    timeout = 1000,
) {
    let cookieSubmitButton
    await Promise.race([
        new Promise<void>((resolve) => {
            setTimeout(() => resolve(), timeout)
        }),
        (async () => {
            const cand = page.getByRole("button", {
                name: "accept",
            })
            await expect(cand).toBeVisible()
            cookieSubmitButton = cand
        })(),
    ])

    if (cookieSubmitButton) {
        await cookieSubmitButton.click()
    }
}
