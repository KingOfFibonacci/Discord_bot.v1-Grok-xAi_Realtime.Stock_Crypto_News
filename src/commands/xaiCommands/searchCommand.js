import { searchXAI } from '../../services/xaiService.js'; // Import the search function

export const searchCommand = async (messageContent) => {
    const userQuestion = messageContent.slice(6).trim(); // Extract user question

    if (!userQuestion) {
        return "Please provide a question to search.";
    }

    try {
        const assistantMessage = await searchXAI(userQuestion); // Call the search function
        console.log("Grok replied in the channel"); // Log confirmation message
        return assistantMessage; // Return the assistant's response
    } catch (error) {
        console.error("Error in searchCommand:", error); // Debug log for errors
        return "An error occurred while fetching data from the xAI API.";
    }
}; 