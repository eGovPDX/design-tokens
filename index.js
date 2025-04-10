// index.js
/**
 * Main script to extract design tokens from Figma and transform them to CSS.
 */

require('dotenv').config();
const FigmaAuth = require('./src/figmaAuth');
const FigmaTokenExtractor = require('./src/figmaTokenExtractor');
const TokenTransformer = require('./src/tokenTransformer');
const fs = require('fs');
const path = require('path');

/**
 * Main function to extract design tokens from Figma and transform them to CSS.
 * 
 * @param {object} options - Configuration options
 * @returns {Promise<void>}
 */
async function main(options) {
  const { fileKey, token, outputDir } = options;
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  try {
    // Initialize Figma authentication
    const figmaAuth = new FigmaAuth(token);
    
    // Test authentication
    const isAuthenticated = await figmaAuth.testAuthentication();
    if (!isAuthenticated) {
      console.error('Failed to authenticate with Figma API');
      process.exit(1);
    }
    
    // Initialize token extractor
    const extractor = new FigmaTokenExtractor(figmaAuth);
    
    // Extract tokens
    const tokens = await extractor.extractTokens(fileKey);
    
    // Save tokens to JSON
    const jsonPath = path.join(outputDir, 'design_tokens.json');
    extractor.saveTokensToJson(tokens, jsonPath);
    
    // Initialize token transformer
    const transformer = new TokenTransformer();
    
    // Transform tokens to CSS
    const css = transformer.transformToCss(tokens);
    
    // Save CSS to file
    const cssPath = path.join(outputDir, 'design_tokens.css');
    transformer.saveCssToFile(css, cssPath);
    
    console.log('Successfully extracted and transformed design tokens');
    return { tokens, css };
  } catch (error) {
    console.error(`Error: ${error.message}`);
    throw error;
  }
}

// If this script is run directly
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  let fileKey, token, outputDir = './output';
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file-key' && i + 1 < args.length) {
      fileKey = args[i + 1];
      i++;
    } else if (args[i] === '--token' && i + 1 < args.length) {
      token = args[i + 1];
      i++;
    } else if (args[i] === '--output-dir' && i + 1 < args.length) {
      outputDir = args[i + 1];
      i++;
    }
  }
  
  if (!fileKey) {
    console.error('Error: --file-key is required');
    process.exit(1);
  }
  
  main({ fileKey, token, outputDir })
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
} else {
  // Export for use as a module
  module.exports = main;
}
