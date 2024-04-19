import dotenv from "dotenv";
import { Vivy } from "./Vivy";
dotenv.config();


const client = new Vivy();

(async() => {
    await client.login(process.env.DISCORD_TOKEN);
    await client.RegisterCommands();
})()


