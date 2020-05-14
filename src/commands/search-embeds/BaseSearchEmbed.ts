import { Discord, Guard, CommandMessage, Client } from '@typeit/discord';
import { On } from '../../events/On';
import { NotBot } from '../../guards/NotBot';
import { StartsWith } from '../../guards/StartsWith';
import { Not } from '../../guards/Not';
import { TextChannel } from 'discord.js';
import { HasPermission } from '../../guards/HasPermission';
import { BaseEmbedBrowser } from '../../embed-browsers/BaseEmbedBrowser';
import config from '../../configs/config.json';

@Discord({
    prefix: config.prefix
})
export abstract class BaseSearchEmbed {
    public pattern = /(?!x)x/;
    public use_webhook = true;
    public max_normal_embeds = 6;
    public max_webhook_embeds = 200;

    private static class_instances: BaseSearchEmbed[] = [];

    constructor() {
        BaseSearchEmbed.class_instances.push(this);
    }

    public abstract async embed_handler(message: CommandMessage, client: Client, match: RegExpMatchArray, is_webhook?: boolean): Promise<BaseEmbedBrowser>;

    @Guard(NotBot, Not(StartsWith('<')))
    @On('message')
    private async on_message(message: CommandMessage, client: Client) {
        await Promise.allSettled(BaseSearchEmbed.class_instances.map(async instance => {
            let matches = [...message.content.matchAll(instance.pattern)];
            if (!matches.length) return;

            message.channel.startTyping();

            const has_webhook_permission = HasPermission('MANAGE_WEBHOOKS', {
                error_message: null,
                check_admin: true
            })(message, client);

            if (matches.length > instance.max_normal_embeds && has_webhook_permission && this.use_webhook) {
                matches = matches.slice(0, instance.max_webhook_embeds);

                const member = (message.channel as TextChannel).members.find(member => member.user == client.user);
                const webhook = await (message.channel as TextChannel).createWebhook(member?.displayName ?? client.user.username, {
                    avatar: client.user.avatarURL()
                });

                let embed_browsers = [];

                for (let match_index = 0; match_index < matches.length; ++match_index) {
                    const embed_browser = await instance.embed_handler(message, client, matches[match_index], true);
                    embed_browser && embed_browsers.push(embed_browser);

                    if (embed_browsers.length >= 10 || match_index == (matches.length - 1)) {
                        const embeds = [];
    
                        for (const embed_browser of embed_browsers) {
                            embeds.push(await embed_browser.get_embed());
                            embed_browser.remove();
                        }

                        embed_browsers = [];

                        await webhook.send('', {
                            embeds: embeds
                        })
                    }
                }

                await webhook.delete();
                return;
            }

            matches = matches.slice(0, instance.max_normal_embeds);

            for (const match of matches) {
                const embed_browser = await instance.embed_handler(message, client, match, false);
                embed_browser && await embed_browser.send_embed(message);
            }
        }));
    }
}