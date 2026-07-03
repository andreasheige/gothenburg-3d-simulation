# Conventions

> The authoritative, always-loaded rules are in
> [`.github/copilot-instructions.md`](../.github/copilot-instructions.md). This
> page summarises them for quick reference. When they disagree, that file wins.

## TypeScript (super-strict)

The type gate is **`tsgo`** (TypeScript 7 native preview), not `tsc`. Strict
options in force change how you write code:

- **`verbatimModuleSyntax`** → use **`import type`** for type-only imports.
- **`noUncheckedIndexedAccess`** → indexed access is `T | undefined`; assert with
  `!` or default with `??` (e.g. `arr[i]!`, `map[key] ?? fallback`). This is why
  you see `!` after array/`Map` reads throughout the code.
- **`exactOptionalPropertyTypes`** → don't assign `undefined` to optional props;
  omit them, or build partial patches conditionally (see `setNav` in `store.ts`).
- Prefer precise domain types from `core/types/` and branded ids (`core/types/ids.ts`).

ESLint **type-aware** rules are intentionally **OFF** until typescript-eslint
supports the TS 7.x API — do not enable them.

## Imports & structure

- Use the **`@/*`** alias for `src/*`; avoid deep relative chains.
- Feature-first: new rendering/gameplay goes under `features/<area>/`; pure data
  under `domain/`; engine services under `core/systems/`.
- Domain modules may import from `core/` (e.g. `transit/schedule.ts` uses
  `core/systems/time`). There is no enforced import-boundary lint rule.

## Performance / R3F patterns

- **Never** store per-frame values in `useGame` — mutate the non-reactive
  `player` transform and `registry` instead, and read them in `useFrame`.
- Push to the store only on **meaningful change** (minute ticks for the clock,
  changed street/landmark, changed `nearby`), never every frame.
- Use **instancing** for bulk geometry; set `frustumCulled={false}` on instanced
  meshes placed far from the origin.
- Clamp `dt` in loops (`Math.min(dtRaw, 0.05)`).

## Generated files — do not hand-edit

- `public/geo/gothenburg.json` and `src/domain/geo/meta.ts` are produced by
  `scripts/fetch-osm.mjs`. Regenerate; don't edit by hand.

## Quality gate & commits

- Run **`npm run check`** (typecheck → lint → build) before committing; it must
  be **green with zero warnings**.
- Commits follow **Conventional Commits** (`feat(scope): …`, `fix: …`), and
  include the `Co-authored-by: Copilot` trailer used across the history.
- Stage only source files; do not commit dependency-manifest churn from local
  experiments.

## Language

User-facing strings are **Swedish** (HUD labels, toasts, prompts). Keep new
in-world copy Swedish and consistent with existing tone.
