<!-- END:nextjs-agent-rules -->

# Operational & Data Integrity Rules
- **[CRITICAL] D-Day Priority**: All government announcements must have a valid `deadline_date`. Never fallback to "Always Open (상시)" if a date is present in the source.
- **[CRITICAL] No Stealth Strategy**: Initial crawls must use the `정부지원공고` category. Do NOT generate the detailed "Strategic Analysis" or "Reporter's Eye" by default. Detailed strategies are only generated upon user request (on-demand).
- **[CRITICAL] Year 2026**: Always assume the current year is 2026 for all date calculations.
