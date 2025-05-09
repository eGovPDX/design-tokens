/**
 * Figma Design Token Extractor
 * 
 * This script extracts design tokens from a Figma file and maps them to USWDS (U.S. Web Design System) references.
 * It's designed to help maintain consistency between Figma designs and the USWDS implementation.
 * 
 * Key Features:
 * - Extracts colors, typography, spacing, effects, and component-level tokens
 * - Maps Figma values to USWDS references where possible
 * - Preserves original values for reference
 * - Handles component variants and states
 * - Supports color matching with alpha channel
 * - Includes comprehensive USWDS color scales
 * 
 * Usage:
 * 1. Create a .env file in the project root with your Figma access token:
 *    FIGMA_ACCESS_TOKEN=your_figma_access_token_here
 * 2. Run the script with a Figma file key as an argument:
 *    node fetch-figma-tokens.js <figma-file-key>
 * 
 * Output:
 * The script generates several JSON files in the FigmaAPI directory:
 * - figma-styles.json: Raw styles data from Figma
 * - figma-file.json: Complete file data
 * - figma-variables.json: Processed variables
 * - design-tokens-from-figma.json: Mapped design tokens
 * - token-comparison.json: Comparison with existing tokens
 * 
 * Note:
 * While this script attempts to map Figma values to USWDS references, it may not always
 * provide a perfect match. The output should be reviewed and adjusted as needed to ensure
 * consistency with your design system.
 * 
 * Dependencies:
 * - axios: For making HTTP requests to the Figma API
 * - fs: For file system operations
 * - path: For handling file paths
 * - dotenv: For loading environment variables
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create FigmaAPI directory if it doesn't exist
const figmaApiDir = path.join(__dirname, 'FigmaAPI');
if (!fs.existsSync(figmaApiDir)) {
  fs.mkdirSync(figmaApiDir);
}

// Figma API configuration
const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;
if (!FIGMA_ACCESS_TOKEN) {
  throw new Error('FIGMA_ACCESS_TOKEN environment variable is required. Please create a .env file with your Figma access token.');
}

const FIGMA_API_BASE = 'https://api.figma.com/v1';

// Headers for Figma API requests
const headers = {
  'X-Figma-Token': FIGMA_ACCESS_TOKEN,
  'Content-Type': 'application/json'
};

/**
 * Adds a delay between API requests to avoid rate limiting
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} - Promise that resolves after the delay
 */
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retries a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} retries - Number of retry attempts
 * @param {number} delay - Initial delay between retries
 * @returns {Promise} - Promise that resolves with the function result
 */
async function retry(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * 2);
  }
}

