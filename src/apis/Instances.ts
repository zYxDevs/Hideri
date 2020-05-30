import credentials from '../configs/credentials.json';
import { NHentai } from './NHentai';
import NekosClient from 'nekos.life';
import { Hitmoi } from './Hitomi';
import { ExHentai } from './ExHentai';
import { HAnime } from './HAnime';
import { NekoBot } from 'nekobot-api';

export const nhentai = new NHentai();
export const nekos = new NekosClient();
export const hitomi = new Hitmoi();
export const exhentai = ((credentials as any)?.proxy?.type == 'ssh') ? new ExHentai(credentials.exhentai, 'socks5://127.0.0.1:1080') : new ExHentai(credentials.exhentai);
export const hanime = new HAnime();
export const nekobot = new NekoBot();
