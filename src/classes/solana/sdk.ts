import * as anchor from "@coral-xyz/anchor";
import {
  PublicKey,
  VersionedTransactionResponse,
  Connection,
  SystemProgram,
  Transaction,
  Keypair,
} from "@solana/web3.js";
import { serializeAttestation } from "./attestation_schema";
import { getPrimusZktlsPda, getPrimusRedEnvelopePda, getPrimusRERecordPda } from "./pda";
import { utils } from 'ethers';
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { formatErrFn } from '../../utils/utils'

export const ERC20_TYPE = 0; //  SPL Token
export const NATIVE_TYPE = 1; // SOL
export const CHECK_TYPE_X_FOLLOWING = 0;
export const CHECK_TYPE_ACCOUNT = 1;
export const CHUNK_SIZE = 960; // for store attestation data
export const VERBOSE = 0; // set 1/2/3 to output more logs
export const RE_USERID_LEN = 8; // TODO
const NATIVETOKENATTBUFFERMAXLEN = 718
const ERC20TOKENATTBUFFERMAXLEN = 622


// export type ReRecord = anchor.Program<PrimusRedEnvelope>['account']['reRecord'];

export async function getBalance(connection: Connection, address: PublicKey): Promise<number> {
  const lamports = await connection.getBalance(address);
  return lamports;
}

export async function waitForTransactionConfirmation(
  provider: anchor.AnchorProvider,
  tx: string,
  retries: number = 5,
  delayMs: number = 1000
): Promise<VersionedTransactionResponse | null> {
  for (let i = 0; i < retries; i++) {
    const txDetails = await provider.connection.getTransaction(tx, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });
    if (txDetails) {
      console.log("Transaction details:", txDetails);
      if (VERBOSE > 2) {
        console.log("Program logs:", txDetails.meta?.logMessages);
      }
      return txDetails;
    }
    await new Promise(res => setTimeout(res, delayMs));
  }
  console.warn(`Transaction ${tx} not found after ${retries} retries.`);
  return null;
}

