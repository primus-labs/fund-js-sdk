import { ethers } from 'ethers';

class Contract {
  contractAddress: string;
  wallet: ethers.Wallet;
  contractInstance: ethers.Contract;

  /**
   * @param chainName The name of the chain, used to identify and differentiate between different chains.
   * @param provider The provider object for the blockchain, used to establish and manage the connection with the blockchain.
   */
  constructor(wallet: ethers.Wallet, address: string, abiJson: any) {
    this.contractAddress = address;
    this.wallet = wallet;
    this._initContractInstance(abiJson);
    return this.contractInstance;
  }

  _initContractInstance(abiJson: any): void {
    // let providerT = new ethers.providers.Web3Provider(this.wallet);
    // let signer = providerT.getSigner();
    this.contractInstance = new ethers.Contract(this.contractAddress, abiJson, this.wallet);
  }

  async call(funcaionName: string, functionParams: any[]) {
    try {
      const tx = await this.contractInstance[funcaionName](
        ...functionParams
      );
      console.log("tx", tx);
    } catch (e) {
      console.log("e:", e);
      let errorStatus = 100;
      try {
        const tx = await this.contractInstance.callStatic[funcaionName](
          ...functionParams
        );
      } catch (error:any) {
        console.log("eas bulkAttest caught error:\n", error);
        const { errorName } = error;
        console.log(errorName);
      }
    }
  }
}

export default Contract;