const { Client, GatewayIntentBits } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState
} = require('@discordjs/voice');

const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers
  ]
});

const TOKEN = process.env.TOKEN;
const TARGET_USER_ID = '208754859736956929';

if (!TOKEN) {
  console.error('❌ Missing TOKEN in environment variables');
  process.exit(1);
}

/* ---------------------------
   Track last trigger (prevents spam)
---------------------------- */
const recentlyTriggered = new Map();
const COOLDOWN_MS = 60 * 1000; // 1 minute cooldown per guild

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

/* ---------------------------
   Voice Join Handler
---------------------------- */
client.on('voiceStateUpdate', async (oldState, newState) => {
  try {
    const member = newState.member || oldState.member;
    if (!member) return;

    const joinedVoice = !oldState.channelId && newState.channelId;
    if (!joinedVoice) return;

    if (member.id !== TARGET_USER_ID) return;

    const guildId = newState.guild.id;
    const now = Date.now();

    // Prevent spam triggers
    if (recentlyTriggered.get(guildId) && now - recentlyTriggered.get(guildId) < COOLDOWN_MS) {
      return;
    }
    recentlyTriggered.set(guildId, now);

    console.log('🎧 Target user joined voice → connecting...');

    const channel = newState.channel;
    if (!channel) return;

    /* ---------------------------
       Join Voice Channel safely
    ---------------------------- */
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: newState.guild.id,
      adapterCreator: newState.guild.voiceAdapterCreator,
      selfDeaf: false
    });

    // Wait until connection is ready (prevents Railway race crashes)
    await entersState(connection, VoiceConnectionStatus.Ready, 15_000);

    console.log('🔊 Connected to voice channel');

    /* ---------------------------
       Audio Player Setup
    ---------------------------- */
    const player = createAudioPlayer();

    const resource = createAudioResource(
      path.join(__dirname, 'baby.mp3')
    );

    player.play(resource);
    connection.subscribe(player);

    /* ---------------------------
       Cleanup after playback
    ---------------------------- */
    player.on(AudioPlayerStatus.Idle, () => {
      console.log('🧹 Playback finished, leaving voice');
      connection.destroy();
    });

    player.on('error', (err) => {
      console.error('❌ Audio player error:', err);
      connection.destroy();
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        console.log('⚠️ Disconnected, attempting cleanup');
        connection.destroy();
      } catch (e) {
        console.error('Cleanup error:', e);
      }
    });

  } catch (err) {
    console.error('🔥 voiceStateUpdate error:', err);
  }
});

/* ---------------------------
   Railway stability safety
---------------------------- */
process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

client.login(TOKEN);
