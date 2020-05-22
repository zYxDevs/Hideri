import { Discord, On, Client, ArgsOf } from '@typeit/discord';
import { CappedArray } from '../utils/CappedArray';
import { MessageReaction, User, Message, Channel, GuildChannel, DMChannel, TextChannel, NewsChannel, PartialTextBasedChannelFields } from 'discord.js';
import { MessageEmbed } from '../utils/EmbedUtils';

export type EmbedBrowserOptions = {
    sender_only?: boolean,
    sender?: number
};

const default_options = {
    sender_only: true
}

export abstract class BaseEmbedBrowser {
    private static class_instances: BaseEmbedBrowser[] = new CappedArray(500);

    public message: Message;

    public reaction_buttons = new Map();

    constructor(public options: EmbedBrowserOptions = default_options) {
        this.options = Object.assign({}, default_options, options);
        BaseEmbedBrowser.class_instances.push(this);
    }

    public async send_embed(message: Message, send_override?: PartialTextBasedChannelFields['send']) {
        const embed: MessageEmbed = await this.get_embed(message);
        if (!embed) return false;
        const embed_message = await (send_override ?? message.channel.send.bind(message.channel))(embed);
        this.add_reactions(embed_message);
        this.message = embed_message;
        return true;
    }
    
    abstract async get_embed(message?: Message): Promise<MessageEmbed>;

    public set_embed(embed: MessageEmbed) {
        this.message.edit(embed);
    }

    public get_message() {
        return this.message;
    }

    public async add_reactions(message: Message) {
        for (const [ reaction_button ] of this.reaction_buttons) {
            await message.react(reaction_button);
        }
    }

    public remove() {
        const index = BaseEmbedBrowser.class_instances.indexOf(this);
        if (~index) BaseEmbedBrowser.class_instances.splice(index, 1);
    }

    public static on_react(reaction: MessageReaction, user: User, client: Client) {
        const reaction_type: EmbedReactionKeys = EMBED_REACTION_KEYS.get(reaction.emoji.name as EmbedReactionTypes);
        const reaction_type_str = EmbedReactionTypes[reaction_type];
        const id = reaction.message.id;
        if (!reaction_type) return;
        BaseEmbedBrowser.class_instances.forEach(instance => {
            if (instance.get_message().id != id) return;
            instance.reaction_buttons.get(reaction_type_str)?.call(instance, reaction, user, client);
        });
    }
}

@Discord()
export abstract class EmbedBrowserDelegate {
    @On('messageReactionAdd')
    @On('messageReactionRemove')
    on_react([reaction, user]: ArgsOf<'messageReactionAdd'>, client: Client) {
        if (user.bot) return;
        if (reaction.message.author.id !== client.user.id) return;
        BaseEmbedBrowser.on_react(reaction, user as User, client);
    }
}

export enum EmbedReactionTypes {
    LEFT = '⬅️',
    RIGHT = '➡️',
    PREVIOUS = '⏮️',
    NEXT = '⏭️',
    UP_SMALL = '🔼',
    DOWN_SMALL = '🔽',
    FAST_FORWARD = '⏩',
    REWIND = '⏪',
    UP = '⬆️',
    DOWN = '⬇️',
    BACKWARD = '◀️',
    FORWARD = '▶️',
    PLAY_PAUSE = '⏯️'
}

export type EmbedReactionKeys = keyof typeof EmbedReactionTypes;

export const EMBED_REACTION_KEYS = new Map<EmbedReactionTypes, EmbedReactionKeys>(
    Object.entries(EmbedReactionTypes).map(([key, value]:[EmbedReactionKeys, EmbedReactionTypes]) => [value, key])
)