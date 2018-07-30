const vm = require('vm');

function ParserError(message) {
    this.name = "ParserError";
    this.message = (message || "");
}
ParserError.prototype = Object.create(Error.prototype);
ParserError.prototype.constructor = ParserError;

module.exports = {
    Parser: (function () {
        function Parser (language) {
            this.language = language;
        }

        Parser.prototype.parse = function (statement, untrusted) {
            return this._parseSingleStatement(statement, true, 0, untrusted);
        }

        Parser.States = {
            ExpressionName: 0,
            ExpressionBody: 1,
            Integer: 2,
            String: 3,
            StringEscape: 4,
            Word: 5
        }

        function isSyntaxChar (char) {
            return char.match(/[\(\)\"\'\s]/);
        }

        function isNumericChar (char) {
            return char.match(/\d/);
        }

        /**
         * 
         * @param {string} statement 
         * @param {boolean} root 
         */
        Parser.prototype._parseSingleStatement = function (statement, root, begin, untrusted) {
            let functionName = "";
            let args = [];
            let word = "";

            let state = Parser.States.ExpressionName;

            for (let i = begin; i < statement.length; ++i) {
                const char = statement[i];

                switch (state) {
                    case Parser.States.ExpressionName:
                        if (isSyntaxChar(char)) {
                            functionName = word;
                            state = Parser.States.ExpressionBody;
                            --i;
                        } else {
                            word += char;
                        }
                        break;
                    case Parser.States.ExpressionBody:
                        switch (char) {
                            case '(':
                                const [sub_func, end] = this._parseSingleStatement(statement, false, i + 1);
                                i = end;
                                args.push(sub_func);
                                break;
                            case ')':
                                if (root) throw new ParserError ("Unbalanced parenthesis. The expression closed at character " + (i + 1) + " has not been opened.");
                                return [this._buildExpression(functionName, args), i];
                            case '"':
                                state = Parser.States.String;
                                word = "";
                                break;
                            case "'":
                                state = Parser.States.Word;
                                word = "";
                                break;
                            default:
                                if (isNumericChar(char)) {
                                    state = Parser.States.Integer;
                                    word = char;
                                } else if (char.trim() !== "") {
                                    throw new ParserError ("Unexected character '" + char + "' in expression body at position " + (i + 1) + ".");
                                }
                        }
                        break;
                    case Parser.States.Integer:
                        if (!isNumericChar(char)) {
                            args.push(parseInt(word));
                            --i;
                            state = Parser.States.ExpressionBody;
                        } else {
                            word += char;
                        }
                        break;
                    case Parser.States.String:
                        if (char === '\\') {
                            state = Parser.States.StringEscape;
                        } else if (char === '"') {
                            state = Parser.States.ExpressionBody;
                            args.push(word);
                        } else {
                            word += char;
                        }
                        break;
                    case Parser.States.StringEscape:
                        word += char;
                        state = Parser.States.String;
                        break;
                    case Parser.States.Word:
                        if (isSyntaxChar(char)) {
                            state = Parser.States.ExpressionBody;
                            args.push(word);
                            i--;
                        } else {
                            word += char;
                        }
                        break;
                }
            }
            if (!root) {
                throw new ParserError ("Unbalanced parenthesis. The expression started at character " + begin + " has not been closed.");
            }
            if (state === Parser.States.Word) {
                state = Parser.States.ExpressionBody;
                args.push(word);
            }
            if (state === Parser.States.Integer) {
                state = Parser.States.ExpressionBody;
                args.push(parseInt(word));
            }
            if (state === Parser.States.ExpressionName) {
                functionName = word;
                state = Parser.States.ExpressionBody;
            }
            if (state !== Parser.States.ExpressionBody) {
                throw new ParserError ("Unexpected end of input");
            }
            const mainFunc = this._buildExpression(functionName, args);
            if (untrusted) {
                // Generate a script object that can be executed in a seperate context.
                return vm.createScript("res = " + mainFunc.text);
            } else {
                return new Function ("context", "return " + mainFunc.text);
            }
        }
        /**
         * @param {string} func_name 
         * @param {any[]} args 
         * @returns {FunctionSnipplet}
         */
        Parser.prototype._buildExpression = function (func_name, args) {
            var func = this.language[func_name];

            if (!func) {
                throw new ParserError (`Unknown expression type '${func_name}'.`);
            } 

            return new module.exports.FunctionSnipplet(func.apply(undefined, args));
        }

        return Parser;
    }()),
    FunctionSnipplet: function FunctionSnipplet (text) {
        this.text = text;
    },
    ParserError: ParserError,
}
