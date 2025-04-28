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
   pnpm run process-tokens -- --source file --input design-tokens.json --output ./output
   
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
   graph TD
       A[Figma Tokens Studio] -->|Push Changes| B[GitHub PR]
       B -->|Trigger| C[GitHub Action]
       C -->|Process| D[Generate CSS]
       D -->|Update PR| E[Review Changes]
       E -->|Approve| F[Merge to Main]
   ```

2. **Processing Flow**:
   ```mermaid
   graph TD
       A[Token File] -->|Validate| B[Check Schema]
       B -->|Transform| C[Generate CSS]
       C -->|Output| D[CSS Variables]
       D -->|Update| E[PR Files]
   ```

## Development

### Prerequisites

- Node.js 18 or higher
- pnpm 8 or higher
- Figma account with Tokens Studio plugin

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/design-tokens.git
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

2. **Update Tokens**:
   ```bash
   pnpm run update-tokens
   ```

3. **Dry Run**:
   ```bash
   pnpm run update-tokens:dry-run
   ```

### Testing

1. **Run Tests**:
   ```bash
   pnpm test
   ```

2. **Lint Code**:
   ```bash
   pnpm run lint
   ```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a PR

### License

MIT
