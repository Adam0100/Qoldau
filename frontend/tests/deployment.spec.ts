import { test, expect } from "@playwright/test";

test("direct nested links and reloads work on the single-domain server", async ({
  page,
  request,
}) => {
  await page.goto("/profile/settings");
  await expect(page.locator("#root")).not.toBeEmpty();
  await page.reload();
  await expect(page.locator("#root")).not.toBeEmpty();
  expect(await page.locator("body").innerText()).not.toContain('"message":');
  const response = await request.get("/api/does-not-exist");
  expect(response.status()).toBe(401);
  expect(response.headers()["content-type"]).toContain("application/json");
});
