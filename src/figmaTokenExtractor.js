// figmaTokenExtractor.js
/**
 * Figma Design Token Extractor
 * 
 * This module extracts design tokens (colors, typography, spacing) from Figma files.
 */

const fs = require('fs');
const path = require('path');

class FigmaTokenExtractor {
  /**
   * Initialize the FigmaTokenExtractor with a FigmaAuth instance.
   * 
   * @param {object} auth - An authenticated FigmaAuth instance
   */
  constructor(auth) {
    this.auth = auth;
  }
  
  /**
   * Extract all design tokens from a Figma file.
   * 
   * @param {string} fileKey - The Figma file key
   * @returns {Promise<object>} - Promise resolving to extracted design tokens
   */
  async extractTokens(fileKey) {
    console.log(`Extracting design tokens from file: ${fileKey}`);
    
    try {
      // Get the file data
      const fileData = await this.auth.getFile(fileKey);
      
      // Extract tokens
      const colors = this._extractColors(fileData);
      const typography = this._extractTypography(fileData);
      const spacing = this._extractSpacing(fileData);
      
      // Combine all tokens
      const tokens = {
        colors,
        typography,
        spacing
      };
      
      console.log(`Extracted ${Object.keys(colors).length} colors, ${Object.keys(typography).length} typography styles, and ${Object.keys(spacing).length} spacing values`);
      
      return tokens;
    } catch (error) {
      console.error('Error extracting tokens:', error.message);
      throw error;
    }
  }
  
  /**
   * Extract color tokens from Figma file data.
   * 
   * @param {object} fileData - The Figma file data
   * @returns {object} - Object mapping color names to color values
   */
  _extractColors(fileData) {
    const colors = {};
    
    // Look for color styles in the styles dictionary
    const styles = fileData.styles || {};
    
    // Process document to find color styles
    const document = fileData.document || {};
    
    // Find color style nodes
    this._processNodeForColors(document, styles, colors);
    
    return colors;
  }
  
  /**
   * Recursively process nodes to find color styles.
   * 
   * @param {object} node - The current node to process
   * @param {object} styles - The styles dictionary from the file data
   * @param {object} colors - The colors dictionary to populate
   * @param {string} path - The current path in the node hierarchy
   */
  _processNodeForColors(node, styles, colors, path = '') {
    // Check if this node has a style ID that corresponds to a color style
    if (node.styles && node.styles.fill) {
      const styleId = node.styles.fill;
      if (styles[styleId] && styles[styleId].style_type === 'FILL') {
        // This is a color style
        const styleName = styles[styleId].name;
        
        // Extract the color value from the fills
        if (node.fills && node.fills.length > 0) {
          const fill = node.fills[0];
          if (fill.type === 'SOLID' && fill.color) {
            const color = fill.color;
            const r = Math.round(color.r * 255);
            const g = Math.round(color.g * 255);
            const b = Math.round(color.b * 255);
            const a = color.a !== undefined ? color.a : 1;
            
            // Format as hex or rgba
            let colorValue;
            if (a < 1) {
              colorValue = `rgba(${r}, ${g}, ${b}, ${a})`;
            } else {
              colorValue = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            }
            
            colors[styleName] = colorValue;
          }
        }
      }
    }
    
    // Process children recursively
    if (node.children) {
      for (const child of node.children) {
        const childPath = path ? `${path}/${child.name || ''}` : (child.name || '');
        this._processNodeForColors(child, styles, colors, childPath);
      }
    }
  }
  
  /**
   * Extract typography tokens from Figma file data.
   * 
   * @param {object} fileData - The Figma file data
   * @returns {object} - Object mapping typography style names to typography properties
   */
  _extractTypography(fileData) {
    const typography = {};
    
    // Look for text styles in the styles dictionary
    const styles = fileData.styles || {};
    
    // Process document to find text styles
    const document = fileData.document || {};
    
    // Find text style nodes
    this._processNodeForTypography(document, styles, typography);
    
    return typography;
  }
  
  /**
   * Recursively process nodes to find typography styles.
   * 
   * @param {object} node - The current node to process
   * @param {object} styles - The styles dictionary from the file data
   * @param {object} typography - The typography dictionary to populate
   * @param {string} path - The current path in the node hierarchy
   */
  _processNodeForTypography(node, styles, typography, path = '') {
    // Check if this node has a style ID that corresponds to a text style
    if (node.styles && node.styles.text) {
      const styleId = node.styles.text;
      if (styles[styleId] && styles[styleId].style_type === 'TEXT') {
        // This is a text style
        const styleName = styles[styleId].name;
        
        // Extract the typography properties
        if (node.style) {
          const style = node.style;
          const typographyProps = {
            fontFamily: style.fontFamily || '',
            fontSize: style.fontSize || 0,
            fontWeight: style.fontWeight || 400,
            lineHeight: style.lineHeight ? style.lineHeight.value || 'normal' : 'normal',
            letterSpacing: style.letterSpacing || 0,
            textCase: style.textCase || 'none',
            textDecoration: style.textDecoration || 'none'
          };
          
          typography[styleName] = typographyProps;
        }
      }
    }
    
    // Process children recursively
    if (node.children) {
      for (const child of node.children) {
        const childPath = path ? `${path}/${child.name || ''}` : (child.name || '');
        this._processNodeForTypography(child, styles, typography, childPath);
      }
    }
  }
  
  /**
   * Extract spacing tokens from Figma file data.
   * 
   * @param {object} fileData - The Figma file data
   * @returns {object} - Object mapping spacing names to spacing values
   */
  _extractSpacing(fileData) {
    const spacing = {};
    
    // Process document to find spacing values
    const document = fileData.document || {};
    
    // Find spacing nodes (typically frames or components with specific names)
    this._processNodeForSpacing(document, spacing);
    
    return spacing;
  }
  
  /**
   * Recursively process nodes to find spacing values.
   * 
   * @param {object} node - The current node to process
   * @param {object} spacing - The spacing dictionary to populate
   * @param {string} path - The current path in the node hierarchy
   */
  _processNodeForSpacing(node, spacing, path = '') {
    // Check if this node's name indicates it's a spacing token
    const name = node.name || '';
    
    // Look for nodes with names that suggest they're spacing tokens
    // Common patterns include "Spacing/4", "space-sm", etc.
    if (name.toLowerCase().includes('spacing') || name.toLowerCase().includes('space-')) {
      // Extract the spacing value
      if (node.absoluteBoundingBox) {
        // Use width or height as the spacing value
        const width = node.absoluteBoundingBox.width || 0;
        const height = node.absoluteBoundingBox.height || 0;
        
        // Use the smaller dimension as the spacing value
        const value = (width > 0 && height > 0) ? Math.min(width, height) : Math.max(width, height);
        
        if (value > 0) {
          spacing[name] = value;
        }
      }
    }
    
    // Process children recursively
    if (node.children) {
      for (const child of node.children) {
        const childPath = path ? `${path}/${child.name || ''}` : (child.name || '');
        this._processNodeForSpacing(child, spacing, childPath);
      }
    }
  }
  
  /**
   * Save extracted tokens to a JSON file.
   * 
   * @param {object} tokens - The extracted tokens
   * @param {string} outputPath - Path to save the JSON file
   */
  saveTokensToJson(tokens, outputPath) {
    try {
      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write tokens to file
      fs.writeFileSync(outputPath, JSON.stringify(tokens, null, 2));
      
      console.log(`Saved tokens to ${outputPath}`);
    } catch (error) {
      console.error(`Error saving tokens to JSON: ${error.message}`);
      throw error;
    }
  }
}

module.exports = FigmaTokenExtractor;
