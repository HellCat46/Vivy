import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { Vivy } from "../../../Vivy";
import { EmbedBuilder } from "@discordjs/builders";


module.exports = {
    data : new SlashCommandSubcommandBuilder().setName("ping").setDescription("Replies with Bot's Latency"),
    async execute(client: Vivy, i : ChatInputCommandInteraction){
        await i.deferReply();
        const embed =  new EmbedBuilder().setDescription(`**Latency:** ${Date.now() - i.createdTimestamp}ms \n**WS Ping:** ${client.ws.ping}ms \n**Started At:** <t:${Math.floor((Date.now() - i.client.uptime)/1000)}:R>`)

        await i.editReply({embeds: [embed]});
    }
}