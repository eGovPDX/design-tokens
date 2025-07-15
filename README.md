# Design Tokens System

A system that processes design tokens from Zeroheight and transforms them into CSS files for use in various projects.

## Overview

This system is designed to create a single source of truth for design tokens, ensuring consistency and maintainability across all digital products. The primary workflow uses [Zeroheight](https://zeroheight.com/) as the token management platform, which syncs with GitHub to automate the process of generating CSS files.

A legacy workflow using [Tokens Studio for Figma](https://tokens.studio/) is also supported but is no longer the primary method.

## Workflows

### 1. Zeroheight Workflow (Primary)

This is the current and recommended workflow for managing design tokens.

1.  **Token Updates in Zeroheight**:
    *   Design tokens are managed and updated within the Zeroheight platform.
    *   When changes are published in Zeroheight, they are automatically pushed to the `zeroheight-incoming/` directory on the `main` branch of this repository.

2.  **GitHub Action Automation**:
    *   A push to the `zeroheight-incoming/` directory automatically triggers the `process-zeroheight-tokens.yml` GitHub Action.
    *   The action creates a new feature branch from `main` (e.g., `feat/update-zeroheight-tokens-YYYY-MM-DD-HHMMSS`).
    *   It then processes all `.json` files in the `zeroheight-incoming/` directory, resolving aliases and merging them into a single token set.
    *   The final output is generated as `output/design_tokens.css` and `output/design_tokens.json`.

3.  **Pull Request and Review**:
    *   If the processing results in changes to the output file, the action commits the new `design_tokens.css` and `design_tokens.json` to the feature branch.
    *   A pull request is automatically created from the feature branch to `main`, ready for team review.
    *   If there are no changes to the tokens, the workflow completes gracefully without creating a pull request.

4.  **Branch Cleanup**:
    *   Once the pull request is reviewed and merged, the temporary feature branch is automatically deleted to keep the repository clean.

### 2. Legacy Tokens Studio Workflow

This workflow was used previously and remains available as a secondary option if needed.

1.  **Token Updates in Figma**:
    *   Tokens were managed using the Tokens Studio plugin in Figma.
    *   Changes were pushed to a dedicated `incoming-token-changes` branch, creating a pull request to `main`.

2.  **Action Processing**:
    *   The `process-tokens.yml` action would trigger on the pull request.
    *   It processed the `design-tokens.json` file and committed the output (`output/design_tokens.css` and `output/design_tokens.json`) back to the PR branch.

## GitHub Pages Deployment

After the tokens are processed and the changes are merged into the `main` branch, a separate part of the workflow automatically deploys the final CSS file to GitHub Pages.

This makes the latest design tokens available for direct use in any project via a URL. You can import the tokens into your CSS file like this:

```css
@import url('https://egovpdx.github.io/design-tokens/design_tokens.css');
```

## Development

### Prerequisites

- Node.js 18 or higher
- pnpm 8 or higher

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/eGovPDX/design-tokens.git
    cd design-tokens
    ```

2.  Install dependencies:
    ```bash
    pnpm install
    ```

### Local Usage

You can process the tokens locally to test changes before pushing them to GitHub.

1.  **Process Zeroheight Tokens**:
    ```bash
    pnpm run process-tokens -- --source zeroheight --input ./zeroheight-incoming --output ./output
    ```

2.  **Process Legacy Tokens**:
    ```bash
    pnpm run process-tokens -- --source file --input design-tokens.json --output ./output
    ```

### Output Files

-   `output/design_tokens.css`: The primary CSS file generated from all token sources.
-   `output/design_tokens.json`: The primary JSON file generated from all token sources.

### Token Resolution

The system processes token files that follow the [W3C Design Tokens Community Group](https://design-tokens.github.io/community-group/format/) specification.

This format supports nesting and aliasing, allowing tokens to reference other tokens. For example, a semantic token like `color-primary-medium` might have a value of `{color.blue.50}`, which points to a base color token. The processor resolves these aliases to their final values during the build process.

## Troubleshooting

1.  **Action Failures**:
    *   Check the action logs in the "Actions" tab of the GitHub repository.
    *   Verify that any required secrets (e.g., `GITHUB_TOKEN`) are configured correctly.
    *   Ensure the JSON files from Zeroheight are correctly formatted.

2.  **PR Not Created**:
    *   This usually means the token processing did not result in any changes to the output file. Check the action logs to confirm.

3.  **Local Debugging**:
    *   Run the `process-tokens` script locally (as shown in the "Usage" section) to reproduce and debug issues.
    *   Check the console for any error messages from the script.
