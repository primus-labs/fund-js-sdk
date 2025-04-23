import Contract from './Contract';
import abi from '../config/erc721Abi.json';

class Erc721Contract {
  contractInstance: any;

  constructor(provider: any, address: string) {
    if (!provider || !address ) {
        throw new Error('provider, address are required');
    }
    this.contractInstance = new Contract(provider, address, abi);
  }

  async approve(address: string, tokenId: bigint) {
    return new Promise(async (resolve, reject) => {
      try {
        // const approver = await this.contractInstance.getApproved(tokenId);
        const approver = await this.contractInstance.callMethod('getApproved', [tokenId]);
        if (approver === address) {
          console.log(`Already approved:: ${approver}`);
          resolve('Approved');
        } else {
          await this.contractInstance.sendTransaction('approve', [address, tokenId])
          console.log(`Approved`);
          resolve('Approved');
        }
      } catch (error: any) {
        console.error('Approval failed:', error);
        return reject(error);
      }
    })
  }

  // ownerAddress: string, 
  async setApprovalForAll(operatorAddress: string) {
    return new Promise(async (resolve, reject) => {
      try {
        // TODO
        // const approver = await this.contractInstance.getApproved(tokenId);
        // const isApproved = await this.contractInstance.callMethod('isApprovedForAll', [ownerAddress, operatorAddress]);
        // if (isApproved) {
        //   console.log(`Already approved`);
        //   resolve('Approved');
        // } else {
        await this.contractInstance.sendTransaction('setApprovalForAll', [operatorAddress, true])
        
        console.log(`Approved`);
        resolve('Approved');
        // }
      } catch (error: any) {
        console.error('Approval failed:', error);
        return reject(error);
      }
    })
  }

  async fetchMetaData(nftContractAddress: string, tokenId: number) {
    return new Promise(async (resolve, reject) => {
      try {
        let url = await this.contractInstance.callMethod('tokenURI',[tokenId]);
        if (url.startsWith("ipfs://")) {
          url = url.replace("ipfs://", "https://ipfs.io/ipfs/");
        }
        const res = await fetch(url);
        if (!res.ok) { 
          return reject(`Failed to fetch metadata from ${url}`);
        }
        let metadata = await res.json();
        if (metadata.image && metadata.image.startsWith("ipfs://")) {
          metadata.image = metadata.image.replace(
            "ipfs://",
            "https://ipfs.io/ipfs/"
          );
        }
        metadata.address = nftContractAddress;
        metadata.tokenId = tokenId;
        // {
        //   "name": "CryptoKitty #123",
        //   "description": "A cute digital cat.",
        //   "image": "ipfs://Qm.../cat.png",
        //   "attributes": [
        //     { "trait_type": "Color", "value": "Orange" },
        //     { "trait_type": "Mood", "value": "Sleepy" }
        //   ]
        // }
        return resolve(metadata);
      } catch (error: any) {
        return reject(error);
      }
    })
  }
}

export default Erc721Contract;