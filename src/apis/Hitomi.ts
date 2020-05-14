import { sha256 } from 'js-sha256';
import fetch from 'node-fetch';
import { CappedMap } from '../utils/CappedMap';
import public_ip from 'public-ip';
import config from '../configs/config.json';

export type GalleryFile = {
    hasavif: 0 | 1,
    haswebp: 0 | 1,
    hash: string,
    height: number,
    name: string,
    width: number
}

export type GalleryTags = {
    female: '1' | '',
    male: '1' | '',
    url: string,
    tag: string
}

export type GalleryInfo = {
    language_localname: string,
    language: string,
    date: string,
    files: GalleryFile[],
    id: string,
    tags: GalleryTags[],
    title: string,
    type: string
};

export class Hitmoi {
    // TODO: do these constants change?
    private domain = 'ltn.hitomi.la';
    private compressed_nozomi_prefix = 'n';
    private nozomiextension = '.nozomi';
    private index_dir = 'tagindex';
    private galleries_index_dir = 'galleriesindex';
    private max_node_size = 464;
    // what the hell does "B" even stand for
    private B = 16;

    private galleries_index_version = '';
    private tag_index_version = '';

    private ip = '';

    private fetch_headers: {
        'Referer': 'https://hitomi.la/search.html',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36'
    }

    private last_timeout;
    private refetch_interval = 60 * 60e3;

    private index_fetches: Promise<any>;

    private static gallery_cache = new CappedMap<string, GalleryInfo>(1000);

    constructor() {
        this.index_fetches = Promise.all([
            this.get_index_version('tagindex').then(version => this.tag_index_version = version),
            this.get_index_version('galleriesindex').then(version => this.galleries_index_version = version)
        ]);

        this.refetch_indicies();

        public_ip.v4().then(ip => this.ip = ip);
    }

    private refetch_indicies() {
        if (this.last_timeout) clearTimeout(this.last_timeout);
        setTimeout(() => {
            this.index_fetches = Promise.all([
                this.get_index_version('tagindex').then(version => this.tag_index_version = version),
                this.get_index_version('galleriesindex').then(version => this.galleries_index_version = version)
            ]);

            this.refetch_indicies();
        }, this.refetch_interval);
    }

    public async search(...query: string[]): Promise<string[]> {
        await this.index_fetches;

        let positive_terms = [];
        let negative_terms = [];
        let results = [];

        query.forEach(term => {
            term = term.replace(/_/g, ' ');
            if (term.startsWith('-')) return negative_terms.push(term.slice(1));
            positive_terms.push(term);
        });

        if (!positive_terms.length) {
            results = await this.get_galleryids_from_nozomi(undefined, 'index', 'all');
        } else {
            const term = positive_terms.shift();
            results = await this.get_galleryids_for_query(term);
        }

        await Promise.all(positive_terms.map(async term => {
            const new_results = await this.get_galleryids_for_query(term);
            const new_results_set = new Set(new_results);
            results = results.filter(id => new_results_set.has(id));
        }));

        await Promise.all(negative_terms.map(async term => {
            const new_results = await this.get_galleryids_for_query(term);
            const new_results_set = new Set(new_results);
            results = results.filter(id => !new_results_set.has(id));
        }));

        return results;
    }

