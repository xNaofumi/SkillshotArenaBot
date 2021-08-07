const Discord = require('discord.js');
const fs = require('fs');
const { getHeroEmojiCode, getHeroIdByEmojiName: getHeroIdByName } = require('../const/emoji');
const { RATING_PATHS, RATING_STATS_COLORS } = require('../const/rating');
const { readFiles, getTimeFormatted } = require('../formatHelper');
const { log } = require('../helper');
const { HeroData } = require("./heroData");
const { getPlayerRatingConverted } = require('./rating');

const INT32_MAX = 2147483647;

async function sendPlayerStats(player, channel) {
    const playerStatsPath = `${RATING_PATHS.playersFolder}/${player.displayName}.json`;

    if (!fs.existsSync(playerStatsPath)) {
        player.send('Вы ещё не участвовали в рейтинговых играх.');
        return;
    }

    const fileContent = fs.readFileSync(playerStatsPath).toString();
    const playerStats = JSON.parse(fileContent);

    const heroesPlayed = playerStats['heroesPlayed'];
    let lastHeroesPlayed = '';

    for (let i = 0; i < 10; i++) {
        if (heroesPlayed[i] == null) break;

        lastHeroesPlayed += getHeroEmojiCode(heroesPlayed[i]);
    }

    playerStats.rating = getPlayerRatingConverted(player);

    const format = '**';
    const relativeImpact = Math.round(playerStats.relativeImpact * 100 / playerStats.matches);

    const embed = new Discord.MessageEmbed()
        .setAuthor(`Статистика рейтинговых игр ${player.displayName}`, player.user.avatarURL())
        .addField(`Общая информация`, `Побед: ${format}${playerStats.wins}${format}\n` +
                `Поражений: ${format}${playerStats.loses}${format}\n` +
                `Рейтинг: ${format}${playerStats.rating}${format}\n` +
                `Относительный импакт: ${format}${relativeImpact}%${format}\n` +
                `Последние персонажи: ${lastHeroesPlayed}\n`)
        .setColor(RATING_STATS_COLORS.playerStats);

    player.send(embed);
}

async function sendHeroStats(message, user, heroName) {
    const memberName = message.guild.members.cache.get(user.id).displayName;

    const heroId = getHeroIdByName(heroName);

    const generalHeroData = await getHeroData(heroId);
    const playerHeroData = await getHeroData(heroId, memberName);

    const hasPlayerEverPlayed = playerHeroData.picks == 0 ? false : true;
    const hasAnyoneEverPlayed = generalHeroData.picks == 0 ? false : true;

    const generalStats = getHeroGeneralStatsFormatted(generalHeroData);
    const detailedStats = getHeroDetailedStatsFormatted(generalHeroData);
    const playerGeneralStats = getHeroGeneralStatsFormatted(playerHeroData);
    const playerDetailedStats = getHeroDetailedStatsFormatted(playerHeroData);

    const generalTitle = 'Общая статистика';
    const playerTitle = 'Ваша статистика';
    const generalDetailedTitle = 'Средний вклад всех игроков';
    const playerDetailedTitle = 'Ваш средний вклад';

    const embed = new Discord.MessageEmbed()
        .setTitle(`Рейтинговая статистика персонажа ` + getHeroEmojiCode(heroId))
        .setColor(RATING_STATS_COLORS.heroStats);

    if (hasAnyoneEverPlayed) {
        if (hasPlayerEverPlayed) {

            embed.addFields(
                { name: generalTitle, value: generalStats, inline: true },
                { name: '\u200B', value: '\u200B', inline: true },
                { name: playerTitle, value: playerGeneralStats, inline: true },
                { name: generalDetailedTitle, value: detailedStats, inline: true },
                { name: '\u200B', value: '\u200B', inline: true },
                { name: playerDetailedTitle, value: playerDetailedStats, inline: true },
            );

        } else {

            embed.addFields(
                { name: generalTitle, value: generalStats },
                { name: generalDetailedTitle, value: detailedStats }
            );

        }
    } else {
        embed
            .addField(generalTitle, 'Пока никто из игроков не играл на этом персонаже.')
            .setColor(RATING_STATS_COLORS.heroNobodyPlayedStats)
    }

    user.send(embed);

    log(`Отправлена статистика по персонажу ${heroName} игроку ${memberName}.`);
}

async function notifyPlayersAboutRatingMatch(message) {
    const ratingInfoChannel = message.guild.channels.cache.get('610924170444013619');
    const notificationMessage = await ratingInfoChannel.messages.fetch('699586445752664174');

    notificationMessage.reactions.cache.first().users.fetch().then(users => {
        const usersId = users.keys();
        let messageCount = 0;
        for (const id of usersId) {
            let receiver = notificationMessage.guild.members.cache.get(id);

            if (receiver != null) {
                receiver.send(`Объявлен набор на рейтинговую игру. Перейти: <#${message.channel.id}>.`);
                messageCount++;
            }
        }

        log(`Отправлено уведомление о рейтинговой игре ${messageCount} игрокам.`);
    });
}

