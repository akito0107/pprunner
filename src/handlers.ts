import { default as assert } from "assert";
import { default as faker } from "faker";
import { PathLike } from "fs";
import { default as produce } from "immer";
import { Page } from "puppeteer";
import { default as RandExp } from "randexp";
import { ActionName, ActionType } from "./main";

export type Context = {
  currentIteration: number;
  precondition: {
    steps: Array<{}>;
  };
  steps: Array<{}>;
};

export type ActionHandler<T extends ActionName> = (
  page: Page,
  action: ActionType<T>,
  options?: { imageDir: PathLike; context: Context }
) => Promise<any>;

export const inputHandler: ActionHandler<"input"> = async (
  page,
  { action }
) => {
  const input = action.form;
  if (input.value) {
    if (typeof input.value === "string") {
      await page.type(input.selector, input.value);
    } else {
      const fake = faker.fake(`{{${input.value.faker}}}`);
      await page.type(input.selector, fake);
      return;
    }
  } else if (input.constrains && input.constrains.regexp) {
    const regex = new RegExp(input.constrains.regexp);

    const randex = new RandExp(regex);
    randex.defaultRange.subtract(32, 126);
    randex.defaultRange.add(0, 65535);

    await page.type(input.selector, randex.gen());
  }
};

export const waitHandler: ActionHandler<"wait"> = async (page, { action }) => {
  await page.waitFor(action.duration);
};

export const clickHandler: ActionHandler<"click"> = async (
  page,
  { action }
) => {
  await page.waitForSelector(action.selector);
  await page.tap("body");
  await page.$eval(action.selector, s => (s as any).click());
};

export const radioHandler: ActionHandler<"radio"> = async (
  page,
  { action }
) => {
  await page.$eval(`${action.form.selector}[value="${action.form.value}"]`, s =>
    (s as any).click()
  );
};

export const selectHandler: ActionHandler<"select"> = async (
  page,
  { action }
) => {
  const select = action.form;
  const v = select.constrains.values;
  await page.select(
    select.selector,
    `${v[Math.floor(Math.random() * v.length)]}`
  );
};

export const ensureHandler: ActionHandler<"ensure"> = async (
  page,
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

export const screenshotHandler: ActionHandler<"screenshot"> = async (
  page,
  { action },
  { imageDir }
) => {
  const filename = action.name;
  const now = Date.now();
  await page.screenshot({
    fullPage: true,
    path: `${imageDir}/${filename + now.toLocaleString()}.png`
  });
};
