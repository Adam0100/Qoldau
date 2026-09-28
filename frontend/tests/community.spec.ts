import { test, expect, BrowserContext } from "@playwright/test";
import { randomUUID } from "node:crypto";

async function account(context: BrowserContext) {
  const token = (await (await context.request.get("/api/auth/csrf")).json())
    .token;
  const credentials = {
    email: "browser-" + randomUUID() + "@example.test",
    password: randomUUID(),
  };
  const registered = await context.request.post("/api/auth/register", {
    headers: { "X-CSRF-TOKEN": token },
    data: { ...credentials, name: "Browser member", city: "Алматы" },
  });
  expect(registered.ok()).toBeTruthy();
  const login = await context.request.post("/api/auth/login", {
    headers: { "X-CSRF-TOKEN": token },
    data: credentials,
  });
  expect(login.ok()).toBeTruthy();
  return (await login.json()).id;
}
async function mutate(context: BrowserContext, path: string, body?: unknown) {
  const token = (await (await context.request.get("/api/auth/csrf")).json())
    .token;
  return context.request.post("/api" + path, {
    headers: { "X-CSRF-TOKEN": token },
    data: body,
  });
}
test("community modules and a second member helping and bidding", async ({
  page,
  context,
  browser,
}) => {
  const owner = await account(context);
  const second = await browser.newContext({
    baseURL: process.env.E2E_BASE_URL || "http://localhost:5173",
  });
  try {
    const helper = await account(second);
    const request = await mutate(context, "/requests", {
      title: "Browser help scenario",
      description: "Browser test fixture",
      city: "Алматы",
      category: "EVERYDAY",
      status: "OPEN",
    });
    expect(request.ok()).toBeTruthy();
    const requestId = (await request.json()).id;
    const helperPage = await second.newPage();
    await helperPage.goto("/#/requests/" + requestId);
    await helperPage
      .getByRole("button", { name: "Хочу помочь", exact: true })
      .click();
    await helperPage
      .getByLabel("Как вы можете помочь? Оставьте способ связи, если хотите.", {
        exact: true,
      })
      .fill("Тестовый отклик участника");
    await helperPage
      .getByRole("button", { name: "Отправить отклик", exact: true })
      .click();
    await expect(
      helperPage.getByText("Ваш отклик отправлен", { exact: true }),
    ).toBeVisible();
    await page.goto("/#/requests/" + requestId);
    await expect(
      page.getByText("Тестовый отклик участника", { exact: true }),
    ).toBeVisible();

    await page.goto("/#/stars");
    await page
      .getByLabel("Что для вас значит помогать?", { exact: true })
      .fill("История браузерной проверки");
    await page
      .getByRole("button", { name: "Опубликовать / обновить", exact: true })
      .click();
    await expect(
      page.getByText("История опубликована", { exact: true }),
    ).toBeVisible();

    await page.goto("/#/wishes");
    const wishTitle = "Browser wish " + randomUUID().slice(0, 8);
    await page.getByLabel("Моё желание", { exact: true }).fill(wishTitle);
    await page
      .getByLabel("Расскажите подробнее", { exact: true })
      .fill("Тестовая мечта");
    await page
      .getByRole("button", { name: "Опубликовать", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: wishTitle, exact: true }),
    ).toBeVisible();
    const wishes = await (await context.request.get("/api/wishes")).json();
    const wish = wishes.items.find(
      (x: any) => x.authorId === owner && x.title === wishTitle,
    );
    expect(
      (await mutate(second, "/wishes/" + wish.id + "/pledge")).ok(),
    ).toBeTruthy();
    await page.reload();
    const card = page.locator(".wish-card").filter({
      has: page.getByRole("heading", { name: wishTitle, exact: true }),
    });
    await card
      .getByRole("button", { name: "Подтвердить исполнение", exact: true })
      .click();
    await expect(card.getByText("Исполнено", { exact: true })).toBeVisible();

    await page.goto("/#/auctions/new");
    const title = "Browser auction " + randomUUID().slice(0, 8);
    await page.getByLabel("Название лота", { exact: true }).fill(title);
    await page
      .getByLabel("Описание и происхождение вещи", { exact: true })
      .fill("Учебный лот, не настоящий предмет");
    await page
      .getByLabel("Имя знаменитости (заявление автора)", { exact: true })
      .fill("Тестовый участник");
    await page
      .getByLabel("Благотворительная цель", { exact: true })
      .fill("Учебная проверка");
    await page.getByLabel("Стартовая цена, ₸", { exact: true }).fill("100");
    const local = (time: number) => {
      const d = new Date(time);
      return new Date(time - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    };
    await page
      .getByLabel("Начало (ваше местное время)", { exact: true })
      .fill(local(Date.now() - 120000));
    await page
      .getByLabel("Окончание (ваше местное время)", { exact: true })
      .fill(local(Date.now() + 3600000));
    await page
      .getByRole("button", { name: "Опубликовать лот", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await helperPage.goto(page.url());
    await helperPage
      .getByRole("spinbutton", { name: "Ваша ставка", exact: true })
      .fill("200");
    await helperPage
      .getByRole("button", { name: "Сделать ставку", exact: true })
      .click();
    await expect(
      helperPage.getByText("Ставка принята", { exact: true }),
    ).toBeVisible();
    await expect(
      helperPage.getByText("Участник №" + helper, { exact: true }),
    ).toBeVisible();
  } finally {
    await second.close();
  }
});
