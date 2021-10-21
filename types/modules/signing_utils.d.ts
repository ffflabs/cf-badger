export declare const str2ab: (str: string) => ArrayBuffer;
export declare const getDERfromPEM: (pem: string) => ArrayBuffer;
export declare const b64encodeJSON: (obj: {
    [s: string]: string;
}) => string;
export declare const getEncodedMessage: (header: {
    [s: string]: string;
}, payload: {
    [s: string]: string;
}) => string;
export declare const algorithms: {
    RS256: {
        name: string;
        hash: {
            name: string;
        };
    };
    ES256: {
        name: string;
        namedCurve: string;
        hash: {
            name: string;
        };
    };
};
export declare const getHeader: (alg: string, headerAdditions: {
    [s: string]: string;
}) => {
    [s: string]: string;
};
export declare function getJWT({ privateKey, payload, alg, headerAdditions }: {
    privateKey: CryptoKey;
    alg: keyof typeof algorithms;
    payload: {
        [s: string]: string;
    };
    headerAdditions: {
        [s: string]: string;
    };
}): Promise<string>;
export declare function exportPrivateCryptoKey(key: CryptoKey): Promise<string>;
export declare function exportPublicCryptoKey(key: CryptoKey): Promise<string>;
export declare function createKeyPair(): Promise<{
    publicKey: JsonWebKey & ArrayBuffer | null;
    privateKey: JsonWebKey & ArrayBuffer | null;
}>;
export declare function encryptMessage(obj: {
    [s: string]: string;
}, publicKey: CryptoKey): Promise<string>;
export declare function decryptMessage(encryptedMsg: string, privateKey: CryptoKey): Promise<string>;
