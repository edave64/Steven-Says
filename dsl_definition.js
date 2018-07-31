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

function DSLError(message) {
    this.name = "DSLError";
    this.message = (message || "");
}
DSLError.prototype = Object.create(Error.prototype);
DSLError.prototype.constructor = DSLError;

function typeName (object) {
    if (object instanceof dsl_parser.FunctionSnipplet) {
        return "Sub-Expression"
    }
    return typeof object;
}

function validateMinArguments (name, args, min) {
    if (args.length < min) {
        throw new DSLError (`The '${name}' expression needs at least ${min} argument(s). ${args.length} given.`)
    }
}

function validateMaxArguments (name, args, max) {
    if (args.length > max) {
        throw new DSLError (`The '${name}' expression only supports ${max} argument(s). ${args.length} given.`)
    }
}

function validateTextFunction (name, args) {
    validateMinArguments(name, args, 1);
    if (typeof args[0] !== "string" && typeof args[0] !== "number") {
        throw new DSLError (`The 'word' expression only supports string or number arguments. '${typeName(text)}' given.`)
    }
    validateMaxArguments(name, args, 1);
}

const DSL = {
    'and': function () {
        validateMinArguments("and", arguments, 1);
        return join(arguments, "&&");
    },
    'or': function () {
        validateMinArguments("or", arguments, 1);
        return join(arguments, "||");
    },
    'xor': function () {
        validateMinArguments("xor", arguments, 1);
        return "(0 + " + join(arguments, "+") + ") === 1";
    },
    'not': function (func) {
        validateMinArguments("not", arguments, 1);
        validateMaxArguments("not", arguments, 1);
        return "!(" + normalizeLogicalArgument(func) + ")";
    },
    'word': function (text) {
        validateTextFunction("word", arguments);
        return "!!context.text.match(/\\b" + escapeRegExp(text.toString()) + "\\b/i)"
    },
    'text': function (text) {
        validateTextFunction("text", arguments);
        return "!!context.text.match(/" + escapeRegExp(text.toString()) + "/i)"
    },
    'begins': function (text) {
        validateTextFunction("begins", arguments);
        return "!!context.text.match(/\\b" + escapeRegExp(text.toString()) + "/i)"
    },
    'ends': function (text) {
        validateTextFunction("ends", arguments);
        return "!!context.text.match(/" + escapeRegExp(text.toString()) + "\\b/i)"
    },
    'speaker': function (text) {
        validateTextFunction("speaker", arguments);
        text = text.toString();
        text = module.exports.SpeakerAliases[text] || text;
        text = escapeString(text.toLowerCase());
        return "!!context.speakers.includes('" + text + "')";
    },
    'season': function (number) {
        validateMinArguments("season", arguments, 1);
        validateMaxArguments("season", arguments, 1);
        if (typeof number != "number") {
            throw new DSLError (`The 'season' expression only supports number arguments. '${typeName(number)}' given.`)
        }
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
        "Lapis Lazuli": "Lapis",
        "Recorder with Peridot talking": "Peridot"
    },
    DSLError: DSLError,
};
