import { Discord, Guard, On, Client, ArgsOf } from '@typeit/discord';
import { NotBot } from '../../guards/NotBot';
import { StartsWith } from '../../guards/StartsWith';
import { Not } from '../../guards/Not';
import { TextChannel, Message } from 'discord.js';
import { HasPermission } from '../../guards/HasPermission';
import { BaseEmbedBrowser } from '../../embed-browsers/BaseEmbedBrowser';
import { GuardToBoolean } from '../../guards/GuardToBoolean';
import { StartsWithPrefix } from '../../guards/StartsWithPrefix';
import { server_configs } from '../../server-config/ServerConfig';

@Discord()
export abstract class BaseSearchEmbed {
    public pattern = /(?!x)x/g;
    public use_webhook = true;
    public max_normal_embeds = 6;
    public max_webhook_embeds = 200;

    public name = null;
    public info = null;
    public description = null;
    public usage = null;
    public nsfw = false;

    public static class_instances: BaseSearchEmbed[] = [];
    private static class_instance_types: (typeof BaseSearchEmbed)[] = [];

    constructor() {
        if (BaseSearchEmbed.class_instance_types.includes(new.target)) return;
        if (new.target == BaseSearchEmbed) return;

        BaseSearchEmbed.class_instances.push(this);
        BaseSearchEmbed.class_instance_types.push(new.target);
    }

    public abstract async embed_handler(message: Message, client: Client, match: RegExpMatchArray, is_webhook?: boolean): Promise<BaseEmbedBrowser>;

    @Guard(NotBot, Not(StartsWithPrefix))
    @On('message')
    private async on_message([message]: ArgsOf<'message'>, client: Client) {
        let reacted = false;

        await Promise.allSettled(BaseSearchEmbed.class_instances.map(async instance => {
            let matches = [...message.content.matchAll(instance.pattern)];
            if (!matches.length) return;

            if (instance.nsfw &&
                !(message?.channel as TextChannel)?.nsfw &&
                !server_configs[message?.guild?.id]['common.nsfw_all_channels']
            ) {
                if (!reacted) {
                    reacted = true;
                    message.react('💢');
                }
                return;
            }

            message.channel.startTyping();

            const has_webhook_permission = GuardToBoolean(HasPermission('MANAGE_WEBHOOKS', {
                error_message: null,
                check_admin: true
            }))([message], client);

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
                            embeds.push(await embed_browser.get_embed(message));
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

        message.channel.stopTyping();
    }
}