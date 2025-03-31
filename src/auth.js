/**
 * Authentication module for Gmail API
 * 
 * Handles OAuth2 authentication and provides a configured Gmail API client
 * Relative Path: src\auth.js
 */
const fs = require('fs').promises;
const path = require('path');
const { gmail } = require('@googleapis/gmail');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

// OAuth2 scopes required for reading emails
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

// Token file path (stores the user's access and refresh tokens)
const TOKEN_PATH = path.join(process.cwd(), 'token.json');

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
      redirect_uris: [process.env.REDIRECT_URI]
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
      await getNewToken(oAuth2Client);
    }

    // Return authenticated Gmail API client
    return gmail({ version: 'v1', auth: oAuth2Client });
  } catch (error) {
    console.error('Error during authentication:', error);
    throw error;
  }
}

/**
 * Get and store a new token after prompting for user authorization
 * @param {Object} oAuth2Client The OAuth2 client to get token for
 */
async function getNewToken(oAuth2Client) {
  // Generate authentication URL
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  
  console.log('Authorize this app by visiting this URL:', authUrl);
  console.log('After authorization, copy the code from the redirect URL and enter it below:');
  
  // Wait for user input (in a real app, you might use a proper CLI library)
  const code = await new Promise(resolve => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    readline.question('Enter the code: ', (code) => {
      readline.close();
      resolve(code);
    });
  });

  // Exchange authorization code for tokens
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  
  // Save token to disk for future use
  await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
  console.log('Token stored to:', TOKEN_PATH);
}

module.exports = { getAuthenticatedGmail };