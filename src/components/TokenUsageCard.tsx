import {
  Card,
  CardHeader,
  Body1,
  Caption1,
  ProgressBar,
} from '@fluentui/react-components';
import { DataUsageRegular } from '@fluentui/react-icons';
import type { TokenUsageDto } from '../models/types';

interface TokenUsageCardProps {
  tokenUsage: TokenUsageDto;
}

export const TokenUsageCard: React.FC<TokenUsageCardProps> = ({ tokenUsage }) => {
  const formatNumber = (num: number): string => {
    return (num ?? 0).toLocaleString('en-US');
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount ?? 0);
  };

  // Handle both PascalCase (API) and camelCase (expected) field names
  const t = tokenUsage as any;
  const tokensRemaining = t.tokensRemaining ?? t.TotalTokensIncluded - t.TokensUsedThisMonth ?? 0;
  const totalAllocated = t.totalTokensAllocated ?? t.TotalTokensIncluded ?? 0;
  const tokensUsed = t.tokensUsed ?? t.TokensUsedThisMonth ?? 0;
  const usagePercentage = t.usagePercentage ?? (totalAllocated > 0 ? (tokensUsed / totalAllocated) * 100 : 0);
  const overage = t.overage ?? Math.max(0, tokensUsed - totalAllocated);
  const estimatedCost = t.estimatedCost ?? (overage > 0 ? overage * 0.00001 : 0);
  const employeeBreakdown = t.employeeBreakdown ?? t.UsageBreakdown ?? [];

  return (
    <Card>
      <CardHeader
        image={<DataUsageRegular fontSize={24} />}
        header={<Body1><b>Token Usage</b></Body1>}
        description={
          <Caption1>
            {formatNumber(tokensRemaining)} of {formatNumber(totalAllocated)} remaining
          </Caption1>
        }
      />

      <div style={{ padding: '16px' }}>
        <ProgressBar
          value={Math.min(usagePercentage / 100, 1)}
          max={1}
          style={{ marginBottom: '16px' }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <Caption1>Used</Caption1>
            <Body1>{formatNumber(tokensUsed)}</Body1>
          </div>
          <div>
            <Caption1>Overage</Caption1>
            <Body1>{overage > 0 ? formatNumber(overage) : '-'}</Body1>
          </div>
          <div>
            <Caption1>Usage %</Caption1>
            <Body1>{usagePercentage.toFixed(1)}%</Body1>
          </div>
          <div>
            <Caption1>Estimated Cost</Caption1>
            <Body1>{formatCurrency(estimatedCost)}</Body1>
          </div>
        </div>

        {Array.isArray(employeeBreakdown) && employeeBreakdown.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <Caption1><b>Top Consumers</b></Caption1>
            {employeeBreakdown.slice(0, 3).map((emp: any) => (
              <div
                key={emp.employeeId ?? emp.EmployeeId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '4px 0',
                }}
              >
                <Caption1>{emp.employeeName ?? emp.EmployeeName}</Caption1>
                <Caption1>{formatNumber(emp.tokensUsed ?? emp.TokensUsed ?? 0)} ({(emp.percentageOfTotal ?? 0).toFixed(1)}%)</Caption1>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
