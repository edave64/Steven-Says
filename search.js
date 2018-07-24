const data = require("./data.json");
const query_dsl = require("./query_dsl");

function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function join (args, joiner) {
    let text = "";
    for (let key in args) {
        if (text > "") text += joiner
        if (args[key] instanceof query_dsl.FunctionSnipplet) {
            text += "(" + args[key].text + ")"
        } else {
            text += "(" + DSL.text(args[key]) + ")"
        }
    }
    return text;
}

const DSL = {
    'and': function () {
        return join(arguments, "&&");
    },
    'or': function () {
        return join(arguments, "||");
    },
    'word': function (text) {
        text = escapeRegExp(text.toString());
        return "context.text.match(/\\b" + text + "\\b/i)"
    },
    'text': function (text) {
        text = escapeRegExp(text.toString());
        return "context.text.match(/" + text + "/i)"
    },
    'speaker': function (text) {
        text = text.toString().replace(/\\/g, "\\\\'").replace(/'/g, "\\'");
        return "context.speakers.includes('" + text + "')";
    },
    'season': function (number) {
        if (typeof number != "number")
            throw "Argument for 'season' expression must be a number.";
        return "context.season === " + number
    },
}

DSL[''] = DSL['and'] // Expression to use when no name is given

var Parser = new query_dsl.Parser(DSL);

var func = Parser.parse("(word 'tea) (speaker 'Connie) (season 4)");

console.log(func.toString());


data.seasons.forEach((element, i) => {
    SearchSeason(i + 1, element, func)
})

function SearchSeason (nr, season, func) {
    season.forEach(element => {
        SearchEpisode(nr, element, func);
    });
}

function SearchEpisode (seasonNr, episode, func) {
    episode.dialog.forEach(element => {
        const context = {
            text: element.text,
            speakers: element.speakers,
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
