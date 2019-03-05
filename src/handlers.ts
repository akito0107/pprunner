import { default as assert } from "assert";
import { default as faker } from "faker";
import { PathLike } from "fs";
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
      return { selector: input.selector, value: input.value };
    } else {
      const fake = faker.fake(`{{${input.value.faker}}}`);
      await page.type(input.selector, fake);
      return { selector: input.selector, value: fake };
    }
  } else if (input.constrains && input.constrains.regexp) {
    const regex = new RegExp(input.constrains.regexp);

    const randex = new RandExp(regex);
    randex.defaultRange.subtract(32, 126);
    randex.defaultRange.add(0, 65535);

    const v = randex.gen();

    await page.type(input.selector, randex.gen());
    return { selector: input.selector, value: v };
  }
};

export const waitHandler: ActionHandler<"wait"> = async (page, { action }) => {
  await page.waitFor(action.duration);
  return { selector: "", value: action.duration };
};

export const clickHandler: ActionHandler<"click"> = async (
  page,
  { action }
) => {
  await page.waitForSelector(action.selector);
  await page.tap("body");
  await page.$eval(action.selector, s => (s as any).click());
  return { selector: action.selector, value: true };
};

export const radioHandler: ActionHandler<"radio"> = async (
  page,
  { action }
) => {
  await page.$eval(`${action.form.selector}[value="${action.form.value}"]`, s =>
    (s as any).click()
  );
  return { selector: action.form.selector, value: action.form.value };
};

export const selectHandler: ActionHandler<"select"> = async (
  page,
  { action }
) => {
  const select = action.form;
  const v = select.constrains.values;
  const value = v[Math.floor(Math.random() * v.length)];
  await page.select(select.selector, `${value}`);
  return { selector: select.selector, value };
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

  return { selector: "", value: true };
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

  return { selector: "", value: true };
};

export const gotoHandler: ActionHandler<"goto"> = async (page, { action }) => {
  await page.goto(action.url, { waitUntil: "networkidle2" });
};
