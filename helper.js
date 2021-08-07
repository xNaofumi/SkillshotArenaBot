const fs = require('fs');

function log(message) {
    let date = new Date();
    let hours = (date.getHours() < 10) ? '0' : '';
    let minutes = (date.getMinutes() < 10) ? '0' : '';
    hours += date.getHours();
    minutes += date.getMinutes();

    let currentTime = hours + ':' + minutes;
    message = `[${currentTime}] ${message}`;

    console.log(message);

    fs.appendFile('log.txt', '\r\n' + message, (err) => {
        if (err) throw err;
    });
}

function removeMin(arr) {
    let low = (Math.min.apply(null, arr));

    arr.splice(arr.indexOf(low), 1);

    return arr;
}

exports.log = log;
exports.removeMin = removeMin;