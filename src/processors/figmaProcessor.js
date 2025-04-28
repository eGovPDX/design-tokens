import fs from 'fs';
import path from 'path';
import TokenValidator from '../validators/tokenValidator.js';
import { transformToCSS } from '../transformers/cssTransformer.js';
import { transformToJSON } from '../transformers/jsonTransformer.js';
import logger from '../utils/logger.js';
import slackNotifier from '../utils/slackNotifier.js';

export default class FigmaProcessor {
  constructor(config) {
    this.config = config;
    this.validator = new TokenValidator();
  }

  async process(figmaFileKey, outputDir) {
    try {
      logger.info('Processing Figma design tokens...');
      
      // For now, just read from the local file
      const inputPath = 'design-tokens.json';
      
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
      logger.error('Failed to process Figma design tokens', error);
      await slackNotifier.sendError(error.message);
      throw error;
    }
  }
} 