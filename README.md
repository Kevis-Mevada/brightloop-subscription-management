# Brightloop: Multi-Tenant SaaS Subscription Management System

Subscription Management System to run plans, recurring billing, payments and revenue reporting in one place. Built for Odoo x FLUX Lucknow Hackathon ‘26.

Brightloop is a production-oriented, multi-tenant SaaS Subscription Management System (SMS) built with Next.js App Router, TypeScript, Tailwind CSS, PostgreSQL, and Prisma ORM.

---

## 🚀 Key Features & Architectural Modules

1. **Multi-Tenant Architecture**
   - Independent organizations (`Organization`) with unique slugs, currencies, and timezones.
   - Strict server-side tenant isolation across all queries, mutations, and REST endpoints.
   - Cross-tenant data leakage prevention and IDOR protection.

2. **Role-Based Access Control (RBAC)**
   - `SUPER_ADMIN`: Cross-organization visibility, platform health statistics, tenant suspension/activation.
   - `ORGANIZATION_ADMIN`: Administrative control over organization resources, plans, products, customers, and billing.
   - `STAFF`: Day-to-day operations (quotations, subscriptions, invoices, and payments).
   - `CUSTOMER`: Restricted to the dedicated Customer Self-Service Portal (`/portal`), scoped only to their own customer ID.

3. **Authentication & Security**
   - Secure session management using signed JWT tokens stored in httpOnly, SameSite cookies.
   - Password hashing with bcrypt.
   - Strict password complexity: Minimum 9 characters, at least one uppercase letter, one lowercase letter, and one special character (`!@#$%^&*`).

4. **Product Catalog & Variant Pricing**
   - Complete CRUD for Physical, Digital, and Service products.
   - Product variants with dynamic price adjustments (e.g. *Odoo Brand Integration* adds **+$560.00** to base price, following the specification example).

5. **Subscription Plans**
   - Daily, Weekly, Monthly, and Yearly recurrence intervals.
   - Minimum quantity rules, validity windows, auto-close triggers, and pause / early cancellation policies.

6. **Customer CRM & Portals**
   - Comprehensive customer records with billing and shipping addresses.
   - 1-click generation of customer portal login accounts.

7. **Quotation Lifecycle & Conversion**
   - Multi-line quotations with live line-item tax and discount recalculations.
   - State machine: `DRAFT` &rarr; `SENT` &rarr; `ACCEPTED` / `REJECTED` / `EXPIRED`.
   - **1-Click Conversion**: Automatically converts accepted quotations into active subscriptions without record duplication.

8. **Deterministic Recurring Billing Engine**
   - Automatic identification of due subscriptions (`nextBillingDate <= now()`).
   - Idempotency key generation: `SUB-{id}-{periodStart}-{periodEnd}`.
   - Atomic database transactions for invoice generation, period advancement, and audit logging.
   - Prevents duplicate invoices and handles closed/paused lifecycle state exclusions.

9. **Invoicing & Taxes**
   - Auto and manual invoice generation with unique sequential numbers (`INV-YYYY-XXXXX`).
   - Printable HTML & PDF invoice modal with printable stylesheets.
   - Configurable percentage-based taxes and tax-inclusive / tax-exclusive pricing rules.

10. **Discounts & Promotions**
    - Fixed amount ($) and percentage (%) coupon codes.
    - Spend thresholds, usage limits, and expiration date checks.

11. **Payments & Reconciliation**
    - Multi-method payment recording (Credit Card, Wire Transfer, Cash, Other).
    - Prevents overpayments against invoice balances.
    - Automatically marks invoices as `PAID` when balance is cleared.

12. **Customer Self-Service Portal (`/portal`)**
    - Dedicated view for customers to view active subscriptions, renewal dates, download PDF invoices, and request pause/cancellation.

13. **Transactional Emails via Resend**
    - Welcome, verification, invoice delivery, payment receipts, and upcoming renewal reminder email templates.

14. **Real-Time Dashboards & Financial Reports**
    - Live calculated MRR (Monthly Recurring Revenue) and ARR (Annual Recurring Revenue).
    - Lifetime revenue collected, accounts receivable outstanding, and overdue invoice tracking.
    - CSV report export.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Prisma ORM
- **Icons**: Lucide Icons
- **Email**: Resend API
- **Testing**: Vitest & Playwright
- **Containerization**: Docker & Docker Compose

---

## 🗄️ Database Entity Relationship (ER) Summary

```mermaid
erDiagram
    Organization ||--o{ User : has
    Organization ||--o{ Customer : owns
    Organization ||--o{ Product : owns
    Organization ||--o{ Plan : defines
    Organization ||--o{ Quotation : issues
    Organization ||--o{ Subscription : manages
    Organization ||--o{ Invoice : bills
    Organization ||--o{ Payment : receives
    Organization ||--o{ TaxRule : configures
    Organization ||--o{ DiscountRule : configures

    Customer ||--o| User : portal_login
    Customer ||--o{ Quotation : receives
    Customer ||--o{ Subscription : subscribes
    Customer ||--o{ Invoice : billed_to
    Customer ||--o{ Payment : pays

    Product ||--o{ ProductVariant : has
    Plan ||--o{ Subscription : instantiates
    Quotation ||--o{ QuotationLine : contains
    Quotation ||--o| Subscription : converts_to

    Subscription ||--o{ SubscriptionLine : contains
    Subscription ||--o{ SubscriptionHistory : logs
    Subscription ||--o{ Invoice : generates

    Invoice ||--o{ InvoiceLine : contains
    Invoice ||--o{ Payment : settles
```

---

## 📦 Getting Started

### 1. Prerequisites
- Node.js >= 18.18.0
- PostgreSQL database
- Resend API key

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
RESEND_API_KEY="re_your_api_key_here"
EMAIL_FROM="Brightloop <onboarding@resend.dev>"
JWT_SECRET="your-32-character-secret-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Setup & Seeding
```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Seed development database
npm run db:seed
```

### 4. Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the landing page.

---

## 🔑 Seed User Accounts (Password: `Password123!`)

| Role | Email | Scope |
| :--- | :--- | :--- |
| **Super Admin** | `admin@brightloop.io` | Global Platform & Organization Oversight |
| **Org Admin** | `john@acme.com` | Acme Cloud Technologies Workspace |
| **Staff Member** | `sarah.ops@acme.com` | Acme Cloud Operations |
| **Customer Portal** | `alex@techstart.io` | TechStart Innovations Portal (`/portal`) |
| **Tenant B Admin** | `elena@nexus.eu` | Nexus Global Solutions (Isolation Verification) |

---

## 🧪 Testing Suite

### Unit & Integration Tests (Vitest)
```bash
npm run test
```
Verifies:
- Password complexity requirements (>= 9 chars, upper, lower, special char).
- Bcrypt password hashing & token verification.
- Deterministic recurring billing date advancement & idempotency key generation.
- Cross-tenant security isolation between Acme Cloud and Nexus Global.
- Email HTML template generation.

### End-to-End Tests (Playwright)
```bash
npm run test:e2e
```

---

## 🐳 Docker Deployment

To build and run Brightloop using Docker:
```bash
docker-compose up --build -d
```

