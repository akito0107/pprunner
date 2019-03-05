import { PathLike } from "fs";
import { default as produce } from "immer";
import { reduce } from "p-iteration";
import { default as pino } from "pino";
import { default as puppeteer, LaunchOptions, Page } from "puppeteer";
import { ActionHandler, Context, gotoHandler } from "./handlers";

const logger = pino();

import { default as d } from "debug";
const debug = d("pprunner");

// exports handlers
export {
  inputHandler,
  waitHandler,
  clickHandler,
  radioHandler,
  selectHandler,
  ensureHandler,
  screenshotHandler,
  gotoHandler
} from "./handlers";

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
  | GotoAction;

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
  | "screenshot"
  | "goto";

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
  : never;

type Constrains = {
  required: boolean;
  regexp: string;
};

export type InputAction = {
  name?: string;
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
  name?: string;
  action: {
    type: "click";
    selector: string;
  };
};

export type SelectAction = {
  name?: string;
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
  name?: string;
  action: {
    type: "wait";
    duration: number;
  };
};

export type ScreenshotAction = {
  name?: string;
  action: {
    type: "screenshot";
    name: string;
  };
};

export type EnsureAction = {
  name?: string;
  action: {
    type: "ensure";
    location: {
      regexp?: string;
      value?: string;
    };
  };
};

export type RadioAction = {
  name?: string;
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
  name?: string;
  action: {
    type: "goto";
    url: string;
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
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: false,
    ignoreHTTPSErrors: true,
    ...launchOption
  };
  debug(opts);
  const browser = await puppeteer.launch(opts);
  const page = await browser.newPage();

  logger.info("precondition start.");

  const context: Context = {
    currentIteration: 0,
    precondition: { steps: [] },
    steps: []
  };

  const precondition = scenario.precondition;
  if (precondition) {
    await gotoHandler(page, {
      action: { type: "goto", url: precondition.url }
    });
    try {
      await handleAction(
        0,
        page,
        handlers,
        precondition.steps,
        {
          context,
          imageDir
        },
        (ctx, res) => {
          return produce(ctx, draft => {
            draft.precondition.steps.push(ctx);
          });
        }
      );
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
      logger.info(`${scenario.name} start`);
      await gotoHandler(page, { action: { type: "goto", url: scenario.url } });
      await handleAction(
        i,
        page,
        handlers,
        scenario.steps,
        {
          context,
          imageDir
        },
        (ctx, res) => {
          return produce(ctx, draft => {
            draft.steps.push(res);
          });
        }
      );
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

type ContextReducer = (ctx: Context, res: object) => Context;

async function handleAction(
  iteration: number,
  page: Page,
  handlers: { [key in ActionName]: ActionHandler<key> },
  steps: Action[],
  { imageDir, context }: { imageDir: PathLike; context: Context },
  reducer: ContextReducer
) {
  return reduce(
    steps,
    async (acc: Context, step) => {
      const action = step.action;
      logger.info(action);
      const handler = handlers[action.type];
      if (!handler) {
        throw new Error(`unknown action type: ${(action as any).type}`);
      }
      const res = await handler(page, { action } as any, {
        context: {
          ...acc,
          currentIteration: iteration
        },
        imageDir
      });
      return reducer(acc, res);
    },
    context
  );
}
