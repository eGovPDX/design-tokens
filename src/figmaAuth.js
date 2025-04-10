// figmaAuth.js
/**
 * Figma API Authentication Module
 * 
 * This module handles authentication with the Figma API using a personal access token.
 */

const axios = require('axios');
require('dotenv').config();

class FigmaAuth {
  /**
   * Initialize the FigmaAuth class with a token.
   * 
   * @param {string} token - Figma personal access token. If not provided, will try to get from environment variable.
   */
  constructor(token) {
    this.token = token || process.env.FIGMA_ACCESS_TOKEN;
    
    if (!this.token) {
      throw new Error('Figma access token is required. Provide it as an argument or set the FIGMA_ACCESS_TOKEN environment variable.');
    }
    
    // Set up headers for API requests
    this.headers = {
      'X-Figma-Token': this.token,
      'Content-Type': 'application/json'
    };
    
    // Base URL for Figma API
    this.baseUrl = 'https://api.figma.com/v1';
  }
  
  /**
   * Get a Figma file by its key.
   * 
   * @param {string} fileKey - The Figma file key (can be parsed from the Figma file URL)
   * @returns {Promise<object>} - Promise resolving to the Figma file data
   */
  async getFile(fileKey) {
    console.log(`Fetching Figma file: ${fileKey}`);
    
    try {
      const response = await axios.get(`${this.baseUrl}/files/${fileKey}`, {
        headers: this.headers
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching Figma file:', error.message);
      throw error;
    }
  }
  
  /**
   * Get specific nodes from a Figma file.
   * 
   * @param {string} fileKey - The Figma file key
   * @param {string|string[]} nodeIds - A comma-separated string or array of node IDs to retrieve
   * @returns {Promise<object>} - Promise resolving to the requested nodes
   */
  async getFileNodes(fileKey, nodeIds) {
    const nodeIdsParam = Array.isArray(nodeIds) ? nodeIds.join(',') : nodeIds;
    console.log(`Fetching nodes ${nodeIdsParam} from file: ${fileKey}`);
    
    try {
      const response = await axios.get(`${this.baseUrl}/files/${fileKey}/nodes?ids=${nodeIdsParam}`, {
        headers: this.headers
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching Figma file nodes:', error.message);
      throw error;
    }
  }
  
  /**
   * Test if the authentication token is valid by making a simple API call.
   * 
   * @returns {Promise<boolean>} - Promise resolving to true if authentication is successful, false otherwise
   */
  async testAuthentication() {
    try {
      // Try to get the current user info as a simple test
      const response = await axios.get(`${this.baseUrl}/me`, {
        headers: this.headers
      });
      
      console.log('Authentication successful');
      return true;
    } catch (error) {
      console.error('Authentication failed:', error.message);
      return false;
    }
  }
}

module.exports = FigmaAuth;
