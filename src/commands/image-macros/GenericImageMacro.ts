import { BaseImageMacro } from './BaseImageMacro';
import { CommandMessage, Discord, Guard, Client } from '@typeit/discord';
import config from '../../config.json';
import { Command } from '../../ArgumentParser';
import { CommandGroup } from '../../types/CommandGroup';
import { RateLimit } from '../../guards/RateLimit';
import image_macros from '../../image_macros.json';

@Discord()
export abstract class GenericImageMacro {
    constructor() {
        image_macros.forEach(macro => {
            @Discord({
                prefix: config.prefix
            })
            class GenericImageMacro extends BaseImageMacro {
                public frame = macro.frame;

                constructor() {
                    super({
                        image_location: `${__dirname}/../../${macro.image_location}`,
                        mask_location: `${__dirname}/../../${macro.mask_location}`,
                        output_filename: macro.output_filename,
                        mime: macro.mime
                    })
                }

                @Guard(RateLimit({ rate_limit: 5 }))
                @Command(macro.name, {
                    description: macro.description,
                    group: CommandGroup.IMAGE_MACROS,
                    rest_required: false
                })
                public async exec(message: CommandMessage, client: Client, ...text_or_image: string[]) {
                    return await super.exec(message, client, ...text_or_image);
                }
            }
        });
    }
}