import { PathLike } from "fs";
import { default as produce } from "immer";
import { reduce } from "p-iteration";
import { default as pino } from "pino";
import { default as puppeteer, LaunchOptions } from "puppeteer";
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

type RunnerOptions = {
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
    : puppeteer.launch(opts);
}

async function getPage(
  type: BrowserType,
  browser: BrowserEngine<BrowserType>
): Promise<BrowserPage<BrowserType>> {
  return type === "ie"
    ? (browser as WebDriver)
    : (browser as puppeteer.Browser).newPage();
}

export const run = async ({
  browserType,
  scenario,
  handlers,
  imageDir,
  launchOption
}: RunnerOptions) => {
  logger.info("precondition start.");

  const browser = await getBrowser(browserType, launchOption);
  const page = await getPage(browserType, browser);

  const precondition = scenario.precondition;
  const context: Context = {
    currentIteration: 0,
    precondition: { steps: [] },
    steps: []
  };
  if (precondition) {
    await handlers.goto(page, {
      action: { type: "goto", url: precondition.url }
    });
    try {
      await handleAction(
        0,
        page,
        handlers,
        precondition.steps,
        { imageDir, context },
        (ctx, res) => {
          return produce(ctx, draft => {
            draft.precondition.steps.push(res);
          });
        }
      );
    } catch (e) {
      logger.error(e);
      await handlers.screenshot(
        page,
        {
          action: { type: "screenshot", name: "pre" }
        },
        { imageDir, context }
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
      await handleAction(
        i,
        page,
        handlers,
        scenario.steps,
        { context, imageDir },
        (ctx, res) => {
          return produce(ctx, draft => {
            draft.steps.push(res);
          });
        }
      );
    } catch (e) {
      await handlers.screenshot(
        page,
        {
          action: { type: "screenshot", name: i.toString() }
        },
        { imageDir, context }
      );
      throw e;
    }
  }
  logger.info("main scenario end");

  await browser.close();
};

type ContextReducer = (ctx: Context, res: object) => Context;

async function handleAction<T extends BrowserType>(
  iteration: number,
  page: BrowserPage<T>,
  handlers: { [key in ActionName]: ActionHandler<key, T> },
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