    public async get_gallery_info(gallery: number | string): Promise<GalleryInfo> {
        if (Hitmoi.gallery_cache.has(gallery.toString())) return Hitmoi.gallery_cache.get(gallery.toString());

        const response = await fetch(`https://ltn.hitomi.la/galleries/${gallery}.js`);
        const text = await response.text();
        const info = JSON.parse(text.replace(/^var.+?(?={)/, ''));

        Hitmoi.gallery_cache.set(gallery.toString(), info);

        return info;
    }

    public get_gallery_url(gallery: GalleryInfo): string {
        let url = 'https://hitomi.la/';
        url += `${gallery.type}/`;
        url += encodeURIComponent(gallery.title.replace(/ /g, '-'));
        if (gallery.language_localname) url += `-${encodeURIComponent(gallery.language_localname.replace(/ /g, '-'))}`;
        url += `-${gallery.id}.html`;

        return url.toLowerCase();
    }

    public get_image_url(image: GalleryFile) {
        return `http://${this.ip}:${config.port}/hitomila/${this.image_url_from_image(null, image, false)}`;
    }

    // code below ripped from hitomi.la

    private image_url_from_image(galleryid: number, image: GalleryFile, no_webp: boolean) {
        let webp;
        if (image['hash'] && image['haswebp'] && !no_webp) webp = 'webp';

        return this.url_from_url_from_hash(galleryid, image, webp);
    }

    private url_from_url_from_hash(galleryid, image, dir, ext?, base?) {
        return this.url_from_url(this.url_from_hash(galleryid, image, dir, ext), base);
    }

    private url_from_hash(galleryid, image: GalleryFile, dir: string, ext: string) {
        ext = ext || dir || image.name.split('.').pop();
        dir = dir || 'images';

        return 'https://a.hitomi.la/' + dir + '/' + this.full_path_from_hash(image.hash) + '.' + ext;
    }

    private full_path_from_hash(hash: string) {
        if (hash.length < 3) return hash;

        return hash.replace(/^.*(..)(.)$/, '$2/$1/' + hash);
    }

    private url_from_url(url: string, base: string) {
        return url.replace(/\/\/..?\.hitomi\.la\//, '//' + this.subdomain_from_url(url, base) + '.hitomi.la/');
    }

    private subdomain_from_url(url: string, base: string) {
        let retval = 'a';
        if (base) retval = base;

        let number_of_frontends = 3;
        let b = 16;

        let r = /\/[0-9a-f]\/([0-9a-f]{2})\//;
        let m = r.exec(url);

        if (!m) return retval;

        let g = parseInt(m[1], b);

        if (!isNaN(g)) {
            if (g < 0x30) number_of_frontends = 2;
            if (g < 0x09) g = 1;

            retval = this.subdomain_from_galleryid(g, number_of_frontends) + retval;
        }

        return retval;
    }

    private subdomain_from_galleryid(g: number, number_of_frontends: number) {
        // if (adapose) {
        //     return '0';
        // }

        const o = g % number_of_frontends;

        return String.fromCharCode(97 + o);
    }

    private hash_term(term: string) {
        return new Uint8Array(sha256.array(term).slice(0, 4));
    };

    private retry(fn: () => Promise<any>, retries?: number, err?: any) {
        retries = retries ?? 3;
        err = typeof err !== 'undefined' ? err : null;

        if (!retries) {
            return Promise.reject(err);
        }
        return fn().catch((err) =>
            this.retry(fn, (retries - 1), err)
        );
    }

    private getUint64(buffer: DataView, byteOffset: number, littleEndian?: boolean) {
        // split 64-bit number into two 32-bit (4-byte) parts
        const left = buffer.getUint32(byteOffset, littleEndian);
        const right = buffer.getUint32(byteOffset + 4, littleEndian);

        // combine the two 32-bit values
        const combined = littleEndian ? left + 2 ** 32 * right : 2 ** 32 * left + right;

        if (!Number.isSafeInteger(combined))
            console.warn(combined, 'exceeds MAX_SAFE_INTEGER. Precision may be lost');

        return combined;
    }

    private decode_node(data: Uint8Array) {
        let node = {
            keys: [],
            datas: [],
            subnode_addresses: [],
        };

        let view = new DataView(data.buffer);
        let pos = 0;

        const number_of_keys = view.getInt32(pos, false /* big-endian */);
        pos += 4;

        let keys = [];
        for (let i = 0; i < number_of_keys; i++) {
            const key_size = view.getInt32(pos, false /* big-endian */);
            if (!key_size || key_size > 32) {
                console.log('fatal: !key_size || key_size > 32');
                return;
            }
            pos += 4;

            keys.push(data.slice(pos, pos + key_size));
            pos += key_size;
        }


        const number_of_datas = view.getInt32(pos, false /* big-endian */);
        pos += 4;

        let datas = [];
        for (let i = 0; i < number_of_datas; i++) {
            const offset = this.getUint64(view, pos, false /* big-endian */);
            pos += 8;

            const length = view.getInt32(pos, false /* big-endian */);
            pos += 4;

            datas.push([offset, length]);
        }


        const number_of_subnode_addresses = this.B + 1;
        let subnode_addresses = [];
        for (let i = 0; i < number_of_subnode_addresses; i++) {
            let subnode_address = this.getUint64(view, pos, false /* big-endian */);
            pos += 8;

            subnode_addresses.push(subnode_address);
        }


        node.keys = keys;
        node.datas = datas;
        node.subnode_addresses = subnode_addresses;

        return node;
    };

    private async get_index_version(name: string): Promise<string> {
        const response = await fetch('https://' + this.domain + '/' + name + '/version?_=' + (new Date).getTime(), { headers: this.fetch_headers });
        if (response.status == 200) return await response.text();

        return 'failed';
    }

    private async B_search(field: string, key: Uint8Array, node, serial?: number) {
        let compare_arraybuffers = (dv1, dv2) => {
            const top = Math.min(dv1.byteLength, dv2.byteLength);
            for (let i = 0; i < top; i++) {
                if (dv1[i] < dv2[i]) {
                    return -1;
                } else if (dv1[i] > dv2[i]) {
                    return 1;
                }
            }
            return 0;
        };

        let locate_key = (key, node) => {
            let cmp_result = -1;
            let i;
            for (i = 0; i < node.keys.length; i++) {
                cmp_result = compare_arraybuffers(key, node.keys[i]);
                if (cmp_result <= 0) {
                    break;
                }
            }
            return [!cmp_result, i];
        };

        let is_leaf = node => {
            for (let i = 0; i < node.subnode_addresses.length; i++) {
                if (node.subnode_addresses[i]) {
                    return false;
                }
            }
            return true;
        };


        if (!node) return false;

        if (!node.keys.length) return false; //special case for empty root

        let [there, where] = locate_key(key, node);
        if (there) {
            return node.datas[where];
        } else if (is_leaf(node)) {
            return false;
        }

        //it's in a subnode
        const new_node = await this.get_node_at_address(field, node.subnode_addresses[where], serial);

        return await this.B_search(field, key, new_node, serial);
    };

    private async get_galleryids_from_data(data: [number, number]): Promise<number[]> {
        if (!data) return [];

        const url = 'https://' + this.domain + '/' + this.galleries_index_dir + '/galleries.' + this.galleries_index_version + '.data';

        let [offset, length] = data;

        if (length > 100000000 || length <= 0) {
            console.error('length ' + length + ' is too long');
            return [];
        }

        const inbuf = await this.get_url_at_range(url, [offset, offset + length - 1]);

        if (!inbuf) return [];

        let galleryids = [];

        let pos = 0;
        let view = new DataView(inbuf.buffer);
        let number_of_galleryids = view.getInt32(pos, false /* big-endian */);
        pos += 4;

        let expected_length = number_of_galleryids * 4 + 4;

        if (number_of_galleryids > 10000000 || number_of_galleryids <= 0) {
            console.error('number_of_galleryids ' + number_of_galleryids + ' is too long');
            return [];
        } else if (inbuf.byteLength !== expected_length) {
            console.error('inbuf.byteLength ' + inbuf.byteLength + ' !== expected_length ' + expected_length);
            return [];
        }

        for (let i = 0; i < number_of_galleryids; ++i) {
            galleryids.push(view.getInt32(pos, false /* big-endian */));
            pos += 4;
        }

        return galleryids;
    };


    private async get_url_at_range(url: string, range: [number, number]): Promise<Uint8Array> {
        return await this.retry(async () => {
            const response = await fetch(url, {
                headers: {
                    ...this.fetch_headers,
                    'Range': `bytes=${range[0]}-${range[1]}`
                }
            });

            if (response.status != 200 && response.status != 206) throw new Error(`get_url_at_range(${url}, ${range}) failed, status: ${response.status}`);

            const buffer = await response.arrayBuffer();

            debugger;

            return new Uint8Array(buffer);
        }).catch(console.error);
    }

    private async get_node_at_address(field, address: number, serial?: number) {
        let url = 'https://' + this.domain + '/' + this.index_dir + '/' + field + '.' + this.tag_index_version + '.index';
        if (field === 'galleries') url = 'https://' + this.domain + '/' + this.galleries_index_dir + '/galleries.' + this.galleries_index_version + '.index';

        const nodedata = await this.get_url_at_range(url, [address, address + this.max_node_size - 1]);

        if (nodedata) return this.decode_node(nodedata);
    }

    private async get_galleryids_from_nozomi(area: string, tag: string, language: string): Promise<number[]> {
        let nozomi_address = 'https://' + [this.domain, this.compressed_nozomi_prefix, [tag, language].join('-')].join('/') + this.nozomiextension;
        if (area) nozomi_address = 'https://' + [this.domain, this.compressed_nozomi_prefix, area, [tag, language].join('-')].join('/') + this.nozomiextension;

        const response = await fetch(nozomi_address, { headers: this.fetch_headers });
        const arrayBuffer = await response.arrayBuffer();

        const nozomi = []

        if (arrayBuffer) {
            const view = new DataView(arrayBuffer);
            const total = view.byteLength / 4;
            for (let i = 0; i < total; i++) {
                nozomi.push(view.getInt32(i * 4, false /* big-endian */));
            }
        }

        return nozomi;
    }

    private async get_galleryids_for_query(query: string): Promise<number[]> {
        query = query.replace(/_/g, ' ');

        if (query.indexOf(':') > -1) {
            const sides = query.split(/:/);
            const ns = sides[0];
            let tag = sides[1];

            let area = ns;
            let language = 'all';
            if ('female' === ns || 'male' === ns) {
                area = 'tag';
                tag = query;
            } else if ('language' === ns) {
                area = undefined;
                language = tag;
                tag = 'index';
            }

            return await this.get_galleryids_from_nozomi(area, tag, language);
        }
        const key = this.hash_term(query);
        const field = 'galleries';

        const node = await this.get_node_at_address(field, 0);

        if (!node) return [];

        const data = await this.B_search(field, key, node)
        if (!data) return [];

        return await this.get_galleryids_from_data(data);
    }
}