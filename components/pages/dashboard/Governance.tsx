import { useState } from "react";

import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import { Dialog } from "@/components/retroui/Dialog";
import { Input } from "@/components/retroui/Input";
import { Label } from "@/components/retroui/Label";
import { Text } from "@/components/retroui/Text";
import { VOTE_OPTIONS } from "@/hooks/useProposals";
import { IProposal } from "@/types";

type GovernanceProps = {
  proposals?: IProposal[];
  isLoading?: boolean;
  onOptionChange?: (val: string) => void;
  onVoteClick?: (item: IProposal | null) => void;
  isVoteLoading?: boolean;
  error?: string | null;
  voteAdvanced?: {
    fees: string;
    gas: string;
    memo: string;
    broadcastMode: string;
  };
  handleVoteAdvancedChange?: (name: string, value: string) => void;
  voteTransactionHash?: string;
  onCloseVoteCongratulationsModal?: () => void;
  selectedItem?: IProposal | null;
  setSelectedItem?: (item: IProposal | null) => void;
};

const Governance = ({
  proposals = [],
  isLoading,
  onOptionChange,
  onVoteClick,
  isVoteLoading,
  error,
  voteAdvanced,
  handleVoteAdvancedChange,
  voteTransactionHash,
  onCloseVoteCongratulationsModal,
  selectedItem,
  setSelectedItem,
}: GovernanceProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  return (
    <Card>
      <Card.Header>
        <Card.Title>Active Proposals</Card.Title>
        <Card.Description>
          Review and cast votes on current governance items.
        </Card.Description>
      </Card.Header>
      <Card.Content className="space-y-3">
        {isLoading ? (
          <Text>Loading proposals...</Text>
        ) : proposals.length === 0 ? (
          <Text>No proposals currently in voting period.</Text>
        ) : (
          proposals.slice(0, 3).map((proposal) => (
            <div
              key={proposal.id}
              className="flex items-center justify-between border-2 rounded px-3 py-2"
            >
              <div className="space-y-1 pr-4">
                <Text as="h6" className="text-primary">
                  #{proposal.id} {proposal.title}
                </Text>
                <Text className="text-sm text-muted-foreground line-clamp-2">
                  {proposal.summary || proposal.metadata}
                </Text>
              </div>
              <Button
                size="sm"
                onClick={() => setSelectedItem?.(proposal)}
                className="shrink-0"
              >
                Vote
              </Button>
            </div>
          ))
        )}
      </Card.Content>

      <Dialog
        open={!!selectedItem}
        onOpenChange={(open) => {
          if (!open) {
            setShowAdvanced(false);
            setSelectedItem?.(null);
          }
        }}
      >
        <Dialog.Content size="md">
          <Dialog.Header>
            Vote on {selectedItem ? `#${selectedItem.id}` : ""}
          </Dialog.Header>
          <div className="space-y-4 px-4 py-2">
            {selectedItem ? (
              <>
                <div>
                  <Text as="h5">{selectedItem.title}</Text>
                  <Text className="text-sm text-muted-foreground">
                    {selectedItem.summary}
                  </Text>
                </div>
                <div className="space-y-2">
                  <Label>Choose option</Label>
                  <div className="flex flex-wrap gap-2">
                    {VOTE_OPTIONS.map((opt) => (
                      <Button
                        key={opt.value}
                        variant="outline"
                        size="sm"
                        onClick={() => onOptionChange?.(opt.value)}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showAdvanced}
                    onChange={(e) => setShowAdvanced(e.target.checked)}
                  />
                  Advanced
                </label>
                {showAdvanced ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label>Gas</Label>
                      <Input
                        value={voteAdvanced?.gas ?? ""}
                        onChange={(e) =>
                          handleVoteAdvancedChange?.("gas", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Fees</Label>
                      <Input
                        value={voteAdvanced?.fees ?? ""}
                        onChange={(e) =>
                          handleVoteAdvancedChange?.("fees", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Memo</Label>
                      <Input
                        value={voteAdvanced?.memo ?? ""}
                        onChange={(e) =>
                          handleVoteAdvancedChange?.("memo", e.target.value)
                        }
                      />
                    </div>
                  </div>
                ) : null}
                {error ? (
                  <Text className="text-destructive">{error}</Text>
                ) : null}
                {voteTransactionHash ? (
                  <div className="rounded border-2 border-green-500 p-3 bg-green-50 text-foreground">
                    <Text as="h6">Vote submitted</Text>
                    <Text className="break-all text-sm">
                      Tx hash: {voteTransactionHash}
                    </Text>
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() => onCloseVoteCongratulationsModal?.()}
                    >
                      Close
                    </Button>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
          <Dialog.Footer>
            <Button
              variant="secondary"
              onClick={() => setSelectedItem?.(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => onVoteClick?.(selectedItem ?? null)}
              disabled={isVoteLoading}
            >
              {isVoteLoading ? "Voting..." : "Submit Vote"}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </Card>
  );
};

export default Governance;
