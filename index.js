const { Client, GatewayIntentBits } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus
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

// ✅ UPDATED TEST USER ID
const TARGET_USER_ID = '208754859736956929';

if (!TOKEN) {
  console.error('❌ Missing TOKEN in environment variables');
  process.exit(1);
}

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('voiceStateUpdate', (oldState, newState) => {
  try {
    const member = newState.member || oldState.member;
    if (!member) return;

    const joinedVoice = !oldState.channelId && newState.channelId;
    if (!joinedVoice) return;

    if (member.id !== TARGET_USER_ID) return;

    console.log('🎧 Target test user joined voice → playing audio');

    const connection = joinVoiceChannel({
      channelId: newState.channel.id,
      guildId: newState.guild.id,
      adapterCreator: newState.guild.voiceAdapterCreator
    });

    const player = createAudioPlayer();

    const resource = createAudioResource(
      path.join(__dirname, 'baby.mp3')
    );

    player.play(resource);
    connection.subscribe(player);

    player.on(AudioPlayerStatus.Idle, () => {
      connection.destroy();
    });

    player.on('error', (err) => {
      console.error('Audio player error:', err);
      connection.destroy();
    });

  } catch (err) {
    console.error('voiceStateUpdate error:', err);
  }
});

client.login(TOKEN);
