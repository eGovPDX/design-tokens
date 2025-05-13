/**
 * USWDS Token Resolver
 * 
 * This module handles resolution of USWDS design tokens for typography and colors.
 */

/**
 * Clean a token path by removing prefixes and normalizing
 * 
 * @param {string} path - The token path to clean
 * @returns {string} - The cleaned path
 */
function cleanTokenPath(path) {
  if (!path) return '';
  
  // Handle various prefixes
  const cleanPath = path
    .replace(/^[!-]*/, '')  // Remove !- prefix
    .replace(/^--/, '')     // Remove -- prefix
    .replace(/^usa\./, '')  // Remove usa. prefix
    .toLowerCase();         // Convert to lowercase
  
  // Split into parts and clean each part
  const parts = cleanPath.split('.');
  if (parts.length > 1) {
    // For color tokens, we need to handle the variant part
    if (parts[0] === 'color') {
      const colorName = parts[1];
      const variant = parts[2];
      if (variant && variant.endsWith('v')) {
        // Handle vivid variants
        return `${colorName}.${variant}`;
      }
      return `${colorName}.${variant || '50'}`;
    }
  }
  
  return cleanPath;
}

/**
 * Get a theme value from the tokens object
 * 
 * @param {Object} tokens - The tokens object
 * @param {string} themePath - The theme path to resolve
 * @returns {string|null} - The resolved theme value or null if not found
 */
function getThemeValue(tokens, themePath) {
  const parts = themePath.split('.');
  
  // Try themes in order of precedence
  const themeSections = [
    'USWDS Theme/Project theme',
    'USWDS Theme/Default',
    'USWDS Theme/PGOV'
  ];
  
  for (const section of themeSections) {
    let value = tokens[section];
    
    // Navigate through the path
    for (const part of parts) {
      value = value?.[part];
      if (!value) break;
    }
    
    // If we found a value object with a value property, return it
    if (value?.value) {
      return value.value;
    }
  }
  
  return null;
}

/**
 * Get a USWDS font family value
 * 
 * @param {Object} tokens - The tokens object
 * @param {string} type - The font type (ui, reading, body, heading, etc.)
 * @returns {string|null} - The resolved font family or null if not found
 */
export function getUSWDSFontFamily(tokens, type) {
  const themeSections = [
    'USWDS Theme/Project theme',
    'USWDS Theme/Default',
    'USWDS Theme/PGOV'
  ];

  const cleanType = cleanTokenPath(type);

  for (const section of themeSections) {
    const theme = tokens[section]?.['#-theme'];
    if (!theme) continue;

    // Try to find the font family in the theme
    const fontFamily = theme['font-family']?.[cleanType]?.value;
    if (fontFamily) {
      // If it's a reference to another token, resolve it
      if (typeof fontFamily === 'string' && fontFamily.includes('{')) {
        const match = fontFamily.match(/\{([^}]+)\}/);
        if (match) {
          const referencedType = cleanTokenPath(match[1]);
          return getUSWDSFontFamily(tokens, referencedType);
        }
      }
      return fontFamily;
    }
  }

  return null;
}

/**
 * Get a USWDS font size value
 * 
 * @param {Object} tokens - The tokens object
 * @param {string} type - The font type (reading, display, mono, proto)
 * @param {string} size - The size variant (3xs, 2xs, xs, sm, md, lg, xl, 2xl, 3xl)
 * @returns {string|null} - The resolved font size or null if not found
 */
