# Bootstrap record

## Discovery and authority

The repository contained only .git and had no commits, root AGENTS.md, source, skills, manifest, lockfile, or configuration. The supplied source-only pack contained four UI documents and eighteen source files; all were read. The product blueprint was read fully and copied unmodified into docs/product.md. Skeleton filenames, approved routes, fictional workspace records, and theme values were retained.

The user's master request explicitly approved one-time dependency/configuration/bootstrap work. That overrides the pack's default installation prohibition only for this bootstrap. No new skills, backend contracts, auth policies, production URLs, or business features were introduced.

## Dependencies

There were no existing packages to retain. Exact installed versions are locked in package-lock.json.

| Group             | Added packages                                                                                                                           | Purpose                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| App               | react, react-dom, react-router                                                                                                           | React UI and declarative routing                                     |
| UI infrastructure | radix-ui, lucide-react, class-variance-authority, clsx, tailwind-merge                                                                   | Required shadcn primitives, structural icons, variants/class merging |
| Build/types       | vite, @vitejs/plugin-react, typescript, @types/node, @types/react, @types/react-dom                                                      | Strict TypeScript and Vite                                           |
| Styling           | tailwindcss, @tailwindcss/vite                                                                                                           | Tailwind v4 compilation                                              |
| Lint/format       | eslint, @eslint/js, typescript-eslint, globals, eslint-plugin-react-hooks, eslint-plugin-react-refresh, eslint-plugin-jsx-a11y, prettier | Typed safety, hooks, accessibility patterns, formatting              |
| Tests             | vitest, jsdom, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom                                            | Component interaction verification                                   |

shadcn 4.23.0 was executed once and is not a project dependency. It generated button, card, input, label, alert, skeleton, dialog, sheet, breadcrumb, badge, and separator with new-york/Radix. A generated cn package import was replaced with the standard local @/lib/utils helper and the unnecessary dependency removed. Lucide is the single structural icon set for generated close/breadcrumb controls; features add no icons.

No Redux, Zustand, TanStack Query, Axios, React Hook Form, Zod, charting library, other UI library, CSS-in-JS, font, or decorative asset was installed. Architecture documentation explains when deferred libraries may become useful.

## Compatibility and references

Official references checked: [Vite](https://vite.dev/guide/), [Tailwind Vite integration](https://tailwindcss.com/docs/installation/using-vite), [shadcn Vite](https://ui.shadcn.com/docs/installation/vite), [React Router declarative mode](https://reactrouter.com/7.18.5/start/declarative/installation), and [Vitest](https://vitest.dev/guide/). Registry engines/peer dependencies were checked against Node 24.15.0.

React Router stays on the supplied v7 baseline and TypeScript on stable v5. ESLint 10 was evaluated, but eslint-plugin-jsx-a11y 6.10.2 supports only through ESLint 9. Version 9.39.5 is retained for a valid peer tree; npm labels it unsupported. Do not use force or legacy-peer-deps to bypass compatibility. Review the lint ecosystem as a unit for a future upgrade.

## Primitive normalization and freeze

The CLI's defaults were normalized during authorized bootstrap to use semantic colors, approved spacing/radius/shadows, visible focus, target sizes, readable text, and 150ms functional transitions. Entry/exit animations and pulsing skeletons were removed. Dialog and Sheet content support scrolling. Radix retains keyboard/focus behavior. No extra primitive or component variant was invented.

The supplied src/index.css remains byte-for-byte identical. components.json and generated ui files are frozen after bootstrap. Upstream product/UI documents and frozen CSS are excluded from formatting to retain their original bytes. See verification.md for executed checks and dependency audit results.
