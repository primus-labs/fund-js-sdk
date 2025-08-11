import { PrimusZKTLS } from "@primuslabs/zktls-js-sdk";
// import { PrimusZKTLS } from "@superorange/zka-js-sdk";
import { DATASOURCETEMPLATESMAP } from "../config/constants";
import { Attestation, AttestCommonParams, AttestParams } from '../index.d'

class ZktlsSdk {
  private zkTlsSdk!: PrimusZKTLS;
  constructor() {
  }

  getZkTlsSdk(): PrimusZKTLS {
    return this.zkTlsSdk;
  }

  async init(appId: string) {
    return new Promise(async (resolve, reject) => {
      try {
        this.zkTlsSdk = new PrimusZKTLS();
        let platformDevice = "pc";
        const isIpad = () => {
          const userAgent = navigator.userAgent.toLowerCase();
          const isTabletSize = window.innerWidth > 768 && window.innerWidth < 1366;

          return (
            /ipad/.test(userAgent) ||
            (navigator.platform === 'MacIntel' &&
              navigator.maxTouchPoints > 0 &&
              isTabletSize)
          );
        };
        if (navigator.userAgent.toLocaleLowerCase().includes("android")) {
          platformDevice = "android";
        } else if (navigator.userAgent.toLocaleLowerCase().includes("iphone") || isIpad()) {
          platformDevice = "ios";
        }
        console.log('init appId', appId, platformDevice)

        const extensionVersion = await this.zkTlsSdk.init(
          appId, '', { platform: platformDevice }
        );
        resolve(extensionVersion);
      } catch (error) {
        return reject(error);
      }
    });
  }

  async attest(attestParams: AttestParams, signFn: (signParams: string) => Promise<string>, backUrl?: string): Promise<Attestation | undefined> {
    return new Promise(async (resolve, reject) => {
      // if (!this.zkTlsSdk?.padoExtensionVersion) {
      //     return reject(`Uninitialized!`)
      // } // TODO
      console.log('this.zkTlsSdk', this.zkTlsSdk)
      const { socialPlatform, userIdentifier, address } = attestParams

      const { id: templateId, field } = DATASOURCETEMPLATESMAP[socialPlatform]
      const attRequest = this.zkTlsSdk.generateRequestParams(
        templateId,
        address
      );
      if (backUrl) {
        attRequest.setBackUrl(backUrl)
      }
      console.log(`attRequest: ${JSON.stringify(attRequest)}`)
      attRequest.setAttConditions([
        [
          {
            field,
            op: 'STREQ',
            value: userIdentifier,
          },
        ],
      ]);

      const signParams = attRequest.toJsonString();
      const signature = await signFn(signParams);
      if (!signature) {
        return reject(`appSignature is empty!`)
      }
      try {
        const formatAttestParams = {
          attRequest: {
            ...JSON.parse(signParams),
          },
          appSignature: signature,
        };
        const attestation = await this.zkTlsSdk.startAttestation(
          JSON.stringify(formatAttestParams)
        );
        // console.log("attestation", attestation);
        return resolve(attestation)
      } catch (error: any) {
        // console.error('attest error:',error);
        return reject(error);
      }
    });
  }
  async attestCommon(attestParams: AttestCommonParams): Promise<Attestation | undefined> {
    const { templateId, address, signFn, conditions, additionParams, backUrl } = attestParams
    return new Promise(async (resolve, reject) => {
      // if (!this.zkTlsSdk?.padoExtensionVersion) {
      //     return reject(`Uninitialized!`)
      // } // TODO
      console.log('this.zkTlsSdk', this.zkTlsSdk)
      const attRequest = this.zkTlsSdk.generateRequestParams(
        templateId,
        address
      );
      if (backUrl) {
        attRequest.setBackUrl(backUrl)
      }
      console.log(`attRequest: ${JSON.stringify(attRequest)}`)
      if (conditions) {
        attRequest.setAttConditions(conditions);
      }
      if (additionParams) {
        console.log('setAdditionParams--',additionParams)
        attRequest.setAdditionParams(additionParams);
      }
      const signParams = attRequest.toJsonString();
      const signature = await signFn(signParams);
      if (!signature) {
        return reject(`appSignature is empty!`)
      }
      try {
        const formatAttestParams = {
          attRequest: {
            ...JSON.parse(signParams),
          },
          appSignature: signature,
        };
        const attestation = await this.zkTlsSdk.startAttestation(
          JSON.stringify(formatAttestParams)
        );
        // console.log("attestation", attestation);
        return resolve(attestation)
      } catch (error: any) {
        // console.error('attest error:',error);
        return reject(error);
      }
    });
  }
}

export { ZktlsSdk };
