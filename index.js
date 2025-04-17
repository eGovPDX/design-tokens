#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const TokenProcessor = require('./src/tokenProcessor');

program
  .name('design-tokens-processor')
  .description('Process design tokens from Tokens Studio output')
  .version('1.0.0');

program
  .command('process')
  .description('Process design tokens from a file')
  .requiredOption('--input <path>', 'Input file path')
  .requiredOption('--output <path>', 'Output directory path')
  .action(async (options) => {
    try {
      const processor = new TokenProcessor();
      await processor.processFromFile(options.input, options.output);
      console.log('✅ Tokens processed successfully!');
    } catch (error) {
      console.error('❌ Error processing tokens:', error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
