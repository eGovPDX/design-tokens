/**
 * CSS Transformer
 * 
 * This module transforms design tokens from JSON format to CSS variables.
 */

/**
 * Get a token value from the tokens object using a path.
 * 
 * @param {Object} tokens - The tokens object
 * @param {string} path - The path to the token value
 * @returns {*} - The token value or null if not found
 */
function getTokenValue(tokens, path) {
  // Remove any prefix markers (!-, --, etc.)
  const cleanPath = path.replace(/^[!-]*/, '').replace(/^usa\./, '');
  const parts = cleanPath.split('.');
  
  // Handle USWDS theme tokens
  const themeSections = [
    'USWDS Theme/Project theme',
    'USWDS Theme/Default',
    'USWDS Theme/PGOV'
  ];

  for (const section of themeSections) {
    let current = tokens[section]?.['#-theme'];
    if (!current) continue;

    // Navigate through the token structure
    let found = true;
    for (const part of parts) {
      if (!current || !current[part]) {
        found = false;
        break;
      }
      current = current[part];
    }

    if (found && current?.value) {
      // Handle font weights
      if (parts.includes('font-weight')) {
        const weight = current.value.toLowerCase();
        return getFallbackFontWeight(weight);
      }
      // Handle font sizes
      if (parts.includes('font-size')) {
        const type = parts[parts.length - 2];
        const size = parts[parts.length - 1];
        return getFallbackTypography(type, size);
      }
      return current.value;
    }
  }

  // If not found in themes, check for direct values
  if (parts[0] === 'color') {
    const colorName = parts[1];
    const variant = parts[2];
    return getFallbackColor(colorName, variant);
  }

  // Handle font sizes
  if (parts[0] === 'type') {
    return getFallbackTypography(parts[1], parts[2]);
  }

  // Handle font weights
  if (parts[0] === 'font' && parts[1] === 'weight') {
    return getFallbackFontWeight(parts[2]);
  }

  return null;
}

function resolveTokenValue(value, tokens, theme = 'default') {
  if (!value) return null;

  // Handle direct values
  if (typeof value === 'string' && !value.includes('{')) {
    // If it's a font weight value, process it
    if (value.toLowerCase().includes('bold') || 
        value.toLowerCase().includes('regular') || 
        value.toLowerCase().includes('light') ||
        value.toLowerCase().includes('thin') ||
        value.toLowerCase().includes('medium') ||
        value.toLowerCase().includes('heavy')) {
      return getFallbackFontWeight(value);
    }
    return value;
  }

  // Extract token reference
  const match = value.match(/\{([^}]+)\}/);
  if (!match) return value;

  const tokenPath = match[1];
  
  // Resolve the token value
  const resolvedValue = getTokenValue(tokens, tokenPath);
  if (resolvedValue) {
    // Handle nested token references
    if (typeof resolvedValue === 'string' && resolvedValue.includes('{')) {
      return resolveTokenValue(resolvedValue, tokens, theme);
    }
    return resolvedValue;
  }

  // Fallback values
  if (tokenPath.includes('font-size')) {
    const parts = tokenPath.split('.');
    const type = parts[parts.length - 2];
    const size = parts[parts.length - 1];
    return getFallbackTypography(type, size);
  }
  if (tokenPath.includes('font-weight')) {
    const parts = tokenPath.split('.');
    const weight = parts[parts.length - 1];
    return getFallbackFontWeight(weight);
  }
  if (tokenPath.includes('color')) {
    return '#666666';
  }
  if (tokenPath.includes('spacing')) {
    return '1rem';
  }

  return value;
}

function getFallbackTypography(type, size) {
  const typographyMap = {
    'reading': {
      '1': '0.75rem',
      '2': '0.875rem',
      '3': '1rem',
      '4': '1.125rem',
      '5': '1.25rem',
      '6': '1.5rem',
      '9': '1.75rem',
      '12': '2rem',
      '14': '2.5rem',
      '15': '3rem'
    },
    'display': {
      '2': '0.875rem',
      '3': '1rem',
      '4': '1.25rem',
      '5': '1.5rem',
      '6': '2rem',
      '9': '2.5rem',
      '12': '3rem',
      '14': '3.5rem',
      '15': '4rem'
    },
    'mono': {
      '2': '0.75rem',
      '3': '0.875rem',
      '4': '1rem',
      '5': '1.125rem',
      '6': '1.25rem',
      '9': '1.5rem',
      '12': '1.75rem',
      '14': '2rem',
      '15': '2.5rem'
    },
    'proto': {
      '2': '0.75rem',
      '3': '0.875rem',
      '4': '1rem',
      '5': '1.25rem',
      '6': '1.5rem',
      '7': '2rem',
      '12': '2.5rem',
      '14': '3rem',
      '15': '3.5rem'
    }
  };

  // Extract the actual type and size from the token path or value
  const cleanType = type.toLowerCase().replace(/^[!-]*/, '').replace(/^usa\.type\./, '');
  const cleanSize = size.toLowerCase().replace(/^[!-]*/, '');
  return typographyMap[cleanType]?.[cleanSize] || '1rem';
}

