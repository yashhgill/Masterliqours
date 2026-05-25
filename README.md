# Here are your Instructions


## Google Staff Access

The backend now supports Google OAuth for the boss and staff. Access is allowlisted:

- Admin Google account: `ADMIN_EMAIL` or any email in `GOOGLE_ADMIN_EMAILS`
- Staff Google accounts: `STAFF_1_EMAIL` through `STAFF_4_EMAIL`

Anyone else who tries Google login is rejected.

Google Cloud setup:

1. Create a Google Cloud OAuth web client.
2. Enable Google Sheets API and Google Drive API.
3. Add this redirect URI:

```text
http://localhost:3001/api/auth/google/callback
```

4. Fill in `backend/.env` using `backend/.env.example`.
5. Staff sign in from the Admin Login page using Continue with Google.

The dashboard has a Sync Sheets button. It writes Inventory and Orders into Google Sheets. If `GOOGLE_MASTER_SPREADSHEET_ID` is set, it updates that file; otherwise it creates a Master Liquors Operations spreadsheet in the logged-in Google Drive and stores the ID locally in `backend/data/google_sheet_state.json`.