export async function initializePrimusZKTLS({
  zktlsProgram,
  defaultAddr,
  userKey,
  provider,
}: {
  zktlsProgram: any;
  defaultAddr: any;
  userKey: anchor.web3.PublicKey;
  provider: anchor.AnchorProvider;
}) {
  const [primusZktlsPda] = getPrimusZktlsPda({ programId: zktlsProgram.programId });
  const txInitialize = await zktlsProgram.methods
    .initialize(defaultAddr)
    .accounts({
      state: primusZktlsPda,
      owner: userKey,
      // systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();
  await waitForTransactionConfirmation(provider, txInitialize);
  console.log("initializePrimusZKTLS done");
}

export async function setAttestor({
  zktlsProgram,
  attestorObj,
  userKey,
  provider,
}: {
  zktlsProgram: any;
  attestorObj: any;
  userKey: anchor.web3.PublicKey;
  provider: anchor.AnchorProvider;
}) {
  const [primusZktlsPda] = getPrimusZktlsPda({ programId: zktlsProgram.programId });
  const txSetAttestor = await zktlsProgram.methods
    .setAttestor(attestorObj)
    .accounts({ state: primusZktlsPda, owner: userKey, })
    .rpc();
  await waitForTransactionConfirmation(provider, txSetAttestor);
  console.log("setAttestor done");
}

export async function removeAttestor({
  zktlsProgram,
  attestorAddr,
  userKey,
  provider,
}: {
  zktlsProgram: any;
  attestorAddr: any;
  userKey: anchor.web3.PublicKey;
  provider: anchor.AnchorProvider;
}) {
  const [primusZktlsPda] = getPrimusZktlsPda({ programId: zktlsProgram.programId });
  const txRemoveAttestor = await zktlsProgram.methods
    .removeAttestor(attestorAddr)
    .accounts({ state: primusZktlsPda, owner: userKey, })
    .rpc();
  await waitForTransactionConfirmation(provider, txRemoveAttestor);
  console.log("removeAttestor done");
}

export async function verifyAttestation({
  zktlsProgram,
  attObj,
  userKey,
  provider,
}: {
  zktlsProgram: any;
  attObj: any;
  userKey: anchor.web3.PublicKey;
  provider: anchor.AnchorProvider;
}) {
  const dataBuffer = anchor.web3.Keypair.generate();
  const dataBufferKey = dataBuffer.publicKey;
  const attBuffer = serializeAttestation(attObj);
  console.log(`attBuffer.length=${attBuffer.length}`);
  let storeInitialized = false;
  let useStoreVersion = false;
  // TODO
  if (attBuffer.length > 999 - 32) {// exactly 999, update this if the parameters has changed
    useStoreVersion = true;
  }

  try {
    if (useStoreVersion) {
      // 1, init storage
      const txStoreInitialize = await zktlsProgram.methods
        .storeInitialize(attBuffer.length)
        .accounts({ dataBuffer: dataBufferKey, user: userKey })
        .signers([dataBuffer])
        .rpc();
      await waitForTransactionConfirmation(provider, txStoreInitialize);
      storeInitialized = true;
      console.log("storeInitialize done");

      // 2. write data
      for (let offset = 0; offset < attBuffer.length; offset += CHUNK_SIZE) {
        const chunk = attBuffer.slice(offset, offset + CHUNK_SIZE);
        const txStoreChunk = await zktlsProgram.methods
          .storeChunk(Buffer.from(chunk))
          .accounts({ dataBuffer: dataBufferKey, user: userKey })
          .rpc();
        await waitForTransactionConfirmation(provider, txStoreChunk);
      }
      console.log("storeChunk done");
    }

    // 3. do verify
    const [primusZktlsPda] = getPrimusZktlsPda({ programId: zktlsProgram.programId });
    let _att = attObj;
    let _dataBufferKey = null;
    if (useStoreVersion) {
      _att = null;
      _dataBufferKey = dataBufferKey
    }
    const txVerifyAttestation = await zktlsProgram.methods
      .verifyAttestation(_att)
      .accounts({
        state: primusZktlsPda,
        dataBuffer: _dataBufferKey,
        user: userKey
      })
      .rpc();
    await waitForTransactionConfirmation(provider, txVerifyAttestation);
    console.log("verifyAttestation done");
  } catch (err) {
    console.error("verifyAttestation error:", err);
    throw err;
  } finally {
    if (useStoreVersion && storeInitialized) {
      try {
        // 4. close storage account, back rent
        const txStoreClose = await zktlsProgram.methods
          .storeClose()
          .accounts({ dataBuffer: dataBufferKey, user: userKey })
          .rpc();
        await waitForTransactionConfirmation(provider, txStoreClose);
        console.log("storeClose done");
      } catch (closeErr) {
        console.error("Failed to close dataBuffer:", closeErr);
      }
    }
  }
}

export async function initializePrimusRedEnvelope({
  redEnvelopeProgram,
  userKey,
  provider,
  zktlsProgram,
  feeRecipient,
  claimFee,
}: {
  redEnvelopeProgram: any;
  userKey: anchor.web3.PublicKey;
  provider: anchor.AnchorProvider;
  zktlsProgram: any;
  feeRecipient: anchor.web3.PublicKey;
  claimFee: number,
}) {
  const [redEnvelopePda] = getPrimusRedEnvelopePda({ programId: redEnvelopeProgram.programId });
  const txInitialize = await redEnvelopeProgram.methods
    .initialize(zktlsProgram.programId, feeRecipient, new anchor.BN(claimFee))
    .accounts({
      state: redEnvelopePda,
      owner: userKey,
      // systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();
  await waitForTransactionConfirmation(provider, txInitialize);
  console.log("initializePrimusRedEnvelope done");
}

export async function reSend({
  redEnvelopeProgram,
  userKey,
  provider,
  tipToken,
  reSendParam,
  payer = null,
}: {
  redEnvelopeProgram: any;
  userKey: anchor.web3.PublicKey;
  provider: anchor.AnchorProvider;
  tipToken: any;
  reSendParam: any;
  payer?: Keypair;
  }): Promise<string | null> {
  return new Promise(async (resolve, reject) => {
    try {
      // console.log('provider', provider)
      // 1. Create an account to store the amounts and reclaimeds
      const spaceAccount = Keypair.generate();
      // layout: discriminator(8) + re_id(32) + vec<u64> + vec<[u8;8]>
      const space = 8 + 32 + 4 + 8 * reSendParam.number + 4 + RE_USERID_LEN * reSendParam.number;
      if (space > 10 * 1024 * 1024 - 256) {
        throw "Cannot make so large space[" + space.toString() + "]";
      }
      const lamports = await provider.connection.getMinimumBalanceForRentExemption(space);
      console.log("spaceAccount:", spaceAccount.publicKey.toBase58(), "space:", space, "minimum rent:", lamports / 1_000_000_000, "SOL");

      const createIx = SystemProgram.createAccount({
        fromPubkey: userKey,
        newAccountPubkey: spaceAccount.publicKey,
        lamports,
        space,
        programId: redEnvelopeProgram.programId,
      });

      // 2. init the spaceAccount
      const reRecordDataInitIx = await redEnvelopeProgram.methods
        .reRecordDataInit()
        .accounts({
          reRecordData: spaceAccount.publicKey,
          sender: userKey,
        })
        .signers([spaceAccount])
        .instruction();

      // 3. reSend
      // 1). get the id counter
      const [redEnvelopePda] = getPrimusRedEnvelopePda({ programId: redEnvelopeProgram.programId });
      const redEnvelopeState = await redEnvelopeProgram.account.redEnvelopeState.fetch(redEnvelopePda);
      console.log("idCounter", redEnvelopeState.idCounter.toString());

      // 2). generate reId
      const idCounter = new anchor.BN(redEnvelopeState.idCounter);
      const idCounterBytes = idCounter.toArrayLike(Buffer, "le", 16);
      // const reId = utils.arrayify(utils.keccak256(idCounterBytes))
      const reId = Buffer.from(utils.arrayify(utils.keccak256(idCounterBytes)));// update

      const [reRecordPda] = getPrimusRERecordPda({ programId: redEnvelopeProgram.programId, reId: reId });
      // console.log("idCounterBytes:", idCounterBytes.toString("hex"));

      // console.log("reRecordPda:", reRecordPda.toBase58());

      // 3). set from/to token account
      let mint = null;
      let fromTokenAccount = null;
      let toTokenAccount = null;
      if (tipToken.tokenType == ERC20_TYPE) {
        mint = tipToken.tokenAddress;
        fromTokenAccount = await getAssociatedTokenAddress(mint, userKey);
        toTokenAccount = await getAssociatedTokenAddress(mint, redEnvelopePda, true);
      }
      const reSendIx = await redEnvelopeProgram.methods
        .reSend(Array.from(reId), tipToken, reSendParam)
        .accounts({
          state: redEnvelopePda,
          reRecord: reRecordPda,
          reRecordData: spaceAccount.publicKey,
          sender: userKey,
          // SPL
          fromTokenAccount: fromTokenAccount,
          toTokenAccount: toTokenAccount,
          mint: mint,
        })
        .instruction();


      // 4. set max CU limit, mainly for reSend
      // const max_cu_limit = 1_000_000; // 1_400_000;
      // const computeIx = ComputeBudgetProgram.setComputeUnitLimit({ units: max_cu_limit });

      //
      const tx = new Transaction()
        // .add(computeIx)
        .add(createIx)
        .add(reRecordDataInitIx)
        .add(reSendIx);

      // const ts = await sendAndConfirmTransaction(provider.connection, tx, [payer, spaceAccount]);
      // Construct the transaction
      tx.feePayer = userKey;
      tx.recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;

      // sign the transaction (browser wallet + newAccount)
      tx.partialSign(spaceAccount);

      const signedTx = await provider.wallet.signTransaction(tx);
      const serializeSignedTx = signedTx.serialize()
      console.log('signedTx', signedTx, serializeSignedTx, tx.recentBlockhash,)
      // send and confirm it.
      const sig = await provider.connection.sendRawTransaction(serializeSignedTx);
      // await provider.connection.confirmTransaction(sig);

      // await waitForTransactionConfirmation(provider, sig);
      console.log("reSend done, reId: ", reId.toString("hex"), sig);
      return resolve(sig)
    } catch (err) {
      console.error("reSend error:", err);
      const formatErr = formatErrFn(err);
      return reject(formatErr)
    } finally {
      // if (reSenderInitialized) {
      // TODO, close newAccount
      // }
    }
  })
}

export async function reClaim({
  redEnvelopeProgram,
  userKey,
  provider,
  zktlsProgram,
  reId,
  attObj,
}: {
  redEnvelopeProgram: any;
  userKey: anchor.web3.PublicKey;
  provider: anchor.AnchorProvider;
  zktlsProgram: any;
  reId: any;
  attObj: any;
}) {
  return new Promise(async(resolve, reject) => {
    const [redEnvelopePda] = getPrimusRedEnvelopePda({ programId: redEnvelopeProgram.programId });
    const [reRecordPda] = getPrimusRERecordPda({ programId: redEnvelopeProgram.programId, reId: reId });
    const [primusZktlsPda] = getPrimusZktlsPda({ programId: zktlsProgram.programId });
    console.log("primusZktlsPda:", primusZktlsPda.toBase58());
    console.log("reRecordPda:", reRecordPda.toBase58());

    const attRecipient = new PublicKey(attObj.recipient);

    // get fee recipient
    const redEnvelopeState = await redEnvelopeProgram.account.redEnvelopeState.fetch(redEnvelopePda);
    console.log("redEnvelopeState.feeRecipient", redEnvelopeState.feeRecipient.toBase58());

    const feeRecipient = redEnvelopeState.feeRecipient;

    // get token type
    const reRecord = await redEnvelopeProgram.account.reRecord.fetch(reRecordPda);


    let tx
    const dataBuffer = anchor.web3.Keypair.generate();
    const dataBufferKey = dataBuffer.publicKey;
    const attBuffer = serializeAttestation(attObj);
    console.log(`attBuffer.length=${attBuffer.length}`);
    let storeInitialized = false;
    let useStoreVersion = false;

    if ((reRecord.tokenType == ERC20_TYPE && attBuffer.length > ERC20TOKENATTBUFFERMAXLEN) || (reRecord.tokenType != ERC20_TYPE && attBuffer.length > NATIVETOKENATTBUFFERMAXLEN)) {// exactly 719, update this if the parameters has changed
      useStoreVersion = true;
    }

    try {

      if (useStoreVersion) {
        // 1, init storage
        const txStoreInitialize = await zktlsProgram.methods
          .storeInitialize(attBuffer.length)
          .accounts({ dataBuffer: dataBufferKey, user: userKey })
          .signers([dataBuffer])
          .rpc();
        await waitForTransactionConfirmation(provider, txStoreInitialize);
        storeInitialized = true;
        console.log("storeInitialize done");
        // 2. write data
        for (let offset = 0; offset < attBuffer.length; offset += CHUNK_SIZE) {
          const chunk = attBuffer.slice(offset, offset + CHUNK_SIZE);
          const txStoreChunk = await zktlsProgram.methods
            .storeChunk(Buffer.from(chunk))
            .accounts({ dataBuffer: dataBufferKey, user: userKey })
            .rpc();
          await waitForTransactionConfirmation(provider, txStoreChunk);
        }
        console.log("storeChunk done");
      }

      // 3. do reclaim

      const reRecordData2 = await redEnvelopeProgram.account.reRecordData.fetch(reRecord.recordData);
      console.log("reRecordData2:", reRecordData2);
      console.log("reRecord.tokenType:", reRecord.tokenType);

      // get record data account
      const reRecordData = reRecord.recordData;
      console.log("reRecord.recordData", reRecord.recordData.toBase58());

      let mint = null;
      let fromTokenAccount = null;
      let toTokenAccount = null;
      if (reRecord.tokenType == ERC20_TYPE) {
        console.log("reRecord.tokenAddress:", reRecord.tokenAddress);
        mint = reRecord.tokenAddress;
        fromTokenAccount = await getAssociatedTokenAddress(mint, redEnvelopePda, true);
        toTokenAccount = await getAssociatedTokenAddress(mint, attRecipient);
      }

      let _att = attObj;
      let _dataBufferKey = null;
      if (useStoreVersion) {
        _att = null;
        _dataBufferKey = dataBufferKey
      }
      tx = await redEnvelopeProgram.methods
        .reClaim(reId, _att)
        .accounts({
          state: redEnvelopePda,
          reRecord: reRecordPda,
          reRecordData: reRecordData,
          claimer: userKey,
          primusZktlsProgram: zktlsProgram.programId.toBase58(),
          primusZktlsState: primusZktlsPda,
          feeRecipient: feeRecipient,
          attRecipient: attRecipient,
          dataBuffer: _dataBufferKey,
          // SPL
          fromTokenAccount: fromTokenAccount,
          toTokenAccount: toTokenAccount,
          mint: mint,
        })
        .signers([])
        .rpc();
      // await waitForTransactionConfirmation(provider, tx);
      console.log("reClaim done");
    } catch (err) {
      console.error("reClaim error:", err);
      const formatErr = formatErrFn(err)
      return reject(formatErr)
    } finally {
      if (useStoreVersion && storeInitialized) {
        try {
          // 4. close storage account, back rent
          const txStoreClose = await zktlsProgram.methods
            .storeClose()
            .accounts({ dataBuffer: dataBufferKey, user: userKey })
            .rpc();
          await waitForTransactionConfirmation(provider, txStoreClose);
          console.log("storeClose done");
          return resolve(tx)
        } catch (closeErr) {
          console.error("Failed to close dataBuffer:", closeErr);
        }
      } else {
        return resolve(tx)
      }
    }
  })
}

export async function reSenderWithdraw({
  redEnvelopeProgram,
  userKey,
  provider,
  reId,
}: {
  redEnvelopeProgram: any;
  userKey: anchor.web3.PublicKey;
  provider: anchor.AnchorProvider;
  reId: any;
  }) {
  return new Promise(async (resolve, reject) => {
    try { 
      const [redEnvelopePda] = getPrimusRedEnvelopePda({ programId: redEnvelopeProgram.programId });
      const [reRecordPda] = getPrimusRERecordPda({ programId: redEnvelopeProgram.programId, reId: reId });
      // console.log("reRecordPda:", reRecordPda.toBase58());

      const reRecord = await redEnvelopeProgram.account.reRecord.fetch(reRecordPda);
      console.log("reRecord.tokenType:", reRecord.tokenType);

      let mint = null;
      let fromTokenAccount = null;
      let toTokenAccount = null;

      if (reRecord.tokenType == ERC20_TYPE) {
        console.log("reRecord.tokenAddress:", reRecord.tokenAddress);
        mint = reRecord.tokenAddress;
        fromTokenAccount = await getAssociatedTokenAddress(mint, redEnvelopePda, true);
        toTokenAccount = await getAssociatedTokenAddress(mint, userKey);
      }
      const tx = await redEnvelopeProgram.methods
        .reSenderWithdraw(reId)
        .accounts({
          state: redEnvelopePda,
          reRecord: reRecordPda,
          reSender: userKey,
          // SPL
          fromTokenAccount: fromTokenAccount,
          toTokenAccount: toTokenAccount,
          mint: mint,
        })
        .signers([])
        .rpc();
      // await waitForTransactionConfirmation(provider, tx);
      console.log("reSenderWithdraw done");
      return resolve(tx)
    } catch (err) {
      console.error("reSenderWithdraw error:", err);
      const formatErr = formatErrFn(err)
      return reject(formatErr)
    }
  })
}

export async function getREInfo({
  redEnvelopeProgram,
  reId,
}: {
  redEnvelopeProgram: any;
  reId: any;
  }): Promise<any | null> {
  return new Promise(async (resolve, reject) => {
    try {
      const [reRecordPda] = getPrimusRERecordPda({ programId: redEnvelopeProgram.programId, reId: reId });
      const reRecord = await redEnvelopeProgram.account.reRecord.fetch(reRecordPda);
      console.log("getREInfo done", reRecord);
      return resolve(reRecord)
    } catch (err) {
      console.error("getREInfo error:", err);
      const formatErr = formatErrFn(err)
      return reject(formatErr)
    }
  })
}

export async function getClaimed({
  redEnvelopeProgram,
  reId,
  userid,
}: {
  redEnvelopeProgram: any;
  reId: any;
  userid: string;
}): Promise<boolean | null> {
  const reRecord = await getREInfo({ redEnvelopeProgram, reId });
  const reRecordData = await redEnvelopeProgram.account.reRecordData.fetch(reRecord.recordData);
  const userIdBytes = (new TextEncoder()).encode(userid);
  // const userIdHash = utils.keccak256(Buffer.from(userIdBytes)).subarray(0, 8);
  const userIdHash = utils.arrayify(utils.keccak256(Buffer.from(userIdBytes))).subarray(0, 8); // update
  const contains = reRecordData.reClaimed.some(arr =>
    arr.length === userIdHash.length && arr.every((v, i) => v === userIdHash[i])
  );
  return contains;
}

export async function setFeeRecipient({
  redEnvelopeProgram,
  userKey,
  provider,
  feeRecipient,
}: {
  redEnvelopeProgram: any;
  userKey: anchor.web3.PublicKey;
  provider: anchor.AnchorProvider;
  feeRecipient: anchor.web3.PublicKey;
}) {
  const [redEnvelopePda] = getPrimusRedEnvelopePda({ programId: redEnvelopeProgram.programId });
  const tx = await redEnvelopeProgram.methods
    .setFeeRecipient(feeRecipient)
    .accounts({
      state: redEnvelopePda,
      owner: userKey,
    })
    .rpc();
  await waitForTransactionConfirmation(provider, tx);
  console.log("setFeeRecipient done");
}

export async function setWithdrawDelay({
  redEnvelopeProgram,
  userKey,
  provider,
  withdrawDelay,
}: {
  redEnvelopeProgram: any;
  userKey: anchor.web3.PublicKey;
  provider: anchor.AnchorProvider;
  withdrawDelay: number;
}) {
  const [redEnvelopePda] = getPrimusRedEnvelopePda({ programId: redEnvelopeProgram.programId });
  const tx = await redEnvelopeProgram.methods
    .setWithdrawDelay(new anchor.BN(withdrawDelay))
    .accounts({
      state: redEnvelopePda,
      owner: userKey,
    })
    .rpc();
  await waitForTransactionConfirmation(provider, tx);
  console.log("setWithdrawDelay done");
}

export async function setPrimusZKTLS({
  redEnvelopeProgram,
  userKey,
  provider,
  zktlsProgram,
}: {
  redEnvelopeProgram: any;
  userKey: anchor.web3.PublicKey;
  provider: anchor.AnchorProvider;
  zktlsProgram: any;
}) {
  const [redEnvelopePda] = getPrimusRedEnvelopePda({ programId: redEnvelopeProgram.programId });
  const tx = await redEnvelopeProgram.methods
    .setPrimusZKTLS(zktlsProgram.programId)
    .accounts({
      state: redEnvelopePda,
      owner: userKey,
    })
    .rpc();
  await waitForTransactionConfirmation(provider, tx);
  console.log("setPrimusZKTLS done");
}

export async function setClaimFee({
  redEnvelopeProgram,
  userKey,
  provider,
  claimFee,
}: {
  redEnvelopeProgram: any;
  userKey: anchor.web3.PublicKey;
  provider: anchor.AnchorProvider;
  claimFee: number;
}) {
  const [redEnvelopePda] = getPrimusRedEnvelopePda({ programId: redEnvelopeProgram.programId });
  const tx = await redEnvelopeProgram.methods
    .setClaimFee(new anchor.BN(claimFee))
    .accounts({
      state: redEnvelopePda,
      owner: userKey,
    })
    .rpc();
  await waitForTransactionConfirmation(provider, tx);
  console.log("setClaimFee done");
}