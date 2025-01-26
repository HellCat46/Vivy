import dotenv from "dotenv";
import { Vivy } from "./Vivy";
import { scheduleJob } from "node-schedule";
import { ActivityType } from "discord.js";
import { randomInt } from "crypto";
dotenv.config();


const client = new Vivy();

(async() => {

    await client.login(process.env.DISCORD_TOKEN);
    await client.RegisterCommands();

    SetRandomStatus(client);

    scheduleJob("*/10 * * * *", ()=> {
        try {
            SetRandomStatus(client)
        }catch(ex){
            console.error(ex)
        }
    })
})()


function SetRandomStatus(client: Vivy){
    const status = client.statues[randomInt(client.statues.length-1)]
    client.user?.setActivity({name: status.name, type: status.type, url: status.url, state: status.status})
}

