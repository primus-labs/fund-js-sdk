import * as anchor from "@coral-xyz/anchor";
import {
  PublicKey,
  VersionedTransactionResponse,
  Connection,
  Commitment,
  SystemProgram,
  Transaction,
  Keypair,
  sendAndConfirmTransaction
} from "@solana/web3.js";
import { serializeAttestation } from "./attestation_schema";
import { getPrimusZktlsPda, getPrimusRedEnvelopePda, getPrimusRERecordPda } from "./pda";
import {utils} from 'ethers';
import { createMint, getAssociatedTokenAddress, mintTo, getAccount } from "@solana/spl-token";

export const ERC20_TYPE = 0; //  SPL Token
export const NATIVE_TYPE = 1; // SOL
export const CHECK_TYPE_X_FOLLOWING = 0;
export const CHECK_TYPE_ACCOUNT = 1;
export const CHUNK_SIZE = 960; // for store attestation data
export const VERBOSE = 0; // set 1/2/3 to output more logs
export const RE_USERID_LEN = 8; // TODO

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
      // console.log("Transaction details:", txDetails);
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
}): Promise<Buffer | null> {
  const newAccount = Keypair.generate();
  // discriminator + re_id + vec<u64> + vec<[u8;8]>
  const space = 8 + 32 + 4 + 8 * reSendParam.number + 4 + RE_USERID_LEN * reSendParam.number;
  const lamports = await provider.connection.getMinimumBalanceForRentExemption(space);
  console.log("newAccount:", newAccount.publicKey.toBase58(), "minimum rent:", lamports / 1_000_000_000, "SOL");

  const createIx = SystemProgram.createAccount({
    fromPubkey: userKey,
    newAccountPubkey: newAccount.publicKey,
    lamports,
    space,
    programId: redEnvelopeProgram.programId,
  });

  const [redEnvelopePda] = getPrimusRedEnvelopePda({ programId: redEnvelopeProgram.programId });

  // 1. get the id counter
  const redEnvelopeState = await redEnvelopeProgram.account.redEnvelopeState.fetch(redEnvelopePda);
  console.log("idCounter", redEnvelopeState.idCounter.toString());

  // 2. get the ReRecordPda
  const idCounter = new anchor.BN(redEnvelopeState.idCounter);
  const idCounterBytes = idCounter.toArrayLike(Buffer, "le", 16);
  
  let reId = utils.keccak256(idCounterBytes);
let reId2  = Buffer.from(reId.slice(2), "hex")
  reId = utils.arrayify(reId)

    
  const [reRecordPda] = getPrimusRERecordPda({ programId: redEnvelopeProgram.programId, reId: reId });
  // console.log("reRecordPda:", reRecordPda.toBase58());
  // console.log("idCounterBytes:", idCounterBytes.toString("hex"));
  // console.log("reId:", reId.toString("hex"));

  let reSenderInitialized = false;
  try {
    {
      // reSendInit
      // const ix = await redEnvelopeProgram.methods
      //   .reSendInit()
      //   .accounts({
      //     reRecordData: newAccount.publicKey,
      //     sender: userKey,
      //   })
      //   .signers([newAccount])
      //   .instruction();
      
      
      const tx = new Transaction().add(createIx);
      // const tx = new Transaction().add(createIx, ix);
      // debugger
      // // const tx0 = await sendAndConfirmTransaction(provider.connection, tx, [newAccount]);
      // const tx0 = await sendAndConfirmTransaction(provider.connection, tx, [payer, newAccount]);
      // await waitForTransactionConfirmation(provider, tx0);

      // 构造交易
      tx.feePayer = userKey;
      tx.recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;

      // 签名交易（浏览器钱包 + newAccount）
      tx.partialSign(newAccount);
      const signedTx = await provider.wallet.signTransaction(tx);

      // 发送并确认
      const sig = await provider.connection.sendRawTransaction(signedTx.serialize());
      await provider.connection.confirmTransaction(sig);
      

      console.log("reSendInit done");
      reSenderInitialized = true;
    }

    // 3. call reSend
    let fromTokenAccount = null;
    let toTokenAccount = null;
    let mint = null;
    if (tipToken.tokenType == ERC20_TYPE) {
      fromTokenAccount = await getAssociatedTokenAddress(tipToken.tokenAddress, userKey);
      toTokenAccount = await getAssociatedTokenAddress(tipToken.tokenAddress, reRecordPda, true);
      mint = tipToken.tokenAddress;
    }

    const tx = await redEnvelopeProgram.methods
      .reSend(Array.from(reId), tipToken, reSendParam)
      .accounts({
        state: redEnvelopePda,
        reRecord: reRecordPda,
        reRecordData: newAccount.publicKey,
        sender: userKey,
        // SPL
        fromTokenAccount: fromTokenAccount,
        toTokenAccount: toTokenAccount,
        mint: mint,
      })
      .signers([])
      .rpc();
    await waitForTransactionConfirmation(provider, tx);
    console.log("reSend done");
  } catch (err) {
    console.error("reSend error:", err);
    throw err;
  } finally {
    if (reSenderInitialized) {
      // TODO, close newAccount
    }
  }

  return reId;
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
  const dataBuffer = anchor.web3.Keypair.generate();
  const dataBufferKey = dataBuffer.publicKey;
  const attBuffer = serializeAttestation(attObj);
  console.log(`attBuffer.length=${attBuffer.length}`);

  let storeInitialized = false;
  let useStoreVersion = false;
  if (attBuffer.length > 719 - 32) {// exactly 719, update this if the parameters has changed
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
    console.log("reRecord.tokenType:", reRecord.tokenType);

    // get record data account
    const reRecordData = reRecord.recordData;
    console.log("reRecord.recordData", reRecord.recordData.toBase58());

    let fromTokenAccount = null;
    let toTokenAccount = null;
    let mint = null;
    if (reRecord.tokenType == ERC20_TYPE) {
      console.log("reRecord.tokenAddress:", reRecord.tokenAddress);
      fromTokenAccount = await getAssociatedTokenAddress(reRecord.tokenAddress, reRecordPda, true);
      toTokenAccount = await getAssociatedTokenAddress(reRecord.tokenAddress, attRecipient);
      mint = reRecord.tokenAddress;
    }

    let _att = attObj;
    let _dataBufferKey = null;
    if (useStoreVersion) {
      _att = null;
      _dataBufferKey = dataBufferKey
    }
    const tx = await redEnvelopeProgram.methods
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
    await waitForTransactionConfirmation(provider, tx);
    console.log("reClaim done");
  } catch (err) {
    console.error("reClaim error:", err);
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
  const [reRecordPda] = getPrimusRERecordPda({ programId: redEnvelopeProgram.programId, reId: reId });
  console.log("reRecordPda:", reRecordPda.toBase58());

  const reRecord = await redEnvelopeProgram.account.reRecord.fetch(reRecordPda);
  console.log("reRecord.tokenType:", reRecord.tokenType);

  let fromTokenAccount = null;
  let toTokenAccount = null;
  let mint = null;
  if (reRecord.tokenType == ERC20_TYPE) {
    console.log("reRecord.tokenAddress:", reRecord.tokenAddress);
    fromTokenAccount = await getAssociatedTokenAddress(reRecord.tokenAddress, reRecordPda, true);
    toTokenAccount = await getAssociatedTokenAddress(reRecord.tokenAddress, userKey);
    mint = reRecord.tokenAddress;
  }

  const [redEnvelopePda] = getPrimusRedEnvelopePda({ programId: redEnvelopeProgram.programId });
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

  await waitForTransactionConfirmation(provider, tx);
  console.log("reSenderWithdraw done");
}

export async function getREInfo({
  redEnvelopeProgram,
  reId,
}: {
  redEnvelopeProgram: any;
  reId: any;
}): Promise<any | null> {
  const [reRecordPda] = getPrimusRERecordPda({ programId: redEnvelopeProgram.programId, reId: reId });
  const reRecord = await redEnvelopeProgram.account.reRecord.fetch(reRecordPda);
  return reRecord;
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
  const userIdHash = utils.keccak256(Buffer.from(userIdBytes)).subarray(0, 8);
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