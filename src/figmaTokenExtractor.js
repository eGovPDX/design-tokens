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
   * @param {object} config - Configuration object
   * @param {string} config.typographyNodeId - Node ID for typography tokens
   * @param {string} config.colorNodeId - Node ID for color tokens
   * @param {string} config.spacingNodeId - Node ID for spacing tokens
   */
  constructor(auth, config = {}) {
    this.auth = auth;
    this.config = config;
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
      // Get specific nodes for each token type
      const [typographyNode, colorNode, spacingNode] = await Promise.all([
        this.auth.getFileNodes(fileKey, this.config.typographyNodeId),
        this.auth.getFileNodes(fileKey, this.config.colorNodeId),
        this.auth.getFileNodes(fileKey, this.config.spacingNodeId)
      ]);
      
      // Debug logging
      console.log('Typography node data:', JSON.stringify(typographyNode, null, 2));
      console.log('Color node data:', JSON.stringify(colorNode, null, 2));
      console.log('Spacing node data:', JSON.stringify(spacingNode, null, 2));
      
      // Extract tokens from each node
      const colors = this._extractColors(colorNode);
      const typography = this._extractTypography(typographyNode);
      const spacing = this._extractSpacing(spacingNode);
      
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
   * Extract color tokens from Figma node data.
   * 
   * @param {object} nodeData - The Figma node data
   * @returns {object} - Object mapping color names to color values
   */
  _extractColors(nodeData) {
    const colors = {};
    
    // Get the node from the response
    const node = this._getNodeFromResponse(nodeData);
    if (!node) return colors;
    
    // Process the node for colors
    this._processNodeForColors(node, colors);
    
    return colors;
  }
  
  /**
   * Extract typography tokens from Figma node data.
   * 
   * @param {object} nodeData - The Figma node data
   * @returns {object} - Object mapping typography style names to typography properties
   */
  _extractTypography(nodeData) {
    const typography = {};
    
    // Get the node from the response
    const node = this._getNodeFromResponse(nodeData);
    if (!node) return typography;
    
    // Process the node for typography
    this._processNodeForTypography(node, typography);
    
    return typography;
  }
  
  /**
   * Extract spacing tokens from Figma node data.
   * 
   * @param {object} nodeData - The Figma node data
   * @returns {object} - Object mapping spacing names to spacing values
   */
  _extractSpacing(nodeData) {
    const spacing = {};
    
    // Get the node from the response
    const node = this._getNodeFromResponse(nodeData);
    if (!node) return spacing;
    
    // Find spacing nodes
    this._processNodeForSpacing(node, spacing);
    
    return spacing;
  }
  
  /**
   * Get the node from the Figma API response.
   * 
   * @param {object} nodeData - The Figma node data
   * @returns {object|null} - The node or null if not found
   */
  _getNodeFromResponse(nodeData) {
    if (!nodeData || !nodeData.nodes) return null;
    
    // Get the first node from the response
    const nodeId = Object.keys(nodeData.nodes)[0];
    if (!nodeId) return null;
    
    return nodeData.nodes[nodeId].document;
  }
  
  /**
   * Recursively process nodes to find color styles.
   * 
   * @param {object} node - The current node to process
   * @param {object} colors - The colors dictionary to populate
   * @param {string} path - The current path in the node hierarchy
   */
  _processNodeForColors(node, colors, path = '') {
    // Check if this node has a fill with a color
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
        
        // Use the node name as the color name, or generate one if empty
        const colorName = node.name || `color-${Object.keys(colors).length + 1}`;
        colors[colorName] = colorValue;
      }
    }
    
    // Process children recursively
    if (node.children) {
      for (const child of node.children) {
        const childPath = path ? `${path}/${child.name || ''}` : (child.name || '');
        this._processNodeForColors(child, colors, childPath);
      }
    }
  }
  
  /**
   * Recursively process nodes to find typography styles.
   * 
   * @param {object} node - The current node to process
   * @param {object} typography - The typography dictionary to populate
   * @param {string} path - The current path in the node hierarchy
   */
  _processNodeForTypography(node, typography, path = '') {
    // Check if this node has text style properties
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
      
      // Use the node name as the typography name, or generate one if empty
      const typographyName = node.name || `typography-${Object.keys(typography).length + 1}`;
      typography[typographyName] = typographyProps;
    }
    
    // Process children recursively
    if (node.children) {
      for (const child of node.children) {
        const childPath = path ? `${path}/${child.name || ''}` : (child.name || '');
        this._processNodeForTypography(child, typography, childPath);
      }
    }
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
