// githubClient.js
/**
 * GitHub Client Module
 * 
 * This module handles interactions with the GitHub API for repository operations.
 */

const { Octokit } = require('@octokit/rest');
require('dotenv').config();

class GitHubClient {
  /**
   * Initialize the GitHubClient with a token.
   * 
   * @param {string} token - GitHub personal access token. If not provided, will try to get from environment variable.
   */
  constructor(token) {
    this.token = token || process.env.GITHUB_TOKEN;
    
    if (!this.token) {
      throw new Error('GitHub token is required. Provide it as an argument or set the GITHUB_TOKEN environment variable.');
    }
    
    // Initialize Octokit
    this.octokit = new Octokit({
      auth: this.token
    });
  }
  
  /**
   * Check if a file exists in a repository.
   * 
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} path - File path
   * @param {string} branch - Branch name (default: main)
   * @returns {Promise<boolean>} - Promise resolving to true if file exists, false otherwise
   */
  async fileExists(owner, repo, path, branch = 'main') {
    try {
      await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch
      });
      return true;
    } catch (error) {
      if (error.status === 404) {
        return false;
      }
      throw error;
    }
  }
  
  /**
   * Get file content from a repository.
   * 
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} path - File path
   * @param {string} branch - Branch name (default: main)
   * @returns {Promise<string>} - Promise resolving to file content
   */
  async getFileContent(owner, repo, path, branch = 'main') {
    try {
      const response = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch
      });
      
      // Decode content from base64
      const content = Buffer.from(response.data.content, 'base64').toString();
      return content;
    } catch (error) {
      console.error(`Error getting file content: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Create or update a file in a repository.
   * 
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} path - File path
   * @param {string} content - File content
   * @param {string} message - Commit message
   * @param {string} branch - Branch name (default: main)
   * @returns {Promise<object>} - Promise resolving to the API response
   */
  async createOrUpdateFile(owner, repo, path, content, message, branch = 'main') {
    try {
      // Check if file exists
      let sha;
      try {
        const response = await this.octokit.repos.getContent({
          owner,
          repo,
          path,
          ref: branch
        });
        sha = response.data.sha;
      } catch (error) {
        // File doesn't exist, which is fine for creation
        if (error.status !== 404) {
          throw error;
        }
      }
      
      // Create or update file
      const response = await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: Buffer.from(content).toString('base64'),
        sha,
        branch
      });
      
      console.log(`File ${path} created or updated in ${owner}/${repo}`);
      return response.data;
    } catch (error) {
      console.error(`Error creating or updating file: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Create a pull request.
   * 
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} title - Pull request title
   * @param {string} body - Pull request body
   * @param {string} head - Head branch
   * @param {string} base - Base branch (default: main)
   * @returns {Promise<object>} - Promise resolving to the API response
   */
  async createPullRequest(owner, repo, title, body, head, base = 'main') {
    try {
      const response = await this.octokit.pulls.create({
        owner,
        repo,
        title,
        body,
        head,
        base
      });
      
      console.log(`Pull request created: ${response.data.html_url}`);
      return response.data;
    } catch (error) {
      console.error(`Error creating pull request: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Create a branch.
   * 
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} branch - New branch name
   * @param {string} baseBranch - Base branch to create from (default: main)
   * @returns {Promise<object>} - Promise resolving to the API response
   */
  async createBranch(owner, repo, branch, baseBranch = 'main') {
    try {
      // Get the SHA of the latest commit on the base branch
      const baseRef = await this.octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${baseBranch}`
      });
      
      const sha = baseRef.data.object.sha;
      
      // Create the new branch
      const response = await this.octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branch}`,
        sha
      });
      
      console.log(`Branch ${branch} created in ${owner}/${repo}`);
      return response.data;
    } catch (error) {
      // If branch already exists, just return it
      if (error.status === 422) {
        console.log(`Branch ${branch} already exists in ${owner}/${repo}`);
        return { ref: `refs/heads/${branch}` };
      }
      
      console.error(`Error creating branch: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Test the GitHub connection.
   * 
   * @returns {Promise<boolean>} - Promise resolving to true if connection is successful
   */
  async testConnection() {
    try {
      const { data } = await this.octokit.users.getAuthenticated();
      console.log(`Authenticated as ${data.login}`);
      return true;
    } catch (error) {
      console.error(`GitHub authentication failed: ${error.message}`);
      return false;
    }
  }
}

module.exports = GitHubClient;
