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
      const fontTokenGroups = {};
      const themeTokens = {};

      // 1. Separate font files and theme files
      for (const file of tokenFiles) {
        const filePath = path.join(inputDir, file);
        const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (fileContent.font && fileContent.font.family && fileContent.font.family.$value) {
          const fontFamilyName = fileContent.font.family.$value;
          fontTokenGroups[fontFamilyName] = fileContent.font;
        } else if (file.includes('theme')) {
          // Store theme files separately for now
          themeTokens[file] = fileContent;
        } else {
          this.deepMerge(allTokens, fileContent);
        }
      }

      // 2. Process the collected font groups and add them to the main tokens object
      // Also create a mapping for font reference rewrites
      const fontNameMapping = {};
      for (const fontFamilyName in fontTokenGroups) {
        const sanitizedFontName = fontFamilyName.replace(/\s+/g, '-').toLowerCase();
        fontNameMapping[fontFamilyName] = sanitizedFontName;
        const fontTokens = fontTokenGroups[fontFamilyName];

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
      }

      // 3. Now process theme files and rewrite their font references
      for (const fileName in themeTokens) {
        const themeContent = themeTokens[fileName];
        
        // Rewrite font references in theme files before merging
        function rewriteFontReferencesInTheme(obj) {
          for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
              // Check if this object has a $value property
              if ('$value' in obj[key]) {
                if (typeof obj[key].$value === 'string' && obj[key].$value.startsWith('{font.')) {
                  const originalValue = obj[key].$value;
                  
                  // Check if this is a font abstraction reference
                  if (originalValue.includes('.abstraction.')) {
                    // Try to determine which font family this belongs to
                    for (const fontFamilyName in fontNameMapping) {
                      const sanitizedFontName = fontNameMapping[fontFamilyName];
                      // Check if the abstraction token name starts with the sanitized font name
                      if (originalValue.includes(`.abstraction.${sanitizedFontName}-`)) {
                        // Replace {font. with {font-<sanitized-name>.
                        obj[key].$value = originalValue.replace('{font.', `{font-${sanitizedFontName}.`);
                        break;
                      }
                    }
                  }
                }
              } else {
                // Recurse into the object
                rewriteFontReferencesInTheme(obj[key]);
              }
            }
          }
        }
        
        rewriteFontReferencesInTheme(themeContent);
        this.deepMerge(allTokens, themeContent);
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