const FileProcessor = require('./processors/fileProcessor');
const FigmaProcessor = require('./processors/figmaProcessor');
const logger = require('./utils/logger');
const slackNotifier = require('./utils/slackNotifier');

async function processTokens(source, config) {
  try {
    let processor;
    let result;

    if (source === 'file') {
      processor = new FileProcessor(config);
      result = await processor.process(
        config.inputPath,
        config.outputDir
      );
    } else if (source === 'figma') {
      processor = new FigmaProcessor(config);
      result = await processor.process(
        config.figmaFileKey,
        config.outputDir
      );
    } else {
      throw new Error(`Invalid source: ${source}`);
    }

    await slackNotifier.sendSuccess(
      `Processed design tokens from ${source}\n` +
      `Generated files:\n` +
      `- ${result.cssPath}\n` +
      `- ${result.jsonPath}`
    );

    return result;
  } catch (error) {
    logger.error('Failed to process tokens', error);
    await slackNotifier.sendError(error.message);
    throw error;
  }
}

module.exports = {
  processTokens
}; 