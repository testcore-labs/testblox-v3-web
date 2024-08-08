import Discord, { Client, Events, GatewayIntentBits, Message } from "discord.js";
import env from "./utils/env";
import logs from "./utils/log";
import { shuffle } from "./utils/array"
import type { message_type } from "./utils/message";
import filter from "./utils/filter";
import user from "./db/user";
import { param } from "express-validator";

const bot_token = env.discord.token || "";

class discord_bot {
  private client: Client;
  public prefix: string = env.discord.prefix;
  public commands: {
    command: string;
    category: string;
    description: string;
    func: (message: Message, params: string[]) => {} | undefined;
  }[] = [
    {
      command: "cmds",
      category: "information",
      description: "shows u commands",
      func: (msg, params) => { 
        let cmds = ``;
        let page = params.at(1) ?? 1;
        
        let sorted_commands = this.commands.sort((a, b) => {
          if (a.command < b.command) {
            return -1;
          }
          if (a.command > b.command) {
            return 1;
          }
          return 0;
        });

        let longest = sorted_commands.reduce(
          function(a, b) {
            return a.command.length > b.command.length ? a : b;
          }
        );

        let cmds_category: { [key: string]: string[] } = {};
        sorted_commands.forEach((cmd) => {
          let extra_spaces = (longest.command.length) - (cmd.command.length);
          if(!cmds_category[cmd.category]) {
            cmds_category[cmd.category] = [];
          }
          cmds_category[cmd.category].push(`${this.prefix}${cmd.command}${ !(extra_spaces < 0) ? " ".repeat(extra_spaces) : "" } | ${cmd.description}`)
        });
        Object.entries(cmds_category).forEach(([category, cmdds]) => {
          let cmds_stringed = cmdds.join("\n  ");
          cmds += `` + category + `\n  ${cmds_stringed}\n`;
        });
        let space_real_estate = cmds.split("\n").reduce(
          function(a, b) {
            return a.length > b.length ? a : b;
          }
        ).length;
        let space_real_estate_cmds = (space_real_estate - "COMMANDS".length)/2;
        return msg.reply(`\`\`\`\n${ " ".repeat(space_real_estate_cmds) }COMMANDS${ " ".repeat(space_real_estate_cmds) }\n${ "-".repeat(space_real_estate) }\n${cmds}\n\`\`\``);
      }
    },
    {
      command: "slur",
      category: "fun",
      description: "yells a slur at u",
      func: (msg) => { 
        const shuffled = shuffle(["faggot", "fag"]);
        return msg.reply(Object.values(shuffled).at(0));
      }
    },
    {
      command: "filter",
      category: "fun",
      description: "filters naughty words",
      func: (msg, params) => msg.reply(filter.text(msg.content.replace(params[0], "")))
    },
    {
      command: "user",
      category: "information",
      description: "gets users raw data",
      func: async (msg, params) => { 
        const selected_user = await (new user).by_id(Number(params[1]))
        return msg.reply(`\`\`\`json\n${JSON.stringify(selected_user.data ?? {}, null, 2)}\`\`\``);
      }
    },
    {
      command: "register_user",
      category: "information",
      description: "registers a user, using 1st arg as username and 2nd as password",
      func: async (msg, params) => { 
        const selected_user = await (new user).register(params[1], params[2]);
        return msg.reply(`\`\`\`json\n${JSON.stringify(selected_user ?? {}, null, 2)}\`\`\``);
      }
    },
    {
      command: "get_ip",
      category: "fun",
      description: "gets user ipv4",
      func: (msg, params) =>  { 
        let seed = this.user_to_id(msg, params);
        let ip; 
        let ip_obj = [];

        let i;
        for(i = 0; i < 4; i++) {
          ip_obj.push(Math.round(seed / ((i * 4) + 1) % 255));
        }

        ip = ip_obj.join(".");
        return msg.reply(ip);
      }
    },
    {
      command: "say",
      category: "fun",
      description: "says what you said",
      func: (msg, params) => msg.reply(
        `<@${msg.author.id}>: `
        + msg.content
        .replace(params[0] + " ", "")
        .replace(Discord.MessageMentions.EveryonePattern, 'everyone')
      )
    }
  ];

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
      shards: "auto",
      failIfNotExists: false,
    });
  }

  user_to_id(msg: Message, params: string[]) {
    let id = (msg.mentions.users.first()?.id 
    ? Number(msg.mentions.users.first()?.id) 
    : (params[1] 
      ? Number(params[1]) 
      : Number(msg.author.id)))  
    % 2147483647;
    id = Number.isNaN(id) ? 0 : id;
    return id;
  }

  async add_commands() {
    this.client.on(Events.MessageCreate, async (message: Message) => {
      if(message.author.id !== this.client.user?.id) {
        let { content } = message;
        const command_args = content.split(/\s+/);
        const command_with_prefix = command_args.at(0);

        if(command_with_prefix?.toUpperCase()?.startsWith(this.prefix.toUpperCase())) {
          const found_command = this.commands.find((cmd) => 
            cmd.command.toUpperCase() === command_with_prefix.replace(this.prefix, "").toUpperCase());

          if(found_command !== undefined) {
            let output = await found_command?.func(message, command_args);
            output = output == undefined ? "" : output;
            return output;
          }
        }
      }
    });

    this.client.on(Events.ClientReady, () => {
      logs.discord(`bot logged in`);
    });

    this.client.on(Events.Error, (err: Error) => {
      logs.discord("client error: " + err);
    });
  }

  async start_bot() {
    this.client
      .login(bot_token)
      .then(async () => {
        await this.add_commands();
      })
      .catch((err) => {
        console.error("error starting bot", err);
      });
  }
}

export default discord_bot;