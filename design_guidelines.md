# Design Guidelines: Contract Management System

## Design Approach

**Selected Framework**: Carbon Design System (IBM)
**Rationale**: This enterprise contract management application requires a robust, data-centric design language. Carbon excels at information-dense interfaces, complex tables, forms, and administrative workflows - perfectly suited for CRUD operations, reports, and audit trails.

**Key Design Principles**:
- Clarity over decoration: Information architecture drives every decision
- Consistent patterns: Predictable interactions reduce cognitive load
- Productive efficiency: Minimize clicks, maximize data visibility
- Professional restraint: Enterprise-grade visual language

---

## Typography

**Font Stack**: IBM Plex Sans (via Google Fonts CDN)
```
- Headings: IBM Plex Sans, weights 600 (semibold) for h1-h3, 500 (medium) for h4-h6
- Body: IBM Plex Sans, weight 400 (regular), line-height 1.5
- Code/Data: IBM Plex Mono, weight 400 (for CPF, codes, identifiers)
```

**Type Scale**:
- Page Titles (h1): text-3xl (30px), font-semibold
- Section Headings (h2): text-2xl (24px), font-semibold
- Subsections (h3): text-xl (20px), font-medium
- Component Labels (h4): text-lg (18px), font-medium
- Body Text: text-base (16px)
- Helper Text: text-sm (14px)
- Captions/Metadata: text-xs (12px)

---

## Layout System

**Spacing Primitives**: Use Tailwind units **2, 4, 6, 8, 12, 16** exclusively
- Micro spacing (form fields, buttons): p-2, gap-2, space-y-2
- Component spacing (cards, sections): p-4, p-6, gap-4
- Page sections: py-8, px-6, gap-8
- Major sections: py-12, px-8, space-y-12
- Container padding: px-6 lg:px-8

**Grid System**:
- Sidebar: w-64 fixed left sidebar on desktop (lg:), full-width drawer on mobile
- Main content: ml-64 on lg:, full-width on mobile
- Content max-width: max-w-7xl mx-auto for wide tables/dashboards
- Form containers: max-w-3xl for create/edit forms
- Card grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 with gap-6

**Responsive Breakpoints**:
- Mobile-first approach
- md: 768px (tablet, 2-column layouts begin)
- lg: 1024px (desktop, sidebar appears, 3-column grids)
- xl: 1280px (wide tables expand)

---

## Component Library

### Navigation
**Sidebar** (Desktop):
- Fixed position, full-height, w-64
- Navigation items: px-4 py-2, flex items-center gap-3
- Active state: distinct treatment (heavier font weight, indicator bar)
- Icons from Heroicons (outline style, 20px)
- Collapsible section groups for related features

**Mobile Navigation**:
- Top header with hamburger menu
- Slide-out drawer overlay
- Logo/brand in header, h-16

### Data Tables
**Structure**:
- Full-width responsive tables with horizontal scroll on mobile
- Sticky header row
- Alternating row treatment for readability
- Compact row height (h-12 to h-14)
- Actions column (right-aligned): view, edit, delete icons

**Features**:
- Search/filter bar above table (flex justify-between items-center mb-6)
- Pagination at bottom (center-aligned)
- Sort indicators on column headers
- Row selection checkboxes for bulk actions
- Empty states with illustration placeholder and helper text

### Forms
**Layout**:
- Vertical label-above-input pattern
- Form groups with space-y-6
- Labels: text-sm font-medium mb-2
- Input fields: h-10, px-3, rounded border
- Full-width inputs by default
- Two-column layouts for related fields: grid grid-cols-1 md:grid-cols-2 gap-6

**Elements**:
- Text inputs, textareas, select dropdowns (consistent h-10 height)
- Radio buttons and checkboxes with proper labels
- Date pickers for allocation/occurrence forms
- File upload zones with drag-drop visual treatment
- Required field indicators (asterisk)
- Validation messages below fields (text-sm, clear error/success states)

**Actions**:
- Form footer: flex justify-end gap-3
- Primary button (submit/save): prominent treatment
- Secondary button (cancel): subdued treatment
- Both buttons: h-10 px-6 rounded

### Cards
**Employee/Service Post Cards**:
- Structured content with clear hierarchy
- Header section: title + status badge
- Body: key-value pairs in grid-cols-2
- Footer: action buttons (view details, edit)
- Padding: p-6, rounded-lg border
- Hover state: subtle lift effect (shadow transition)

**Dashboard Stats Cards**:
- Metric-focused: large number display (text-3xl)
- Label below (text-sm)
- Icon in corner (24px)
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6

### Buttons & Actions
**Primary Actions**: Filled button, h-10, px-6, rounded, font-medium
**Secondary Actions**: Outlined button, same dimensions
**Tertiary Actions**: Text-only button with underline on hover
**Icon Buttons**: w-8 h-8, rounded, centered icon (Heroicons 20px)
**Button Groups**: flex gap-2, used in table rows and forms

### Modals & Overlays
**Modal Dialog**:
- Centered overlay with backdrop blur
- Max-width: max-w-2xl for forms, max-w-md for confirmations
- Header: p-6, border-bottom
- Body: p-6, scrollable if needed
- Footer: p-6, flex justify-end gap-3

**Confirmation Dialogs**:
- For delete/destructive actions
- Clear warning message
- Danger button + cancel button

### Status Indicators
**Badges**:
- Rounded-full px-3 py-1 text-xs font-medium
- Status types: active, inactive, present, absent, justified
- Employee status: active (positive), inactive (neutral)
- Allocation status: present (positive), absent (warning), justified (neutral)

**Alerts/Notifications**:
- Page-level: p-4 rounded border-l-4
- Toast notifications: fixed bottom-right, slide-in animation (minimal)

### Document Management
**Upload Zone**:
- Dashed border area, p-8, rounded-lg
- Centered icon + text "Drag and drop or click to upload"
- File type/size constraints shown below

**Document List**:
- Table format with columns: filename, type, upload date, uploader, actions
- Preview icon opens modal with PDF viewer or image display
- Download icon for direct file access

### Reports Interface
**Filter Panel**:
- Collapsible sidebar or top panel
- Date range picker, employee selector, post selector
- Apply/reset buttons at bottom

**Report Display**:
- Tabs for different report types
- Export buttons (CSV, HTML/Print) in top-right
- Tables with proper column widths for readability
- Subtotals/totals rows with distinct styling (font-semibold, border-t-2)

---

## Animations

**Minimize Motion**:
- No complex scroll animations
- Basic transitions only:
  - Hover states: transition-colors duration-150
  - Modal entry: fade-in duration-200
  - Sidebar toggle: transition-transform duration-300
- Respect prefers-reduced-motion

---

## Images

**No hero images** - this is an application, not a marketing site.

**Functional Images Only**:
- User avatars: 40px × 40px rounded-full in navigation header
- Empty state illustrations: Simple SVG graphics (300px max-width) for empty tables/lists
- Document thumbnails: 80px × 80px preview for uploaded files
- Logo: Top-left of sidebar, max 180px wide × 48px tall

All images should be purposeful, not decorative. Focus remains on data and functionality.