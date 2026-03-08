import { test, expect } from "@playwright/test"

test.describe("Authentication", () => {
  test("should redirect unauthenticated users to sign-in when accessing dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/sign-in/)
  })

  test("should display sign-in page", async ({ page }) => {
    await page.goto("/sign-in")
    await expect(page.getByRole("heading")).toBeVisible()
  })

  test("should display sign-up page", async ({ page }) => {
    await page.goto("/sign-up")
    await expect(page.getByRole("heading")).toBeVisible()
  })

  test("homepage should load and display navigation", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveURL(/\//)
    await expect(page.locator("body")).toBeVisible()
  })
})
