import { searchXAI } from '../../services/xai/xaiService.js'; // Updated path

export const searchCommand = async (messageContent) => {
    const userQuestion = messageContent.slice(6).trim(); // Extract user question

    if (!userQuestion) {
        return "Please provide a question to search.";
    }

    try {
        const assistantMessage = await searchXAI(userQuestion);
        console.log("Grok replied in the channel");
        return assistantMessage;
    } catch (error) {
        console.error("Error in searchCommand:", error);
        return "An error occurred while fetching data from the xAI API.";
    }
}; 