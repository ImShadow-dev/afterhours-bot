const { Client, GatewayIntentBits } = require('discord.js');
const bedrock = require('bedrock-protocol');

const TOKEN = "MTQ3OTQyMzQ3NzgxMDIwMDY4OA.GN9yJh.lAlH-HIQ_sEOaaxusM0z2BhlvKtasfFVfFvXTk";

const SERVER_HOST = "Afterhours-R6dg.aternos.me";
const SERVER_PORT = 41390;

const CHANNEL_ID = "1479463036480786556";

let spamEnabled = true;
let spamInterval = null;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

async function pingServer() {

    let result = {
        online: false,
        playersOnline: 0,
        playersMax: 20,
        version: "Unknown",
        ping: 0
    };

    try {

        const start = Date.now();

        const response = await bedrock.ping({
    host: SERVER_HOST,
    port: SERVER_PORT,
    timeout: 10000
});

        const latency = Date.now() - start;

        result.online = true;
        result.playersOnline = response.playersOnline ?? 0;
        result.playersMax = response.playersMax ?? 20;
        result.version = response.version ?? "Unknown";
        result.ping = latency;

        if (result.playersMax === 1 && result.playersOnline === 0) {
            result.online = false;
        }

    } catch (error) {

        result.online = false;

    }

    return result;
}

function buildPanel(data) {

    let status = data.online ? "🟢 Online" : "🔴 Offline";

    let version = data.online ? data.version : "—";
    let players = data.online
        ? `${data.playersOnline} / ${data.playersMax}`
        : "0 / 0";

    let ping = data.online ? `${data.ping}ms` : "—";

    return `
╔══════════════════╗
   AFTERHOURS SMP
╠══════════════════╣
Status   : ${status}
Players  : ${players}
Version  : ${version}
Ping     : ${ping}
╚══════════════════╝
`;
}

async function sendStatus(channel) {

    const data = await pingServer();

    const panel = buildPanel(data);

    channel.send("```" + panel + "```");

}

function startSpam(channel) {

    if (spamInterval) return;

    spamInterval = setInterval(async () => {

        const data = await pingServer();

        const panel = buildPanel(data);

        channel.send("```" + panel + "```");

    }, 50000);

}

function stopSpam() {

    if (!spamInterval) return;

    clearInterval(spamInterval);

    spamInterval = null;

}

client.once('clientReady', async () => {

    console.log("Afterhours Bot is online!");

    const channel = await client.channels.fetch(CHANNEL_ID);

    if (!channel) {
        console.log("Channel not found");
        return;
    }

    startSpam(channel);

});

client.on('messageCreate', async message => {

    if (message.author.bot) return;

    if (message.content === "!serv") {

        const data = await pingServer();

        const panel = buildPanel(data);

        message.channel.send("```" + panel + "```");

    }

    if (message.content === "!players") {

        const data = await pingServer();

        if (!data.online) {
            message.channel.send("Server is offline.");
            return;
        }

        message.channel.send(`Players online: ${data.playersOnline}/${data.playersMax}`);

    }

    if (message.content === "!start") {

        if (message.channel.id !== CHANNEL_ID) return;

        startSpam(message.channel);

        message.channel.send("Server status spam started.");

    }

    if (message.content === "!stop") {

        stopSpam();

        message.channel.send("Server status spam stopped.");

    }

});

client.login(TOKEN);