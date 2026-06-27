# Design System

The Apex Global Logistics design system lives in `src/components/ui`, `src/components/layout`, and `src/lib/design-system`.

Open the workbench at `/design-system`.

## Foundations

- Semantic colors are defined in `src/app/globals.css`.
- Typed design tokens are exported from `src/lib/design-system/tokens.ts`.
- Dark mode is class-based with `.dark` on the document element.
- Motion utilities are intentionally short: `animate-fade-up`, `animate-scale-in`, and shimmer loaders.

## Components

- Actions: `Button`, `Badge`
- Surfaces: `Card`, `Dialog`, `Notification`
- Data display: `Table`, `MetricChartCard`, `SparklineChart`, `BarChart`
- Forms: `Field`, `FieldHint`, `FieldError`, `Input`, `Label`, `Select`, `Textarea`
- Navigation: `Breadcrumbs`, `SideNavigation`, `TopNavigation`
- States: `Skeleton`, `EmptyState`
- Type: `Display`, `Heading`, `Kicker`, `Text`
- Shells: `WorkspaceShell`, `ProtectedShell`, `AppShell`

## Product Rules

- Use Server Components by default and keep interactive pieces isolated as Client Components.
- Prefer semantic variants over one-off colors: `accent`, `success`, `warning`, `info`, `destructive`.
- Keep operational screens dense, scan-friendly, and responsive.
- Use lucide icons in icon buttons and navigational affordances.
- Avoid nested cards. Use one surface per repeated item or major tool panel.

## Accessibility

- Icon-only buttons must include screen-reader text.
- Tables should use `TableHead` for column headings.
- Dialogs should include a visible title and description.
- Status color must be paired with text, badges, or icons.
