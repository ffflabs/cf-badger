import { Base64 } from 'js-base64';

export const str2ab = (str: string): ArrayBuffer => {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
};

export const getDERfromPEM = (pem: string): ArrayBuffer => {
    const pemB64 = pem
        .trim()
        .split('\n')
        .slice(1, -1) // Remove the --- BEGIN / END PRIVATE KEY ---
        .join('');

    return str2ab(Base64.atob(pemB64));
};

export const b64encodeJSON = (obj: { [s: string]: string }): string => Base64.encode(JSON.stringify(obj), true);

export const getEncodedMessage = (header: { [s: string]: string }, payload: { [s: string]: string }): string => {
    const encodedHeader = b64encodeJSON(header);
    const encodedPayload = b64encodeJSON(payload);
    const encodedMessage = `${encodedHeader}.${encodedPayload}`;
    return encodedMessage;
};
export const algorithms = {
    RS256: {
        name: 'RSASSA-PKCS1-v1_5',
        hash: { name: 'SHA-256' },
    },
    ES256: {
        name: 'ECDSA',
        namedCurve: 'P-256',
        hash: { name: 'SHA-256' },
    },
};

export const getHeader = (alg: string, headerAdditions: { [s: string]: string }): { [s: string]: string } => ({
    ...headerAdditions,
    alg,
    typ: 'JWT',
});
/*
Convert  an ArrayBuffer into a string
from https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
*/
function ab2str(buf: ArrayBuffer) {

    return String.fromCharCode(... new Uint8Array(buf))

}
export async function getJWT({ privateKey, payload, alg = 'RS256', headerAdditions = {} }:
    { privateKey: CryptoKey, alg: keyof typeof algorithms, payload: { [s: string]: string }, headerAdditions: { [s: string]: string } }): Promise<string> {
    const algorithm = algorithms[alg];

    const header = getHeader(alg, headerAdditions);
    const encodedMessage = getEncodedMessage(header, payload);
    const encodedMessageArrBuf = str2ab(encodedMessage);
    const signatureArrBuf = await crypto.subtle.sign(
        algorithm,
        privateKey,
        encodedMessageArrBuf
    );
    const signatureUint8Array = new Uint8Array(signatureArrBuf);
    const encodedSignature = Base64.fromUint8Array(signatureUint8Array, true);
    const token = `${encodedMessage}.${encodedSignature}`;
    return token;
}
/*
Export the given key and write it into the "exported-key" space.
*/
export async function exportPrivateCryptoKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey(
        "spki",
        key
    );
    const exportedAsString = ab2str(exported);
    const exportedAsBase64 = Base64.encode(exportedAsString);
    return `-----BEGIN PRIVATE KEY-----\n${exportedAsBase64}\n-----END PRIVATE KEY-----`;

}

/*
Export the given key and write it into the "exported-key" space.
*/
export async function exportPublicCryptoKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey(
        "spki",
        key
    );
    const exportedAsString = ab2str(exported);
    const exportedAsBase64 = Base64.encode(exportedAsString);
    return `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64}\n-----END PUBLIC KEY-----`;

}

export async function createKeyPair(): Promise<{ publicKey: JsonWebKey & ArrayBuffer | null; privateKey: JsonWebKey & ArrayBuffer | null; }> {
    const keyPair = await crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            // Consider using a 4096-bit key for systems that require long-term security
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
    )

    const publicKey = keyPair.publicKey ? await crypto.subtle.exportKey(
        "spki",
        keyPair.publicKey
    ) : null;
    const privateKey = keyPair.privateKey ? await crypto.subtle.exportKey(
        "spki",
        keyPair.privateKey
    ) : null;

    return { publicKey, privateKey }
}

/*
 Get the encoded message, encrypt it and display a representation
 of the ciphertext in the "Ciphertext" element.
 */
export async function encryptMessage(obj: { [s: string]: string }, publicKey: CryptoKey): Promise<string> {

    let encoded = new TextEncoder().encode(JSON.stringify(obj))
    let ciphertext = await crypto.subtle.encrypt(
        {
            name: "RSA-OAEP"
        },
        publicKey,
        encoded
    );
    return Base64.encode(ab2str(ciphertext))
}

/*
Fetch the ciphertext and decrypt it.
Write the decrypted message into the "Decrypted" box.
*/
export async function decryptMessage(encryptedMsg: string, privateKey: CryptoKey): Promise<string> {
    let decrypted = await crypto.subtle.decrypt(
        {
            name: "RSA-OAEP"
        },
        privateKey,
        str2ab(Base64.decode(encryptedMsg))
    );

    let dec = new TextDecoder();
    return dec.decode(decrypted);
}