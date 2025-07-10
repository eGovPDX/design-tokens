function resolveAlias(path, tokens, visited = new Set()) {
  if (visited.has(path)) {
    console.warn(`Circular dependency detected: ${[...visited, path].join(' -> ')}`);
    return null;
  }
  visited.add(path);

  const pathParts = path.split('.');
  let current = tokens;
  for (const part of pathParts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      console.warn(`Could not resolve path: ${path}`);
      return null;
    }
  }

  if (current && typeof current.$value === 'string' && current.$value.startsWith('{') && current.$value.endsWith('}')) {
    const nextPath = current.$value.slice(1, -1);
    return resolveAlias(nextPath, tokens, new Set(visited));
  }
  
  return current ? current.$value : null;
}

function processTokens(tokens) {
  const resolvedTokens = {};
  const tokenReferences = {}; // Track which token references which path

  function recurse(obj, prefix = '') {
    for (const key in obj) {
      if (!obj.hasOwnProperty(key)) continue;

      const newPrefix = prefix ? `${prefix}-${key}` : key;
      const currentValue = obj[key];

      if (typeof currentValue === 'object' && currentValue !== null && '$value' in currentValue) {
        let value = currentValue.$value;
        if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
          const aliasPath = value.slice(1, -1);
          resolvedTokens[newPrefix] = resolveAlias(aliasPath, tokens);
          tokenReferences[newPrefix] = aliasPath; // Store the reference path
        } else {
          resolvedTokens[newPrefix] = value;
        }
      } else if (typeof currentValue === 'object' && currentValue !== null) {
        recurse(currentValue, newPrefix);
      }
    }
  }

  recurse(tokens);
  return { resolvedTokens, tokenReferences };
}

export function transformToCSS(tokens) {
  const { resolvedTokens, tokenReferences } = processTokens(tokens);
  const cssLines = [':root {'];
  const cssProperties = [];

  for (const name in resolvedTokens) {
    const value = resolvedTokens[name];
    if (value !== null) {
      let cssVarName = `--${name.replace(/\s+/g, '-').toLowerCase()}`;

      // Check if this is a font-size token from theme files that references an abstraction
      if ((cssVarName.startsWith('--font-size-body-') || cssVarName.startsWith('--font-size-header-')) && 
          tokenReferences[name]) {
        const referencePath = tokenReferences[name];
        
        // Extract font family from reference path (e.g., font-open-sans.abstraction.open-sans-2xl)
        const fontMatch = referencePath.match(/^font-([^.]+)\.abstraction\.([^.]+)$/);
        if (fontMatch) {
          const fontFamily = fontMatch[1]; // e.g., "open-sans"
          const abstractionName = fontMatch[2]; // e.g., "open-sans-2xl"
          
          // Reformat the CSS variable name to include font family
          if (cssVarName.startsWith('--font-size-body-')) {
            const sizeName = cssVarName.replace('--font-size-body-', '');
            cssVarName = `--font-abstraction-${fontFamily}-body-${sizeName}`;
          } else if (cssVarName.startsWith('--font-size-header-')) {
            const sizeName = cssVarName.replace('--font-size-header-', '');
            cssVarName = `--font-abstraction-${fontFamily}-header-${sizeName}`;
          }
        }
      }
      // Check if this is a font abstraction token that needs simplification
      // Pattern: --font-{family}-abstraction-{abstraction-prefix}-{variant} -> --font-abstraction-{abstraction-prefix}-{variant}
      else if (cssVarName.includes('-abstraction-')) {
        const abstractionMatch = cssVarName.match(/^--font-([^-]+(?:-[^-]+)*)-abstraction-(.+)$/);
        if (abstractionMatch) {
          const fontFamily = abstractionMatch[1]; // e.g., "open-sans" or "comic-sans-ms"
          const abstractionPart = abstractionMatch[2]; // e.g., "open-sans-2xl" or "comic-sans-2xl"
          
          // Extract the abstraction prefix and variant
          // For "open-sans-2xl", we want "open-sans" and "2xl"
          // For "comic-sans-2xl", we want "comic-sans" and "2xl"
          const abstractionTokenMatch = abstractionPart.match(/^([^-]+(?:-[^-]+)*)-([^-]+)$/);
          if (abstractionTokenMatch) {
            const abstractionPrefix = abstractionTokenMatch[1]; // e.g., "open-sans" or "comic-sans"
            const variant = abstractionTokenMatch[2]; // e.g., "2xl", "h1", etc.
            cssVarName = `--font-abstraction-${abstractionPrefix}-${variant}`;
          }
        }
      }
      // Reformat font family variables
      else if (cssVarName.match(/^--font-([a-zA-Z0-9-]+)-family$/)) {
        const fontName = cssVarName.match(/^--font-([a-zA-Z0-9-]+)-family$/)[1];
        cssVarName = `--font-family-${fontName}`;
      }

      cssProperties.push({ name: cssVarName, value: value });
    }
  }

  // Sort properties alphabetically by name
  cssProperties.sort((a, b) => a.name.localeCompare(b.name));

  // Add sorted properties to CSS lines
  for (const prop of cssProperties) {
    cssLines.push(`  ${prop.name}: ${prop.value};`);
  }

  cssLines.push('}');
  return cssLines;
} 