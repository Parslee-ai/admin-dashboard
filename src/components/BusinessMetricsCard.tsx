import {
  Card,
  CardHeader,
  Body1,
  Caption1,
  tokens,
} from '@fluentui/react-components';
import { ChartMultipleRegular } from '@fluentui/react-icons';
import type { BusinessMetricsDto } from '../models/types';

interface BusinessMetricsCardProps {
  businessMetrics: BusinessMetricsDto[];
}

export const BusinessMetricsCard: React.FC<BusinessMetricsCardProps> = ({ businessMetrics = [] }) => {
  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US');
  };

  const formatValue = (value: number, metricName: string): string => {
    // Format based on metric type
    if (metricName.includes('rate') || metricName.includes('percentage')) {
      return `${(value * 100).toFixed(1)}%`;
    }
    if (metricName.includes('time') || metricName.includes('latency')) {
      return `${value.toFixed(0)} ms`;
    }
    return formatNumber(value);
  };

  return (
    <Card>
      <CardHeader
        image={<ChartMultipleRegular fontSize={24} />}
        header={<Body1><b>Business Metrics</b></Body1>}
        description={<Caption1>Analytics from external sources</Caption1>}
      />

      <div style={{ padding: '16px' }}>
        {businessMetrics.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <Caption1>No metrics available</Caption1>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {businessMetrics.map((metric, index) => (
              <div
                key={`${metric.source}-${metric.metricName}-${metric.timestamp}-${index}`}
                style={{
                  padding: '8px 0',
                  borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <Caption1 style={{ fontWeight: 600 }}>{metric.metricName}</Caption1>
                  <Body1>{formatValue(metric.value, metric.metricName)}</Body1>
                </div>
                <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                  {metric.source} • {new Date(metric.timestamp).toLocaleString()}
                </Caption1>
                {metric.dimensions && Object.keys(metric.dimensions).length > 0 && (
                  <Caption1 style={{ color: tokens.colorNeutralForeground3, marginTop: '4px' }}>
                    {Object.entries(metric.dimensions).map(([key, value]) => `${key}: ${value}`).join(', ')}
                  </Caption1>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
