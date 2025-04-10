# Figma to CSS Design Tokens System

A system that pulls design tokens from the Figma API into a GitHub repository and transforms them into CSS files.

## Features

- Authenticates with the Figma API using personal access tokens
- Extracts design tokens (colors, typography, spacing) from Figma files
- Transforms tokens into CSS variables with utility classes
- Integrates with GitHub repositories for version control
- Automated synchronization via GitHub Actions (daily or on-demand)
- Detects changes to avoid unnecessary updates

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- Figma account with personal access token
- GitHub repository with access token

### Installation

1. Clone this repository:
   ```
   git clone https://github.com/eGovPDX/design-tokens.git
   cd design-tokens
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   FIGMA_ACCESS_TOKEN=your_figma_personal_access_token
   GITHUB_TOKEN=your_github_personal_access_token
   FIGMA_FILE_KEY=your_figma_file_key
   ```

### GitHub Secrets Setup

For the GitHub Action to work, you need to add the following secrets to your repository:

1. Go to your repository settings
2. Navigate to Secrets > Actions
3. Add the following secrets:
   - `FIGMA_ACCESS_TOKEN`: Your Figma personal access token
   - `GITHUB_TOKEN`: Your GitHub personal access token with repo scope
   - `FIGMA_FILE_KEY`: The key of your Figma file (found in the URL)

## Usage

### Manual Execution

Run the script manually to extract tokens from Figma and save them locally:

```
node index.js --file-key YOUR_FIGMA_FILE_KEY --output-dir ./output
```

### GitHub Action

The included GitHub Action will:

1. Run automatically once per day
2. Check if design tokens have changed in Figma
3. Update the repository if changes are detected
4. Create a pull request (for scheduled runs) or commit directly (for manual triggers)

You can also trigger the workflow manually from the Actions tab in your GitHub repository.

## File Structure

- `src/figmaAuth.js`: Handles authentication with the Figma API
- `src/figmaTokenExtractor.js`: Extracts design tokens from Figma files
- `src/tokenTransformer.js`: Transforms tokens into CSS variables
- `src/githubClient.js`: Handles GitHub repository operations
- `src/figmaToGithub.js`: Integrates Figma extraction with GitHub updates
- `index.js`: Main script for local execution
- `.github/workflows/sync-design-tokens.yml`: GitHub Action workflow

## Output Format

### JSON Structure

The extracted tokens are saved in JSON format with the following structure:

```json
{
  "colors": {
    "Primary/Blue": "#0066cc",
    "Secondary/Green": "#00cc66"
  },
  "typography": {
    "Heading/H1": {
      "fontFamily": "Roboto",
      "fontSize": 32,
      "fontWeight": 700,
      "lineHeight": 1.2
    }
  },
  "spacing": {
    "Spacing/Small": 8,
    "Spacing/Medium": 16
  }
}
```

### CSS Variables

The tokens are transformed into CSS variables:

```css
:root {
  /* Colors */
  --color-primary-blue: #0066cc;
  --color-secondary-green: #00cc66;

  /* Typography */
  --typography-heading-h1-font-family: Roboto;
  --typography-heading-h1-font-size: 32px;
  --typography-heading-h1-font-weight: 700;
  --typography-heading-h1-line-height: 1.2;

  /* Spacing */
  --spacing-small: 8px;
  --spacing-medium: 16px;
}

/* Utility classes are also generated */
```

## Customization

### Token Path

You can customize the path where tokens are saved in the GitHub repository by modifying the `tokenPath` option in the `FigmaToGithub` constructor.

### CSS Output Format

Modify the `transformToCss` method in the `TokenTransformer` class to change the CSS output format.

## Troubleshooting

### Authentication Issues

- Ensure your Figma token has the correct permissions
- Verify that your GitHub token has the repo scope

### Missing Tokens

- Check that your Figma file is structured properly with named styles
- For colors, ensure they are applied as fill styles
- For typography, ensure they are applied as text styles
- For spacing, ensure frame names include "spacing" or "space-"

## License

MIT
