import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory, ECPairAPI, TinySecp256k1Interface } from "ecpair";
import { ethers } from 'ethers';

import * as tinysecp from 'tiny-secp256k1';
// const curve = require('tiny-secp256k1')
const ECPair: ECPairAPI = ECPairFactory(tinysecp);
const network = bitcoin.networks.testnet;


export interface BlockchainClient {
    getUtxos(scriptPubKey: string): Promise<Array<{
        txid: string;
        vout: number;
        value: number;
    }>>;
    broadcastTx(txHex: string): Promise<string>;
}

class BitcoinTransactionBuilder {
    private network: bitcoin.Network;
    private blockchainClient: BlockchainClient;

    private pubC: Buffer | undefined;

    private privA?: Buffer;
    private privB?: Buffer;

    private destinationAddress?: string;
    private relativeLocktime?: number;

    constructor(network: bitcoin.Network, blockchainClient: BlockchainClient) {
        this.network = network;
        this.blockchainClient = blockchainClient;
    }



    setPubC(pubC: Buffer): this {
        // console.log("pubC \n", pubC)

        this.pubC = pubC;
        return this;
    }

    setPrivA(privA: Buffer): this {
        this.privA = privA;
        return this;
    }

    setPrivB(privB: Buffer): this {
        this.privB = privB;
        return this;
    }

    setDestination(address: string): this {
        this.destinationAddress = address;
        return this;
    }

    setRelativeLocktime(locktime: number): this {
        this.relativeLocktime = locktime;
        return this;
    }

    private combinePubKeys(): Buffer {
        if (!this.privA || !this.privB) {
            throw new Error('Private keys must be set');
        }

        const keyPairA = ECPair.fromPrivateKey(this.privA);
        const keyPairB = ECPair.fromPrivateKey(this.privB);

        // console.log("pub a \n", keyPairA.publicKey.length, "pub b \n", keyPairB.publicKey.length)

        let combinedPubKey = ethers.SigningKey.addPoints(keyPairA.publicKey, keyPairB.publicKey, false);

        const kp_compressed = ECPair.fromPublicKey(Buffer.from(combinedPubKey.slice(2), 'hex'), { compressed: true });

        let combinedPubKey_compressed = ethers.SigningKey.addPoints(keyPairA.publicKey, keyPairB.publicKey, true);



        // console.log("combinedPubKey \n", combinedPubKey, Buffer.from(combinedPubKey.slice(2), 'hex').length, kp_compressed.publicKey)
        return kp_compressed.publicKey;
    }

    private generateScript(): Buffer<ArrayBufferLike> {
        const pubAB = this.combinePubKeys();
        const pubC = this.pubC!;

        // console.log("pubAB \n", pubAB, pubAB.toString("hex"), "pubC \n", pubC)

        const script = bitcoin.script.fromASM(
            `
        OP_IF
            ${pubAB.toString("hex")}
        OP_ELSE
            ${bitcoin.script.number.encode(72).toString("hex")}
            OP_CHECKSEQUENCEVERIFY
            OP_DROP
            ${pubC.toString("hex")}
        OP_ENDIF
        OP_CHECKSIG
    `
                .trim()
                .replace(/\s+/g, " ")
        )

        // console.log("script", script.reduce((a, b) => a + b.toString(16), ""))
        return script;
    }

    getscriptAddress(): [Buffer<ArrayBufferLike>, string] {
        const script = this.generateScript();
        const p2wsh = bitcoin.payments.p2wsh({ redeem: { output: script }, network: this.network });
        const scriptPubKey = p2wsh.output!;
        const address = p2wsh.address!;
        return [scriptPubKey, address];
    }

    async buildAndSendTx(): Promise<string> {
        if (!this.destinationAddress) {
            throw new Error('Destination address must be set');
        }
        if (!this.privA || !this.privB) {
            throw new Error('Private keys must be set');
        }

        const script = this.generateScript();
        const p2wsh = bitcoin.payments.p2wsh({ redeem: { output: script }, network: this.network });
        const scriptPubKey = p2wsh.output;
        const address = p2wsh.address;

        if (scriptPubKey == undefined) {
            throw new Error('Failed to generate script');
        }

        const utxos = await this.blockchainClient.getUtxos(address!);

        console.log("utxos \n", utxos)

        const tx = new bitcoin.Transaction();
        tx.version = 2;

        utxos.forEach(utxo => {
            tx.addInput(Buffer.from(utxo.txid, 'hex').reverse(), utxo.vout);
        })

        tx.addOutput(bitcoin.address.toOutputScript(this.destinationAddress, network), utxos.reduce((sum, utxo) => sum + utxo.value, 0) - 2000);

        const hashType = bitcoin.Transaction.SIGHASH_ALL;

        const keyPairA = ECPair.fromPrivateKey(this.privA);
        const keyPairB = ECPair.fromPrivateKey(this.privB);

        // Combine private keys using tiny-secp256k1
        const combinedPrivKey = tinysecp.privateAdd(keyPairA.privateKey!, keyPairB.privateKey!);
        if (!combinedPrivKey) {
            throw new Error('Failed to combine private keys');
        }

        const signingKeyPair = ECPair.fromPrivateKey(Buffer.from(combinedPrivKey));


        utxos.forEach((utxo, index) => {
            const signatureHash = tx.hashForWitnessV0(index, script, utxo.value, hashType);

            const redeemScriptSig = bitcoin.payments.p2wsh({
                redeem: {
                    input: bitcoin.script.compile([
                        bitcoin.script.signature.encode(signingKeyPair.sign(signatureHash), hashType),
                        bitcoin.opcodes.OP_TRUE,
                    ]),
                    output: script,
                },
            });

            tx.setWitness(index, redeemScriptSig.witness!);

        })

        const txHex = tx.toHex();

        console.log("txHex \n", txHex)



        // const psbt = new bitcoin.Psbt({ network: this.network });

        //     // Prepare inputs with full witness script
        //     utxos.forEach(utxo => {
        //         psbt.addInput({
        //           hash: utxo.txid,
        //           index: utxo.vout,
        //           witnessUtxo: {
        //             script: scriptPubKey,
        //             value: utxo.value
        //           },
        //           witnessScript: script,
        //           redeemScript: script, 
        //         });
        //       });


        // const destinationOutput = bitcoin.address.toOutputScript(this.destinationAddress, this.network);
        // const totalInput = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
        // const fee = 1000; 

        // psbt.addOutput({
        //   script: destinationOutput,
        //   value: totalInput - fee
        // });


        //     // Prepare witness stack for signing
        //     psbt.signAllInputs(signingKeyPair);


        // psbt.finalizeAllInputs();

        // const txHex = psbt.extractTransaction().toHex();
        const txhash = await this.blockchainClient.broadcastTx(txHex);
        console.log("txhash \n", txhash)
        return "this.blockchainClient.broadcastTx(txHex);"
    }
}


export { BitcoinTransactionBuilder };