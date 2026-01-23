// drive.js - Google Drive API integration

// Load the Google API client library (already loaded in index.html)

const CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com'; // TODO: replace with actual client ID
const API_KEY = 'YOUR_API_KEY'; // TODO: replace with actual API key
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient;
let gapiInited = false;
let gisInited = false;

export function initGoogleDrive() {
    return new Promise((resolve, reject) => {
        // Load the GAPI client
        gapi.load('client:auth2', async () => {
            try {
                await gapi.client.init({ apiKey: API_KEY, discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'] });
                gapiInited = true;
                maybeInitGis();
            } catch (e) {
                reject(e);
            }
        });

        // Load the GIS client
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => {
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: (tokenResponse) => {
                    if (tokenResponse.error) {
                        reject(tokenResponse);
                    } else {
                        resolve(tokenResponse.access_token);
                    }
                },
            });
            gisInited = true;
            maybeInitGis();
        };
        document.head.appendChild(script);

        function maybeInitGis() {
            if (gapiInited && gisInited) {
                // Ready to request token when needed
            }
        }
    });
}

export async function uploadQuoteFile(fileName, content) {
    const accessToken = await initGoogleDrive();
    const metadata = {
        name: fileName,
        mimeType: 'application/pdf',
    };
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const closeDelimiter = "\r\n--" + boundary + "--";

    const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/pdf\r\n\r\n' +
        content +
        closeDelimiter;

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + accessToken,
            'Content-Type': 'multipart/related; boundary=' + boundary,
        },
        body: multipartRequestBody,
    });
    if (!response.ok) {
        throw new Error('Drive upload failed: ' + response.statusText);
    }
    return response.json();
}
