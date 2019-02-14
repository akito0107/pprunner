import { PathLike } from "fs";
import { default as pino } from "pino";
import { default as puppeteer, LaunchOptions, Page } from "puppeteer";
import { ActionHandler } from "./handlers";

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
  | InputAction
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

export type ActionName =
  | "input"
  | "click"
  | "select"
  | "wait"
  | "ensure"
  | "radio"
  | "screenshot";

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

export type RunnerOption = {
  scenario: Scenario;
  imageDir: PathLike;
  launchOption?: LaunchOptions;
  handlers: { [key in ActionName]: ActionHandler<key> };
};

export const run = async ({
  scenario,
  handlers,
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
      await handleAction(page, handlers, precondition.steps, imageDir);
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
      await handleAction(page, handlers, scenario.steps, imageDir);
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

async function handleAction(
  page: Page,
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
