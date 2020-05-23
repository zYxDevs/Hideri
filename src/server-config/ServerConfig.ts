import { Client } from 'pg';
import database from '../configs/database.json';
import { create_logger } from '../utils/Logger';
import { server_config_vars, ServerConfigKeys } from './ServerConfigVars';
import { Message, DMChannel } from 'discord.js';
import { RegexUtils } from '../utils/RegexUtils';
import { escape } from 'sqlutils/pg';
import { Discord, On, ArgsOf } from '@typeit/discord';

const logger = create_logger(module);

export const database_client = new Client({
    connectionString: database.connection.startsWith('process.env.') ? eval(database.connection) : database.connection
});

const server_configs_dict: {
    [snowflake: string]: {
        [config_value in keyof typeof server_config_vars]?: ServerConfigKeys[config_value]
    }
} = {};

@Discord()
export abstract class ServerLeaveHandler {
    @On('guildDelete')
    private on_leave([guild]: ArgsOf<'guildDelete'>, client: Client) {
        database_client.query(`DELETE FROM hideri_server_config WHERE snowflake='${guild.id}'`);
        if (guild.id in server_configs_dict) delete server_configs_dict[guild.id];
    }
}


export const server_configs: typeof server_configs_dict = new Proxy(server_configs_dict, {
    get: (target, prop: string) => new Proxy(target[prop] ?? {}, {
        get: (config_target, config_prop: string) => {
            if (config_prop in config_target) return config_target[config_prop];
            if (config_prop in server_config_vars) return server_config_vars[config_prop].default_value;

            throw new TypeError(`config variable ${config_prop} does not exist`);
        },
        set: (config_target, config_prop: string, value) => {
            if (!(config_prop in server_config_vars)) return false;
            if (!target[prop]) target[prop] = {};

            switch (server_config_vars[config_prop].type) {
                case 'boolean':
                    if (typeof value != 'boolean') return false;
                    break;
                case 'list':
                    if (!Array.isArray(value)) return false;
                    break;
                case 'number':
                    if (typeof value != 'number' || Number.isNaN(value)) return false;
                    break;
                
                default:
                    if (typeof value != 'string') return false;
            }

            target[prop][config_prop] = value;

            const escaped_value = escape(value.toString());

            database_client.query(`
                INSERT INTO hideri_server_config (snowflake, key, value)
                VALUES ('${prop}', '${config_prop}', ${escaped_value})
                ON CONFLICT (snowflake, key) DO UPDATE
                SET value=${escaped_value}
            `);

            return true;
        }
    })
});

export function get_prefix_str(message_or_id: Message | string) {
    return server_configs[typeof message_or_id == 'string' ? message_or_id : message_or_id?.guild?.id]['common.prefix'];
}

export const get_prefix = (message: Message) => {
    if (message.channel instanceof DMChannel) return /^[^\s\d\w]{1,2}/;

    return new RegExp('^' + RegexUtils.escape(get_prefix_str(message)));
}

const process_database = async () => {
    const result = await database_client.query(`SELECT to_regclass('hideri_server_config')`);
    if (result.rows[0].to_regclass == null) {
        await database_client.query(`CREATE TABLE hideri_server_config(
            snowflake VARCHAR (20) NOT NULL,
            key VARCHAR (50) NOT NULL,
            value VARCHAR (1023),
            PRIMARY KEY(snowflake, key)
        )`);
        return logger.info('created table \'hideri_server_config\' in database');
    }

    const start = Date.now();
    const { rows } = await database_client.query<{
        snowflake: string,
        key: string,
        value: string
    }>(`SELECT * FROM hideri_server_config`);

    logger.info(`config loaded from database in ${Date.now() - start}ms`);

    rows.forEach(({ snowflake, key, value }) => {
        const config_var = server_config_vars[key];
        if (!config_var) return logger.warn(`unknown config key ${key} for snowflake ${snowflake}`);
        if (!server_configs_dict[snowflake]) server_configs_dict[snowflake] = {};

        switch (config_var.type) {
            case 'boolean':
                server_configs_dict[snowflake][key] = /^true|t|yes|y|1$/i.test(value.trim());
                break;
            case 'list':
                server_configs_dict[snowflake][key] = value.split(',').map(x => x.trim())
                break;
            case 'number':
                server_configs_dict[snowflake][key] = parseFloat(value);
                break;
            
            default:
                server_configs_dict[snowflake][key] = value;
        }
    });
};

database_client.connect().then(() => {
    logger.info('connected to database');
    process_database();
}).catch(reason => {
    logger.log('fatal', `cannot connect to database: ${reason}`);
    process.exit(-1);
});

