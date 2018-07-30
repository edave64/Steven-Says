const data = require("./data.json");
const readline = require('readline');
const parser = require('./dsl_parser');
const queryLanguage = require('./dsl_definition');
const chalk = require('chalk');
const vm = require('vm');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var executionContext = {
    context: null,
    res: null,
};
vm.createContext(executionContext);

if (process.argv[2]) {
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
    var func;
    try {
        func = queryLanguage.Parser.parse(query, true);
    } catch (e) {
        if (e instanceof queryLanguage.DSLError) {
            console.error(chalk.red(e.message));
            return;
        }
        if (e instanceof parser.ParserError) {
            console.error(chalk.red(e.message));
            return;
        }
        throw e;
    }

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
        executionContext.context = context;
        executionContext.res = null;

        func.runInContext(executionContext);

        if (executionContext.res) {
            console.log(
                  chalk.cyanBright(`S${seasonNr}E${episode.nr < 10 ? "0" + episode.nr : episode.nr}`)
                + chalk.yellowBright(` [${element.speakers.join(",")}] `)
                + element.text + "\n");
        }
    })
}
