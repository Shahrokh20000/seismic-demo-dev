import {generatePrivateKey, privateKeyToAccount} from "viem/accounts";
import {
    http,
    webSocket,
    fallback,
    stringToHex,
    defineChain,
    encodeAbiParameters,
    parseAbiParameters,
    keccak256,
    hexToBytes,
    bytesToHex,
    decodeAbiParameters,
    toHex,
    pad,
    type Chain,
    type Transport,
    type PrivateKeyAccount,
    type PublicClient,
    type WalletClient,
    type TransactionReceipt,
    type GetContractReturnType,
    zeroAddress,
    hexToBigInt,
} from "viem";
import {
    createShieldedWalletClient,
    getShieldedContract,
    type ShieldedWalletClient,
    createShieldedPublicClient,
    signedReadContract,
} from "seismic-viem";
import {secp256k1} from "@noble/curves/secp256k1.js";
import {gcm} from "@noble/ciphers/aes.js";
import {seismicTestnet} from "seismic-viem" ;


export const abi = [
    {type: "constructor", inputs: [], stateMutability: "nonpayable"},
    {
        type: "function",
        name: "PUBLIC_KEY",
        inputs: [],
        outputs: [{name: "", type: "bytes", internalType: "bytes"}],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "addPrvBytes",
        inputs: [{name: "_myBytes", type: "sbytes", internalType: "sbytes"}],
        outputs: [{name: "added", type: "bool", internalType: "bool"}],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "addPubBytes",
        inputs: [{name: "_myBytes", type: "bytes", internalType: "bytes"}],
        outputs: [{name: "added", type: "bool", internalType: "bool"}],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "getAllPrvBytes",
        inputs: [],
        outputs: [{name: "", type: "bytes[]", internalType: "bytes[]"}],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "getAllPubBytes",
        inputs: [{name: "user", type: "address", internalType: "address"}],
        outputs: [{name: "", type: "bytes[]", internalType: "bytes[]"}],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "innerUserPubKeys",
        inputs: [{name: "", type: "address", internalType: "address"}],
        outputs: [{name: "", type: "bytes", internalType: "bytes"}],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "myPrvKey",
        inputs: [],
        outputs: [{name: "", type: "bytes32", internalType: "bytes32"}],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "owner",
        inputs: [],
        outputs: [{name: "", type: "address", internalType: "address"}],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "pubBytes",
        inputs: [
            {name: "", type: "address", internalType: "address"},
            {name: "", type: "uint256", internalType: "uint256"},
        ],
        outputs: [{name: "", type: "bytes", internalType: "bytes"}],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "readPrvBytes",
        inputs: [{name: "index", type: "uint256", internalType: "uint256"}],
        outputs: [{name: "_myBytes", type: "bytes", internalType: "bytes"}],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "setKey",
        inputs: [
            {name: "_prv", type: "sbytes32", internalType: "sbytes32"},
            {name: "_pub", type: "bytes", internalType: "bytes"},
        ],
        outputs: [{name: "set", type: "bool", internalType: "bool"}],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "storePrvKey",
        inputs: [{name: "_prvKey", type: "sbytes32", internalType: "sbytes32"}],
        outputs: [{name: "stored", type: "bool", internalType: "bool"}],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "storePubKey",
        inputs: [{name: "_pubKey", type: "bytes", internalType: "bytes"}],
        outputs: [{name: "initialized", type: "bool", internalType: "bool"}],
        stateMutability: "nonpayable",
    },
    {
        type: "event",
        name: "privateAdd",
        inputs: [
            {
                name: "nonce",
                type: "uint96",
                indexed: true,
                internalType: "uint96",
            },
            {
                name: "encryptedPayload",
                type: "bytes",
                indexed: false,
                internalType: "bytes",
            },
        ],
        anonymous: false,
    },
    {
        type: "event",
        name: "publicAdd",
        inputs: [
            {
                name: "user",
                type: "address",
                indexed: true,
                internalType: "address",
            },
            {
                name: "userBytes",
                type: "bytes",
                indexed: false,
                internalType: "bytes",
            },
        ],
        anonymous: false,
    },
    {
        type: "error",
        name: "OnlyOwner",
        inputs: [{name: "owner", type: "address", internalType: "address"}],
    },
] as const;

