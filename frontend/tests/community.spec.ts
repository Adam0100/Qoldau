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
    await helperPage.goto("/requests/" + requestId);
    await helperPage
      .getByRole("button", { name: "Offer help", exact: true })
      .click();
    await helperPage
      .getByLabel("Message to the author", {
        exact: true,
      })
      .fill("Тестовый отклик участника");
    await helperPage
      .getByRole("button", { name: "Send offer", exact: true })
      .click();
    await expect(
      helperPage.getByText("Your offer has been sent", { exact: true }),
    ).toBeVisible();
    await page.goto("/requests/" + requestId);
    await expect(
      page.getByText("Тестовый отклик участника", { exact: true }),
    ).toBeVisible();

    await page.goto("/stars");
    await page
      .getByLabel("What does helping mean to you?", { exact: true })
      .fill("История браузерной проверки");
    await page
      .getByRole("button", { name: "Publish / update", exact: true })
      .click();
    await expect(
      page.getByText("Story published", { exact: true }),
    ).toBeVisible();

    await page.goto("/wishes");
    const wishTitle = "Browser wish " + randomUUID().slice(0, 8);
    await page.getByLabel("My wish", { exact: true }).fill(wishTitle);
    await page
      .getByLabel("Tell us more", { exact: true })
      .fill("Тестовая мечта");
    await page.getByRole("button", { name: "Publish", exact: true }).click();
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
      .getByRole("button", { name: "Confirm fulfilment", exact: true })
      .click();
    await expect(card.getByText("Fulfilled", { exact: true })).toBeVisible();

    await page.goto("/auctions/new");
    const title = "Browser auction " + randomUUID().slice(0, 8);
    await page.getByLabel("Lot title", { exact: true }).fill(title);
    await page
      .getByLabel("Description and provenance", { exact: true })
      .fill("Учебный лот, не настоящий предмет");
    await page
      .getByLabel("Celebrity name (seller claim)", { exact: true })
      .fill("Тестовый участник");
    await page
      .getByLabel("Charitable purpose", { exact: true })
      .fill("Учебная проверка");
    await page.getByLabel("Starting price, ₸", { exact: true }).fill("100");
    const local = (time: number) => {
      const d = new Date(time);
      return new Date(time - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    };
    await page
      .getByLabel("Start (your local time)", { exact: true })
      .fill(local(Date.now() - 120000));
    await page
      .getByLabel("End (your local time)", { exact: true })
      .fill(local(Date.now() + 3600000));
    await page
      .getByRole("button", { name: "Publish lot", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await helperPage.goto(page.url());
    await helperPage
      .getByRole("spinbutton", { name: "Your bid", exact: true })
      .fill("200");
    await helperPage
      .getByRole("button", { name: "Place bid", exact: true })
      .click();
    await expect(
      helperPage.getByText("Bid accepted", { exact: true }),
    ).toBeVisible();
    await expect(
      helperPage.getByText("Member #" + helper, { exact: true }),
    ).toBeVisible();
  } finally {
    await second.close();
  }
});
