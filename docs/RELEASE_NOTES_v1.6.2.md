# Release Notes v1.6.2

## 🐛 Bug Fixes
-   **Analytics Date Grouping:** Fixed an issue where future debts (e.g., due Jan 1st) would appear in the previous month (Dec 31st) due to timezone differences. Dates are now treated strictly as local dates.
-   **Date Helpers:** Improved accuracy of relative date displays ("In X days", "This Week") by enforcing local time interpretation, ensuring consistency regardless of the user's timezone.