export const contract =
    "0x2c62873a3f359c4b1c7d52eb9b241401d1932360" as `0x${string}`;


export type customAccount = PrivateKeyAccount & {
    privateKey: `0x${string}`;
};

export const getAcc = (prv: `0x${string}`): customAccount => {
    let key = prv;
    let compressedPubKey: `0x${string}`;
    while (true) {
        if (key === "0x") {
            key = generatePrivateKey();
        }
        const account = privateKeyToAccount(key);

        const pubKeyBytes = secp256k1.getPublicKey(hexToBytes(key), false);
        compressedPubKey = bytesToHex(pubKeyBytes);

        if (compressedPubKey.startsWith("0x04")) {
            return Object.assign(account, {
                privateKey: key,
                publicKey: compressedPubKey
            }) as customAccount;
        }
        key = "0x";
    }
};

// export const seismicTestnet = defineChain({
//   id: 5124,
//   name: "Seismic Testnet",
//   nativeCurrency: { name: "Seismic", symbol: "SIZE", decimals: 18 },
//   rpcUrls: {
//     default: {
//       http: ["https://testnet-1.seismictest.net/rpc"],
//       webSocket: ["wss://testnet-1.seismictest.net/ws"],
//     },
//   },
// }) as Chain;

export const createSignitureClient = async (acc: customAccount) => {
    return await createShieldedWalletClient({
        chain: seismicTestnet,
        transport: fallback(
            seismicTestnet.rpcUrls.default.http.map((rpcUrl) => http(rpcUrl)),
            {
                rank: true,
                retryCount: 5,
                retryDelay: 1250,
            },
        ) as Transport,
        account: acc,
    });
};

export const createPubClient = async () => {
    return await createShieldedPublicClient({
        chain: seismicTestnet,
        transport: fallback(
            seismicTestnet.rpcUrls.default.http.map((rpcUrl) => http(rpcUrl)),
            {
                rank: true,
                retryCount: 5,
                retryDelay: 1250,
            },
        ) as Transport,
    });
};

export const createWsClient = async () => {
    return await createShieldedPublicClient({
        chain: seismicTestnet,
        transport: fallback(
            (seismicTestnet.rpcUrls.default.webSocket ?? []).map((rpcUrl) =>
                webSocket(rpcUrl, {keepAlive: true}),
            ),
            {
                retryCount: 5,
                retryDelay: 1250,
            },
        ) as Transport,
    });
};

export type sigClient = Awaited<ReturnType<typeof createSignitureClient>>;
export type pubClient = Awaited<ReturnType<typeof createPubClient>>;
export type socketClient = Awaited<ReturnType<typeof createWsClient>>;




//--------------------read functions------------------------//

export const innerPrvKey = async (acc: customAccount, client: sigClient) => {
    return await signedReadContract(client, {
        abi,
        address: contract,
        functionName: "myPrvKey",
        args: [],
    });
};

export const innerPubKey = async (acc: customAccount, client: pubClient) => {
    return await client.readContract({
        abi,
        address: contract,
        functionName: "innerUserPubKeys",
        args: [acc.address],
    });
};

export const getContractPubKey = async (client: pubClient) => {
    return await client.readContract({
        abi,
        address: contract,
        functionName: "PUBLIC_KEY",
        args: [],
    });
};

export const getPubBytes = async (
    acc: customAccount,
    client: pubClient,
    index: bigint,
) => {
    return await client.readContract({
        abi,
        address: contract,
        functionName: "pubBytes",
        args: [acc.address, index],
    });
};

