import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
test("real registration, request, profile, navigation and responsive layout", async ({
  page,
}) => {
  const email =
    "browser-" +
    Date.now() +
    "-" +
    Math.random().toString(36).slice(2) +
    "@example.test";
  await page.goto("/login");
  await page.getByText("Register", { exact: true }).click();
  await page.getByLabel("Your name", { exact: true }).fill("Browser member");
  await page.getByLabel("City", { exact: true }).fill("Алматы");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(randomUUID());
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Nearby requests" }),
  ).toBeVisible();
  await page.goto("/new");
  await page
    .getByLabel("Request title", { exact: true })
    .fill("Проверка браузером");
  await page
    .getByLabel("Details", { exact: true })
    .fill("Тестовая просьба для проверки реального API");
  await page.getByRole("button", { name: "Post request", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Проверка браузером", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Offers", exact: true }),
  ).toBeVisible();
  await page.goto("/profile");
  await page.getByRole("link", { name: /Settings/ }).click();
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue(
    "Browser member",
  );
  await page
    .getByLabel("About me", { exact: true })
    .fill("Проверка сохранения");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Profile saved", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("About me", { exact: true })).toHaveValue(
    "Проверка сохранения",
  );
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Nearby requests" }),
  ).toBeVisible();
  const fits = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(fits).toBeTruthy();
  await page.screenshot({
    path: "test-results/home-" + test.info().project.name + ".png",
    fullPage: true,
  });
  await page.goto("/map");
  await expect(
    page.getByText("The map is not connected yet.", { exact: false }),
  ).toBeVisible();
  await page.goto("/messages");
  await expect(
    page.getByText("Личные чаты пока не подключены.", { exact: false }),
  ).toBeVisible();
});
