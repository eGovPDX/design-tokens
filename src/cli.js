#!/usr/bin/env node

import { processTokens } from './index.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { program } from 'commander';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Debug: Log all arguments
console.log('Raw arguments:', process.argv);

// Remove the first two arguments (node and script path)
const args = process.argv.slice(2);
console.log('Processed arguments:', args);

// Remove the -- argument if it exists
const filteredArgs = args.filter(arg => arg !== '--');
console.log('Filtered arguments:', filteredArgs);

// Parse arguments manually first
const options = {};
for (let i = 0; i < filteredArgs.length; i++) {
  const arg = filteredArgs[i];
  if (arg.startsWith('--')) {
    const key = arg.slice(2);
    const value = filteredArgs[i + 1];
    if (value && !value.startsWith('--')) {
      options[key] = value;
      i++; // Skip the next argument since we've used it
    } else {
      options[key] = true;
    }
  }
}

console.log('Manually parsed options:', options);

// Now use commander to validate the options
program
  .option('--source <source>', 'Source of tokens (file, figma, or zeroheight)')
  .option('--input <input>', 'Input file path')
  .option('--output <output>', 'Output directory path')
  .parse(filteredArgs);

const commanderOptions = program.opts();
console.log('Commander parsed options:', commanderOptions);

async function main() {
  try {
    if (!options.source) {
      throw new Error('Source is required. Use --source file, --source figma, or --source zeroheight');
    }

    if ((options.source === 'file' || options.source === 'zeroheight') && !options.input) {
      throw new Error('Input file or directory path is required when using file or zeroheight source');
    }

    if (options.source === 'figma' && !process.env.FIGMA_ACCESS_TOKEN) {
      throw new Error('FIGMA_ACCESS_TOKEN environment variable is required when using figma source');
    }

    const config = {
      inputPath: options.input,
      outputDir: options.output || './output',
      figmaFileKey: options.figmaFileKey
    };

    console.log('Using config:', config);

    // Create output directory if it doesn't exist
    if (!fs.existsSync(config.outputDir)) {
      fs.mkdirSync(config.outputDir, { recursive: true });
    }

    const result = await processTokens(options.source, config);
    console.log('Successfully processed tokens:');
    if (result.cssPath) {
      console.log(`- CSS file: ${path.resolve(result.cssPath)}`);
    }
    if (result.jsonPath) {
      console.log(`- JSON file: ${path.resolve(result.jsonPath)}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main(); 