export function getUSWDSTypography(tokens, type, size) {
  const themeSections = [
    'USWDS Theme/Project theme',
    'USWDS Theme/Default',
    'USWDS Theme/PGOV'
  ];

  // Map size names to USWDS size numbers
  const sizeMap = {
    '3xs': '1',
    '2xs': '2',
    'xs': '3',
    'sm': '4',
    'md': '5',
    'lg': '6',
    'xl': '9',
    '2xl': '12',
    '3xl': '14'
  };

  // Map for font size defaults based on type and size
  const fontSizeDefaults = {
    'reading': {
      '3xs': '0.75rem',  // 12px
      '2xs': '0.875rem', // 14px
      'xs': '1rem',      // 16px
      'sm': '1.125rem',  // 18px
      'md': '1.25rem',   // 20px
      'lg': '1.5rem',    // 24px
      'xl': '1.75rem',   // 28px
      '2xl': '2rem',     // 32px
      '3xl': '2.5rem'    // 40px
    },
    'display': {
      '3xs': '1.75rem',  // 28px
      '2xs': '2rem',     // 32px
      'xs': '2.5rem',    // 40px
      'sm': '3rem',      // 48px
      'md': '3.5rem',    // 56px
      'lg': '4rem',      // 64px
      'xl': '4.5rem',    // 72px
      '2xl': '5rem',     // 80px
      '3xl': '6rem'      // 96px
    },
    'mono': {
      '3xs': '0.75rem',  // 12px
      '2xs': '0.875rem', // 14px
      'xs': '1rem',      // 16px
      'sm': '1.125rem',  // 18px
      'md': '1.25rem',   // 20px
      'lg': '1.5rem',    // 24px
      'xl': '1.75rem',   // 28px
      '2xl': '2rem',     // 32px
      '3xl': '2.5rem'    // 40px
    },
    'proto': {
      '3xs': '0.75rem',  // 12px
      '2xs': '0.875rem', // 14px
      'xs': '1rem',      // 16px
      'sm': '1.125rem',  // 18px
      'md': '1.25rem',   // 20px
      'lg': '1.5rem',    // 24px
      'xl': '1.75rem',   // 28px
      '2xl': '2rem',     // 32px
      '3xl': '2.5rem'    // 40px
    }
  };

  if (!type || !size) {
    return '1rem'; // Default fallback
  }

  const cleanType = cleanTokenPath(type);
  const uswdsSize = sizeMap[size] || size;

  for (const section of themeSections) {
    const theme = tokens[section]?.['#-theme'];
    if (!theme) continue;

    // Try to find the font size in the theme
    const fontSize = theme['font-size']?.[cleanType]?.[uswdsSize]?.value;
    if (fontSize) {
      // If it's a reference to another token, resolve it
      if (typeof fontSize === 'string' && fontSize.includes('{')) {
        const match = fontSize.match(/\{([^}]+)\}/);
        if (match) {
          const [referencedType, referencedSize] = match[1].split('.').slice(-2);
          return getUSWDSTypography(tokens, cleanTokenPath(referencedType), referencedSize);
        }
      } 
      
      // Check if it's a direct size (e.g., "12px" or "1.25rem")
      if (typeof fontSize === 'string' && (fontSize.includes('px') || fontSize.includes('rem') || fontSize.includes('em'))) {
        return fontSize;
      }
    }
  }

  // If we couldn't find a token value, return a sensible default
  return fontSizeDefaults[cleanType]?.[size] || '1rem';
}

/**
 * Get a USWDS font weight value
 * 
 * @param {Object} tokens - The tokens object
 * @param {string} weight - The weight name (thin, light, normal, medium, semibold, bold, heavy)
 * @returns {string|null} - The resolved font weight or null if not found
 */
export function getUSWDSFontWeight(tokens, weight) {
  const themeSections = [
    'USWDS Theme/Project theme',
    'USWDS Theme/Default',
    'USWDS Theme/PGOV'
  ];

  // Map weight names to USWDS weight numbers
  const weightMap = {
    'thin': '100',
    'light': '300',
    'normal': '400',
    'medium': '500',
    'semibold': '600',
    'bold': '700',
    'heavy': '900'
  };

  const cleanWeight = cleanTokenPath(weight);
  const uswdsWeight = weightMap[cleanWeight] || cleanWeight;

  for (const section of themeSections) {
    const theme = tokens[section]?.['#-theme'];
    if (!theme) continue;

    // Try to find the font weight in the theme
    const fontWeight = theme['font-weight']?.[uswdsWeight]?.value;
    if (fontWeight) {
      // If it's a reference to another token, resolve it
      if (typeof fontWeight === 'string' && fontWeight.includes('{')) {
        const match = fontWeight.match(/\{([^}]+)\}/);
        if (match) {
          const referencedWeight = cleanTokenPath(match[1]);
          return getUSWDSFontWeight(tokens, referencedWeight);
        }
      }
      return weightMap[fontWeight.toLowerCase()] || fontWeight;
    }
  }

  return weightMap[cleanWeight] || null;
}

