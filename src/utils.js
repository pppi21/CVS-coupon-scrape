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
 * Saves email data to a JSON file with timestamp and maps recipient emails to phone numbers
 * 
 * @param {Array<Object>} emails - Array of email objects to save
 * @param {string} mappingFilePath - Path to the JSON file containing email-to-phone mappings
 * @returns {Promise<{filePath: string, phoneNumbers: Array<string>}>} Object containing path to saved file and collected phone numbers
 */
async function saveEmailData(emails, mappingFilePath = path.join(process.cwd(), 'data', 'email-phone-map.json')) {
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
    
    // Load email-to-phone mapping
    let emailToPhoneMap = {};
    try {
      const mappingData = await fs.readFile(mappingFilePath, 'utf8');
      emailToPhoneMap = JSON.parse(mappingData);
      console.log(`Loaded ${Object.keys(emailToPhoneMap).length} email-to-phone mappings`);
    } catch (err) {
      console.warn(`Warning: Could not load email-to-phone mapping from ${mappingFilePath}: ${err.message}`);
      console.warn('Continuing without mapping functionality');
    }
    
    // Collect phone numbers for matching emails
    const phoneNumbers = [];
    for (const email of emails) {
      const toAddress = email.to;
      if (toAddress && emailToPhoneMap[toAddress]) {
        phoneNumbers.push(emailToPhoneMap[toAddress]);
      }
    }
    
    console.log(`Found ${phoneNumbers.length} matching phone numbers`);
    
    // Return the collected phone numbers
    return phoneNumbers;
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
}

module.exports = {
  saveEmailData,
  printEmailSummary
};