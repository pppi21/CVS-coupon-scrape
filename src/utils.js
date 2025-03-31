/**
 * Utility functions for email processing
 * Relative Path: src\utils.js
 */
const fs = require('fs').promises;
const path = require('path');

/**
 * Formats a date as yyyy-MM-dd_HH-mm-ss
 * 
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
function formatTimestamp(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

/**
 * Saves email data to a JSON file with timestamp
 * 
 * @param {Array<Object>} emails - Array of email objects to save
 * @returns {Promise<string>} Path to the saved file
 */
async function saveEmailData(emails) {
  try {
    // Create a directory for output if it doesn't exist
    const outputDir = path.join(process.cwd(), 'output');
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (err) {
      // Directory might already exist, continue
    }
    
    // Create filename with current date/time
    const timestamp = formatTimestamp(new Date());
    const filename = `emails_${timestamp}.json`;
    const filePath = path.join(outputDir, filename);
    
    // Write data to file
    await fs.writeFile(filePath, JSON.stringify(emails, null, 2));
    
    console.log(`Saved ${emails.length} emails to ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('Error saving email data:', error);
    throw error;
  }
}

/**
 * Display email information in a human-readable format
 * 
 * @param {Array<Object>} emails - Array of email objects to display
 */
function printEmailSummary(emails) {
  console.log('\n===== Email Summary =====');
  console.log(`Total emails: ${emails.length}`);
  
  if (emails.length === 0) {
    return;
  }
  
  // Display each email with basic information
  emails.forEach((email, index) => {
    console.log(`\n--- Email ${index + 1} ---`);
    console.log(`Subject: ${email.subject || 'N/A'}`);
    console.log(`From: ${email.from || 'N/A'}`);
    console.log(`To: ${email.to || 'N/A'}`);
    console.log(`Date: ${email.date || 'N/A'}`);
  });
}

module.exports = {
  saveEmailData,
  printEmailSummary
};