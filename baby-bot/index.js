const { Client, GatewayIntentBits } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus
} = require('@discordjs/voice');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const TOKEN = process.env.TOKEN;
const TARGET_USER_ID = '219647743616876545';

client.on('voiceStateUpdate', (oldState, newState) => {

  // ONLY trigger when user joins a voice channel (not moves, not stays)
  const joinedVoice =
    !oldState.channelId &&
    newState.channelId;

  if (newState.member.id === TARGET_USER_ID && joinedVoice) {

    console.log('Target user joined voice → playing sound');

    const connection = joinVoiceChannel({
      channelId: newState.channel.id,
      guildId: newState.guild.id,
      adapterCreator: newState.guild.voiceAdapterCreator
    });

    const player = createAudioPlayer();
    const resource = createAudioResource('./baby.mp3');

    player.play(resource);
    connection.subscribe(player);

    player.on(AudioPlayerStatus.Idle, () => {
      connection.destroy();
    });
  }
});

client.login(TOKEN);