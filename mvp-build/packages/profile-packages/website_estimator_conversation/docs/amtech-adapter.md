# AMTECH adapter for Website Estimator Conversation

Generated profile source: `/home/georgej/AMTECH/GTM-RESEARCH/.claude/worktrees/ce2-ce3-production/mvp-build/infra/.local/profile-generator/website_estimator_conversation/generated-profile`

This package preserves the profile-generator-authored identity and skills, then
overlays AMTECH runtime custody:

- `config.generated.yaml` keeps the generator's original Hermes config.
- `config.yaml` is AMTECH's rendered runtime config with Manager MCP, scoped
  credentials, hooks, compression, platform toolsets, and connector custody.
- `workspace/manager-tools.md` preserves the Manager tool contract.
- `purpose.manifest.json` and `purpose.profile-context.json` show the normal
  onboarding-derived factory inputs.

The generated website estimator is not proven live until provisioned through
`provision_employee`, started on the Docker Hermes runtime, and exercised
against Manager MCP/artifact tools.
