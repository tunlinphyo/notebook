// @ts-check
import { defineConfig } from 'astro/config';
import rehypeCopyButton from './utils/rehypeCopyButton.js';

// https://astro.build/config
export default defineConfig({
    markdown: {
        syntaxHighlight: 'shiki', // or 'prism' or false
        rehypePlugins: [rehypeCopyButton],
    },
});
