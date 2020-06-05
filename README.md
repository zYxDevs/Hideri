<p align="center">
    <img src="https://cdn.discordapp.com/avatars/507648234236411904/9a992f93f593db96af1ef13f2a949e0a.png?size=256">
</p>

# Hideri

Hideri is a bot written in TypeScript which provides commands to search for hentai from many different sites. [Invite Hideri to your server.](https://discord.com/oauth2/authorize?client_id=507648234236411904&scope=bot&permissions=640928832)

# Commands

* Arguments in square brackets `[]` are required
* Arguments in angle brackets `<>` are optional
* Arguments prefixed with `**` are keyword arguments. Use `--key=value` anywhere in a command to set them.

Use the `<h` or `<help` command for help. The following commands are implemented.

## General
#### `<ping`: gets the ping of the bot
#### `<h <command>`: gets general help or command help
* aliases: `<help`
#### `<version`: gets the version of the bot
#### `<invite`: gets the invite link
#### `<uptime`: gets uptime of bot

## Misc Commands
#### `<stoptyping`: stops the bot typing in the channel if it gets stuck typing
* aliases: `<stop_typing`
#### `<creation_date <@member|#channel>`: gets the creation date of a user's account or a channel or the server

## Admin Only
#### `<config help <config_key>`: gets help for the config key
* Examples:
    * `<config help`: get general help
    * `<config help common.prefix`: gets help on the `common.prefix` config value
#### `<config set [config_key] [value]`: sets the config key for the server
* Examples:
    * `<config set common.prefix !`: changes the prefix to `!` for the server
    * `<config set common.nsfw_all_channels false`: only allows nsfw commands in nsfw channels
#### `<config delete [config_key]`: deletes the config key for the server
* Examples:
    * `<config delete common.help_dm`: deletes the set value for `common.help_dm` and resets it to default
#### `<config get [config_key]`: gets the config value for the server
* Examples:
    * `<config get common.command_list`: gets a list of whitelisted/blacklisted commands

The `<config` command can also be used with DM channels if given a server id after the config key (you must be an admin in that server).
* Example: `<config set common.prefix 177013215600139808 !`

### Server Config Values:
| Config Key                       | Type     | Description                                                          | Default |
|----------------------------------|----------|----------------------------------------------------------------------|---------|
|`common.prefix                   `|`string  `| prefix for the server                                                |`<      `|
|`common.nsfw_all_channels        `|`boolean `| whether nsfw commands should be allowed in all channels, or just nsfw            |`false   `|
|`common.require_mention_for_search`|`boolean`| whether non-command searches such as (177013) require a mention to the bot | `true` |
|`common.channel_list             `|`string[]`| list of allowed/disallowed channels for commands                     |`[]     `|
|`common.channel_list_as_blacklist`|`boolean `| if channel_list should be used as a blacklist, otherwise a whitelist |`true   `|
|`common.command_list             `|`string[]`| list of allowed/disallowed commands                                  |`[]     `|
|`common.command_list_as_blacklist`|`boolean `| if command_list should be used as a blacklist, otherwise a whitelist |`true   `|
|`common.dm_list                  `|`string[]`| list of commands that will be sent as DMs instead of sending in the channel |`[]     `|
|`common.dm_list_as_blacklist     `|`boolean `| if dm_list should be used as a blacklist of commands to send as DMs, otherwise a whitelist of commands that will not be sent as DMs |`true   `|

* Examples:
    * `<config set common.prefix !`: sets the prefix to `!`
    * `<config set common.nsfw_all_channels false`: only allow nsfw commands to be used in nsfw channels
    * `<config set common.channel_list 713177166174617650`: disallows commands from being used in channel id `713177166174617650`
    * `<config set common.channel_list_as_blacklist false`: now commands can only be used in channel id `713177166174617650`
    * `<config set common.command_list help,*booru*`: disallows the help command, and any command containing `booru`
    * `<config set common.command_list_as_blacklist false`: now only the help command and booru commands can be used
    * `<config set common.dm_list help`: sends the help command as a DM instead of in the channel
    * `<config set common.dm_list_as_blacklist false`: now all commands but the help command will be sent as a DM

## Communities
#### `<hypnohub [...query]`: gets an image from hypnohub.net
* aliases: `<hypno`
#### `<danbooru [...query]`: gets an image from danbooru.donmai.us
* aliases: `<dan`
#### `<konachan [...query]`: gets an image from konachan.com
* aliases: `<kona`
#### `<yandere [...query]`: gets an image from yande.re
#### `<gelbooru [...query]`: gets an image from gelbooru.com
* aliases: `<gel`
#### `<rule34 [...query]`: gets an image from rule34.xxx
* aliases: `<r34`
#### `<safebooru [...query]`: gets an image from safebooru.org
#### `<tbib [...query]`: gets an image from tbib.org
#### `<xbooru [...query]`: gets an image from xbooru.com
#### `<lolibooru [...query]`: gets an image from lolibooru.moe
#### `<paheal [...query]`: gets an image from rule34.paheal.net
#### `<booru [booru] [...query]`: gets an image from the selected booru
#### `<ahegao`: gets a random ahegao picture
#### `<neko [tag] <text>`: gets an image from nekos.life
#### `<nekobot [tag]`: gets an image from nekobot.xyz
#### `<nekobot [tag] [...args]`: generates an image from nekobot (see [nekobot.xyz docs](https://docs.nekobot.xyz/))
#### `<r [subreddit] <status> <time> <post_number>`: gets a post from a subreddit
* aliases: `<reddit`
#### `<hitomi [...query]`: gets a random gallery from hitomi.la
* aliases: `<hitomila`
#### `<nh [...query]`: gets a random gallery from nhentai.net
* aliases: `<nhentai`
#### `<eh [...query] <**type>`: gets a random gallery of type `type` from e-hentai/exhentai. If `--type` is not provided, it defaults to `doujinshi`
* aliases: `<ex`, `<exhentai`, `<e-hentai`, `<ehentai`
#### `<ha [...query]`: gets a video from hanime.tv
* aliases: `<hanime`
#### `<ts [...query]`: gets a book from tsumino
* aliases: `<tsu`, `<tsumino`, `<tsbook`, `<tsuminobook`, `<tsgallery`, `<tsuminogallery`
#### `<tsv [...query]`: gets a video from tsumino
* aliases: `<tsuminovideo`, `<tsvideo`

## Embed Patterns
Hideri also responds to the following patterns anywhere in a message. Note that, by default, Hideri is configured to only respond to these Hideri is @mentioned in the message.
#### `(gallery page)`: gets a specific page and gallery from nhentai
* example: `(177013)` or `(238029 16)`
#### `!gallery page!`: gets a specific page and gallery from hitomi.la
* example: `!1147281!` or `!930477 10!`
#### `}gallery/token/page{`: gets a specific page and gallery from exhentai/e-hentai
* example: `}1644295/e2a1c52635{` or `}598161/e4c27bdca0/196{`
#### `/video title/`: gets a video from hanime
* example: `/The Public Toilet 2/`
#### `)entry_id(` or `)entry_id page(`: gets a specific entry (doujin/video) from tsumino
* example: `)49683(` or `)45036(` or `)48073 22(`

## Image Macros
#### `<tohrusay <...text_or_images>`: have Tohru say something
#### `<mishirosay <...text_or_images>:` have Mishiro say something
#### `<tsumugisay <...text_or_images>:` have Tsumugi say something
#### `<nerosay <...text_or_images>:` have Nero say something
#### `<kaedesay <...text_or_images>:` have Kaede say something
#### `<maisay <...text_or_images>:` have Mai say something
#### `<chikasay <...text_or_images>:` have Chika say something
#### `<animedetect [image]`: find anime faces in an image/avatar
#### `<awooify [image]`: awooify an image/avatar
#### `<baguette [image]`: make a user hold a baguette
#### `<deepfry [image]`: deep fries an image
#### `<iphone [image]`: puts an image on an iphone
#### `<jpeg [image]`: needs more jpeg
#### `<lolice [image]`: i swear officer she's 9000 years old
#### `<threats [image]`: biggest threats to society
#### `<trash [image]`: make a waifu trash
#### `<clyde [...text]`: make clyde say something
#### `<hifumisay [...text]`: have hifumi say something
#### `<kannasay [...text]`: have kanna say something
#### `<trumptweet [...text]`: have trump tweet something
#### `<captcha [image] [...text]`: generate a captcha
#### `<magik [image] <intensity>`: magik warp an image
#### `<phcomment [@member] [text]`: have a member make a comment on pornhub
#### `<ship [@member1] [@member2]`: ship two members (distracted boyfriend meme)
#### `<whowouldwin [@member1] [@member2]`: who would win?
#### `<tweet [handle] [text]`: create a tweet by handle containing text
#### `<ddlc [...text] <**character: monika|sayori|natsuki|yuri> <**background: bedroom|class|closet|club|corridor|house|kitchen|residential|sayori_bedroom> <**body: 1|2|1b|2b> <**face: string>`: have one of the dokis say something

## Fun
#### `<owoify [message]`: owoifwies a mwessage
#### `<uwuify [message]`: uwuifwies a mwessage
#### `<uvuify [message]`: uvuifwies a mwessage

## Impersonation
#### `<baka [@member]`: makes someone a tsundere
#### `<onii-chan [@member]`: police are on their way
#### `<embarrass [@member]`: embarrass someone

## Image Emotes
#### `<aoc`
#### `<unfunny`: not funny
#### `<pgleave`: leave.
#### `<whoasked`: did i ask?
#### `<findwhoasked`: find who asked.
#### `<ugly`
#### `<dicks`: you love sucking them
#### `<didntask`: i didn't ask
#### `<everyone`: please don't
#### `<heyhey`: shinomiya-san
#### `<pat <@member>`: pats member
#### `<tickle <@member>`: tickles member
#### `<slap <@member>`: slaps member
#### `<poke <@member>`: pokes member
#### `<kiss <@member>`: kisses member
#### `<hug <@member>`: hugs member
#### `<feed <@member>`: feeds member
#### `<cuddle <@member>`: cuddles member

# Development
### Requirements

Node v11 or greater

### Instructions

1. Install dependencies with `npm i`
7. Patch packages with `npx patch-package`
7. Set bot token and other configs in `src/configs/config.json` and `src/configs/credentials.json` (see `config.json.example` and `credentials.json.example` for examples)
0. Compile and run with `npm run start`
1. Configure port forwarding if you are using server proxying (see the configuration section for details)
3. Invite bot to server

### A note on compatility
If you are running the bot on a node version lower than 14, you need to set `target` to `es2019` in `tsconfig.json`

# Configuration
## `activities.json`
* sets the activities, defined in `src/activities`, that the bot cycles through
## `boorus.json`
* sets which [boorus](https://github.com/AtlasTheBot/booru/blob/master/src/sites.json) the bot will explicitly define commands for
    ### format:
```
{
    "name": [command name],
    "booru": [booru site],
    "aliases"?: [command aliases]
}
```
## `config.json`
* main configuration file

| Key                    | Description                                                                    |
|------------------------|--------------------------------------------------------------------------------|
|`token                 `| bot token                                                                      |
|`prefix                `| bot command prefix                                                             |
|`owner_id              `| bot owner id                                                                   |
|`port                  `| port the image proxy server will listen on (optional if proxy server disabled) |
|`enable_server         `| whether or not the image proxy server should be enabled                        |
|`server_url            `| external ip/url of the image proxy server                                      |
|`color                 `| embed color                                                                    |
|`cache_dir             `| directory image caches are stored in                                           |
|`exit_on_uncaught_error`| if the bot should exit when an uncaught error is thrown                        |

## `credentials.json`
* configuration for website logins

| Key | Description |
|-----|-------------|
|`exhentai`| cookies for exhentai |
|`proxy`   | proxy to use (ssh only currently) |

## `database.json`
* configuration for postgresql connection. Has one key: `connection`, which can be a postgresql connection string or an environment variable if the string starts with `process.env`

## `image_emotes.json`
* defines image emote commands
    ### format:
```
{
    "name": [command name],
    "info"?: [command info],
    "description"?: [command description],
    "url": [image url to send]
}
```

## `image_macros.json`
* defines image macro commands
    ### format:
```
{
    "name": [command name],
    "description": [command description],
    "image_location": [location of image],
    "mask_location": [location of image mask],
    "output_filename": [filename to output],
    "mime": [mime of output],
    "frame": {
        "x":  [x position from top left of text frame],
        "y": [y position from top left of text frame],
        "width": [width of text frame],
        "height": [height of text frame],
        "rot": [rotation of text frame]
    }
}
```

## `image_proxying.json`
* defines how images should be sent from sites that do not allow hotlinking
* valid values:
    * `proxy`: proxy the image through the image proxying server
    * `upload`: upload the image to an intermediate discord channel (requires `upload_channel` to be defined)

## `impersonation_commands.json`
* defines impersonation commands
```
{
    "name": [command name],
    "info": [command info],
    "description": [command description],
    "text": [string, or array of strings to pick from],
    "aliases": [command aliases]
}
```

## `logging.json`
* defines logging

| Key                 | Description                                                                                      |
|---------------------|--------------------------------------------------------------------------------------------------|
|`log_level          `| minimum log-level of the combined log (silly, verbose, debug, info, http, warn, error, or fatal) |
|`console            `| whether or not to log to console                                                                 |
|`log_dir            `| directory for logs                                                                               |
|`combined_log       `| filename of the combined log, or null for none                                                   |
|`error_log          `| filename of the error log, or null for none                                                      |
|`http_log           `| filename of the http log, or null for none                                                       |
|`info_log           `| filename of the info log, or null for none                                                       |
|`generate_json_logs `| whether to generate json formatted logs (filename is log filename + .json)                       |
|`server_log_loopback`| whether to log access to the server from a loopback address (127.0.0.1/8 or ::1)                 |

## `neko_tags.json`
* a list of allowed tags for the `<neko` command

# TODO
- [ ] add support for hentaihaven
- [ ] add support for anime (anilist, mal, etc.)
- [ ] add support for manga (mangadex, etc.)
- [ ] add support for vns (vndb, etc.)
- [ ] add support for lns (lndb, etc)
- [ ] add support for nozomi.la