import { default as assert } from "assert";
import { default as faker } from "faker";
import { PathLike } from "fs";
import { Page } from "puppeteer";
import { default as RandExp } from "randexp";
import { ActionName, ActionType } from "./main";

export type ActionHandler<T extends ActionName> = (
  context: Page,
  action: ActionType<T>,
  options?: { imageDir: PathLike }
) => Promise<any>;

export const inputHandler: ActionHandler<"input"> = async (ctx, { action }) => {
  const input = action.form;
  if (input.value) {
    if (typeof input.value === "string") {
      await ctx.type(input.selector, input.value);
    } else {
      const fake = faker.fake(`{{${input.value.faker}}}`);
      await ctx.type(input.selector, fake);
      return;
    }
  } else if (input.constrains && input.constrains.regexp) {
    const regex = new RegExp(input.constrains.regexp);

    const randex = new RandExp(regex);
    randex.defaultRange.subtract(32, 126);
    randex.defaultRange.add(0, 65535);

    await ctx.type(input.selector, randex.gen());
  }
};

export const waitHandler: ActionHandler<"wait"> = async (ctx, { action }) => {
  await ctx.waitFor(action.duration);
};

export const clickHandler: ActionHandler<"click"> = async (ctx, { action }) => {
  await ctx.waitForSelector(action.selector);
  await ctx.tap("body");
  await ctx.$eval(action.selector, s => (s as any).click());
};

export const radioHandler: ActionHandler<"radio"> = async (ctx, { action }) => {
  await ctx.$eval(`${action.form.selector}[value="${action.form.value}"]`, s =>
    (s as any).click()
  );
};

export const selectHandler: ActionHandler<"select"> = async (
  ctx,
  { action }
) => {
  const select = action.form;
  const v = select.constrains.values;
  await ctx.select(
    select.selector,
    `${v[Math.floor(Math.random() * v.length)]}`
  );
};

export const ensureHandler: ActionHandler<"ensure"> = async (
  ctx,
  { action }
) => {
  if (action.location) {
    const url = await ctx.url();

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
  ctx,
  { action },
  { imageDir }
) => {
  const filename = action.name;
  const now = Date.now();
  await ctx.screenshot({
    fullPage: true,
    path: `${imageDir}/${filename + now.toLocaleString()}.png`
  });
};
