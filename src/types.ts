import { PathLike } from "fs";
import { default as puppeteer } from "puppeteer";
import { WebDriver } from "selenium-webdriver";
import { ActionName, ActionType, RunnerOptions } from "./main";

export type Context = {
  info: {
    name: string;
    options: RunnerOptions;
  };
  currentIteration: number;
  precondition: {
    steps: Array<{}>;
  };
  iterations: Array<{
    steps: Array<{}>;
  }>;
};

export type BrowserType = "ie" | "chrome" | "firefox";

export type BrowserEngine<T extends BrowserType> = T extends "ie"
  ? WebDriver
  : puppeteer.Browser;

export type BrowserPage<T extends BrowserType> = T extends "ie"
  ? WebDriver
  : puppeteer.Page;

export type ActionHandler<T extends ActionName, E extends BrowserType> = (
  page: BrowserPage<E>,
  action: ActionType<T>,
  options?: { imageDir: PathLike; browserType: E; context: Context }
) => Promise<any>;

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

type ActionMeta = {
  name?: string;
  tag?: string;
};

export type InputAction = {
  action: {
    meta?: ActionMeta;
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
    meta?: ActionMeta;
    type: "click";
    selector: string;
    navigation: boolean;
  };
};

export type SelectAction = {
  action: {
    meta?: ActionMeta;
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
    meta?: ActionMeta;
    name?: string;
    type: "wait";
    duration: number;
  };
};

export type ScreenshotAction = {
  action: {
    meta?: ActionMeta;
    type: "screenshot";
    name: string;
  };
};

export type EnsureAction = {
  action: {
    meta?: ActionMeta;
    name?: string;
    type: "ensure";
    location: {
      regexp?: string;
      value?: string;
    };
  };
};

export type RadioAction = {
  action: {
    meta?: ActionMeta;
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
    meta?: ActionMeta;
    type: "goto";
    url: string;
  };
};

export type ClearAction = {
  action: {
    meta?: ActionMeta;
    type: "clear";
    selector: string;
  };
};