export const getPrvBytes = async (
    acc: customAccount,
    client: sigClient,
    index: bigint,
) => {
    return await signedReadContract(client, {
        abi,
        address: contract,
        functionName: "readPrvBytes",
        args: [index],
    });
};

export const getAllPubBytes = async (acc: customAccount, client: pubClient) => {
    try{
        return await client.readContract({
            abi,
            address: contract,
            functionName: "getAllPubBytes",
            args: [acc.address],
        });
    } catch (error) {
        console.log(error);
    }
};

export const getAllPrvBytes = async (acc: customAccount, client: sigClient) => {
    return await signedReadContract(client, {
        abi,
        address: contract,
        functionName: "getAllPrvBytes",
        args: [],
    });
};

export const erc20Abi = [
    {
        type: "function",
        name: "balanceOf",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
    }
] as const;

export const SUSDC_ADDRESS = "0x790701048922e265105fd6a4467a2901c2201c43" as `0x${string}`;

export const checkUserBalances = async (
    acc: customAccount,
    publicClient: pubClient,
    signClient: sigClient
) => {
    try {
        // ۱. بررسی موجودی توکن بومی شبکه (SIZE)
        const sizeBalance = await publicClient.getBalance({
            address: acc.address,
        });

        let susdcBalance = 0n;

        // ۲. بررسی موجودی sUSDC فقط از طریق خوانش محافظت‌شده (Signed Read)
        try {
            susdcBalance = await signedReadContract(signClient, {
                abi: erc20Abi,
                address: SUSDC_ADDRESS,
                functionName: "balanceOf",
                args: [acc.address],
                account: acc, // این فیلد برای اثبات هویت در سایزمیک بسیار مهم است
            }) as bigint;
            console.log("sUSDC Balance Loaded:", susdcBalance);
        } catch (e) {
            // حالا اگر خطایی رخ دهد، دقیقاً در کنسول مرورگر می‌بینیم که چرا Signed Read شکست خورده است
            console.error("Signed Read for sUSDC Failed:", e);
        }

        return sizeBalance > 0n || susdcBalance > 0n;
    } catch (error) {
        console.error("Error checking balances:", error);
        return { size: 0n, susdc: 0n, hasGas: false };
    }
};

//---------------------write function-----------------------//

