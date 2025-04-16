#!/usr/bin/env node

const { processTokens } = require('./index');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const options = {};

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].slice(2);
    const value = args[i + 1];
    if (value && !value.startsWith('--')) {
      options[key] = value;
      i++;
    } else {
      options[key] = true;
    }
  }
}

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