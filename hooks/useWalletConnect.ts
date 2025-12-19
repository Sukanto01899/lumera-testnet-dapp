import { useEffect, useRef } from "react";

import { useChain } from "@interchain-kit/react";
import { SigningStargateClient } from "@cosmjs/stargate";
import { AccountData, OfflineSigner } from "@cosmjs/proto-signing";
import { Secp256k1 } from "@cosmjs/crypto";
import { fromBase64, fromHex } from "@cosmjs/encoding";

import { CHAIN_NAME, RPC_ENDPOINT } from "@/constant/network";
import { useDispatch, useSelector } from "@/redux/hook";
import { setAddress, setConnected, setWalletName } from "@/redux/wallet.slice";

const useWalletConnect = () => {
  const dispatch = useDispatch();
  const {
    chain,
    wallet,
    address,
    status,
    connect,
    openView,
    disconnect,
  } = useChain(CHAIN_NAME);
  const { isModalOpen } = useSelector((state) => state.wallet);
  const triedAutoConnect = useRef(false);

  useEffect(() => {
    dispatch(setAddress({ address: address || "" }));
    dispatch(setConnected({ status: status === "Connected" }));
    dispatch(setWalletName({ walletName: wallet?.info?.prettyName || "" }));
  }, [address, status, wallet, dispatch]);

  // Try to auto-connect once when wallet is present but status not yet Connected
  useEffect(() => {
    if (!wallet || status === "Connected" || triedAutoConnect.current || !connect) return;
    triedAutoConnect.current = true;
    Promise.resolve(connect()).catch(() => {
      triedAutoConnect.current = false;
    });
  }, [wallet, status, connect]);

  // Refresh on keystore changes (network/account switch)
  useEffect(() => {
    const handler = () => {
      triedAutoConnect.current = false;
      if (connect) {
        connect();
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("keplr_keystorechange", handler);
      window.addEventListener("leap_keystorechange", handler);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("keplr_keystorechange", handler);
        window.removeEventListener("leap_keystorechange", handler);
      }
    };
  }, [connect]);

  const wrapSignerWithCompressedPubkey = (signer: OfflineSigner | null | undefined) => {
    if (!signer) return signer;
    const signerObj = signer as OfflineSigner;
    const getAccounts = signerObj.getAccounts?.bind(signerObj);
    if (!getAccounts) return signer;
    return {
      ...signerObj,
      getAccounts: async () => {
        const accounts = await getAccounts();
        return accounts.map((acct) => {
          const pk = (acct as { pubkey?: unknown })?.pubkey;
          if (!pk) return acct;
          // keplr can return Uint8Array or base64 string; WC may return hex
          let bytes: Uint8Array;
          if (pk instanceof Uint8Array) {
            bytes = pk;
          } else if (typeof pk === "string") {
            // handle base64 or hex
            bytes =
              pk.startsWith("0x") || pk.length === 130
                ? fromHex(pk.replace(/^0x/, ""))
                : fromBase64(pk);
          } else if (Array.isArray(pk)) {
            bytes = new Uint8Array(pk);
          } else {
            return acct;
          }
          if (bytes.length === 33 && (bytes[0] === 0x02 || bytes[0] === 0x03)) {
            return { ...acct, pubkey: bytes, algo: acct.algo ?? "secp256k1" } as AccountData;
          }
          if (bytes.length === 65 && bytes[0] === 0x04) {
            try {
              const compressed = Secp256k1.compressPubkey(bytes);
              return { ...acct, pubkey: compressed, algo: acct.algo ?? "secp256k1" } as AccountData;
            } catch {
              return acct;
            }
          }
          // If we receive 64 bytes (missing prefix) or 65 bytes without the 0x04 prefix, still try compressing
          if (bytes.length === 64 || (bytes.length === 65 && bytes[0] !== 0x04)) {
            try {
              const prefixed =
                bytes.length === 64
                  ? Uint8Array.from([0x04, ...Array.from(bytes)])
                  : (() => {
                      const copy = Uint8Array.from(bytes);
                      copy[0] = 0x04;
                      return copy;
                    })();
              const compressed = Secp256k1.compressPubkey(prefixed);
              return { ...acct, pubkey: compressed, algo: acct.algo ?? "secp256k1" } as AccountData;
            } catch {
              return acct;
            }
          }
          return acct;
        });
      },
    };
  };

  const getClient = async () => {
    const chainId = chain?.chainId;
    if (!wallet || !chainId) {
      throw new Error("Please connect wallet before using");
    }
    const safeChainId: string = chainId;
    // Prefer direct signer to avoid pubkey format issues; fall back to amino signer.
    let baseSigner: OfflineSigner | null = null;
    const walletAny = wallet as unknown as {
      getOfflineSignerDirect?: (chainId: string) => Promise<OfflineSigner>;
      getOfflineSigner: (chainId: string) => Promise<OfflineSigner>;
      getKey?: (chainId: string) => Promise<{ pubKey: Uint8Array }>;
    };

    if (walletAny.getOfflineSignerDirect) {
      try {
        baseSigner = await walletAny.getOfflineSignerDirect(safeChainId);
      } catch {
        baseSigner = await walletAny.getOfflineSigner(safeChainId);
      }
    } else {
      baseSigner = await walletAny.getOfflineSigner(safeChainId);
    }
    let offlineSigner = wrapSignerWithCompressedPubkey(baseSigner);

    // Some wallets expose getKey with compressed pubkey; prefer replacing if available
    if (walletAny.getKey) {
      try {
        const keyInfo = await walletAny.getKey(safeChainId);
        const pk = keyInfo?.pubKey;
        if (pk instanceof Uint8Array && pk.length >= 32) {
          offlineSigner = {
            ...(offlineSigner as OfflineSigner),
            getAccounts: async () => {
              const accounts =
                (offlineSigner as { getAccounts?: () => Promise<readonly AccountData[]> })?.getAccounts
                  ? await (offlineSigner as { getAccounts: () => Promise<readonly AccountData[]> }).getAccounts()
                  : [];
              const compressed =
                pk.length === 33 && (pk[0] === 0x02 || pk[0] === 0x03)
                  ? pk
                  : pk.length === 65
                  ? Secp256k1.compressPubkey(
                      pk[0] === 0x04
                        ? pk
                        : (() => {
                            const copy = Uint8Array.from(pk);
                            copy[0] = 0x04;
                            return copy;
                          })()
                    )
                  : pk.length === 64
                  ? Secp256k1.compressPubkey(Uint8Array.from([0x04, ...Array.from(pk)]))
                  : pk;
              if (!accounts.length) {
                return [{ address: "", pubkey: compressed, algo: "secp256k1" }] as AccountData[];
              }
              return accounts.map((acct) => ({
                ...acct,
                pubkey: compressed,
                algo: acct.algo ?? "secp256k1",
              })) as AccountData[];
            },
          } as OfflineSigner;
        }
      } catch {
        // ignore
      }
    }

    if (!offlineSigner) {
      throw new Error("Please connect wallet before using");
    }
    return SigningStargateClient.connectWithSigner(RPC_ENDPOINT, offlineSigner);
  };

  const getOfflineSigner = async () => {
    const chainId = chain?.chainId;
    if (!wallet || !chainId) {
      throw new Error("Please connect wallet before using");
    }
    const safeChainId: string = chainId;
    let baseSigner: OfflineSigner | null = null;
    const walletAny = wallet as unknown as {
      getOfflineSignerDirect?: (chainId: string) => Promise<OfflineSigner>;
      getOfflineSigner: (chainId: string) => Promise<OfflineSigner>;
    };

    if (walletAny.getOfflineSignerDirect) {
      try {
        baseSigner = await walletAny.getOfflineSignerDirect(safeChainId);
      } catch {
        baseSigner = await walletAny.getOfflineSigner(safeChainId);
      }
    } else {
      baseSigner = await walletAny.getOfflineSigner(safeChainId);
    }
    const offlineSigner = wrapSignerWithCompressedPubkey(baseSigner);
    if (!offlineSigner) {
      throw new Error("Please connect wallet before using");
    }

    return offlineSigner;
  };

  const openWalletModal = async () => {
    // Always attempt the modal first (if provided), then fall back to explicit connect
    if (openView) {
      openView();
    }
    if (connect) {
      await connect();
    }
  };

  return {
    isModalOpen,
    isConnected: status === "Connected",
    address: address || "",
    walletName: wallet?.info?.prettyName || "",
    status,
    connect,
    openWalletModal,
    disconnect,
    getClient,
    getOfflineSigner,
  };
};

export default useWalletConnect;
