const http = require('https');
const fs = require('fs');
const { RATING_PATHS, RATING_INITIAL_VALUE } = require('../const/rating');
const { convertIniToObj } = require('../formatHelper');
const { updateRatingPlayersData, updateRatingTable } = require('./rating');
const { log } = require('../helper');

async function tryUploadRatingMatch(message, guild, attachment) {
    try {
        await uploadRatingMatch(attachment);
        await updateRatingPlayersData(guild);

        const ratingInfoChannel = guild.channels.cache.get('610924170444013619');
        const ratingTableMessage = await ratingInfoChannel.messages.fetch('611144292525801482');
        await updateRatingTable(ratingTableMessage);
    } catch (err) {
        message.channel.send(`Ошибка: ${err.message}. Свяжитесь с администратором.`);
        log(err.stack);
        return;
    }

    message.channel.send(`Рейтинговый матч ${attachment.name} успешно загружен.`);
    log(`Загружен рейтинговый матч ${attachment.name} организатором.`);
}

exports.tryUploadRatingMatch = tryUploadRatingMatch;

function uploadRatingMatch(attachment) {
    const fileName = attachment.name;
    const path = `${RATING_PATHS.uploadFolder}/${fileName}`;
    const fileStream = fs.createWriteStream(path);

    const promise = new Promise(function (resolve, reject) {

        http.get(attachment.url, function (response) {
            response.pipe(fileStream).on('finish', writeContent);
        });

        function writeContent() {
            const content = fs.readFileSync(path).toString();
            const matchDataObj = convertIniToObj(content);

            const matchRatingResults = getMatchRatingResults(matchDataObj);
            writeMatchPlayersData(matchDataObj, matchRatingResults);

            for (let i = 1; i <= 10; i++) {
                const index = `player${i}`;
                if (matchDataObj[index] == null) continue;

                matchDataObj[index].ratingDelta = matchRatingResults[i].ratingDelta;
                matchDataObj[index].relativeImpact = matchRatingResults[i].relativeImpact;
            }
            const matchDataJSON = JSON.stringify(matchDataObj, null, '\t');

            fs.writeFile(`${RATING_PATHS.matchesFolder}/${fileName.replace('.txt', '.json')}`, matchDataJSON, err => {
                if (err) throw err;
            }, () => {
                resolve('done')
            });
        }
    });

    return promise;
}

function getMatchRatingResults(matchData) {
    const results = [];

    let totalImpact = 0;
    let averageImpact;
    const relativeImpact = {};
    const ratingDelta = {};
    let relativeImpactAbsSum = 0;

    for (let i = 1; i <= 10; i++) {
        if (matchData[`player${i}`] == null) continue;

        totalImpact += matchData[`player${i}`]['impactPoints'];
    }

    averageImpact = totalImpact / matchData['info']['playerCount'];

    for (let i = 1; i <= 10; i++) {
        if (matchData[`player${i}`] == null) continue;

        relativeImpact[i] = matchData[`player${i}`]['impactPoints'] - averageImpact;
        relativeImpactAbsSum += Math.abs(relativeImpact[i]);
    }

    for (let i = 1; i <= 10; i++) {
        if (matchData[`player${i}`] == null) continue;

        const winner = matchData['info']['winner'];
        const isPlayerWinner = ((winner == 0 && i <= 5) || (winner == 1 && i > 5));
        ratingDelta[i] = isPlayerWinner ? 25 : -25;

        relativeImpact[i] /= relativeImpactAbsSum;
        ratingDelta[i] += relativeImpact[i] * 100;

        results[i] = {
            relativeImpact: Math.round(relativeImpact[i] * 100) / 100,
            ratingDelta: Math.round(ratingDelta[i]),
        }
    }

    return results;
}

function writeMatchPlayersData(matchData, playersResults) {
    for (let i = 1; i <= 10; i++) {
        if (matchData[`player${i}`] == null) continue;

        const winner = matchData['info']['winner'];
        const hasWon = (i < 6 && winner == 0) || (i > 5 && winner == 1);

        const playerDataPath = `${RATING_PATHS.playersFolder}/${matchData[`player${i}`]['name']}.json`;
        const playerDataObj = {
            name: matchData[`player${i}`]['name'],
            matches: 1,
            wins: 0,
            loses: 0,
            matchTotalDuration: matchData['info']['matchDuration'],
            heroesPlayed: [matchData[`player${i}`]['heroId']],
            rating: playersResults[i].ratingDelta,
            relativeImpact: playersResults[i].relativeImpact,
        };

        if (hasWon) {
            playerDataObj['wins']++;
        } else {
            playerDataObj['loses']++;
        }

        if (fs.existsSync(playerDataPath)) {
            fs.readFile(playerDataPath, 'utf8', (err, data) => {
                const obj = JSON.parse(data);

                for (const key in obj) {
                    if (typeof (obj[key]) != 'number') continue;

                    obj[key] += playerDataObj[key];
                }

                obj['heroesPlayed'].push(matchData[`player${i}`]['heroId']);

                const json = JSON.stringify(obj, null, '\t');
                fs.writeFile(playerDataPath, json, 'utf8', err => {
                    if (err) throw err;
                });
            });
        } else {
            playerDataObj.rating = RATING_INITIAL_VALUE + playerDataObj.rating;
            const playerDataJSON = JSON.stringify(playerDataObj, null, '\t');

            fs.writeFile(playerDataPath, playerDataJSON, err => {
                if (err)
                    throw err;
            });
        }
    }
}