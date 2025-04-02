/**
 * Email Service for fetching and processing Gmail messages
 * 
 * Provides functions to query and extract data from emails
 * Relative Path: src\email-services.js
 */

/**
 * Formats a date as yyyy/MM/dd
 * 
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  }
  
  /**
   * Fetches emails with the "CVS" label from the last 6 days
   * 
   * @param {Object} gmail - Authenticated Gmail API client
   * @returns {Promise<Array<Object>>} Array of processed email objects
   */
  async function fetchCVSEmails(gmail) {
    try {
      // Calculate date 6 days ago in yyyy/MM/dd format for Gmail query
      const sixDaysAgo = new Date();
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
      const formattedDate = formatDate(sixDaysAgo);
      
      // Create a query to find emails with the CVS label from the last 6 days
      const query = `label:CVS subject:$4 Coupon! after:${formattedDate}`;
      
      console.log(`Fetching emails with query: ${query}`);
      
      // Get list of message IDs matching query
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        // Only fetch maximum 500 emails to avoid hitting limits
        maxResults: 500
      });
      
      const messages = response.data.messages || [];
      console.log(`Found ${messages.length} emails matching the criteria`);
      
      if (messages.length === 0) {
        return [];
      }
      
      // Process each message to extract required information
      const emailDataPromises = messages.map(message => 
        extractEmailData(gmail, message.id)
      );
      
      // Process in batches of 10 to avoid overwhelming the API
      console.log(`Processing all ${emailDataPromises.length} emails simultaneously...`);
    
      // Process all emails at once instead of batching
      const emailData = await Promise.all(emailDataPromises);
      
      console.log(`Completed processing ${emailData.length} emails`);


      /* const batchSize = 10;
      
      for (let i = 0; i < emailDataPromises.length; i += batchSize) {
        const batch = emailDataPromises.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch);
        emailData.push(...batchResults);
        
        // Simple progress logging
        console.log(`Processed ${Math.min(i + batchSize, emailDataPromises.length)} of ${emailDataPromises.length} emails`);
      }
      */
      return emailData;
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw error;
    }
  }
  
  /**
   * Extracts subject, from, to, and date from an email
   * 
   * @param {Object} gmail - Authenticated Gmail API client
   * @param {string} messageId - ID of the email to process
   * @returns {Promise<Object>} Object containing email data
   */
  async function extractEmailData(gmail, messageId) {
    try {
      // Fetch the email with minimal format to save bandwidth
      // Only get headers - we don't need the body
      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'metadata',
        metadataHeaders: ['To', 'Date']
      });
      
      const { headers } = response.data.payload;
      
      // Extract required fields from headers
      const emailData = {
        id: messageId,
        to: getHeaderValue(headers, 'To'),
        date: getHeaderValue(headers, 'Date'),
        // Add internal date (Unix timestamp in milliseconds)
        timestamp: response.data.internalDate ? parseInt(response.data.internalDate) : null
      };
      
      return emailData;
    } catch (error) {
      console.error(`Error extracting data from email ${messageId}:`, error);
      // Return partial data with error information
      return {
        id: messageId,
        error: error.message,
        subject: null,
        from: null,
        to: null,
        date: null,
        timestamp: null
      };
    }
  }
  
  /**
   * Helper function to extract values from email headers
   * 
   * @param {Array<Object>} headers - Array of header objects
   * @param {string} name - Name of the header to find
   * @returns {string|null} Value of the header or null if not found
   */
  function getHeaderValue(headers, name) {
    const header = headers.find(h => h.name === name);
    return header ? header.value : null;
  }
  
  module.exports = {
    fetchCVSEmails
  };