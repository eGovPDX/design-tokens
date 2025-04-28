/**
 * CSS Transformer
 * 
 * This module transforms design tokens from JSON format to CSS variables.
 */

export function transformToCSS(tokens) {
  const cssParts = [':root {'];
  
  // Transform colors
  if (tokens.colors && Object.keys(tokens.colors).length > 0) {
    cssParts.push('  /* Colors */');
    for (const [name, value] of Object.entries(tokens.colors)) {
      // Convert name to kebab-case for CSS variables
      const varName = toKebabCase(name);
      cssParts.push(`  --color-${varName}: ${value};`);
    }
  }
  
  // Transform typography
  if (tokens.typography && Object.keys(tokens.typography).length > 0) {
    cssParts.push('\n  /* Typography */');
    for (const [name, props] of Object.entries(tokens.typography)) {
      // Convert name to kebab-case for CSS variables
      const varName = toKebabCase(name);
      
      // Add each typography property as a separate variable
      for (const [propName, propValue] of Object.entries(props)) {
        // Handle special cases for typography properties
        let formattedValue = propValue;
        if (propName === 'fontSize' && typeof propValue === 'number') {
          formattedValue = `${propValue}px`;
        } else if (propName === 'lineHeight' && typeof propValue === 'number') {
          formattedValue = `${propValue}px`;
        } else if (propName === 'letterSpacing' && typeof propValue === 'number') {
          formattedValue = `${propValue}px`;
        }
        
        cssParts.push(`  --typography-${varName}-${toKebabCase(propName)}: ${formattedValue};`);
      }
    }
  }
  
  // Transform spacing
  if (tokens.spacing && Object.keys(tokens.spacing).length > 0) {
    cssParts.push('\n  /* Spacing */');
    for (const [name, value] of Object.entries(tokens.spacing)) {
      // Convert name to kebab-case for CSS variables
      const varName = toKebabCase(name);
      cssParts.push(`  --spacing-${varName}: ${value}px;`);
    }
  }
  
  cssParts.push('}');
  
  // Add utility classes for colors
  if (tokens.colors && Object.keys(tokens.colors).length > 0) {
    cssParts.push('\n/* Color Utility Classes */');
    for (const name of Object.keys(tokens.colors)) {
      const varName = toKebabCase(name);
      cssParts.push(`.color-${varName} {`);
      cssParts.push(`  color: var(--color-${varName});`);
      cssParts.push('}');
      cssParts.push(`.bg-${varName} {`);
      cssParts.push(`  background-color: var(--color-${varName});`);
      cssParts.push('}');
    }
  }
  
  // Add utility classes for typography
  if (tokens.typography && Object.keys(tokens.typography).length > 0) {
    cssParts.push('\n/* Typography Utility Classes */');
    for (const [name, props] of Object.entries(tokens.typography)) {
      const varName = toKebabCase(name);
      cssParts.push(`.typography-${varName} {`);
      for (const propName of Object.keys(props)) {
        const cssPropName = toCssProperty(propName);
        if (cssPropName) {
          cssParts.push(`  ${cssPropName}: var(--typography-${varName}-${toKebabCase(propName)});`);
        }
      }
      cssParts.push('}');
    }
  }
  
  // Add utility classes for spacing
  if (tokens.spacing && Object.keys(tokens.spacing).length > 0) {
    cssParts.push('\n/* Spacing Utility Classes */');
    for (const name of Object.keys(tokens.spacing)) {
      const varName = toKebabCase(name);
      cssParts.push(`.margin-${varName} {`);
      cssParts.push(`  margin: var(--spacing-${varName});`);
      cssParts.push('}');
      cssParts.push(`.padding-${varName} {`);
      cssParts.push(`  padding: var(--spacing-${varName});`);
      cssParts.push('}');
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