// Enhanced mapping system for converting Figma values to design tokens
const tokenMappings = {
  colors: {
    // Base colors
    'Dark background': 'usa.color.gray.90',
    'Action label': 'usa.color.blue-warm.50v',
    'Background': 'usa.color.gray.5',
    'Text': 'usa.color.gray.90',
    'Link': 'usa.color.blue.60v',
    'Visited link': 'usa.color.violet.70v',
    'Active link': 'usa.color.blue.70v',
    'Hover link': 'usa.color.blue.60v',
    
    // Primary colors
    'Primary': 'usa.color.blue.60v',
    'Primary darker': 'usa.color.blue.70v',
    'Primary lighter': 'usa.color.blue.30v',
    
    // Secondary colors
    'Secondary': 'usa.color.gold.30v',
    'Secondary darker': 'usa.color.gold.40v',
    'Secondary lighter': 'usa.color.gold.20v',
    
    // Accent colors
    'Accent cool': 'usa.color.mint.30v',
    'Accent warm': 'usa.color.indigo.40v',
    
    // State colors
    'Error': 'usa.color.red.50v',
    'Warning': 'usa.color.yellow.30v',
    'Success': 'usa.color.green-cool.40v',
    'Info': 'usa.color.cyan.30v',
    
    // Gray scale
    'Gray 5': 'usa.color.gray.5',
    'Gray 10': 'usa.color.gray.10',
    'Gray 30': 'usa.color.gray.30',
    'Gray 50': 'usa.color.gray.50',
    'Gray 60': 'usa.color.gray.60',
    'Gray 80': 'usa.color.gray.80',
    'Gray 90': 'usa.color.gray.90'
  },
  spacing: {
    // USWDS spacing scale
    '0': 'usa.spacing.0',
    '0.5': 'usa.spacing.0.5',
    '1': 'usa.spacing.1',
    '2': 'usa.spacing.2',
    '3': 'usa.spacing.3',
    '4': 'usa.spacing.4',
    '5': 'usa.spacing.5',
    '6': 'usa.spacing.6',
    '7': 'usa.spacing.7',
    '8': 'usa.spacing.8',
    '9': 'usa.spacing.9',
    '10': 'usa.spacing.10',
    '15': 'usa.spacing.15',
    
    // Common component spacing
    'Card padding': 'usa.spacing.3',
    'Form field spacing': 'usa.spacing.2',
    'Section spacing': 'usa.spacing.6',
    'Grid gap': 'usa.spacing.3'
  },
  typography: {
    // Display
    'Display': {
      fontFamily: 'usa.font.sans',
      fontSize: 'usa.font.size.4xl',
      fontWeight: 'usa.font.weight.bold',
      lineHeight: 'usa.line-height.heading',
      letterSpacing: 'usa.letter-spacing.tight'
    },
    // Headings
    'Heading 1': {
      fontFamily: 'usa.font.sans',
      fontSize: 'usa.font.size.3xl',
      fontWeight: 'usa.font.weight.bold',
      lineHeight: 'usa.line-height.heading',
      letterSpacing: 'usa.letter-spacing.tight'
    },
    'Heading 2': {
      fontFamily: 'usa.font.sans',
      fontSize: 'usa.font.size.2xl',
      fontWeight: 'usa.font.weight.bold',
      lineHeight: 'usa.line-height.heading',
      letterSpacing: 'usa.letter-spacing.tight'
    },
    'Heading 3': {
      fontFamily: 'usa.font.sans',
      fontSize: 'usa.font.size.xl',
      fontWeight: 'usa.font.weight.bold',
      lineHeight: 'usa.line-height.heading',
      letterSpacing: 'usa.letter-spacing.tight'
    },
    'Heading 4': {
      fontFamily: 'usa.font.sans',
      fontSize: 'usa.font.size.lg',
      fontWeight: 'usa.font.weight.bold',
      lineHeight: 'usa.line-height.heading',
      letterSpacing: 'usa.letter-spacing.tight'
    },
    'Heading 5': {
      fontFamily: 'usa.font.sans',
      fontSize: 'usa.font.size.md',
      fontWeight: 'usa.font.weight.bold',
      lineHeight: 'usa.line-height.heading',
      letterSpacing: 'usa.letter-spacing.tight'
    },
    'Heading 6': {
      fontFamily: 'usa.font.sans',
      fontSize: 'usa.font.size.sm',
      fontWeight: 'usa.font.weight.bold',
      lineHeight: 'usa.line-height.heading',
      letterSpacing: 'usa.letter-spacing.tight'
    },
    
    // Body text
    'Body': {
      fontFamily: 'usa.font.sans',
      fontSize: 'usa.font.size.base',
      fontWeight: 'usa.font.weight.normal',
      lineHeight: 'usa.line-height.body',
      letterSpacing: 'usa.letter-spacing.normal'
    },
    'Body small': {
      fontFamily: 'usa.font.sans',
      fontSize: 'usa.font.size.sm',
      fontWeight: 'usa.font.weight.normal',
      lineHeight: 'usa.line-height.body',
      letterSpacing: 'usa.letter-spacing.normal'
    },
    'Body large': {
      fontFamily: 'usa.font.sans',
      fontSize: 'usa.font.size.lg',
      fontWeight: 'usa.font.weight.normal',
      lineHeight: 'usa.line-height.body',
      letterSpacing: 'usa.letter-spacing.normal'
    },
    
    // UI text
    'Button': {
      fontFamily: 'usa.font.sans',
      fontSize: 'usa.font.size.sm',
      fontWeight: 'usa.font.weight.bold',
      lineHeight: 'usa.line-height.ui',
      letterSpacing: 'usa.letter-spacing.tight',
      textTransform: 'uppercase'
    },
    'Label': {
      fontFamily: 'usa.font.sans',
      fontSize: 'usa.font.size.sm',
      fontWeight: 'usa.font.weight.bold',
      lineHeight: 'usa.line-height.ui',
      letterSpacing: 'usa.letter-spacing.tight'
    },
    'Input': {
      fontFamily: 'usa.font.sans',
      fontSize: 'usa.font.size.base',
      fontWeight: 'usa.font.weight.normal',
      lineHeight: 'usa.line-height.ui',
      letterSpacing: 'usa.letter-spacing.normal'
    },
    'Helper text': {
      fontFamily: 'usa.font.sans',
      fontSize: 'usa.font.size.sm',
      fontWeight: 'usa.font.weight.normal',
      lineHeight: 'usa.line-height.ui',
      letterSpacing: 'usa.letter-spacing.normal'
    },
    'Error text': {
      fontFamily: 'usa.font.sans',
      fontSize: 'usa.font.size.sm',
      fontWeight: 'usa.font.weight.bold',
      lineHeight: 'usa.line-height.ui',
      letterSpacing: 'usa.letter-spacing.normal',
      color: '{usa.color.red.50v}'
    }
  },
  effects: {
    // Shadows
    'Shadow 1': {
      type: 'drop-shadow',
      value: {
        x: '0',
        y: '1px',
        blur: '2px',
        spread: '0',
        color: '{usa.color.black-transparent.10}'
      }
    },
    'Shadow 2': {
      type: 'drop-shadow',
      value: {
        x: '0',
        y: '2px',
        blur: '4px',
        spread: '0',
        color: '{usa.color.black-transparent.20}'
      }
    },
    'Shadow 3': {
      type: 'drop-shadow',
      value: {
        x: '0',
        y: '4px',
        blur: '8px',
        spread: '0',
        color: '{usa.color.black-transparent.30}'
      }
    },
    'Shadow 4': {
      type: 'drop-shadow',
      value: {
        x: '0',
        y: '8px',
        blur: '16px',
        spread: '0',
        color: '{usa.color.black-transparent.40}'
      }
    },
    'Shadow 5': {
      type: 'drop-shadow',
      value: {
        x: '0',
        y: '16px',
        blur: '24px',
        spread: '0',
        color: '{usa.color.black-transparent.50}'
      }
    },
    
    // Focus rings
    'Focus': {
      type: 'outline',
      value: {
        width: '2px',
        offset: '2px',
        color: '{usa.color.blue.40v}'
      }
    }
  },
  motion: {
    'Ease-in-out': {
      value: 'cubic-bezier(0.4, 0, 0.2, 1)',
      type: 'motion'
    },
    'Ease-out': {
      value: 'cubic-bezier(0, 0, 0.2, 1)',
      type: 'motion'
    },
    'Ease-in': {
      value: 'cubic-bezier(0.4, 0, 1, 1)',
      type: 'motion'
    },
    'Sharp': {
      value: 'cubic-bezier(0.4, 0, 0.6, 1)',
      type: 'motion'
    }
  },
  duration: {
    'Fast': {
      value: '100ms',
      type: 'duration'
    },
    'Medium': {
      value: '200ms',
      type: 'duration'
    },
    'Slow': {
      value: '300ms',
      type: 'duration'
    },
    'Extra slow': {
      value: '400ms',
      type: 'duration'
    }
  }
};

