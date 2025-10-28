import { ethers } from 'ethers';
import { formatErrFn } from '../utils/utils'
class Contract {
  address: string;
  provider: any;
  contractInstance: ethers.Contract;

  /**
   * @param chainName The name of the chain, used to identify and differentiate between different chains.
   * @param provider The provider object for the blockchain, used to establish and manage the connection with the blockchain.
   */
  constructor(provider: any, address: string, abiJson: any) {
    if (!provider || !address || !abiJson) {
      throw new Error('provider, address, and abiJson are required');
    }
    this.address = address;
    this.provider = provider;
    // let formatProvider;
    // if (provider instanceof ethers.providers.JsonRpcProvider) {
    //     // console.log('provider is JsonRpcProvider')
    //     formatProvider = provider;
    // } else {
    //     // console.log('provider is Web3Provider')
    //   const web3Provider = new ethers.providers.Web3Provider(provider)
    //   formatProvider = web3Provider.getSigner();
    // }
    this.contractInstance = new ethers.Contract(this.address, abiJson, this.provider);
  }
  // Example method to read from the contract
  async callMethod(functionName: string, functionParams: any[]) {
    return new Promise(async (resolve, reject) => {
      if (!this.contractInstance[functionName]) {
        return reject(`Method ${functionName} does not exist on the contract`)
      }
      try {
        const result = await this.contractInstance[functionName](...functionParams);
        return resolve(result);
      } catch (error) {
        return reject(error);
      }
    });
  }
  // Example method to send a transaction
  async sendTransaction(functionName: string, functionParams: any[]) {
    return new Promise(async (resolve, reject) => {
      if (!this.contractInstance[functionName]) {
        return reject(`Method ${functionName} does not exist on the contract`)
      }
      try {
        console.log('sendTransaction params:', functionName, ...functionParams)
        const tx = await this.contractInstance[functionName](...functionParams);
        // console.time('txreceiptTimeInSdk');
        // const txreceipt = await tx.wait();
        // console.timeEnd('txreceiptTimeInSdk');
        // console.log("txreceipt", txreceipt);
        resolve(tx.hash);
      } catch (error: any) {
        // not expired
        console.log("sendTransaction error:", error);
        const formatErr = formatErrFn(error);
        return reject(formatErr)
      }


    });
  }
}

export default Contract;