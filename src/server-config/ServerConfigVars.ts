import config from '../configs/config.json';

export type ServerConfigTypes = {
    list: Array<string>,
    string: string,
    number: number,
    boolean: boolean
}

export type ServerConfig = {
    description: string,
    type: keyof ServerConfigTypes
    allowed_values?: string[],
    default_value?: ServerConfigTypes[keyof ServerConfigTypes],
};

export type ServerConfigKeys = {
    'common.prefix': string
    'common.help_dm': boolean,
    'common.nsfw_all_channels': boolean
    'common.channel_list': string[]
    'common.channel_list_as_blacklist': boolean
    'common.command_list': string[]
    'common.command_list_as_blacklist': boolean
}

export const server_config_vars: { [name in keyof ServerConfigKeys]: ServerConfig } = {
    'common.prefix': {
        description: 'prefix for server',
        type: 'string',
        allowed_values: ['*'],
        default_value: config.prefix,
    },
    'common.help_dm': {
        description: 'whether or not the help command should be sent as a DM instead of sending it in the channel',
        type: 'boolean',
        default_value: false
    },
    'common.nsfw_all_channels': {
        description: 'whether nsfw commands should be allowed in all channels, or nsfw only',
        type: 'boolean',
        default_value: true,
    },
    'common.channel_list': {
        description: 'list of allowed/disallowed channels for commands',
        type: 'list',
        default_value: []
    },
    'common.channel_list_as_blacklist': {
        description: 'if channel_list should be used as a blacklist, otherwise whitelist',
        type: 'boolean',
        default_value: true
    },
    'common.command_list': {
        description: 'list of allowed/disallowed commands',
        type: 'list',
        default_value: [],
    },
    'common.command_list_as_blacklist': {
        description: 'if command_list should be used as a blacklist, otherwise whitelist',
        type: 'boolean',
        default_value: true,
    }
};