import {
  Client,
  Collection,
  IntentsBitField,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import { readdirSync } from "fs";
import path from "path";
import { AniListClient } from "./components/Clients/AniListClient";
import { Pool } from "pg";
import { dbClient } from "./components/Clients/dbClient";

export class Vivy extends Client {
  commands: Collection<
    string,
    { data: SlashCommandBuilder; execute: Function, autocomplete ?: Function}
  >;
  anilistClient: AniListClient;
  dbclient: dbClient;

  constructor() {
    super({ intents: [IntentsBitField.Flags.Guilds] });

    this.commands = new Collection();
    this.dbclient = new dbClient();

    if (process.env.ANILISTSECRET && process.env.ANILISTID)
      this.anilistClient = new AniListClient(
        process.env.ANILISTSECRET,
        process.env.ANILISTID
      );
    else throw new Error("Either Anilist ID or Secret is missing!");

    this.UpdateEventHandlers();
    this.UpdateCommandCollection();
  }

  async RegisterCommands() {
    if (this.user == null)
      throw new Error(
        "Application needs to be a Discord Bot Client to Deploy Commands"
      );

    const commandData: SlashCommandBuilder[] = [];

    for (const command of this.commands.values()) {
      commandData.push(command.data);
    }

    console.log(
      `[Bot] Started Refreshing ${commandData.length} application commands`
    );
    const data = await this.rest.put(Routes.applicationCommands(this.user.id), {
      body: commandData,
    });
    if (!(data instanceof Array))
      throw new Error("Application Deployment Response was incorrect.");

    console.log(
      `[Bot] Successfully Refreshed ${data.length} application commands`
    );
  }

  UpdateCommandCollection() {
    const commands: typeof this.commands = new Collection();

    const basePath = path.join(__dirname, "commands/SlashCommands");
    const commandFolders = readdirSync(basePath);

    for (const folder of commandFolders) {
      const FolderPath = path.join(basePath, folder);
      const commandFiles = readdirSync(FolderPath).filter((f) =>
        f.endsWith(".js")
      );

      for (const file of commandFiles) {
        const filePath = path.join(FolderPath, file);

        delete require.cache[require.resolve(filePath)];
        const command = require(filePath);
        if ("data" in command && "execute" in command) {
          commands.set(command.data.name, command);
        } else {
          console.warn(`${file} is missing one of the required properties`);
        }
      }
    }

    this.commands = commands;
  }

  UpdateEventHandlers() {
    const basePath = path.join(__dirname, "events");
    const eventsFiles = readdirSync(basePath).filter((f) => f.endsWith(".js"));
    for (const file of eventsFiles) {
      const eventPath = path.join(basePath, file);
      const event = require(eventPath);

      const eventName = file.split(".")[0];
      if (event.once) {
        this.once(eventName, (...args) => event.execute(this, ...args));
      } else {
        this.on(eventName, (...args) => event.execute(this, ...args));
      }
    }
  }
}
