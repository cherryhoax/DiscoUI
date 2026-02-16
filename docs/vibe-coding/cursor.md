# Vibe coding — Cursor

**How to use:**

Cursor supports markdown instruction files that are automatically loaded. You can use either format:

## Option 1: AGENTS.md (Simple)

1. Download the `cursor-instructions.md` file below.
2. Copy it to your project root and rename it to `AGENTS.md`.
3. Cursor will automatically use it when generating code.

## Option 2: .cursor/rules/ (Advanced)

1. Create a `.cursor/rules/` directory in your project root.
2. Download the `cursor-instructions.md` file below.
3. Copy it to `.cursor/rules/disco-ui.mdc` and add YAML frontmatter:

```yaml
---
name: DiscoUI / DiscoUICapacitor
description: Instructions for generating DiscoUI web components and DiscoUICapacitor apps
globs:
  - "**/*.html"
  - "**/*.js"
  - "**/*.ts"
  - "**/*.jsx"
  - "**/*.tsx"
  - "**/*.vue"
---
```

Then paste the content from `cursor-instructions.md` below the frontmatter.

**Note:** The `.mdc` format provides fine-grained control (only activates for specific file types), while `AGENTS.md` is simpler and works everywhere.

<p><a href="cursor-instructions.md" class="button">Download cursor-instructions.md</a></p>
