const { Client, Intents, MessageEmbed, Permissions } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });

client.on('ready', () => {
    console.log(`Connecté en tant que ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (!message.content.startsWith('+') || message.author.bot) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Commande !lock
    if (command === 'lock') {
        if (!message.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
            return message.reply('Vous n’avez pas la permission de faire cela!');
        }

        try {
            await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SEND_MESSAGES: false });
            message.channel.send('Ce salon est maintenant verrouillé.');
        } catch (error) {
            console.error(error);
            message.channel.send('Il y a eu une erreur en essayant de verrouiller ce salon.');
        }
    }
    // Commande !unlock
    else if (command === 'unlock') {
        if (!message.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
            return message.reply('Vous n’avez pas la permission de faire cela!');
        }

        try {
            await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SEND_MESSAGES: true });
            message.channel.send('Ce salon est maintenant déverrouillé.');
        } catch (error) {
            console.error(error);
            message.channel.send('Il y a eu une erreur en essayant de déverrouiller ce salon.');
        }
    }

    else if (command === 'unmute') {
        if (!message.member.permissions.has(Permissions.FLAGS.MUTE_MEMBERS)) {
            return message.reply("Vous n'avez pas la permission de rendre muets les membres.");
        }
        let unmuteMember = message.mentions.members.first();
        if (!unmuteMember) {
            return message.reply("Veuillez mentionner un utilisateur à unmute.");
        }
    
        let muteRole = message.guild.roles.cache.find(role => role.name === "Muted");
        if (!muteRole) {
            return message.reply('Le rôle "Muted" n\'existe pas.');
        }
    
        unmuteMember.roles.remove(muteRole)
            .then(() => {
                message.channel.send(`${unmuteMember.user.tag} a été uunmute.`);
            })
            .catch(error => message.reply("Quelque chose s'est mal passé."));
    }
    
    // Commande !giveaway
    else if (command === 'giveaway') {
        if (!message.member.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) {
            return message.reply("Vous n'avez pas la permission de gérer le serveur.");
        }

        const giveawayArgs = args.join(" ").split(",");
        let giveawayItem = giveawayArgs[0].trim();
        let giveawayDuration = parseInt(giveawayArgs[1]);

        if (!giveawayItem || isNaN(giveawayDuration)) {
            return message.reply("Format incorrect. Utilisez `!giveaway [objet], [durée en minutes]`");
        }

        let giveawayMessage = await message.channel.send({
            embeds: [
                new MessageEmbed()
                    .setColor('#008000')
                    .setTitle('Giveaway!')
                    .setDescription(`Objet : ${giveawayItem}\nRéagissez avec 🎉 pour participer!\nDurée : ${giveawayDuration} minutes`)
                    .setTimestamp()
            ]
        });

        await giveawayMessage.react('🎉');

        const durationMs = giveawayDuration * 60 * 1000;
        const filter = (reaction, user) => reaction.emoji.name === '🎉' && !user.bot;
        const collector = giveawayMessage.createReactionCollector({ filter, time: durationMs });

        collector.on('end', async collected => {
            const reaction = collected.get('🎉');
            if (!reaction) {
                return message.channel.send('Pas de participants pour le giveaway.');
            }

            const users = await reaction.users.fetch();
            const realUsers = users.filter(user => !user.bot);
            if (realUsers.size < 1) {
                return message.channel.send('Pas de participants pour le giveaway.');
            }

            const winner = realUsers.random();
            message.channel.send(`Félicitations ${winner}, vous avez gagné **${giveawayItem}**!`);
        });
    }
    // Commande !ban
    else if (command === 'ban') {
        if (!message.member.permissions.has(Permissions.FLAGS.BAN_MEMBERS)) {
            return message.reply("Vous n'avez pas la permission de bannir des membres.");
        }
        let banMember = message.mentions.members.first();
        if (!banMember) {
            return message.reply("Veuillez mentionner un utilisateur à bannir.");
        }
        banMember.ban({ reason: args.slice(1).join(" ") })
            .then(() => {
                let banEmbed = new MessageEmbed()
                    .setColor('#ff0000')
                    .setTitle('Bannissement Exécuté')
                    .setDescription(`${banMember.user.tag} a été banni.`)
                    .setTimestamp();
                message.channel.send({ embeds: [banEmbed] });
            })
            .catch(error => message.reply("Quelque chose s'est mal passé."));
    }
    // Commande !kick
    else if (command === 'kick') {
        if (!message.member.permissions.has(Permissions.FLAGS.KICK_MEMBERS)) {
            return message.reply("Vous n'avez pas la permission d'expulser des membres.");
        }
        let kickMember = message.mentions.members.first();
        if (!kickMember) {
            return message.reply("Veuillez mentionner un utilisateur à expulser.");
        }
        kickMember.kick(args.slice(1).join(" "))
            .then(() => {
                let kickEmbed = new MessageEmbed()
                    .setColor('#ffcc00')
                    .setTitle('Expulsion Exécutée')
                    .setDescription(`${kickMember.user.tag} a été expulsé.`)
                    .setTimestamp();
                message.channel.send({ embeds: [kickEmbed] });
            })
            .catch(error => message.reply("Quelque chose s'est mal passé."));
    }
    // Commande !mute
    else if (command === 'mute') {
        if (!message.member.permissions.has(Permissions.FLAGS.MUTE_MEMBERS)) {
            return message.reply("Vous n'avez pas la permission de rendre des membres muets.");
        }
        let muteMember = message.mentions.members.first();
        if (!muteMember) {
            return message.reply("Veuillez mentionner un utilisateur à rendre muet.");
        }

        let muteRole = message.guild.roles.cache.find(role => role.name === "Muted");
        if (!muteRole) {
            try {
                muteRole = await message.guild.roles.create({
                    data: {
                        name: 'Muted',
                        permissions: []
                    }
                });

                message.guild.channels.cache.forEach(async (channel) => {
                    await channel.permissionOverwrites.edit(muteRole, {
                        SEND_MESSAGES: false,
                        SPEAK: false,
                        ADD_REACTIONS: false
                    });
                });
            } catch (e) {
                console.error(e);
                return message.channel.send('Erreur lors de la création du rôle "Muted".');
            }
        }

        muteMember.roles.add(muteRole)
            .then(() => {
                let muteEmbed = new MessageEmbed()
                    .setColor('#00ff00')
                    .setTitle('Mute Exécuté')
                    .setDescription(`${muteMember.user.tag} a été rendu muet.`)
                    .setTimestamp();
                message.channel.send({ embeds: [muteEmbed] });
            })
            .catch(error => message.reply("Quelque chose s'est mal passé."));
    }

    else if (command === 'help') {
        const helpEmbed = new MessageEmbed()
        .setTitle("Guide de commandes")
        .setDescription("Retrouvez l'ensemble des commandes de Bluebot13. \nLes permissions nécessaires sont indiquées lors de l'exécution de la commande.\n\n** N'oubliez pas de visiter mes créations visuels sur mon site ! https://blueangelstudio.me **")
            //.setThumbnail('lien_vers_une_image') // URL de l'image de thumbnail
            .addFields(
                { name: '🔒  Modération', value: '\u200B', inline: false },
                { name: '!lock', value: 'Verrouille le salon actuel.', inline: true },
                { name: '!unlock', value: 'Déverrouille le salon actuel.', inline: true },
                { name: '!ban [@utilisateur] [raison]', value: 'Bannit un utilisateur du serveur.', inline: true },
                { name: '!kick [@utilisateur] [raison]', value: 'Expulse un utilisateur du serveur.', inline: true },
                { name: '!mute [@utilisateur]', value: 'Rend muet un utilisateur.', inline: true },
                { name: '!warn [@utilisateur] [raison]', value: 'Avertit un utilisateur.', inline: true },
                { name: '🎉 Divertissement', value: '\u200B', inline: false },
                { name: '!giveaway [objet], [durée en minutes]', value: 'Lance un giveaway.', inline: true },
                { name: ' Autres', value: '\u200B', inline: false },
                { name: '!help', value: 'Affiche ce message d\'aide.', inline: true }
            )
            .setImage("https://cdn.discordapp.com/attachments/1210242926785994803/1210532151179878400/Logo_BlueAngelDesign_1_1.jpg?ex=65eae6eb&is=65d871eb&hm=07e4427ea13385afc5c413f7e82bc59c16b7f3f1c46ccccd77b278f0144c2742&")
            .setThumbnail("https://cdn.discordapp.com/attachments/1210242926785994803/1210532151179878400/Logo_BlueAngelDesign_1_1.jpg?ex=65eae6eb&is=65d871eb&hm=07e4427ea13385afc5c413f7e82bc59c16b7f3f1c46ccccd77b278f0144c2742&")
            .setColor("#00b0f4")
            .setFooter({
              text: "Powered by Astellys AI - astellys.fr",
              iconURL: "https://slate.dan.onl/slate.png",
            })
            .setTimestamp();
        message.channel.send({ embeds: [helpEmbed] });
    }
    
    
    // Commande !warn
    else if (command === 'warn') {
        if (!message.member.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)) {
            return message.reply("Vous n'avez pas la permission de gérer les messages.");
        }
        let warnMember = message.mentions.users.first();
        if (!warnMember) {
            return message.reply("Veuillez mentionner un utilisateur à avertir.");
        }
        let reason = args.slice(1).join(" ") || "Aucune raison fournie";
        warnMember.send(`Vous avez été averti pour la raison suivante : ${reason}`)
            .catch(error => console.log(`Impossible d'envoyer un message privé à ${warnMember.tag}.`));

        let warnEmbed = new MessageEmbed()
            .setColor('#ffa500')
            .setTitle('Avertissement')
            .setDescription(`${warnMember.tag} a été averti pour : ${reason}`)
            .setTimestamp();
        message.channel.send({ embeds: [warnEmbed] });
    }
});


const token = 'MTA5MDcyNjc4Njg2NzkzMzE5NA.GLHjIM.edkN7F7zATFDlJIAEip3i4gEpn5FVdAHBPwxgY';

// Login to Discord with your client's token
client.login(token);
