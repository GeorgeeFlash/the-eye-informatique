# Tei Store — Software Requirements Specification

| Field | Value |
|---|---|
| **Project** | Tei Store — Online extension of The Eye Informatique |
| **Version** | 0.2 |
| **Status** | Draft |
| **Date** | 2026-03-06 |

---

## Table of Contents

1. [Document Control](#1-document-control)
2. [Introduction](#2-introduction)
3. [Product Overview](#3-product-overview)
4. [Agile Conventions](#4-agile-conventions)
5. [Functional Requirements](#5-functional-requirements)
   - [Module 1 — User Management & Roles](#module-1--user-management--roles)
   - [Module 2 — Product & Catalog Management](#module-2--product--catalog-management)
   - [Module 3 — Shopping & Checkout](#module-3--shopping--checkout)
   - [Module 4 — Guarantee, Repairs & Returns](#module-4--guarantee-repairs--returns)
   - [Module 5 — Affiliate System](#module-5--affiliate-system)
   - [Module 6 — Content & Blog System](#module-6--content--blog-system)
   - [Module 7 — Notifications & Events](#module-7--notifications--events)
   - [Module 8 — Analytics & KPIs](#module-8--analytics--kpis)
   - [Module 9 — Security & Trust](#module-9--security--trust)
   - [Module 10 — Progressive Web App (PWA)](#module-10--progressive-web-app-pwa)
   - [Module 11 — AI Capabilities](#module-11--ai-capabilities)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Cameroon Operational Constraints](#7-cameroon-operational-constraints)
8. [Traceability Matrix](#8-traceability-matrix)
9. [Risk Register](#9-risk-register)
10. [Open Assumptions](#10-open-assumptions)
11. [Iteration Protocol](#11-iteration-protocol)
12. [Glossary](#12-glossary)

---

## 1. Document Control

### 1.1 Version History

| Version | Date | Status | Summary |
|---|---|---|---|
| 0.1 | 2026-03-06 | Superseded | Initial SRS — 10 modules, 25 stories, 157 ACs |
| 0.2 | 2026-03-06 | Draft | Major expansion — 11 modules, 32 stories, ~196 ACs. Added AI capabilities (Module 11), social sign-in, cross-branch fulfillment, installment deadlines, receipt scanning, activity logging, cookie consent, theming, commission payout preferences. Revised M1.1, M1.2, M3.2, M10.1. Added Douala as 4th branch. |

### 1.2 Review & Approval

| Role | Name | Approved |
|---|---|---|
| Product Owner | TBD | — |
| Tech Lead | TBD | — |
| QA Lead | TBD | — |

---

## 2. Introduction

### 2.1 Purpose

This document describes the functional and non-functional requirements for Tei Store, the e-commerce platform of The Eye Informatique. It is written in an agile, user-story format and serves as the authoritative requirements baseline for development, testing, and stakeholder communication.

This is a living document. Sections are versioned incrementally as requirements are refined, validated, or re-prioritised. It does not describe implementation details — architecture, data schema, API design, and technology decisions are addressed in separate design documents.

### 2.2 Scope

Tei Store is the online retail channel for The Eye Informatique's branches in Cameroon. It enables customers to discover and purchase electronics, pay in installments via Mobile Money or card, request exchanges and repairs, and submit product reviews. Affiliates ("hunter men") promote products and earn commissions. Branch staff and central administrators manage inventory, content, users, and analytics through role-specific dashboards. AI capabilities assist staff in product creation and receipt processing, and provide customers with an intelligent chat assistant.

### 2.3 Out of Scope

The following are explicitly excluded from this SRS and addressed in separate documents:

- System architecture and deployment topology
- Database schema and data modelling
- API design and integration contracts
- UI/UX wireframes and design system specifications
- Third-party service selection and integration details
- CI/CD pipeline configuration
- Internal IT infrastructure outside the web application

### 2.4 Intended Audience

| Audience | Use |
|---|---|
| Product Owner | Validate scope, approve stories, re-prioritise backlog |
| Developers | Understand what to build without prescribing how |
| QA Engineers | Derive test cases from acceptance criteria |
| Branch Admins / Stakeholders | Review promised capabilities |
| UX Designers | Understand user needs and role workflows |

---

## 3. Product Overview

### 3.1 Business Context

The Eye Informatique is a Cameroonian retailer of consumer electronics — laptops, smartphones, desktops, peripherals, and accessories. Tei Store extends the existing brick-and-mortar business online, allowing customers to shop across all branches from any device, pay via Mobile Money or card (including installment), manage orders and after-sales requests, and interact with product and editorial content. AI capabilities enhance staff productivity and customer self-service.

### 3.2 Branch Model

Tei Store operates across physical branches. Each branch:

- Manages its own product stock independently
- Has its own Branch Admin and Moderator/Employee staff
- Onboards and manages its own affiliates
- Generates branch-scoped sales and analytics data

| Branch | City |
|---|---|
| Branch 1 | Bamenda |
| Branch 2 | Buea |
| Branch 3 | Yaoundé |
| Branch 4 | Douala |

Future branches can be added by a Central Admin without structural changes to the platform. Products may be stocked at multiple branches. Cross-branch fulfillment is supported (see §7, CON-4).

### 3.3 User Roles

| Role ID | Name | Also Known As | Description |
|---|---|---|---|
| R1 | Visitor | — | Unauthenticated user browsing the store |
| R2 | Customer | — | Registered user who shops and may post reviews |
| R3 | Affiliate | Hunter Man | Approved promoter who earns commission on referred sales |
| R4 | Moderator / Employee | — | Branch staff who manage product listings, blog content, and in-store receipt entries for their branch |
| R5 | Branch Admin | — | Manages one branch: products, affiliates, staff, and branch analytics |
| R6 | Central Admin | — | Cross-branch oversight: all users, all branches, system broadcasts, global analytics |

**Role combination rules:**
- An Affiliate is also a Customer; they hold R2 + R3 simultaneously.
- R4, R5, and R6 are internal staff roles; they may also hold Customer access.
- A user cannot hold Branch Admin (R5) for two different branches simultaneously.
- A Central Admin (R6) can change any staff member's role directly from the staff management interface.

### 3.4 User Personas

#### P1 — Retail Customer (Bamenda)
A university student browsing for laptops and phones, comparing specs, and paying via Mobile Money. Needs clear pricing in XAF, a straightforward mobile checkout, and confidence that the order is protected by a fair after-sales policy. May order a product stocked at another branch and expects transparent shipping information.

#### P2 — Affiliate / Hunter Man (Buea)
A local promoter who shares product links on WhatsApp and social media. Needs to see commission rates clearly, generate unique tracking links, choose a payout schedule, and review earnings at any time.

#### P3 — Moderator / Employee (Yaoundé)
A shop assistant who updates product listings, publishes blog content, and records in-store purchases for the Yaoundé branch. Uses AI assistance to draft product descriptions and scan physical receipts. Needs a content and inventory management interface scoped to their branch only.

#### P4 — Branch Admin (Bamenda)
A branch manager who approves new affiliates, monitors stock levels, monitors branch sales, adjusts commission rates, and configures shipping fees. Needs a branch-level analytics dashboard and control over who can promote their branch's products.

#### P5 — Central Admin
A head office operator who oversees all branches, manages user access across the system, sends system-wide announcements, uploads AI knowledge base documents, exports KPI reports, and uses AI-generated analytics insights for executive review.

### 3.5 Release Strategy

Each requirement is classified by its release target:

| Tag | Meaning |
|---|---|
| `MVP` | Required for the initial public launch of Tei Store |
| `Phase 2+` | Planned for a subsequent release cycle after the MVP |

The MVP establishes core shopping, user management, product catalog, after-sales handling, security, AI-assisted product creation, customer AI chat, and receipt scanning. Phase 2+ extends the platform with the full affiliate dashboard, blog and content management, notifications, full analytics, PWA offline mode, AI analytics, and commission payout preferences.

---

## 4. Agile Conventions

### 4.1 Story ID Format

Each user story is identified as `M[module].[sequence]` — for example, `M1.1` is the first story in Module 1.

### 4.2 Story Format

Each story entry includes:

- **User story** — "As a [role], I want [capability] so that [benefit]."
- **Priority** — MoSCoW tag (M / S / C / W)
- **Release** — `MVP` or `Phase 2+`
- **Depends on** — prerequisite story IDs, or None
- **Acceptance Criteria** — numbered binary statements, each independently testable

### 4.3 MoSCoW Priority

| Tag | Meaning |
|---|---|
| **M — Must** | Non-negotiable for the release target. Blocking if absent. |
| **S — Should** | High value; included unless a strong constraint forces deferral. |
| **C — Could** | Desirable; included if time and budget allow. |
| **W — Won't** | Explicitly deferred to a later release. |

### 4.4 Acceptance Criteria Style Rules

- Each AC is a declarative, binary statement — it either passes or fails.
- No implementation detail (no library names, API paths, field names, or schema).
- Each AC must be independently testable by a QA tester or automated test.
- Vague qualifiers ("fast", "user-friendly", "intuitive") are not permitted; measurable thresholds are used instead.

### 4.5 Definition of Done

A story is Done when all of the following are true:

1. All acceptance criteria pass in a test environment.
2. No new high-severity defects are introduced.
3. Role-based access controls are enforced for all new surfaces (UI and data layer).
4. The feature meets WCAG 2.1 AA and renders correctly on mobile, tablet, and desktop viewports.
5. The feature is available and fully translated in both English and French.
6. The story has been reviewed and signed off by the Product Owner.

### 4.6 Global Exclusions

The following are confirmed out of scope for all releases covered by this SRS:

- Physical point-of-sale (POS) system integration
- Accounting or financial system integration
- Supplier or vendor portal
- Multi-currency transactions (XAF only)
- A native iOS or Android application (PWA is the mobile-install channel)
- Real-time video or live-streaming features
- Marketplace model (third-party sellers listing on the platform)
- Cash-on-delivery as a checkout option

---

## 5. Functional Requirements

---

### Module 1 — User Management & Roles

**Purpose:** Enable any visitor to register once and gain access only to the features their role(s) require — whether shopping, promoting products, moderating content, or overseeing the business.

---

#### Story M1.1 — Unified Sign-Up

| Field | Detail |
|---|---|
| **User story** | As a Visitor, I want to sign up using my social account or email so that I can start shopping or apply to promote products. |
| **Priority** | Must |
| **Release** | MVP |
| **Depends on** | None |

**Acceptance Criteria**

- [ ] AC-M1.1-1: Registration supports social sign-in via Google and Facebook. A new user signing in via a social provider for the first time is automatically registered as a Customer.
- [ ] AC-M1.1-2: Registration supports email and password. On email registration, a verification code is sent to the registered email address and the user must enter the code to verify their account.
- [ ] AC-M1.1-3: The registration form includes an optional "Apply as Affiliate" toggle. When enabled, a branch selector becomes visible and required before the form can be submitted.
- [ ] AC-M1.1-4: On successful registration without the affiliate toggle, the user is assigned the Customer role and directed to the customer dashboard.
- [ ] AC-M1.1-5: On successful registration with the affiliate toggle, the user is assigned the Customer role and an Affiliate application status of "Pending". The Affiliate panel is visible on their dashboard but locked with a "Pending approval" notice.
- [ ] AC-M1.1-6: Registering with an email address already associated with an existing account returns a clear error message; no duplicate account is created.
- [ ] AC-M1.1-7: Email verification must be completed before the user can proceed to checkout. Unverified users can browse products and add items to cart.
- [ ] AC-M1.1-8: User role assignments (Customer, Affiliate, Moderator, Branch Admin, Central Admin) are stored and managed in the platform's own database, independent of the authentication provider.
- [ ] AC-M1.1-9: During registration, the user must accept the platform's privacy notice and terms of service via an explicit action. Registration cannot complete without acceptance.

---

#### Story M1.2 — Role-Based Dashboard

| Field | Detail |
|---|---|
| **User story** | As a logged-in User, I want a dashboard showing only the tools and information relevant to my role(s) so that I am not confused by features that do not apply to me. |
| **Priority** | Must |
| **Release** | MVP |
| **Depends on** | M1.1 |

**Acceptance Criteria**

- [ ] AC-M1.2-1: Customer and Affiliate roles share a single customer-facing dashboard. Customers see: active orders, cart, saved/favourited items, and account settings. The Affiliate panel is hidden unless the user holds an approved Affiliate role.
- [ ] AC-M1.2-2: A user holding both Customer and Affiliate roles sees all Customer sections plus an Affiliate panel containing: commission earnings summary, promotional link management, payout preference, and performance statistics. This panel is read-only and locked if affiliate status is "Pending".
- [ ] AC-M1.2-3: Moderators, Employees, Branch Admins, and Central Admins use a separate administration dashboard, distinct from the customer-facing dashboard.
- [ ] AC-M1.2-4: A Moderator/Employee administration dashboard includes: product management tools, blog tools, receipt scanning, and AI-assisted product creation for their assigned branch. No data from other branches is visible.
- [ ] AC-M1.2-5: A Branch Admin dashboard includes all Moderator sections plus: branch-level sales analytics, affiliate management for their branch, staff management, shipping fee configuration, and knowledge base uploads scoped to their branch.
- [ ] AC-M1.2-6: A Central Admin dashboard provides: cross-branch analytics, all-branch product views, user management across the system, system-wide broadcast tools, global knowledge base management, staff role management, activity log viewer, and AI analytics.
- [ ] AC-M1.2-7: A Central Admin can change the role of any staff member directly from the staff listing page in the administration dashboard. The role change takes effect on the staff member's next request.
- [ ] AC-M1.2-8: Navigating directly to a dashboard URL reserved for a role the authenticated user does not hold returns an "Access Denied" response — not a blank page or a data leak.
- [ ] AC-M1.2-9: A Moderator, Branch Admin, or Central Admin can view and add internal text remarks on any user's profile. Remarks display the author's name, role, and a timestamp. Remarks are never visible to the user whose profile they are attached to.

---

### Module 2 — Product & Catalog Management

**Purpose:** Enable each branch to curate its own product catalog — adding devices, defining their attributes and variants, and monitoring stock levels. Products may be stocked at multiple branches to support cross-branch fulfillment.

---

#### Story M2.1 — Branch-Level Product CRUD

| Field | Detail |
|---|---|
| **User story** | As a Moderator or Branch Admin, I want to create, edit, and remove products for my branch so that the catalog accurately reflects what is available. |
| **Priority** | Must |
| **Release** | MVP |
| **Depends on** | M1.2 |

**Acceptance Criteria**

- [ ] AC-M2.1-1: A Moderator or Branch Admin can create a product by providing: name, description, category, one or more images, a price in XAF, and at least one variant configuration.
- [ ] AC-M2.1-2: A product supports multiple variants (e.g., "128 GB / Silver" and "256 GB / Black"). Each variant carries its own price and stock count.
- [ ] AC-M2.1-3: A Moderator or Branch Admin can edit any field of an existing product belonging to their branch.
- [ ] AC-M2.1-4: Deleting a product performs a soft delete: the product is hidden from customers but remains accessible to admins and can be republished.
- [ ] AC-M2.1-5: A Moderator or Branch Admin cannot view, create, edit, or delete products belonging to a different branch. Stock management for a product is always scoped to the acting user's branch.
- [ ] AC-M2.1-6: A Central Admin can view and manage products across all branches.
- [ ] AC-M2.1-7: Attempting to save a product without a name, category, or at least one image is rejected with field-level validation messages before the record is saved.
- [ ] AC-M2.1-8: A Central Admin can make an existing product available at additional branches. When a product is available at multiple branches, each branch manages its own stock level for that product independently.

---

#### Story M2.2 — Dynamic Categories & Custom Features

| Field | Detail |
|---|---|
| **User story** | As a Central Admin, I want to create product categories and define which custom feature fields appear for each category so that the catalog can accommodate new device types without development changes. |
| **Priority** | Should |
| **Release** | MVP |
| **Depends on** | M2.1 |

**Acceptance Criteria**

- [ ] AC-M2.2-1: A Central Admin can create a product category with a name and an optional description.
- [ ] AC-M2.2-2: A Central Admin can attach custom feature fields to a category (e.g., "Screen Size" as a dropdown, "RAM" as a numeric field). These fields appear on the product creation form for that category.
- [ ] AC-M2.2-3: Removing a feature field from a category does not affect products already created with that field; existing values are preserved but the field no longer appears on new products in that category.
- [ ] AC-M2.2-4: Feature field types support at minimum: free text, number, and dropdown with a predefined options list.
- [ ] AC-M2.2-5: Category and feature changes are reflected on product pages without a manual cache-clearing step.

---

#### Story M2.3 — Inventory Tracking

| Field | Detail |
|---|---|
| **User story** | As a Branch Admin or Central Admin, I want to see real-time stock levels per product variant per branch so that I can prevent overselling and reorder before items run out. |
| **Priority** | Must |
| **Release** | MVP |
| **Depends on** | M2.1 |

**Acceptance Criteria**

- [ ] AC-M2.3-1: Each product variant displays a current stock count in the admin product view, reflecting the latest confirmed inventory for that branch.
- [ ] AC-M2.3-2: When a customer completes a purchase, the stock count for the purchased variant is decremented immediately at the fulfilling branch. Two concurrent purchases of the last unit in stock cannot both succeed; one receives an "out of stock" error.
- [ ] AC-M2.3-3: When a variant's stock count reaches or falls below a configurable low-stock threshold (default: 3 units), a low-stock alert is shown on the admin product view for that variant.
- [ ] AC-M2.3-4: Variants with a stock count of 0 are labelled "Out of Stock" on the customer-facing product page and cannot be added to cart.
- [ ] AC-M2.3-5: A Central Admin can view a consolidated stock summary across all branches from the central dashboard.

---

### Module 3 — Shopping & Checkout

**Purpose:** Let customers discover products across all branches, manage a cart, and pay — in full or by installment — while maintaining a clear, secure, and transparent transaction flow including cross-branch shipping.

---

#### Story M3.1 — Browse & Filter Products

| Field | Detail |
|---|---|
| **User story** | As a Customer or Visitor, I want to search, filter, and page through the product catalog so that I can find the right device quickly. |
| **Priority** | Must |
| **Release** | MVP |
| **Depends on** | M2.1, M2.2 |

**Acceptance Criteria**

- [ ] AC-M3.1-1: A global keyword search returns products whose name or description contains the query term. Results are updated on each search submission.
- [ ] AC-M3.1-2: Products can be filtered simultaneously by: category, branch location, and any category-specific feature (e.g., "16 GB RAM"). Multiple filters narrow results using AND logic.
- [ ] AC-M3.1-3: The product listing is paginated. Each page shows a consistent number of results (configurable; default 20). A page indicator shows the current page and total page count.
- [ ] AC-M3.1-4: When a search or active filter combination returns no results, a "No products found" message is displayed with an option to clear all filters.
- [ ] AC-M3.1-5: While results are loading, a visible loading indicator is shown. A blank screen is not shown during loading.
- [ ] AC-M3.1-6: Out-of-stock products appear in search results but are visually labelled "Out of Stock" and cannot be added to cart.

---

#### Story M3.2 — Cart & Flexible Checkout

| Field | Detail |
|---|---|
| **User story** | As a Customer, I want to add items to a cart from any branch and choose between paying in full or making installment payments so that I can complete my purchase in the way that suits my budget. |
| **Priority** | Must |
| **Release** | MVP |
| **Depends on** | M3.1, M1.1 |

**Acceptance Criteria**

- [ ] AC-M3.2-1: An authenticated Customer can add one or more product variants to a cart. The cart persists across sessions.
- [ ] AC-M3.2-2: The cart view displays for each item: variant details, unit price in XAF, quantity, line total, and the city of the fulfilling branch. The view also shows: overall subtotal, total shipping fee (if any), estimated delivery information, and a guarantee summary.
- [ ] AC-M3.2-3: A single cart and resulting order can contain items sourced from different branches. Each item displays its fulfilling branch's city.
- [ ] AC-M3.2-4: Before proceeding to checkout, the customer must provide a shipping address including city. The address is saved to the customer's profile for future orders.
- [ ] AC-M3.2-5: A shipping fee, configured by an admin, is applied to each item whose fulfilling branch is in a different city than the customer's shipping address city. A per-item note indicating the shipping city (e.g., "Ships from Bamenda") is visible only when the shipping fee for that item is greater than zero. The total shipping fee is displayed at the cart level.
- [ ] AC-M3.2-6: At checkout, the customer selects a payment method: Mobile Money or card.
- [ ] AC-M3.2-7: At checkout, the customer selects a payment mode: "Pay in Full" or "Pay in Installments". When "Pay in Installments" is selected, the minimum initial payment amount and the payment deadline are displayed before the customer confirms.
- [ ] AC-M3.2-8: An order placed under installment mode is created with a "Partially Paid" status. The outstanding balance and the payment deadline are displayed on the order detail page.
- [ ] AC-M3.2-9: Order status does not advance to "Ready for Delivery" until the full outstanding balance is paid.
- [ ] AC-M3.2-10: A Visitor who attempts to proceed to checkout is redirected to the sign-up or login screen and returned to checkout on successful authentication.
- [ ] AC-M3.2-11: If an item in the cart is out of stock at the time of checkout (having been in stock when added), the customer is informed and the item is flagged before payment is requested.
- [ ] AC-M3.2-12: An order containing items from multiple branches displays a per-item fulfillment status. The customer sees one order with item-level delivery tracking.

---

### Module 4 — Guarantee, Repairs & Returns

**Purpose:** Model the after-sales lifecycle — exchanges, repairs, and returns — so that customers have confidence in their purchases and branch staff can track every request to resolution.

---

#### Story M4.1 — Exchange, Repair & Return Requests

| Field | Detail |
|---|---|
| **User story** | As a Customer, I want to request an exchange, repair, or return for a product I purchased so that I can resolve issues without visiting a store. |
| **Priority** | Must |
| **Release** | MVP |
| **Depends on** | M3.2 |

**Acceptance Criteria**

- [ ] AC-M4.1-1: A Customer can create an after-sales request for any completed order line item. The request must specify the request type ("Exchange", "Repair", or "Return") and a text description of the issue.
- [ ] AC-M4.1-2: A request can only be created within a configurable number of calendar days after the order's delivery date (default 30 days, adjustable by Central Admin). Requests submitted after this window are rejected with a clear message.
- [ ] AC-M4.1-3: Optional photo or video attachments (up to 5 files, maximum 10 MB each) can be included with a request to document the issue.
- [ ] AC-M4.1-4: On submission, the request enters a "Submitted" status and the customer receives a confirmation summary containing the request ID, type, and a link to track progress.
- [ ] AC-M4.1-5: A Moderator or Branch Admin reviews the request and sets the status to one of: "Approved", "In Progress", "Resolved", or "Rejected". Each transition records a timestamp and the acting staff member.
- [ ] AC-M4.1-6: When a request is rejected, the staff member must provide a written reason. The rejection reason is visible to the customer alongside the status.
- [ ] AC-M4.1-7: The customer can view all their after-sales requests and current statuses from their dashboard.

---

#### Story M4.2 — Guarantee Lifecycle

| Field | Detail |
|---|---|
| **User story** | As a Branch Admin, I want to define and attach guarantee policies to products and track guarantee expiry per sale so that customers are protected and staff can verify claims quickly. |
| **Priority** | Must |
| **Release** | MVP |
| **Depends on** | M2.1, M3.2 |

**Acceptance Criteria**

- [ ] AC-M4.2-1: A Branch Admin or Central Admin can create a guarantee policy by providing: a policy name, a coverage description, a duration in calendar months, and optionally a list of exclusions.
- [ ] AC-M4.2-2: A guarantee policy can be attached to a product or category. When attached to a category, all products in that category inherit the policy.
- [ ] AC-M4.2-3: When a customer purchases a product with a guarantee policy, a guarantee record is created automatically for that order line item with a start date equal to the delivery date and an end date calculated from the policy duration.
- [ ] AC-M4.2-4: The guarantee record is displayed on the customer's order detail page, showing: guarantee name, start date, end date, coverage summary, and current status (Active / Expired).
- [ ] AC-M4.2-5: Staff reviewing an after-sales request (M4.1) can see the guarantee status for the associated product inline. If the guarantee is expired, a visual indicator warns the reviewer before a decision is made.
- [ ] AC-M4.2-6: A Central Admin can view all active guarantee records across all branches, filterable by branch, product, and expiry period.
- [ ] AC-M4.2-7: When a guarantee is within 14 calendar days of expiry, a summary notification appears on the customer's dashboard.
- [ ] AC-M4.2-8: Changes to a guarantee policy (description, duration, exclusions) apply only to future sales; existing guarantee records retain their original terms.

---

#### Story M4.3 — Internal Remarks & Notes

| Field | Detail |
|---|---|
| **User story** | As a Moderator or Branch Admin, I want to leave internal notes on after-sales requests, orders, and user profiles so that staff can share context without exposing it to customers. |
| **Priority** | Should |
| **Release** | MVP |
| **Depends on** | M4.1 |

**Acceptance Criteria**

- [ ] AC-M4.3-1: A Moderator, Branch Admin, or Central Admin can add a text remark to an after-sales request, an order, or a user profile.
- [ ] AC-M4.3-2: Each remark records the author's name, role, and a timestamp.
- [ ] AC-M4.3-3: Remarks are displayed in reverse chronological order on the associated record's admin view.
- [ ] AC-M4.3-4: Remarks are visible only to staff roles (Moderator, Branch Admin, Central Admin). They are never displayed to the Customer or Affiliate on any customer-facing page.
- [ ] AC-M4.3-5: A remark cannot be edited after creation. Corrections require adding a new remark referencing the previous one.

---

### Module 5 — Affiliate System

**Purpose:** Recruit, vet, and reward product promoters ("hunter men") — the network of affiliates who drive traffic and sales for each branch — with trackable links, transparent commissions, and flexible payout options.

---

#### Story M5.1 — Application & Approval

| Field | Detail |
|---|---|
| **User story** | As a Customer, I want to apply to become an Affiliate for a specific branch so that I can earn commissions by promoting products. |
| **Priority** | Should |
| **Release** | MVP |
| **Depends on** | M1.1 |

**Acceptance Criteria**

- [ ] AC-M5.1-1: A Customer can apply to join the affiliate programme for a single branch. The application form captures: phone number, preferred payout method, and a brief motivation statement.
- [ ] AC-M5.1-2: The application status starts as "Pending" and is visible on the customer's dashboard immediately after submission.
- [ ] AC-M5.1-3: A Branch Admin or Central Admin for the selected branch can view pending applications and approve or reject each one with an optional comment.
- [ ] AC-M5.1-4: On approval, the user gains the Affiliate role for that branch and the Affiliate panel on their dashboard is unlocked.
- [ ] AC-M5.1-5: On rejection, the customer sees the rejection comment (if provided) and may re-apply after a configurable waiting period (default: 30 days).
- [ ] AC-M5.1-6: A Branch Admin can suspend or revoke an existing Affiliate at any time with a written reason. Suspension hides the Affiliate panel and deactivates all promotional links.
- [ ] AC-M5.1-7: A Central Admin can view all affiliate applications and statuses across all branches.

---

#### Story M5.2 — Promotional Links & Tracking

| Field | Detail |
|---|---|
| **User story** | As an Affiliate, I want to generate unique promotional links that track my referrals so that I can share them on social channels and receive credit for resulting sales. |
| **Priority** | Should |
| **Release** | Phase 2+ |
| **Depends on** | M5.1 |

**Acceptance Criteria**

- [ ] AC-M5.2-1: An approved Affiliate can generate a unique promotional link for any product in their branch's catalog. The link contains a non-guessable tracking identifier.
- [ ] AC-M5.2-2: When a customer clicks a promotional link, the affiliate identifier is stored locally in the customer's browser and persists for a configurable attribution window (default: 30 days).
- [ ] AC-M5.2-3: If the customer completes a purchase within the attribution window, the sale is attributed to the affiliate who generated the link. Only the most recent affiliate's link counts (last-click attribution).

---

#### Story M5.3 — Commission Calculation

| Field | Detail |
|---|---|
| **User story** | As a Branch Admin, I want to set and adjust commission rates for affiliates so that promotional costs remain within budget. |
| **Priority** | Could |
| **Release** | Phase 2+ |
| **Depends on** | M5.2 |

**Acceptance Criteria**

- [ ] AC-M5.3-1: A Branch Admin can set a default commission percentage for all products in their branch.
- [ ] AC-M5.3-2: A Branch Admin can override the default rate with a product-specific commission percentage. Product-level rates take priority over the branch default.
- [ ] AC-M5.3-3: Commission is calculated as a percentage of the order line-item total attributed to the affiliate and recorded at the time of order completion (full payment received).
- [ ] AC-M5.3-4: Commission records are immutable once created; rate changes do not retroactively affect past commissions.
- [ ] AC-M5.3-5: A Central Admin can view and export all commission records across all branches.

---

#### Story M5.4 — Affiliate Dashboard

| Field | Detail |
|---|---|
| **User story** | As an Affiliate, I want a dashboard showing my earnings, link performance, and payout history so that I can track my success and earnings. |
| **Priority** | Could |
| **Release** | Phase 2+ |
| **Depends on** | M5.2, M5.3 |

**Acceptance Criteria**

- [ ] AC-M5.4-1: The Affiliate panel shows: total earnings to date, pending (unpaid) commission balance, total referred sales count, and total sales amount generated.
- [ ] AC-M5.4-2: A performance table lists each promotional link with: link URL, click count, resulting orders count, and earned commission amount.
- [ ] AC-M5.4-3: The panel includes a payout history table showing: payout date, amount, and method for each disbursement.
- [ ] AC-M5.4-4: All monetary values are displayed in XAF, formatted as whole numbers with the "FCFA" label.

---

#### Story M5.5 — Admin Affiliate Overview

| Field | Detail |
|---|---|
| **User story** | As a Branch Admin, I want to view a summary of all affiliates in my branch — their status, earnings, and performance — so that I can manage the programme effectively. |
| **Priority** | Should |
| **Release** | Phase 2+ |
| **Depends on** | M5.1 |

**Acceptance Criteria**

- [ ] AC-M5.5-1: The Branch Admin affiliate overview displays a table listing all affiliates with columns: name, status (Active / Suspended / Revoked), total referred sales, total commission earned, and date of last referral.
- [ ] AC-M5.5-2: The table supports filtering by status and sorting by any column.
- [ ] AC-M5.5-3: Clicking an affiliate row opens a detail view showing: application details, full promotional link list, commission history, and any internal remarks.
- [ ] AC-M5.5-4: A Central Admin can access the same overview across all branches with an additional branch filter.
- [ ] AC-M5.5-5: The overview data refreshes when the page loads; cached affiliate statistics are not shown beyond the current session.

---

#### Story M5.6 — Commission Payout Preference

| Field | Detail |
|---|---|
| **User story** | As an Affiliate, I want to choose whether I receive my commission immediately after each sale or as a lump sum at the end of the month so that I can manage my earnings according to my preference. |
| **Priority** | Should |
| **Release** | Phase 2+ |
| **Depends on** | M5.1 |

**Acceptance Criteria**

- [ ] AC-M5.6-1: An approved Affiliate can select a payout preference on their dashboard: "Immediate (per sale)" or "Monthly (end of month)".
- [ ] AC-M5.6-2: The default payout preference for new affiliates is "Monthly".
- [ ] AC-M5.6-3: When "Immediate" is selected, commission for each completed sale is disbursed within 24 hours of order completion (full payment received and confirmed).
- [ ] AC-M5.6-4: When "Monthly" is selected, all commissions earned during a calendar month are aggregated and disbursed within the first 5 business days of the following month.
- [ ] AC-M5.6-5: An affiliate can change their payout preference at any time. The new preference applies to commissions earned after the change; commissions already queued under the previous preference are not affected.
- [ ] AC-M5.6-6: The affiliate dashboard displays: current payout preference, pending commission amount, next scheduled payout date (if monthly), and payout history.

---

### Module 6 — Content & Blog System

**Purpose:** Provide a blog-like content surface for product guides, tips, and promotions that staff can draft, review and publish — keeping customers engaged and boosting organic search visibility.

---

#### Story M6.1 — Article Authoring

| Field | Detail |
|---|---|
| **User story** | As a Moderator, I want to write and submit blog articles so that the store has fresh editorial content for customers. |
| **Priority** | Should |
| **Release** | Phase 2+ |
| **Depends on** | M1.2 |

**Acceptance Criteria**

- [ ] AC-M6.1-1: A Moderator or Branch Admin can create, edit, and submit articles for review. Each article includes: a title, a body composed with a rich-text editor, an optional cover image, and one or more tags.
- [ ] AC-M6.1-2: Submitted articles enter a "Pending Review" status and are not visible to customers until approved.
- [ ] AC-M6.1-3: A Branch Admin or Central Admin can approve, reject, or request changes on a submitted article. The reviewer's action is recorded with a timestamp.
- [ ] AC-M6.1-4: When approved, the article is published and immediately appears on the public blog.
- [ ] AC-M6.1-5: An author can edit a published article. The edit saves as a new "Pending Review" draft; the existing published version remains visible until the edit is approved.

---

#### Story M6.2 — Public Blog Display

| Field | Detail |
|---|---|
| **User story** | As a Customer or Visitor, I want to browse a public blog section with guides, tips, and product news so that I can make informed purchasing decisions. |
| **Priority** | Should |
| **Release** | Phase 2+ |
| **Depends on** | M6.1 |

**Acceptance Criteria**

- [ ] AC-M6.2-1: The blog listing page shows approved articles in reverse chronological order with: title, cover image thumbnail, publication date, and a text excerpt.
- [ ] AC-M6.2-2: Clicking an article opens the full content page with: title, cover image, full body text, tags, author name, and publication date.
- [ ] AC-M6.2-3: The blog supports filtering by tag.
- [ ] AC-M6.2-4: A blog search input returns articles whose title or body contains the search term.
- [ ] AC-M6.2-5: The blog listing is paginated with a configurable page size (default: 10 articles per page).

---

#### Story M6.3 — Product Reviews & Ratings

| Field | Detail |
|---|---|
| **User story** | As a Customer, I want to review and rate products I have purchased so that other shoppers can benefit from my experience. |
| **Priority** | Should |
| **Release** | Phase 2+ |
| **Depends on** | M3.2 |

**Acceptance Criteria**

- [ ] AC-M6.3-1: A Customer who has at least one completed (fully paid and delivered) order line item for a product can submit a review consisting of a 1-to-5 star rating and an optional text comment.
- [ ] AC-M6.3-2: Each customer can submit only one review per product. The customer can update their review at any time.
- [ ] AC-M6.3-3: Reviews enter a "Pending Moderation" status. A Moderator or Branch Admin can approve or reject the review. Only approved reviews appear on the public product page.
- [ ] AC-M6.3-4: The product page displays: an aggregate star rating, total review count, and a paginated list of approved reviews showing the reviewer name, star rating, comment text, and submission date.
- [ ] AC-M6.3-5: A Branch Admin or Central Admin can delete an approved review with a recorded reason. The reviewer is not publicly notified of the deletion, but the removal is recorded in the activity log.
- [ ] AC-M6.3-6: A Visitor or Customer can sort reviews by: newest first, oldest first, highest rating, or lowest rating.

---

### Module 7 — Notifications & Events

**Purpose:** Keep every role informed at the right time — whether it is a customer learning their order has shipped, a branch admin being alerted to low stock, or an auditor reviewing the platform's activity log.

---

#### Story M7.1 — Email & In-App Notifications

| Field | Detail |
|---|---|
| **User story** | As a User, I want to receive timely email and in-app notifications for events that concern me so that I stay informed without having to check the platform constantly. |
| **Priority** | Should |
| **Release** | Phase 2+ |
| **Depends on** | M1.1 |

**Acceptance Criteria**

- [ ] AC-M7.1-1: The following events trigger both an email and an in-app notification: order status change, after-sales request status change, affiliate application status change, and guarantee nearing expiry.
- [ ] AC-M7.1-2: The following events trigger an in-app notification only (no email): low-stock alert (to branch staff), new article pending review (to Branch Admin), and new affiliate application received (to Branch Admin).
- [ ] AC-M7.1-3: A user can view all their in-app notifications from a notification centre accessible on every page. Notifications display: event type, a brief message, timestamp, and a read/unread indicator.
- [ ] AC-M7.1-4: Notifications are displayed in reverse chronological order. The notification centre shows an unread count badge.
- [ ] AC-M7.1-5: A user can mark individual notifications as read. A "Mark all as read" action is also available.
- [ ] AC-M7.1-6: All notification emails and in-app notification messages are delivered in both English and French, matching the user's language preference.

---

#### Story M7.2 — Admin Broadcasts

| Field | Detail |
|---|---|
| **User story** | As a Central Admin, I want to broadcast messages to selected user groups so that I can communicate promotions, policy changes, or important updates across the platform. |
| **Priority** | Could |
| **Release** | Phase 2+ |
| **Depends on** | M7.1 |

**Acceptance Criteria**

- [ ] AC-M7.2-1: A Central Admin can compose a broadcast message with a subject, a body, and a target audience. Target audience options are: all users, all customers, all affiliates, all staff within a specific branch, or all staff across all branches.
- [ ] AC-M7.2-2: Before sending, the admin sees a confirmation summary: subject, body preview, target audience name, and estimated recipient count.
- [ ] AC-M7.2-3: On confirmation, each recipient receives the broadcast as an in-app notification. An email copy is sent only if the admin checks a "Send email copy" option before confirming.
- [ ] AC-M7.2-4: A log of all sent broadcasts is available on the Central Admin dashboard showing: subject, target audience, send date, and recipient count.
- [ ] AC-M7.2-5: A Branch Admin can send broadcasts scoped to their own branch's staff and affiliates only, using the same interface.
- [ ] AC-M7.2-6: Broadcast messages are delivered in both English and French.

---

#### Story M7.3 — Activity Logging & Admin Audit Trail

| Field | Detail |
|---|---|
| **User story** | As a Central Admin, I want major user and admin activities to be logged and viewable in the administration dashboard so that I can review platform activity and investigate issues. |
| **Priority** | Should |
| **Release** | MVP |
| **Depends on** | M1.2 |

**Acceptance Criteria**

- [ ] AC-M7.3-1: The following activities are logged: user registration, login, order placement, payment attempt, payment completion, order status change, product creation/edit/deletion, staff role change, affiliate status change, blog article submission/approval/rejection, and admin broadcast.
- [ ] AC-M7.3-2: Each log entry records: event type, actor (user identifier and role), target (affected resource identifier), timestamp, and source context (e.g., administration dashboard, customer checkout).
- [ ] AC-M7.3-3: The activity log is accessible from the Central Admin dashboard. A Branch Admin can view activity log entries scoped to their own branch only.
- [ ] AC-M7.3-4: The activity log supports filtering by: event type, actor, date range, and branch.
- [ ] AC-M7.3-5: Activity log records older than the configured retention period (minimum 90 days, configurable by Central Admin) are automatically deleted by a scheduled cleanup process.
- [ ] AC-M7.3-6: Activity log records cannot be modified or manually deleted by any user. Only the automated cleanup process removes records past the retention period.
- [ ] AC-M7.3-7: The activity log is operationally distinct from the security audit log (NFR-5.5). The security audit log has its own retention period and is governed separately.

---

### Module 8 — Analytics & KPIs

**Purpose:** Give Branch Admins and the Central Admin actionable visibility into store performance — revenue, orders, products, conversion, and customer retention — to drive data-informed decisions.

---

#### Story M8.1 — Dashboard KPIs

| Field | Detail |
|---|---|
| **User story** | As a Branch Admin or Central Admin, I want a dashboard of key performance indicators so that I can monitor business health at a glance. |
| **Priority** | Should |
| **Release** | Phase 2+ |
| **Depends on** | M3.2, M5.3 |

**Acceptance Criteria**

- [ ] AC-M8.1-1: The analytics dashboard displays the following KPIs, each showing a current-period value and a percentage change from the previous period (same duration comparison): **Total Sales** (sum of all completed order amounts including in-store purchases, in XAF), **Total Orders** (count of completed orders), **Average Order Value** (Total Sales ÷ Total Orders), **Products Sold** (count of distinct product variants sold), and **Affiliate-Referred Sales** (sum of order amounts attributed to an affiliate link).
- [ ] AC-M8.1-2: A date-range picker allows the admin to adjust the reporting period. Default period is the current calendar month.
- [ ] AC-M8.1-3: A Branch Admin sees data scoped to their own branch only. A Central Admin sees aggregate data across all branches, with an optional branch-level filter.
- [ ] AC-M8.1-4: A dashboard chart visualises unit sales volume by product category for the selected period.
- [ ] AC-M8.1-5: Additional KPIs shown are: **Conversion Rate** (completed orders ÷ unique product-page visits, expressed as a percentage) and **Customer Retention Rate** ((number of customers with more than one completed order in the period) ÷ (total unique customers with at least one order in the period), expressed as a percentage).

---

#### Story M8.2 — Report Export

| Field | Detail |
|---|---|
| **User story** | As a Central Admin, I want to export analytics data to a spreadsheet so that I can perform offline analysis and share reports with stakeholders. |
| **Priority** | Could |
| **Release** | Phase 2+ |
| **Depends on** | M8.1 |

**Acceptance Criteria**

- [ ] AC-M8.2-1: An "Export" action on the analytics dashboard generates a downloadable file containing the currently displayed KPIs and chart data.
- [ ] AC-M8.2-2: The exported file format is CSV, encoded in UTF-8 with a BOM for compatibility with common spreadsheet applications.
- [ ] AC-M8.2-3: The export file name includes the report type, branch scope, and selected date range for easy identification.
- [ ] AC-M8.2-4: A Branch Admin can export data for their own branch only. A Central Admin can export data for a single branch or all branches.
- [ ] AC-M8.2-5: The export action is recorded in the activity log (M7.3).

---

### Module 9 — Security & Trust

**Purpose:** Protect user data, prevent abuse, and ensure every transaction occurs over a verified, tamper-resistant channel — building customer trust and meeting regulatory expectations.

---

#### Story M9.1 — Payment Security

| Field | Detail |
|---|---|
| **User story** | As a Customer, I want my payment to be handled securely by the platform so that my financial data is protected and my transaction is reliably processed. |
| **Priority** | Must |
| **Release** | MVP |
| **Depends on** | M3.2 |

**Acceptance Criteria**

- [ ] AC-M9.1-1: All payment transactions are processed through an integrated payment gateway. The platform does not store raw card numbers, Mobile Money PINs, or full payment credentials at any point.
- [ ] AC-M9.1-2: After a payment attempt, the platform verifies the transaction status by confirming with the payment gateway's authoritative response before updating the order status.
- [ ] AC-M9.1-3: A payment receipt is generated for every successful transaction and is accessible from the customer's order detail page. The receipt shows: transaction ID, amount in XAF, payment method, date, and order reference.
- [ ] AC-M9.1-4: If a payment fails, the order remains in "Pending Payment" status. The customer sees a clear error message and can retry payment without creating a duplicate order.
- [ ] AC-M9.1-5: All payment-related communication between the platform and the payment gateway occurs over HTTPS with TLS 1.2 or higher.

---

#### Story M9.2 — Platform-Wide Security Controls

| Field | Detail |
|---|---|
| **User story** | As the Platform, I want to enforce baseline security controls on all traffic and data so that user accounts, sessions, and data are protected from common threats. |
| **Priority** | Must |
| **Release** | MVP |
| **Depends on** | None |

**Acceptance Criteria**

- [ ] AC-M9.2-1: All pages and API endpoints are served exclusively over HTTPS. Any HTTP request is permanently redirected to HTTPS.
- [ ] AC-M9.2-2: Cross-Site Request Forgery (CSRF) protection is enforced on every state-changing request.
- [ ] AC-M9.2-3: All user-submitted content displayed on the platform is sanitised before rendering to prevent Cross-Site Scripting (XSS) attacks.
- [ ] AC-M9.2-4: Repeated failed login attempts from the same source trigger temporary rate limiting. The user is informed that they must wait before retrying.
- [ ] AC-M9.2-5: Session tokens have a defined maximum lifetime. Expired sessions require the user to re-authenticate.
- [ ] AC-M9.2-6: All environment-specific secrets (API keys, database credentials, signing keys) are stored outside the application source code in a secure configuration mechanism. Secrets are never committed to version control.
- [ ] AC-M9.2-7: Role-based access checks are enforced at the data layer — not solely at the UI layer. A direct API request by a user without the required role returns an "Access Denied" response.
- [ ] AC-M9.2-8: Bot and automated abuse protection is applied to all public-facing forms (registration, login, contact, review submission) to prevent automated spam and credential stuffing attacks.

---

### Module 10 — Progressive Web App (PWA)

**Purpose:** Let customers install Tei Store on their mobile devices and access cached content while offline — without requiring a native app store listing.

---

#### Story M10.1 — PWA Install & Offline View

| Field | Detail |
|---|---|
| **User story** | As a Customer, I want to install Tei Store on my phone and still view my recent orders and profile when I lose connectivity so that the app feels reliable even with intermittent networks. |
| **Priority** | Could |
| **Release** | Phase 2+ |
| **Depends on** | M1.1 |

**Acceptance Criteria**

- [ ] AC-M10.1-1: On a supported mobile browser, Tei Store triggers the browser's native "Add to Home Screen" or install prompt when PWA eligibility criteria are met.
- [ ] AC-M10.1-2: The installed app displays the Tei Store brand name, icon, and theme colour in a standalone window rather than the browser's default chrome.
- [ ] AC-M10.1-3: When the device is offline, the user can view (but not modify) their cached: user profile, last 20 orders, and saved/favourited items list.
- [ ] AC-M10.1-4: When the device is offline, any page or feature requiring a live data connection displays a clear "You are offline" message. No blank page, crash, or unhandled error is shown.
- [ ] AC-M10.1-5: Any action that modifies data (adding to cart, placing an order, submitting a review, updating account settings) is blocked while offline. The user is shown a message directing them to reconnect. No actions are queued for later synchronisation.
- [ ] AC-M10.1-6: After a user logs out, the service worker clears all cached private data from that user's session so that it is not accessible to a subsequent user of the same device.

---

### Module 11 — AI Capabilities

**Purpose:** Leverage AI to enhance staff productivity, improve the customer experience, and streamline operational workflows — from product creation to customer support to receipt processing.

---

#### Story M11.1 — AI-Assisted Product Creation

| Field | Detail |
|---|---|
| **User story** | As a Moderator or Branch Admin, I want AI assistance when creating products so that I can generate descriptions, suggest specifications, and reduce data-entry time. |
| **Priority** | Should |
| **Release** | MVP |
| **Depends on** | M2.1 |

**Acceptance Criteria**

- [ ] AC-M11.1-1: When creating a product, staff can invoke an AI assistant to generate a product description from the product name and selected category.
- [ ] AC-M11.1-2: The AI-generated description is presented as a suggestion that the staff member can accept, edit, or discard before saving.
- [ ] AC-M11.1-3: The AI can suggest specification values based on the product name and category (e.g., typical RAM, screen size, battery capacity for a laptop).
- [ ] AC-M11.1-4: All AI-generated content is clearly marked as "AI-generated" until the staff member explicitly confirms it.
- [ ] AC-M11.1-5: If the AI service is unavailable, product creation proceeds normally without AI features; manual entry remains fully functional.

---

#### Story M11.2 — Customer AI Chat

| Field | Detail |
|---|---|
| **User story** | As a Customer or Visitor, I want a chat interface that answers questions about products, policies, and the platform so that I can get guidance without waiting for human support. |
| **Priority** | Should |
| **Release** | MVP |
| **Depends on** | M11.3 |

**Acceptance Criteria**

- [ ] AC-M11.2-1: A chat widget is accessible from all customer-facing pages.
- [ ] AC-M11.2-2: The chat responds to questions about products (availability, specifications, pricing), platform policies (returns, repairs, delivery), and general guidance (how to order, how to pay).
- [ ] AC-M11.2-3: The chat clearly identifies itself as an AI assistant, not a human agent.
- [ ] AC-M11.2-4: When the chat cannot answer a question or has low confidence, it advises the user to contact support. The chat does not fabricate information.
- [ ] AC-M11.2-5: Chat conversations are not stored beyond the active session unless the user is authenticated and opts in to saving chat history.
- [ ] AC-M11.2-6: The chat does not reveal internal business data, staff notes, admin analytics, or other users' information under any circumstances.

---

#### Story M11.3 — Admin Knowledge Base Upload

| Field | Detail |
|---|---|
| **User story** | As a Central Admin or Branch Admin, I want to upload documents that the AI chat uses as its knowledge source so that the AI provides accurate, up-to-date answers. |
| **Priority** | Should |
| **Release** | MVP |
| **Depends on** | M1.2 |

**Acceptance Criteria**

- [ ] AC-M11.3-1: An admin can upload documents (PDF, DOCX, TXT) to the AI knowledge base from the administration dashboard.
- [ ] AC-M11.3-2: Each uploaded document displays: file name, upload date, uploaded-by name, and current status (Processing / Active / Failed).
- [ ] AC-M11.3-3: An admin can remove a document from the knowledge base. Removed documents are no longer used by the AI chat.
- [ ] AC-M11.3-4: The AI chat (M11.2) uses only active knowledge base documents and published product data as its context. It does not access arbitrary external content.
- [ ] AC-M11.3-5: Knowledge base documents are scoped: a Branch Admin's uploads are available to chats related to their branch; a Central Admin's uploads apply globally.

---

#### Story M11.4 — AI Analytics Insights

| Field | Detail |
|---|---|
| **User story** | As a Branch Admin or Central Admin, I want the AI to generate natural-language summaries and insights from my analytics data so that I can understand trends without manually analysing charts. |
| **Priority** | Could |
| **Release** | Phase 2+ |
| **Depends on** | M8.1 |

**Acceptance Criteria**

- [ ] AC-M11.4-1: From the analytics dashboard (M8.1), an admin can request an AI-generated summary of the currently displayed KPIs.
- [ ] AC-M11.4-2: The AI summary includes: key trends, notable changes from the previous period, and suggested areas of attention.
- [ ] AC-M11.4-3: The summary is clearly labelled "AI-generated insight" with a disclaimer that it should be verified against actual data.
- [ ] AC-M11.4-4: AI analytics use only the admin's scoped data (branch-scoped for Branch Admin, global for Central Admin).
- [ ] AC-M11.4-5: If the AI service is unavailable, the regular analytics dashboard remains fully functional with no degradation to existing charts and KPIs.

---

#### Story M11.5 — AI Receipt Scanning

| Field | Detail |
|---|---|
| **User story** | As a Moderator or Employee, I want to scan a physical receipt and have the AI extract purchase details so that I can record on-site sales that were not made through the platform. |
| **Priority** | Should |
| **Release** | MVP |
| **Depends on** | M1.2 |

**Acceptance Criteria**

- [ ] AC-M11.5-1: An employee can upload or photograph a physical receipt from the administration dashboard.
- [ ] AC-M11.5-2: The AI extracts from the receipt: items, quantities, unit prices, total amount, and date of purchase.
- [ ] AC-M11.5-3: The extracted data is presented for employee review and correction before the record is submitted.
- [ ] AC-M11.5-4: The employee selects the purchaser by one of: searching for an existing platform user, marking the purchase as from a non-platform customer, or selecting the affiliate who facilitated the sale.
- [ ] AC-M11.5-5: If an affiliate is selected, the sale is attributed to that affiliate for commission purposes. Employee attestation is sufficient; no secondary affiliate confirmation is required.
- [ ] AC-M11.5-6: The purchase is recorded as an "In-Store Purchase" with a distinct order type from online orders. In-store purchases are included in all relevant sales analytics and KPI calculations (M8.1).
- [ ] AC-M11.5-7: If AI extraction fails or returns low-confidence results, the employee is prompted to enter data manually. The system does not block in-store purchase recording due to AI failure.
- [ ] AC-M11.5-8: The original receipt image is stored as an attachment on the recorded purchase record for audit purposes.

---

## 6. Non-Functional Requirements

### NFR-1 — Performance

| ID | Requirement |
|---|---|
| NFR-1.1 | Server-side page responses (HTML or JSON) must complete within 500 ms at the 95th percentile under normal load. |
| NFR-1.2 | The product search endpoint must return results within 800 ms at the 95th percentile for up to 50 000 active product records. |
| NFR-1.3 | A Lighthouse performance score of 70 or above must be maintained on the home page and product listing page when tested on a simulated 4G mobile connection. |
| NFR-1.4 | AI-assisted operations (product description generation, receipt scanning) must return an initial response within 10 seconds. A loading indicator is shown throughout. |

### NFR-2 — Availability & Recovery

| ID | Requirement |
|---|---|
| NFR-2.1 | The platform must target 99.5 % monthly uptime, measured from an external health-check endpoint. |
| NFR-2.2 | Scheduled maintenance windows must be announced to all users at least 48 hours in advance via the notification system. |
| NFR-2.3 | Database backups must be performed daily with a recovery point objective (RPO) of 24 hours. |

### NFR-3 — Internationalisation _(i18n)_

| ID | Requirement |
|---|---|
| NFR-3.1 | All customer-facing and admin-facing text must be externalised into translation files. No user-visible string is hard-coded. |
| NFR-3.2 | English is the default language. French is supported with full parity: every label, message, notification, and email template must have a French equivalent. |
| NFR-3.3 | A language switcher is accessible from every page and persists the user's selection across sessions. |
| NFR-3.4 | All monetary values are displayed in XAF as whole numbers with the "FCFA" label. Decimal places are never shown to users. |

### NFR-4 — Observability & Monitoring

| ID | Requirement |
|---|---|
| NFR-4.1 | Application logs must include a correlation identifier that traces a request from the entry point through all downstream operations. |
| NFR-4.2 | Log levels (debug, info, warn, error) must be configurable per environment without redeploying the application. |
| NFR-4.3 | Unhandled application errors must be captured and reported to a centralised error-tracking and monitoring service in real time. |
| NFR-4.4 | Error reports must include: stack trace, user context (role, user ID), browser/device information, and the request URL. |
| NFR-4.5 | Application performance metrics (response times, error rates, throughput) must be continuously collected and reported to a centralised monitoring service. |

### NFR-5 — Security Baseline

| ID | Requirement |
|---|---|
| NFR-5.1 | All data in transit must be encrypted using TLS 1.2 or higher. |
| NFR-5.2 | Sensitive data at rest (personal identifiable information, payment references) must be encrypted using AES-256 or equivalent. |
| NFR-5.3 | The application must set secure HTTP response headers: `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, and a `Content-Security-Policy` baseline. |
| NFR-5.4 | Dependencies must be scanned for known vulnerabilities on a regular schedule and before each production release. |
| NFR-5.5 | A security audit log records the following events: login, failed login, role change, order placement, payment attempt. Entries include actor, action, target, and timestamp. The security audit log is immutable, retained for a minimum of 12 months, and readable only by Central Admin. |

### NFR-6 — Accessibility

| ID | Requirement |
|---|---|
| NFR-6.1 | All customer-facing pages must conform to WCAG 2.1 Level AA success criteria. |
| NFR-6.2 | All interactive elements must be reachable and operable via keyboard navigation alone. |
| NFR-6.3 | All images must include meaningful alternative text. Decorative images must have an empty `alt` attribute. |

### NFR-7 — Privacy & Regulatory

| ID | Requirement |
|---|---|
| NFR-7.1 | A publicly accessible privacy policy page describes what personal data is collected, how it is used, and how long it is retained. |
| NFR-7.2 | A Customer can request deletion of their account and associated personal data. The deletion process removes personal data within 30 calendar days while preserving anonymised transaction records for financial integrity. |
| NFR-7.3 | Personal data is not shared with third parties beyond what is necessary for payment processing and delivery. |
| NFR-7.4 | User consent must be obtained before processing any data beyond what is strictly necessary for platform operation. |

### NFR-8 — Theming

| ID | Requirement |
|---|---|
| NFR-8.1 | All customer-facing pages support three theme modes: light, dark, and system (follows device preference). |
| NFR-8.2 | The user's theme preference is persisted across sessions. |
| NFR-8.3 | The administration dashboard supports the same three theme modes plus additional configurable colour theme variants. |
| NFR-8.4 | Theme switching takes effect immediately without requiring a page reload. |

---

## 7. Cameroon Operational Constraints

This section documents constraints arising from the Cameroonian market context — payment infrastructure, language expectations, connectivity conditions, branch-level inventory, and regulatory requirements.

### CON-1 — Payment Methods

| ID | Constraint |
|---|---|
| CON-1.1 | Mobile Money (MTN Mobile Money, Orange Money) must be available as a checkout option alongside card payment. |
| CON-1.2 | The payment gateway must support XAF as the transaction currency. Multi-currency conversion is not required. |
| CON-1.3 | Payment confirmation relies on the gateway's callback or polling mechanism. The platform must handle delayed confirmations gracefully — the order sits in "Pending Payment" until confirmation is received. |

### CON-2 — Language & Locale

| ID | Constraint |
|---|---|
| CON-2.1 | English and French are equally supported. All new features must ship with both language variants before being considered "Done" (see §4.5). |
| CON-2.2 | Date formats follow `DD/MM/YYYY`. Time is displayed in 24-hour format. |

### CON-3 — Installment Payment

| ID | Constraint |
|---|---|
| CON-3.1 | Installment payment is available on any order. The minimum initial payment amount is defined by the admin and displayed before checkout confirmation. |
| CON-3.2 | An order placed under installment has a "Partially Paid" status. Items are reserved but not dispatched until the full balance is settled. |
| CON-3.3 | Each product or product category has an admin-configurable installment payment deadline. The deadline is displayed to the customer before order confirmation. The deadline applies to the full order amount, not per item — even when items span multiple branches. |
| CON-3.4 | If the payment deadline passes and the full balance has not been paid, the order is flagged for admin review. The order is not automatically cancelled. |
| CON-3.5 | The full installment payment history for an order — each payment amount, date, and running outstanding balance — is visible to both the customer and the admin on the order detail page. |

### CON-4 — Branch Inventory & Cross-Branch Fulfillment

| ID | Constraint |
|---|---|
| CON-4.1 | Inventory is tracked per branch. Each branch manages its own stock levels independently. Products may be stocked at multiple branches (see M2.1, AC-M2.1-8). |
| CON-4.2 | Cross-branch fulfillment is supported: when a customer orders a product, the system determines the fulfilling branch as follows: (a) if the customer's shipping address is in the same city as a branch that has the item in stock, that branch fulfills the item; (b) if the local branch does not have the item in stock, or there is no branch in the customer's city, the item is shipped from another branch that has stock. |
| CON-4.3 | A single order may contain items fulfilled by different branches. Each item carries its own fulfillment status and fulfilling branch identifier. |
| CON-4.4 | A shipping fee, configured by a Branch Admin or Central Admin, is applied to each item whose fulfilling branch is in a different city than the customer's shipping address city. Items fulfilled from the customer's own city incur no shipping fee. The total shipping fee is displayed before checkout confirmation. |
| CON-4.5 | A Moderator or Branch Admin can adjust inventory only for their own branch. A Central Admin can view inventory across all branches; any stock adjustment is attributed to the specific branch selected. |

### CON-5 — Connectivity

| ID | Constraint |
|---|---|
| CON-5.1 | The platform must remain usable on 3G connections typical of Cameroonian mobile networks. Critical pages (home, product listing, cart, checkout) must transfer less than 1.5 MB of data on initial load. |
| CON-5.2 | Images must be served in modern compressed formats and use lazy loading. The platform must provide responsive image sizing for mobile devices. |

### CON-6 — Cookie Consent

| ID | Constraint |
|---|---|
| CON-6.1 | A cookie consent banner is displayed on the user's first visit to the platform. |
| CON-6.2 | The user's consent response is stored locally on their device. |
| CON-6.3 | No non-essential cookies or tracking scripts are loaded until the user provides consent. |

---

## 8. Traceability Matrix

| Story ID | Module | Priority | Release | AC Count | Dependencies |
|---|---|---|---|---|---|
| M1.1 | User Management & Roles | Must | MVP | 9 | None |
| M1.2 | User Management & Roles | Must | MVP | 9 | M1.1 |
| M2.1 | Product & Catalog Management | Must | MVP | 8 | M1.2 |
| M2.2 | Product & Catalog Management | Should | MVP | 5 | M2.1 |
| M2.3 | Product & Catalog Management | Must | MVP | 5 | M2.1 |
| M3.1 | Shopping & Checkout | Must | MVP | 6 | M2.1, M2.2 |
| M3.2 | Shopping & Checkout | Must | MVP | 12 | M3.1, M1.1 |
| M4.1 | Guarantee, Repairs & Returns | Must | MVP | 7 | M3.2 |
| M4.2 | Guarantee, Repairs & Returns | Must | MVP | 8 | M2.1, M3.2 |
| M4.3 | Guarantee, Repairs & Returns | Should | MVP | 5 | M4.1 |
| M5.1 | Affiliate System | Should | MVP | 7 | M1.1 |
| M5.2 | Affiliate System | Should | Phase 2+ | 3 | M5.1 |
| M5.3 | Affiliate System | Could | Phase 2+ | 5 | M5.2 |
| M5.4 | Affiliate System | Could | Phase 2+ | 4 | M5.2, M5.3 |
| M5.5 | Affiliate System | Should | Phase 2+ | 5 | M5.1 |
| M5.6 | Affiliate System | Should | Phase 2+ | 6 | M5.1 |
| M6.1 | Content & Blog System | Should | Phase 2+ | 5 | M1.2 |
| M6.2 | Content & Blog System | Should | Phase 2+ | 5 | M6.1 |
| M6.3 | Content & Blog System | Should | Phase 2+ | 6 | M3.2 |
| M7.1 | Notifications & Events | Should | Phase 2+ | 6 | M1.1 |
| M7.2 | Notifications & Events | Could | Phase 2+ | 6 | M7.1 |
| M7.3 | Notifications & Events | Should | MVP | 7 | M1.2 |
| M8.1 | Analytics & KPIs | Should | Phase 2+ | 5 | M3.2, M5.3 |
| M8.2 | Analytics & KPIs | Could | Phase 2+ | 5 | M8.1 |
| M9.1 | Security & Trust | Must | MVP | 5 | M3.2 |
| M9.2 | Security & Trust | Must | MVP | 8 | None |
| M10.1 | Progressive Web App (PWA) | Could | Phase 2+ | 6 | M1.1 |
| M11.1 | AI Capabilities | Should | MVP | 5 | M2.1 |
| M11.2 | AI Capabilities | Should | MVP | 6 | M11.3 |
| M11.3 | AI Capabilities | Should | MVP | 5 | M1.2 |
| M11.4 | AI Capabilities | Could | Phase 2+ | 5 | M8.1 |
| M11.5 | AI Capabilities | Should | MVP | 8 | M1.2 |

**Summary:**
- Total stories: 32
- Total acceptance criteria: 196
- MVP stories: 18 (Must: 11, Should: 7)
- Phase 2+ stories: 14 (Should: 8, Could: 6)

---

## 9. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Mobile Money gateway downtime blocks all checkout. | Medium | High | Implement retry with exponential back-off on payment callbacks. Display a clear "payment temporarily unavailable" message. Support card as an alternative. |
| R2 | Network outages in certain Cameroonian cities degrade user experience. | High | Medium | PWA caching for read-only access. Compressed assets and lazy loading. Design for graceful degradation. |
| R3 | Affiliate fraud — self-referrals or link manipulation. | Medium | Medium | Last-click attribution only. Self-referral detection (customer and affiliate same account). Configurable attribution window. Admin review of anomalous referral patterns. |
| R4 | Stock discrepancy between physical store and platform inventory. | Medium | Medium | Near-real-time stock decrement on order completion. In-store purchase recording (M11.5) keeps platform inventory aligned with physical sales. Low-stock alerts. |
| R5 | Content moderation backlog — reviews and articles stuck in pending state. | Low | Medium | Dashboard surfacing pending-review counts. Notification to Branch Admin on new submissions. |
| R6 | Scope creep from frequent SRS iterations. | Medium | Medium | Agile ceremonies: sprint reviews, backlog grooming, MoSCoW re-prioritisation at each iteration boundary. |
| R7 | Data privacy breach due to insufficient encryption or access control. | Low | Critical | Encryption at rest and in transit (NFR-5). Role-based access at the data layer (M9.2). Security audit log (NFR-5.5). Regular dependency scanning (NFR-5.4). |
| R8 | XAF formatting errors causing customer confusion. | Low | Medium | Centralised currency formatter. Automated tests covering edge cases (zero, large amounts). |
| R9 | French translation parity lagging behind English. | Medium | Medium | "Done" definition requires both translations (§4.5). Translation completeness check in CI pipeline. |
| R10 | AI-generated content may be inaccurate or misleading (hallucination). | Medium | High | All AI output is presented as a suggestion requiring human confirmation. AI chat discloses its AI nature and refuses to fabricate answers. Knowledge base scoping limits context. |
| R11 | Cross-branch shipping coordination may delay delivery timelines. | Medium | Medium | Per-item fulfillment tracking with shipping city transparency. Admin-configured shipping fees incentivise local-stock ordering. Clear estimated delivery display at checkout. |
| R12 | AI service unavailability degrades staff and customer workflows. | Medium | Medium | All AI features degrade gracefully — manual fallbacks exist for every AI-assisted flow (M11.1-5, M11.5-7). No feature is blocked solely by AI availability. |

---

## 10. Open Assumptions

| ID | Assumption | Status |
|---|---|---|
| A1 | A single payment gateway integration covers both Mobile Money and card transactions. | Resolved |
| A2 | Branch Admins will manage their own product catalogs and inventory without a dedicated data-entry team. | Open |
| A3 | Delivery is managed by each branch independently; the platform does not integrate with a shipping carrier API. Shipping fees for cross-branch orders are flat-rate and admin-configured, not calculated dynamically. | Resolved |
| A4 | A Central Admin can change the role of any staff member directly from the staff management page. Role changes take effect on next request. | Resolved |
| A5 | The platform will launch with four branches (Bamenda, Buea, Yaoundé, Douala) and must support addition of new branches without structural changes. | Open |
| A6 | Products may be stocked at multiple branches. Each branch manages its own stock level independently for shared products. Cross-branch fulfillment uses shared product identity to determine which branch can fulfill an item. | Resolved |
| A7 | Initial product data will be entered manually; no CSV import or bulk upload is required for MVP. | Open |
| A8 | Douala is established as the fourth operational branch at launch. | Resolved |
| A9 | AI features depend on an external model service. If the service is unavailable, all AI-assisted workflows degrade gracefully to manual operation. No platform feature is blocked solely by AI availability. | Resolved |

---

## 11. Iteration Protocol

This document follows a structured delta protocol for iterating on requirements. When proposing a change:

1. **Classify** — Is the change: a new story, a revision to an existing AC, a deletion, or a re-prioritisation?
2. **Locate** — Reference the affected Story ID and AC ID(s).
3. **Describe** — Provide the exact replacement text (for revisions) or the full new story (for additions).
4. **Impact** — Note any cascading effects on dependent stories, the traceability matrix, or the risk register.
5. **Approve** — Changes are not merged into this document until the Product Owner acknowledges.

Version numbers increment by 0.1 for minor iterations and by 1.0 for milestone baselines (e.g., "MVP Baseline" → v1.0).

---

## 12. Glossary

| Term | Definition |
|---|---|
| AC | Acceptance Criterion — a binary, testable condition for a user story |
| Affiliate / Hunter Man | A user who promotes products via unique links and earns commission on referred sales |
| Branch | A physical The Eye Informatique retail location with its own staff, products, and inventory |
| Central Admin | The highest system role; oversees all branches, users, and global settings |
| CON | Cameroon Operational Constraint — a business or environmental rule specific to the Cameroon market |
| Customer | A registered user who shops on the platform |
| FCFA | Franc CFA — the displayed currency label for Central African Franc (XAF) |
| In-Store Purchase | A sale that occurred at a physical branch, recorded on the platform via receipt scanning (M11.5) for analytics and affiliate attribution purposes |
| Knowledge Base | A collection of admin-uploaded documents used by the AI chat as its authoritative context source |
| Moderator / Employee | Branch staff who manage product listings, content, and in-store receipt entries for their assigned branch |
| MoSCoW | A prioritisation framework: Must, Should, Could, Won't |
| MVP | Minimum Viable Product — the initial public release |
| NFR | Non-Functional Requirement — a system-quality or cross-cutting constraint |
| PWA | Progressive Web App — a web application installable on devices with optional offline capabilities |
| SRS | Software Requirements Specification |
| XAF | ISO 4217 code for Central African CFA Franc |