/**
 * Get a USWDS color value
 * 
 * @param {Object} tokens - The tokens object
 * @param {string} colorPath - The full color token path (e.g. "!-usa.color.gray.5" or "usa.color.gray.50")
 * @returns {string|null} - The resolved color value or null if not found
 */
export function getUSWDSColor(tokens, colorPath) {
  if (!colorPath || typeof colorPath !== 'string') return null;
  
  // If the path is already a hex/rgb value, return it directly
  if (colorPath.startsWith('#') || colorPath.startsWith('rgb')) {
    return colorPath;
  }

  // Handle direct theme references if they slip through to here (though resolveAlias should handle most)
  if (colorPath.startsWith('{--theme')) {
    const resolved = resolveAlias(colorPath, tokens, new Set()); // Use resolveAlias from cssTransformer
    return resolved.error ? null : resolved.value;
  }

  // Normalize the input colorPath: remove potential --usa prefix and ensure lowercase
  const normalizedPath = colorPath.replace(/^--usa\.color\.|^usa\.color\.|^color\./i, '').toLowerCase();
  const parts = normalizedPath.split('.');
  
  const colorName = parts[0];
  const variant = parts.length > 1 ? parts[1] : '50'; // Default to 50 if no variant

  // Access the system colors from the "Color" top-level set
  const colorSet = tokens?.Color?.['--usa']?.color;
  if (colorSet && colorSet[colorName] && colorSet[colorName][variant] && colorSet[colorName][variant].value) {
    let foundValue = colorSet[colorName][variant].value;
    // If this value is an alias itself, resolve it (within the context of all tokens)
    if (typeof foundValue === 'string' && foundValue.includes('{')) {
        const resolved = resolveAlias(foundValue, tokens, new Set()); // Use resolveAlias
        return resolved.error ? getFallbackColor(colorPath) : resolved.value;
    }
    return foundValue; // Return direct primitive value
  }

  // Fallback to direct USWDS color map if direct lookup fails (should be less needed now)
  const uswdsColorMap = {
    'base': {
      'lightest': '#F0F0F0',   // gray-5
      'lighter': '#E6E6E6',    // gray-10
      'light': '#A6A6A6',      // gray-30
      'medium': '#757575',     // gray-50
      'dark': '#454545',       // gray-60
      'darker': '#1F1F1F',     // gray-80
      'darkest': '#1A1A1A'     // gray-90
    },
    'primary': {
      'lightest': '#E8F1FA',   // blue-warm-5
      'lighter': '#C5DCEF',    // blue-warm-20
      'light': '#4A89DA',      // blue-warm-30v
      'medium': '#2E5C9F',     // blue-warm-50
      'vivid': '#0066CC',      // blue-warm-50v
      'dark': '#1A4B8C',       // blue-warm-60v
      'darker': '#0D3875',     // blue-warm-70v
      'darkest': '#062657'     // blue-warm-80
    },
    'secondary': {
      'lightest': '#FFF5E6',   // gold-5
      'lighter': '#FFE4C2',    // gold-10
      'light': '#FFA01C',      // gold-30
      'medium': '#996B00',     // gold-50
      'vivid': '#FFB300',      // gold-30v
      'dark': '#805700',       // gold-60
      'darker': '#664400',     // gold-70
      'darkest': '#4D3300'     // gold-80
    },
    'accent-cool': {
      'lightest': '#E7F6F8',   // mint-5v
      'lighter': '#B3E5EC',    // mint-20
      'light': '#00BDE3',      // mint-30
      'medium': '#009EC1',     // mint-50
      'vivid': '#00A5DB',      // mint-30v
      'dark': '#0081A1',       // mint-60
      'darker': '#006180',     // mint-70
      'darkest': '#003D54'     // mint-80
    },
    'accent-warm': {
      'lightest': '#F7F5F9',   // indigo-5
      'lighter': '#E6E1ED',    // indigo-10
      'light': '#9B8DB7',      // indigo-40v
      'medium': '#7C6B99',     // indigo-50
      'vivid': '#6B4DE0',      // indigo-warm-50v
      'dark': '#5E4F7D',       // indigo-60v
      'darker': '#3F3361',     // indigo-70v
      'darkest': '#251B45'     // indigo-80
    },
    'info': {
      'lightest': '#E7F6F8',   // cyan-5
      'lighter': '#B3E5EC',    // cyan-20
      'light': '#00BDE3',      // cyan-30v
      'medium': '#00A5DB',     // cyan-50v
      'dark': '#0081A1',       // cyan-60v
      'darker': '#006180',     // cyan-70
      'darkest': '#003D54'     // cyan-80
    },
    'error': {
      'lightest': '#F7BABA',   // red-5v
      'lighter': '#F2938C',    // red-20
      'light': '#E31C3D',      // red-30v
      'medium': '#CD2026',     // red-50
      'dark': '#B31E22',       // red-60
      'darker': '#981B1E',     // red-70
      'darkest': '#7D1618'     // red-80
    },
    'warning': {
      'lightest': '#FFF0E0',   // orange-5
      'lighter': '#F7BCA2',    // orange-20
      'light': '#FF580A',      // orange-30v
      'medium': '#DD580C',     // orange-50
      'dark': '#B64A0A',       // orange-60
      'darker': '#8C3900',     // orange-70
      'darkest': '#63300F'     // orange-80
    },
    'success': {
      'lightest': '#ECF3EC',   // green-5
      'lighter': '#B7E1B9',    // green-20
      'light': '#21C834',      // green-30v
      'medium': '#008817',     // green-50
      'dark': '#216E1F',       // green-60
      'darker': '#154C21',     // green-70
      'darkest': '#0D351E'     // green-80
    },
    'disabled': {
      'lightest': '#F3F3F3',   // gray-5
      'lighter': '#E6E6E6',    // gray-10
      'light': '#C1C1C1',      // gray-30
      'medium': '#919191',     // gray-50
      'dark': '#6E6E6E',       // gray-60
      'darker': '#3D3D3D',     // gray-70
      'darkest': '#1B1B1B'     // gray-80
    }
  };
  
  // Handle colors with specific name patterns
  if (colorName === 'gray') {
    // Map gray values to hex
    const grayMap = {
      '5': '#F0F0F0',
      '10': '#E6E6E6',
      '20': '#C9C9C9',
      '30': '#A6A6A6',
      '40': '#919191',
      '50': '#757575',
      '60': '#454545',
      '70': '#3D3D3D',
      '80': '#1F1F1F',
      '90': '#1A1A1A'
    };
    return grayMap[variant] || null;
  } else if (colorName === 'blue-warm') {
    // Map blue-warm values to hex
    const blueWarmMap = {
      '5': '#E8F1FA',
      '10': '#DAE9F7',
      '20': '#C5DCEF',
      '30': '#9BBFE3',
      '40': '#6694D1',
      '50': '#2E5C9F',
      '60': '#1A4B8C',
      '70': '#0D3875',
      '80': '#062657',
      '90': '#01193F',
      '5v': '#E8F1FA',
      '10v': '#DAE9F7',
      '20v': '#C5DCEF',
      '30v': '#4A89DA',
      '40v': '#2672DE',
      '50v': '#0066CC',
      '60v': '#1A4B8C',
      '70v': '#0D3875',
      '80v': '#062657'
    };
    return blueWarmMap[variant] || null;
  } else if (colorName === 'indigo' || colorName === 'indigo-warm') {
    // Map indigo/indigo-warm values to hex
    const indigoMap = {
      '5': '#F7F5F9',
      '10': '#E6E1ED',
      '20': '#CFC8D9',
      '30': '#B8B0C9',
      '40': '#A195B9',
      '50': '#7C6B99',
      '60': '#5E4F7D',
      '70': '#3F3361',
      '80': '#251B45',
      '90': '#14102B',
      '5v': '#F7F5F9',
      '10v': '#E6E1ED',
      '20v': '#CFC8D9',
      '30v': '#B8B0C9',
      '40v': '#9B8DB7',
      '50v': '#6B4DE0',
      '60v': '#5E4F7D',
      '70v': '#3F3361',
      '80v': '#251B45'
    };
    
    // Special case for indigo-warm with fallback to indigo
    if (colorName === 'indigo-warm' && variant === '50v') {
      return '#6B4DE0';
    }
    
    return indigoMap[variant] || null;
  }
  
  // Try to get color from standard semantic color map
  if (uswdsColorMap[colorName] && uswdsColorMap[colorName][variant]) {
    return uswdsColorMap[colorName][variant];
  }
  
  // If we're looking for a vivid variant, try the base variant with 'vivid' suffix
  if (variant.endsWith('v') && uswdsColorMap[colorName] && uswdsColorMap[colorName]['vivid']) {
    return uswdsColorMap[colorName]['vivid'];
  }
  
  // Fallback to matching indigo values for accent-warm if needed
  if (colorName === 'accent-warm') {
    const accentWarmMap = {
      'lightest': '#F7F5F9',   // indigo-5
      'lighter': '#E6E1ED',    // indigo-10
      'light': '#9B8DB7',      // indigo-40v
      'medium': '#7C6B99',     // indigo-50
      'vivid': '#6B4DE0',      // indigo-warm-50v
      'dark': '#5E4F7D',       // indigo-60v
      'darker': '#3F3361',     // indigo-70v
      'darkest': '#251B45'     // indigo-80
    };
    return accentWarmMap[variant] || null;
  }
  
  // Final fallback for unresolved colors
  return getFallbackColor(colorPath);
}

