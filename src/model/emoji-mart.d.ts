/** A field added here must also go into `slim-emoji-data` in esbuild.config.mjs. */
declare module "@emoji-mart/data" {
  export interface EmojiMartSkin {
    native: string;
  }

  export interface EmojiMartEmoji {
    name: string;
    keywords: string[];
    skins: EmojiMartSkin[];
  }

  export interface EmojiMartCategory {
    id: string;
    emojis: string[];
  }

  export interface EmojiMartData {
    categories: EmojiMartCategory[];
    emojis: Record<string, EmojiMartEmoji>;
  }

  const data: EmojiMartData;
  export default data;
}
