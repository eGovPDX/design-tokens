// test.js
/**
 * Test script for the Figma to CSS design token system
 * 
 * This script tests the core functionality of the system:
 * 1. Figma API authentication
 * 2. Token extraction
 * 3. Token transformation
 * 4. GitHub integration
 */

require('dotenv').config();
const FigmaAuth = require('./src/figmaAuth');
const FigmaTokenExtractor = require('./src/figmaTokenExtractor');
const TokenTransformer = require('./src/tokenTransformer');
const GitHubClient = require('./src/githubClient');
const FigmaToGithub = require('./src/figmaToGithub');
const fs = require('fs');
const path = require('path');

// Create output directory for test results
const outputDir = path.join(__dirname, 'test-output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function runTests() {
  console.log('=== RUNNING TESTS ===');
  let testsPassed = 0;
  let testsFailed = 0;
  
  // Test 1: Figma Authentication
  try {
    console.log('\n--- Test 1: Figma Authentication ---');
    const figmaToken = process.env.FIGMA_ACCESS_TOKEN;
    if (!figmaToken) {
      throw new Error('FIGMA_ACCESS_TOKEN environment variable is not set');
    }
    
    const figmaAuth = new FigmaAuth(figmaToken);
    const isAuthenticated = await figmaAuth.testAuthentication();
    
    if (isAuthenticated) {
      console.log('✅ Figma authentication successful');
      testsPassed++;
    } else {
      throw new Error('Authentication failed');
    }
  } catch (error) {
    console.error(`❌ Figma authentication test failed: ${error.message}`);
    testsFailed++;
  }
  
  // Test 2: Token Extraction
  let tokens;
  try {
    console.log('\n--- Test 2: Token Extraction ---');
    const figmaFileKey = process.env.FIGMA_FILE_KEY;
    if (!figmaFileKey) {
      throw new Error('FIGMA_FILE_KEY environment variable is not set');
    }
    
    const figmaAuth = new FigmaAuth(process.env.FIGMA_ACCESS_TOKEN);
    const extractor = new FigmaTokenExtractor(figmaAuth);
    
    tokens = await extractor.extractTokens(figmaFileKey);
    
    // Save tokens to file for inspection
    const jsonPath = path.join(outputDir, 'test_tokens.json');
    extractor.saveTokensToJson(tokens, jsonPath);
    
    if (tokens && 
        typeof tokens === 'object' && 
        Object.keys(tokens).length > 0) {
      console.log(`✅ Token extraction successful. Found:`);
      console.log(`   - Colors: ${Object.keys(tokens.colors || {}).length}`);
      console.log(`   - Typography: ${Object.keys(tokens.typography || {}).length}`);
      console.log(`   - Spacing: ${Object.keys(tokens.spacing || {}).length}`);
      console.log(`   Tokens saved to ${jsonPath}`);
      testsPassed++;
    } else {
      throw new Error('No tokens extracted or invalid token format');
    }
  } catch (error) {
    console.error(`❌ Token extraction test failed: ${error.message}`);
    testsFailed++;
  }
  
  // Test 3: Token Transformation
  try {
    console.log('\n--- Test 3: Token Transformation ---');
    if (!tokens) {
      throw new Error('No tokens available from previous test');
    }
    
    const transformer = new TokenTransformer();
    const css = transformer.transformToCss(tokens);
    
    // Save CSS to file for inspection
    const cssPath = path.join(outputDir, 'test_tokens.css');
    transformer.saveCssToFile(css, cssPath);
    
    if (css && typeof css === 'string' && css.includes(':root {')) {
      console.log(`✅ Token transformation successful`);
      console.log(`   CSS saved to ${cssPath}`);
      testsPassed++;
    } else {
      throw new Error('Invalid CSS generated');
    }
  } catch (error) {
    console.error(`❌ Token transformation test failed: ${error.message}`);
    testsFailed++;
  }
  
  // Test 4: GitHub Integration
  try {
    console.log('\n--- Test 4: GitHub Integration ---');
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      throw new Error('GITHUB_TOKEN environment variable is not set');
    }
    
    const githubClient = new GitHubClient(githubToken);
    const isConnected = await githubClient.testConnection();
    
    if (isConnected) {
      console.log('✅ GitHub authentication successful');
      testsPassed++;
    } else {
      throw new Error('GitHub authentication failed');
    }
  } catch (error) {
    console.error(`❌ GitHub integration test failed: ${error.message}`);
    testsFailed++;
  }
  
  // Test 5: FigmaToGithub Integration (Mock test)
  try {
    console.log('\n--- Test 5: FigmaToGithub Integration (Mock) ---');
    
    // This is a mock test that doesn't actually push to GitHub
    const mockConfig = {
      figmaToken: process.env.FIGMA_ACCESS_TOKEN,
      githubToken: process.env.GITHUB_TOKEN,
      fileKey: process.env.FIGMA_FILE_KEY,
      owner: 'test-owner',
      repo: 'test-repo',
      branch: 'test-branch',
      tokenPath: 'test-tokens'
    };
    
    // Just test that the class can be instantiated without errors
    const integration = new FigmaToGithub(mockConfig);
    
    console.log('✅ FigmaToGithub integration initialized successfully');
    testsPassed++;
  } catch (error) {
    console.error(`❌ FigmaToGithub integration test failed: ${error.message}`);
    testsFailed++;
  }
  
  // Test Results
  console.log('\n=== TEST RESULTS ===');
  console.log(`Tests passed: ${testsPassed}`);
  console.log(`Tests failed: ${testsFailed}`);
  console.log(`Total tests: ${testsPassed + testsFailed}`);
  
  if (testsFailed === 0) {
    console.log('\n✅ All tests passed! The system is working correctly.');
  } else {
    console.log('\n❌ Some tests failed. Please check the error messages above.');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
