const fs = require('fs');
const path = require('path');
const TokenValidator = require('../validators/tokenValidator');
const { transformToCSS } = require('../transformers/cssTransformer');
const { transformToJSON } = require('../transformers/jsonTransformer');
const logger = require('../utils/logger');
const slackNotifier = require('../utils/slackNotifier');

class FileProcessor {
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
      await slackNotifier.sendError(error.message);
      throw error;
    }
  }
}

module.exports = FileProcessor; 