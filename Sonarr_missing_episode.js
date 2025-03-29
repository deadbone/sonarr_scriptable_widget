// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-brown; icon-glyph: magic;


// Import the module with credentials
const config = importModule('module_keys');

// Select the service you want to use
const service = 'sonarr';

const { url, apiKey } = config[service];

console.clear

// Endpoints pour obtenir les informations nécessaires
const ENDPOINT = "/api/v3/wanted/missing?page=1&pageSize=6&includeSeries=true&monitored=true&includeImages=false";
const SERIES_STATS_ENDPOINT = "/api/v3/series";
const VERSION_ENDPOINT = "/api/v3/system/status";
//Translation for widget
const TVSHOW = "Séries"; //TV show
const STATUS_ENDED = "terminées"; // Ended
const STATUS_CONTINUING = "En cours"; //Continuing


const STATUS_MONITORED = "Suivies"; //"Monitored"
const STATUS_UNMONITORED = "Non suivies"; //"Unmonitored"
const STATUS_DATE = "Date d’exécution"; //"Execution date"
const DATE_FORMAT = "fr-FR" //


const TITLE_TEXT = "Sonarr : Épisodes manquants"; // Text for "Sonarr : Missing episodes"
const NO_MISSING_EPISODE_TEXT = "Aucun épisode manquant"; //text for "No missing episodes"
//Translations for error messages
const ERROR_MESSAGE_REQUEST = "Erreur lors de la requête"; // Text for "Error during the request"
const ERROR_MESSAGE_VERSION = "Erreur lors de la requête pour obtenir la version"; // Text for "Error while requesting the version"
const ERROR_MESSAGE_STATISTIC = "Erreur lors de la requête pour obtenir les statistiques des séries"; //Error during the request to retrieve series statistics"


async function getMissingEpisodes() {
    const sonarrUrl = `${url}${ENDPOINT}`;
    const req = new Request(sonarrUrl);
    req.headers = { "X-Api-Key": apiKey };
    
    try {
        const response = await req.loadJSON();
        return response.records;
    } catch (error) {
        console.error( ERROR_MESSAGE_REQUEST + " : " + error);
        return [];
    }
}

async function getCurrentVersion() {
    const versionUrl = `${url}${VERSION_ENDPOINT}`;
    const req = new Request(versionUrl);
    req.headers = { "X-Api-Key": apiKey };
    
    try {
        const response = await req.loadJSON();
        return response.version;
    } catch (error) {
        console.error( ERROR_MESSAGE_VERSION + " : " + error);
        return null;
    }
}

async function getSeriesStats() {
    const seriesUrl = `${url}${SERIES_STATS_ENDPOINT}`;
    const req = new Request(seriesUrl);
    req.headers = { "X-Api-Key": apiKey };
    
    try {
        const response = await req.loadJSON();
        const seriesCount = response.length;
        const endedCount = response.filter(series => series.status === 'ended').length;
        const continuingCount = response.filter(series => series.status === 'continuing').length;
        const monitoredCount = response.filter(series => series.monitored).length;
        const unmonitoredCount = seriesCount - monitoredCount;
        
        return { seriesCount, endedCount, continuingCount, monitoredCount, unmonitoredCount };
    } catch (error) {
        console.error(ERROR_MESSAGE_STATISTIC + " : " + error);
        return null;
    }
}


