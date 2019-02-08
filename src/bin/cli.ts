#!/usr/bin/env node

import { default as program } from "commander";
import { default as fs } from "fs";
import { default as yaml } from "js-yaml";
import { default as path } from "path";
import { default as readdir } from "recursive-readdir";
import { run } from "../main";

program
  .version("0.0.1")
  .option("-p, --path <caseDir>", "cases root dir")
  .option("-i, --image-dir <imgDir>", "screehshots dir")
  .option("-h, --headless", "headless mode (default=true)", true)
  .parse(process.argv);

process.on("unhandledRejection", err => {
  process.stderr.write(err.toString());
  process.exit(1);
});

main(program);

async function main(pg) {
  const files = await readdir(path.resolve(process.cwd(), pg.path));
  const imageDir = path.resolve(process.cwd(), pg.imageDir);
  for (const f of files) {
    const doc = yaml.safeLoad(fs.readFileSync(f));
    await run({
      imageDir,
      launchOption: { headless: pg.headless },
      scenario: doc
    });
  }
}