// Add component-level token mappings
const componentTokenMappings = {
  button: {
    primary: {
      background: '{usa.color.blue-warm.50v}',
      color: '{usa.color.white}',
      'background-hover': '{usa.color.blue-warm.60v}',
      'background-active': '{usa.color.blue-warm.70v}',
      'background-disabled': '{usa.color.gray.20}',
      padding: '{usa.spacing.3} {usa.spacing.4}',
      'border-radius': '{usa.border-radius.md}',
      typography: {
        fontFamily: 'usa.font.sans',
        fontSize: 'usa.font.size.sm',
        fontWeight: 'usa.font.weight.bold',
        lineHeight: 'usa.line-height.ui',
        letterSpacing: 'usa.letter-spacing.tight',
        textTransform: 'uppercase'
      }
    },
    secondary: {
      background: 'transparent',
      color: '{usa.color.blue-warm.50v}',
      border: '2px solid {usa.color.blue-warm.50v}',
      'background-hover': '{usa.color.blue-warm.5v}',
      'background-active': '{usa.color.blue-warm.10v}',
      'background-disabled': '{usa.color.gray.5}',
      padding: '{usa.spacing.3} {usa.spacing.4}',
      'border-radius': '{usa.border-radius.md}'
    }
  },
  input: {
    text: {
      background: '{usa.color.white}',
      color: '{usa.color.gray.90}',
      border: '1px solid {usa.color.gray.50}',
      'border-hover': '1px solid {usa.color.gray.70}',
      'border-focus': '2px solid {usa.color.blue.40v}',
      'border-error': '2px solid {usa.color.red.50v}',
      padding: '{usa.spacing.3}',
      'border-radius': '{usa.border-radius.sm}',
      typography: {
        fontFamily: 'usa.font.sans',
        fontSize: 'usa.font.size.base',
        fontWeight: 'usa.font.weight.normal',
        lineHeight: 'usa.line-height.ui'
      }
    },
    label: {
      color: '{usa.color.gray.90}',
      'margin-bottom': '{usa.spacing.1}',
      typography: {
        fontFamily: 'usa.font.sans',
        fontSize: 'usa.font.size.sm',
        fontWeight: 'usa.font.weight.bold',
        lineHeight: 'usa.line-height.ui'
      }
    },
    helper: {
      color: '{usa.color.gray.60}',
      'margin-top': '{usa.spacing.1}',
      typography: {
        fontFamily: 'usa.font.sans',
        fontSize: 'usa.font.size.sm',
        fontWeight: 'usa.font.weight.normal',
        lineHeight: 'usa.line-height.ui'
      }
    },
    error: {
      color: '{usa.color.red.50v}',
      'margin-top': '{usa.spacing.1}',
      typography: {
        fontFamily: 'usa.font.sans',
        fontSize: 'usa.font.size.sm',
        fontWeight: 'usa.font.weight.bold',
        lineHeight: 'usa.line-height.ui'
      }
    }
  },
  card: {
    default: {
      background: '{usa.color.white}',
      padding: '{usa.spacing.4}',
      'border-radius': '{usa.border-radius.lg}',
      shadow: '{usa.shadow.2}',
      'shadow-hover': '{usa.shadow.3}'
    },
    bordered: {
      background: '{usa.color.white}',
      padding: '{usa.spacing.4}',
      'border-radius': '{usa.border-radius.lg}',
      border: '1px solid {usa.color.gray.20}'
    }
  },
  alert: {
    info: {
      background: '{usa.color.blue.5v}',
      border: '1px solid {usa.color.blue.20v}',
      color: '{usa.color.gray.90}',
      'icon-color': '{usa.color.blue.50v}',
      padding: '{usa.spacing.3}',
      'border-radius': '{usa.border-radius.md}'
    },
    success: {
      background: '{usa.color.green-cool.5v}',
      border: '1px solid {usa.color.green-cool.20v}',
      color: '{usa.color.gray.90}',
      'icon-color': '{usa.color.green-cool.50v}',
      padding: '{usa.spacing.3}',
      'border-radius': '{usa.border-radius.md}'
    },
    warning: {
      background: '{usa.color.yellow.5v}',
      border: '1px solid {usa.color.yellow.20v}',
      color: '{usa.color.gray.90}',
      'icon-color': '{usa.color.yellow.50v}',
      padding: '{usa.spacing.3}',
      'border-radius': '{usa.border-radius.md}'
    },
    error: {
      background: '{usa.color.red.5v}',
      border: '1px solid {usa.color.red.20v}',
      color: '{usa.color.gray.90}',
      'icon-color': '{usa.color.red.50v}',
      padding: '{usa.spacing.3}',
      'border-radius': '{usa.border-radius.md}'
    }
  },
  accordion: {
    header: {
      background: '{usa.color.gray.5}',
      'background-hover': '{usa.color.gray.10}',
      color: '{usa.color.gray.90}',
      padding: '{usa.spacing.3}',
      'border-radius': '{usa.border-radius.md}',
      typography: {
        fontFamily: 'usa.font.sans',
        fontSize: 'usa.font.size.base',
        fontWeight: 'usa.font.weight.bold',
        lineHeight: 'usa.line-height.ui'
      }
    },
    content: {
      background: '{usa.color.white}',
      padding: '{usa.spacing.4}',
      'border-left': '1px solid {usa.color.gray.20}',
      'border-right': '1px solid {usa.color.gray.20}',
      'border-bottom': '1px solid {usa.color.gray.20}'
    }
  },
  table: {
    header: {
      background: '{usa.color.gray.5}',
      color: '{usa.color.gray.90}',
      padding: '{usa.spacing.2} {usa.spacing.3}',
      'border-bottom': '2px solid {usa.color.gray.20}',
      typography: {
        fontFamily: 'usa.font.sans',
        fontSize: 'usa.font.size.sm',
        fontWeight: 'usa.font.weight.bold',
        lineHeight: 'usa.line-height.ui'
      }
    },
    cell: {
      padding: '{usa.spacing.2} {usa.spacing.3}',
      'border-bottom': '1px solid {usa.color.gray.10}',
      typography: {
        fontFamily: 'usa.font.sans',
        fontSize: 'usa.font.size.base',
        fontWeight: 'usa.font.weight.normal',
        lineHeight: 'usa.line-height.ui'
      }
    }
  }
};

/**
 * Converts a Figma color to the closest USWDS color reference
 * @param {Object} color - Figma color object with r, g, b, a properties
 * @returns {string|null} - USWDS color reference or null if no match found
 */