function getFallbackFontWeight(weight) {
  const weightMap = {
    'thin': '300',
    'light': '300',
    'normal': '400',
    'regular': '400',
    'medium': '500',
    'semibold': '600',
    'bold': '700',
    'heavy': '800',
    'extra-bold': '800',
    'extra bold': '800',
    'black': '900'
  };

  // Extract the actual weight from the token path or value
  const actualWeight = weight.toLowerCase()
    .replace(/^[!-]*/, '')
    .replace(/^usa\.font\.weight\./, '')
    .replace(/^font\.weight\./, '');

  // If the weight is already a number, return it
  if (!isNaN(actualWeight)) {
    return actualWeight;
  }

  return weightMap[actualWeight] || '400';
}

function getFallbackColor(colorName, variant) {
  const colorMap = {
    'gray': {
      '5': '#F0F0F0',
      '10': '#E6E6E6',
      '30': '#ADADAD',
      '50': '#757575',
      '60': '#666666',
      '80': '#333333',
      '90': '#1A1A1A'
    },
    'blue-warm': {
      '5': '#E8F2FF',
      '20': '#73A5E6',
      '30v': '#4A89DA',
      '50': '#2E5C99',
      '50v': '#2E78D2',
      '60': '#2E78D2',
      '70v': '#1B4B8F',
      '80': '#0D2B5F'
    },
    'gold': {
      '5': '#FFF5E6',
      '10': '#FFE0B3',
      '30': '#FFBE2E',
      '30v': '#FFB300',
      '50': '#996B00',
      '60': '#805700',
      '70': '#664400',
      '80': '#4D3300'
    },
    'mint': {
      '5v': '#E0FFF2',
      '20': '#7DDCC8',
      '30': '#40B393',
      '30v': '#48C0A3',
      '50': '#2E8C73',
      '60': '#1A5751',
      '70': '#0D2E2C',
      '80': '#041615'
    },
    'indigo': {
      '5': '#F0F2FF',
      '10': '#B3BCFF',
      '40v': '#6B7FCC',
      '50': '#4D5BBF',
      '60v': '#5A6BBF',
      '70v': '#3D4B99',
      '80': '#2E3973'
    },
    'cyan': {
      '5': '#E6F9FF',
      '20': '#99E1EC',
      '30v': '#40CCDF',
      '50v': '#00A5C6',
      '60v': '#0089A7',
      '70': '#006D84',
      '80': '#0D7EA2'
    },
    'red': {
      '10': '#FFE6E6',
      '20': '#FFB3B3',
      '30': '#FF8080',
      '50v': '#FF4D4D',
      '60v': '#FF1A1A',
      '70v': '#E60000',
      '80v': '#B30000'
    },
    'yellow': {
      '5': '#FFF9E6',
      '20v': '#FFE066',
      '30v': '#FFD700',
      '50v': '#FFBE2E',
      '60': '#B38F00',
      '70': '#806600',
      '80': '#4D3D00'
    },
    'green-cool': {
      '5': '#E6FFF0',
      '20v': '#70E17B',
      '40v': '#00A91C',
      '50v': '#008817',
      '60v': '#216E1F',
      '70v': '#154C21',
      '80': '#0D3915'
    },
    'black-transparent': {
      '10': 'rgba(0, 0, 0, 0.1)',
      '20': 'rgba(0, 0, 0, 0.2)',
      '40': 'rgba(0, 0, 0, 0.4)',
      '50': 'rgba(0, 0, 0, 0.5)'
    },
    'white-transparent': {
      '10': 'rgba(255, 255, 255, 0.1)',
      '20': 'rgba(255, 255, 255, 0.2)',
      '30': 'rgba(255, 255, 255, 0.3)'
    },
    'red-warm': {
      '60v': '#FF4D4D',
      '80': '#B30000'
    },
    'white': '#FFFFFF'
  };

  return colorMap[colorName]?.[variant] || '#666666';
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