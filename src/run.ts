import { PathLike } from "fs";
import { default as produce } from "immer";
import { reduce } from "p-iteration";
import { default as pino } from "pino";
import { default as puppeteer, LaunchOptions } from "puppeteer";
import {
  default as ffpuppeteer,
  LaunchOptions as ffLaunchOptions
} from "puppeteer-firefox";
import { Builder, WebDriver } from "selenium-webdriver";
import {
  Action,
  ActionName,
  BrowserEngine,
  BrowserPage,
  Scenario
} from "./main";
import { ActionHandler, BrowserType, Context } from "./types";

const logger = pino();

export type RunnerOptions = {
  browserType: BrowserType;
  scenario: Scenario;
  imageDir: PathLike;
  launchOption?: LaunchOptions;
  handlers: { [key in ActionName]: ActionHandler<key, BrowserType> };
};

async function getBrowser(
  type: BrowserType,
  opts
): Promise<BrowserEngine<BrowserType>> {
  return type === "ie"
    ? new Builder().forBrowser("internet explorer").build()
    : type === "firefox"
    ? ffpuppeteer.launch(opts)
    : puppeteer.launch(opts);
}

async function getPage(
  type: BrowserType,
  browser: BrowserEngine<BrowserType>
): Promise<BrowserPage<BrowserType>> {
  return type === "ie"
    ? (browser as WebDriver)
    : type === "firefox"
    ? (browser as ffpuppeteer.Browser).newPage()
    : (browser as puppeteer.Browser).newPage();
}

export const run = async ({
  browserType,
  scenario,
  handlers,
  imageDir,
  launchOption
}: RunnerOptions) => {
  const browser = await getBrowser(browserType, launchOption);
  const page = await getPage(browserType, browser);

  const initialContext: Context = {
    info: {
      options: { browserType, scenario, imageDir, launchOption, handlers },
      name: scenario.name
    },
    currentIteration: 0,
    precondition: { steps: [] },
    iterations: [{ steps: [] }]
  };

  const precondition = scenario.precondition;
  logger.info("precondition start.");
  const context: Context = precondition
    ? await handlePrecondition(page, handlers, scenario, {
        imageDir,
        context: initialContext,
        browserType
      })
    : initialContext;
  logger.info("precondition done.");

  logger.info("main scenario end");
  await handleIteration(page, handlers, scenario, {
    imageDir,
    context,
    browserType
  });
  logger.info("main scenario end");

  await browser.close();
};

type ContextReducer = (ctx: Context, res: any) => Context;

export async function handlePrecondition<T extends BrowserType>(
  page: BrowserPage<T>,
  handlers: { [key in ActionName]: ActionHandler<key, T> },
  scenario: Scenario,
  {
    imageDir,
    context,
    browserType
  }: { imageDir: PathLike; context: Context; browserType: T }
): Promise<Context> {
  await handlers.goto(page, {
    action: { type: "goto", url: scenario.precondition.url }
  });
  return handleAction(
    0,
    page,
    handlers,
    scenario.precondition.steps,
    {
      imageDir,
      context,
      browserType
    },
    (ctx, res) => {
      return produce(ctx, draft => {
        draft.precondition.steps.push(res);
      });
    }
  );
}

export async function handleIteration<T extends BrowserType>(
  page: BrowserPage<T>,
  handlers: { [key in ActionName]: ActionHandler<key, T> },
  scenario: Scenario,
  {
    imageDir,
    browserType,
    context
  }: { imageDir: PathLike; browserType: T; context: Context }
): Promise<Context> {
  return reduce(
    Array.from({ length: scenario.iteration }),
    async (acc: Context, current: number, idx) => {
      logger.info(`${idx} th iteration start`);
      logger.info(`${scenario.name} start`);
      await handlers.goto(page, {
        action: { type: "goto", url: scenario.url }
      });
      return handleAction(
        idx + 1,
        page,
        handlers,
        scenario.steps,
        {
          context: acc,
          imageDir,
          browserType
        },
        (ctx, res) => {
          return produce(ctx, draft => {
            if (!draft.iterations[idx]) {
              draft.iterations.push({ steps: [] });
            }
            draft.iterations[idx].steps.push(res);
          });
        }
      );
    },
    context
  );
}

export async function handleAction<T extends BrowserType>(
  iteration: number,
  page: BrowserPage<T>,
  handlers: { [key in ActionName]: ActionHandler<key, T> },
  steps: Action[],
  {
    imageDir,
    browserType,
    context
  }: { imageDir: PathLike; browserType: T; context: Context },
  reducer: ContextReducer
): Promise<Context> {
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
        imageDir,
        browserType
      });
      return reducer(acc, res);
    },
    context
  );
}
