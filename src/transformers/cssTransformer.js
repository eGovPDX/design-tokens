/**
 * CSS Transformer
 * 
 * This module transforms design tokens from JSON format to CSS variables.
 */

import { getUSWDSFontFamily, getUSWDSTypography, getUSWDSFontWeight, getUSWDSColor, getUSWDSSpacing } from './uswdsTokenResolver.js';

/**
 * Get a token value from the tokens object using a path.
 * 
 * @param {Object} tokens - The tokens object
 * @param {string} path - The path to the token value
 * @returns {*} - The token value or null if not found
 */
function getTokenValue(tokens, token) {
  const value = token.value;
  
  // Handle font families
  if (token.type === 'fontFamily') {
    // First try to resolve USWDS token
    const uswdsFont = getUSWDSFontFamily(tokens, value);
    if (uswdsFont) {
      return uswdsFont;
    }
    
    // Fallback to default values
    return getFallbackFontFamily(value);
  }
  
  // Handle font weights
  if (token.type === 'fontWeight') {
    // First try to resolve USWDS token
    const uswdsWeight = getUSWDSFontWeight(tokens, value);
    if (uswdsWeight) {
      return uswdsWeight;
    }
    
    // Fallback to default values
    return getFallbackFontWeight(value);
  }
  
  // Handle font sizes
  if (token.type === 'fontSize') {
    console.log(`Resolving font size token: ${value}`);
    
    // Handle different formats of font size tokens
    if (typeof value === 'string') {
      // Case 1: Direct reference to theme font size
      if (value.includes('#-theme.font-size')) {
        const parts = value.replace(/[{}]/g, '').split('.');
        if (parts.length >= 4) {
          const type = parts[2];
          const size = parts[3];
          console.log(`Theme font size: type=${type}, size=${size}`);
          
          // Try to get the theme value directly from tokens
          const themeSections = [
            'USWDS Theme/Project theme',
            'USWDS Theme/Default',
            'USWDS Theme/PGOV'
          ];
          
          for (const section of themeSections) {
            const theme = tokens[section]?.['#-theme'];
            if (theme && theme['font-size'] && theme['font-size'][type] && theme['font-size'][type][size]) {
              const themeValue = theme['font-size'][type][size].value;
              if (themeValue) {
                if (themeValue.includes('{')) {
                  // It's another reference, resolve it recursively
                  const fontSizeToken = {
                    value: themeValue,
                    type: 'fontSize'
                  };
                  return getTokenValue(tokens, fontSizeToken);
                }
                console.log(`Found theme value: ${themeValue}`);
                return themeValue;
              }
            }
          }
        }
      }
      
      // Case 2: Reference to usa font size
      if (value.includes('usa.font-size') || value.includes('!-usa.font-size')) {
        const parts = value.replace(/[{}]/g, '').replace(/^[!-]*/, '').replace(/^usa\./, '').split('.');
        if (parts.length >= 3) {
          const type = parts[1];
          const size = parts[2];
          console.log(`USA font size: type=${type}, size=${size}`);
          
          const uswdsSize = getUSWDSTypography(tokens, type, size);
          if (uswdsSize) {
            console.log(`Found USWDS size: ${uswdsSize}`);
            return uswdsSize;
          }
        }
      }
      
      // Case 3: Direct type.size format
      if (value.includes('.')) {
        const [type, size] = value.split('.');
        console.log(`Direct type.size: type=${type}, size=${size}`);
        
        const uswdsSize = getUSWDSTypography(tokens, type, size);
        if (uswdsSize) {
          console.log(`Found direct size: ${uswdsSize}`);
          return uswdsSize;
        }
      } else if (value.includes('-')) {
        // Case 4: type-size format
        const [type, size] = value.split('-');
        console.log(`Type-size: type=${type}, size=${size}`);
        
        const uswdsSize = getUSWDSTypography(tokens, type, size);
        if (uswdsSize) {
          console.log(`Found type-size: ${uswdsSize}`);
          return uswdsSize;
        }
      }
    }
    
    // Case 5: Use the default size map from uswdsTokenResolver
    console.log(`Using fallback typography with type=${typeof value === 'string' ? value.split('.')[0] : 'reading'}`);
    return getFallbackTypography(
      typeof value === 'string' ? value.split('.')[0] : 'reading', 
      typeof value === 'string' ? value.split('.')[1] || 'md' : 'md'
    );
  }
  
  // Handle spacing
  if (token.type === 'spacing') {
    // If it's a reference to another token, resolve it
    if (typeof value === 'string' && value.includes('{')) {
      const match = value.match(/\{([^}]+)\}/);
      if (match) {
        const tokenPath = match[1];
        const uswdsSpacing = getUSWDSSpacing(tokens, tokenPath);
        if (uswdsSpacing) {
          return uswdsSpacing;
        }
      }
    }
    
    // If it's a direct spacing value or path
    if (typeof value === 'string' && (value.startsWith('!-usa') || value.startsWith('usa'))) {
      const uswdsSpacing = getUSWDSSpacing(tokens, value);
      if (uswdsSpacing) {
        return uswdsSpacing;
      }
    }
    
    // Default fallback for spacing
    return value;
  }
  
  // Handle colors
  if (token.type === 'color') {
    // If it's a reference to another token, resolve it
    if (typeof value === 'string' && value.includes('{')) {
      const match = value.match(/\{([^}]+)\}/);
      if (match) {
        const tokenPath = match[1];
        const uswdsColor = getUSWDSColor(tokens, tokenPath);
        if (uswdsColor) {
          return uswdsColor;
        }
      }
    }
    
    // If it's a direct color value or path
    if (typeof value === 'string' && (value.startsWith('!-usa') || value.startsWith('usa'))) {
      const uswdsColor = getUSWDSColor(tokens, value);
      if (uswdsColor) {
        return uswdsColor;
      }
    }
    
    // Fallback to default values
    return getFallbackColor(value);
  }
  
  return value;
}

