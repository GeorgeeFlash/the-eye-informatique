# Plan: Fix Breadcrumb Hydration Error and Relocate Breadcrumbs

## Problem
1. **Hydration error**: `BreadcrumbSeparator` renders a `<li>` inside `BreadcrumbItem` (which also renders `<li>`), causing React hydration mismatch.
2. **UX request**: Breadcrumbs should be extracted from the navbar into their own component and placed in the main content area below the navbar.

## Decisions
- **Fix nested `<li>` bug**: Change `BreadcrumbSeparator` to render a `<span>` instead of `<li>`.
- **Extract component**: Create `components/dashboard/breadcrumb.tsx` with a `DashboardBreadcrumb` client component.
- **Placement**: Insert `<DashboardBreadcrumb />` into both `dashboard/layout.tsx` and `admin/layout.tsx` inside `<main>`, before `{children}`.
- **Namespace**: Keep `useTranslations("dashboardNavbar")` so existing `routes.*` translation keys continue to work.
- **Visibility**: Preserve `hidden md:block` behavior.

## Steps

### 1. Fix `components/ui/breadcrumb.tsx`
Change `BreadcrumbSeparator` to render `<span role="presentation">` instead of `<li>` to eliminate the nested list item bug globally.

### 2. Create `components/dashboard/breadcrumb.tsx`
- New client component (`"use client"`)
- Copy breadcrumb logic from `DashboardNavbar`: `usePathname()`, segment splitting, `humanizeSegment`, and translation lookup
- Render `<Breadcrumb>` with `hidden md:block` and proper structure (separator as sibling of `BreadcrumbItem`, not child)

### 3. Update `components/dashboard/navbar/dashboard-navbar.tsx`
- Remove `Breadcrumb`-related imports, `useMemo` crumb logic, and breadcrumb JSX
- Keep sidebar trigger, search, theme toggle, notifications, user nav, and studio button

### 4. Update `app/[locale]/(dashboard)/dashboard/layout.tsx`
- Import `DashboardBreadcrumb`
- Add `<DashboardBreadcrumb />` inside `<main>` before `{children}`

### 5. Update `app/[locale]/(dashboard)/admin/layout.tsx`
- Import `DashboardBreadcrumb`
- Add `<DashboardBreadcrumb />` inside `<main>` before `{children}`

## Validation
- Verify no `<li>` nesting in breadcrumb DOM
- Confirm breadcrumbs render correctly in both customer and admin dashboards
- Ensure breadcrumbs remain hidden on mobile (`hidden md:block`)
- Confirm navbar no longer contains breadcrumb elements
