import {
  ApplicationCommandOptionType,
  Client,
  Collection,
  IntentsBitField,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import { existsSync, readdirSync } from "fs";
import path from "path";
import { AniListClient } from "./components/Clients/AniListClient";
import { Job } from "node-schedule";

export class Vivy extends Client {
  commands: Collection<string, BaseCommand>;
  accessTokens: Collection<
    string,
    { access_token: string; userId: number, expires_at: number }
  >;
  suggestions : Collection<string, {animeId: number, animeName: string, suggestedAt : number, suggestedBy: string}[]>
  anilistClient: AniListClient;
  jobManager: Collection<{ userId: string; showId: number }, Job>;

  constructor() {
    super({ intents: [IntentsBitField.Flags.Guilds] });

    this.commands = new Collection();
    this.jobManager = new Collection();
    this.accessTokens = new Collection();
    this.suggestions = new Collection();

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
      commandData.push(command.baseCommand.data);
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
      const commandFiles = readdirSync(FolderPath).filter(
        (f) => f.endsWith(".js") && !f.startsWith("_")
      );

      const baseCommandPath = path.join(FolderPath, "_base.js");
      if (!existsSync(baseCommandPath)) {
        console.log(`Base file is required. Skipping Folder ${folder}...`);
        continue;
      }
      const baseCommand: {
        data: SlashCommandBuilder;
        execute: Function;
        autocomplete?: Function;
      } = require(baseCommandPath);
      if (!("data" in baseCommand)) {
        console.log(
          `Data field in Base File is required. Skipping Folder ${folder}...`
        );
        continue;
      }

      const subCommandFunctions: Collection<
        string,
        { execute: Function; autocomplete?: Function }
      > = new Collection();
      for (const file of commandFiles) {
        const filePath = path.join(FolderPath, file);

        delete require.cache[require.resolve(filePath)];
        const subCommand = require(filePath);
        if ("data" in subCommand && "execute" in subCommand) {
          baseCommand.data.addSubcommand(subCommand.data);
          subCommandFunctions.set(subCommand.data.name, subCommand);
        } else {
          console.warn(
            `${folder}/${file} is missing one of the required properties`
          );
        }
      }
      commands.set(baseCommand.data.name, {
        baseCommand: baseCommand,
        subCommands: subCommandFunctions,
      });
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


export interface BaseCommand {
  baseCommand: {
    data: SlashCommandBuilder;
    execute: Function;
    autocomplete?: Function;
  };
  subCommands: Collection<
    string,
    { execute: Function; autocomplete?: Function }
  >;
}