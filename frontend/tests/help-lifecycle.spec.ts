import { test, expect, BrowserContext } from "@playwright/test";
import { randomUUID } from "node:crypto";

async function post(context: BrowserContext, path: string, data?: unknown) {
  const token = (await (await context.request.get("/api/auth/csrf")).json())
    .token;
  return context.request.post("/api" + path, {
    headers: { "X-CSRF-TOKEN": token },
    data,
  });
}
async function account(context: BrowserContext, name: string) {
  const credentials = {
    email: randomUUID() + "@example.test",
    password: "abc123",
  };
  expect(
    (
      await post(context, "/auth/register", {
        ...credentials,
        name,
        city: "Almaty",
      })
    ).ok(),
  ).toBeTruthy();
  expect((await post(context, "/auth/login", credentials)).ok()).toBeTruthy();
}

test("private contacts, helper selection and exactly one Stars award", async ({
  page,
  context,
  browser,
}) => {
  test.setTimeout(90000);
  const helper = await browser.newContext({
    baseURL: process.env.E2E_BASE_URL || "http://localhost:5173",
  });
  const outsider = await browser.newContext({
    baseURL: process.env.E2E_BASE_URL || "http://localhost:5173",
  });
  try {
    await account(context, "Request author");
    await account(helper, "Chosen helper");
    await account(outsider, "Other member");
    await page.goto("/new");
    const title = "Помогите с книгами " + randomUUID().slice(0, 8);
    await page.getByLabel("Request title", { exact: true }).fill(title);
    await page
      .getByLabel("Details", { exact: true })
      .fill("Please carry my books");
    await page
      .getByRole("button", { name: "Post request", exact: true })
      .click();
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    const id = new URL(page.url()).pathname.split("/").pop();
    const url = "/requests/" + id;
    const helperPage = await helper.newPage();
    await helperPage.goto(url);
    await helperPage
      .getByRole("button", { name: "Offer help", exact: true })
      .click();
    await helperPage
      .getByLabel("Message to the author", { exact: true })
      .fill("I can help tomorrow");
    await expect(
      helperPage.getByLabel("Contact email", { exact: true }),
    ).not.toHaveValue("");
    await helperPage.getByLabel("Contact email", { exact: true }).fill("");
    await helperPage
      .getByRole("button", { name: "Send offer", exact: true })
      .click();
    await expect(
      helperPage.getByText("Provide a phone number or email address").first(),
    ).toBeVisible();
    expect(
      (
        await post(helper, url + "/responses", { message: "Missing contacts" })
      ).status(),
    ).toBe(400);
    await helperPage
      .getByLabel("Phone number", { exact: true })
      .fill("+7 700 123 4567");
    await helperPage
      .getByRole("button", { name: "Send offer", exact: true })
      .click();
    await expect(
      helperPage.getByText("Your offer has been sent", { exact: true }),
    ).toBeVisible();
    const offers = await (
      await context.request.get("/api" + url + "/responses")
    ).json();
    const offerUrl = "/api" + url + "/responses/" + offers[0].id;
    expect((await outsider.request.get(offerUrl)).status()).toBe(403);
    expect((await helper.request.get(offerUrl)).status()).toBe(200);
    await page.reload();
    await expect(
      page.getByText("Phone: +7 700 123 4567", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Chosen helper", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Select helper", exact: true })
      .click();
    await expect(page.getByText("In progress", { exact: true })).toBeVisible();
    await page
      .getByRole("button", { name: "Confirm help received", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText(
      "Chosen helper will receive 5 Qoldau Stars",
    );
    await dialog
      .getByRole("button", { name: "Confirm help received", exact: true })
      .click();
    await expect(
      page.getByText("Completed", { exact: true }).first(),
    ).toBeVisible();
    expect((await post(context, url + "/complete")).ok()).toBeTruthy();
    const summary = await (await helper.request.get("/api/me/stars")).json();
    expect(summary.balance).toBe(5);
    expect(summary.helpedCount).toBe(1);
    expect(summary.items).toHaveLength(1);
    expect(
      (await (await context.request.get("/api/me/stars")).json()).balance,
    ).toBe(0);
    await helperPage.goto("/profile");
    await expect(helperPage.getByTestId("stars-balance")).toHaveText("5");
    await expect(helperPage.getByTestId("helped-count")).toHaveText("1");
    await expect(
      helperPage.getByRole("link", { name: title, exact: true }),
    ).toBeVisible();
    await helperPage.reload();
    await expect(helperPage.getByTestId("stars-balance")).toHaveText("5");
  } finally {
    await helper.close();
    await outsider.close();
  }
});

test("registration enforces six characters in the browser", async ({
  page,
}) => {
  await page.goto("/login?mode=register");
  await page
    .getByLabel("Your name", { exact: true })
    .fill("Six character member");
  await page.getByLabel("City", { exact: true }).fill("Almaty");
  await page
    .getByLabel("Email", { exact: true })
    .fill(randomUUID() + "@example.test");
  await page.getByLabel("Password", { exact: true }).fill("12345");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByText("Password: 6 to 64 characters", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Password", { exact: true }).fill("123456");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Nearby requests" }),
  ).toBeVisible();
});
