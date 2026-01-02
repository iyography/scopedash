# Directive: Monitor TikTok Metrics

**Goal**: Update the TikTok Dashboard with the latest performance metrics from our owned accounts.

## Inputs
- **Accounts**:
    - `matchupvault`
    - `wrestler.trivia`
    - `callthemoment`
    - `street.slamdown`
    - `ragequitguy`
- **Data Source**: Apify Actor `GdWCkxBtKWOsKjdch` (TikTok Scraper).

## Tools
- `execution/fetch_tiktok_data.py`

## Instructions
1.  **Run the update script**:
    ```bash
    python3 execution/fetch_tiktok_data.py
    ```
    - This script will trigger the Apify scraper.
    - It will wait for the run to finish.
    - It will download the dataset and process it into `dashboard/public/data.json`.

2.  **Verify the Dashboard**:
    - If running locally, ensure the dashboard running on `http://localhost:3000` reflects the new numbers.
    - Check "Last Updated" timestamp in the UI.

## Edge Cases
- **Apify Rate Limits**: If the script fails due to timeouts, wait 5 minutes and retry.
- **Login Issues**: If Apify returns auth errors, verify `APIFY_API_KEY` in `.env`.
