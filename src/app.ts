import './contract-interaction.ts';
import { hexToString, zeroHash} from "viem";
import {
    addPrvBytes, addPubBytes, checkUserBalances, createPubClient,
    createSignitureClient,
    createWsClient,
    type customAccount,
    getAcc, getAllPrvBytes, getAllPubBytes, innerPrvKey, innerPubKey, setContractKey
} from "./contract-interaction.ts";

let account: customAccount;
const wsClient = await createWsClient();
const publicClient = await createPubClient();
let signClient;


const cos = getAcc('0x');
console.log(cos.publicKey,cos.privateKey);


type LogType = 'success' | 'error' | 'info';

export const showLog = (message: string, type: LogType = 'info') => {
    const logContainer = document.getElementById('log-messages');
    if (!logContainer) return;

    const logEl = document.createElement('div');
    logEl.classList.add('log-message', type);
    logEl.innerText = message;

    logContainer.appendChild(logEl);

    setTimeout(() => {
        logEl.remove();
    }, 5000);
};

setTimeout(() => {
    showLog('welcome!', 'success');
}, 500);


let profileLoaded = false;
const connectWalletBtn = document.querySelector<HTMLElement>('#connectWallet');
const profileBox = document.querySelector<HTMLElement>('#profile');

const profilePopUp = () => {
    // if (account) return;
    profileBox.style.display = 'flex';
    profileLoaded = true;

};
const profileVanish = (event: MouseEvent) => {
    const target = event.target as Node;
    if (profileBox && !profileBox.contains(target) && !connectWalletBtn?.contains(target)) {
        profileBox.style.display = 'none';
        profileLoaded = false;
    }

};
connectWalletBtn.addEventListener('click', profilePopUp);

const genBtn = document.querySelector<HTMLElement>('#prv-gen-field');
const privateKeyField = document.querySelector<HTMLInputElement>('#prv-key-field label input');
const prvGenerate = () => {
    const key: customAccount = getAcc('0x')
    privateKeyField.value = key.privateKey;
}
genBtn.addEventListener('click', prvGenerate);
const walletContainer = document.querySelector<HTMLElement>('.wallet-menu-container');
const lblAddress = document.querySelector<HTMLElement>('#lbl-address');
const lblPub = document.querySelector<HTMLElement>('#lbl-pub');
const lblPrv = document.querySelector<HTMLElement>('#lbl-prv');
const disconnectBtn = document.querySelector<HTMLButtonElement>('#disconnectBtn');
const importBtn = document.querySelector<HTMLElement>('#prv-key-field label button');
const importWallet = async () => {
    if (!privateKeyField || !connectWalletBtn) return;

    const rawValue = privateKeyField.value.trim();
    const regex = /^(0x)?[0-9a-fA-F]{64}$/;

    if (!regex.test(rawValue)) {
        showLog('wrong private key 🛑', 'error');
        return;
    }

    try {
        showLog('Importing wallet...', 'info');

        const key = (rawValue.startsWith('0x') ? rawValue : `0x${rawValue}`) as `0x${string}`;

        account = getAcc(key);
        signClient = await createSignitureClient(account);

        connectWalletBtn.innerHTML = `${account.address.slice(0, 4)}..${account.address.slice(-4)}`;

        if (lblAddress) lblAddress.innerText = `${account.address.slice(0, 6)}...${account.address.slice(-4)}`;
        if (lblPub) lblPub.innerText = `${account.publicKey.slice(0, 6)}...${account.publicKey.slice(-4)}`;
        if (lblPrv) lblPrv.innerText = `${account.privateKey.slice(0, 6)}...${account.privateKey.slice(-4)}`;

        walletContainer?.classList.add('connected');
        if (profileBox) {
            profileBox.style.display = 'none';
            profileLoaded = false;
        }

        showLog('wallet imported successfully. \n good luck with Seismic journey 🤞', 'success');

    } catch (error) {
        console.error('Import wallet error:', error);
        showLog('Failed to connect wallet 🛑', 'error');
    }
};
importBtn.addEventListener('click', importWallet);
document.querySelectorAll('.copy-icon').forEach((icon) => {
    icon.addEventListener('click', (e) => {
        const type = (e.currentTarget as HTMLElement).getAttribute('data-clipboard');
        let textToCopy = '';

        if (type === 'address') textToCopy = account.address;
        if (type === 'pub') textToCopy = account.publicKey;
        if (type === 'prv') textToCopy = account.privateKey;

        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy);
            showLog('Copied to clipboard! 📋', 'success');
        }
    });
});

disconnectBtn?.addEventListener('click', () => {
    account = undefined as any;
    signClient = undefined;
    connectWalletBtn.innerHTML = 'Connect Wallet';
    walletContainer?.classList.remove('connected');
    if (privateKeyField) privateKeyField.value = '';

    showLog('Wallet disconnected 🔌', 'info');
});




