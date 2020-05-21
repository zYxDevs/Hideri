import { Discord, CommandMessage, Client } from "@typeit/discord";
import config from '../configs/config.json';
import { Command } from '../ArgumentParser';
import { RestAsString } from '../argument-types/RestAsString';
import { CommandGroup } from '../types/CommandGroup';
import owoify from 'owoify-js';

['owo', 'uwu', 'uvu'].forEach(command => {
    const command_cased = command[0].toUpperCase() + command[1] + command[2].toUpperCase();

    @Discord(config.prefix)
    class OwOifyCommand {
        @Command(`${command}ify`, {
            group: CommandGroup.FUN,
            infos: command_cased,
            description: `${command_cased}ifies a message`
        })
        private async exec(message: CommandMessage, client: Client, text: RestAsString) {
            message.channel.send(owoify(text.get(), command));
        }
    }
});