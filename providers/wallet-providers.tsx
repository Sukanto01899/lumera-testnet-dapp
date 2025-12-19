"use client";

import "@interchain-kit/react/styles.css";

import {
  WALLET_CONNECT_DESCRIPTION,
  WALLET_CONNECT_ICON,
  WALLET_CONNECT_NAME,
  WALLET_CONNECT_PROJECTID,
  WALLET_CONNECT_RELAY_URL,
  WALLET_CONNECT_URL,
  CHAIN_NAME,
} from "@/constant/network";
import store from "@/store";
import { WCWallet } from "@interchain-kit/core";
import { keplrWallet } from "@interchain-kit/keplr-extension";
import { leapWallet } from "@interchain-kit/leap-extension";
import { ChainProvider, InterchainWalletModal } from "@interchain-kit/react";
import { assetList, chain } from "chain-registry/testnet/lumeratestnet";
import { useMemo } from "react";
import { Provider } from "react-redux";
export const WalletProviders = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // Setup WalletConnect with custom metadata
  const walletConnect = useMemo(
    () =>
      new WCWallet(undefined, {
        projectId: WALLET_CONNECT_PROJECTID,
        relayUrl: WALLET_CONNECT_RELAY_URL,
        metadata: {
          name: WALLET_CONNECT_NAME,
          description: WALLET_CONNECT_DESCRIPTION,
          url: WALLET_CONNECT_URL,
          icons: [WALLET_CONNECT_ICON],
        },
      }),
    []
  );
  return (
    <Provider store={store}>
      <ChainProvider
        chains={[chain]}
        assetLists={[assetList]}
        wallets={[keplrWallet, leapWallet, walletConnect]}
        walletModal={() => <InterchainWalletModal />}
        defaultChainName={CHAIN_NAME}
      >
        {children}
      </ChainProvider>
    </Provider>
  );
};
