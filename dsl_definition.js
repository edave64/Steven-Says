const dsl_parser = require("./dsl_parser");

function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
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
        text = text.toString().replace(/\\/g, "\\\\'").replace(/'/g, "\\'").toLowerCase();
        return "!!context.speakers.includes('" + text + "')";
    },
    'season': function (number) {
        if (typeof number != "number")
            throw "Argument for 'season' expression must be a number.";
        return "context.season === " + number;
    },
};

DSL[''] = DSL['and']; // Expression to use when no name is given

module.exports = new dsl_parser.Parser(DSL);
