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
 * Merge multiple token objects into a single object.
 * 
 * @param {object[]} tokenObjects - Array of token objects to merge
 * @returns {object} - Merged token object
 */
function mergeTokens(tokenObjects) {
  const mergedTokens = {
    colors: {},
    typography: {},
    spacing: {}
  };

  tokenObjects.forEach(tokens => {
    if (tokens.colors) {
      Object.assign(mergedTokens.colors, tokens.colors);
    }
    if (tokens.typography) {
      Object.assign(mergedTokens.typography, tokens.typography);
    }
    if (tokens.spacing) {
      Object.assign(mergedTokens.spacing, tokens.spacing);
    }
  });

  return mergedTokens;
}

/**
 * Main function to extract design tokens from Figma and transform them to CSS.
 * 
 * @param {object} options - Configuration options
 * @returns {Promise<void>}
 */
async function main(options) {
  const { fileKeys, token, outputDir } = options;
  
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
    
    // Get file keys
    const fileKeyArray = Array.isArray(fileKeys) 
      ? fileKeys 
      : fileKeys.split(',').map(key => key.trim());
    
    // Initialize token extractor with node IDs
    const extractor = new FigmaTokenExtractor(figmaAuth, {
      typographyNodeId: process.env.FIGMA_TYPOGRAPHY_NODE_ID,
      colorNodeId: process.env.FIGMA_COLOR_NODE_ID,
      spacingNodeId: process.env.FIGMA_SPACING_NODE_ID
    });
    
    // Extract tokens from all files
    const tokenPromises = fileKeyArray.map(fileKey => extractor.extractTokens(fileKey));
    const tokenObjects = await Promise.all(tokenPromises);
    const tokens = mergeTokens(tokenObjects);
    
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
  let fileKeys, token, outputDir = './output';
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file-keys' && i + 1 < args.length) {
      fileKeys = args[i + 1];
      i++;
    } else if (args[i] === '--token' && i + 1 < args.length) {
      token = args[i + 1];
      i++;
    } else if (args[i] === '--output-dir' && i + 1 < args.length) {
      outputDir = args[i + 1];
      i++;
    }
  }
  
  if (!fileKeys) {
    console.error('Error: --file-keys is required');
    process.exit(1);
  }
  
  main({ fileKeys, token, outputDir })
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
} else {
  // Export for use as a module
  module.exports = main;
}
