/**
 * Authentication module for Gmail API
 * 
 * Handles OAuth2 authentication and provides a configured Gmail API client
 * Uses a local server to automatically capture the OAuth code
 * 
 * Relative Path: src\auth.js
 */
const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const url = require('url');
// No longer using require for open - will use dynamic import
const { gmail } = require('@googleapis/gmail');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

// OAuth2 scopes required for reading emails
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

// Token file path (stores the user's access and refresh tokens)
const TOKEN_PATH = path.join(process.cwd(), 'token.json');

// Local server port for OAuth redirect
const PORT = 3000;

/**
 * Create an OAuth2 client using credentials and authorize the client
 * @returns {Promise<Object>} The authenticated Gmail API client
 */
async function getAuthenticatedGmail() {
  try {
    // Load client secrets from environment variables
    const credentials = {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      redirect_uris: [`http://localhost:${PORT}/oauth2callback`]
    };
    
    // Create OAuth2 client
    const { client_secret, client_id, redirect_uris } = credentials;
    const oAuth2Client = new OAuth2Client(
      client_id, client_secret, redirect_uris[0]
    );

    // Check if token already exists
    try {
      const token = await fs.readFile(TOKEN_PATH);
      oAuth2Client.setCredentials(JSON.parse(token));
    } catch (err) {
      // If token doesn't exist, get a new one
      const token = await getNewToken(oAuth2Client);
      oAuth2Client.setCredentials(token);
    }

    // Return authenticated Gmail API client
    return gmail({ version: 'v1', auth: oAuth2Client });
  } catch (error) {
    console.error('Error during authentication:', error);
    throw error;
  }
}

/**
 * Get a new token using a local web server to automatically capture the code
 * @param {OAuth2Client} oAuth2Client The OAuth2 client to get token for
 * @returns {Promise<Object>} The token object
 */
async function getNewToken(oAuth2Client) {
  return new Promise((resolve, reject) => {
    try {
      // Generate authentication URL
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });
      
      // Create a local server to listen for the redirect
      const server = http.createServer(async (req, res) => {
        try {
          // Extract code from URL
          const queryParams = url.parse(req.url, true).query;
          
          if (queryParams.code) {
            // Return success page to user
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body>
                  <h1>Authentication Successful</h1>
                  <p>You can close this window and return to the application.</p>
                </body>
              </html>
            `);
            
            // Close the server
            server.close();
            
            try {
              // Exchange the code for tokens
              const { tokens } = await oAuth2Client.getToken(queryParams.code);
              
              // Save the tokens to disk
              await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
              console.log('Token stored to:', TOKEN_PATH);
              
              // Resolve the promise with the tokens
              resolve(tokens);
            } catch (error) {
              console.error('Error retrieving access token:', error);
              reject(error);
            }
          } else {
            // Handle case when no code is in the URL
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body>
                  <h1>Authentication Failed</h1>
                  <p>No authorization code was received. Please try again.</p>
                </body>
              </html>
            `);
            server.close();
            reject(new Error('No authorization code received'));
          }
        } catch (error) {
          console.error('Error handling redirect:', error);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal Server Error');
          server.close();
          reject(error);
        }
      });
      
      // Start the server
      server.listen(PORT, () => {
        console.log(`Listening for OAuth2 callback on port ${PORT}`);
        console.log(`Opening browser for authentication: ${authUrl}`);
        
        // Use dynamic import for the open package
        (async () => {
          try {
            // Dynamically import the open package
            const open = await import('open');
            // Open the URL in the default browser
            await open.default(authUrl);
          } catch (err) {
            console.log(`Unable to open browser automatically. Please open this URL manually:\n${authUrl}`);
          }
        })();
      });
      
      // Handle server errors
      server.on('error', (error) => {
        console.error(`Server error: ${error.message}`);
        reject(error);
      });
    } catch (error) {
      console.error('Error in getNewToken:', error);
      reject(error);
    }
  });
}

module.exports = { getAuthenticatedGmail };
