import { NativePackFetch } from '../../src/foodCatalog/download/native/NativePackFetch';
import { StreamedPackFetch } from '../../src/foodCatalog/download/StreamedPackFetch';
import { packFileFetchContract } from '../contracts/packFileFetchContract';
import { fakeMmPacksFiles } from '../support/fakeMmPacksFiles';

/** MM-387: every way a pack file reaches its partial does the same thing. */
packFileFetchContract('Streamed through the app', ({ http, store }) => new StreamedPackFetch({ http, store }));
packFileFetchContract('Native, over the plugin', ({ http, store }) => new NativePackFetch(fakeMmPacksFiles({ http, store }).api));
