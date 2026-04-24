# Production Monitoring System - 4RC

A full-stack manufacturing dashboard for tracking changeovers, setup performance, and overshoot causes in near real-time.

## What Problem It Solves

In production lines(conveyor belt), setup/changeover losses of recipes(input material) are often hard to track consistently because data is split across systems and manual notes.

This software solves that by:
- Collecting and processing machine line(iot logs for every 10 sec) data into changeover events
- Comparing actual setup time against standard time
- Highlighting overshoot (time loss) and enabling reason capture
- Giving managers and operators a shared, auditable view of performance
- Supporting filtered exports and reports for analysis and reviews

## Primary Use Case

The system is designed for plant operation teams that need daily visibility into setup efficiency and bottlenecks.

Typical flow:
1. Machine data is ingested and processed into changeover summaries
2. Users filter by date, shift, and recipe to inspect performance
3. Team records overshoot categories/reasons and remarks
4. Managers review correction requests when late edits are required
5. Reports are exported (Excel/CSV/PDF) for operations review and planning

## Core Capabilities

- Changeover dashboard with setup metrics:
  - Standard Time
  - Actual Time
  - Static Setup
  - Ramp Up
  - Overshoot
- Recipe Master management (type + target speed)
- Standard Time Master management
- Overshoot category and reason tracking
- Missing recipe/target speed warning workflow
- Role-aware correction request flow (worker/manager/admin)
- Export and reporting:
  - Changeover export (Excel, CSV)
  - Recipe export (JSON/CSV/Excel)
  - Summary PDF report

## Tech Stack Overview

### Frontend
- React (Vite)
- JavaScript (JSX)
- Chart.js + react-chartjs-2 (dashboard visualizations)
- Axios (API communication)
- React Router (route handling)
- Custom context providers for API and notifications

### Backend
- Python 3.x
- Django + Django REST Framework
- MySQL (via mysqlclient)
- Celery (background processing)
- Pandas / XlsxWriter (data export and report shaping)

### Auth & Access
- Token-based authentication
- Role-based permissions (admin, manager, worker)

## Project Structure

- backend/: Django APIs, models, migrations, tasks, reporting logic
- frontend/: React dashboard UI and chart components
- logs/: runtime/output logs
- api_test_report.md: API validation report

## Who Uses It

- Operators: submit/track setup reasons and updates
- Managers: review correction requests and monitor overshoot trends
- Admin/Engineering: maintain masters and analyze line performance over time

## Expected Outcome

By standardizing setup tracking and reason capture, the system helps reduce unplanned setup losses, improves accountability, and enables faster continuous-improvement decisions.