# TilerMate – Estimate & Quote App

This is a premium web application for tilers to calculate room areas, estimate material requirements (adhesive, grout, underlayment), generate a formatted quote, and save the quote to Google Drive.

## Project Structure
```
tilers-estimating-app/
├─ index.html      # Main HTML page
├─ style.css       # Premium dark‑mode stylesheet with glassmorphism
├─ utils.js        # Helper functions for calculations and quote formatting
├─ drive.js        # Google Drive API integration (OAuth 2.0)
├─ app.js          # UI logic, event handling, PDF generation, sharing
└─ README.md       # This file
```

## Setup
1. Open `index.html` in a modern browser (Chrome, Edge, Firefox). No build step is required.
2. The app loads the Google APIs script from `https://apis.google.com/js/api.js` and the `html2pdf` library from a CDN.
3. Replace the placeholder values in **drive.js** with your own Google Cloud credentials:
   - `CLIENT_ID` – OAuth 2.0 Client ID (Web application)
   - `API_KEY` – API key for the project
   - Ensure the OAuth consent screen includes the scope `https://www.googleapis.com/auth/drive.file`.
4. Save the file and reload the page. When you click **Save to Google Drive**, you will be prompted to authorize the app.

## Usage
1. Click **Add Room** to enter dimensions and select the substrate type for each room.
2. Fill in the customer name and email.
3. Press **Generate Quote** – the app will calculate total area, material quantities, and display a nicely formatted quote.
4. Use the **Save to Google Drive**, **Copy to Clipboard**, **Share via Email**, or **Share via WhatsApp** buttons to export or share the quote.

## Design Customisation
- Colours, fonts, and logo can be customised in `style.css` (CSS variables at the top of the file).
- The UI is responsive and works on mobile devices.

## License
MIT – feel free to adapt and extend.
