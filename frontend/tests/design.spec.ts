import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";

test("reference screens, honest unavailable features and responsive layouts", async ({
  page,
  context,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#/welcome");
  await expect(
    page.getByRole("heading", { name: "Qoldau+", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Get started", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/design/" + testInfo.project.name + "-welcome.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Get started", exact: true }).click();
  await expect(page.getByLabel("Ваше имя", { exact: true })).toBeVisible();
  const token = (await (await context.request.get("/api/auth/csrf")).json())
    .token;
  const credentials = {
    email: "visual-" + randomUUID() + "@example.test",
    password: randomUUID(),
  };
  const register = await context.request.post("/api/auth/register", {
    headers: { "X-CSRF-TOKEN": token },
    data: { ...credentials, name: "Дана", city: "Тестовый город" },
  });
  expect(register.ok()).toBeTruthy();
  expect(
    (
      await context.request.post("/api/auth/login", {
        headers: { "X-CSRF-TOKEN": token },
        data: credentials,
      })
    ).ok(),
  ).toBeTruthy();
  const csrf = (await (await context.request.get("/api/auth/csrf")).json())
    .token;
  const post = async (path: string, data: unknown) => {
    const response = await context.request.post("/api" + path, {
      headers: { "X-CSRF-TOKEN": csrf },
      data,
    });
    expect(response.ok()).toBeTruthy();
    return response.json();
  };
  const request = await post("/requests", {
    title: "Помочь с покупками",
    description:
      "Нужна помощь с продуктами: молоко, хлеб и овощи. Буду рада вашей поддержке.",
    city: "Тестовый город",
    category: "EVERYDAY",
    status: "OPEN",
  });
  await post("/requests", {
    title: "Занятие по английскому",
    description:
      "Хочу разобраться с домашним заданием. Ищу человека, который поможет с разговорной практикой.",
    city: "Тестовый город",
    category: "EDUCATION",
    status: "OPEN",
  });
  await post("/requests", {
    title: "Перевезти несколько коробок",
    description:
      "Нужно перевезти книги и вещи в соседний район. Коробки уже собраны.",
    city: "Тестовый город",
    category: "TRANSPORT",
    status: "OPEN",
  });
  await post("/wishes", {
    title: "Научиться играть на гитаре",
    description:
      "Мечтаю освоить первые аккорды. Буду рада советам и совместному занятию.",
  });
  const lot = await post("/auctions", {
    title: "Гитара с историей",
    description: "Тестовый лот для проверки дизайна. Без оплаты.",
    celebrity: "Учебный пример",
    charity: "Помощь сообществу",
    startPrice: 15000,
    startsAt: new Date(Date.now() - 60000).toISOString(),
    endsAt: new Date(Date.now() + 3600000).toISOString(),
  });
  const screens = [
    ["requests", "/requests", "Nearby requests"],
    ["map", "/map", "Nearby requests"],
    ["detail", "/requests/" + request.id, "Помочь с покупками"],
    ["stars", "/stars", "Qoldau Stars"],
    ["profile", "/profile", "Дана"],
    ["wishes", "/wishes", "Wishes"],
    ["auctions", "/auctions", "Благотворительные аукционы"],
    ["auction", "/auctions/" + lot.id, "Гитара с историей"],
    ["settings", "/profile/settings", "Настройки профиля"],
    ["create", "/new", "О чём попросим?"],
    ["my-requests", "/my-requests", "Мои просьбы"],
  ];
  for (const [name, path, title] of screens) {
    await page.goto("/#" + path);
    // Hash-only navigation does not remount the session provider after request-context login.
    await page.reload();
    await expect(
      page.getByRole("heading", { name: title, exact: true }).first(),
    ).toBeVisible();
    await expect(page.locator(".loading")).toHaveCount(0);
    await expect(page.locator(".ant-spin-spinning")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      name + " overflows",
    ).toBeTruthy();
    await page.screenshot({
      path:
        "test-results/design/" + testInfo.project.name + "-" + name + ".png",
      fullPage: true,
    });
  }
  await page.goto("/#/stars");
  await expect(page.getByRole("button", { name: /Cash/ })).toBeDisabled();
  await expect(
    page.getByText("Баллы и ранги пока не начисляются.", { exact: true }),
  ).toBeVisible();
  await page.goto("/#/profile");
  await expect(
    page.getByRole("button", { name: /My help history/ }),
  ).toBeDisabled();
  if (testInfo.project.name === "mobile") {
    await expect(
      page.getByRole("navigation", { name: "Основная навигация" }),
    ).toBeVisible();
    for (const width of [320, 768, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of [
        "/welcome",
        "/requests",
        "/map",
        "/stars",
        "/profile",
        "/wishes",
        "/auctions",
        "/requests/" + request.id,
      ]) {
        await page.goto("/#" + path);
        await expect(page.locator(".loading")).toHaveCount(0);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          path + " overflows at " + width,
        ).toBeTruthy();
      }
    }
  }
  expect(errors).toEqual([]);
});
