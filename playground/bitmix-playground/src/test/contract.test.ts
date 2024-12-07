import { testnet } from "bitcoinjs-lib/src/networks.js";
import { BitcoinTransactionBuilder } from "../BitMix/builder.js";
import BlockstreamBitcoinClient from "../BitMix/client.js";

import * as bitcoin from 'bitcoinjs-lib';
// import ECPairFactory, { ECPairAPI, TinySecp256k1Interface } from "ecpair";
import { ECPairFactory, ECPairAPI, TinySecp256k1Interface } from 'ecpair';
import * as ecc from 'tiny-secp256k1';



import * as tinysecp from 'tiny-secp256k1';
const ECPair: ECPairAPI = ECPairFactory(tinysecp);

import * as readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Promisify readline question to work with async/await
function askQuestion(query: string): Promise<string> {
    return new Promise(resolve => {
        rl.question(query, resolve);
    });
}


async function exampleUsage() {
    const bc_client = new BlockstreamBitcoinClient();

    let builder = new BitcoinTransactionBuilder(testnet, bc_client);

    const ec_pair_a = ECPair.fromWIF("cUmX4Lj35Xf4EcerDj9tU9dXt11jfUQ6ARuzd578tmvwtCEAXgBc", testnet);
    const ec_pair_b = ECPair.fromWIF("cR9UtFRd6JVdhWMnR7P1j7NPmngwxyGwvdag6NseBmTNDBmAc9v1", testnet);
    const ec_pair_c = ECPair.fromWIF("cNMY1B7Pwz1M4uA2U84PCASLcXBrrxoW4jpvKyPxFTyHwywTKzqY", testnet);

    try {
        builder = await builder
            .setPubC(ec_pair_c.publicKey)
            .setPrivA(ec_pair_a.privateKey!)
            .setPrivB(ec_pair_b.privateKey!)

        const [scriptpubkey, scriptaddress] = builder.getscriptAddress();
        console.log("script adress: fund me bro", scriptaddress)

        // Wait for user confirmation before proceeding
        await new Promise<void>((resolve) => {
            rl.question(`Please fund the script address ${scriptaddress} and press Enter when done: `, () => {
                resolve();
            });
        });



        const txid = builder
            .setDestination('tb1qltptfs70ehd463ysl4znrez430kurl0gfzmg2w')
            .setRelativeLocktime(72)
            .buildAndSendTx();

        console.log('Transaction broadcast with TXID:', txid);
    } catch (error) {
        console.error('Transaction failed:', error);
    }
}

exampleUsage().then(() => {
    console.log('Example usage completed successfully.');
}).catch((error) => {
    console.error('Example usage failed:', error);
});
