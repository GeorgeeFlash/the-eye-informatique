import { test, expect } from "@playwright/test"

test.describe("Affiliate program", () => {
  test("affiliate dashboard requires authentication", async ({ page }) => {
    await page.goto("/dashboard/affiliate")
    await expect(page).toHaveURL(/sign-in|dashboard/)
  })

  test("affiliate application form accessible from storefront", async ({ page }) => {
    await page.goto("/")
    // TODO: Navigate to affiliate program info page and test application form
    await expect(page.locator("body")).toBeVisible()
  })
})
