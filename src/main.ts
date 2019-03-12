import { PathLike } from "fs";
import { default as pino } from "pino";
import { default as puppeteer, LaunchOptions, Page } from "puppeteer";
import { Builder, WebDriver } from "selenium-webdriver";
import { ActionHandler } from "./handlers/types";
import { BrowserType, isPuppeteer } from "./util";

const logger = pino();

import { default as d } from "debug";
const debug = d("pprunner");

// exports handlers
import * as ChromeHandlers from "./handlers/chrome-handlers";
import * as IEHandlers from "./handlers/ie-handlers";
export { ChromeHandlers, IEHandlers };

export type Scenario = {
  skip?: boolean;
  name: string;
  iteration: number;
  url: string;
  precondition: {
    url: string;
    steps: Action[];
  };
  steps: Action[];
};

export type Action =
  | InputAction
  | ClickAction
  | SelectAction
  | WaitAction
  | EnsureAction
  | RadioAction
  | ScreenshotAction
  | GotoAction
  | ClearAction;

type Value =
  | string
  | {
      faker: string;
      date: string;
    };

export type ActionName =
  | "input"
  | "click"
  | "select"
  | "wait"
  | "ensure"
  | "radio"
  | "screenshot"
  | "goto"
  | "clear";

export type ActionType<T extends ActionName> = T extends "input"
  ? InputAction
  : T extends "click"
  ? ClickAction
  : T extends "select"
  ? SelectAction
  : T extends "wait"
  ? WaitAction
  : T extends "ensure"
  ? EnsureAction
  : T extends "radio"
  ? RadioAction
  : T extends "screenshot"
  ? ScreenshotAction
  : T extends "goto"
  ? GotoAction
  : T extends "clear"
  ? ClearAction
  : never;

type Constrains = {
  required: boolean;
  regexp: string;
};

export type InputAction = {
  action: {
    type: "input";
    form: {
      selector: string;
      constrains?: Constrains;
      value?: Value;
    };
  };
};

export type ClickAction = {
  action: {
    type: "click";
    selector: string;
  };
};

export type SelectAction = {
  action: {
    type: "select";
    form: {
      selector: string;
      constrains: {
        required: boolean;
        values: Value[];
      };
    };
  };
};

export type WaitAction = {
  action: {
    type: "wait";
    duration: number;
  };
};

export type ScreenshotAction = {
  action: {
    type: "screenshot";
    name: string;
  };
};

export type EnsureAction = {
  action: {
    type: "ensure";
    location: {
      regexp?: string;
      value?: string;
    };
  };
};

export type RadioAction = {
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

export type GotoAction = {
  action: {
    type: "goto";
    url: string;
  };
};

export type ClearAction = {
  action: {
    type: "clear";
    selector: string;
  };
};

export type RunnerOption = {
  browser: puppeteer.Browser | WebDriver;
  scenario: Scenario;
  imageDir: PathLike;
  launchOption?: LaunchOptions;
  handlers: { [key in ActionName]: ActionHandler<key> };
};

export async function getBrowser(
  type: BrowserType,
  opts
): Promise<puppeteer.Browser | WebDriver> {
  return type === "ie"
    ? new Builder().forBrowser("internet explorer").build()
    : puppeteer.launch(opts);
}

export const run = async ({
  browser,
  scenario,
  handlers,
  imageDir
}: RunnerOption) => {
  logger.info("precondition start.");

  let page: puppeteer.Page | WebDriver = browser as WebDriver;
  if (isPuppeteer(browser)) {
    page = await (browser as puppeteer.Browser).newPage();
  }

  const precondition = scenario.precondition;
  if (precondition) {
    await handlers.goto(page, {
      action: { type: "goto", url: precondition.url }
    });
    try {
      await handleAction(page, handlers, precondition.steps, imageDir);
    } catch (e) {
      logger.error(e);
      await handlers.screenshot(
        page,
        {
          action: { type: "screenshot", name: "pre" }
        },
        { imageDir }
      );
    }
    logger.info("precondition done.");
  }

  const now = Date.now();
  logger.info(`main scenario start. at ${now.toLocaleString()}`);
  for (let i = 0; i < scenario.iteration; i++) {
    logger.info(`${i} th iteration start`);
    try {
      logger.info(`${scenario.name} start`);
      await handlers.goto(page, {
        action: { type: "goto", url: scenario.url }
      });
      await handleAction(page, handlers, scenario.steps, imageDir);
    } catch (e) {
      await handlers.screenshot(
        page,
        {
          action: { type: "screenshot", name: i.toString() }
        },
        { imageDir }
      );
      throw e;
    }
  }
  logger.info("main scenario end");

  await browser.close();
};

async function handleAction(
  page: Page | WebDriver,
  handlers: { [key in ActionName]: ActionHandler<key> },
  steps: Action[],
  imageDir: PathLike
) {
  for (const step of steps) {
    const action = step.action;
    logger.info(action);
    const handler = handlers[action.type];
    if (handler) {
      await handler(page, { action } as any, { imageDir });
    }
    continue;

    throw new Error(`unknown action type: ${(action as any).type}`);
  }
}
