"use client";

import { useChain, useChainWallet } from "@interchain-kit/react";
import Modal from "./Modal";
import { Button } from "@/components/retroui/Button";
import { useEffect } from "react";
import { useDispatch } from "@/redux/hook";
import { setAddress, setConnected } from "@/redux/wallet.slice";
import { CHAIN_NAME } from "@/constant/network";

function WalletButton({
  status,
  connect,
  wallet,
  address,
}: {
  status: string;
  connect: () => void;
  wallet: string;
  address: string;
}) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (address) {
      dispatch(
        setAddress({
          address,
        })
      );
      dispatch(
        setConnected({
          status: true,
        })
      );
    }
  }, [address, dispatch]);
  return (
    <Button disabled={status === "NotExist"} onClick={connect}>
      {status === "NotExist"
        ? `${wallet} Wallet Not Found`
        : status === "Connecting"
        ? "Connecting..."
        : status === "Connected"
        ? "Connected"
        : `Connect ${wallet}`}
    </Button>
  );
}

export function WalletModalComponent() {
  const { address } = useChain(CHAIN_NAME);
  const { connect: keplrConnect, status: keplrStatus } = useChainWallet(
    "lumeratestnet",
    "keplr-extension"
  );
  const { connect: leapConnect, status: leapStatus } = useChainWallet(
    "lumeratestnet",
    "leap-extension"
  );
  const { connect: wcConnect, status: wcStatus } = useChainWallet(
    "lumeratestnet",
    "keplr-extension"
  );

  return (
    <Modal header="Connect you wallet">
      <WalletButton
        status={keplrStatus}
        connect={keplrConnect}
        wallet="Keplr"
        address={address}
      />
      <WalletButton
        address={address}
        status={leapStatus}
        connect={leapConnect}
        wallet="Leap"
      />
      <WalletButton
        status={wcStatus}
        connect={wcConnect}
        wallet="WalletConnect"
        address={address}
      />
    </Modal>
  );
}

// export function ConnectWalletButton() {
//   const { address, openView } = useChain(CHAIN_NAME);

//   return (
//     <div style={{ display: "flex", gap: 8 }}>
//       {!address ? (
//         <button
//           onClick={openView}
//           className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors flex cursor-pointer"
//         >
//           <Wallet size="$1" /> <div className="ml-1">Connect Wallet</div>
//         </button>
//       ) : null}
//     </div>
//   );
// }
