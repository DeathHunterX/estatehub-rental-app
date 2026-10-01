export const extractPublicPolicy = (source: string): string => {
    const lines = source.replace(/\r\n?/g, "\n").split("\n");
    const boundary = lines.findIndex((line) => /^# B\./.test(line));
    if (boundary < 0) throw new Error("Policy is missing the # B. public/hand-off boundary");
    const publicText = lines.slice(0, boundary).join("\n").trimEnd();
    if (!publicText.startsWith("# EstateHub ")) throw new Error("Policy public section has no EstateHub title");
    return `${publicText}\n`;
};
