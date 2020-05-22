import config from '../configs/config.json';
import { Discord, Guard, CommandMessage, Client } from '@typeit/discord';
import { Owner } from '../guards/Owner';
import { Command } from '../ArgumentParser';
import { RestAsString } from '../argument-types/RestAsString';
import stringify_object from 'stringify-object';
import split_to_chunks from 'split-to-chunks';
import { exec, ExecException } from 'child_process';
import { database_client, get_prefix } from '../server-config/ServerConfig';

const d = require('discord.js');
const { MessageEmbed } = d;

@Discord(get_prefix)
export abstract class DebugCommand {
    private hook_stdout(callback: Function) {
        const old_write = process.stdout.write;

        (process.stdout.write as any) = (function(write) {
            return function(string, encoding, fd) {
                write.apply(process.stdout, arguments)
                callback(string, encoding, fd)
            }
        })(process.stdout.write)
    
        return {
            unhook() { process.stdout.write = old_write }
        }
    }

    @Guard(Owner())
    @Command('query', {
        hide: true
    })
    private async query(message: CommandMessage, query: RestAsString) {
        const start = Date.now();
        const { rows } = await database_client.query(query.get());
        await message.channel.send('```\n' + `${rows.length} rows returned in ${Date.now() - start}ms` + '\n```');
        for (const chunk of split_to_chunks(JSON.stringify(rows, null, 2), 1980).slice(0, 10)) {
            await message.channel.send('```js\n' + chunk.join('') + '\n```')
        }
    }

    @Guard(Owner())
    @Command('bash', {
        hide: true
    })
    private async bash(message: CommandMessage, code: RestAsString) {
        exec(code.get(), {
            shell: process.env.ComSpec ?? '/bin/bash',
            timeout: 5000,
            windowsHide: true
        }, async (error: ExecException, stdout: string, stderr: string) => {
            const code = error?.code ?? 0;

            for (const output of [stdout, stderr, 'Process exited ' + code]) {
                for (const chunk of split_to_chunks(output, 1980).slice(0, 10)) {
                    await message.channel.send('```shell\n' + chunk.join('') + '\n```')
                }
            }
        });
    }

    @Guard(Owner())
    @Command('eval', {
        hide: true
    })
    private async eval(message: CommandMessage, client: Client, code: RestAsString) {
        let out = '';
        const hook = this.hook_stdout(s => out += s);
        const result = eval(code.get());
        hook.unhook();
        out && await message.channel.send('```js\n' + out.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '') + '\n```');
        const result_string = stringify_object(result);

        for (const chunk of split_to_chunks(result_string, 1980).slice(0, 10)) {
            await message.channel.send('```js\n' + chunk.join('') + '\n```')
        }
    }
}