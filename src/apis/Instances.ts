import credentials from '../configs/credentials.json';
import { NHentai } from './NHentai';
import NekosClient from 'nekos.life';
import { Hitmoi } from './Hitomi';
import { ExHentai } from './ExHentai';

export const nhentai = new NHentai();
export const nekos = new NekosClient();
export const hitomi = new Hitmoi();
export const exhentai = new ExHentai(credentials.exhentai);
