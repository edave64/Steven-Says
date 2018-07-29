const data = require("./data.json");
const readline = require('readline');
const queryLanguage = require('./dsl_definition');

const rl = readline.createInterface({
input: process.stdin,
output: process.stdout
});  

if (process.argv[2]) {
    console.log("Executing: " + process.argv[2]);
    execute(process.argv[2]);
    process.exit()
} else {
    console.log("Please enter your query:");
    askQuery();
}

function askQuery () {
    rl.question("> ", (answer) => {
        if (answer === "exit") process.exit();

        execute(answer);
        askQuery();
    });
}

function execute (query) {
    var func = queryLanguage.Parser.parse(query);

    console.log("Toast", func);

    data.seasons.forEach((element, i) => {
        SearchSeason(i + 1, element, func)
    })
}

function SearchSeason (nr, season, func) {
    season.forEach(element => {
        SearchEpisode(nr, element, func);
    });
}

function SearchEpisode (seasonNr, episode, func) {
    episode.dialog.forEach(element => {
        const context = {
            text: element.text,
            speakers: element.speakers.map(x => x.toLowerCase()),
            season: seasonNr,
            episode: episode.nr,
        }
        if (func(context)) {
            console.log(
                  "S" + seasonNr
                + "E" + episode.nr
                + " [" + element.speakers.join(",") + "] "
                + element.text + "\n");
        }
    })
}
