# Figma to CSS Design Tokens System

A system that pulls design tokens from the Figma API into a GitHub repository and transforms them into CSS files.

## Features

- Authenticates with the Figma API using personal access tokens
- Extracts design tokens (colors, typography, spacing) from specific nodes in Figma files
- Merges tokens from multiple files into a single token set
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

3. Create environment configuration files:
   - For development: Copy `.env.development.example` to `.env.development`
   - For production: Copy `.env.production.example` to `.env.production`

   The environment files should contain the following variables:
   ```
   # Figma API credentials
   FIGMA_ACCESS_TOKEN=your_figma_personal_access_token
   FIGMA_FILE_KEYS=your_figma_file_key

   # Figma Node IDs for token extraction
   FIGMA_TYPOGRAPHY_NODE_ID=115-2
   FIGMA_COLOR_NODE_ID=165-2427
   FIGMA_SPACING_NODE_ID=351-581

   # GitHub credentials
   GITHUB_TOKEN=your_github_personal_access_token

   # Repository information
   GITHUB_OWNER=eGovPDX
   GITHUB_REPO=design-tokens
   GITHUB_BRANCH=main
   ```

### Finding Node IDs in Figma

To find the node IDs for your tokens:

1. Open your Figma file
2. Select the frame or component containing your tokens
3. Look at the URL in your browser - the node ID will be in the format `node-id=XXX-XXX`
4. Copy the node ID and add it to your environment file

### Environment Configuration

The system supports different configurations for development and production environments:

- `.env.development`: Used for local development and testing
- `.env.production`: Used for production deployments and GitHub Actions

To switch between environments, you can use the `NODE_ENV` environment variable:
```
NODE_ENV=development node index.js
NODE_ENV=production node index.js
```

### GitHub Secrets Setup

For the GitHub Action to work, you need to add the following secrets to your repository:

1. Go to your repository settings
2. Navigate to Secrets > Actions
3. Add the following secrets:
   - `FIGMA_ACCESS_TOKEN`: Your Figma personal access token
   - `GITHUB_TOKEN`: Your GitHub personal access token with repo scope
   - `FIGMA_FILE_KEYS`: Your Figma file key
   - `FIGMA_TYPOGRAPHY_NODE_ID`: Node ID for typography tokens
   - `FIGMA_COLOR_NODE_ID`: Node ID for color tokens
   - `FIGMA_SPACING_NODE_ID`: Node ID for spacing tokens

## Usage

### Manual Execution

Run the script manually to extract tokens from Figma and save them locally:

```
# For development
NODE_ENV=development node index.js --file-keys YOUR_FIGMA_FILE_KEY --output-dir ./output

# For production
NODE_ENV=production node index.js --file-keys YOUR_FIGMA_FILE_KEY --output-dir ./output
```

### GitHub Action

The included GitHub Action will:

1. Run automatically once per day
2. Check if design tokens have changed in any of the Figma files
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
- `.env.development`: Development environment configuration
- `.env.production`: Production environment configuration

## Output Format

### JSON Structure

The extracted tokens are saved in JSON format with the following structure:

```json
{
  "colors": {
    "primary": "#000000",
    "secondary": "#ffffff"
  },
  "typography": {
    "heading-1": {
      "fontFamily": "Inter",
      "fontSize": 32,
      "fontWeight": 700
    }
  },
  "spacing": {
    "small": 8,
    "medium": 16,
    "large": 24
  }
}
```

Tokens from multiple Figma files are merged into a single token set. If there are duplicate token names across files, the last file's tokens will take precedence.

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
- Check that you're using the correct environment file for your context

### Missing Tokens

- Verify that the node IDs in your environment file are correct
- Check that the nodes contain the expected token types
- Ensure your Figma file is structured properly with named styles
- For colors, ensure they are applied as fill styles
- For typography, ensure they are applied as text styles
- For spacing, ensure frame names include "spacing" or "space-"

## License

MIT
