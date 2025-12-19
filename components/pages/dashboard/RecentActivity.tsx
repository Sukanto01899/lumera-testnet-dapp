import { Card } from "@/components/retroui/Card";
import { Text } from "@/components/retroui/Text";
import { formatAddress } from "@/lib/format";
import { getMessages } from "@/utils/helpers";
import { IRecentActivity } from "@/types";

type RecentActivityProps = {
  recentActivities?: IRecentActivity[];
  loading?: boolean;
};

const RecentActivity = ({
  recentActivities = [],
  loading = false,
}: RecentActivityProps) => {
  return (
    <Card>
      <Card.Header>
        <Card.Title>Recent Activity</Card.Title>
        <Card.Description>
          Latest on-chain actions broadcast from this wallet.
        </Card.Description>
      </Card.Header>

      <Card.Content className="space-y-3">
        {loading ? (
          <Text>Loading...</Text>
        ) : recentActivities.length === 0 ? (
          <Text>No recent transactions yet.</Text>
        ) : (
          recentActivities.map((activity) => {
            const typeLabel = getMessages(activity.tx.body.messages);
            return (
              <div
                key={activity.txhash}
                className="flex items-center justify-between border-2 rounded px-3 py-2"
              >
                <div className="space-y-1">
                  <Text as="h6" className="text-primary">
                    {typeLabel || "Transaction"}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleString()}
                  </Text>
                </div>
                <div className="text-right">
                  <Text className="text-xs text-muted-foreground">
                    {formatAddress(activity.txhash, 6, -6)}
                  </Text>
                  <Text className="text-xs">
                    Gas: {activity.gas_used} / {activity.gas_wanted}
                  </Text>
                </div>
              </div>
            );
          })
        )}
      </Card.Content>
    </Card>
  );
};

export default RecentActivity;
