# Figma to CSS Design Tokens System

A system that processes design tokens from Tokens Studio for Figma and transforms them into CSS files.

## Why Tokens Studio?

This project uses the [Tokens Studio for Figma](https://tokens.studio/) plugin as the primary method for managing design tokens. Here's why:

### Figma API Limitations

The Figma API, while powerful for many use cases, has several limitations when it comes to design tokens:

1. **Incomplete Token Data**:
   - Only provides basic style information
   - Missing computed values and references
   - No support for token relationships
   - Limited metadata and documentation

2. **Missing Features**:
   - No token versioning
   - Limited support for nested tokens
   - No built-in token validation
   - Missing token usage context

3. **Data Structure Issues**:
   - Inconsistent formatting
   - Partial token sets
   - Missing style definitions
   - No support for token aliases

### Tokens Studio Advantages

Tokens Studio provides a complete solution for design token management:

1. **Complete Token System**:
   - Full token definitions
   - Computed values
   - Token relationships
   - Metadata and documentation

2. **Consistent Output**:
   - Standardized formatting
   - Complete token sets
   - Proper value handling
   - Consistent naming

3. **Better Integration**:
   - Direct GitHub integration
   - PR-based workflow
   - Change tracking
   - Version control

### Workflow

The recommended workflow is:

1. Use Tokens Studio in Figma to manage tokens
2. Push changes to GitHub via the plugin
3. Let the GitHub Action process the tokens
4. Review and merge changes

This approach ensures we have complete, consistent, and well-managed design tokens.

### GitHub Integration

#### PR Workflow

1. **Token Updates**:
   - Tokens Studio creates a PR when changes are pushed
   - PR includes the updated `design-tokens.json` file
   - GitHub Action automatically triggers on PR creation

2. **Action Processing**:
   - Action checks out the PR branch
   - Processes the token file
   - Generates CSS variables
   - Updates the PR with processed files

3. **File Management**:
   - Original `design-tokens.json` is preserved
   - Processed files are added to the PR:
     - `design_tokens.json` (processed version)
     - `design_tokens.css` (CSS variables)

#### Branch Management

1. **Branch Structure**:
   - `main`: Production-ready tokens
   - Feature branches: Created by Tokens Studio
   - No long-lived branches needed

2. **Naming Conventions**:
   - Feature branches: `tokens/description`
   - PR titles: `Update Design Tokens: Description`
   - Commit messages: `Update design tokens`

3. **Conflict Resolution**:
   - Always rebase on latest `main`
   - Resolve conflicts in Tokens Studio
   - Push resolved changes to update PR

#### Action Configuration

1. **Required Secrets**:
   ```yaml
   SLACK_WEBHOOK_URL: # For notifications
   FIGMA_ACCESS_TOKEN: # For validation
   ```

2. **Permissions**:
   ```yaml
   permissions:
     contents: write
     pull-requests: write
   ```

3. **Triggers**:
   ```yaml
   on:
     pull_request:
       branches:
         - main
       paths:
         - 'design-tokens.json'
   ```

#### Review Process

1. **PR Checklist**:
   - [ ] Token changes are valid
   - [ ] CSS generation successful
   - [ ] No conflicts with existing tokens
   - [ ] Documentation updated if needed

2. **Validation Steps**:
   - Check token counts
   - Verify CSS output
   - Review change comments
   - Test in preview if available

3. **Common Issues**:
   - Missing token references
   - Invalid token values
   - CSS generation errors
   - Merge conflicts

#### Integration Features

1. **PR Comments**:
   - Token change summary
   - Processing results
   - Validation status
   - Next steps

2. **Change Tracking**:
   - Token additions/removals
   - Value changes
   - CSS variable updates
   - Version history

3. **Rollback Process**:
   - Revert PR if needed
   - Restore previous version
   - Update Tokens Studio
   - Create new PR with fixes

#### Troubleshooting

1. **Action Failures**:
   - Check action logs
   - Verify secrets
   - Review token file
   - Test locally

2. **PR Issues**:
   - Branch conflicts
   - Permission errors
   - Processing failures
   - Validation errors

3. **Debug Steps**:
   ```bash
   # Test locally
   npm run process-tokens -- --input design-tokens.json --output ./output
   
   # Check logs
   cat output/design_tokens.json
   cat output/design_tokens.css
   ```

4. **Common Solutions**:
   - Update branch from main
   - Fix token references
   - Adjust permissions
   - Clear action cache

#### Workflow Diagrams

1. **Token Update Flow**:
   ```mermaid
   sequenceDiagram
     participant TS as Tokens Studio
     participant GH as GitHub
     participant GA as GitHub Action
     participant PR as Pull Request

     TS->>GH: Push token changes
     GH->>PR: Create PR
     PR->>GA: Trigger action
     GA->>PR: Process tokens
     GA->>PR: Add processed files
     GA->>PR: Add comment
     PR->>GH: Ready for review
   ```

2. **Branch Structure**:
   ```mermaid
   graph TD
     A[main] --> B[Feature Branch]
     B --> C[PR]
     C --> D[Processed Files]
     D --> E[Review]
     E -->|Approved| A
     E -->|Rejected| B
   ```

3. **Action Process**:
   ```mermaid
   flowchart LR
     A[PR Created] --> B[Checkout Branch]
     B --> C[Process Tokens]
     C --> D[Generate CSS]
     D --> E[Update PR]
     E --> F[Add Comment]
     F --> G[Complete]
   ```

4. **Review Process**:
   ```mermaid
   flowchart TD
     A[PR Created] --> B{Valid Tokens?}
     B -->|Yes| C{Valid CSS?}
     B -->|No| D[Fix in TS]
     C -->|Yes| E{No Conflicts?}
     C -->|No| F[Fix Processing]
     E -->|Yes| G[Approve]
     E -->|No| H[Resolve Conflicts]
     D --> A
     F --> A
     H --> A
   ```

These diagrams show:
- The sequence of events in the token update process
- How branches interact and merge
- The steps in the GitHub Action
- The review and approval workflow

## Features

- Processes design tokens from Tokens Studio output
- Transforms tokens into CSS variables with utility classes
- Integrates with GitHub repositories for version control
- Automated processing via GitHub Actions
- Detects changes to avoid unnecessary updates

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- GitHub repository
- Tokens Studio for Figma plugin

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

3. Configure GitHub repository:
   - Set up GitHub Actions secrets if needed
   - Configure Tokens Studio to push to your repository

## Usage

### Manual Processing

Process tokens from a local file:

```
npm run process-tokens -- --input design-tokens.json --output ./output
```

### GitHub Action

The included GitHub Action will:

1. Trigger when Tokens Studio creates a PR
2. Process the design tokens
3. Update the PR with processed files
4. Add a comment with processing details

## File Structure

- `src/tokenProcessor.js`: Processes design tokens from files
- `src/tokenTransformer.js`: Transforms tokens into CSS variables
- `.github/workflows/process-tokens.yml`: GitHub Action workflow
- `output/`: Directory for processed files

## Output Format

### JSON Structure

The processed tokens are saved in JSON format with the following structure:

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

You can customize the path where tokens are saved in the GitHub repository by modifying the workflow file.

### CSS Output Format

Modify the `transformToCss` method in the `TokenTransformer` class to change the CSS output format.

## Troubleshooting

### Processing Issues

- Verify that the input file is valid JSON
- Check that the file structure matches the expected format
- Ensure all required token types are present

### GitHub Action Issues

- Check workflow permissions
- Verify repository secrets
- Review action logs for errors

## License

MIT
