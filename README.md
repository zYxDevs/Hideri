# Hideri

Hideri is a bot written in TypeScript which provides commands to search for hentai from many different sites. [Invite Hideri to your server.](https://discord.com/oauth2/authorize?client_id=507648234236411904&scope=bot&permissions=640928832)

# Commands
Use the `<h` or `<help` command for help. The following commands are implemented.

## General
#### `<ping`: gets the ping of the bot
#### `<h <command>`: gets general help or command help
* aliases: `<help`
#### `<version`: gets the version of the bot
#### `<invite`: gets the invite link
#### `<uptime`: gets uptime of bot

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
#### `<r [subreddit] <status> <time> <post_number>`: gets a post from a subreddit
* aliases: `<reddit`
#### `<hitomi [...query]`: gets a random gallery from hitomi.la
* aliases: `<hitomila`
#### `<nh [...query]`: gets a random gallery from nhentai.net
* aliases: `<nhentai`

## Embed Patterns
Hideri also responds to the following patterns anywhere in a message
#### `(gallery page)`: gets a specific page and gallery from nhentai
* example: `(177013)` or `(238029 16)`
#### `!gallery page!`: gets a specific page and gallery from hitomi.la
* example: `!1147281!` or `!930477 10!`

## Image Macros
#### `<tohrusay <...text_or_images>`: have Tohru say something
#### `<mishirosay <...text_or_images>:` have Mishiro say something
#### `<tsumugisay <...text_or_images>:` have Tsumugi say something
#### `<nerosay <...text_or_images>:` have Nero say something
#### `<kaedesay <...text_or_images>:` have Kaede say something
#### `<maisay <...text_or_images>:` have Mai say something
#### `<chikasay <...text_or_images>:` have Chika say something

## Fun
#### `<owoify [message]`: owoifwies a mwessage
#### `<uwuify [message]`: uwuifwies a mwessage
#### `<uvuify [message]`: uvuifwies a mwessage

## Impersonation
#### `<baka [@member]`: makes someone a tsundere
#### `<onii-chan [@member]`
#### `<embarrass [@member]`: embarrass someone

## Image Emotes
#### `<aoc`
#### `<unfunny`
#### `<pgleave`
#### `<whoasked`
#### `<findwhoasked`
#### `<ugly`
#### `<dicks`
#### `<didntask`
#### `<everyone`
#### `<heyhey`
#### `<pat <@member>`

# Development
### Requirements

Node v11 or greater

### Instructions

1. Install dependencies with `npm i`
7. Patch packages with `npx patch-package`
7. Set bot token and other configs in `src/configs/config.json` (see `config.json.example` for example)
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
```json
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
| token                  | bot token                                                                      |
| prefix                 | bot command prefix                                                             |
| owner_id               | bot owner id                                                                   |
| port                   | port the image proxy server will listen on (optional if proxy server disabled) |
| enable_server          | whether or not the image proxy server should be enabled                        |
| server_url             | external ip/url of the image proxy server                                      |
| color                  | embed color                                                                    |
| cache_dir              | directory image caches are stored in                                           |
| exit_on_uncaught_error | if the bot should exit when an uncaught error is thrown                        |

## `image_emotes.json`
* defines image emote commands
    ### format:
```json
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
```json
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
```json
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
| log_level           | minimum log-level of the combined log (silly, verbose, debug, info, http, warn, error, or fatal) |
| console             | whether or not to log to console                                                                 |
| log_dir             | directory for logs                                                                               |
| combined_log        | filename of the combined log, or null for none                                                   |
| error_log           | filename of the error log, or null for none                                                      |
| http_log            | filename of the http log, or null for none                                                       |
| info_log            | filename of the info log, or null for none                                                       |
| generate_json_logs  | whether to generate json formatted logs (filename is log filename + .json)                       |
| server_log_loopback | whether to log access to the server from a loopback address (127.0.0.1/8 or ::1)                 |

## `neko_tags.json`
* a list of allowed tags for the `<neko` command

# TODO
* add support for e-hentai/exhentai
* add support for tsumino
* add support for hanime.tv
* add support for hentaihaven