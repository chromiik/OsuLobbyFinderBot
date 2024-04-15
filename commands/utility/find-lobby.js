const { SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { osuAPIKey } = require('../../config.json');
 
module.exports = {
    data: new SlashCommandBuilder()
        .setName('find-lobby')
        .setDescription('Finds the most recent lobby')
        .addStringOption(option => 
            option
                .setName('lobby-name')
                .setDescription('String included in the lobby title'))
        .addIntegerOption(option => 
            option
                .setName('starting-id')
                .setDescription('Starting lobby ID')),
    async execute(interaction){
        const target = interaction.options.getString('lobby-name');
        const startingId = interaction.options.getInteger('starting-id');
        let lobbyId = null;
        let attempts = 0;
        
        try {
            await interaction.deferReply();
            
            while (!lobbyId) {
                try {
                    lobbyId = await findLobby(target, startingId - attempts);
                } catch (error) {
                    console.error('Error finding lobby:', error);
                }
                attempts++;
                if (lobbyId) {
                    await interaction.editReply(`Lobby found with URL: https://osu.ppy.sh/community/matches/${lobbyId}`);
                } else {
                    await new Promise(resolve => setTimeout(resolve, 5000)); 
                }
            }
        } catch (error) {
            console.error('Error finding lobby:', error);
            await interaction.editReply('An error occurred while finding the lobby.');
        }
    }
};
async function findLobby(target, startingId) {
    let lobbyId = null;
    let attempts = 0;
    
    while (!lobbyId) {
        const url = `https://osu.ppy.sh/api/get_match?k=${osuAPIKey}&mp=${startingId - attempts}&limit=1`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            console.log(data);

            if (data.match && data.match.name && data.match.name.includes(target)) {
                lobbyId = data.match.match_id;
            }
        } catch (error) {
            console.error('Error fetching match data:', error);
            continue;
        }

        attempts++;
    }

    return lobbyId;
}
