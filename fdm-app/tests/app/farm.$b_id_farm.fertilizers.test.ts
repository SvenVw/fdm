import { expect, test } from "@playwright/test"
import { loadSessionFromFile } from "../test-io"

test.beforeEach(async ({ page, context }) => {
    await loadSessionFromFile(context)
    await page.goto("/farm")
})

test.fixme("There is a set of default fertilizers", async ({ page }) => {
    await expect(page.getByRole("table")).toBeVisible()
})
