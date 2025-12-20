import { useEffect, useRef } from "react";

import { useChain, useChainWallet, useWalletManager } from "@interchain-kit/react";
import { WalletState } from "@interchain-kit/core";
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
    disconnect: chainDisconnect,
  } = useChain(CHAIN_NAME);
  const walletManager = useWalletManager();
  const keplrChainWallet = useChainWallet(CHAIN_NAME, "keplr-extension");
  const leapChainWallet = useChainWallet(CHAIN_NAME, "leap-extension");
  const wcChainWallet = useChainWallet(CHAIN_NAME, "WalletConnect");
  const { isModalOpen } = useSelector((state) => state.wallet);
  const triedAutoConnect = useRef(false);

  const connectedWalletStore = walletManager.wallets?.find((w) => {
    const state = walletManager.getChainWalletState(w.info.name, CHAIN_NAME);
    return state?.walletState === WalletState.Connected;
  });
  const connectedChainWalletStore = connectedWalletStore?.getChainWalletStore(CHAIN_NAME);
  const connectedWalletState = connectedWalletStore
    ? walletManager.getChainWalletState(connectedWalletStore.info.name, CHAIN_NAME)
    : undefined;

  const resolvedWallet =
    wallet ||
    keplrChainWallet.wallet ||
    leapChainWallet.wallet ||
    wcChainWallet.wallet ||
    connectedChainWalletStore;
  const resolvedAddress =
    address ||
    keplrChainWallet.address ||
    leapChainWallet.address ||
    wcChainWallet.address ||
    connectedWalletState?.account?.address ||
    "";
  const resolvedStatus =
    status === WalletState.Connected
      ? status
      : keplrChainWallet.status ||
        leapChainWallet.status ||
        wcChainWallet.status ||
        connectedWalletState?.walletState ||
        WalletState.Disconnected;

  useEffect(() => {
    dispatch(setAddress({ address: resolvedAddress }));
    dispatch(setConnected({ status: resolvedStatus === WalletState.Connected }));
    dispatch(
      setWalletName({
        walletName: resolvedWallet?.info?.prettyName || connectedWalletStore?.info?.prettyName || "",
      })
    );
  }, [resolvedAddress, resolvedStatus, resolvedWallet, dispatch]);

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

  const normalizePubkey = (pk: unknown): Uint8Array | null => {
    if (!pk) return null;
    if (pk instanceof Uint8Array) return pk;
    if (Array.isArray(pk)) return new Uint8Array(pk);
    if (typeof pk !== "string") return null;

    const cleaned = pk.startsWith("0x") ? pk.slice(2) : pk;
    const isHex = /^[0-9a-fA-F]+$/.test(cleaned) && cleaned.length % 2 === 0;
    if (isHex) {
      return fromHex(cleaned);
    }
    try {
      return fromBase64(pk);
    } catch {
      return null;
    }
  };

  const isCompressedPubkey = (pk: Uint8Array): boolean =>
    pk.length === 33 && (pk[0] === 0x02 || pk[0] === 0x03);

  const compressPubkey = (pk: Uint8Array): Uint8Array => {
    if (isCompressedPubkey(pk)) {
      return pk;
    }
    if (pk.length === 65 && pk[0] === 0x04) {
      return Secp256k1.compressPubkey(pk);
    }
    if (pk.length === 64) {
      return Secp256k1.compressPubkey(Uint8Array.from([0x04, ...Array.from(pk)]));
    }
    if (pk.length === 65 && pk[0] !== 0x04) {
      const copy = Uint8Array.from(pk);
      copy[0] = 0x04;
      return Secp256k1.compressPubkey(copy);
    }
    return pk;
  };

  const wrapSignerWithCompressedPubkey = (
    signer: OfflineSigner | null | undefined,
    fallbackPubkey?: Uint8Array | null
  ) => {
    if (!signer) return signer;
    const signerObj = signer as OfflineSigner;
    const getAccounts = signerObj.getAccounts?.bind(signerObj);
    if (!getAccounts) return signer;
    return {
      ...signerObj,
      getAccounts: async () => {
        const accounts = await getAccounts();
        return accounts.map((acct) => {
          const pk = normalizePubkey((acct as { pubkey?: unknown })?.pubkey);
          if (!pk) {
            if (fallbackPubkey) {
              const fallbackCompressed = compressPubkey(fallbackPubkey);
              if (isCompressedPubkey(fallbackCompressed)) {
                return {
                  ...acct,
                  pubkey: fallbackCompressed,
                  algo: acct.algo ?? "secp256k1",
                } as AccountData;
              }
            }
            return acct;
          }
          try {
            let compressed = compressPubkey(pk);
            if (!isCompressedPubkey(compressed) && fallbackPubkey) {
              const fallbackCompressed = compressPubkey(fallbackPubkey);
              if (isCompressedPubkey(fallbackCompressed)) {
                compressed = fallbackCompressed;
              }
            }
            if (!isCompressedPubkey(compressed)) {
              return acct;
            }
            return {
              ...acct,
              pubkey: compressed,
              algo: acct.algo ?? "secp256k1",
            } as AccountData;
          } catch {
            return acct;
          }
          return acct;
        });
      },
    };
  };

  const getClient = async () => {
    const chainId = chain?.chainId;
    const activeWallet = resolvedWallet;
    if (!activeWallet || !chainId) {
      throw new Error("Please connect wallet before using");
    }
    const safeChainId: string = chainId;
    // Prefer direct signer to avoid pubkey format issues; fall back to amino signer.
    let baseSigner: OfflineSigner | null = null;
    const walletAny = activeWallet as unknown as {
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
    let fallbackPubkey: Uint8Array | null = null;
    try {
      if (typeof window !== "undefined") {
        const keplr = (window as unknown as { keplr?: { getKey: (chainId: string) => Promise<{ pubKey: unknown }> } }).keplr;
        if (keplr?.getKey) {
          const keplrKey = await keplr.getKey(safeChainId);
          fallbackPubkey = normalizePubkey(keplrKey?.pubKey);
        }
      }
    } catch {
      // ignore keplr fallback errors
    }
    let offlineSigner = wrapSignerWithCompressedPubkey(baseSigner, fallbackPubkey);

    // Some wallets expose getKey with compressed pubkey; prefer replacing if available
    if (walletAny.getKey) {
      try {
        const keyInfo = await walletAny.getKey(safeChainId);
        const pk = normalizePubkey(keyInfo?.pubKey);
        if (pk && pk.length >= 32) {
          offlineSigner = {
            ...(offlineSigner as OfflineSigner),
            getAccounts: async () => {
              const accounts =
                (offlineSigner as { getAccounts?: () => Promise<readonly AccountData[]> })?.getAccounts
                  ? await (offlineSigner as { getAccounts: () => Promise<readonly AccountData[]> }).getAccounts()
                  : [];
              let compressed = compressPubkey(pk);
              if (!isCompressedPubkey(compressed) && fallbackPubkey) {
                const fallbackCompressed = compressPubkey(fallbackPubkey);
                if (isCompressedPubkey(fallbackCompressed)) {
                  compressed = fallbackCompressed;
                }
              }
              if (!isCompressedPubkey(compressed)) {
                return accounts as AccountData[];
              }
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
    const activeWallet = resolvedWallet;
    if (!activeWallet || !chainId) {
      throw new Error("Please connect wallet before using");
    }
    const safeChainId: string = chainId;
    let baseSigner: OfflineSigner | null = null;
    const walletAny = activeWallet as unknown as {
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
    let fallbackPubkey: Uint8Array | null = null;
    try {
      if (typeof window !== "undefined") {
        const keplr = (window as unknown as { keplr?: { getKey: (chainId: string) => Promise<{ pubKey: unknown }> } }).keplr;
        if (keplr?.getKey) {
          const keplrKey = await keplr.getKey(safeChainId);
          fallbackPubkey = normalizePubkey(keplrKey?.pubKey);
        }
      }
    } catch {
      // ignore keplr fallback errors
    }
    const offlineSigner = wrapSignerWithCompressedPubkey(baseSigner, fallbackPubkey);
    if (!offlineSigner) {
      throw new Error("Please connect wallet before using");
    }

    return offlineSigner;
  };

  const openWalletModal = async () => {
    // Always attempt the modal first (if provided), then fall back to explicit connect
    if (openView) {
      openView();
    } else if (connect) {
      await connect();
    }
  };

  return {
    isModalOpen,
    isConnected: resolvedStatus === WalletState.Connected,
    address: resolvedAddress,
    walletName: resolvedWallet?.info?.prettyName || "",
    status: resolvedStatus,
    connect,
    openWalletModal,
    disconnect: async () => {
      if (connectedChainWalletStore?.disconnect) {
        return connectedChainWalletStore.disconnect();
      }
      if (resolvedWallet && typeof (resolvedWallet as { disconnect?: () => Promise<void> }).disconnect === "function") {
        return (resolvedWallet as { disconnect: () => Promise<void> }).disconnect();
      }
      if (keplrChainWallet.status === WalletState.Connected) {
        return keplrChainWallet.disconnect();
      }
      if (leapChainWallet.status === WalletState.Connected) {
        return leapChainWallet.disconnect();
      }
      if (wcChainWallet.status === WalletState.Connected) {
        return wcChainWallet.disconnect();
      }
      if (chainDisconnect) {
        return chainDisconnect();
      }
    },
    getClient,
    getOfflineSigner,
  };
};

export default useWalletConnect;
