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

      const allTokens = { 'font-family': {} };
      const themeTokens = {};

      // 1. Separate font files and theme files
      for (const file of tokenFiles) {
        const filePath = path.join(inputDir, file);
        const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (fileContent.font && fileContent.font.family && fileContent.font.family.$value) {
          const fontFamilyName = fileContent.font.family.$value;
          const sanitizedFontName = fontFamilyName.replace(/\s+/g, '-').toLowerCase();
          
          // Create a new structure for the font
          const fontData = {
            'abstraction': fileContent.font.abstraction,
            'font-size': fileContent.font.size,
            'weight': fileContent.font.weight
          };

          // Rewrite aliases within the abstraction to be self-contained
          if (fontData.abstraction) {
            for (const key in fontData.abstraction) {
              const token = fontData.abstraction[key];
              if (token.$value && typeof token.$value === 'string' && token.$value.startsWith('{font.size.')) {
                token.$value = token.$value.replace('{font.size.', `{font-family.${sanitizedFontName}.font-size.`);
              }
            }
          }
          
          allTokens['font-family'][sanitizedFontName] = fontData;
        } else if (file.includes('theme')) {
          // Store theme files separately for now
          themeTokens[file] = fileContent;
        } else {
          // For other files, iterate and merge manually, skipping the 'font' key
          this.deepMerge(allTokens, fileContent);
        }
      }

      // 2. Now process theme files and rewrite their font references
      for (const fileName in themeTokens) {
        const themeContent = themeTokens[fileName];
        
        // Rewrite font references in theme files before merging
        function rewriteFontReferencesInTheme(obj) {
          for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
              if ('$value' in obj[key] && typeof obj[key].$value === 'string') {
                if (obj[key].$value.startsWith('{font.abstraction.')) {
                  const originalValue = obj[key].$value;
                  const fontNameMatch = originalValue.match(/\{font\.abstraction\.([a-zA-Z0-9-]+)-/);
                  if (fontNameMatch && fontNameMatch[1]) {
                    const sanitizedFontName = fontNameMatch[1];
                    obj[key].$value = originalValue.replace('{font.abstraction.', `{font-family.${sanitizedFontName}.abstraction.`);
                  }
                }
              } else {
                rewriteFontReferencesInTheme(obj[key]);
              }
            }
          }
        }
        
        rewriteFontReferencesInTheme(themeContent);
        
        // Manually merge theme content, skipping the 'font' key
        this.deepMerge(allTokens, themeContent);
      }

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const cssLines = transformToCSS(allTokens);
      const cssPath = path.join(outputDir, 'design_tokens.css');
      fs.writeFileSync(cssPath, cssLines.join('\n') + '\n');

      // Generate JSON output
      const jsonPath = path.join(outputDir, 'design_tokens.json');
      fs.writeFileSync(jsonPath, JSON.stringify(allTokens, null, 2));

      logger.info('Successfully processed Zeroheight design tokens');
      return {
        cssPath: cssPath,
        jsonPath: jsonPath,
      };
    } catch (error) {
      logger.error('Failed to process Zeroheight design tokens', error);
      throw error;
    }
  }

  deepMerge(target, source) {
    for (const key in source) {
      if (key === 'font' || key === 'font-size') {
        continue;
      }
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