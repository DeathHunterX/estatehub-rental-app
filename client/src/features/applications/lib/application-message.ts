export const APPLICATION_MESSAGE_MAX_WORDS = 150;
export const APPLICATION_MESSAGE_MAX_CHARACTERS = 1000;

export const countApplicationWords = (value: string) =>
    value.trim() ? value.trim().split(/\s+/u).length : 0;

export const limitApplicationMessage = (value: string) => {
    const limitedCharacters = value.slice(0, APPLICATION_MESSAGE_MAX_CHARACTERS);
    const words = [...limitedCharacters.matchAll(/\S+/gu)];
    if (words.length <= APPLICATION_MESSAGE_MAX_WORDS) return limitedCharacters;
    return limitedCharacters.slice(0, words[APPLICATION_MESSAGE_MAX_WORDS].index).trimEnd();
};
