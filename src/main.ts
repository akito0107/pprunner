import { default as assert } from "assert";
import { default as faker } from "faker";
import { PathLike } from "fs";
import { default as pino } from "pino";
import { default as puppeteer, LaunchOptions, Page } from "puppeteer";
import { default as RandExp } from "randexp";

const logger = pino();

export type Scenario = {
  iteration: number;
  url: string;
  precondition: {
    url: string;
    steps: Action[];
  };
  steps: Action[];
};

export type Action =
  | InputActon
  | ClickAction
  | SelectAction
  | WaitAction
  | EnsureAction
  | RadioAction
  | ScreenshotAction;

type Value =
  | string
  | {
      faker: string;
    };

type actionType =
  | "input"
  | "click"
  | "select"
  | "wait"
  | "ensure"
  | "radio"
  | "screenshot";

type ActionType<T extends actionType> = T extends "input"
  ? "input"
  : T extends "click"
  ? "click"
  : T extends "select"
  ? "select"
  : T extends "wait"
  ? "wait"
  : T extends "ensure"
  ? "ensure"
  : T extends "radio"
  ? "radio"
  : T extends "screenshot"
  ? "screenshot"
  : never;

type Constrains = {
  required: boolean;
  regexp: string;
};

type InputActon = {
  action: {
    type: ActionType<"input">;
    form: {
      selector: string;
      constrains?: Constrains;
      value?: Value;
    };
  };
};

type ClickAction = {
  action: {
    type: ActionType<"click">;
    selector: string;
  };
};

type SelectAction = {
  action: {
    type: ActionType<"select">;
    form: {
      selector: string;
      constrains: {
        required: boolean;
        values: Value[];
      };
    };
  };
};

type WaitAction = {
  action: {
    type: ActionType<"wait">;
    duration: number;
  };
};

type ScreenshotAction = {
  action: {
    type: ActionType<"screenshot">;
    name: string;
  };
};

type EnsureAction = {
  action: {
    type: "ensure";
    location: {
      value: string;
    };
  };
};

type RadioAction = {
  action: {
    type: "radio";
    form: {
      selector: string;
      constrains?: {
        required: boolean;
      };
      value: string;
    };
  };
};

export type RunnerOption = {
  scenario: Scenario;
  imageDir: PathLike;
  launchOption?: LaunchOptions;
};

export const run = async ({
  scenario,
  imageDir,
  launchOption = {}
}: RunnerOption) => {
  const opts = {
    ...launchOption,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: false,
    ignoreHTTPSErrors: true
  };
  const browser = await puppeteer.launch(opts);
  const page = await browser.newPage();

  logger.info("precondition start.");
  const precondition = scenario.precondition;
  if (precondition) {
    await goto(page, precondition.url);
    try {
      await handleAction(page, precondition.steps, imageDir);
    } catch (e) {
      logger.error(e);
      await page.screenshot({ path: `${imageDir}/pre.png`, fullPage: true });
    }
    logger.info("precondition done.");
  }

  const now = Date.now();
  logger.info(`main scenario start. at ${now.toLocaleString()}`);
  for (let i = 0; i < scenario.iteration; i++) {
    logger.info(`${i} th iteration start`);
    try {
      await goto(page, scenario.url);
      await handleAction(page, scenario.steps, imageDir);
    } catch (e) {
      await page.screenshot({
        fullPage: true,
        path: `${imageDir}/${now.toLocaleString()}-${i}.png`
      });
      throw e;
    }
  }
  logger.info("main scenario end");

  await browser.close();
};

async function goto(page, url) {
  await page.goto(url, { waitUntil: "networkidle2" });
}

async function handleAction(page: Page, steps: Action[], imageDir: PathLike) {
  for (const step of steps) {
    const action = step.action;
    logger.info(action);
    switch (action.type) {
      case "input":
        const input = action.form;
        if (input.value) {
          if (typeof input.value === "string") {
            await page.type(input.selector, input.value);
          } else {
            const fake = faker.fake(`{{${input.value.faker}}}`);
            await page.type(input.selector, fake);
            break;
          }
        } else if (input.constrains && input.constrains.regexp) {
          const regex = new RegExp(input.constrains.regexp);

          const randex = new RandExp(regex);
          randex.defaultRange.subtract(32, 126);
          randex.defaultRange.add(0, 65535);

          await page.type(input.selector, randex.gen());
        }
        break;

      case "wait":
        await page.waitFor(action.duration);
        break;

      case "click":
        await page.waitForSelector(action.selector);
        await page.tap("body");
        await page.$eval(action.selector, s => (s as any).click());
        break;

      case "radio":
        await page.$eval(
          `${action.form.selector}[value="${action.form.value}"]`,
          s => (s as any).click()
        );
        break;
      case "select":
        const select = action.form;
        const v = select.constrains.values;
        await page.select(
          select.selector,
          `${v[Math.floor(Math.random() * v.length)]}`
        );
        break;

      case "ensure":
        await ensure(page, action);
        break;

      case "screenshot":
        const filename = action.name;
        const now = Date.now();
        await page.screenshot({
          fullPage: true,
          path: `${imageDir}/${filename + now.toLocaleString()}.png`
        });
        break;

      default:
        throw new Error(`unknown action type: ${(action as any).type}`);
    }
  }
}

async function ensure(page, conds) {
  if (conds.location) {
    const url = await page.url();

    if (conds.location.value) {
      assert.strictEqual(
        url,
        conds.location.value,
        `location check failed: must be ${conds.location.value}, but: ${url}`
      );
    }

    if (conds.location.regexp) {
      const regexp = new RegExp(conds.location.regexp);
      assert(
        regexp.test(url),
        `location check failed: must be ${conds.location.regexp}, but: ${url}`
      );
    }
  }
}