function resolveTokenValue(value, tokens) {
  if (!value) return null;

  // Handle direct values that aren't references
  if (typeof value === 'string' && !value.includes('{')) {
    // Check if it's a direct USWDS reference (e.g., "usa.spacing.4")
    if (value.startsWith('usa.') || value.startsWith('!-usa.') || value.startsWith('--usa.')) {
      // Determine the token type based on the path
      const type = determineTokenType(value);
      const token = { value, type };
      return getTokenValue(tokens, token);
    }
    return value;
  }

  // Extract token reference
  const match = value.match(/\{([^}]+)\}/);
  if (!match) return value;

  const tokenPath = match[1];
  
  // Special case for font-size theme references (more detailed handling in getTokenValue)
  if (tokenPath.includes('#-theme.font-size')) {
    const token = {
      value: value,
      type: 'fontSize'
    };
    return getTokenValue(tokens, token);
  }
  
  // Create a token object from the path
  const token = {
    value: tokenPath,
    type: determineTokenType(tokenPath)
  };

  // Use getTokenValue for resolution
  return getTokenValue(tokens, token);
}

/**
 * Determines the token type based on the path
 * 
 * @param {string} path - The token path
 * @returns {string} - The token type (color, fontSize, fontFamily, etc.)
 */
function determineTokenType(path) {
  if (!path) return 'unknown';
  
  // Clean the path for easier pattern matching
  const cleanPath = path.replace(/[{}]/g, '')
                        .replace(/^[!-]*/, '')
                        .replace(/^--/, '')
                        .toLowerCase();
  
  if (cleanPath.includes('color')) {
    return 'color';
  }
  
  if (cleanPath.includes('font-size') || cleanPath.match(/font-size|typography|type\.size/)) {
    return 'fontSize';
  }
  
  if (cleanPath.includes('font-family') || cleanPath.match(/family|typeface/)) {
    return 'fontFamily';
  }
  
  if (cleanPath.includes('font-weight') || cleanPath.match(/weight|[0-9]{3}|thin|light|regular|medium|bold|heavy/)) {
    return 'fontWeight';
  }
  
  if (cleanPath.includes('spacing') || cleanPath.match(/margin|padding|gap|space/)) {
    return 'spacing';
  }
  
  // Handle type.size references as font-size
  if (cleanPath.match(/reading\.[a-z0-9]+|display\.[a-z0-9]+|mono\.[a-z0-9]+|proto\.[a-z0-9]+/)) {
    return 'fontSize';
  }
  
  return 'unknown';
}

