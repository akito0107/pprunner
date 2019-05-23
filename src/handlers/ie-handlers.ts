import { default as assert } from "assert";
import { default as faker } from "faker";
import { default as fs } from "fs";
import { default as pretty } from "pretty";
import { default as RandExp } from "randexp";
import { By, WebDriver } from "selenium-webdriver";
import { promisify } from "util";
import { ActionHandler } from "../types";
import { getBrowserType } from "../util";

export const inputHandler: ActionHandler<"input", "ie"> = async (
  driver: WebDriver,
  { action }
) => {
  const input = action.form;
  const target = await driver.findElement(By.css(input.selector));

  if (input.value) {
    if (typeof input.value === "string") {
      await target.sendKeys(input.value);

      return { meta: action.meta, value: input.value };
    }
    if (input.value.faker) {
      const fake = faker.fake(`{{${input.value.faker}}}`);
      await target.sendKeys(fake);

      return { meta: action.meta, value: fake };
    }
    if (input.value.date) {
      const d = new Date(input.value.date);
      const date = d.getDate();
      const month = d.getMonth() + 1;
      const dateStr = `${d.getFullYear()}-${month < 10 ? "0" + month : month}-${
        date < 10 ? "0" + date : date
      }`;
      await target.sendKeys(dateStr);

      return { meta: action.meta, value: dateStr };
    }
    throw new Error(`unknown input action ${action}`);
  }
  if (input.constrains && input.constrains.regexp) {
    const regex = new RegExp(input.constrains.regexp);

    const randex = new RandExp(regex);
    randex.defaultRange.subtract(32, 126);
    randex.defaultRange.add(0, 65535);
    const value = randex.gen();
    await target.sendKeys(value);

    return { meta: action.meta, value };
  }
  throw new Error(`unknown input action ${action}`);
};

export const waitHandler: ActionHandler<"wait", "ie"> = async (
  driver: WebDriver,
  { action }
) => {
  await driver.sleep(action.duration);

  return { meta: action.meta, duration: action.duration };
};

export const clickHandler: ActionHandler<"click", "ie"> = async (
  driver: WebDriver,
  { action }
) => {
  // due to webdriver, can't use arrow-functions
  /* tslint:disable only-arrow-functions */
  const scrollIntoViewIfNeeded = function(el) {
    const rect = el.getBoundingClientRect();
    window.scrollTo(rect.left, rect.top / 2);
  };
  /* tslint:enable */
  const element = driver.findElement(By.css(action.selector));
  await driver.executeScript(scrollIntoViewIfNeeded, element);
  await driver.sleep(1000);
  await element.click();
  return { meta: action.meta };
};

export const selectHandler: ActionHandler<"select", "ie"> = async (
  driver,
  { action }
) => {
  const select = action.form;
  const v = select.constrains && select.constrains.values;
  let value = "";
  if (v && v.length > 0) {
    value = v[Math.floor(Math.random() * v.length)] as any; // FIXME
  } else {
    // due to webdriver, can't use arrow-functions
    /* tslint:disable only-arrow-functions */
    const selectValueFunction = function(parentSelector) {
      return document.querySelector(parentSelector).children[0].value;
    };
    /* tslint:enable */
    value = await driver.executeScript(
      selectValueFunction,
      action.form.selector
    );
  }
  const selector = `${select.selector} [value='${value}']`;
  await driver.findElement(By.css(selector)).click();

  return { meta: action.meta, value };
};

export const radioHandler: ActionHandler<"radio", "ie"> = async (
  driver,
  { action }
) => {
  // due to webdriver, can't use arrow-functions
  /* tslint:disable only-arrow-functions */
  const radioFunction = function(form) {
    const element = Array.from(document.querySelectorAll(form.selector)).filter(
      function(el) {
        return el.value === form.value.toString();
      }
    )[0];
    element.click();
  };
  /* tslint:enable */
  await driver.executeScript(radioFunction, action.form);

  return { meta: action.meta, value: action.form.value };
};

export const ensureHandler: ActionHandler<"ensure", "ie"> = async (
  driver,
  { action }
) => {
  if (!action.location) {
    return { meta: action.meta, ensure: false };
  }
  const url = await driver.getCurrentUrl();

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
  return { meta: action.meta, ensure: true };
};

export const screenshotHandler: ActionHandler<"screenshot", "ie"> = async (
  driver: WebDriver,
  { action },
  { imageDir }
) => {
  const filename = action.name;
  const now = Date.now();
  const image = await driver.takeScreenshot();
  const path = `${imageDir}/ie-${now}-${filename}.png`;
  await promisify(fs.writeFile)(path, image, "base64");

  return { meta: action.meta, value: path };
};

export const gotoHandler: ActionHandler<"goto", "ie"> = async (
  driver: WebDriver,
  { action }
) => {
  await driver.get(action.url);

  return { meta: action.meta, value: action.url };
};

export const clearHandler: ActionHandler<"clear", "ie"> = async (
  driver: WebDriver,
  { action }
) => {
  await driver.findElement(By.css(action.selector)).clear();

  return { meta: action.meta };
};

export const dumpHandler: ActionHandler<"dump", "ie"> = async (
  driver: WebDriver,
  { action }
) => {
  const html = await driver.executeScript(
    "return document.getElementsByTagName('html')[0].innerHTML"
  );
  console.log(pretty(html));
  return { meta: action.meta, body: html };
};
