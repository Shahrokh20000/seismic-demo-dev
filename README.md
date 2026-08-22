# 🛡️ Seismic Privacy Playground

> The first open-source public dApp on the Seismic network. An interactive sandbox for exploring shielded state, on-chain encryption, and client-side interactions.

## 📖 About The Project

While architecting a Concentrated Liquidity Market Maker (CLMM) for the Seismic ecosystem, I needed to dive deep into `seismic-viem` to master shielded transactions and state encryption. During my research, I noticed a lack of live public applications on the network to test these concepts.

I built the **Seismic Privacy Playground** to bridge this gap. For fellow developers, this repository serves as a practical, hands-on reference to understand how to seamlessly integrate and build with Seismic. For everyday Web3 explorers, it provides a fun, interactive sandbox to test the network, use the faucet, and experience public versus private on-chain messaging firsthand.

## ✨ Features

* **🔐 Dual-State Routing:** Seamlessly toggle between submitting public data or fully shielded on-chain messages.
* **🕵️‍♂️ Encrypted State Decryption:** On-the-fly client-side decryption of private transaction logs using `seismic-viem`.
* **🔑 Keypair Management:** Automatic validation and initialization of internal contract keys.
* **📊 Interactive Portfolio:** A dedicated, glassmorphism-styled UI to view and read your public and encrypted payload history.

## 🛠️ Tech Stack

* **Frontend:** HTML, CSS, TypeScript, Vite
* **Web3 Integration:** [Viem](https://viem.sh/), `seismic-viem`
* **Network:** Seismic Testnet

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Make sure you have Node.js and npm installed on your machine.

### Installation

1. Clone the repository:
    `git clone https://github.com/Shahrokh20000/seismic-viem-dev.git`

2. Navigate to the project directory:
    `cd seismic-viem-dev/dist`

3. Install NPM packages:
    `npm install`

4. Start the development server:
    `npm run dev`

## 💧 Faucet & Testing

To interact with the dApp and submit messages, you will need some testnet tokens to cover gas fees. You can grab them from the official [Seismic Faucet](https://faucet.seismictest.net/).

## 🤝 Contributing

Contributions, issues, and feature requests are always welcome! Feel free to check the issues page if you want to contribute.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
