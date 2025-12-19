import { Card } from "@/components/retroui/Card";
import { Text } from "@/components/retroui/Text";
import { DENOM } from "@/constant/network";
import { formatTokenDisplay } from "@/lib/format";

type StakingDetailsProps = {
  totalStaked: number;
  apr: number;
  loading?: boolean;
};

const StakingDetails = ({ totalStaked, apr, loading = false }: StakingDetailsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="">
        <Card.Header>
          <Card.Title>Total Staked LUME</Card.Title>
        </Card.Header>

        <Card.Content>
          {loading ? (
            <Text>Loading...</Text>
          ) : (
            <Text as="h5">
              {formatTokenDisplay(
                {
                  amount: `${totalStaked}`,
                  denom: DENOM,
                },
                false
              )}{" "}
              LUME
            </Text>
          )}
        </Card.Content>
      </Card>
      <Card className="">
        <Card.Header>
          <Card.Title>Staking Rewards APR</Card.Title>
        </Card.Header>

        <Card.Content>
          {loading ? (
            <Text>Loading...</Text>
          ) : (
            <Text as="h5">{apr.toFixed(2)} %</Text>
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default StakingDetails;
