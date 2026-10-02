# Bulk Asset Management

## Existing architecture

The active application is Next.js 15 App Router / React 19 with Server Actions, PostgreSQL and Prisma 7. Laravel files also exist but are not the active dashboard implementation. Authentication uses the existing signed HTTP-only session cookie; roles and direct permissions come from the database. Asset CRUD requires `assets.manage`, list access requires `assets.view`, and report export requires `reports.view`. Bulk uses the same permission checks; no role grants or new permission names are introduced.

Asset has a unique `code`, nullable non-unique `serialNumber`, optional master-data relations, cost/date/description, and `deletedAt`. User and PIC are separate relations. Brand, Model and Notes are not Asset fields and are not invented. Individual CRUD, photo storage, navigation and authentication remain unchanged.

## Files

- `src/lib/asset-bulk-format.ts`: bounded XLSX/CSV parsing, headers, field validation, workbook writer, shared types.
- `src/lib/asset-bulk-template.ts`: ExcelJS template writer, Reference Data sheet, named ranges and dropdown validation.
- `src/lib/asset-bulk.ts`: database duplicate checks, templates, preview persistence, confirmation, audit/report.
- `src/app/(dashboard)/dashboard/assets/bulk-actions.ts`: authenticated Server Actions (the backend API pattern already used for CRUD).
- `src/components/assets/asset-bulk-client.tsx`: modal, drag/drop, preview/results, selection and downloads.
- `src/app/(dashboard)/dashboard/assets/page.tsx`: integration with the existing asset list and report export route.
- `src/components/tables/data-table.tsx`: column headings accept ReactNode for checkbox; table styling unchanged.
- `prisma/schema.prisma` and migration `20260930090000_asset_bulk_jobs`: additive preview/audit table, plus User relation.
- `eslint.asset-bulk.config.mjs`, `scripts/asset-bulk.test.ts`: scoped checks and integration tests.

## Setup

Uses `exceljs` for templates with Excel Data Validation, the existing `xlsx` reader/report writer, Prisma, and existing session configuration. No new environment variables.

