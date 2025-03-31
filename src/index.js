/**
 * Gmail Processor - Main Application
 * 
 * Fetches and processes emails with the "CVS" label
 * Relative Path: src\index.js
 */
const { getAuthenticatedGmail } = require('./auth');
const { fetchCVSEmails } = require('./email-service');
const { saveEmailData, printEmailSummary } = require('./utils');

/**
 * Main function that orchestrates the email processing
 */
async function main() {
  try {
    console.log('Starting Gmail processing...');
    
    // Step 1: Authenticate with Gmail API
    console.log('Authenticating with Gmail API...');
    const gmail = await getAuthenticatedGmail();
    
    // Step 2: Fetch emails with the CVS label
    console.log('Fetching emails with CVS label from the last 6 days...');
    const emails = await fetchCVSEmails(gmail);
    
    // Step 3: Process and display results
    if (emails.length > 0) {
      // Save email data to file
      await saveEmailData(emails);
      
      // Display summary of emails
      printEmailSummary(emails);
    } else {
      console.log('No emails found matching the criteria.');
    }
    
    console.log('\nGmail processing completed successfully.');
  } catch (error) {
    console.error('Error in main process:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);