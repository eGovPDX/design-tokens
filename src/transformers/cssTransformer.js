/**
 * CSS Transformer
 * 
 * This module transforms design tokens from JSON format to CSS variables.
 */

import { getUSWDSFontFamily, getUSWDSTypography, getUSWDSFontWeight, getUSWDSColor, getUSWDSSpacing } from './uswdsTokenResolver.js';

// New Helper Function: getDefinitionByPath
/**
 * Retrieves a token definition or primitive value from a tokens object using a dot-separated path.
 * Handles top-level keys that might contain slashes by matching segments of the path.
 * @param {string} pathString - The dot-separated path to the token (e.g., "Color.--usa.color.red.5").
 * @param {object} tokensJson - The full tokens JSON object.
 * @returns {object|string|number|null} The token definition object or primitive value, or null if not found.
 */
function getDefinitionByPath(pathString, tokensJson) {
  if (!pathString || typeof pathString !== 'string') {
    return null;
  }

  const parts = pathString.split('.');
  let currentContext = tokensJson;
  let partIndex = 0;

  // Find the correct top-level set key
  let potentialKey = parts[partIndex];
  let foundTopLevel = false;
  for (let i = 1; i <= parts.length; i++) {
    potentialKey = parts.slice(0, i).join('.'); // e.g., "USWDS Theme", then "USWDS Theme.Project theme"
    const matchingTopLevelKey = Object.keys(tokensJson).find(k => k.replace(/\//g, '.') === potentialKey);
    if (matchingTopLevelKey && tokensJson.hasOwnProperty(matchingTopLevelKey)) {
      currentContext = tokensJson[matchingTopLevelKey];
      partIndex = i;
      foundTopLevel = true;
      break;
    }
  }

  if (!foundTopLevel) {
    if (tokensJson.hasOwnProperty(parts[0])) {
      currentContext = tokensJson[parts[0]];
      partIndex = 1;
    } else {
      return null; // Top-level key not found
    }
  }
  
  // Traverse remaining parts
  for (let i = partIndex; i < parts.length; i++) {
    const part = parts[i];

    if (currentContext && typeof currentContext === 'object') {
      if (currentContext.hasOwnProperty(part)) {
        currentContext = currentContext[part];
      } else if (i + 1 < parts.length) {
        // Try combining current part and next part with a hyphen
        const combinedPart = `${part}-${parts[i+1]}`;
        if (currentContext.hasOwnProperty(combinedPart)) {
          currentContext = currentContext[combinedPart];
          i++; // Increment i because we've consumed the next part as well
        } else {
          return null;
        }
      } else {
        return null;
      }
    } else {
      return null; // Path segment not found or context is not an object
    }
  }
  return currentContext; // This could be a token object {value, type} or a primitive
}

/**
 * Get a token value from the tokens object using a path.
 * 
 * @param {Object} tokens - The tokens object
 * @param {string} path - The path to the token value
 * @returns {*} - The token value or null if not found
 */
function getTokenValue(tokens, token, visited = new Set()) {
  let currentValue = token.value;
  const originalType = token.type;
  let isResolvedAliasPrimitive = false; // Flag to indicate if alias resolved directly to a primitive

  // 1. Resolve alias if present, and repeat if the result is another alias
  let maxAliasResolutions = 10; 
  let tempVisited = new Set(visited); // Each top-level getTokenValue call for an alias gets its own visited set for its chain

  // Check for initial circular reference before loop
  if (typeof currentValue === 'string' && currentValue.includes('{') && tempVisited.has(currentValue)) {
      return getFallbackValueForPath(currentValue, originalType);
  }

  while (typeof currentValue === 'string' && currentValue.includes('{') && maxAliasResolutions-- > 0) {
    if (!tempVisited.has(currentValue)) { // Add to visited only if not already there for this chain
        tempVisited.add(currentValue);
    } else { // Already visited in this chain, implies a loop not caught by the initial check (should be rare)
        return getFallbackValueForPath(currentValue, originalType); 
    }

    const resolved = resolveAlias(currentValue, tokens, tempVisited); // Pass current chain's visited set
    if (resolved.error || resolved.value === null || resolved.value === currentValue) {
      return getFallbackValueForPath(currentValue, originalType);
    }
    currentValue = resolved.value;
  }

  // Check if max resolutions were hit while still having an alias
  if (maxAliasResolutions <= 0 && typeof currentValue === 'string' && currentValue.includes('{')) {
    return getFallbackValueForPath(token.value, originalType);
  }
  // After loop, currentValue is the result of alias resolution(s)
  isResolvedAliasPrimitive = !(typeof currentValue === 'string' && currentValue.includes('.')); // Heuristic: if no dots, might be primitive or simple name

  // 2. Handle direct primitive values (already resolved or never an alias)
  if (typeof currentValue === 'string') {
    if (originalType === 'color' && (currentValue.startsWith('#') || currentValue.startsWith('rgb'))) return currentValue;
    if ((originalType === 'dimension' || originalType === 'fontSize' || originalType === 'spacing') && (currentValue.includes('px') || currentValue.includes('rem') || currentValue.includes('em') || currentValue.includes('%'))) return currentValue;
    if (originalType === 'fontWeight' && !isNaN(parseFloat(currentValue))) return String(currentValue);
    if (originalType === 'fontFamily' && !currentValue.includes('.') && (currentValue.includes(',') || currentValue.startsWith('\"') || currentValue.startsWith("'"))) return currentValue;
  }
  if (typeof currentValue === 'number') {
      if (originalType === 'fontWeight') return String(currentValue);
      if ((originalType === 'dimension' || originalType === 'fontSize' || originalType === 'spacing') && !String(currentValue).match(/px|rem|em|%/)) {
          return String(currentValue) + 'px'; 
      }
      return String(currentValue); 
  }

  // 3. If 'currentValue' is a path string, use type-specific USWDS/fallback resolvers
  if (typeof currentValue === 'string') { 
      let resultFromResolver;
      if (originalType === 'fontFamily' || (originalType === 'text' && (currentValue.toLowerCase().includes('sans') || currentValue.toLowerCase().includes('serif') || currentValue.toLowerCase().includes('mono')))) {
        resultFromResolver = getUSWDSFontFamily(tokens, currentValue);
        if (resultFromResolver) return resultFromResolver;
        return getFallbackFontFamily(currentValue);
      }
      
      if (originalType === 'fontWeight') {
        resultFromResolver = getUSWDSFontWeight(tokens, currentValue);
        if (resultFromResolver && typeof resultFromResolver.value !== 'undefined') resultFromResolver = resultFromResolver.value; // Extract primitive
        else if (resultFromResolver && (typeof resultFromResolver === 'string' || typeof resultFromResolver === 'number')) { /* no-op */ } 
        else resultFromResolver = null; // Not a primitive or token object
        if (resultFromResolver) return String(resultFromResolver); // Ensure string for weights like 400
        return getFallbackFontWeight(currentValue);
      }
      
      if (originalType === 'fontSize' || (originalType === 'dimension' && (currentValue.includes('font-size') || currentValue.match(/reading\.|display\.|mono\.|proto\.|body\.|heading\.|ui\.|alt\.|fontSiz/i) ))) { // Added fontSize to regex
        const parts = currentValue.replace(/^--theme\.font-size\.|^--usa\.font-size\.|^font-size\./i, '').split('.');
        let fontType = 'reading';
        let fontSizeName = 'md';
        if (parts.length === 1) {
            fontSizeName = parts[0];
            if (['reading', 'display', 'mono', 'proto', 'body', 'heading', 'ui', 'alt'].includes(fontSizeName.toLowerCase())){
                fontType = fontSizeName.toLowerCase();
                fontSizeName = 'md'; 
            }
        } else if (parts.length > 1) {
            fontType = parts[0];
            fontSizeName = parts.slice(1).join('.'); 
        }
        resultFromResolver = getUSWDSTypography(tokens, fontType, fontSizeName);
        if (resultFromResolver && typeof resultFromResolver.value !== 'undefined') resultFromResolver = resultFromResolver.value;
        else if (resultFromResolver && typeof resultFromResolver === 'string') { /* no-op */ } 
        else resultFromResolver = null;
        if (resultFromResolver) return resultFromResolver;
        return getFallbackTypography(fontType, fontSizeName);
      }
      
      if (originalType === 'spacing' || (originalType === 'dimension' && currentValue.includes('spacing'))) {
        resultFromResolver = getUSWDSSpacing(tokens, currentValue); 
        if (resultFromResolver && typeof resultFromResolver.value !== 'undefined') resultFromResolver = resultFromResolver.value;
        else if (resultFromResolver && typeof resultFromResolver === 'string') { /* no-op */ } 
        else resultFromResolver = null;
        if (resultFromResolver) return resultFromResolver;
        return getFallbackValueForPath(currentValue, originalType);
      }
      
      if (originalType === 'color') {
        resultFromResolver = getUSWDSColor(tokens, currentValue); 
        if (resultFromResolver && typeof resultFromResolver.value !== 'undefined') resultFromResolver = resultFromResolver.value;
        else if (resultFromResolver && typeof resultFromResolver === 'string' && (resultFromResolver.startsWith('#') || resultFromResolver.startsWith('rgb'))) { /* no-op */ } 
        else resultFromResolver = null;
        if (resultFromResolver) return resultFromResolver;
        return getFallbackColor(currentValue);
      }
      // If it's a string but did not match any specific type resolver logic above, it might be a direct value or an unhandled path.
      // If it was an alias that resolved to a primitive, it should have been caught in section 2.
      return currentValue; 
  }

  return getFallbackValueForPath(token.value, originalType); 
}

// Renamed resolveTokenValue to resolveAlias, focused on returning primitive or next alias path
function resolveAlias(valueWithBrace, tokens, visited = new Set()) { 
  if (!valueWithBrace || typeof valueWithBrace !== 'string' || !valueWithBrace.includes('{')) {
    return { value: valueWithBrace }; // Not an alias, return as is for getTokenValue to handle.
  }

  const match = valueWithBrace.match(/\{([^}]+)\}/);
  if (!match) return { value: valueWithBrace }; 

  const tokenPathFromAlias = match[1].trim(); // e.g. --usa.color.red.5 or --theme.color.primary.light

  if (visited.has(tokenPathFromAlias)) {
    return { value: getFallbackValueForPath(tokenPathFromAlias, determineTokenType(tokenPathFromAlias)), error: 'Circular dependency' };
  }
  visited.add(tokenPathFromAlias);

  // Construct the full path for getDefinitionByPath
  // This requires knowing which top-level set (--usa or --theme) the alias refers to,
  // and then finding the appropriate root key for that set.
  const parts = tokenPathFromAlias.replace(/^--/, '').split('.'); // -> ["usa", "color", "red", "5"] or ["theme", "color", "primary"]
  const scopeType = parts[0]; // "usa" or "theme"
  let fullPathForLookup = tokenPathFromAlias; // Default to the original path if we can't prefix it

  if (scopeType === 'usa') {
    // Need to find which top-level set contains this --usa path.
    // For example, if path is usa.color.red.5, we need to find "Color.--usa.color.red.5"
    // by checking which set's --usa contains "color".
    const category = parts[1]; // e.g., "color", "spacing", "font-size"
    for (const setName in tokens) {
      if (setName.startsWith('$')) continue;
      if (tokens[setName] && tokens[setName]['--usa'] && tokens[setName]['--usa'][category]) {
        // Check if the start of the path matches this category within this set's --usa scope
        let current = tokens[setName]['--usa'];
        let valid = true;
        for(let i=1; i<parts.length; ++i) { // Start from parts[1] as parts[0] is 'usa'
            if(current && current.hasOwnProperty(parts[i])) {
                current = current[parts[i]];
            } else {
                valid = false;
                break;
            }
        }
        if(valid){
            fullPathForLookup = `${setName}.${tokenPathFromAlias}`;
            break;
        }
      }
    }
  } else if (scopeType === 'theme') {
    // Path is like "theme.color.primary.light"
    // We need to find "USWDS Theme/Project theme.--theme.color.primary.light"
    const category = parts[1];
    for (const setName in tokens) {
      if (setName.startsWith('$')) continue;
      if (tokens[setName] && tokens[setName]['--theme'] && tokens[setName]['--theme'][category]) {
         let current = tokens[setName]['--theme'];
        let valid = true;
        for(let i=1; i<parts.length; ++i) { // Start from parts[1] as parts[0] is 'theme'
            if(current && current.hasOwnProperty(parts[i])) {
                current = current[parts[i]];
            } else {
                valid = false;
                break;
            }
        }
        if(valid){
            fullPathForLookup = `${setName}.${tokenPathFromAlias}`;
            break;
        }
      }
    }
  } else {
     // Path doesn't start with --usa or --theme. It might be a direct reference within a set that needs to be prefixed.
     // Example: alias is {color.red.5} inside the "Color" set context.
     // This case is harder to generalize here without knowing current processing context.
     // getDefinitionByPath is designed to handle full paths from root, so we try to form one.
     // For now, if no scope, we assume it might be an older direct path or needs to be found by getDefinitionByPath's own logic.
     // This might lead to getDefinitionByPath searching from root if fullPathForLookup isn't prefixed.
  }
  
  const definition = getDefinitionByPath(fullPathForLookup, tokens);

  visited.delete(tokenPathFromAlias);

  if (definition === null || typeof definition === 'undefined') {
    return { value: getFallbackValueForPath(tokenPathFromAlias, determineTokenType(tokenPathFromAlias)), error: `Definition not found for ${fullPathForLookup}` };
  }

  if (definition && typeof definition.value !== 'undefined') {
    // If the .value is another alias, recurse to resolve it fully.
    if (typeof definition.value === 'string' && definition.value.includes('{')) {
      return resolveAlias(definition.value, tokens, visited); 
    }
    return { value: definition.value }; // Resolved to a token object, return its primitive value
  }

  // If definition is already a primitive value (string, number) or another alias string
  if (typeof definition === 'string' || typeof definition === 'number') {
     if (typeof definition === 'string' && definition.includes('{')) { 
        return resolveAlias(definition, tokens, visited);
     }
    return { value: definition }; 
  }
  
  return { value: getFallbackValueForPath(tokenPathFromAlias, determineTokenType(tokenPathFromAlias)), error: 'Resolution failed, unexpected definition structure' };
}

function getFallbackValueForPath(path, type) { // Added type parameter
    if (type === 'color') return '#FF00FF'; 
    if (type === 'fontSize') return '1em';
    if (type === 'spacing') return '0px';
    if (type === 'fontWeight') return '400';
    if (type === 'fontFamily') return 'sans-serif';
    return path; 
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
  const allProcessedTokensForUtilities = {
    color: {},
    "font-size": {},
    "font-weight": {},
    spacing: {},
    radius: {} // Added radius for utilities if needed later
  };

  for (const [setName, setData] of Object.entries(tokens)) {
    if (setName === '$themes' || setName === '$metadata') {
      continue;
    }

    const usaTokens = setData['--usa'];
    const themeData = setData['--theme'];

    cssParts.push(`\n  /* Tokens from ${setName} */`);

    if (usaTokens) { // Handling system token sets (e.g., "Color", "Spacing", "Font Size", "Font type / ...")
      // System Colors
      if (usaTokens.color) {
        for (const [category, variants] of Object.entries(usaTokens.color)) {
          if (typeof variants === 'object' && variants.value && variants.type === 'color') {
            const varName = toKebabCase(category);
            const resolvedValue = getTokenValue(tokens, {...variants, type: variants.type || 'color' });
            if (resolvedValue) {
              cssParts.push(`  --color-${varName}: ${resolvedValue};`);
              allProcessedTokensForUtilities.color[varName] = resolvedValue;
            }
          } else if (typeof variants === 'object') {
            for (const [variantKey, token] of Object.entries(variants)) {
              if (token && token.value && token.type === 'color') {
                const varName = toKebabCase(`${category}-${variantKey}`);
                const resolvedValue = getTokenValue(tokens, {...token, type: token.type || 'color' });
                if (resolvedValue) {
                  cssParts.push(`  --color-${varName}: ${resolvedValue};`);
                  allProcessedTokensForUtilities.color[varName] = resolvedValue;
                }
              }
            }
          }
        }
      }
      // System Spacing
      if (usaTokens.spacing) {
        for (const [spacingKey, token] of Object.entries(usaTokens.spacing)) {
          if (token && token.value && token.type === 'dimension') {
            const varName = toKebabCase(`spacing-${spacingKey}`);
            const resolvedValue = getTokenValue(tokens, {...token, type: token.type || 'dimension' });
            if (resolvedValue) {
              cssParts.push(`  --${varName}: ${resolvedValue};`);
              allProcessedTokensForUtilities.spacing[spacingKey] = resolvedValue; // Store with original key for utility
            }
          }
        }
      }
      // System Font Size (from "Font Size" set itself)
      if (setName === "Font Size" && usaTokens['font-size']) {
         for (const [sizeKey, token] of Object.entries(usaTokens['font-size'])) {
            if (token && token.value && token.type === 'dimension') {
                const varName = toKebabCase(`font-size-${sizeKey}`);
                const resolvedValue = getTokenValue(tokens, {...token, type: token.type || 'dimension' });
                if (resolvedValue) {
                    cssParts.push(`  --${varName}: ${resolvedValue};`);
                    allProcessedTokensForUtilities['font-size'][sizeKey] = resolvedValue; // Store with original key
                }
            }
         }
      }
      // System Font Family & Font Sizes (from "Font type / ..." sets)
      if (usaTokens['font-family'] && usaTokens['font-size']) { // Typically for sets like "Font type / Reading/Public Sans"
        // Derive a unique font type name from the setName (e.g., 'Font type / Reading/Public Sans' -> 'public-sans')
        const fontTypeName = setName
          .replace(/^Font type \/ (Reading|Display|Mono|Proto)\//, '')
          .replace(/\s+/g, '-')
          .toLowerCase();
        for (const [fontCategory, familyToken] of Object.entries(usaTokens['font-family'])) {
            if (familyToken && familyToken.value && (familyToken.type === 'text' || familyToken.type === 'fontFamily')) { // type can be 'text'
                const familyVarName = toKebabCase(`font-family-${fontCategory}-${fontTypeName}`);
                const resolvedFamily = getTokenValue(tokens, {...familyToken, type: familyToken.type || 'fontFamily' });
                if (resolvedFamily) {
                    cssParts.push(`  --${familyVarName}: ${resolvedFamily};`);
                }
            }
            if (usaTokens['font-size'][fontCategory]) {
                for (const [sizeKey, sizeToken] of Object.entries(usaTokens['font-size'][fontCategory])) {
                    if (sizeToken && sizeToken.value && sizeToken.type === 'dimension') {
                        const sizeVarName = toKebabCase(`font-size-${fontCategory}-${fontTypeName}-${sizeKey}`);
                        const resolvedSize = getTokenValue(tokens, {...sizeToken, type: sizeToken.type || 'dimension' });
                        if (resolvedSize) {
                           cssParts.push(`  --${sizeVarName}: ${resolvedSize};`);
                           allProcessedTokensForUtilities['font-size'][`${fontCategory}-${fontTypeName}-${sizeKey}`] = resolvedSize;
                        }
                    }
                }
            }
        }
      }
      // System Font Weight (from "Font Weight" set itself or similar)
      if (usaTokens['font-weight']) {
        // Derive a unique font type name from the setName (e.g., 'Font role / Body/Reading' -> 'body-reading')
        const fontWeightTypeName = setName
          .replace(/^Font role \/ (Body|Heading|UI|Alt|Code|Proto)\//, '')
          .replace(/\s+/g, '-')
          .toLowerCase();
        for (const [weightKey, token] of Object.entries(usaTokens['font-weight'])) {
          if (token && token.value && (token.type === 'text' || token.type === 'fontWeight')) {
            const varName = toKebabCase(`font-weight-${weightKey}-${fontWeightTypeName}`);
            const resolvedValue = getTokenValue(tokens, {...token, type: token.type || 'fontWeight' });
            if (resolvedValue) {
              cssParts.push(`  --${varName}: ${resolvedValue};`);
              allProcessedTokensForUtilities['font-weight'][`${weightKey}-${fontWeightTypeName}`] = resolvedValue;
            }
          }
        }
      }
      // System Spacing (from "Spacing" set itself)
      if (usaTokens.spacing) {
        // Derive a unique spacing type name from the setName (e.g., 'Spacing' or 'Component Spacing/Button' -> 'spacing' or 'button')
        const spacingTypeName = setName
          .replace(/^Spacing\/?/, '')
          .replace(/\s+/g, '-')
          .toLowerCase();
        for (const [spacingKey, token] of Object.entries(usaTokens.spacing)) {
          if (token && token.value && token.type === 'dimension') {
            const varName = toKebabCase(`spacing-${spacingTypeName}-${spacingKey}`);
            const resolvedValue = getTokenValue(tokens, {...token, type: token.type || 'dimension' });
            if (resolvedValue) {
              cssParts.push(`  --${varName}: ${resolvedValue};`);
              allProcessedTokensForUtilities.spacing[`${spacingTypeName}-${spacingKey}`] = resolvedValue; // Store with type for utility
            }
          }
        }
      }
      // System Radius (from "Radius" set itself)
      if (usaTokens.radius) {
        // Derive a unique radius type name from the setName (e.g., 'Radius' or 'Component Radius/Card' -> 'radius' or 'card')
        const radiusTypeName = setName
          .replace(/^Radius\/?/, '')
          .replace(/\s+/g, '-')
          .toLowerCase();
        for (const [radiusKey, token] of Object.entries(usaTokens.radius)) {
            if (token && token.value && token.type === 'dimension') {
                const varName = toKebabCase(`radius-${radiusTypeName}-${radiusKey}`);
                const resolvedValue = getTokenValue(tokens, {...token, type: token.type || 'dimension' });
                if (resolvedValue) {
                    cssParts.push(`  --${varName}: ${resolvedValue};`);
                    allProcessedTokensForUtilities.radius[`${radiusTypeName}-${radiusKey}`] = resolvedValue;
                }
            }
        }
      }
    } else if (themeData) { // Handling theme token sets (e.g., "USWDS Theme/Project theme")
      // Theme Colors
      if (themeData.color) {
        for (const [category, variants] of Object.entries(themeData.color)) {
          if (variants && typeof variants === 'object') {
            if (variants.value && variants.type === 'color') { // e.g. ink, ink-reverse
              const varName = toKebabCase(category);
              const resolvedValue = getTokenValue(tokens, {...variants, type: variants.type || 'color' });
              if (resolvedValue) {
                cssParts.push(`  --theme-color-${varName}: ${resolvedValue};`);
                allProcessedTokensForUtilities.color[`${category}`] = resolvedValue; // Use simple key for utilities
              }
            } else {
              for (const [variantKey, token] of Object.entries(variants)) {
                if (token && token.value && token.type === 'color') {
                  const varName = toKebabCase(`${category}-${variantKey}`);
                  const resolvedValue = getTokenValue(tokens, {...token, type: token.type || 'color' });
                  if (resolvedValue) {
                    cssParts.push(`  --theme-color-${varName}: ${resolvedValue};`);
                     allProcessedTokensForUtilities.color[`${category}-${variantKey}`] = resolvedValue;
                  }
                }
              }
            }
          }
        }
      }
      // Theme Font Sizes
      if (themeData['font-size']) {
        for (const [category, sizes] of Object.entries(themeData['font-size'])) {
          if (sizes && typeof sizes === 'object') {
            for (const [sizeKey, token] of Object.entries(sizes)) {
              if (token && token.value && token.type === 'dimension') {
                const varName = toKebabCase(`${category}-${sizeKey}`);
                const resolvedValue = getTokenValue(tokens, {...token, type: token.type || 'dimension' });
                if (resolvedValue) {
                  cssParts.push(`  --theme-font-size-${varName}: ${resolvedValue};`);
                  allProcessedTokensForUtilities['font-size'][`${category}-${sizeKey}`] = resolvedValue;
                }
              }
            }
          }
        }
      }
      // Theme Font Weights
      if (themeData['font-weight']) {
        for (const [weightKey, token] of Object.entries(themeData['font-weight'])) {
          if (token && token.value && (token.type === 'text' || token.type === 'fontWeight')) {
            const varName = toKebabCase(weightKey);
            const resolvedValue = getTokenValue(tokens, {...token, type: token.type || 'fontWeight' });
            if (resolvedValue) {
              cssParts.push(`  --theme-font-weight-${varName}: ${resolvedValue};`);
              allProcessedTokensForUtilities['font-weight'][varName] = resolvedValue;
            }
          }
        }
      }
      // Theme Spacing (e.g., page.margins, site.margins)
      const spacingSections = ['page', 'site'];
      for (const sectionName of spacingSections) {
        if (themeData[sectionName] && themeData[sectionName].margins) {
          for (const [marginName, token] of Object.entries(themeData[sectionName].margins)) {
            if (token && token.value && token.type === 'dimension') {
              const varName = toKebabCase(`${sectionName}-margin-${marginName}`);
              const resolvedValue = getTokenValue(tokens, {...token, type: token.type || 'dimension' });
              if (resolvedValue) {
                cssParts.push(`  --theme-spacing-${varName}: ${resolvedValue};`);
                allProcessedTokensForUtilities.spacing[`${sectionName}-margin-${marginName}`] = resolvedValue;
              }
            }
          }
        }
      }
       // Theme Border Radius
      if (themeData['border-radius']) {
        for (const [radiusKey, token] of Object.entries(themeData['border-radius'])) {
            if (token && token.value && token.type === 'dimension') {
                const varName = toKebabCase(`radius-${radiusKey}`);
                 const resolvedValue = getTokenValue(tokens, {...token, type: token.type || 'dimension' });
                if (resolvedValue) {
                    cssParts.push(`  --theme-${varName}: ${resolvedValue};`);
                }
            }
        }
      }
      // Process component tokens if they are meant to be global CSS vars
      if (themeData['component']) {
        // This part would need more specific logic based on how component tokens should map to global CSS vars
        // For now, we're focusing on the primary token types (color, font, spacing)
      }
    }
  }
  cssParts.push('}');

  // Utility classes generation
  cssParts.push('\n/* Color Utility Classes */');
  for (const [key, value] of Object.entries(allProcessedTokensForUtilities.color)) {
    // Check if this key corresponds to a theme definition
    let isThemeColor = false;
    for (const setName in tokens) {
        if (setName.startsWith('$')) continue;
        const themeColors = tokens[setName]?.['--theme']?.color;
        if (themeColors) {
            if (themeColors[key]) { // Direct match like 'ink'
                isThemeColor = true; break;
            }
            const keyParts = key.split('-');
            if (keyParts.length > 1 && themeColors[keyParts[0]] && themeColors[keyParts[0]][key.substring(keyParts[0].length + 1)]) {
                 isThemeColor = true; break;
            }
        }
    }
    const varNamePrefix = isThemeColor ? 'theme-color' : 'color';
    const cssVarName = `--${varNamePrefix}-${toKebabCase(key)}`;
    cssParts.push(`.${toKebabCase(`color-${key}`)} { color: var(${cssVarName}); }`);
    cssParts.push(`.bg-${toKebabCase(key)} { background-color: var(${cssVarName}); }`);
  }

  cssParts.push('\n/* Font Size Utility Classes */');
  for (const [key, value] of Object.entries(allProcessedTokensForUtilities['font-size'])) {
    let isThemeFontSize = false;
    for (const setName in tokens) {
        if (setName.startsWith('$')) continue;
        const themeFontSizes = tokens[setName]?.['--theme']?.['font-size'];
        if (themeFontSizes) {
            const keyParts = key.split('-'); // key might be 'reading-sm' or 'body-md'
            if (keyParts.length > 1 && themeFontSizes[keyParts[0]] && themeFontSizes[keyParts[0]][keyParts.slice(1).join('-')]) {
                isThemeFontSize = true; break;
            }
        }
    }
    const varNamePrefix = isThemeFontSize ? 'theme-font-size' : 'font-size';
    const cssVarName = `--${varNamePrefix}-${toKebabCase(key)}`;
    cssParts.push(`.font-size-${toKebabCase(key)} { font-size: var(${cssVarName}); }`);
  }
  
  cssParts.push('\n/* Font Weight Utility Classes */');
  for (const [key, value] of Object.entries(allProcessedTokensForUtilities['font-weight'])) {
     let isThemeFontWeight = false;
     for (const setName in tokens) {
        if (setName.startsWith('$')) continue;
        const themeFontWeights = tokens[setName]?.['--theme']?.['font-weight'];
        if (themeFontWeights && themeFontWeights[key]) {
            isThemeFontWeight = true; break;
        }
     }
    const varNamePrefix = isThemeFontWeight ? 'theme-font-weight' : 'font-weight';
    const cssVarName = `--${varNamePrefix}-${toKebabCase(key)}`;
    cssParts.push(`.font-weight-${toKebabCase(key)} { font-weight: var(${cssVarName}); }`);
  }

  cssParts.push('\n/* Spacing Utility Classes */');
  for (const [key, value] of Object.entries(allProcessedTokensForUtilities.spacing)) {
    const isThemeSpacing = key.includes('-margin-') || key.includes('-padding-') || key.includes('breakpoint') || key.includes('site') || key.includes('mobile');
    let cssVarName;
    if (isThemeSpacing) {
        cssVarName = `--theme-spacing-${toKebabCase(key)}`;
    } else {
        cssVarName = `--spacing-${key}`; // System spacing keys are typically simple like "1", "05", "1px"
    }
    cssParts.push(`.margin-${toKebabCase(key)} { margin: var(${cssVarName}); }`);
    cssParts.push(`.padding-${toKebabCase(key)} { padding: var(${cssVarName}); }`);
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