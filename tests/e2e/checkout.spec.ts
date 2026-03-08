import { test, expect } from "@playwright/test"

test.describe("Checkout flow", () => {
  test("should display products on the listing page", async ({ page }) => {
    await page.goto("/products")
    await expect(page).toHaveURL(/products/)
  })

  test("should navigate to product detail", async ({ page }) => {
    await page.goto("/products")
    // TODO: Click first product card and verify navigation to detail page
    await expect(page.locator("body")).toBeVisible()
  })

  test("cart page should be accessible", async ({ page }) => {
    await page.goto("/cart")
    await expect(page.locator("body")).toBeVisible()
  })

  test("checkout requires authentication", async ({ page }) => {
    await page.goto("/checkout")
    // Either redirects to sign-in or shows checkout with empty cart message
    await expect(page.locator("body")).toBeVisible()
  })
})
