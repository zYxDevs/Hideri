import boorus from "../configs/boorus.json";
import config from "../configs/config.json";
import { Discord, CommandMessage } from '@typeit/discord';
import { Command } from '../ArgumentParser';
import { CommandGroup } from '../types/CommandGroup';
import { forSite } from 'booru';
import { MessageEmbed } from '../utils/EmbedUtils';

export abstract class BaseBooruCommand {
    public async exec(message: CommandMessage, booru: string, ...query: string[]) {
        let booru_site;

        try {
            booru_site = forSite(booru);
        } catch (e) {
            return message.reply(`Booru \`${booru}\` does not exist.`);
        }

        query = query.map(segment => segment.replace(/\s+/g, '_'));
        const results = await booru_site.search(query, { random: true });
        if (results.posts.length == 0) return message.reply('Your query returned no results. (try adding wildcards)');            
        const post = results.posts[0];

        let title = post.source ?? post.tags;
        if (Array.isArray(title)) title = title.join(' ');
        if (title.length > 100) title = title.slice(0, 100) + '...';

        const embed = new MessageEmbed({
            url: post.postView,
            title: title,
            image: { url: post.fileUrl }
        });

        message.channel.send(embed);
    }
}

@Discord(config.prefix)
export abstract class GenericBooruCommand extends BaseBooruCommand {
    @Command('booru', {
        group: CommandGroup.COMMUNITIES,
        description: `Fetch an image from a booru`
    })
    public async exec(message: CommandMessage, booru: string, ...query: string[]) {
        return await super.exec(message, booru, ...query);
    }
}

boorus.forEach(({ name, booru, aliases, info, description } : {
    name: string,
    booru: string,
    aliases?: string[],
    info?: string,
    description?: string
}) => {
    @Discord(config.prefix)
    class BooruCommand extends BaseBooruCommand {
        @Command(name, {
            group: CommandGroup.COMMUNITIES,
            aliases: aliases,
            infos: info,
            description: description ?? `Fetch an image from ${booru}`
        })
        public async exec(message: CommandMessage, ...query: string[]) {
            return await super.exec(message, booru, ...query);
        }
    }
});