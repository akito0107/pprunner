import { default as d } from "debug";
const debug = d("pprunner");

// exports handlers
import * as ChromeHandler from "./handlers/chrome-handlers";
import * as IEHandler from "./handlers/ie-handlers";

export { ChromeHandler, IEHandler };
export * from "./types";
export * from "./run";
