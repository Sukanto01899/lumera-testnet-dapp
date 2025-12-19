import { AccountInfoData, IProposal, IRecentActivity } from "@/types";
import React from "react";
import Portfolio from "./Portfolio";
import TotalBalance from "./TotalBalance";
import ClaimableRewards from "./ClaimableRewards";
import RecentActivity from "./RecentActivity";
import Governance from "./Governance";

interface IDashboard {
  address: string;
  loading: boolean;
  accountInfo: AccountInfoData | null;
  proposals?: IProposal[];
  isProposalLoading?: boolean;
  recentActivities?: IRecentActivity[];
  isRecentActivityLoading?: boolean;
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
  onClaimButtonClick: () => void;
  isClaimLoading?: boolean;
  claimInfo: {
    senderAddress: string;
    fees: string;
    gas: string;
    memo: string;
    totalRewards: string;
  };
  errorClaim: string | null;
  handleClaimChange?: (name: string, value: string) => void;
  handleToggleClaimModal: (status: boolean) => void;
  isClaimModalOpen?: boolean;
  transactionHash?: string;
  onCloseCongratulationsModal?: () => void;
  voteTransactionHash?: string;
  onCloseVoteCongratulationsModal?: () => void;
  selectedItem?: IProposal | null;
  setSelectedItem?: (item: IProposal | null) => void;
  totalRewards: string;
}

export const getPortfolioData = (accountInfo: AccountInfoData | null) => {
  let stacked = 0;
  let liquid = 0;
  if (accountInfo) {
    stacked = accountInfo.delegations.reduce(
      (total, item) => Number(item.balance.amount) + total,
      0
    );
    liquid = accountInfo.balances.reduce(
      (total, item) => Number(item.amount) + total,
      0
    );
  }
  return {
    stacked,
    liquid,
  };
};

const Dashboard = ({
  accountInfo,
  loading,
  proposals,
  isProposalLoading,
  recentActivities,
  isRecentActivityLoading,
  onOptionChange,
  onVoteClick,
  isVoteLoading,
  error,
  voteAdvanced,
  handleVoteAdvancedChange,
  onClaimButtonClick,
  isClaimLoading,
  claimInfo,
  errorClaim,
  handleClaimChange,
  handleToggleClaimModal,
  isClaimModalOpen,
  transactionHash,
  onCloseCongratulationsModal,
  voteTransactionHash,
  onCloseVoteCongratulationsModal,
  selectedItem,
  setSelectedItem,
  totalRewards,
}: IDashboard) => {
  return (
    <div className="space-y-4">
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
        <Portfolio accountInfo={accountInfo} loading={loading} />
        <TotalBalance accountInfo={accountInfo} loading={loading} />
      </div>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
        <ClaimableRewards
          totalRewards={totalRewards}
          claimInfo={claimInfo}
          onOpen={() => handleToggleClaimModal(true)}
          onClose={() => handleToggleClaimModal(false)}
          onChange={handleClaimChange}
          onClaim={onClaimButtonClick}
          isOpen={!!isClaimModalOpen}
          isLoading={!!isClaimLoading}
          error={errorClaim}
          transactionHash={transactionHash}
          onCloseCongratulations={onCloseCongratulationsModal}
        />
        <Governance
          proposals={proposals}
          isLoading={isProposalLoading}
          onOptionChange={onOptionChange}
          onVoteClick={onVoteClick}
          isVoteLoading={isVoteLoading}
          error={error}
          voteAdvanced={voteAdvanced}
          handleVoteAdvancedChange={handleVoteAdvancedChange}
          voteTransactionHash={voteTransactionHash}
          onCloseVoteCongratulationsModal={onCloseVoteCongratulationsModal}
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
        />
      </div>
      <RecentActivity
        recentActivities={recentActivities}
        loading={!!isRecentActivityLoading}
      />
    </div>
  );
};

export default Dashboard;