/**
 * Corrected and consolidated getUSWDSSpacing function
 * 
 * @param {Object} tokens - The tokens object
 * @param {string} spacingPath - The spacing token path (e.g. "usa.spacing.4" or "usa.spacing.desktop")
 * @returns {string|null} - The resolved spacing value or null if not found
 */
export function getUSWDSSpacing(tokens, spacingPath) {
  if (!spacingPath || typeof spacingPath !== 'string') return null;
  // If it's already a primitive value with a unit, return it.
  if (spacingPath.includes('px') || spacingPath.includes('rem') || spacingPath.includes('em') || spacingPath.includes('%')) return spacingPath;

  const normalizedPath = spacingPath.replace(/^--usa\.spacing\.|^usa\.spacing\.|^spacing\./i, '').toLowerCase();
  const sizeKey = normalizedPath;

  // 1. Prefer direct lookup from Spacing.--usa.spacing (system tokens)
  const systemSpacingSet = tokens?.Spacing?.['--usa']?.spacing;
  if (systemSpacingSet && systemSpacingSet[sizeKey] && typeof systemSpacingSet[sizeKey].value !== 'undefined') {
    let foundValue = systemSpacingSet[sizeKey].value;
    if (typeof foundValue === 'string' && foundValue.includes('{')) {
        const resolved = resolveAlias(foundValue, tokens, new Set()); 
        return resolved.error ? getFallbackValueForPath(spacingPath, 'spacing') : resolved.value;
    }
    return foundValue;
  }
  
  // 2. Fallback to USWDS theme settings if direct system Spacing set lookup fails or doesn't exist
  const themeSections = [
    'USWDS Theme/Project theme',
    'USWDS Theme/Default',
    'USWDS Theme/PGOV'
  ];
  for (const section of themeSections) {
    const themeSpacing = tokens[section]?.['--theme']?.spacing; 
    if (themeSpacing && themeSpacing[sizeKey] && typeof themeSpacing[sizeKey].value !== 'undefined') {
      let foundValue = themeSpacing[sizeKey].value;
      if (typeof foundValue === 'string' && foundValue.includes('{')) {
        const resolved = resolveAlias(foundValue, tokens, new Set());
        return resolved.error ? getFallbackValueForPath(spacingPath, 'spacing') : resolved.value;
      }
      return foundValue;
    }
    // Also check for spacing within component-level theme settings if applicable (more complex)
    // e.g., tokens[section]?.['--theme']?.component?.button?.paddingX?.value
    // This would require more specific path handling if spacingPath refers to such a token.
  }

  // 3. If it's a number without a unit, and it's a spacing type, default to px.
  if (!isNaN(parseFloat(normalizedPath)) && isFinite(normalizedPath)) {
      return normalizedPath + 'px';
  }

  return getFallbackValueForPath(spacingPath, 'spacing'); 
}

