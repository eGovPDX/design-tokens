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
        } else {
          resolvedTokens[newPrefix] = value;
        }
      } else if (typeof currentValue === 'object' && currentValue !== null) {
        recurse(currentValue, newPrefix);
      }
    }
  }

  recurse(tokens);
  return resolvedTokens;
}

export function transformToCSS(tokens) {
  const resolvedTokens = processTokens(tokens);
  const cssLines = [':root {'];

  for (const name in resolvedTokens) {
    const value = resolvedTokens[name];
    if (value !== null) {
      const cssVarName = `--${name.replace(/\s+/g, '-').toLowerCase()}`;
      cssLines.push(`  ${cssVarName}: ${value};`);
    }
  }

  cssLines.push('}');
  return cssLines;
} 