export type EncryptedSignature = {
    signatureCiphertext: string;
    signatureSalt: string;
    signatureIv: string;
};

const encode = (bytes: Uint8Array) => {
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 8192) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
    }
    return btoa(binary);
};
const decode = (base64: string) => Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));

const deriveKey = async (passphrase: string, salt: Uint8Array) => {
    const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 250000, hash: "SHA-256" }, material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
};

export async function encryptSignature(imageDataUrl: string, passphrase: string): Promise<EncryptedSignature> {
    if (passphrase.length < 12) throw new Error("Use a passphrase of at least 12 characters.");
    if (!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+=*$/.test(imageDataUrl) || imageDataUrl.length > 55000) {
        throw new Error("Choose a PNG or JPEG signature image under 40 KB after resizing.");
    }
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase, salt);
    const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(imageDataUrl)));
    return { signatureCiphertext: encode(ciphertext), signatureSalt: encode(salt), signatureIv: encode(iv) };
}

export async function decryptSignature(value: EncryptedSignature, passphrase: string): Promise<string> {
    const salt = decode(value.signatureSalt);
    const iv = decode(value.signatureIv);
    const key = await deriveKey(passphrase, salt);
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, decode(value.signatureCiphertext));
    const image = new TextDecoder().decode(plaintext);
    if (!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+=*$/.test(image)) throw new Error("The stored signature is invalid.");
    return image;
}
