// figmaToGithub.js
/**
 * Figma to GitHub Integration Module
 * 
 * This module integrates the Figma token extraction with GitHub repository updates.
 */

const FigmaAuth = require('./figmaAuth');
const FigmaTokenExtractor = require('./figmaTokenExtractor');
const TokenTransformer = require('./tokenTransformer');
const GitHubClient = require('./githubClient');
const path = require('path');

class FigmaToGithub {
  /**
   * Initialize the FigmaToGithub integration.
   * 
   * @param {object} config - Configuration object
   * @param {string} config.figmaToken - Figma personal access token
   * @param {string} config.githubToken - GitHub personal access token
   * @param {string} config.fileKey - Figma file key
   * @param {string} config.owner - GitHub repository owner
   * @param {string} config.repo - GitHub repository name
   * @param {string} config.branch - GitHub branch (default: main)
   * @param {string} config.tokenPath - Path to save tokens in the repository (default: design-tokens)
   */
  constructor(config) {
    this.config = {
      branch: 'main',
      tokenPath: 'design-tokens',
      ...config
    };
    
    // Initialize clients
    this.figmaAuth = new FigmaAuth(this.config.figmaToken);
    this.githubClient = new GitHubClient(this.config.githubToken);
  }
  
  /**
   * Sync design tokens from Figma to GitHub.
   * 
   * @param {boolean} createPR - Whether to create a pull request (default: false)
   * @returns {Promise<object>} - Promise resolving to the sync results
   */
  async syncTokens(createPR = false) {
    try {
      console.log('Starting token sync from Figma to GitHub...');
      
      // Test connections
      const figmaAuthOk = await this.figmaAuth.testAuthentication();
      if (!figmaAuthOk) {
        throw new Error('Failed to authenticate with Figma API');
      }
      
      const githubAuthOk = await this.githubClient.testConnection();
      if (!githubAuthOk) {
        throw new Error('Failed to authenticate with GitHub API');
      }
      
      // Extract tokens from Figma
      const extractor = new FigmaTokenExtractor(this.figmaAuth);
      const tokens = await extractor.extractTokens(this.config.fileKey);
      
      // Transform tokens to CSS
      const transformer = new TokenTransformer();
      const css = transformer.transformToCss(tokens);
      
      // Prepare file paths
      const jsonPath = path.join(this.config.tokenPath, 'design_tokens.json');
      const cssPath = path.join(this.config.tokenPath, 'design_tokens.css');
      
      // Create branch if creating a PR
      let branchName = this.config.branch;
      if (createPR) {
        branchName = `update-design-tokens-${new Date().toISOString().replace(/[:.]/g, '-')}`;
        await this.githubClient.createBranch(
          this.config.owner,
          this.config.repo,
          branchName,
          this.config.branch
        );
      }
      
      // Update files in GitHub
      const jsonResult = await this.githubClient.createOrUpdateFile(
        this.config.owner,
        this.config.repo,
        jsonPath,
        JSON.stringify(tokens, null, 2),
        'Update design tokens JSON from Figma',
        branchName
      );
      
      const cssResult = await this.githubClient.createOrUpdateFile(
        this.config.owner,
        this.config.repo,
        cssPath,
        css,
        'Update design tokens CSS from Figma',
        branchName
      );
      
      // Create pull request if requested
      let prResult = null;
      if (createPR) {
        prResult = await this.githubClient.createPullRequest(
          this.config.owner,
          this.config.repo,
          'Update design tokens from Figma',
          'This PR updates the design tokens extracted from Figma.',
          branchName,
          this.config.branch
        );
      }
      
      console.log('Token sync completed successfully');
      return {
        tokens,
        css,
        jsonResult,
        cssResult,
        prResult
      };
    } catch (error) {
      console.error(`Error syncing tokens: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Check if tokens have changed since last sync.
   * 
   * @returns {Promise<boolean>} - Promise resolving to true if tokens have changed
   */
  async haveTokensChanged() {
    try {
      // Extract current tokens from Figma
      const extractor = new FigmaTokenExtractor(this.figmaAuth);
      const currentTokens = await extractor.extractTokens(this.config.fileKey);
      
      // Get tokens from GitHub
      const jsonPath = path.join(this.config.tokenPath, 'design_tokens.json');
      let githubTokens;
      
      try {
        const content = await this.githubClient.getFileContent(
          this.config.owner,
          this.config.repo,
          jsonPath,
          this.config.branch
        );
        githubTokens = JSON.parse(content);
      } catch (error) {
        // If file doesn't exist, tokens have changed
        if (error.status === 404) {
          return true;
        }
        throw error;
      }
      
      // Compare tokens
      return JSON.stringify(currentTokens) !== JSON.stringify(githubTokens);
    } catch (error) {
      console.error(`Error checking if tokens have changed: ${error.message}`);
      // If there's an error, assume tokens have changed to be safe
      return true;
    }
  }
}

module.exports = FigmaToGithub;
