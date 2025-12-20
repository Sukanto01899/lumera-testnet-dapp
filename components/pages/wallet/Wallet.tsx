import { useMemo, useState } from "react";

import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import { Dialog } from "@/components/retroui/Dialog";
import { Input } from "@/components/retroui/Input";
import { Label } from "@/components/retroui/Label";
import { Skeleton } from "@/components/retroui/Skeleton";
import { Text } from "@/components/retroui/Text";
import { DENOM } from "@/constant/network";
import { formatAddress, formatTokenDisplay } from "@/lib/format";
import { AccountInfoData } from "@/hooks/useAccountInfo";
import { ITransaction } from "@/hooks/useTransaction";
import useDelegate from "@/hooks/useDelegate";
import useSend from "@/hooks/useSend";
import { getPortfolioData } from "../dashboard/Dashboard";
import { getTotalRewards } from "@/hooks/useAccountInfo";

type WalletProps = {
  address: string;
  accountInfo: AccountInfoData | null;
  loadingAccount: boolean;
  transactions: ITransaction[];
  loadingTransactions: boolean;
  send: ReturnType<typeof useSend>;
  delegate: ReturnType<typeof useDelegate>;
};

const Wallet = ({
  address,
  accountInfo,
  loadingAccount,
  transactions,
  loadingTransactions,
  send,
  delegate,
}: WalletProps) => {
  const [isSendOpen, setSendOpen] = useState(false);
  const [isReceiveOpen, setReceiveOpen] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy");
  const [showDelegateAdvanced, setShowDelegateAdvanced] = useState(false);

  const { stacked, liquid } = useMemo(
    () => getPortfolioData(accountInfo),
    [accountInfo]
  );
  const totalRewards = useMemo(
    () => getTotalRewards(accountInfo),
    [accountInfo]
  );

  const availableBalance = useMemo(() => {
    if (!accountInfo) return 0;
    const lume = accountInfo.balances.find((b) => b.denom === DENOM);
    return lume ? Number(lume.amount) : 0;
  }, [accountInfo]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopyLabel("Copied!");
      setTimeout(() => setCopyLabel("Copy"), 1200);
    } catch {
      setCopyLabel("Copy failed");
      setTimeout(() => setCopyLabel("Copy"), 1200);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="retro-layer">
        <Card.Header>
          <Card.Title>Wallet Overview</Card.Title>
          <Card.Description>
            Connected address and key balances at a glance.
          </Card.Description>
        </Card.Header>
        <Card.Content className="space-y-3">
          <Text as="h5">
            {address ? formatAddress(address, 10, -6) : "No wallet connected"}
          </Text>
          {loadingAccount ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="border-2 rounded p-3 retro-chip bg-transparent">
                <Text as="h6" className="text-muted-foreground">
                  Liquid
                </Text>
                <Text as="h5">
                  {formatTokenDisplay(
                    { amount: `${liquid}`, denom: DENOM },
                    false
                  )}{" "}
                  LUME
                </Text>
              </div>
              <div className="border-2 rounded p-3 retro-chip bg-transparent">
                <Text as="h6" className="text-muted-foreground">
                  Staked
                </Text>
                <Text as="h5">
                  {formatTokenDisplay(
                    { amount: `${stacked}`, denom: DENOM },
                    false
                  )}{" "}
                  LUME
                </Text>
              </div>
              <div className="border-2 rounded p-3 retro-chip bg-transparent">
                <Text as="h6" className="text-muted-foreground">
                  Rewards
                </Text>
                <Text as="h5">
                  {formatTokenDisplay(
                    { amount: `${totalRewards}`, denom: DENOM },
                    false
                  )}{" "}
                  LUME
                </Text>
              </div>
            </div>
          )}
        </Card.Content>
      </Card>

      <Card className="retro-layer">
        <Card.Header>
          <Card.Title>Actions</Card.Title>
          <Card.Description>Move funds or delegate to validators.</Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-wrap gap-3">
          <Dialog open={isReceiveOpen} onOpenChange={setReceiveOpen}>
            <Button variant="outline" onClick={() => setReceiveOpen(true)}>
              Receive
            </Button>
            <Dialog.Content size="md">
              <Dialog.Header>Receive LUMERA</Dialog.Header>
              <div className="space-y-3 px-4 py-2">
                <div className="space-y-1">
                  <Label>Your address</Label>
                  <Input readOnly value={address} />
                </div>
                <Button variant="secondary" onClick={handleCopy}>
                  {copyLabel}
                </Button>
              </div>
              <Dialog.Footer>
                <Button onClick={() => setReceiveOpen(false)}>Close</Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog>

          <Dialog
            open={isSendOpen}
            onOpenChange={(open) => {
              setSendOpen(open);
              if (!open) {
                send.handleShowAdvancedChange(false);
              }
            }}
          >
            <Button onClick={() => setSendOpen(true)}>Send Tokens</Button>
            <Dialog.Content size="md">
              <Dialog.Header>Send</Dialog.Header>
              <div className="space-y-3 px-4 py-2">
                <div className="space-y-1">
                  <Label>Recipient</Label>
                  <Input
                    placeholder="lumera1..."
                    value={send.optionsAdvanced.recipient}
                    onChange={(e) => send.handleInputChange("recipient", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={send.optionsAdvanced.amount}
                      onChange={(e) => send.handleInputChange("amount", e.target.value)}
                    />
                    <Text className="text-xs text-muted-foreground">
                      Available:{" "}
                      {formatTokenDisplay(
                        { amount: `${availableBalance}`, denom: DENOM },
                        false
                      )}{" "}
                      LUME
                    </Text>
                  </div>
                  <div />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={send.showAdvanced}
                    onChange={(e) => send.handleShowAdvancedChange(e.target.checked)}
                  />
                  Advanced
                </label>
                {send.showAdvanced ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label>Gas</Label>
                      <Input
                        value={send.optionsAdvanced.gas}
                        onChange={(e) => send.handleInputChange("gas", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Fee</Label>
                      <Input
                        value={send.optionsAdvanced.fees}
                        onChange={(e) => send.handleInputChange("fees", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Memo</Label>
                      <Input
                        value={send.optionsAdvanced.memo}
                        onChange={(e) => send.handleInputChange("memo", e.target.value)}
                      />
                    </div>
                  </div>
                ) : null}
                {send.error ? (
                  <Text className="text-destructive">{send.error}</Text>
                ) : null}
                {send.transactionHash ? (
                  <div className="rounded border-2 border-green-500 p-3 bg-green-50 text-foreground">
                    <Text as="h6">Transfer submitted</Text>
                    <Text className="break-all text-sm">
                      Tx hash: {send.transactionHash}
                    </Text>
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={send.handleCloseCongratulationsModal}
                    >
                      Close
                    </Button>
                  </div>
                ) : null}
              </div>
              <Dialog.Footer>
                <Button variant="secondary" onClick={() => setSendOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={send.handleSendClick} disabled={send.isLoading}>
                  {send.isLoading ? "Sending..." : "Send"}
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog>

          <Dialog
            open={delegate.isOpenModal}
            onOpenChange={(open) =>
              open
                ? delegate.handleOpenModal("")
                : (() => {
                    setShowDelegateAdvanced(false);
                    delegate.handleCloseModal();
                  })()
            }
          >
            <Button onClick={() => delegate.handleOpenModal("")}>Delegate</Button>
            <Dialog.Content size="md">
              <Dialog.Header>Delegate</Dialog.Header>
              <div className="space-y-3 px-4 py-2">
                <div className="space-y-1">
                  <Label>Validator</Label>
                  <select
                    className="w-full border-2 rounded px-3 py-2 bg-background"
                    value={delegate.optionsAdvanced.validator}
                    onChange={(e) =>
                      delegate.handleInputChange("validator", e.target.value)
                    }
                  >
                    <option value="">Select a validator</option>
                    {delegate.validators.map((v) => (
                      <option key={v.operator_address} value={v.operator_address}>
                        {v.description?.moniker || v.operator_address}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={delegate.optionsAdvanced.amount}
                      onChange={(e) =>
                        delegate.handleInputChange("amount", e.target.value)
                      }
                    />
                    <Text className="text-xs text-muted-foreground">
                      Liquid available:{" "}
                      {formatTokenDisplay(
                        { amount: `${availableBalance}`, denom: DENOM },
                        false
                      )}{" "}
                      LUME
                    </Text>
                  </div>
                  <div />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showDelegateAdvanced}
                    onChange={(e) => setShowDelegateAdvanced(e.target.checked)}
                  />
                  Advanced
                </label>
                {showDelegateAdvanced ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label>Gas</Label>
                      <Input
                        value={delegate.optionsAdvanced.gas}
                        onChange={(e) =>
                          delegate.handleInputChange("gas", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Fee</Label>
                      <Input
                        value={delegate.optionsAdvanced.fees}
                        onChange={(e) =>
                          delegate.handleInputChange("fees", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Memo</Label>
                      <Input
                        value={delegate.optionsAdvanced.memo}
                        onChange={(e) =>
                          delegate.handleInputChange("memo", e.target.value)
                        }
                      />
                    </div>
                  </div>
                ) : null}
                {delegate.error ? (
                  <Text className="text-destructive">{delegate.error}</Text>
                ) : null}
                {delegate.transactionHash ? (
                  <div className="rounded border-2 border-green-500 p-3 bg-green-50 text-foreground">
                    <Text as="h6">Delegation submitted</Text>
                    <Text className="break-all text-sm">
                      Tx hash: {delegate.transactionHash}
                    </Text>
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={delegate.handleCloseCongratulationsModal}
                    >
                      Close
                    </Button>
                  </div>
                ) : null}
              </div>
              <Dialog.Footer>
                <Button variant="secondary" onClick={delegate.handleCloseModal}>
                  Cancel
                </Button>
                <Button
                  onClick={delegate.handleSendClick}
                  disabled={delegate.isLoading}
                >
                  {delegate.isLoading ? "Delegating..." : "Delegate"}
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog>
        </Card.Content>
      </Card>

      <Card className="retro-layer">
        <Card.Header>
          <Card.Title>Transactions</Card.Title>
          <Card.Description>Recent history for this account.</Card.Description>
        </Card.Header>
        <Card.Content className="space-y-2">
          {loadingTransactions ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : transactions.length === 0 ? (
            <Text>No transactions found.</Text>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.txhash}
                className="flex items-center justify-between border-2 rounded px-3 py-2"
              >
                <div>
                  <Text as="h6" className="text-primary">
                    {new Date(tx.timestamp).toLocaleString()}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    {tx.tx.body.memo || "No memo"}
                  </Text>
                </div>
                <Text className="text-xs text-muted-foreground">
                  {formatAddress(tx.txhash, 6, -6)}
                </Text>
              </div>
            ))
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default Wallet;
