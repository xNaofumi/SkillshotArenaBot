const Discord = require('discord.js');
const { readFiles, getTimeFormatted } = require('../formatHelper');
const { log } = require('../helper');
const { RATING_PATHS, RATING_STATS_COLORS, RATING_CALIBRATE_MATCHES, RATING_INITIAL_VALUE } = require('../const/rating');

const RatingPlayersData = [];

function updateRatingPlayersData(guild) {
    RatingPlayersData.length = 0;
    const playersFolderPath = RATING_PATHS.playersFolder + '/';

    return readFiles(playersFolderPath, function (filename, content) {
        const player = JSON.parse(content);

        const member = guild.members.cache.find(member => member.displayName == player.name);
        if (member == null) return;

        const displayName = member.displayName;

        RatingPlayersData.push({
            name: player.name,
            displayName: displayName,
            rating: player.rating,
            matches: player.matches,
            wins: player.wins,
            loses: player.loses,
            relativeImpact: parseInt(player.relativeImpact * 100 / player.matches),
        });
    }, function (err) {
        throw err;
    });
}

async function updateRatingTable(message) {
    const ratingTableStats = await getRatingTableStats();

    RatingPlayersData.sort(function (a, b) {
        return (a.rating > b.rating) ? -1 : 1;
    });

    const embedFieldDescriptions = [];
    const playersPerField = 10;
    for (let i = 0; i < Math.ceil(RatingPlayersData.length / playersPerField); i++) {
        embedFieldDescriptions[i] = '';

        for (let j = i * playersPerField; j < playersPerField * (i + 1); j++) {
            const playerData = RatingPlayersData[j];
            if (playerData == null) break;

            const player = message.guild.members.cache.find(member => member.displayName == playerData.displayName);
            const rating = getPlayerRatingConverted(player);
            const impact = playerData.relativeImpact;
            const wins = playerData.wins;
            const loses = playerData.loses;

            embedFieldDescriptions[i] += `${player} — __${rating}__, **${impact}%** *(${wins}/${loses})*\n`;
        }
    }

    const embed = getRatingTableEmbed(embedFieldDescriptions, ratingTableStats);

    message.edit(embed);

    log('Рейтинговая таблица обновлена.');
}

function getPlayerRatingConverted(member) {
    const playerData = RatingPlayersData.find(player => player.displayName == member.displayName);

    if (playerData == null) return 'Первая игра'

    if (playerData.wins + playerData.loses >= RATING_CALIBRATE_MATCHES) {
        return playerData.rating;
    }

    return 'Калибровка';
}

function getPlayerRatingValue(member) {
    const playerData = RatingPlayersData.find(player => player.displayName == member.displayName);

    if (playerData == null) return RATING_INITIAL_VALUE;

    return playerData.rating;
}

function getRatingMaxDifference(players) {
    let max = 0;
    let min = getPlayerRatingValue(players[0]);

    for (let i = 0; i < players.length; i++) {
        const rating = getPlayerRatingValue(players[i]);
        
        if (rating > max) {
            max = rating;
        }

        if (rating < min) {
            min = rating;
        }
    }

    const difference = max - min;

    return difference;
}

exports.updateRatingTable = updateRatingTable;
exports.updateRatingPlayersData = updateRatingPlayersData;
exports.getPlayerRatingConverted = getPlayerRatingConverted;
exports.getPlayerRatingValue = getPlayerRatingValue;
exports.getRatingMaxDifference = getRatingMaxDifference;

async function getRatingTableStats() {
    const ratingTableStats = {
        matches: 0,
        matchesDuration: 0,
        dragonsKilled: [0, 0, 0, 0, 0]
    };

    const matchesFolderPath = RATING_PATHS.matchesFolder + '/';
    await readFiles(matchesFolderPath, function (filename, content) {
        const matchData = JSON.parse(content);

        ratingTableStats.matches++;

        for (let i = 0; i < 5; i++) {
            if (matchData.info.dragonsKilledBy[i] == -1) continue;

            ratingTableStats.dragonsKilled[i]++;
        }

        ratingTableStats.matchesDuration += matchData.info.time;
    }, function (err) {
        throw err;
    });

    ratingTableStats.matchesDuration /= ratingTableStats.matches;
    ratingTableStats.matchesDuration = getTimeFormatted(ratingTableStats.matchesDuration);

    return ratingTableStats;
}

function getRatingTableEmbed(embedFieldDescriptions, ratingTableStats) {
    const embed = new Discord.MessageEmbed()
        .addField('Таблица игроков [рейтинг, относительный импакт, победы/поражения]', embedFieldDescriptions[0]);

    const format = '**';

    if (embedFieldDescriptions[0] == null) {
        return getEmptyRatingTableEmbed();
    }

    for (let i = 1; i < embedFieldDescriptions.length; i++) {
        embed.addField('\u200B', embedFieldDescriptions[i]);
    }

    embed
        .addField('Дополнительная информация', `Сыграно матчей: ${format}${ratingTableStats.matches}${format}
        Средняя продолжительность матчей: ${format}${ratingTableStats.matchesDuration}${format}
        Убито драконов: ${format}${ratingTableStats.dragonsKilled[0]} / ${ratingTableStats.dragonsKilled[1]} / ${ratingTableStats.dragonsKilled[2]} / ${ratingTableStats.dragonsKilled[3]} / ${ratingTableStats.dragonsKilled[4]}${format}`)
        .setFooter('Последнее обновление')
        .setTimestamp()
        .setColor(RATING_STATS_COLORS.ratingTable);
    return embed;
}

function getEmptyRatingTableEmbed() {
    const embed = new Discord.MessageEmbed()
        .addField('Таблица игроков', 'Рейтинговые игры ещё не проводились.')
        .setColor(RATING_STATS_COLORS.ratingTableNoPlayers)
        .setFooter('Последнее обновление')
        .setTimestamp();

    return embed;
}