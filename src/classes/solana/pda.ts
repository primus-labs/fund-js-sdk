import {
  PublicKey,
} from "@solana/web3.js";

const SEED_PRIMUS_STATE = new TextEncoder().encode("primus_state");
const SEED_PRIMUS_RE_STATE = new TextEncoder().encode("red_envelope");
const SEED_PRIMUS_RE_RECORD = new TextEncoder().encode("re_record");

export function getPrimusZktlsPda({
  programId,
}: {
  programId: PublicKey;
}): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEED_PRIMUS_STATE],
    programId
  );
}

export function getPrimusRedEnvelopePda({
  programId,
}: {
  programId: PublicKey;
}): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEED_PRIMUS_RE_STATE],
    programId
  );
}

export function getPrimusRERecordPda({
  programId,
  reId,
}: {
  programId: PublicKey;
  reId: any,
}): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEED_PRIMUS_RE_RECORD, reId],
    programId
  );
}