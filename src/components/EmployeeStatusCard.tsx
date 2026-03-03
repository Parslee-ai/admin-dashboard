import {
  Card,
  CardHeader,
  Body1,
  Caption1,
  Badge,
  tokens,
} from '@fluentui/react-components';
import { PersonRegular } from '@fluentui/react-icons';
import type { EmployeeStatusDto } from '../models/types';

interface EmployeeStatusCardProps {
  employees: EmployeeStatusDto[];
}

export const EmployeeStatusCard: React.FC<EmployeeStatusCardProps> = ({ employees = [] }) => {
  // API may return status as int enum or string
  const statusToString = (s: any): string => {
    if (typeof s === 'string') return s;
    const map: Record<number, string> = { 0: 'Inactive', 1: 'Active', 2: 'Idle', 3: 'Busy' };
    return map[s] ?? `Status ${s}`;
  };

  const getStatusBadge = (status: any) => {
    const str = statusToString(status);
    const color = str.toLowerCase() === 'active' ? 'success'
      : str.toLowerCase() === 'idle' ? 'warning'
      : str.toLowerCase() === 'busy' ? 'important'
      : 'subtle';
    return <Badge color={color}>{str}</Badge>;
  };

  return (
    <Card>
      <CardHeader
        image={<PersonRegular fontSize={24} />}
        header={<Body1><b>AI Employees</b></Body1>}
        description={<Caption1>{employees.length} employees</Caption1>}
      />

      <div style={{ padding: '16px' }}>
        {employees.map((employee) => (
          <div
            key={employee.employeeId}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
            }}
          >
            <div>
              <Body1>{employee.employeeName}</Body1>
              <Caption1>
                {employee.employeeLevel} • {employee.currentConversationCount} active
              </Caption1>
            </div>
            {getStatusBadge(employee.status)}
          </div>
        ))}
      </div>
    </Card>
  );
};
