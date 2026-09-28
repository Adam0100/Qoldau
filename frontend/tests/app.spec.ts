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
  await page.goto("/#/login");
  await page.getByText("Регистрация", { exact: true }).click();
  await page.getByLabel("Ваше имя", { exact: true }).fill("Browser member");
  await page.getByLabel("Город", { exact: true }).fill("Алматы");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Пароль", { exact: true }).fill(randomUUID());
  await page
    .getByRole("button", { name: "Создать аккаунт", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Nearby requests" }),
  ).toBeVisible();
  await page.goto("/#/new");
  await page
    .getByLabel("Название просьбы", { exact: true })
    .fill("Проверка браузером");
  await page
    .getByLabel("Подробности", { exact: true })
    .fill("Тестовая просьба для проверки реального API");
  await page
    .getByRole("button", { name: "Опубликовать просьбу", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Проверка браузером", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Отклики", exact: true }),
  ).toBeVisible();
  await page.goto("/#/profile");
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(page.getByLabel("Имя", { exact: true })).toHaveValue(
    "Browser member",
  );
  await page.getByLabel("О себе", { exact: true }).fill("Проверка сохранения");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(
    page.getByText("Профиль сохранён", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("О себе", { exact: true })).toHaveValue(
    "Проверка сохранения",
  );
  await page.goto("/#/");
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
  await page.goto("/#/map");
  await expect(
    page.getByText("Карта пока не подключена.", { exact: false }),
  ).toBeVisible();
  await page.goto("/#/messages");
  await expect(
    page.getByText("Личные чаты пока не подключены.", { exact: false }),
  ).toBeVisible();
});
