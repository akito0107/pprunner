import { default as assert } from "assert";
import { default as faker } from "faker";
import { default as fs } from "fs";
import { default as RandExp } from "randexp";
import { By, Key, WebDriver } from "selenium-webdriver";
import { promisify } from "util";
import { getBrowserType } from "../util";
import { ActionHandler } from "./types";

export const inputHandler: ActionHandler<"input"> = async (
  driver: WebDriver,
  { action }
) => {
  const input = action.form;
  const target = await driver.findElement(By.css(input.selector));

  if (input.value) {
    if (typeof input.value === "string") {
      await target.sendKeys(input.value);
    } else {
      const fake = faker.fake(`{{${input.value.faker}}}`);
      await target.sendKeys(fake);
      return;
    }
  } else if (input.constrains && input.constrains.regexp) {
    const regex = new RegExp(input.constrains.regexp);

    const randex = new RandExp(regex);
    randex.defaultRange.subtract(32, 126);
    randex.defaultRange.add(0, 65535);
    await target.sendKeys(randex.gen());
  }
};

export const waitHandler: ActionHandler<"wait"> = async (
  driver: WebDriver,
  { action }
) => {
  await driver.sleep(action.duration);
};

export const clickHandler: ActionHandler<"click"> = async (
  driver: WebDriver,
  { action }
) => {
  await driver.findElement(By.css(action.selector)).click();
};

export async function selectHandler(driver, { action }) {
  const select = action.form;
  const v = select.constrains.values;
  const value = v[Math.floor(Math.random() * v.length)];
  const selector = `${select.selector} [value='${value}']`;
  await driver.findElement(By.css(selector)).click();
}

export async function radioHandler(driver, { action }) {
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
}

export async function ensureHandler(driver, { action }) {
  if (action.location) {
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
  }
}

export const screenshotHandler: ActionHandler<"screenshot"> = async (
  driver: WebDriver,
  { action },
  { imageDir }
) => {
  const filename = action.name;
  const now = Date.now();
  const image = await driver.takeScreenshot();
  const path = `${imageDir}/${getBrowserType(driver)}-${now}-${filename}.png`;
  await promisify(fs.writeFile)(path, image, "base64");
};

export const gotoHandler: ActionHandler<"goto"> = async (
  driver: WebDriver,
  { action }
) => {
  await driver.get(action.url);
};

export const clearHandler: ActionHandler<"clear"> = async (
  driver: WebDriver,
  { action }
) => {
  await driver.findElement(By.css(action.selector)).clear();
};
