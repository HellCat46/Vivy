import { EmbedBuilder } from "discord.js";

export function SimpleError(msg : string){
    return new EmbedBuilder().setTitle(msg).setColor("Red").setTimestamp();
}