async function fetchPlayerStats(guild) {
    const statsChannel = guild.channels.cache.get('610924170444013619');
    const messageToFetch = '611657090963996672';

    const message = await statsChannel.messages.fetch(messageToFetch)

    const filter = (reaction, user) => {
        return true;
    };

    const collector = message.createReactionCollector(filter, { time: INT32_MAX });

    collector.on('collect', (reaction, reactionCollector) => {
        const reactorId = reaction.users.cache.last().id;
        const reactor = guild.members.cache.get(reactorId);

        sendPlayerStats(reactor, reactor.dmChannel);
    });
}

async function fetchHeroesStats(guild) {
    const statsChannel = guild.channels.cache.get('610924170444013619');
    const messagesToFetch = ['702957152805060768', '868592919827861504'];

    for (const messageId of messagesToFetch) {
        let message = await statsChannel.messages.fetch(messageId);

        const filter = (reaction, user) => {
            return true;
        };

        const collector = message.createReactionCollector(filter, { time: INT32_MAX });

        collector.on('collect', (reaction, reactionCollector) => {
            const reactor = reaction.users.cache.last();
            const heroName = reaction.emoji.name;

            sendHeroStats(message, reactor, heroName);
        });
    }
}

exports.fetchPlayerStats = fetchPlayerStats;
exports.fetchHeroesStats = fetchHeroesStats;
exports.sendHeroStats = sendHeroStats;
exports.sendPlayerStats = sendPlayerStats;
exports.notifyPlayersAboutRatingMatch = notifyPlayersAboutRatingMatch;

async function getHeroData(heroId, playerName, format) {
    const heroData = new HeroData();

    const dir = `${RATING_PATHS.matchesFolder}/`;
    const filesReading = readFiles(dir, function (filename, content) {
        const matchData = JSON.parse(content);
        const playerCount = matchData['info']['playerCount'];

        if (format == '5v5' && playerCount != 10 || format == '4v4' && playerCount != 8) return;

        for (let i = 1; i <= 10; i++) {
            const playerData = matchData[`player${i}`];
            if (playerData == null) continue;

            const doesNameMatch = (playerName == null || playerName == playerData['name']);
            const doesHeroIdMatch = (playerData['heroId'] == heroId);
            const doesPlayerMatch = (doesHeroIdMatch && doesNameMatch);
            if (!doesPlayerMatch) continue;

            heroData.picks++;

            const winner = matchData['info']['winner'];
            heroData.matchDuration += matchData['info']['time'];

            const isPlayerWinner = ((winner == 0 && i <= 5) || (winner == 1 && i > 5));
            isPlayerWinner ? heroData.wins++ : heroData.loses++;

            if (playerData['questTime'] != null) {
                heroData.questsDone++;
            }

            Object.keys(playerData).forEach(function (key) {
                heroData[key] += playerData[key];
            });
        }
    }, function (err) {
        throw err;
    });

    await filesReading;

    return heroData;
}

function getHeroGeneralStatsFormatted(heroData) {
    const stats = {
        ['Сыграно матчей']: heroData.picks,
        ['Побед']: heroData.wins,
        ['Поражений']: heroData.loses,
    };

    stats['Длительность матчей'] = getTimeFormatted(heroData.matchDuration / heroData.picks);

    return getFormattedStats(stats);
}

function getHeroDetailedStatsFormatted(heroData) {
    const stats = {};

    const getAverage = (value, denominator = heroData.picks) => {
        return parseInt(value / denominator);
    }

    stats['Убийств'] = getAverage(heroData.kills);
    stats['Смертей'] = getAverage(heroData.deaths);

    stats['Урон и лечение'] = null;

    stats['Нанесено урона'] = `${getAverage(heroData.skillshotDamage)} / ${getAverage(heroData.magicDamage)} / ${getAverage(heroData.pureDamage)}`;
    stats['Получено урона'] = `${getAverage(heroData.gotDamage)} / ${getAverage(heroData.blockedDamage)}`;

    if (heroData.healedSelf > 0 || heroData.healedSelfFight > 0) {
        stats['Самолечение'] = `${getAverage(heroData.healedSelf)} / ${getAverage(heroData.healedSelfFight)} / ${getAverage(heroData.selfHealReduced)}`;
    }

    if (heroData.healedAlly > 0 || heroData.healedAllyFight > 0) {
        stats['Лечение союзников'] = `${getAverage(heroData.healedAlly)} / ${getAverage(heroData.healedAllyFight)} / ${getAverage(heroData.allyHealReduced)}`;
    }

    stats['Задачи'] = null;

    stats['Выполнено задач'] = `${heroData.questsDone}/${heroData.picks}`;

    if (heroData.questsDone > 0) {
        stats['Время выполнения'] = `${getTimeFormatted(heroData.questTime / heroData.questsDone)}`;
    }

    stats['Рейтинг'] = null;

    stats['Очков импакта'] = getAverage(heroData.impactPoints);
    stats['Дельта рейтинга'] = getAverage(heroData.ratingDelta);

    return getFormattedStats(stats);
}

function getFormattedStats(stats) {
    let generalStatsFormatted = '';

    for (const key in stats) {
        const valueHighlight = '**';
        const formattedValue = `${valueHighlight}${stats[key]}${valueHighlight}`;

        if (stats[key] != null) {
            generalStatsFormatted += `${key}: ${formattedValue}\n`;
        } else {
            generalStatsFormatted += '\n';
        }
    }

    return generalStatsFormatted;
}