function convertColorToUSWDS(color) {
  if (!color) return null;
  
  const { r, g, b, a } = color;
  const rgb = {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    a: a || 1
  };

  // Function to find closest USWDS color
  function findClosestColor(targetRgb) {
    const colorMap = {
      // Gray scale
      'usa.color.gray.90': [27, 27, 27],
      'usa.color.gray.80': [45, 45, 45],
      'usa.color.gray.70': [59, 59, 59],
      'usa.color.gray.60': [73, 73, 73],
      'usa.color.gray.50': [117, 117, 117],
      'usa.color.gray.40': [148, 148, 148],
      'usa.color.gray.30': [179, 179, 179],
      'usa.color.gray.20': [204, 204, 204],
      'usa.color.gray.10': [230, 230, 230],
      'usa.color.gray.5': [245, 245, 245],
      'usa.color.gray.2': [250, 250, 250],
      
      // Blue scale
      'usa.color.blue.90': [32, 65, 154],
      'usa.color.blue.80': [32, 84, 147],
      'usa.color.blue.70v': [0, 73, 145],
      'usa.color.blue.60v': [0, 94, 162],
      'usa.color.blue.50v': [0, 115, 207],
      'usa.color.blue.40v': [0, 136, 206],
      'usa.color.blue.30v': [0, 157, 224],
      'usa.color.blue.20v': [0, 179, 190],
      'usa.color.blue.10v': [0, 189, 227],
      'usa.color.blue.5v': [151, 212, 255],
      
      // Blue-warm scale
      'usa.color.blue-warm.90v': [32, 65, 154],
      'usa.color.blue-warm.80v': [32, 84, 147],
      'usa.color.blue-warm.70v': [0, 73, 145],
      'usa.color.blue-warm.60v': [0, 94, 162],
      'usa.color.blue-warm.50v': [0, 115, 207],
      'usa.color.blue-warm.40v': [0, 136, 206],
      'usa.color.blue-warm.30v': [0, 157, 224],
      'usa.color.blue-warm.20v': [0, 179, 190],
      'usa.color.blue-warm.10v': [0, 189, 227],
      'usa.color.blue-warm.5v': [151, 212, 255],
      
      // Red scale
      'usa.color.red.90': [134, 0, 0],
      'usa.color.red.80v': [162, 0, 0],
      'usa.color.red.70v': [184, 0, 0],
      'usa.color.red.60v': [212, 0, 0],
      'usa.color.red.50v': [205, 32, 38],
      'usa.color.red.40v': [239, 59, 59],
      'usa.color.red.30v': [255, 86, 86],
      'usa.color.red.20v': [255, 112, 112],
      'usa.color.red.10v': [255, 140, 140],
      'usa.color.red.5v': [255, 173, 173],
      
      // Gold scale
      'usa.color.gold.90': [120, 89, 0],
      'usa.color.gold.80': [134, 100, 0],
      'usa.color.gold.70': [148, 112, 0],
      'usa.color.gold.60v': [162, 124, 0],
      'usa.color.gold.50v': [178, 134, 0],
      'usa.color.gold.40v': [192, 145, 0],
      'usa.color.gold.30v': [208, 156, 0],
      'usa.color.gold.20v': [222, 167, 0],
      'usa.color.gold.10v': [236, 178, 0],
      'usa.color.gold.5v': [250, 189, 0],
      
      // Green scale
      'usa.color.green-cool.90': [24, 87, 45],
      'usa.color.green-cool.80v': [21, 103, 43],
      'usa.color.green-cool.70v': [18, 119, 41],
      'usa.color.green-cool.60v': [15, 136, 39],
      'usa.color.green-cool.50v': [12, 153, 37],
      'usa.color.green-cool.40v': [9, 170, 35],
      'usa.color.green-cool.30v': [6, 187, 33],
      'usa.color.green-cool.20v': [3, 204, 31],
      'usa.color.green-cool.10v': [0, 221, 29],
      'usa.color.green-cool.5v': [0, 238, 27],
      
      // Mint scale
      'usa.color.mint.90': [0, 111, 115],
      'usa.color.mint.80': [0, 128, 132],
      'usa.color.mint.70': [0, 145, 149],
      'usa.color.mint.60': [0, 162, 166],
      'usa.color.mint.50': [0, 179, 183],
      'usa.color.mint.40': [0, 196, 200],
      'usa.color.mint.30': [0, 213, 217],
      'usa.color.mint.20': [0, 230, 234],
      'usa.color.mint.10': [0, 247, 251],
      'usa.color.mint.5': [0, 255, 255],
      
      // Cyan scale
      'usa.color.cyan.90': [0, 111, 115],
      'usa.color.cyan.80': [0, 128, 132],
      'usa.color.cyan.70': [0, 145, 149],
      'usa.color.cyan.60': [0, 162, 166],
      'usa.color.cyan.50': [0, 179, 183],
      'usa.color.cyan.40': [0, 196, 200],
      'usa.color.cyan.30': [0, 213, 217],
      'usa.color.cyan.20': [0, 230, 234],
      'usa.color.cyan.10': [0, 247, 251],
      'usa.color.cyan.5': [0, 255, 255],
      
      // Yellow scale
      'usa.color.yellow.90': [191, 147, 0],
      'usa.color.yellow.80': [204, 157, 0],
      'usa.color.yellow.70': [217, 167, 0],
      'usa.color.yellow.60': [230, 177, 0],
      'usa.color.yellow.50': [242, 187, 0],
      'usa.color.yellow.40': [255, 196, 0],
      'usa.color.yellow.30': [255, 206, 20],
      'usa.color.yellow.20': [255, 216, 40],
      'usa.color.yellow.10': [255, 226, 61],
      'usa.color.yellow.5': [255, 236, 81],
      
      // Transparent colors
      'usa.color.black-transparent.90': [0, 0, 0, 0.9],
      'usa.color.black-transparent.70': [0, 0, 0, 0.7],
      'usa.color.black-transparent.50': [0, 0, 0, 0.5],
      'usa.color.black-transparent.30': [0, 0, 0, 0.3],
      'usa.color.black-transparent.10': [0, 0, 0, 0.1],
      'usa.color.white-transparent.90': [255, 255, 255, 0.9],
      'usa.color.white-transparent.70': [255, 255, 255, 0.7],
      'usa.color.white-transparent.50': [255, 255, 255, 0.5],
      'usa.color.white-transparent.30': [255, 255, 255, 0.3],
      'usa.color.white-transparent.10': [255, 255, 255, 0.1]
    };

    let closestColor = null;
    let minDistance = Infinity;

    Object.entries(colorMap).forEach(([name, values]) => {
      const distance = Math.sqrt(
        Math.pow(targetRgb.r - values[0], 2) +
        Math.pow(targetRgb.g - values[1], 2) +
        Math.pow(targetRgb.b - values[2], 2) +
        Math.pow((targetRgb.a - (values[3] || 1)) * 255, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestColor = name;
      }
    });

    // Only return a match if it's reasonably close (threshold of 50)
    return minDistance < 50 ? closestColor : null;
  }

  // Try to find closest USWDS color
  const closestColor = findClosestColor(rgb);
  if (closestColor) {
    return closestColor;
  }

  // If no close match found, try to categorize the color
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  if (brightness < 50) return 'usa.color.gray.90';
  if (brightness < 100) return 'usa.color.gray.80';
  if (brightness < 150) return 'usa.color.gray.60';
  if (brightness < 200) return 'usa.color.gray.30';
  if (brightness < 230) return 'usa.color.gray.10';
  return 'usa.color.gray.5';
}

/**
 * Converts pixel values to USWDS spacing references
 * @param {number} pixels - Pixel value to convert
 * @returns {string} - USWDS spacing reference
 */
function convertSpacingToUSWDS(pixels) {
  if (!pixels) return 'usa.spacing.3';
  
  // USWDS spacing scale (in pixels)
  const spacingMap = {
    0: 'usa.spacing.0',
    4: 'usa.spacing.1',
    8: 'usa.spacing.2',
    12: 'usa.spacing.3',
    16: 'usa.spacing.4',
    20: 'usa.spacing.5',
    24: 'usa.spacing.6',
    32: 'usa.spacing.7',
    40: 'usa.spacing.8',
    48: 'usa.spacing.9',
    56: 'usa.spacing.10',
    64: 'usa.spacing.15'
  };

  // Find closest spacing value
  const values = Object.keys(spacingMap).map(Number);
  const closest = values.reduce((prev, curr) => {
    return Math.abs(curr - pixels) < Math.abs(prev - pixels) ? curr : prev;
  });
  
  return spacingMap[closest] || 'usa.spacing.3';
}

/**
 * Converts Figma data to design tokens format
 * @param {Object} data - Extracted Figma data
 * @returns {Object} - Formatted design tokens
 */
function convertToDesignTokens(data) {
  const tokens = {
    global: {},
    "USWDS Theme/Project theme": {
      "#-theme": {
        color: {
          base: {},
          primary: {},
          secondary: {},
          "accent-cool": {},
          "accent-warm": {},
          info: {},
          error: {},
          warning: {},
          success: {},
          disabled: {}
        },
        typography: {},
        spacing: {},
        effects: {},
        layout: {},
        components: {}
      }
    }
  };

  // Process component-level tokens
  function processComponentTokens(node) {
    if (!node) return;

    // Check if node name matches any component patterns
    const componentMatches = {
      button: /^(Primary|Secondary)\s*Button/i,
      input: /^(Text\s*Input|Label|Helper\s*Text|Error\s*Message)/i,
      card: /^Card/i,
      alert: /^(Info|Success|Warning|Error)\s*Alert/i,
      accordion: /^Accordion/i,
      table: /^(Table\s*Header|Table\s*Cell)/i
    };

    Object.entries(componentMatches).forEach(([component, pattern]) => {
      if (pattern.test(node.name)) {
        const componentType = component;
        const variantMatch = node.name.match(pattern);
        const variant = variantMatch ? variantMatch[1].toLowerCase().replace(/\s+/g, '-') : 'default';

        // Get component mappings
        const componentMapping = componentTokenMappings[componentType]?.[variant];
        if (componentMapping) {
          if (!tokens["USWDS Theme/Project theme"]["#-theme"].components[componentType]) {
            tokens["USWDS Theme/Project theme"]["#-theme"].components[componentType] = {};
          }

          tokens["USWDS Theme/Project theme"]["#-theme"].components[componentType][variant] = {
            value: componentMapping,
            type: 'component',
            description: node.description || '',
            originalNode: {
              id: node.id,
              name: node.name,
              type: node.type
            }
          };
        }
      }
    });

    // Process children recursively
    if (node.children) {
      node.children.forEach(processComponentTokens);
    }
  }

  // Process the document for component tokens
  if (data.fileData?.document) {
    processComponentTokens(data.fileData.document);
  }

  // Process colors with enhanced categorization and value conversion
  if (data.styles.fill) {
    Object.entries(data.styles.fill).forEach(([id, style]) => {
      const colorRef = tokenMappings.colors[style.name] || convertColorToUSWDS(style.fills?.[0]?.color);
      if (colorRef) {
        // Enhanced color categorization
        let category = 'base';
        const name = style.name.toLowerCase();
        
        // Improved color categorization logic
        if (name.includes('primary') || name.includes('action')) category = 'primary';
        else if (name.includes('secondary')) category = 'secondary';
        else if (name.includes('accent-cool') || name.includes('mint')) category = 'accent-cool';
        else if (name.includes('accent-warm') || name.includes('gold')) category = 'accent-warm';
        else if (name.includes('info') || name.includes('blue')) category = 'info';
        else if (name.includes('error') || name.includes('red')) category = 'error';
        else if (name.includes('warning') || name.includes('yellow')) category = 'warning';
        else if (name.includes('success') || name.includes('green')) category = 'success';
        else if (name.includes('disabled') || name.includes('gray')) category = 'disabled';
        
        // Add to appropriate category with enhanced metadata
        if (!tokens["USWDS Theme/Project theme"]["#-theme"].color[category][style.name]) {
          tokens["USWDS Theme/Project theme"]["#-theme"].color[category][style.name] = {
            value: `{${colorRef}}`,
            type: 'color',
            description: style.description || '',
            originalValue: style.fills?.[0]?.color || null
          };
        }
      }
    });
  }

  // Process typography with enhanced mapping
  if (data.styles.text) {
    Object.entries(data.styles.text).forEach(([id, style]) => {
      const typographyRef = tokenMappings.typography[style.name];
      if (typographyRef) {
        tokens["USWDS Theme/Project theme"]["#-theme"].typography[style.name] = {
          value: typographyRef,
          type: 'typography',
          description: style.description || '',
          originalValue: style.style || null
        };
      } else if (style.style) {
        // Try to infer typography style from properties
        const { fontFamily, fontWeight, fontSize, lineHeight, letterSpacing } = style.style;
        if (fontFamily || fontWeight || fontSize) {
          const inferredStyle = {
            fontFamily: fontFamily || 'usa.font.sans',
            fontSize: fontSize ? `usa.font.size.${fontSize}` : 'usa.font.size.base',
            fontWeight: fontWeight ? `usa.font.weight.${fontWeight}` : 'usa.font.weight.normal',
            lineHeight: lineHeight ? `usa.line-height.${lineHeight}` : 'usa.line-height.sans',
            letterSpacing: letterSpacing ? `usa.letter-spacing.${letterSpacing}` : 'usa.letter-spacing.normal'
          };
          
          tokens["USWDS Theme/Project theme"]["#-theme"].typography[style.name] = {
            value: inferredStyle,
            type: 'typography',
            description: style.description || '',
            originalValue: style.style
          };
        }
      }
    });
  }

  // Process spacing with enhanced categorization and value conversion
  if (data.variables.aliases) {
    Object.entries(data.variables.aliases).forEach(([id, variable]) => {
      if (variable.property.includes('padding') || 
          variable.property.includes('margin') || 
          variable.property.includes('spacing') ||
          variable.property.includes('gap')) {
        
        // Enhanced spacing categorization with value conversion
        let spacingRef = tokenMappings.spacing[variable.name];
        if (!spacingRef) {
          spacingRef = convertSpacingToUSWDS(variable.value);
        }

        tokens["USWDS Theme/Project theme"]["#-theme"].spacing[variable.name] = {
          value: `{${spacingRef}}`,
          type: 'spacing',
          description: variable.description || '',
          originalValue: variable.value || null
        };
      }
    });
  }

  // Process effects with enhanced mapping
  if (data.styles.effect) {
    Object.entries(data.styles.effect).forEach(([id, style]) => {
      const effectRef = tokenMappings.effects[style.name];
      if (effectRef) {
        tokens["USWDS Theme/Project theme"]["#-theme"].effects[style.name] = {
          value: effectRef.value,
          type: 'effect',
          description: style.description || '',
          originalValue: style.effects || null
        };
      } else if (style.effects) {
        // Try to infer effect style from properties
        const shadow = style.effects.find(e => e.type === 'DROP_SHADOW');
        if (shadow) {
          const inferredEffect = {
            type: 'drop-shadow',
            value: {
              x: shadow.offset.x,
              y: shadow.offset.y,
              blur: shadow.radius,
              spread: shadow.spread || 0,
              color: convertColorToUSWDS(shadow.color) || '{usa.color.black-transparent.20}'
            }
          };
          
          tokens["USWDS Theme/Project theme"]["#-theme"].effects[style.name] = {
            value: inferredEffect.value,
            type: 'effect',
            description: style.description || '',
            originalValue: style.effects
          };
        }
      }
    });
  }

  return tokens;
}

/**
 * Fetches styles from a Figma file
 * @param {string} fileKey - Figma file key
 * @returns {Promise<Object>} - Figma styles data
 */
async function fetchFigmaStyles(fileKey) {
  try {
    console.log('\n=== Fetching Styles ===');
    const response = await axios.get(`${FIGMA_API_BASE}/files/${fileKey}/styles`, { headers });
    const outputPath = path.join(figmaApiDir, 'figma-styles.json');
    fs.writeFileSync(outputPath, JSON.stringify(response.data, null, 2));
    console.log(`Styles data saved to: ${outputPath}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching Figma styles:', error.message);
    throw error;
  }
}

/**
 * Fetches and processes a Figma file
 * @param {string} fileKey - Figma file key
 * @returns {Promise<Object>} - Processed file data including variables, styles, and design tokens
 */
async function fetchFigmaFile(fileKey) {
  try {
    console.log('\n=== Fetching File Content ===');
    const response = await axios.get(`${FIGMA_API_BASE}/files/${fileKey}`, { headers });
    
    // Save raw file data
    const outputPath = path.join(figmaApiDir, 'figma-file.json');
    fs.writeFileSync(outputPath, JSON.stringify(response.data, null, 2));
    console.log(`File data saved to: ${outputPath}`);
    
    // Extract variables and styles
    const variables = {};
    const styles = {};
    
    function processNode(node) {
      if (!node) return;
      
      // Process styles
      if (node.styles) {
        Object.entries(node.styles).forEach(([styleType, styleId]) => {
          if (!styles[styleType]) {
            styles[styleType] = {};
          }
          styles[styleType][styleId] = {
            name: node.name,
            type: styleType,
            nodeId: node.id,
            // Add more style properties
            fills: node.fills,
            strokes: node.strokes,
            effects: node.effects,
            characters: node.characters,
            style: node.style
          };
        });
      }
      
      // Process variables
      if (node.boundVariables) {
        Object.entries(node.boundVariables).forEach(([property, variable]) => {
          const collection = variable.type === 'VARIABLE_ALIAS' ? 'aliases' : 'variables';
          if (!variables[collection]) {
            variables[collection] = {};
          }
          variables[collection][variable.id] = {
            name: node.name,
            property,
            type: variable.type,
            nodeId: node.id,
            // Add more variable properties
            value: node[property],
            resolvedValue: node[`${property}Resolved`]
          };
        });
      }
      
      // Process children recursively
      if (node.children) {
        node.children.forEach(processNode);
      }
    }
    
    // Process the document
    if (response.data.document) {
      processNode(response.data.document);
    }
    
    // Save extracted data
    const extractedData = { variables, styles };
    const extractedPath = path.join(figmaApiDir, 'extracted-data.json');
    fs.writeFileSync(extractedPath, JSON.stringify(extractedData, null, 2));
    console.log(`Extracted data saved to: ${extractedPath}`);
    
    // Convert to design tokens format
    const designTokens = convertToDesignTokens(extractedData);
    const tokensPath = path.join(figmaApiDir, 'design-tokens-from-figma.json');
    fs.writeFileSync(tokensPath, JSON.stringify(designTokens, null, 2));
    console.log(`Design tokens saved to: ${tokensPath}`);
    
    return {
      variables,
      styles,
      designTokens,
      fileData: response.data
    };
  } catch (error) {
    console.error('Error fetching Figma file:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

/**
 * Fetches variables from a Figma file
 * @param {string} fileKey - Figma file key
 * @returns {Promise<Object>} - Processed variables data
 */
async function fetchFigmaVariables(fileKey) {
  try {
    console.log('\n=== Fetching Variables ===');
    
    // First, try to get the file to check if it exists
    const fileResponse = await axios.get(`${FIGMA_API_BASE}/files/${fileKey}`, { headers });
    console.log('File exists, checking for variables...');
    
    // Try to get local variables
    const localVariablesResponse = await axios.get(`${FIGMA_API_BASE}/files/${fileKey}/variables/local`, { headers });
    console.log('Local variables response:', localVariablesResponse.data);
    
    // Try to get remote variables
    const remoteVariablesResponse = await axios.get(`${FIGMA_API_BASE}/files/${fileKey}/variables/remote`, { headers });
    console.log('Remote variables response:', remoteVariablesResponse.data);
    
    // Process variables immediately
    const variables = {
      ...(localVariablesResponse.data.variables || {}),
      ...(remoteVariablesResponse.data.variables || {})
    };
    
    if (Object.keys(variables).length === 0) {
      console.log('No variables found in the file');
      return {};
    }
    
    const processedVariables = {};
    
    // Group variables by collection
    Object.entries(variables).forEach(([id, variable]) => {
      const { name, resolvedType, valuesByMode, variableCollections } = variable;
      console.log(`Processing variable: ${name} (${resolvedType})`);
      
      // Extract collection name if available
      const collection = variableCollections?.[0]?.name || 'default';
      
      if (!processedVariables[collection]) {
        processedVariables[collection] = {};
      }
      
      // Process the variable based on its type
      switch (resolvedType) {
        case 'COLOR':
          processedVariables[collection][name] = {
            value: valuesByMode,
            type: 'color',
            variableId: id
          };
          break;
        case 'FLOAT':
        case 'NUMBER':
          processedVariables[collection][name] = {
            value: valuesByMode,
            type: 'number',
            variableId: id
          };
          break;
        case 'STRING':
          processedVariables[collection][name] = {
            value: valuesByMode,
            type: 'string',
            variableId: id
          };
          break;
        case 'BOOLEAN':
          processedVariables[collection][name] = {
            value: valuesByMode,
            type: 'boolean',
            variableId: id
          };
          break;
      }
    });
    
    // Save processed variables
    const outputPath = path.join(figmaApiDir, 'figma-variables.json');
    fs.writeFileSync(outputPath, JSON.stringify(processedVariables, null, 2));
    console.log(`Variables data saved to: ${outputPath}`);
    
    // Generate CSS custom properties
    const cssVariables = {};
    Object.entries(processedVariables).forEach(([collection, vars]) => {
      Object.entries(vars).forEach(([name, data]) => {
        const cssName = `--${collection.toLowerCase()}-${name.toLowerCase().replace(/\s+/g, '-')}`;
        cssVariables[cssName] = data.value;
      });
    });
    
    // Save CSS variables
    const cssOutputPath = path.join(figmaApiDir, 'figma-css-variables.json');
    fs.writeFileSync(cssOutputPath, JSON.stringify(cssVariables, null, 2));
    console.log(`CSS variables saved to: ${cssOutputPath}`);
    
    return processedVariables;
  } catch (error) {
    console.error('Error fetching Figma variables:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return {};
  }
}

/**
 * Fetches specific nodes from a Figma file
 * @param {string} fileKey - Figma file key
 * @param {string[]} nodeIds - Array of node IDs to fetch
 * @returns {Promise<Object>} - Fetched nodes data
 */
async function fetchFigmaNodes(fileKey, nodeIds) {
  try {
    // Reduce batch size further to avoid string length issues
    const BATCH_SIZE = 25;
    const CONCURRENCY_LIMIT = 5; // Process 5 batches at a time
    const batches = [];
    for (let i = 0; i < nodeIds.length; i += BATCH_SIZE) {
      batches.push(nodeIds.slice(i, i + BATCH_SIZE));
    }

    console.log(`Fetching ${batches.length} batches of nodes (${CONCURRENCY_LIMIT} concurrent)...`);
    
    // Load existing progress if available
    const progressFile = path.join(__dirname, 'FigmaAPI', 'nodes-progress.json');
    let progress = { nodes: {} };
    try {
      if (fs.existsSync(progressFile)) {
        progress = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
        console.log(`Loaded progress: ${Object.keys(progress.nodes).length} nodes already fetched`);
      }
    } catch (error) {
      console.warn('Could not load progress file:', error.message);
    }

    const allNodes = { ...progress.nodes };
    let processedCount = 0;

    // Process batches in chunks of CONCURRENCY_LIMIT
    for (let i = 0; i < batches.length; i += CONCURRENCY_LIMIT) {
      const batchChunk = batches.slice(i, i + CONCURRENCY_LIMIT);
      const batchPromises = batchChunk.map(async (batch, chunkIndex) => {
        const batchNodeIds = batch.filter(id => !allNodes[id]);
        
        if (batchNodeIds.length === 0) {
          processedCount += batch.length;
          return;
        }

        const batchIndex = i + chunkIndex;
        console.log(`Fetching batch ${batchIndex + 1}/${batches.length} (${batchNodeIds.length} nodes)...`);
        
        try {
          // Process nodes one at a time to avoid string length issues
          const results = {};
          for (const nodeId of batchNodeIds) {
            try {
              const singleResponse = await retry(() => 
                axios.get(`${FIGMA_API_BASE}/files/${fileKey}/nodes?ids=${nodeId}`, {
                  headers: headers
                })
              );
              if (singleResponse.data && singleResponse.data.nodes) {
                Object.assign(results, singleResponse.data.nodes);
                // Save progress after each successful node
                Object.assign(allNodes, results);
                processedCount++;
                fs.writeFileSync(progressFile, JSON.stringify({ nodes: allNodes }, null, 2));
                console.log(`Progress saved: ${processedCount} nodes`);
              }
              // Add a small delay between single node requests
              await delay(100);
            } catch (singleError) {
              console.error(`Error fetching single node ${nodeId}:`, singleError.message);
            }
          }
        } catch (error) {
          console.error(`Error fetching batch ${batchIndex + 1}:`, error.message);
          // Save progress even if this batch failed
          fs.writeFileSync(progressFile, JSON.stringify({ nodes: allNodes }, null, 2));
          console.log(`Progress saved after error: ${processedCount} nodes`);
        }
      });

      // Wait for all batches in this chunk to complete
      await Promise.all(batchPromises);
      
      // Add a small delay between chunks to avoid overwhelming the API
      await delay(1000);
    }

    // Save final results
    const outputPath = path.join(figmaApiDir, 'figma-nodes.json');
    fs.writeFileSync(outputPath, JSON.stringify({ nodes: allNodes }, null, 2));
    console.log(`\nFinal nodes data saved to: ${outputPath}`);

    return allNodes;
  } catch (error) {
    console.error('Error fetching Figma nodes:', error.message);
    return {};
  }
}

/**
 * Extracts tokens from Figma data
 * @param {Object} stylesData - Figma styles data
 * @param {Object} fileData - Figma file data
 * @param {Object} variablesData - Figma variables data
 * @param {Object} nodesData - Figma nodes data
 * @returns {Object} - Extracted tokens
 */
function extractTokens(stylesData, fileData, variablesData, nodesData) {
  const tokens = {
    colors: {},
    typography: {},
    spacing: {},
    effects: {},
    layout: {}
  };

  // Process styles data
  if (stylesData && stylesData.meta && stylesData.meta.styles) {
    console.log('\n=== Processing Styles ===');
    const styles = stylesData.meta.styles;
    
    styles.forEach(style => {
      const { name, description, styleType, key } = style;
      console.log(`Processing style: ${name} (${styleType})`);
      
      switch (styleType) {
        case 'FILL':
          tokens.colors[name] = {
            value: description || '',
            type: 'color',
            styleKey: key
          };
          break;
        case 'TEXT':
          tokens.typography[name] = {
            value: description || '',
            type: 'typography',
            styleKey: key
          };
          break;
        case 'EFFECT':
          tokens.effects[name] = {
            value: description || '',
            type: 'effect',
            styleKey: key
          };
          break;
        case 'GRID':
          tokens.layout[name] = {
            value: description || '',
            type: 'layout',
            styleKey: key
          };
          break;
      }
    });
  }

  // Process variables data if available
  if (variablesData && variablesData.variables) {
    console.log('\n=== Processing Variables ===');
    Object.entries(variablesData.variables).forEach(([id, variable]) => {
      const { name, resolvedType, valuesByMode } = variable;
      console.log(`Processing variable: ${name} (${resolvedType})`);
      
      switch (resolvedType) {
        case 'COLOR':
          tokens.colors[name] = {
            value: valuesByMode,
            type: 'color',
            variableId: id
          };
          break;
        case 'FLOAT':
        case 'NUMBER':
          if (name.toLowerCase().includes('spacing') || name.toLowerCase().includes('space')) {
            tokens.spacing[name] = {
              value: valuesByMode,
              type: 'spacing',
              variableId: id
            };
          } else if (name.toLowerCase().includes('layout') || name.toLowerCase().includes('grid')) {
            tokens.layout[name] = {
              value: valuesByMode,
              type: 'layout',
              variableId: id
            };
          }
          break;
        case 'STRING':
          if (name.toLowerCase().includes('font') || name.toLowerCase().includes('text')) {
            tokens.typography[name] = {
              value: valuesByMode,
              type: 'typography',
              variableId: id
            };
          }
          break;
      }
    });
  }

  // Process nodes data if available
  if (nodesData && nodesData.nodes) {
    console.log('\n=== Processing Nodes ===');
    Object.entries(nodesData.nodes).forEach(([nodeId, node]) => {
      const { document } = node;
      if (document) {
        processNode(document, tokens);
      }
    });
  }

  return tokens;
}

/**
 * Processes a Figma node and extracts relevant tokens
 * @param {Object} node - Figma node
 * @param {Object} tokens - Tokens object to update
 */
function processNode(node, tokens) {
  // Process fills for colors
  if (node.fills) {
    node.fills.forEach(fill => {
      if (fill.type === 'SOLID' && fill.color) {
        const colorName = node.name || `color-${Math.random().toString(36).substr(2, 9)}`;
        tokens.colors[colorName] = {
          value: `rgba(${fill.color.r * 255}, ${fill.color.g * 255}, ${fill.color.b * 255}, ${fill.opacity || 1})`,
          type: 'color',
          nodeId: node.id
        };
      }
    });
  }

  // Process text styles for typography
  if (node.style) {
    const { fontFamily, fontWeight, fontSize, lineHeight, letterSpacing } = node.style;
    if (fontFamily || fontWeight || fontSize) {
      const typographyName = node.name || `typography-${Math.random().toString(36).substr(2, 9)}`;
      tokens.typography[typographyName] = {
        value: {
          fontFamily,
          fontWeight,
          fontSize,
          lineHeight,
          letterSpacing
        },
        type: 'typography',
        nodeId: node.id
      };
    }
  }

  // Process effects
  if (node.effects) {
    node.effects.forEach(effect => {
      const effectName = node.name || `effect-${Math.random().toString(36).substr(2, 9)}`;
      tokens.effects[effectName] = {
        value: effect,
        type: 'effect',
        nodeId: node.id
      };
    });
  }

  // Process layout properties
  if (node.layoutMode) {
    const layoutName = node.name || `layout-${Math.random().toString(36).substr(2, 9)}`;
    tokens.layout[layoutName] = {
      value: {
        layoutMode: node.layoutMode,
        primaryAxisSizingMode: node.primaryAxisSizingMode,
        counterAxisSizingMode: node.counterAxisSizingMode,
        paddingLeft: node.paddingLeft,
        paddingRight: node.paddingRight,
        paddingTop: node.paddingTop,
        paddingBottom: node.paddingBottom,
        itemSpacing: node.itemSpacing
      },
      type: 'layout',
      nodeId: node.id
    };
  }

  // Recursively process children
  if (node.children) {
    node.children.forEach(child => processNode(child, tokens));
  }
}

/**
 * Compares tokens between Figma and existing design tokens
 * @param {Object} figmaTokens - Tokens from Figma
 * @param {Object} existingTokens - Existing design tokens
 * @returns {Object} - Comparison results
 */
function compareCategory(figmaTokens, existingTokens) {
  if (!figmaTokens || !existingTokens) {
    return {
      new: [],
      missing: [],
      different: []
    };
  }
  return {
    new: Object.keys(figmaTokens).filter(key => !existingTokens[key]),
    missing: Object.keys(existingTokens).filter(key => !figmaTokens[key]),
    different: Object.keys(figmaTokens)
      .filter(key => existingTokens[key] && 
        JSON.stringify(figmaTokens[key]) !== JSON.stringify(existingTokens[key]))
  };
}

/**
 * Main function that orchestrates the token extraction and comparison process
 * @returns {Promise<void>}
 */
async function compareTokens() {
  try {
    // Get Figma file key from the URL or environment
    const figmaFileKey = process.argv[2];
    if (!figmaFileKey) {
      throw new Error('Please provide a Figma file key as a command line argument');
    }

    // Fetch file content and extract data
    const { variables, styles, designTokens } = await fetchFigmaFile(figmaFileKey);
    
    // Read existing design tokens
    const existingTokensPath = '/Users/kendowney/Sites/Portland.gov/design-tokens/design-tokens.json';
    const existingTokens = JSON.parse(fs.readFileSync(existingTokensPath, 'utf8'));
    
    // Compare tokens
    console.log('\n=== Token Comparison ===\n');
    
    // Ensure we have the required structure
    const figmaTheme = designTokens["USWDS Theme/Project theme"]?.["#-theme"] || {};
    const existingTheme = existingTokens["USWDS Theme/Project theme"]?.["#-theme"] || {};
    
    // Save comparison results
    const comparisonPath = path.join(figmaApiDir, 'token-comparison.json');
    fs.writeFileSync(comparisonPath, JSON.stringify({
      figmaTokens: designTokens,
      existingTokens,
      comparison: {
        newTokens: Object.keys(designTokens).filter(key => !existingTokens[key]),
        missingTokens: Object.keys(existingTokens).filter(key => !designTokens[key]),
        differences: {
          colors: compareCategory(figmaTheme.color, existingTheme.color),
          typography: compareCategory(figmaTheme.typography, existingTheme.typography),
          spacing: compareCategory(figmaTheme.spacing, existingTheme.spacing),
          effects: compareCategory(figmaTheme.effects, existingTheme.effects)
        }
      }
    }, null, 2));
    console.log(`Comparison results saved to: ${comparisonPath}`);

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

compareTokens(); 