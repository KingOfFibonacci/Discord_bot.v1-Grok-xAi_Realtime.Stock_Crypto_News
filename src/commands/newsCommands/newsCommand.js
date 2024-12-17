import { autoNewsService } from '../../services/news/autoNewsService.js';
import { EmbedBuilder } from 'discord.js';

export const newsCommand = async (messageContent) => {
    const args = messageContent.split(' ');
    const subCommand = args[1]?.toLowerCase();

    switch (subCommand) {
        case 'categories':
            const categoriesEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('📰 Available News Categories')
                .setDescription('Here are all the available news categories:')
                .addFields(
                    { name: 'General News', value: 'general', inline: true },
                    { name: 'Science', value: 'science', inline: true },
                    { name: 'Sports', value: 'sports', inline: true },
                    { name: 'Business', value: 'business', inline: true },
                    { name: 'Health', value: 'health', inline: true },
                    { name: 'Entertainment', value: 'entertainment', inline: true },
                    { name: 'Technology', value: 'tech', inline: true },
                    { name: 'Politics', value: 'politics', inline: true },
                    { name: 'Food', value: 'food', inline: true },
                    { name: 'Travel', value: 'travel', inline: true }
                )
                .setFooter({ text: 'Use !news sources to see available news sources' });
            
            return { embeds: [categoriesEmbed] };

        case 'sources':
            try {
                const sources = await autoNewsService.getSources({ language: 'en' });
                const sourcesEmbed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('📰 Available News Sources')
                    .setDescription('Here are some of the available news sources:');

                // Group sources by category
                const sourcesByCategory = {};
                sources.data.forEach(source => {
                    source.categories.forEach(category => {
                        if (!sourcesByCategory[category]) {
                            sourcesByCategory[category] = new Set();
                        }
                        sourcesByCategory[category].add(source.domain);
                    });
                });

                // Add fields for each category
                Object.entries(sourcesByCategory).forEach(([category, domains]) => {
                    sourcesEmbed.addFields({
                        name: category.charAt(0).toUpperCase() + category.slice(1),
                        value: Array.from(domains).slice(0, 10).join('\n') + 
                              (domains.size > 10 ? '\n...and more' : ''),
                        inline: false
                    });
                });

                sourcesEmbed.setFooter({ 
                    text: `Showing top sources per category. Total sources: ${sources.data.length}`
                });

                return { embeds: [sourcesEmbed] };
            } catch (error) {
                console.error('Error fetching sources:', error);
                return 'Error fetching news sources. Please try again later.';
            }

        case 'help':
            const helpEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('📰 News Command Help')
                .setDescription('Available news commands:')
                .addFields(
                    { 
                        name: '!news categories', 
                        value: 'Show all available news categories',
                        inline: false 
                    },
                    { 
                        name: '!news sources', 
                        value: 'Show available news sources',
                        inline: false 
                    }
                );
            
            return { embeds: [helpEmbed] };

        default:
            return 'Usage: !news [categories|sources|help]';
    }
}; 