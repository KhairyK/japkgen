#!/usr/bin/env node

import path from 'node:path';
import { Command } from 'commander';
import ora from 'ora';
import pc from 'picocolors';
import { processFile } from '../src/index.js';

const program = new Command();

program
  .name('docify')
  .description('Generate JSDoc automatically with Recast')
  .argument('<files...>', 'JavaScript or TypeScript file(s)')
  .option('-w, --write', 'Write changes back to the file')
  .option('-d, --dry-run', 'Show output without writing')
  .option('--overwrite', 'Replace existing docs on target nodes')
  .option('--ai', 'Use smart AI-like descriptions')
  .option('--config <path>', 'Path to config file')
  .option('--plugin <path...>', 'Load plugin file(s)')
  .option('--quiet', 'Reduce output')
  .action(async (files, options) => {
    let hadErrors = false;

    for (const file of files) {
      const spinner = options.quiet ? null : ora(pc.cyan(`Reading ${file}`)).start();

      try {
        const result = await processFile(file, {
          write: options.write && !options.dryRun,
          overwrite: options.overwrite,
          ai: options.ai,
          config: options.config,
          plugins: options.plugin || []
        });

        if (spinner) {
          spinner.succeed(pc.green(`Processed ${path.basename(file)}`));
        }

        if (options.dryRun || !options.write) {
          process.stdout.write(`\n--- ${path.basename(file)} ---\n`);
          process.stdout.write(result.output + '\n');
        } else if (!options.quiet) {
          console.log(pc.green(`✓ Wrote ${path.basename(file)}`));
        }
      } catch (error) {
        hadErrors = true;

        if (spinner) {
          spinner.fail(pc.red(`Failed ${path.basename(file)}`));
        }

        console.error(pc.red(`✖ ${error?.stack || error?.message || error}`));
      }
    }

    if (hadErrors) {
      process.exitCode = 1;
    }
  });

program.parseAsync(process.argv);