```powershell
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Restart an already-running dev server after generating the new Prisma client. The migration creates `asset_bulk_jobs`; it does not alter existing Asset rows or add uniqueness constraints that could break legacy data.

## Backend actions

- `previewAssetBulkAction(FormData)`: file, mode IMPORT/UPDATE, and selected IDs for update.
- `previewAssetDeleteAction(ids)`: prepare deletion preview, no asset mutation.
- `confirmAssetBulkAction(jobId)`: process persisted preview owned by the current user.
- `downloadAssetBulkTemplateAction(mode, ids?)`: base64 Excel download.
- `downloadAssetBulkReportAction(jobId)`: owner-restricted result report.

Every action requires `assets.manage`, including template and report downloads. Next.js Server Actions retain their existing same-origin protections. Client-supplied preview rows, status, actor and field changes are never trusted for confirmation.

## Template

Sheets: `Import Asset` (or `Update Asset`), `Reference Data`, and `Instructions`. Reference Data contains ID/Name blocks queried from the database on every download. Instructions contains Field/Required/Type/Instruction columns, without hardcoded master choices.

Dropdown sources: Category → `asset_categories`, Class → `asset_classes`, Status → `asset_statuses`, Location → `asset_locations`, Department → `departments`, Asset User → `asset_users`, PIC → `person_in_charges`. These actual Prisma master models have no active/inactive fields, so no invented active filter is applied. Asset also relates to Unit, Warranty and VendorContract; those are outside the existing bulk columns and remain unchanged, as does the system-managed archivedBy relation.

Each master column has Excel list validation (Stop error) from rows 2–201, backed by a workbook named range pointing at the corresponding Name column in Reference Data. Empty masters reference a blank cell and remain optional. No master values are hardcoded. Template update cells also contain names rather than IDs.

Import columns: Asset Code, Asset Name, Category, Class, Status, Location, Department, Asset User, PIC, Description, Serial Number, Cost, Purchase Date.

Update columns: Asset Code, Asset Name, Category, Class, Status, Location, Department, Asset User, PIC, Description. Templates contain selected assets' current values. Code is an identifier and cannot be renamed. ID, creation information, financial data and history are not bulk-editable.

- Asset Code and Asset Name headers and values are mandatory.
- Other fields are optional, matching the existing nullable database columns.
- Master values accept exact, unambiguous names and are mapped to foreign-key IDs on the server. Unknown values fail with `Category 'value' does not exist in master data.` (or the applicable field). Duplicate names are rejected as ambiguous; an administrator must distinguish them. Existing templates containing codes/IDs should be downloaded again and filled with names.
- Empty optional update cells clear those fields. Removing an optional column from the file preserves that field. Removing Asset Code or Asset Name headers is invalid.
- Empty import status defaults to ACTIVE when available, as in individual create.
- Dates: YYYY-MM-DD or genuine Excel date cells. Cost: nonnegative, up to 13 integer digits and two fractional digits using a decimal point.
- Keep identifiers as text, especially serial numbers with leading zeros. Formula cells are rejected.
- Up to 200 data rows, 2 MB upload, and 20 MB declared XLSX decompressed content. Large batches should be split. ZIP64/oversized archives and unknown/duplicate headers are rejected.

## Safety and behavior

Preview never mutates assets. The server stores the normalized preview with owner, filename, mode and a 30-minute expiry. Confirmation reads that server record and revalidates. Only originally Ready rows can execute. Completed jobs return their recorded result if retried, without replaying writes.

Code and nonempty serial numbers are checked exactly (case-sensitive) within the file and against all assets, including archived/soft-deleted assets. The first file occurrence wins; subsequent duplicates are skipped. Asset name alone is never a duplicate key. Import does not overwrite or generate replacement codes.

Confirmation uses one bounded transaction, a PostgreSQL asset-table write lock and per-row savepoints. Duplicate checking and writes cannot race with concurrent writes during the batch. Invalid/duplicate rows are skipped; an individual row failure rolls back its own writes and history. A whole-transaction failure rolls back the batch and leaves the preview retryable. Locks time out after five seconds; transactions after sixty seconds. Because serial number is not UNIQUE in the existing schema, this feature enforces serial uniqueness during bulk import without changing individual CRUD rules.

Update/deletion previews store each asset's `updatedAt`; concurrent changes cause that row to fail with a request to preview again. Master names are revalidated against current database data at confirmation; the IDs resolved during preview are also compared. Renamed/deleted masters or names rebound to a different ID fail rather than silently changing the relationship. Master tables are read-locked during confirmation to keep that check consistent with the write. Download a new template after master changes; existing downloaded workbooks are snapshots, not live database connections. Updates are restricted to selected assets. Deletion requires an explicit second-step confirmation and only sets `deletedAt`; photos and history are retained.

`AssetHistory` records the actor, timestamp, existing CREATED/UPDATED/DELETED action, bulk job ID, filename, changed fields (before/after) and deletion timestamp where applicable. `asset_bulk_jobs` records filename, actor, total, success, duplicate, validation/processing failure counts and all row outcomes, even when zero assets succeeded. This is additive audit data; there is no automatic purge.

`Import_Result.xlsx` contains Row Number, Asset Code, Asset Name, Result, Error Type, Error Message for all outcomes. Values are written as literal cells, not Excel formulas.

## Manual testing

1. Sign in as a user with `assets.view` and `assets.manage`. Open Assets; download Import Template.
2. Add one valid row, duplicate code/serial rows, an empty required field and an unknown master code. Upload XLSX and repeat with CSV.
3. Check summary/reasons; verify nothing is inserted before confirmation. Confirm; only Ready rows should succeed. Download Error Report.
4. Re-upload an existing code/serial. Confirm it is skipped, including codes of soft-deleted assets.
5. Select rows and Select All; buttons should be disabled with no selection. Select All is limited to the first 200 visible rows. Changing filters resets selection.
6. Bulk Update → download selected template → edit Location/Name → upload → inspect before/after → confirm. Optional blank cells clear values; omitted optional columns retain values.
7. Edit an asset separately after preview; confirmation must reject that stale row.
8. Delete Selected → Preview → Cancel: no deletion. Repeat and press Delete: rows disappear from the active list, but remain soft-deleted in DB with history/photos intact.
9. A view-only user should see no import/selection controls. All five backend actions must reject a caller lacking `assets.manage`, even if invoked directly. Report downloads additionally restrict ownership.
10. Verify existing create/edit/detail/photos/archive/filter/export flows. Export uses the existing report route and its `reports.view` permission.

Automated checks:

```powershell
npx tsx scripts/asset-bulk.test.ts --database
npm run typecheck
npx eslint --config eslint.asset-bulk.config.mjs src/lib/asset-bulk.ts src/lib/asset-bulk-format.ts src/components/assets/asset-bulk-client.tsx src/components/tables/data-table.tsx 'src/app/(dashboard)/dashboard/assets/bulk-actions.ts' 'src/app/(dashboard)/dashboard/assets/page.tsx' scripts/asset-bulk.test.ts
npm run build
```

The opt-in database test creates uniquely prefixed test records and removes only those records in cleanup. It covers actual preview/confirm transactions, partial success, duplicates and concurrency, ownership, update scope/stale data, soft deletion, templates/reports and history. Browser interactions and live role sessions still require the manual checks above.
