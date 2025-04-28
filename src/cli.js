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

program
  .option('--source <source>', 'Source of tokens (file or figma)')
  .option('--input <input>', 'Input file path')
  .option('--output <output>', 'Output directory path')
  .parse(args);

const options = program.opts();
console.log('Parsed options:', options);

async function main() {
  try {
    if (!options.source) {
      throw new Error('Source is required. Use --source file or --source figma');
    }

    if (options.source === 'file' && !options.input) {
      throw new Error('Input file path is required when using file source');
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
    console.log(`- CSS file: ${path.resolve(result.cssPath)}`);
    console.log(`- JSON file: ${path.resolve(result.jsonPath)}`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main(); 