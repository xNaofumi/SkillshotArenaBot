const RATING_PATHS = {
    playersFolder: './ratingData/players',
    matchesFolder: './ratingData/matches',
    uploadFolder: './upload/matches',
}

const GAME_HOST_COLORS = {
    draft: 0xF1C40F,
    finished: 0xC1F45F,
    noPlayers: 0xE1343F,
    pause: 0xB1C40F,
}

const RATING_STATS_COLORS = {
    heroStats: 0x5FC0C0,
    heroNobodyPlayedStats: 0xAA7030,
    ratingTable: 0x2FC0C0,
    ratingTableNoPlayers: 0xBB2020,
    playerStats: 0x5FC0C0,
}

const RATING_CALIBRATE_MATCHES = 5;
const RATING_INITIAL_VALUE = 2000;

exports.RATING_PATHS = RATING_PATHS;
exports.GAME_HOST_COLORS = GAME_HOST_COLORS;
exports.RATING_STATS_COLORS = RATING_STATS_COLORS;

exports.RATING_CALIBRATE_MATCHES = RATING_CALIBRATE_MATCHES;
exports.RATING_INITIAL_VALUE = RATING_INITIAL_VALUE;