<!-- END:nextjs-agent-rules -->

# Operational & Data Integrity Rules
- **[CRITICAL] D-Day Priority**: All government announcements must have a valid `deadline_date`. Never fallback to "Always Open (상시)" if a date is present in the source.
- **[CRITICAL] No Stealth Strategy**: Initial crawls must use the `정부지원공고` category. Do NOT generate the detailed "Strategic Analysis" or "Reporter's Eye" by default. Detailed strategies are only generated upon user request (on-demand).
- **[CRITICAL] Year 2026**: Always assume the current year is 2026 for all date calculations.

# UI/Layout Preservation Rules (LOCKED)
- **[CRITICAL] Category Tabs**: The category structure is `전체` · `지원사업` · `뉴스테크` — exactly 3 tabs. Do NOT add, remove, rename, or reorder these categories under any circumstances.
- **[CRITICAL] Layout Freeze**: The current page layout (hero section, 3-column bento grid, card styles, floating subscription FAB, filter overlay, typography, color scheme) is FINAL. Do NOT modify, restructure, or "improve" the layout during any task.
- **[CRITICAL] No UI Side-Effects**: When working on backend, data, or any non-UI task, ensure ZERO changes leak into UI/layout code. If a task does not explicitly request a UI change, no UI file should be modified.
