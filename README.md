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
2. Push changes to GitHub via the plugin to the `incoming-token-changes` branch
3. GitHub Action processes the tokens and adds the output files to your PR
4. Review and merge changes to main

This approach ensures we have complete, consistent, and well-managed design tokens.

### GitHub Integration

#### PR Workflow

1. **Token Updates**:
   - Tokens Studio creates/updates the `incoming-token-changes` branch when changes are pushed
   - PR includes the updated `design-tokens.json` file
   - GitHub Action automatically triggers on PR creation/update

2. **Action Processing**:
   - Action checks out the PR branch
   - Processes the token file
   - Generates output files:
     - CSS variables
     - Processed JSON
   - Commits the generated files back to the PR

3. **File Management**:
   - Original `design-tokens.json` is preserved
   - Processed files are added to the PR:
     - `output/design_tokens.json` (processed version)
     - `output/design_tokens.css` (CSS variables)

#### Branch Management

1. **Branch Structure**:
   - `main`: Production-ready tokens
   - `incoming-token-changes`: Dedicated branch for Tokens Studio updates
   - PRs are created from `incoming-token-changes` to `main`

2. **Naming Conventions**:
   - Main branch: `main`
   - Token updates branch: `incoming-token-changes`
   - PR titles: `Update Design Tokens: Description`
   - Commit messages: `chore: process design tokens`

3. **Conflict Resolution**:
   - Always rebase on latest `main`
   - Resolve conflicts in Tokens Studio
   - Push resolved changes to update PR

#### Action Configuration

1. **Required Secrets**:
   ```yaml
   FIGMA_ACCESS_TOKEN: # For validation
   # SLACK_WEBHOOK_URL: # For notifications (currently disabled)
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
       types: [opened, synchronize, reopened]
       paths:
         - 'design-tokens.json'
   ```

#### Review Process

1. **PR Checklist**:
   - [ ] Token changes are valid
   - [ ] Output files generated successfully
   - [ ] No conflicts with existing tokens
   - [ ] Documentation updated if needed

2. **Validation Steps**:
   - Check token changes in `design-tokens.json`
   - Verify output files are generated:
     - `output/design_tokens.css`
     - `output/design_tokens.json`
   - Review change comments
   - Test in preview if available

3. **Common Issues**:
   - Missing token references
   - Invalid token values
   - Output file generation errors
   - Merge conflicts

#### Troubleshooting

1. **Action Failures**:
   - Check action logs in GitHub
   - Verify secrets are set
   - Review token file format
   - Test locally

2. **PR Issues**:
   - Branch conflicts
   - Permission errors
   - Processing failures
   - Validation errors

3. **Debug Steps**:
   ```bash
   # Test locally
   pnpm run process-tokens -- --source file --input design-tokens.json --output ./output
   
   # Check output files
   cat output/design_tokens.json
   cat output/design_tokens.css
   ```

4. **Common Solutions**:
   - Update branch from main
   - Fix token references
   - Check file permissions
   - Clear GitHub Actions cache

## Development

### Prerequisites

- Node.js 18 or higher
- pnpm 8 or higher
- Figma account with Tokens Studio plugin

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/eGovPDX/design-tokens.git
   cd design-tokens
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your Figma token
   ```

### Usage

1. **Process Tokens**:
   ```bash
   pnpm run process-tokens -- --source file --input design-tokens.json --output ./output
   ```

2. **Output Files**:
   - `output/design_tokens.css`: CSS variables for use in your application
   - `output/design_tokens.json`: Processed JSON tokens for reference

### Token Resolution

The token resolution system supports several token formats:

1. **Color Tokens**:
   - Direct values: `#RRGGBB` or `rgba(r,g,b,a)`
   - USWDS references: `{!-usa.color.primary.vivid}` or `usa.color.base.dark`
   - Theme references: `{#-theme.color.primary.medium}`

2. **Typography Tokens**:
   - Font sizes: 
     - USWDS references: `{!-usa.font-size.reading.5}` or `{!-usa.font-size.display.2xl}`
     - Theme references: `{#-theme.font-size.body.sm}`
   - Font weights: `bold`, `regular`, `light`, etc.
   - Font families: References to font stacks

3. **Spacing Tokens**:
   - Numeric values: `2px`, `1rem`, etc.
   - USWDS references: `{usa.spacing.4}` or `{!-usa.spacing.md}`
   - Theme references: `{#-theme.spacing.container}`

The resolution system follows this precedence order:
1. Direct token references (exact match)
2. USWDS token resolution for known patterns
3. Theme-based resolution using project/default themes
4. Sensible fallbacks for all token types

### Testing

1. **Run Tests**:
   ```