/**
 * Get a fallback font family based on name
 */
function getFallbackFontFamily(value) {
  const families = {
    'sans': '"Public Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    'serif': 'Merriweather, Georgia, Cambria, "Times New Roman", Times, serif',
    'mono': 'source-code-pro, Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace'
  };
  
  // Handle potential naming variants
  const name = typeof value === 'string' ? value.toLowerCase() : '';
  
  if (name.includes('sans')) return families.sans;
  if (name.includes('serif')) return families.serif;
  if (name.includes('mono')) return families.mono;
  
  // Default to sans
  return families.sans;
}

/**
 * Get a fallback font weight based on name
 */
function getFallbackFontWeight(value) {
  const weights = {
    'thin': '200',
    'light': '300',
    'regular': '400',
    'normal': '400',
    'medium': '500',
    'semibold': '600',
    'bold': '700',
    'heavy': '800',
    'black': '900'
  };
  
  // Handle numerical weights
  if (value && !isNaN(value)) {
    return value;
  }
  
  // Handle name variants
  const name = typeof value === 'string' ? value.toLowerCase() : '';
  
  for (const [key, weight] of Object.entries(weights)) {
    if (name.includes(key)) {
      return weight;
    }
  }
  
  // Default to regular
  return '400';
}

/**
 * Get fallback typography values
 */
function getFallbackTypography(type = 'reading', size = 'md') {
  // Map size names to values
  const sizeMap = {
    '3xs': '0.75rem',    // 12px
    '2xs': '0.8125rem',  // 13px
    'xs': '0.875rem',    // 14px
    'sm': '1rem',        // 16px
    'md': '1.125rem',    // 18px
    'lg': '1.25rem',     // 20px
    'xl': '1.5rem',      // 24px
    '2xl': '1.75rem',    // 28px
    '3xl': '2rem',       // 32px
    '1': '0.75rem',      // 12px 
    '2': '0.8125rem',    // 13px
    '3': '0.875rem',     // 14px
    '4': '1rem',         // 16px
    '5': '1.125rem',     // 18px
    '6': '1.25rem',      // 20px
    '7': '1.375rem',     // 22px
    '8': '1.5rem',       // 24px
    '9': '1.75rem',      // 28px
    '10': '2rem',        // 32px
    '11': '2.25rem',     // 36px
    '12': '2.5rem',      // 40px 
    '13': '2.75rem',     // 44px
    '14': '3rem',        // 48px
    '15': '3.5rem'       // 56px
  };
  
  // Return the size value, defaulting to 1rem if not found
  return sizeMap[size] || '1rem';
}

/**
 * Get fallback color values
 */
