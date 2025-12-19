import { useEffect, useRef } from "react";

import { useChain } from "@interchain-kit/react";
import { SigningStargateClient } from "@cosmjs/stargate";
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
    openWalletModal: kitOpenModal,
  } = useChain(CHAIN_NAME);
  const { isModalOpen } = useSelector((state) => state.wallet);
  const triedAutoConnect = useRef(false);

  useEffect(() => {
    dispatch(setAddress({ address: address || "" }));
    dispatch(setConnected({ status: status === "Connected" }));
    dispatch(setWalletName({ walletName: wallet?.prettyName || "" }));
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

  const wrapSignerWithCompressedPubkey = (signer: {
    getAccounts?: () => Promise<{ address: string; pubkey?: Uint8Array | string | number[] }[]>;
  }) => {
    if (!signer?.getAccounts) return signer;
    return {
      ...signer,
      getAccounts: async () => {
        const accounts = await signer.getAccounts();
        return accounts.map((acct) => {
          const pk = acct?.pubkey;
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
          } else {
            bytes = new Uint8Array(pk);
          }
          if (bytes.length === 33 && (bytes[0] === 0x02 || bytes[0] === 0x03)) {
            return { ...acct, pubkey: bytes };
          }
          if (bytes.length === 65 && bytes[0] === 0x04) {
            try {
              const compressed = Secp256k1.compressPubkey(bytes);
              return { ...acct, pubkey: compressed };
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
              return { ...acct, pubkey: compressed };
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
    if (!wallet || !chain) {
      throw new Error("Please connect wallet before using");
    }
    // Prefer direct signer to avoid pubkey format issues; fall back to amino signer.
    let baseSigner: unknown = null;
    const walletAny = wallet as unknown as {
      getOfflineSignerDirect?: (chainId: string) => Promise<unknown>;
      getOfflineSigner: (chainId: string) => Promise<unknown>;
      getKey?: (chainId: string) => Promise<{ pubKey: Uint8Array }>;
    };

    if (walletAny.getOfflineSignerDirect) {
      try {
        baseSigner = await walletAny.getOfflineSignerDirect(chain.chainId);
      } catch {
        baseSigner = await walletAny.getOfflineSigner(chain.chainId);
      }
    } else {
      baseSigner = await walletAny.getOfflineSigner(chain.chainId);
    }
    let offlineSigner = wrapSignerWithCompressedPubkey(baseSigner);

    // Some wallets expose getKey with compressed pubkey; prefer replacing if available
    if (walletAny.getKey) {
      try {
        const keyInfo = await walletAny.getKey(chain.chainId);
        const pk = keyInfo?.pubKey;
        if (pk instanceof Uint8Array && pk.length >= 32) {
          offlineSigner = wrapSignerWithCompressedPubkey({
            ...(offlineSigner as Record<string, unknown>),
            getAccounts: async () => {
              const accounts =
                (offlineSigner as { getAccounts?: () => Promise<{ address: string; pubkey?: Uint8Array }[]> })?.getAccounts
                  ? await (offlineSigner as { getAccounts: () => Promise<{ address: string; pubkey?: Uint8Array }[]> }).getAccounts()
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
                return [{ address: "", pubkey: compressed }];
              }
              return accounts.map((acct) => ({ ...acct, pubkey: compressed }));
            },
          });
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
    if (!wallet || !chain) {
      throw new Error("Please connect wallet before using");
    }
    let baseSigner: unknown = null;
    const walletAny = wallet as unknown as {
      getOfflineSignerDirect?: (chainId: string) => Promise<unknown>;
      getOfflineSigner: (chainId: string) => Promise<unknown>;
    };

    if (walletAny.getOfflineSignerDirect) {
      try {
        baseSigner = await walletAny.getOfflineSignerDirect(chain.chainId);
      } catch {
        baseSigner = await walletAny.getOfflineSigner(chain.chainId);
      }
    } else {
      baseSigner = await walletAny.getOfflineSigner(chain.chainId);
    }
    const offlineSigner = wrapSignerWithCompressedPubkey(baseSigner);
    if (!offlineSigner) {
      throw new Error("Please connect wallet before using");
    }

    return offlineSigner;
  };

  const openWalletModal = async () => {
    // Always attempt the modal first (if provided), then fall back to explicit connect
    if (kitOpenModal) {
      kitOpenModal();
    } else if (openView) {
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
    walletName: wallet?.prettyName || "",
    status,
    connect,
    openWalletModal,
    disconnect,
    getClient,
    getOfflineSigner,
  };
};

export default useWalletConnect;
