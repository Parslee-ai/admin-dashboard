import {
  Card,
  CardHeader,
  Body1,
  Caption1,
  Badge,
  tokens,
} from '@fluentui/react-components';
import { HeartPulseRegular } from '@fluentui/react-icons';
import type { HealthStatusDto } from '../models/types';

interface HealthStatusCardProps {
  healthStatus: HealthStatusDto[];
}

export const HealthStatusCard: React.FC<HealthStatusCardProps> = ({ healthStatus = [] }) => {
  // API may return status as int enum or string
  const statusToString = (s: any): string => {
    if (typeof s === 'string') return s;
    // Map common enum values: 0=Unknown, 1=Healthy, 2=Degraded, 3=Unhealthy
    const map: Record<number, string> = { 0: 'Unknown', 1: 'Healthy', 2: 'Degraded', 3: 'Unhealthy' };
    return map[s] ?? `Status ${s}`;
  };

  const getStatusBadge = (status: any) => {
    const str = statusToString(status);
    const color = str.toLowerCase() === 'healthy' ? 'success' : str.toLowerCase() === 'degraded' ? 'warning' : 'danger';
    return <Badge color={color}>{str}</Badge>;
  };

  // Determine overall status (worst status across all services)
  const overallStatus = healthStatus.length === 0
    ? 'Unknown'
    : healthStatus.some(s => statusToString(s.status).toLowerCase() === 'unhealthy')
      ? 'Unhealthy'
      : healthStatus.some(s => statusToString(s.status).toLowerCase() === 'degraded')
        ? 'Degraded'
        : 'Healthy';

  const lastCheck = healthStatus.length > 0
    ? new Date(healthStatus[0].lastCheckedAt).toLocaleString()
    : 'Never';

  return (
    <Card>
      <CardHeader
        image={<HeartPulseRegular fontSize={24} />}
        header={<Body1><b>System Health</b></Body1>}
        description={<Caption1>Last check: {lastCheck}</Caption1>}
      />

      <div style={{ padding: '16px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Body1>Overall Status:</Body1>
            {getStatusBadge(overallStatus)}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '8px' }}>
          {healthStatus.map((service) => (
            <div
              key={service.serviceName}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
              }}
            >
              <div>
                <Caption1>{service.serviceName}</Caption1>
                {service.message && (
                  <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                    {service.message}
                  </Caption1>
                )}
              </div>
              {getStatusBadge(service.status)}
            </div>
          ))}
        </div>

        {healthStatus.length === 0 && (
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <Caption1>No health data available</Caption1>
          </div>
        )}
      </div>
    </Card>
  );
};