// Ensure other getUSWDS... functions are defined ONCE and correctly.
// getUSWDSColor, getUSWDSTypography, getUSWDSFontFamily, getUSWDSFontWeight
// These should have logic similar to getUSWDSSpacing: 
// - direct primitive check
// - lookup in their respective system token set (e.g., Color.--usa.color for getUSWDSColor)
// - resolve aliases found during lookup using resolveAlias
// - then potentially theme fallbacks if relevant for that token type
// - finally, specific function fallbacks (e.g., getFallbackColor)

// Helper functions (defined ONCE)
// IMPORTANT: resolveAlias is defined in cssTransformer.js. 
// For this resolver to work correctly when called from cssTransformer, 
// resolveAlias must be in scope. This is best handled by importing it 
// or passing it as an argument if these were classes/modules.
// For this tool's execution, we'll assume cssTransformer makes it available.

let resolveAlias = (valueWithBrace, tokens, visited) => {
    // console.warn("[uswdsTokenResolver] resolveAlias called, ensure it's the real one from cssTransformer.");
    const match = valueWithBrace.match(/\{([^}]+)\}/);
    if (match) return { value: match[1], error: 'Dummy resolution in uswdsTokenResolver' }; 
    return { value: valueWithBrace };
};

if (typeof global !== 'undefined' && global.resolveAliasForResolver) { // Check if cssTransformer patched it
    resolveAlias = global.resolveAliasForResolver;
} else if (typeof resolveAliasFromCssTransformer !== 'undefined'){ // Hypothetical import
    resolveAlias = resolveAliasFromCssTransformer;
}