function getFallbackColor(value) {
  // If it's already a hex color, return it
  if (typeof value === 'string' && (value.startsWith('#') || value.startsWith('rgb'))) {
    return value;
  }
  
  // Handle color name and variants
  const colorName = typeof value === 'string' ? value.replace(/[{}]/g, '') : '';
  
  // Simple fallback color system
  const colors = {
    'primary': '#005ea2',
    'secondary': '#565c65',
    'accent': '#c05600',
    'accent-warm': '#c05600',
    'accent-cool': '#00bde3',
    'success': '#00a91c',
    'warning': '#ffbe2e',
    'error': '#d54309',
    'info': '#00bde3',
    'disabled': '#c9c9c9',
    'black': '#000000',
    'white': '#ffffff',
    'gray': '#71767a',
    'blue': '#0050d8',
    'red': '#e52207',
    'yellow': '#fee685',
    'green': '#008817'
  };
  
  for (const [name, hex] of Object.entries(colors)) {
    if (colorName.includes(name)) {
      return hex;
    }
  }
  
  // Default fallback
  return '#666666';
}

// Helper function to resolve secondary colors
function resolveSecondaryColor(variant) {
  const baseColor = '#757575';  // Gray-50
  const vividColor = '#666666'; // More saturated gray
  
  if (variant === 'vivid' || variant?.endsWith('v')) {
    return vividColor;
  }
  
  switch(variant) {
    case 'lighter':
    case 'lightest':
      return lightenColor(baseColor, 30);
    case 'light':
      return lightenColor(baseColor, 20);
    case 'medium':
      return baseColor;
    case 'dark':
      return darkenColor(baseColor, 20);
    case 'darker':
    case 'darkest':
      return darkenColor(baseColor, 30);
    default:
      return baseColor;
  }
}

// Helper function to resolve error colors
function resolveErrorColor(variant) {
  const baseColor = '#D83933';  // Red-50v
  const vividColor = '#FF4136'; // Vivid red
  
  if (variant === 'vivid' || variant?.endsWith('v')) {
    return vividColor;
  }
  
  switch(variant) {
    case 'lighter':
    case 'lightest':
      return lightenColor(baseColor, 30);
    case 'light':
      return lightenColor(baseColor, 20);
    case 'medium':
      return baseColor;
    case 'dark':
      return darkenColor(baseColor, 20);
    case 'darker':
    case 'darkest':
      return darkenColor(baseColor, 30);
    default:
      return baseColor;
  }
}

// Helper function to resolve warning colors
function resolveWarningColor(variant) {
  const baseColor = '#FFBE2E';  // Gold-20v
  const vividColor = '#FFD700'; // Vivid gold
  
  if (variant === 'vivid' || variant?.endsWith('v')) {
    return vividColor;
  }
  
  switch(variant) {
    case 'lighter':
    case 'lightest':
      return lightenColor(baseColor, 30);
    case 'light':
      return lightenColor(baseColor, 20);
    case 'medium':
      return baseColor;
    case 'dark':
      return darkenColor(baseColor, 20);
    case 'darker':
    case 'darkest':
      return darkenColor(baseColor, 30);
    default:
      return baseColor;
  }
}

// Helper function to resolve success colors
function resolveSuccessColor(variant) {
  const baseColor = '#00A91C';  // Green-40v
  const vividColor = '#00C853'; // Vivid green
  
  if (variant === 'vivid' || variant?.endsWith('v')) {
    return vividColor;
  }
  
  switch(variant) {
    case 'lighter':
    case 'lightest':
      return lightenColor(baseColor, 30);
    case 'light':
      return lightenColor(baseColor, 20);
    case 'medium':
      return baseColor;
    case 'dark':
      return darkenColor(baseColor, 20);
    case 'darker':
    case 'darkest':
      return darkenColor(baseColor, 30);
    default:
      return baseColor;
  }
}

// Helper function to resolve disabled colors
function resolveDisabledColor(variant) {
  const baseColor = '#C9C9C9';  // Gray-20
  
  // Disabled colors don't have vivid variants
  switch(variant) {
    case 'lighter':
    case 'lightest':
      return lightenColor(baseColor, 20);
    case 'light':
      return lightenColor(baseColor, 10);
    case 'medium':
      return baseColor;
    case 'dark':
      return darkenColor(baseColor, 10);
    case 'darker':
    case 'darkest':
      return darkenColor(baseColor, 20);
    default:
      return baseColor;
  }
}

