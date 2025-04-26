const commands = {
    async jargon(...args) {
        const options = $.terminal.parse_options(args, { boolean: ['s']});
        // there are options
        if (options._.length) {
            const query = options._.join(' ');
            // search option
            if (options.s) {
                const { data, error } = await jargon_search(query);
                if (error) {
                    this.error(error);
                } else {
                    this.echo(data.map((term) => {
                        return `<name>${term}</name>`;
                    }).join('\n'));
                }
            } else {
                // normal query
                const { data, error } = await jargon_term(query);
                if (error) {
                    this.error(error);
                } else {
                    const entry = format_entry(data);
                    this.echo(entry.trim(), {
                        keepWords: true
                    });
                }
            }
        } else {
            const msg = 'This is the Jargon File, a comprehens'+
                  'ive compendium of hacker slang illuminating m'+
                  'any aspects of hackish tradition, folklore, a'+
                  'nd humor.\n\nusage: jargon [-s] &lt;QUERY&gt;'+
                  '\n\n-s search jargon file';
            const logo = `<bold><white>${jargon.innerHTML}</white></bold>`;
            this.echo(`${logo}\n${msg}`, { keepWords: true });
        }
    },
    record(...args) {
        // toggle storing commands in URL hash
        if (args[0] === 'start') {
            term.history_state(true);
        } else if (args[0] === 'stop') {
            term.history_state(false);
        } else {
            this.echo('save commands in url hash so you can rerun them\n\n' +
                      'usage: record [stop|start]');
        }
    },
    async rfc(...args) {

        if (args[0] == '--help') {
            term.echo('Browser of RFC documents, using less unix command.\n\n' +
                      'If you execute without arguments you will get index page\n' +
                      'And on that page you can use / followed by text, to search\n' +
                      'links to RFC documents are clickable');
        } else {
            try {
                if (args.length) {
                    if (Number.isInteger(args[0])) {
                        const number = args[0];
                        const url = `https://www.rfc-editor.org/rfc/rfc${number}.txt`;
                        const rfc = await fetch_rfc(url);
                        display_rfc(rfc);
                    } else {
                        this.error('invalid RFC number');
                    }
                } else {
                    const rfc = await fetch_rfc('http://www.rfc-editor.org/in-notes/rfc-index.txt');
                    display_rfc(rfc);
                }
            } catch(err) {
                this.error(err.message);
            }
        }
    },
    credits() {
        const text = [
            '',
            'Tools, libraries, and services used:',
            '* [[!b;#fff;;;https://terminal.jcubic.pl/]jQuery Terminal]',
            '* [[!b;#fff;;;https://github.com/patorjk/figlet.js]Figlet.js] + Modular and Rectangles fonts',
            '* [[!b;#fff;;;http://catb.org/jargon/html/index.html]Jargon File] 4.4.7',
            '* [[!b;#fff;;;https://www.rfc-editor.org/]RFC Editor]',
            '* [[!b;#fff;;;https://sqlitecloud.io/]SQLite Cloud]',
            '* [[!b;#fff;;;https://www.browserstack.com/]BrowserStack]',
            ''
        ].join('\n');
        this.echo(text, { keepWords: true });
    },
    help() {
        const list = formatter.format(command_list());
        this.echo(`Available commands: ${list}.`, { keepWords: true });
        this.echo('An <command>rfc</command> command use simplifed unix less command.\n', {
            keepWords: true
        });
    }
};

$.terminal.defaults.formatters.unshift([/(rfc\s?([0-9]+))/gi, '<rfc num="$2">$1</rfc>', {
    echo: true
}]);

//$.terminal.defaults.formatters.push([/ ([0-9+]\. )/g, '\n$1']);
$.terminal.xml_formatter.tags.name = () => '[[!bu;#fff;;jargon]';
$.terminal.xml_formatter.tags.emphasis = () => '[[b;#fff;]';
$.terminal.xml_formatter.tags.command = () => '[[!bu;#fff;;command]';
$.terminal.xml_formatter.tags.rfc = ({ num }) => `[[!bu;yellow;;rfc;${num}]`;

const formatter = new Intl.ListFormat('en', {
    style: 'long',
    type: 'conjunction',
});

const term = $('body').terminal(commands, {
    checkArity: false,
    execHash: true,
    exit: false,
    execAnimation: true,
    execHistory: true,
    completion: true,
    greetings: false,
    prompt: '<DodgerBlue>~</DodgerBlue>&gt; ',
    onInit() {
        this.echo(() => {
            const cols = this.cols();
            if (cols >= 92) {
                return greetings_big.innerHTML;
            } else if (cols >= 57) {
                return greetings_medium.innerHTML;
            } else if (cols >= 35) {
                return greetings_small.innerHTML;
            } else {
                return greetings_tiny.innerHTML
            }
        });
    }
});

term.echo([
    'Type <command>jargon "hacker"</command> to get the entry from Jargon File.',
    'Type <command>jargon -s hack</command> to search.',
    'Type <command>jargon</command> to see help screen.',
    'Type <command>help</command> to see other commands.',
    ''
].join('\n'), { keepWords: true });

term.on('click', 'a.jargon', function() {
    const href = $(this).attr('href');
    term.exec(`jargon ${href}`);
    return false;
}).on('click', 'a.command', function() {
    const command = $(this).attr('href');
    term.exec(command);
    return false;
}).on('click', 'a.rfc', function() {
    const command = $(this).attr('href');
    // are we inside RFC browser?
    if (term.level() >= 2) {
        commands.rfc.call(term, +command);
    } else {
        term.exec(`rfc ${command}`);
    }
    return false;
});

const BASE = 'https://cuho3e4lik.sqlite.cloud:8090';

async function post(endpoint, data) {
    const res = await fetch(`${BASE}/v2/functions/${endpoint}`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            ...data,
            apikey: 'SBmxqjlBbI1Q0xlz3xr9vMNHBOewByrbAsEGYmfxlKE'
        })
    });
    return res.json();
}

function jargon_term(query) {
    return post('jargon-term', { query });
}

function jargon_search(query) {
    return post('jargon-search', { query });
}

function format_entry(entries) {
    let result = entries.map(function(entry) {
        let text = '[[b;#fff;]' + entry.term + ']';
        if (entry.abbrev) {
            text += ' (' + entry.abbrev.join(', ') + ')';
        }
        let re = new RegExp("((?:https?|ftps?)://\\S+)|\\.(?!\\s|\\]\\s)\\)?", "g");
        let def = entry.def.replace(re, function(text, g) {
            return g ? g : (text == '.)' ? '.) ' : '. ');
        });
        return text + '\n' + def + '\n';
    }).join('\n');
    result = $.terminal.format_split(result).map(function(str) {
        if ($.terminal.is_formatting(str)) {
            return str.replace(/^\[\[([bu]{2};)/, '[[!$1');
        }
        return str;
    }).join('');

    return result;
}

function command_list() {
    const list = Object.keys(commands);
    list.push('clear');
    return list.map(cmd => `<command>${cmd}</command>`);
}

function proxy(url) {
    return 'https://corsproxy.io/?url=' + encodeURIComponent(url);
}

async function fetch_rfc(url) {
    const res = await fetch(proxy(url));
    if (res.status !== 200) {
        throw new Error('invalid RFC number');
    }
    return res.text();
}

function display_rfc(rfc) {
    // RFC have leading and trailing whitespace
    rfc = rfc.trim();
    // RFC don't have any XML formatting, they are text files
    rfc = rfc.replace(/</g, '&lt;');
    rfc = rfc.replace(/>/g, '&gt;');
    term.less(rfc);
}
