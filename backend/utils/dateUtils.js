// Convert UTC to IST and format the date
const convertToIST = (date) => {
  if (!date) return null;
  
  // Create a new Date object from the input
  const utcDate = new Date(date);
  
  // Add 5 hours and 30 minutes for IST
  const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
  
  // Format the date in IST
  return istDate.toISOString();
};

// Format date for MongoDB storage
const formatForMongoDB = (date) => {
  if (!date) return null;
  
  // Create a new Date object from the input
  const inputDate = new Date(date);
  
  // Return the date in UTC format for MongoDB storage
  return inputDate.toISOString();
};

module.exports = {
  convertToIST,
  formatForMongoDB
}; 