// Helper function to lighten a color
function lightenColor(color, amount = 20) {
  // Remove # if present
  color = color.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  
  // Lighten by mixing with white based on amount
  const factor = (100 + amount) / 100;
  const newR = Math.min(255, Math.floor(r * factor));
  const newG = Math.min(255, Math.floor(g * factor));
  const newB = Math.min(255, Math.floor(b * factor));
  
  // Convert back to hex
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

// Helper function to darken a color
function darkenColor(color, amount = 20) {
  // Remove # if present
  color = color.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  
  // Darken by reducing the values based on amount
  const factor = (100 - amount) / 100;
  const newR = Math.max(0, Math.floor(r * factor));
  const newG = Math.max(0, Math.floor(g * factor));
  const newB = Math.max(0, Math.floor(b * factor));
  
  // Convert back to hex
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

export function transformToCSS(tokens) {
  const cssParts = [':root {'];
  
  // Extract tokens from the nested structure
  const themeTokens = tokens['USWDS Theme/Project theme']?.['#-theme'] || {};
  
  // Transform colors
  if (themeTokens.color) {
    cssParts.push('\n  /* Colors */');
    for (const [category, variants] of Object.entries(themeTokens.color)) {
      if (typeof variants === 'object' && variants.value) {
        // Handle direct color values
        const varName = toKebabCase(category);
        cssParts.push(`  --color-${varName}: ${resolveTokenValue(variants.value, tokens)};`);
      } else {
        // Handle nested color variants
        for (const [variant, token] of Object.entries(variants)) {
          if (token.value) {
            const varName = toKebabCase(`${category}-${variant}`);
            cssParts.push(`  --color-${varName}: ${resolveTokenValue(token.value, tokens)};`);
          }
        }
      }
    }
  }
  
  // Transform font sizes
  if (themeTokens['font-size']) {
    cssParts.push('\n  /* Font Sizes */');
    for (const [category, sizes] of Object.entries(themeTokens['font-size'])) {
      for (const [size, token] of Object.entries(sizes)) {
        if (token.value) {
          const varName = toKebabCase(`${category}-${size}`);
          cssParts.push(`  --font-size-${varName}: ${resolveTokenValue(token.value, tokens)};`);
        }
      }
    }
  }
  
  // Transform font weights
  if (themeTokens['font-weight']) {
    cssParts.push('\n  /* Font Weights */');
    for (const [weight, token] of Object.entries(themeTokens['font-weight'])) {
      if (token.value) {
        const varName = toKebabCase(weight);
        cssParts.push(`  --font-weight-${varName}: ${resolveTokenValue(token.value, tokens)};`);
      }
    }
  }
  
  // Transform spacing
  if (themeTokens.page?.margins) {
    cssParts.push('\n  /* Spacing */');
    for (const [name, token] of Object.entries(themeTokens.page.margins)) {
      if (token.value) {
        const varName = toKebabCase(name);
        cssParts.push(`  --spacing-${varName}: ${resolveTokenValue(token.value, tokens)};`);
      }
    }
  }
  
  cssParts.push('}');
  
  // Add utility classes for colors
  if (themeTokens.color) {
    cssParts.push('\n/* Color Utility Classes */');
    for (const [category, variants] of Object.entries(themeTokens.color)) {
      if (typeof variants === 'object' && variants.value) {
        // Handle direct color values
        const varName = toKebabCase(category);
        cssParts.push(`.color-${varName} { color: var(--color-${varName}); }`);
        cssParts.push(`.bg-${varName} { background-color: var(--color-${varName}); }`);
        
        // Add vivid variants if applicable
        if (variants.value.includes('vivid') || variants.value.endsWith('v')) {
          cssParts.push(`.color-${varName}-vivid { color: var(--color-${varName}-vivid); }`);
          cssParts.push(`.bg-${varName}-vivid { background-color: var(--color-${varName}-vivid); }`);
        }
      } else {
        // Handle nested color variants
        for (const [variant, token] of Object.entries(variants)) {
          if (token.value) {
            const varName = toKebabCase(`${category}-${variant}`);
            cssParts.push(`.color-${varName} { color: var(--color-${varName}); }`);
            cssParts.push(`.bg-${varName} { background-color: var(--color-${varName}); }`);
            
            // Add vivid variants if applicable
            if (token.value.includes('vivid') || token.value.endsWith('v')) {
              cssParts.push(`.color-${varName}-vivid { color: var(--color-${varName}-vivid); }`);
              cssParts.push(`.bg-${varName}-vivid { background-color: var(--color-${varName}-vivid); }`);
            }
          }
        }
      }
    }
  }
  
  // Add utility classes for font sizes
  if (themeTokens['font-size']) {
    cssParts.push('\n/* Font Size Utility Classes */');
    for (const [category, sizes] of Object.entries(themeTokens['font-size'])) {
      for (const [size, token] of Object.entries(sizes)) {
        if (token.value) {
          const varName = toKebabCase(`${category}-${size}`);
          cssParts.push(`.font-size-${varName} {`);
          cssParts.push(`  font-size: var(--font-size-${varName});`);
          cssParts.push('}');
        }
      }
    }
  }
  
  // Add utility classes for font weights
  if (themeTokens['font-weight']) {
    cssParts.push('\n/* Font Weight Utility Classes */');
    for (const [weight, token] of Object.entries(themeTokens['font-weight'])) {
      if (token.value) {
        const varName = toKebabCase(weight);
        cssParts.push(`.font-weight-${varName} {`);
        cssParts.push(`  font-weight: var(--font-weight-${varName});`);
        cssParts.push('}');
      }
    }
  }
  
  // Add utility classes for spacing
  if (themeTokens.page?.margins) {
    cssParts.push('\n/* Spacing Utility Classes */');
    for (const [name, token] of Object.entries(themeTokens.page.margins)) {
      if (token.value) {
        const varName = toKebabCase(name);
        cssParts.push(`.margin-${varName} {`);
        cssParts.push(`  margin: var(--spacing-${varName});`);
        cssParts.push('}');
        cssParts.push(`.padding-${varName} {`);
        cssParts.push(`  padding: var(--spacing-${varName});`);
        cssParts.push('}');
      }
    }
  }
  
  return cssParts.join('\n');
}

/**
 * Convert a string to kebab-case.
 * 
 * @param {string} name - The string to convert
 * @returns {string} - The kebab-case string
 */
function toKebabCase(name) {
  // Replace spaces, slashes, and underscores with hyphens
  let result = name.replace(/[\s/_.]+/g, '-');
  
  // Handle camelCase and PascalCase
  result = result.replace(/([a-z0-9])([A-Z])/g, '$1-$2');
  
  // Convert to lowercase
  result = result.toLowerCase();
  
  // Remove any non-alphanumeric characters except hyphens
  result = result.replace(/[^a-z0-9-]/g, '');
  
  // Replace multiple hyphens with a single hyphen
  result = result.replace(/-+/g, '-');
  
  // Remove leading and trailing hyphens
  result = result.replace(/^-+|-+$/g, '');
  
  return result;
}

/**
 * Convert a camelCase property name to a CSS property name.
 * 
 * @param {string} propName - The camelCase property name
 * @returns {string|null} - The CSS property name or null if not mappable
 */
function toCssProperty(propName) {
  // Map of JavaScript style property names to CSS property names
  const propertyMap = {
    'fontFamily': 'font-family',
    'fontSize': 'font-size',
    'fontWeight': 'font-weight',
    'lineHeight': 'line-height',
    'letterSpacing': 'letter-spacing',
    'textCase': 'text-transform',
    'textDecoration': 'text-decoration'
  };
  
  return propertyMap[propName] || null;
} 