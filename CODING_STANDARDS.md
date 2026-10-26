# OSSIntel Coding Standards

This document establishes the frontend architecture conventions and code quality guidelines for the OSSIntel codebase.

---

## 1. File Naming Conventions

- **Strict Naming Style**: All source filenames (React components, custom hooks, utilities, styles, tests) MUST use **dash-case** (kebab-case) exclusively.
  - _Correct_: `profile-card.tsx`, `use-intel.ts`, `repositories-table.tsx`
  - _Incorrect_: `ProfileCard.tsx`, `useIntel.ts`, `repositoriesTable.tsx`
- Keep folder directories lowercased and structured by domain scope.

---

## 2. Component Architecture & DRY

- **Atomic Components**: Break large page layouts into small, highly focused, reusable components.
- **Single Responsibility**: Every component should do exactly one thing. For example:
  - `ProfileCard` renders social details.
  - `OrgSelector` manages organization selections.
  - `ReadmeCard` formats profile README.
- **DRY (Don't Repeat Yourself)**: Extract common logic, Tailwind styling clusters, or data transformations into shared utilities or hooks.

---

## 3. Pure Arrow Functions

- **Preference**: Use arrow functions for all React components, custom hooks, and local helper methods.
  - _Correct_:

    ```typescript
    export const ProfileCard: React.FC<ProfileCardProps> = ({ avatarUrl }) => {
      return (
        // ...
      );
    };
    ```
  - _Incorrect_:

    ```typescript
    export function ProfileCard({ avatarUrl }) {
      return (
        // ...
      );
    }
    ```

---

## 4. Query Isolation & Custom Hooks

- **No Direct useQuery in Components**: Never import and call `useQuery` or `useQueries` directly inside a page/view component.
- **Encapsulate Data Syncing**: Always create custom hooks (e.g. `useGithubUser`, `useRepositoryIntel`) to handle network states, error conversions, and data mapping.
- **IndexedDB Caching**: Keep cache management (like storage reads, updates, and invalidations) encapsulated within the custom hook structure. This keeps rendering components pure and simple.
