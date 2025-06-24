function resolveAlias(path, tokens, visited = new Set()) {
  if (visited.has(path)) {
    console.warn(`Circular dependency detected: ${[...visited, path].join(' -> ')}`);
    return null; // Or return a fallback color
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

function flattenTokens(obj, prefix = '') {
  const result = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newPrefix = prefix ? `${prefix}-${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && '$value' in obj[key]) {
        result[newPrefix] = obj[key].$value;
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        Object.assign(result, flattenTokens(obj[key], newPrefix));
      }
    }
  }
  return result;
}

export function transformToCSS(tokens) {
  const flattened = flattenTokens(tokens);
  const resolvedTokens = {};
  let cssVariables = ':root {\n';
  let utilityClasses = '\n';

  // First, resolve all aliases
  for (const name in flattened) {
    let value = flattened[name];
    if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
      const aliasPath = value.slice(1, -1);
      resolvedTokens[name] = resolveAlias(aliasPath, tokens);
    } else {
      resolvedTokens[name] = value;
    }
  }

  // Then, build CSS from resolved tokens
  for (const name in resolvedTokens) {
    const value = resolvedTokens[name];
    if (value !== null) {
      const cssVarName = `--${name}`;
      cssVariables += `  ${cssVarName}: ${value};\n`;
      
      const className = name.replace(/\./g, '-');
      // Basic utility classes for color
      if (name.toLowerCase().includes('color')) {
        utilityClasses += `.color-${className} { color: var(${cssVarName}); }\n`;
        utilityClasses += `.bg-${className} { background-color: var(${cssVarName}); }\n`;
      }
    }
  }

  cssVariables += '}\n';
  return cssVariables + utilityClasses;
} 