import { default as assert } from "assert";
import { default as faker } from "faker";
import { Page } from "puppeteer";
import { default as RandExp } from "randexp";
import { ActionHandler } from "../types";
import { getBrowserType } from "../util";

export const inputHandler: ActionHandler<"input", "chrome"> = async (
  page: Page,
  { action }
) => {
  const input = action.form;
  if (input.value) {
    if (typeof input.value === "string") {
      await page.type(input.selector, input.value);
    } else if (input.value.faker) {
      const fake = faker.fake(`{{${input.value.faker}}}`);
      await page.type(input.selector, fake);
    } else if (input.value.date) {
      const d = new Date(input.value.date);
      const date = d.getDate();
      const month = d.getMonth() + 1;
      const dateStr = `${date < 10 ? "0" + date : date}${
        month < 10 ? "0" + month : month
      }${d.getFullYear()}`;
      await page.type(input.selector, dateStr);
    }
  } else if (input.constrains && input.constrains.regexp) {
    const regex = new RegExp(input.constrains.regexp);

    const randex = new RandExp(regex);
    randex.defaultRange.subtract(32, 126);
    randex.defaultRange.add(0, 65535);

    await page.type(input.selector, randex.gen());
  }
};

export const waitHandler: ActionHandler<"wait", "chrome"> = async (
  page: Page,
  { action }
) => {
  await page.waitFor(action.duration);
};

export const clickHandler: ActionHandler<"click", "chrome"> = async (
  page: Page,
  { action }
) => {
  await page.waitForSelector(action.selector);
  await page.tap("body");
  await page.$eval(action.selector, s => (s as any).click());
};

export const radioHandler: ActionHandler<"radio", "chrome"> = async (
  page: Page,
  { action }
) => {
  await page.$eval(`${action.form.selector}[value="${action.form.value}"]`, s =>
    (s as any).click()
  );
};

export const selectHandler: ActionHandler<"select", "chrome"> = async (
  page: Page,
  { action }
) => {
  const select = action.form;
  const v = select.constrains && select.constrains.values;
  if (v && v.length > 0) {
    await page.select(
      select.selector,
      `${v[Math.floor(Math.random() * v.length)]}`
    );
    return;
  }
  const value = await page.evaluate(selector => {
    return document.querySelector(selector).children[1].value;
  }, select.selector);
  await page.select(select.selector, `${value}`);
};

export const ensureHandler: ActionHandler<"ensure", "chrome"> = async (
  page: Page,
  { action }
) => {
  if (action.location) {
    const url = await page.url();

    if (action.location.value) {
      assert.strictEqual(
        url,
        action.location.value,
        `location check failed: must be ${action.location.value}, but: ${url}`
      );
    }

    if (action.location.regexp) {
      const regexp = new RegExp(action.location.regexp);
      assert(
        regexp.test(url),
        `location check failed: must be ${action.location.regexp}, but: ${url}`
      );
    }
  }
};

export const screenshotHandler: ActionHandler<"screenshot", "chrome"> = async (
  page: Page,
  { action },
  { imageDir }
) => {
  const filename = action.name;
  const now = Date.now();
  await page.screenshot({
    fullPage: true,
    path: `${imageDir}/${getBrowserType(page)}-${now}-${filename}.png`
  });
};

export const gotoHandler: ActionHandler<"goto", "chrome"> = async (
  page: Page,
  { action }
) => {
  await page.goto(action.url, { waitUntil: "networkidle2" });
};

export const clearHandler: ActionHandler<"clear", "chrome"> = async (
  page: Page,
  { action }
) => {
  await page.waitForSelector(action.selector);
  await page.click(action.selector, { clickCount: 3 });
  await page.keyboard.press("Backspace");
};
