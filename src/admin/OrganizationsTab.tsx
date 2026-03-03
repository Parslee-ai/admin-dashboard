import { useEffect, useState, useCallback } from 'react';
import {
  Spinner,
  Title2,
  Title3,
  Body1,
  Card,
  CardHeader,
  Badge,
  Button,
  Input,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@fluentui/react-components';
import {
  Search24Regular,
  ArrowClockwise24Regular,
  Play24Regular,
  Building24Regular,
  People24Regular,
  Warning24Regular,
} from '@fluentui/react-icons';
import {
  adminApi,
  OrganizationSummary,
  AdminOrganization,
} from '../services/adminApi';

interface OrganizationsTabProps {
  getAccessToken: () => Promise<string | null>;
}

function OrganizationsTab({ getAccessToken }: OrganizationsTabProps) {
  const [summary, setSummary] = useState<OrganizationSummary | null>(null);
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchSummary = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return;
    try {
      const data = await adminApi.getOrganizationSummary(token);
      setSummary(data);
    } catch (err: unknown) {
      console.error('Failed to fetch organization summary:', err);
    }
  }, [getAccessToken]);

  const fetchOrganizations = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return;
    try {
      setLoading(true);
      const response = await adminApi.listOrganizations(
        token,
        statusFilter || undefined,
        searchTerm || undefined,
        0,
        100
      );
      setOrganizations(response.organizations);
      setError(null);
    } catch (err: unknown) {
      let errorMsg = 'Failed to fetch organizations';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string; details?: string }; status?: number } };
        if (axiosErr.response?.data?.details) {
          errorMsg = `${axiosErr.response.data.error}: ${axiosErr.response.data.details}`;
        } else if (axiosErr.response?.data?.error) {
          errorMsg = axiosErr.response.data.error;
        }
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, statusFilter, searchTerm]);

  useEffect(() => {
    fetchSummary();
    fetchOrganizations();
  }, []);

  useEffect(() => {
    fetchOrganizations();
  }, [statusFilter, searchTerm]);

  const handleRefresh = () => {
    fetchSummary();
    fetchOrganizations();
  };

  const handleViewDetails = (org: AdminOrganization) => {
    window.location.href = `/dashboard/admin/orgs/${org.id}`;
  };

  const handleReactivate = async (org: AdminOrganization) => {
    const token = await getAccessToken();
    if (!token) return;

    try {
      await adminApi.reactivateOrganization(token, org.id);
      handleRefresh();
    } catch (err) {
      console.error('Failed to reactivate organization:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'informative'> = {
      Active: 'success',
      Trial: 'warning',
      Suspended: 'danger',
      Deleted: 'informative',
    };
    return <Badge appearance="filled" color={statusColors[status] || 'informative'}>{status}</Badge>;
  };

  if (loading && organizations.length === 0) {
    return (
      <div className="admin-loading">
        <Spinner size="large" label="Loading organizations..." />
      </div>
    );
  }

  return (
    <div className="organizations-tab">
      {error && (
        <div className="admin-error">
          <Warning24Regular />
          <Body1>{error}</Body1>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="summary-grid">
          <Card className="summary-card">
            <CardHeader
              header={<Title3>Total Organizations</Title3>}
              description={<Body1>All registered organizations</Body1>}
            />
            <div className="summary-value">
              <Building24Regular />
              <span>{summary.totalOrganizations}</span>
            </div>
          </Card>

          <Card className="summary-card">
            <CardHeader
              header={<Title3>Active Organizations</Title3>}
              description={<Body1>Currently active</Body1>}
            />
            <div className="summary-value">
              <Building24Regular />
              <span>{summary.activeOrganizations}</span>
            </div>
          </Card>

          <Card className="summary-card">
            <CardHeader
              header={<Title3>Subscribed Employees</Title3>}
              description={<Body1>Total AIEs across all orgs</Body1>}
            />
            <div className="summary-value">
              <People24Regular />
              <span>{summary.totalSubscribedEmployees}</span>
            </div>
          </Card>

          <Card className="summary-card status-breakdown">
            <CardHeader header={<Title3>Status Breakdown</Title3>} />
            <div className="status-list">
              <div className="status-item">
                <Badge color="success">Active</Badge>
                <span>{summary.activeOrganizations}</span>
              </div>
              <div className="status-item">
                <Badge color="warning">Trial</Badge>
                <span>{summary.trialOrganizations}</span>
              </div>
              <div className="status-item">
                <Badge color="danger">Suspended</Badge>
                <span>{summary.suspendedOrganizations}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Organizations Table */}
      <div className="subscriptions-section">
        <div className="section-header">
          <Title2>Organizations</Title2>
          <Button icon={<ArrowClockwise24Regular />} onClick={handleRefresh} appearance="subtle">
            Refresh
          </Button>
        </div>

        <div className="filters-row">
          <Input
            placeholder="Search by name, ID, or billing email..."
            contentBefore={<Search24Regular />}
            value={searchTerm}
            onChange={(e, data) => setSearchTerm(data.value)}
            className="search-input"
          />
          <Select
            value={statusFilter}
            onChange={(e, data) => setStatusFilter(data.value)}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Trial">Trial</option>
            <option value="Suspended">Suspended</option>
            <option value="Deleted">Deleted</option>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Organization</TableHeaderCell>
              <TableHeaderCell>ID</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>AIEs</TableHeaderCell>
              <TableHeaderCell>Spend</TableHeaderCell>
              <TableHeaderCell>Created</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.map(org => (
              <TableRow
                key={org.id}
                className="clickable-row"
                onClick={() => handleViewDetails(org)}
                style={{ cursor: 'pointer' }}
              >
                <TableCell>{org.displayName || org.name}</TableCell>
                <TableCell><code>{org.id}</code></TableCell>
                <TableCell>{getStatusBadge(org.status)}</TableCell>
                <TableCell>{org.subscribedEmployeeCount}</TableCell>
                <TableCell>{formatCurrency(org.currentMonthSpend)}</TableCell>
                <TableCell>{formatDate(org.createdAt)}</TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <div className="action-buttons">
                    {org.status === 'Suspended' && (
                      <Button
                        icon={<Play24Regular />}
                        size="small"
                        title="Reactivate"
                        onClick={() => handleReactivate(org)}
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default OrganizationsTab;