export const setContractKey = async (
    acc: customAccount,
    signClient: sigClient,
    publicClient: pubClient,
) => {
    try {
        let hash = await signClient.writeContract({
            abi,
            address: contract,
            functionName: "storePrvKey",
            args: [acc.privateKey],
        });
        let reciept = await publicClient.waitForTransactionReceipt({hash});
        console.log("private key stored in contract", reciept);

        const pubKeyBytes = secp256k1.getPublicKey(hexToBytes(acc.privateKey), true);
        const compressedPubKey = bytesToHex(pubKeyBytes);

        hash = await signClient.writeContract({
            abi,
            address: contract,
            functionName: "storePubKey",
            args: [compressedPubKey],
        });
        reciept = await publicClient.waitForTransactionReceipt({hash});
        console.log("public key stored in contract", reciept);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
};
// export type bytes = ReturnType<typeof stringToHex>;
export const addPubBytes = async (
    acc: customAccount,
    signClient: sigClient,
    publicClient: pubClient,
    myBytes: string,
) => {
    try {
        let hash = await signClient.writeContract({
            abi,
            address: contract,
            functionName: "addPubBytes",
            args: [stringToHex(myBytes)],
        });
        let reciept = await publicClient.waitForTransactionReceipt({hash});
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

export const addPrvBytes = async (
    acc: customAccount,
    signClient: sigClient,
    publicClient: pubClient,
    myBytes: string,
) => {
    try {
        let hash = await signClient.writeContract({
            abi,
            address: contract,
            functionName: "addPrvBytes",
            args: [stringToHex(myBytes)],
        });
        let reciept = await publicClient.waitForTransactionReceipt({hash});
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

//----------------log handling--------------------//

export const publicLogs = async (client: socketClient, acc: customAccount) => {
    return await client.getContractEvents({
        abi,
        address: contract,
        eventName: "publicAdd",
        args: {
            user: acc.address,
        },
        fromBlock: 0n,
        toBlock: "latest",
    });
};

export const watchPubLog = async (client: socketClient, acc: customAccount) => {
    const unwatch = await client.watchContractEvent({
        abi,
        address: contract,
        eventName: "publicAdd",
        args: {
            user: acc.address,
        },
        onLogs: (logs) => {
            console.log("new public log loaded . Detalis : ", logs);
        },
        onError: (err) => {
            console.log(err);
        },
    });
    return unwatch;
};

export const predictableNonce = (acc: customAccount, len: bigint) => {
    const pubKeyBytes = secp256k1.getPublicKey(hexToBytes(acc.privateKey), true);
    const compressedPubKey = bytesToHex(pubKeyBytes);
    const encodedData = encodeAbiParameters(
        parseAbiParameters("bytes32, bytes, uint256"),
        [acc.privateKey, compressedPubKey, len],
    );
    const hash = keccak256(encodedData);
    const maskX96 = (1n << 96n) - 1n;
    const nonce = BigInt(hash) & maskX96;
    return nonce;
};

export const privateLogs = async (
    wsClient: socketClient,
    publicClient: pubClient,
    acc: customAccount,
) => {
    try {
        const CONTRACT_PUBLIC_KEY = await getContractPubKey(publicClient);
        let logs = [];
        let counter = 1;

        const DEPLOYMENT_BLOCK = 41574593n;
        const latestBlock = await publicClient.getBlockNumber();
        const MAX_CHUNK = 99000n;

        while (true) {
            const nonce = predictableNonce(acc, BigInt(counter));
            console.log(nonce);
            let foundLog = null;

            for (let from = DEPLOYMENT_BLOCK; from <= latestBlock; from += MAX_CHUNK) {
                let to = from + MAX_CHUNK - 1n;
                if (to > latestBlock) {
                    to = latestBlock;
                }

                const chunkLogs = await wsClient.getContractEvents({
                    abi,
                    address: contract,
                    eventName: "privateAdd",
                    args: { nonce },
                    fromBlock: from,
                    toBlock: to,
                });

                if (chunkLogs.length > 0) {
                    foundLog = chunkLogs[0];
                    break;
                }
            }

            if (!foundLog) {
                break;
            } else {
                console.log(foundLog);
                logs.push(foundLog);
            }

            counter++;
        }

        if (logs.length === 0) {
            return [];
        }

        let userData = [];

        const ENCRYPTED_KEY = secp256k1.getSharedSecret(
            hexToBytes(acc.privateKey),
            hexToBytes(CONTRACT_PUBLIC_KEY),
        ).slice(1, 33);

        for (let log of logs) {
            if (!log || log.args.nonce === undefined || !log.args.encryptedPayload)
                continue;

            const nonce = pad(toHex(log.args.nonce), { size: 12 });
            const encPayload = hexToBytes(log.args.encryptedPayload);

            try {
                const decryptedPayload = gcm(ENCRYPTED_KEY, hexToBytes(nonce)).decrypt(encPayload);
                console.log(decryptedPayload);

                const decoded = decodeAbiParameters(
                    [
                        { name: "sender", type: "address" },
                        { name: "data", type: "bytes" },
                    ],
                    bytesToHex(decryptedPayload),
                );
                userData.push(decoded[1] as `0x${string}`);
                console.log(decoded[1]);
            } catch (err) {
                console.warn(`Skipping broken message with nonce: ${log.args.nonce}`);
                continue;
            }
        }
        return userData;

    } catch (error) {
        console.log("Error in privateLogs:", error);
        return [];
    }
};

// export type SeismicClient = Awaited<ReturnType<typeof createClient>>;

// return instance as unknown as GetContractReturnType<typeof abi, PublicClient & WalletClient>;
