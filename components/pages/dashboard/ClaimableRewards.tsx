import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import { Dialog } from "@/components/retroui/Dialog";
import { Input } from "@/components/retroui/Input";
import { Label } from "@/components/retroui/Label";
import { Text } from "@/components/retroui/Text";
import { DENOM } from "@/constant/network";
import { formatTokenDisplay } from "@/lib/format";

type ClaimableRewardsProps = {
  totalRewards: string;
  claimInfo: {
    senderAddress: string;
    fees: string;
    gas: string;
    memo: string;
    totalRewards: string;
  };
  isOpen: boolean;
  isLoading: boolean;
  error?: string | null;
  transactionHash?: string;
  onOpen: () => void;
  onClose: () => void;
  onChange?: (name: string, value: string) => void;
  onClaim: () => void;
  onCloseCongratulations?: () => void;
};

const ClaimableRewards = ({
  totalRewards,
  claimInfo,
  isOpen,
  isLoading,
  error,
  transactionHash,
  onOpen,
  onClose,
  onChange,
  onClaim,
  onCloseCongratulations,
}: ClaimableRewardsProps) => {
  const formattedRewards = formatTokenDisplay(
    {
      amount: totalRewards,
      denom: DENOM,
    },
    false,
    "0,0.[000000]"
  );

  return (
    <Card>
      <Card.Header>
        <Card.Title>Claimable Rewards</Card.Title>
        <Card.Description>
          Rewards from all validators currently delegated.
        </Card.Description>
      </Card.Header>

      <Card.Content className="space-y-3">
        <Text as="h4">{formattedRewards} LUME</Text>
        <Dialog open={isOpen} onOpenChange={(open) => (open ? onOpen() : onClose())}>
          <Dialog.Trigger asChild>
            <Button disabled={Number(totalRewards) <= 0} onClick={onOpen}>
              Claim All Rewards
            </Button>
          </Dialog.Trigger>
          <Dialog.Content size="md">
            <Dialog.Header>Claim Rewards</Dialog.Header>
            <div className="space-y-3 px-4 py-2">
              <div>
                <Label>Total rewards</Label>
                <Text as="h5">
                  {formattedRewards} {DENOM.replace("u", "").toUpperCase()}
                </Text>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Gas</Label>
                  <Input
                    value={claimInfo.gas}
                    onChange={(e) =>
                      onChange?.("gas", e.target.value || claimInfo.gas)
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Fees</Label>
                  <Input
                    value={claimInfo.fees}
                    onChange={(e) =>
                      onChange?.("fees", e.target.value || claimInfo.fees)
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Memo</Label>
                <Input
                  value={claimInfo.memo}
                  onChange={(e) => onChange?.("memo", e.target.value)}
                />
              </div>
              {error ? (
                <Text as="span" className="text-destructive">
                  {error}
                </Text>
              ) : null}
              {transactionHash ? (
                <div className="rounded border-2 border-green-500 p-3 bg-green-50 text-foreground">
                  <Text as="h6">Rewards claimed</Text>
                  <Text as="p" className="break-all text-sm">
                    Tx hash: {transactionHash}
                  </Text>
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={() => onCloseCongratulations?.()}
                  >
                    Close
                  </Button>
                </div>
              ) : null}
            </div>
            <Dialog.Footer>
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={onClaim} disabled={isLoading}>
                {isLoading ? "Claiming..." : "Confirm Claim"}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog>
      </Card.Content>
    </Card>
  );
};

export default ClaimableRewards;