function determineTokenType(path) {
  if (!path || typeof path !== 'string') return 'unknown';
  const cleanPath = path.toLowerCase();
  if (cleanPath.includes('color')) return 'color';
  if (cleanPath.includes('font-size') || cleanPath.includes('typography')) return 'fontSize';
  if (cleanPath.includes('spacing') || cleanPath.includes('margin') || cleanPath.includes('padding')) return 'spacing';
  if (cleanPath.includes('font-weight')) return 'fontWeight';
  if (cleanPath.includes('font-family')) return 'fontFamily';
  if (cleanPath.includes('radius') || cleanPath.includes('border-radius')) return 'dimension'; // Treat radius as dimension
  return 'unknown';
}

function getFallbackValueForPath(pathString, type) {
    // console.warn(`[Fallback] Path: "${pathString}", Type: "${type}"`);
    switch (type) {
        case 'color': return '#FF00FF'; 
        case 'fontSize': return '1em';
        case 'spacing': return '0px';
        case 'fontWeight': return '400';
        case 'fontFamily': return 'sans-serif';
        case 'dimension': return '0px'; // Generic dimension fallback
        default: return pathString; 
    }
}

function getFallbackColor(value) {
  return '#EE00EE'; 
}

function getFallbackFontFamily(value) { return 'sans-serif'; }
function getFallbackFontWeight(value) { return '400'; }
function getFallbackTypography(type, size) { return '1em'; }

// Ensure original getUSWDSColor, getUSWDSTypography, etc. are correctly defined ONCE without re-declarations of export
// The edit will focus on ensuring getUSWDSSpacing is defined once and correctly, and other helpers are not duplicated. 