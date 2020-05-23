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
    'common.nsfw_all_channels': boolean
    'common.channel_list': string[]
    'common.channel_list_as_blacklist': boolean
    'common.command_list': string[]
    'common.command_list_as_blacklist': boolean,
    'common.dm_list': string[],
    'common.dm_list_as_blacklist': boolean
}

export const server_config_vars: { [name in keyof ServerConfigKeys]: ServerConfig } = {
    'common.prefix': {
        description: 'prefix for server',
        type: 'string',
        default_value: config.prefix,
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
    },
    'common.dm_list': {
        description: 'list of commands that will be sent as DMs instead of sending in the channel',
        type: 'list',
        default_value: []
    },
    'common.dm_list_as_blacklist': {
        description: 'if dm_list should be used as a blacklist of commands to send as DMs, otherwise a whitelist of commands that will not be sent as DMs',
        type: 'boolean',
        default_value: true
    }
};