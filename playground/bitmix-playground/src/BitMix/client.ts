import axios, { AxiosInstance } from 'axios';
import { BlockchainClient } from './builder.js';

export class BlockstreamBitcoinClient implements BlockchainClient {
    private axiosInstance: AxiosInstance;
    private network = 'testnet';


  constructor() {
    this.axiosInstance = axios.create({
      baseURL: this.getBaseUrl(),
    //   timeout: 10000, // 10 seconds
      headers: {
        'Accept': 'application/json'
      }
    });
  }

  private getBaseUrl(): string {
    return 'https://mempool.space/testnet4/api';
  }

  async getUtxos(address: string): Promise<Array<{
    txid: string;
    vout: number;
    value: number;
  }>> {
    try {

      const response = await this.axiosInstance.get(`/address/${address}/utxo`);

      return response.data.map((utxo: any) => ({
        txid: utxo.txid,
        vout: utxo.vout,
        value: utxo.value
      }));
    } catch (error) {
      this.handleError(error, 'Error fetching UTXOs');
      throw error;
    }
  }

  async broadcastTx(txHex: string): Promise<string> {
    try {
      const response = await this.axiosInstance.post('/tx', txHex, {
        headers: {
          'Content-Type': 'text/plain'
        }
      });

      return response.data;
    } catch (error) {
      this.handleError(error, 'Error broadcasting transaction');
      throw error;
    }
  }

  private scriptPubKeyToAddress(scriptPubKey: string): string {
    try {
      
      throw new Error('Script pubkey to address conversion not implemented');
    } catch (error) {
      this.handleError(error, 'Error converting script pubkey to address');
      throw error;
    }
  }

  // Error handling method
  private handleError(error: any, context: string): void {
    if (axios.isAxiosError(error)) {
      // Axios-specific error handling
      console.error(`${context}:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    } else {
      // Generic error handling
      console.error(`${context}:`, error);
    }
  }

  // Additional utility methods can be added here

  // Example: Fee estimation method
  async estimateFee(blocksUntilConfirmation: number = 6): Promise<number> {
    try {
      const response = await this.axiosInstance.get('/fee-estimates');
      // Return fee in satoshis/byte for the specified number of blocks
      return response.data[blocksUntilConfirmation];
    } catch (error) {
      this.handleError(error, 'Error estimating fee');
      throw error;
    }
  }

  // Example: Get transaction details
  async getTransactionDetails(txid: string): Promise<any> {
    try {
      const response = await this.axiosInstance.get(`/tx/${txid}`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Error fetching transaction details');
      throw error;
    }
  }
}


export default BlockstreamBitcoinClient;