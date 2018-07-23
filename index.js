const data = require("./data.json");
const speakers = [];

data.seasons.forEach((element, i) => {
    SearchSeason(i + 1, element)
})

function SearchSeason (nr, season) {
    season.forEach(element => {
        SearchEpisode(nr, element);
    });
}

function SearchEpisode (seasonNr, episode) {
    episode.dialog.forEach(dialog => {
        dialog.speakers.forEach(speaker => {
            if (!speakers.includes(speaker)) speakers.push(speaker);
        });
    });
}

console.log((speakers.length));
console.log(JSON.stringify(speakers));