const submitBtn = document.querySelector<HTMLElement>('#submitButton');
const stringField = document.querySelector<HTMLInputElement>('#inputField');
const toggleSwitch = document.querySelector<HTMLInputElement>('#myToggle');
const submit = async () => {
    if (!account || !signClient) {
        showLog('please import wallet ', 'info');
        return;
    }
    const isPrivate: boolean = toggleSwitch?.checked ?? false;
    const usrString: string = stringField?.value.trim() ?? '';

    if (!usrString) {
        showLog('invalid phrase 🛑', 'error');
        return;
    }
    const hasGas = await checkUserBalances(account,publicClient,signClient);
    if (!hasGas) {
        showLog('insufficient gas \n please fund your wallet from faucet',"error");
        return;
    }
    showLog('submitting . . .', "info");
    if (isPrivate) {
        //checking if keys has been set or not
        showLog('processing your request', "info");
        let contractPubKey;
        let contractPrvKey;
        try {
            contractPubKey = await innerPubKey(account, publicClient);
            contractPrvKey = await innerPrvKey(account, signClient);
        } catch (err) {
            console.log(err);
            showLog('unknown error occurred \n check console for more info', "error");
        }
        const isPubKeySet = contractPubKey && contractPubKey !== '0x' && contractPubKey.length > 2;
        const isPrvKeySet = contractPrvKey && contractPrvKey !== zeroHash && contractPrvKey !== '0x';
        if (!isPrvKeySet || !isPubKeySet) {
            showLog('setting contract internal keys ', "info");
            try {
                const success = await setContractKey(account, signClient, publicClient);
                if (success) {
                    showLog('keys set successfully', "success");

                } else {
                    showLog('unknown error occurred \n check console for more info', "error");
                }
            } catch (error) {
                showLog('unknown error occurred \n check console for more info', 'error');
                console.log(error);
            }
        }

        showLog('storing the phrase . . .', "info");
        const success = await addPrvBytes(account, signClient, publicClient, usrString);
        if (success) {
            showLog('successfully stored on Seismic\n GMIC',"success");
        } else {
            showLog('unknown error occurred \n check console for more info', 'error');
        }
    }
    else {
        try{
            showLog('storing the phrase . . .', "info");
            const success = await addPubBytes(account,signClient,publicClient,usrString);
            if (success) {
                showLog('successfully stored on Seismic \n GMIC',"success");
            } else {
                showLog('unknown error occurred \n check console for more info', 'error');
            }
        }catch(error) {
            console.log(error);
            showLog('error occurred \n check console for more info', 'error');
        }
    }
}
submitBtn.addEventListener('click', submit);

const pubPortfo = document.querySelector<HTMLElement>('#pub-portfo');
const prvPortfo = document.querySelector<HTMLElement>('#prv-portfo');
const getPortfo = async () =>{
    showLog('loading your phrases . . .',"info");
    pubPortfo.innerHTML = '';
    prvPortfo.innerHTML = '';
    if (!account || !pubPortfo || !prvPortfo) return;
    let pubPhrasesHex;
    let prvPhrasesHex;

    try {
        pubPhrasesHex = (await getAllPubBytes(account, publicClient)) || [];
        prvPhrasesHex = (await getAllPrvBytes(account,signClient)) || [];
    }catch (error) {
        console.log(error);
        showLog('error check console for more info', 'error');
    }
    let pubCounter = 1;
    for(const i of pubPhrasesHex) {
        const phrase = hexToString(i);
        pubPortfo.insertAdjacentHTML('beforeend', `
    <div class="pub-message"><p class="message-topic">message ${pubCounter}</p><button class="view-btn message${pubCounter}" data-message="${phrase}">view</button></div>
    `);
        pubCounter++;
    }
    let prvCounter = 1;
    for(const i of prvPhrasesHex) {
        const phrase = hexToString(i);
        prvPortfo.insertAdjacentHTML('beforeend', `
            <div class="prv-message"><p class="message-topic">message ${prvCounter}</p><button class="view-btn message${prvCounter}" data-message="${phrase}">view</button></div>

        `);
        prvCounter++;
    }
    showLog('phrases loaded successfully', "success");
};


let portfoLoaded;
const portfoBtn = document.querySelector<HTMLElement>('#portfo-btn button');
const portfo = document.querySelector<HTMLElement>('#portfo');
let userIsReading = false;

const popPortfo = async () =>{
    if(!account){
        showLog('please import wallet ', 'info');
        return;
    }

    portfo.style.display = 'grid';
    portfoLoaded=true;
    await getPortfo();
};

portfoBtn.addEventListener('click', popPortfo);

const viewBox = document.querySelector<HTMLElement>('#view-box');
const viewMessageText = document.querySelector<HTMLElement>('#view-message-text');
const doneReadingBtn = document.querySelector<HTMLButtonElement>('#doneReadingBtn');

portfo?.addEventListener('click', (event: MouseEvent) => {
    userIsReading=true;
    const target = (event.target as HTMLElement).closest('.view-btn') as HTMLElement | null;

    if (target) {
        const message = target.getAttribute('data-message') || 'No message content';

        if (viewMessageText && viewBox) {
            viewMessageText.innerText = message;
            viewBox.style.display = 'flex';
        }
    }
});

const vanishPortfo = (event) =>{
    const target = event.target as Node;
    if(portfo && !portfo.contains(target) && !portfoBtn?.contains(target) && !viewBox?.contains(target) && !userIsReading) {
        portfo.style.display = 'none';
        portfoLoaded=false;
    }
};

doneReadingBtn?.addEventListener('click', (event:MouseEvent) => {
    if (viewBox) {
        userIsReading = false;
        event.stopPropagation()
        viewBox.style.display = 'none';
        console.log(event.target.id);
    }
});




document.addEventListener('click', (event: MouseEvent) => {
    if (profileLoaded) profileVanish(event);
    if (portfoLoaded) vanishPortfo(event);
});

