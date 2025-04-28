import fs from 'fs';
import path from 'path';
import TokenValidator from '../validators/tokenValidator.js';
import { transformToCSS } from '../transformers/cssTransformer.js';
import { transformToJSON } from '../transformers/jsonTransformer.js';
import logger from '../utils/logger.js';
// import slackNotifier from '../utils/slackNotifier.js';

export default class FileProcessor {
  constructor(config) {
    this.config = config;
    this.validator = new TokenValidator();
  }

  async process(inputPath, outputDir) {
    try {
      logger.info('Processing design tokens file...');
      
      // Validate the input file
      this.validator.validateFile(inputPath);
      
      // Read and parse the tokens
      const tokens = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
      
      // Create output directory if it doesn't exist
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Generate CSS output
      const cssOutput = transformToCSS(tokens);
      fs.writeFileSync(
        path.join(outputDir, 'design_tokens.css'),
        cssOutput
      );

      // Generate JSON output
      const jsonOutput = transformToJSON(tokens);
      fs.writeFileSync(
        path.join(outputDir, 'design_tokens.json'),
        JSON.stringify(jsonOutput, null, 2)
      );

      logger.info('Successfully processed design tokens');
      return {
        cssPath: path.join(outputDir, 'design_tokens.css'),
        jsonPath: path.join(outputDir, 'design_tokens.json')
      };
    } catch (error) {
      logger.error('Failed to process design tokens file', error);
      // await slackNotifier.sendError(error.message);
      throw error;
    }
  }
} 