const { getPlayerRatingValue, getPlayerRatingConverted } = require("./rating");

const INT32_MAX = 2147483647;

function getPlayerDistributionByRating(members) {
    let players = [];
    for (let i = 0; i < members.length; i++) {
        players.push({ 
            member: members[i],
            name: members[i].displayName, 
            rating: getPlayerRatingValue(members[i]) 
        });
    }

    players.sort(function (a, b) {
        return (a.rating > b.rating ? -1 : 1);
    });

    players = sortArrayByTwoEqualAveragesByKey(players, 'rating');

    let redTeam = '';
    let blueTeam = '';
    let redTeamRating = 0;
    let blueTeamRating = 0;
    for (let i = 0; i < players.length / 2; i++) {
        let member = players[i].member;
        redTeam += `${member} [${getPlayerRatingConverted(member)}]\n`;
        redTeamRating += players[i].rating;

        member = players[i + players.length / 2].member;
        blueTeam += `${member} [${getPlayerRatingConverted(member)}]\n`;
        blueTeamRating += players[i + players.length / 2].rating;
    }

    const redTeamAverageRating = parseInt(redTeamRating / players.length * 2);
    const blueTeamAverageRating = parseInt(blueTeamRating / players.length * 2);

    redTeam += `*Средний рейтинг: ${redTeamAverageRating}*`;
    blueTeam += `*Средний рейтинг: ${blueTeamAverageRating}*`;

    return { redTeamText: redTeam, blueTeamText: blueTeam };
}

exports.getPlayerDistributionByRating = getPlayerDistributionByRating;

function sortArrayByTwoEqualAveragesByKey(array, key) {
    const firstArray = [];
    const secondArray = [];
    const arrayLength = array.length / 2;
    let firstAverage = 0;
    let secondAverage = INT32_MAX;

    for (let j = 0; j < Math.pow(array.length, 2); j++) {
        const randomlySortedArray = array.sort(() => Math.random() - 0.5);

        let newFirstAverage = 0;
        let newSecondAverage = 0;

        for (let i = 0; i < array.length; i++) {
            if (i < arrayLength) {
                newFirstAverage += randomlySortedArray[i][key];
            } else {
                newSecondAverage += randomlySortedArray[i][key];
            }
        }

        let diff = newSecondAverage - newFirstAverage;
        if (Math.abs(diff) < Math.abs(firstAverage - secondAverage)) {
            firstAverage = newFirstAverage;
            secondAverage = newSecondAverage;

            for (let i = 0; i < array.length; i++) {

                if (i < arrayLength) {
                    firstArray[i] = randomlySortedArray[i];
                } else {
                    secondArray[i - arrayLength] = randomlySortedArray[i];
                }
                
            }
        }
    }

    for (let i = 0; i < array.length; i++) {

        if (i < firstArray.length) {
            array[i] = firstArray[i];
        } else {
            array[i] = secondArray[i - firstArray.length];
        }

    }
    
    return array;
}