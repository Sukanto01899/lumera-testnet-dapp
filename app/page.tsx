"use client";

import Dashboard from "@/components/pages/dashboard/Dashboard";
import useAccountInfo from "@/hooks/useAccountInfo";
import useProposals from "@/hooks/useProposals";
import useRecentActivity from "@/hooks/useRecentActivity";
import useWalletConnect from "@/hooks/useWalletConnect";
import { IProposal } from "@/types";
import { useMemo, useState } from "react";

export default function DashboardPage() {
  const [selectedItem, setSelectedItem] = useState<IProposal | null>(null);
  const { address } = useWalletConnect();
  const {
    accountInfo,
    loading,
    handleClaimButtonClick,
    isClaimLoading,
    claimInfo,
    errorClaim,
    handleClaimChange,
    handleToggleClaimModal,
    isClaimModalOpen,
    transactionHash,
    handleCloseCongratulationsModal,
  } = useAccountInfo();
  const proposals = useProposals({
    customMemo: selectedItem?.title ? `Vote for the ${selectedItem?.title}` : "",
  });
  const recentActivityData = useRecentActivity();

  const totalRewards = useMemo(
    () => claimInfo.totalRewards,
    [claimInfo.totalRewards]
  );
  return (
    <Dashboard
      accountInfo={accountInfo}
      loading={loading}
      isClaimLoading={isClaimLoading}
      handleClaimChange={handleClaimChange}
      claimInfo={claimInfo}
      errorClaim={errorClaim}
      handleToggleClaimModal={handleToggleClaimModal}
      isClaimModalOpen={isClaimModalOpen}
      transactionHash={transactionHash}
      onCloseCongratulationsModal={handleCloseCongratulationsModal}
      address={address}
      onClaimButtonClick={handleClaimButtonClick}
      proposals={proposals.proposalsInfo}
      isProposalLoading={proposals.loading}
      recentActivities={recentActivityData.recentActivity}
      isRecentActivityLoading={recentActivityData.loading}
      onOptionChange={proposals.handleOptionChange}
      onVoteClick={proposals.handleVote}
      voteTransactionHash={proposals.transactionHash}
      onCloseVoteCongratulationsModal={proposals.handleCloseCongratulationsModal}
      isVoteLoading={proposals.isVoteLoading}
      error={proposals.errorVote}
      voteAdvanced={proposals.voteAdvanced}
      handleVoteAdvancedChange={proposals.handleVoteAdvancedChange}
      selectedItem={selectedItem}
      setSelectedItem={setSelectedItem}
      totalRewards={totalRewards}
    />
  );
}