async function createWidget() {
    const episodes = await getMissingEpisodes();
    const currentVersion = await getCurrentVersion();
    const seriesStats = await getSeriesStats();
    
    let widget = new ListWidget();
    widget.setPadding(10, 10, 10, 10);

    // LCARS colors
    const lcarsBlue = new Color("#CC99FF");
    const lcarsOrange = new Color("#FFCC33");
    const lcarsPink = new Color("#FF66B2");
    const lcarsGray = new Color("#333333");
    const lcarsGreen = new Color("#228B22");

    // Background color
    widget.backgroundColor = lcarsGray;
    
    let titleStack = widget.addStack();
    titleStack.backgroundColor = lcarsBlue;
    titleStack.cornerRadius = 5;
    titleStack.setPadding(3, 3, 3, 3);
    titleStack.centerAlignContent();
    titleStack.addSpacer();
    
    let titleText = titleStack.addText(TITLE_TEXT);
    titleText.font = Font.boldSystemFont(14);
    titleText.textColor = Color.black();
    titleText.centerAlignText();
    
    titleStack.addSpacer();
    widget.addSpacer(10);
    
    if (episodes.length === 0) {
        let noEpisodesStack = widget.addStack();
        noEpisodesStack.backgroundColor = lcarsGreen;
        noEpisodesStack.cornerRadius = 5;
        noEpisodesStack.setPadding(3, 3, 3, 3);
        noEpisodesStack.centerAlignContent();
        noEpisodesStack.addSpacer();
        
        let noEpisodesText = noEpisodesStack.addText(NO_MISSING_EPISODE_TEXT +" 🎉");
        noEpisodesText.font = Font.mediumSystemFont(16);
        noEpisodesText.textColor = Color.black();
        noEpisodesText.centerAlignText();

        noEpisodesStack.addSpacer();
    } else {
        for (let episode of episodes) {
            let stack = widget.addStack();
            stack.backgroundColor = lcarsOrange;
            stack.cornerRadius = 5;
            stack.setPadding(3, 3, 3, 3);
            stack.centerAlignContent();
            stack.addSpacer();
            
            let tvIcon = stack.addText("📺 ");
            tvIcon.font = Font.mediumSystemFont(12);
            tvIcon.textColor = Color.black();
            
            let title = episode.series.title;
            let season = String(episode.seasonNumber).padStart(2, '0');
            let episodeNumber = String(episode.episodeNumber).padStart(2, '0');
            
            let episodeText = stack.addText(`${title} - S${season}E${episodeNumber}`);
            episodeText.font = Font.systemFont(12);
            episodeText.textColor = Color.black();
            stack.addSpacer();

            widget.addSpacer(5);
        }
    }

if (seriesStats) {
    widget.addSpacer(10);

    let statsStack = widget.addStack();
    statsStack.layoutHorizontally();
    statsStack.centerAlignContent();

    let columns = [];
    let columnCount = 3;
    
    for (let i = 0; i < columnCount; i++) {
        let column = statsStack.addStack();
        column.layoutVertically();
        column.centerAlignContent();
        columns.push(column);
        if (i < columnCount - 1) {
            statsStack.addSpacer();
        }
    }

    function addStatRow(icon, text, value, color, column) {
        let rowStack = column.addStack();
        rowStack.backgroundColor = color;
        rowStack.cornerRadius = 5;
        rowStack.setPadding(3, 3, 3, 3);
        rowStack.centerAlignContent();

        let iconText = rowStack.addText(icon + " ");
        iconText.font = Font.mediumSystemFont(10);
        iconText.textColor = Color.black();

        let labelText = rowStack.addText(text + ": ");
        labelText.font = Font.mediumSystemFont(10);
        labelText.textColor = Color.black();

        let valueText = rowStack.addText(value);
        valueText.font = Font.mediumSystemFont(10);
        valueText.textColor = Color.white();

        column.addSpacer(5);
    }

    const stats = [
        { icon: "📊", text: TVSHOW, value: seriesStats.seriesCount.toString() },
        { icon: "🏁", text: STATUS_ENDED, value: seriesStats.endedCount.toString() },
        { icon: "🔄", text: STATUS_CONTINUING, value: seriesStats.continuingCount.toString() },
        { icon: "📈", text: STATUS_MONITORED, value: seriesStats.monitoredCount.toString() },
        { icon: "📉", text: STATUS_UNMONITORED, value: seriesStats.unmonitoredCount.toString() },
    ];

    let columnIndex = 0;
    for (let stat of stats) {
        addStatRow(stat.icon, stat.text, stat.value, lcarsPink, columns[columnIndex % columnCount]);
        columnIndex++;
    }

    addStatRow("", "", "", lcarsGray, columns[columnIndex % columnCount]);
}

    widget.addSpacer();
    
    let now = new Date();
    let dateStack = widget.addStack();
    dateStack.layoutHorizontally();
    dateStack.centerAlignContent();
    dateStack.addSpacer();

    let dateText = dateStack.addText(`${STATUS_DATE}: ${now.toLocaleString(DATE_FORMAT)}`);
    dateText.font = Font.mediumSystemFont(10);
    dateText.textColor = Color.white();

    let versionText = dateStack.addText(` (v${currentVersion})`);
    versionText.font = Font.mediumSystemFont(10);
    versionText.textColor = Color.white();

    dateStack.addSpacer();

    widget.url = url
    
    return widget;
}


async function run() {
    let widget = await createWidget();
    if (config.runsInWidget) {
        Script.setWidget(widget);
    } else {
        widget.presentMedium();
}
Script.complete();
}

await run();
