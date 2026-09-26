#!/usr/bin/env bash
# Rollback map for mission "pockettools-phase1-core-infrastructure" — generated at closure.
# Human-executed. Review before running; mugiwara never runs this.
# Branch: feature/phase-1-core-infrastructure
# Base:   cbd3f2044aa6a93377a78953cb33de04592560e7

set -euo pipefail

# Revert newest-first so earlier reverts never conflict with later ones.
git revert --no-edit \
  dd1cb23b94b42fa4f9ec6c80d4ac695cf49682bb \
  799ae8cb78cd8910233c249239522435580024de \
  3dc815d2f6cfc403995de32104e15e0a2dd1ae52 \
  34261364b9ec6dec9141e5df60102737ee3b4b27 \
  6824612cf6b6ca6da27897ca5904de076f5d8eac \
  ea23491b18b7ca1a971f903217474722831a473d \
  25a107e250b10f4bcaa651347db4359dc9209bbf \
  03700c786ab05417487075e6748ae3b85967b386 \
  5c12aed8290d4d78021b9db4e6e33b554ea9f17a \
  2343df1de5b750ab565611247be597dd5aa010e3 \
  133a0314ff3ba795171aaa054d86ea6f746941aa \
  95bf73c35843e704ecc9a17f897f54ff9ff17017 \
  1750c2e7475d36ec1d6e351221b88316f8961e50 \
  311873545a6a7947ae76cec16120956989937ff5 \
  17fc0e807895f4b6cd4b18732bc0b8baa0dfcbe6 \
  7d5a2d1f712e873c9209ee12b38b0790e5062fa5 \
  a952a631f4f8a8bb3e95ebd618f32ebf85da541c \
  e97ab340f337f660f889a6226238ec4247405526 \
  04d8314b1d95ca6497b1d54aeadd294f63766563 \
  6f95c62280e01cdb8c939fe00b1c197e4944daf8 \
  a4b698260f89a03b3b5bb06b83a08293569bd19b \
  046390f41c976d13f7a6be817526e91951c66d71 \
  6582a149e3c5dca503877b7c8b931c8e1b3e452f \
  0caedc65eabcee93d380ce4a2c79313e1cf60955 \
  5d63a7cd881629cc9e19961784c397a20776166f \
  89639a96e2d9e1b594357853f36957667c70a445 \
  967f72a0db13136483b6403bc9856404f6f951b9 \
  7999bbd00ddf97b66e452d7befbe73c9f0e08ef4 \
  ca9b5ec545f8a08661637022f563c81bfe200733 \
  4e82c915b00463f9a3b5d551d7d8de88fb78db59 \
  4c330620391081cfa1f668ee21e5b5c28c633a1d \
  4a81a91b406ff9b0551ef4b708f8774884c3d387 \
  d54984c461bd4fd2919240245083200cf1020540 \
  11d0655262f644d191c06b9292783371d093f019 \
  f2ce7aa44ce53c732706031a418fe061cc313710 \
  4232851774338a27d9d927122ad1ea26feabe55b \
  983b3545810016b9eaa5f07d941ac5bcb217e448 \
  dd74b7fd01d5004ac850c2a7e3615d92b49e807d \
  8b3705fcfa3daa22765fac945cb47cc0db138e89 \
  651614ad1945f1eab85e4c66b80ee104269145ce \
  76dac5fa5757c9f960c28486948c4b44552ec33a

# Files this mission touched (verify the working tree is clean afterwards):
#   .github/workflows/ci.yml
#   .mugiwara/config
#   .mugiwara/missions/pockettools-phase1-core-infrastructure/blockers.md
#   .mugiwara/missions/pockettools-phase1-core-infrastructure/decisions.md
#   .mugiwara/missions/pockettools-phase1-core-infrastructure/evidence/axe.md
#   .mugiwara/missions/pockettools-phase1-core-infrastructure/evidence/performance.md
#   .mugiwara/missions/pockettools-phase1-core-infrastructure/plan.md
#   .mugiwara/missions/pockettools-phase1-core-infrastructure/pr-verdict.md
#   .mugiwara/missions/pockettools-phase1-core-infrastructure/report.md
#   AGENTS.md
#   README.md
#   ROADMAP.md
#   app/assets/css/main.css
#   app/components/ToolActions.vue
#   app/components/ToolDualPane.vue
#   app/components/ToolFileDrop.vue
#   app/components/ToolFooter.vue
#   app/components/ToolHeader.vue
#   app/components/ToolHost.vue
#   app/components/ToolPlaceholder.vue
#   app/components/ToolState.vue
#   app/data/tool-registry.generated.ts
#   app/data/tool-registry.ts
#   app/data/tool-route.ts
#   app/data/tool-routes.generated.ts
#   app/data/tool-search.ts
#   app/data/tools.ts
#   app/error.vue
#   app/pages/index.vue
#   app/pages/tools/[slug].vue
#   app/pages/tools/index.vue
#   app/tools/color-picker/metadata.ts
#   app/tools/json-formatter/metadata.ts
#   app/tools/password-generator/metadata.ts
#   app/tools/text-cleaner/metadata.ts
#   app/types/tool.ts
#   app/utils/browser-actions.ts
#   app/utils/error-reporting.ts
#   app/utils/url-state.ts
#   nuxt.config.ts
#   package.json
#   playwright.config.ts
#   scripts/coverage-gate.ts
#   scripts/generate-tool-registry.ts
#   scripts/scaffold-tool-args.ts
#   scripts/scaffold-tool-files.ts
#   scripts/scaffold-tool.ts
#   tests/e2e/accessibility.pw.ts
#   tests/e2e/accessibility.spec.ts
#   tests/e2e/helpers/app.ts
#   tests/e2e/helpers/chunk.ts
#   tests/e2e/pwa.pw.ts
#   tests/e2e/shell.pw.ts
#   tests/e2e/tool-infrastructure.pw.ts
#   tests/unit/browser-actions.test.ts
#   tests/unit/coverage-gate.test.ts
#   tests/unit/direct-tsc.test.ts
#   tests/unit/error-reporting.test.ts
#   tests/unit/generated-registry.test.ts
#   tests/unit/scaffold-tool.test.ts
#   tests/unit/shared-components.test.ts
#   tests/unit/test-harness.test.ts
#   tests/unit/tool-categories.test.ts
#   tests/unit/tool-component-path.test.ts
#   tests/unit/tool-metadata.test.ts
#   tests/unit/tool-registry.test.ts
#   tests/unit/tool-route.test.ts
#   tests/unit/tool-search.test.ts
#   tests/unit/tool-slug.test.ts
#   tests/unit/url-state.test.ts
#   vue-shims.d.ts
