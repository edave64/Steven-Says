const dsl_parser = require("./dsl_parser");
const escapeRegExp = require("escape-string-regexp");

function escapeString(str) {
    return str.replace(/\\/g, "\\\\'").replace(/'/g, "\\'");
}

function normalizeLogicalArgument (arg) {
    if (arg instanceof dsl_parser.FunctionSnipplet) {
        return "(" + arg.text + ")"
    } else {
        return "(" + DSL.text(arg) + ")"
    }
}

function join (args, joiner) {
    let text = "";
    for (let key in args) {
        if (text > "") text += joiner;
        text += normalizeLogicalArgument(args[key]);
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
    'xor': function () {
        return "(0 + " + join(arguments, "+") + ") === 1";
    },
    'not': function (func) {
        return "!(" + normalizeLogicalArgument(func) + ")";
    },
    'word': function (text) {
        return "!!context.text.match(/\\b" + escapeRegExp(text.toString()) + "\\b/i)"
    },
    'text': function (text) {
        return "!!context.text.match(/" + escapeRegExp(text.toString()) + "/i)"
    },
    'begins': function (text) {
        return "!!context.text.match(/\\b" + escapeRegExp(text.toString()) + "/i)"
    },
    'ends': function (text) {
        return "!!context.text.match(/" + escapeRegExp(text.toString()) + "\\b/i)"
    },
    'speaker': function (text) {
        text = text.toString();
        text = module.exports.SpeakerAliases[text] || text;
        text = escapeString(text.toLowerCase());
        return "!!context.speakers.includes('" + text + "')";
    },
    'season': function (number) {
        if (typeof number != "number")
            throw "Argument for 'season' expression must be a number.";
        return "context.season === " + number;
    },
};

DSL[''] = DSL['and']; // Expression to use when no name is given

module.exports = {
    Parser: new dsl_parser.Parser(DSL),
    SpeakerAliases: {
        "Ruby (Doc)": "Doc",
        "Ruby (Leggy)": "Leggy",
        "Ruby (Army)": "Army",
        "Ruby (Navy)": "Navy",
        "Ruby (Eyeball)": "Eyeball",
        "Zircon (D)": "Zircon (Defense)",
        "Zircon (P)": "Zircon (Prosecuting)",
        "Rutile": "Rutile Twins",
        "Barb": "Barbara",
        "Barbara Miller": "Barbara",
        "Mr. Maheswaran": "Doug",
        "Doug Maheswaran": "Doug",
        "Mr.": "Doug", // This is a bug when parsing  "Mr. & Dr. Maheswaran". But it works for now.
        "Lapis Lazuli": "Lapis"
    },
};
