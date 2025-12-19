import { useMemo } from "react";

import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import { Dialog } from "@/components/retroui/Dialog";
import { Input } from "@/components/retroui/Input";
import { Label } from "@/components/retroui/Label";
import { Skeleton } from "@/components/retroui/Skeleton";
import { Text } from "@/components/retroui/Text";
import { DENOM } from "@/constant/network";
import { formatTokenDisplay } from "@/lib/format";
import { getPortfolioData } from "../dashboard/Dashboard";
import { AccountInfoData } from "@/hooks/useAccountInfo";
import useDelegate from "@/hooks/useDelegate";
import useRedelegate from "@/hooks/useRedelegate";
import useStaking from "@/hooks/useStaking";
import useUnbond from "@/hooks/useUnbond";
import StakingDetails from "./StakingDetails";

type StakeProps = {
  accountInfo: AccountInfoData | null;
  loadingAccount: boolean;
  staking: ReturnType<typeof useStaking>;
  delegate: ReturnType<typeof useDelegate>;
  unbond: ReturnType<typeof useUnbond>;
  redelegate: ReturnType<typeof useRedelegate>;
};

const Stake = ({
  accountInfo,
  loadingAccount,
  staking,
  delegate,
  unbond,
  redelegate,
}: StakeProps) => {
  const { stacked, liquid } = useMemo(
    () => getPortfolioData(accountInfo),
    [accountInfo]
  );

  const validatorNameMap = useMemo(() => {
    const map = new Map<string, string>();
    delegate.validators.forEach((v) =>
      map.set(v.operator_address, v.description?.moniker || v.operator_address)
    );
    return map;
  }, [delegate.validators]);

  return (
    <div className="space-y-4">
      <StakingDetails
        totalStaked={stacked}
        apr={staking.apr}
        loading={loadingAccount || staking.isAPRLoading}
      />

      <Card className="retro-layer">
        <Card.Header>
          <Card.Title>Stake LUME</Card.Title>
          <Card.Description>
            Delegate to a validator and start earning rewards.
          </Card.Description>
        </Card.Header>
        <Card.Content className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  { amount: `${liquid}`, denom: DENOM },
                  false
                )}{" "}
                LUME
              </Text>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Gas</Label>
              <Input
                value={delegate.optionsAdvanced.gas}
                onChange={(e) => delegate.handleInputChange("gas", e.target.value)}
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
          <Button onClick={delegate.handleSendClick} disabled={delegate.isLoading}>
            {delegate.isLoading ? "Staking..." : "Stake"}
          </Button>
        </Card.Content>
      </Card>

      <Card className="retro-layer">
        <Card.Header>
          <Card.Title>My Delegations</Card.Title>
          <Card.Description>
            Manage existing stakes and move between validators.
          </Card.Description>
        </Card.Header>
        <Card.Content className="space-y-3">
          {loadingAccount ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : accountInfo?.delegations?.length ? (
            accountInfo.delegations.map((delegation) => {
              const validatorAddress = delegation.delegation.validator_address;
              const amount = delegation.balance.amount;
              const validatorName =
                validatorNameMap.get(validatorAddress) || validatorAddress;
              return (
                <div
                  key={`${validatorAddress}-${delegation.delegation.shares}`}
                  className="flex flex-col md:flex-row md:items-center justify-between border-2 rounded px-3 py-2 gap-2"
                >
                  <div>
                    <Text as="h6" className="text-primary">
                      {validatorName}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      {formatTokenDisplay(
                        { amount: amount, denom: DENOM },
                        false
                      )}{" "}
                      LUME staked
                    </Text>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        unbond.handleOpenModal(
                          validatorAddress,
                          amount,
                          validatorName
                        )
                      }
                    >
                      Unbond
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        redelegate.handleOpenModal(
                          validatorAddress,
                          amount,
                          validatorName
                        )
                      }
                    >
                      Redelegate
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <Text>No active delegations yet.</Text>
          )}
        </Card.Content>
      </Card>

      <Card className="retro-layer">
        <Card.Header>
          <Card.Title>Unbonding & Redelegations</Card.Title>
          <Card.Description>
            Track pending unbonding and redelegation operations.
          </Card.Description>
        </Card.Header>
        <Card.Content className="space-y-2">
          {staking.isUnbondingDelegationsLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : staking.unbondingDelegations.length === 0 ? (
            <Text>No pending entries.</Text>
          ) : (
            staking.unbondingDelegations.map((item, idx) => (
              <div
                key={`${item.validator_address}-${idx}`}
                className="flex items-center justify-between border-2 rounded px-3 py-2"
              >
                <div>
                  <Text as="h6">{item.type === "redelegations" ? "Redelegation" : "Unbonding"}</Text>
                  <Text className="text-sm text-muted-foreground">
                    From: {item.validator_src_address || item.validator_address}
                    {item.validator_dst_address
                      ? ` → ${item.validator_dst_address}`
                      : ""}
                  </Text>
                </div>
                <Text className="text-sm">
                  Complete at {new Date(item.completion_time || "").toLocaleString()}
                </Text>
              </div>
            ))
          )}
        </Card.Content>
      </Card>

      <Dialog
        open={unbond.isOpenModal}
        onOpenChange={(open) => (open ? undefined : unbond.handleCloseModal())}
      >
        <Dialog.Content size="md">
          <Dialog.Header>Unbond</Dialog.Header>
          <div className="space-y-3 px-4 py-2">
            <div className="space-y-1">
              <Label>Amount</Label>
              <Input
                type="number"
                value={unbond.optionsAdvanced.amount}
                onChange={(e) =>
                  unbond.handleInputChange("amount", e.target.value)
                }
              />
              <Text className="text-xs text-muted-foreground">
                Available: {unbond.availableAmount} uLUME
              </Text>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Gas</Label>
                <Input
                  value={unbond.optionsAdvanced.gas}
                  onChange={(e) => unbond.handleInputChange("gas", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Fee</Label>
                <Input
                  value={unbond.optionsAdvanced.fees}
                  onChange={(e) =>
                    unbond.handleInputChange("fees", e.target.value)
                  }
                />
              </div>
            </div>
            {unbond.error ? (
              <Text className="text-destructive">{unbond.error}</Text>
            ) : null}
            {unbond.transactionHash ? (
              <div className="rounded border-2 border-green-500 p-3 bg-green-50 text-foreground">
                <Text as="h6">Unbond submitted</Text>
                <Text className="break-all text-sm">
                  Tx hash: {unbond.transactionHash}
                </Text>
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={unbond.handleCloseCongratulationsModal}
                >
                  Close
                </Button>
              </div>
            ) : null}
          </div>
          <Dialog.Footer>
            <Button variant="secondary" onClick={unbond.handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={unbond.handleSendClick} disabled={unbond.isLoading}>
              {unbond.isLoading ? "Unbonding..." : "Unbond"}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>

      <Dialog
        open={redelegate.isOpenModal}
        onOpenChange={(open) =>
          open ? undefined : redelegate.handleCloseModal()
        }
      >
        <Dialog.Content size="md">
          <Dialog.Header>Redelegate</Dialog.Header>
          <div className="space-y-3 px-4 py-2">
            <div className="space-y-1">
              <Label>Destination Validator</Label>
              <select
                className="w-full border-2 rounded px-3 py-2 bg-background"
                value={redelegate.optionsAdvanced.destinationValidator}
                onChange={(e) =>
                  redelegate.handleInputChange("destinationValidator", e.target.value)
                }
              >
                <option value="">Select validator</option>
                {redelegate.validators.map((v) => (
                  <option key={v.operator_address} value={v.operator_address}>
                    {v.description?.moniker || v.operator_address}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Amount</Label>
              <Input
                type="number"
                value={redelegate.optionsAdvanced.amount}
                onChange={(e) =>
                  redelegate.handleInputChange("amount", e.target.value)
                }
              />
              <Text className="text-xs text-muted-foreground">
                Available: {redelegate.availableAmount} uLUME
              </Text>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Gas</Label>
                <Input
                  value={redelegate.optionsAdvanced.gas}
                  onChange={(e) =>
                    redelegate.handleInputChange("gas", e.target.value)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Fee</Label>
                <Input
                  value={redelegate.optionsAdvanced.fees}
                  onChange={(e) =>
                    redelegate.handleInputChange("fees", e.target.value)
                  }
                />
              </div>
            </div>
            {redelegate.error ? (
              <Text className="text-destructive">{redelegate.error}</Text>
            ) : null}
            {redelegate.transactionHash ? (
              <div className="rounded border-2 border-green-500 p-3 bg-green-50 text-foreground">
                <Text as="h6">Redelegation submitted</Text>
                <Text className="break-all text-sm">
                  Tx hash: {redelegate.transactionHash}
                </Text>
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={redelegate.handleCloseCongratulationsModal}
                >
                  Close
                </Button>
              </div>
            ) : null}
          </div>
          <Dialog.Footer>
            <Button variant="secondary" onClick={redelegate.handleCloseModal}>
              Cancel
            </Button>
            <Button
              onClick={redelegate.handleSendClick}
              disabled={redelegate.isLoading}
            >
              {redelegate.isLoading ? "Redelegating..." : "Redelegate"}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </div>
  );
};

export default Stake;
