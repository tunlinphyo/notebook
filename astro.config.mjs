// @ts-check
import { defineConfig } from 'astro/config';
import rehypeCopyButton from './utils/rehypeCopyButton.js';
import mdx from '@astrojs/mdx';
import rehypePrism from 'rehype-prism-plus';

// https://astro.build/config
export default defineConfig({
    integrations: [
        mdx({
            rehypePlugins: [rehypePrism],
        }),
    ],
    markdown: {
        syntaxHighlight: 'shiki', // or 'prism' or false
        rehypePlugins: [rehypeCopyButton],
    },
});
