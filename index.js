/**
 * Example script getting pages from "Bosons" category on English Wikipedia
 *
 * @see http://en.wikipedia.org/wiki/Category:Bosons
 * @see http://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category%3ABosons&cmlimit=500&format=json
 */

const Bot = require('nodemw'),
    fs = require('mz/fs'),
	client = new Bot( {
		server: 'steven-universe.wikia.com',
		path: ''
	} );

function getPagesInCategory (name) {
	return new Promise ((resolve, reject) => {
		client.getPagesInCategory(name, (err, data) => {
			if (err) reject(err);
			resolve(data);
		});
	});
}

function getPage (name) {
	return new Promise ((resolve, reject) => {
		client.getArticle(name, true, (err, data) => {
			if (err) reject(err);
			resolve(data);
		});
	})
}

var data = {}

async function run () {
	const seasons = await getPagesInCategory("Seasons");

	await Promise.all(seasons.map(x => ProcessSeason(x)));

	fs.writeFile("data.json", JSON.stringify(data));
}

async function ProcessSeason (seasonData) {
    const seasonPage = await getPage(seasonData.title);
    const matches = seasonPage.match(/\{\{EP\s[^\}]+/gi);
    if (!matches) return;
    const episodes = await Promise.all(matches.map(x => {
        const titleMatches = x.match(/\|\"\[\[(.*?)\]\]/);
        if (!titleMatches) debugger;
        const episodeTitle = titleMatches[1];
        return ProcessEpisode(episodeTitle.split("|")[0]);
    }));
}

async function ProcessEpisode (title) {
    //console.log(title);
    const [episodePage, transcript] = await Promise.all([getPage(title), getPage(title + "/Transcript")]);
    debugger;
}

run().then(() => {}).catch((err) => { debugger; console.error(err); });
