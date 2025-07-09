import fs from 'fs';
import path from 'path';
import { transformToCSS } from '../transformers/zeroheightCssTransformer.js';
import logger from '../utils/logger.js';

export default class ZeroheightProcessor {
  constructor(config) {
    this.config = config;
  }

  async process(inputDir, outputDir) {
    try {
      logger.info('Processing design tokens from Zeroheight...');

      const tokenFiles = fs.readdirSync(inputDir).filter(file => file.endsWith('.json'));
      if (tokenFiles.length === 0) {
        logger.warn('No JSON token files found in the Zeroheight input directory.');
        return;
      }

      const allTokens = {};
      for (const file of tokenFiles) {
        const filePath = path.join(inputDir, file);
        const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (fileContent.font && fileContent.font.family && fileContent.font.family.$value) {
          const fontFamilyName = fileContent.font.family.$value;
          const sanitizedFontName = fontFamilyName.replace(/\s+/g, '-').toLowerCase();
          const fontTokens = fileContent.font;

          function rewriteAliases(obj) {
            for (const key in obj) {
              if (typeof obj[key] === 'object' && obj[key] !== null) {
                rewriteAliases(obj[key]);
              } else if (key === '$value' && typeof obj[key] === 'string' && obj[key].startsWith('{font.')) {
                obj[key] = obj[key].replace('{font.', `{font-${sanitizedFontName}.`);
              }
            }
          }
          
          rewriteAliases(fontTokens);
          allTokens[`font-${sanitizedFontName}`] = fontTokens;

        } else {
          this.deepMerge(allTokens, fileContent);
        }
      }

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const cssLines = transformToCSS(allTokens);
      const cssPath = path.join(outputDir, 'zeroheight_tokens.css');
      fs.writeFileSync(cssPath, cssLines.join('\n') + '\n');

      logger.info('Successfully processed Zeroheight design tokens');
      return {
        cssPath: cssPath,
        jsonPath: null
      };
    } catch (error) {
      logger.error('Failed to process Zeroheight design tokens', error);
      throw error;
    }
  }

  deepMerge(target, source) {
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (source[key] instanceof Object && key in target) {
          this.deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
  }
} 