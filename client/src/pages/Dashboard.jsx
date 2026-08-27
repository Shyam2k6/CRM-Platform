import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Spin, Alert, Button, Space, Timeline, Tag, Typography, Divider } from 'antd';
import { 
  TeamOutlined, 
  ContactsOutlined, 
  LineChartOutlined, 
  TrophyOutlined, 
  ProjectOutlined, 
  DollarOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import api from '../services/api';

const { Title, Paragraph, Text } = Typography;

const Dashboard = () => {
  const [health, setHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [healthError, setHealthError] = useState(null);

  const checkHealth = async () => {
    setLoadingHealth(true);
    setHealthError(null);
    try {
      const response = await api.get('/health');
      setHealth(response);
    } catch (error) {
      setHealthError(error.message || 'Unable to connect to the API server.');
      setHealth(null);
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const stats = [
    { title: 'Total Leads', value: 124, icon: <TeamOutlined style={{ color: '#3b82f6' }} />, suffix: '+12%' },
    { title: 'Active Opportunities', value: 45, icon: <LineChartOutlined style={{ color: '#f59e0b' }} />, suffix: '+8%' },
    { title: 'Total Clients', value: 38, icon: <ContactsOutlined style={{ color: '#10b981' }} />, suffix: '+4%' },
    { title: 'Won Deals', value: 18, icon: <TrophyOutlined style={{ color: '#8b5cf6' }} />, suffix: '₹3,40,000' },
    { title: 'Active Projects', value: 12, icon: <ProjectOutlined style={{ color: '#06b6d4' }} />, suffix: '75% avg prog' },
    { title: 'Total Revenue', value: '₹5,60,000', icon: <DollarOutlined style={{ color: '#10b981' }} />, isCurrency: true },
    { title: 'Pending Payments', value: '₹1,20,000', icon: <ClockCircleOutlined style={{ color: '#ef4444' }} />, isCurrency: true },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          Welcome back, <span className="gradient-text">Demo Admin</span>
        </Title>
        <Paragraph type="secondary">
          Here is an overview of your business operations and system status.
        </Paragraph>
      </div>

      {/* KPI Cards Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} md={8} lg={6} xl={index < 4 ? 6 : 8} key={index}>
            <Card className="glass-card" bordered={false}>
              <Statistic
                title={
                  <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: 14 }}>{stat.title}</Text>
                    {stat.icon}
                  </Space>
                }
                value={stat.value}
                precision={stat.isCurrency ? 0 : 0}
                valueStyle={{ fontSize: 24, fontWeight: 'bold' }}
                suffix={
                  stat.suffix && (
                    <Text type={stat.suffix.includes('+') ? 'success' : 'secondary'} style={{ fontSize: 12, marginLeft: 8 }}>
                      {stat.suffix}
                    </Text>
                  )
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[24, 24]}>
        {/* MERN Stack Integration (API Status Card) */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <DatabaseOutlined style={{ color: '#4f46e5' }} />
                <span>MERN Foundation Health Status</span>
              </Space>
            } 
            className="glass-card" 
            style={{ height: '100%' }}
            extra={
              <Button 
                type="primary" 
                size="small" 
                icon={<SyncOutlined spin={loadingHealth} />} 
                onClick={checkHealth}
              >
                Reload
              </Button>
            }
          >
            {loadingHealth ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 180 }}>
                <Spin size="large" tip="Querying Backend..." />
              </div>
            ) : healthError ? (
              <Alert
                message="API Connection Error"
                description={
                  <div>
                    <p>{healthError}</p>
                    <p style={{ fontSize: '12px' }}>
                      Ensure you have started the backend API server by navigating to <code>server/</code> and running <code>npm run dev</code>.
                    </p>
                  </div>
                }
                type="error"
                showIcon
                icon={<ExclamationCircleOutlined />}
              />
            ) : health ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Alert
                  message="Foundation Operational"
                  description="Frontend React application successfully connected to Express API Server."
                  type="success"
                  showIcon
                  icon={<CheckCircleOutlined />}
                />
                
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card size="small" bordered={false} style={{ background: '#f8fafc' }}>
                      <Statistic title="Server Status" value={health.status} valueStyle={{ color: '#10b981', fontWeight: 'bold' }} />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" bordered={false} style={{ background: '#f8fafc' }}>
                      <Statistic title="Database Connectivity" value={health.dbStatus || 'Connected'} valueStyle={{ color: '#10b981', fontWeight: 'bold' }} />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" bordered={false} style={{ background: '#f8fafc' }}>
                      <Statistic title="Environment" value={health.environment || 'development'} valueStyle={{ textTransform: 'capitalize' }} />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" bordered={false} style={{ background: '#f8fafc' }}>
                      <Statistic title="Port" value={5000} />
                    </Card>
                  </Col>
                </Row>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>No health data loaded.</div>
            )}
          </Card>
        </Col>

        {/* Business Activities and Next Steps */}
        <Col xs={24} lg={12}>
          <Card title="Module Development Timeline" className="glass-card" style={{ height: '100%' }}>
            <Paragraph>
              This CRM is built step-by-step using a modular workflow structure. The system connects business operations across roles.
            </Paragraph>
            <Divider style={{ margin: '12px 0' }} />
            <Timeline
              items={[
                {
                  color: 'green',
                  children: (
                    <>
                      <Text strong>Module 0: Foundation Setup (Current)</Text>
                      <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                        Express server configurations, MongoDB connection, basic styling layout, health endpoints, and build scripts.
                      </p>
                    </>
                  ),
                },
                {
                  color: 'gray',
                  children: (
                    <>
                      <Text strong>Module 1: Authentication & Users</Text>
                      <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                        Create profiles, enable role-based login (Admin, Sales, Finance, Project Manager, Employee).
                      </p>
                    </>
                  ),
                },
                {
                  color: 'gray',
                  children: (
                    <>
                      <Text strong>Module 2 & 3: Lead & Opportunity Management</Text>
                      <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                        Capture business leads, create pipeline sales stages, move opportunities through sales stages.
                      </p>
                    </>
                  ),
                },
                {
                  color: 'gray',
                  children: (
                    <>
                      <Text strong>Module 4 to 9: Operations, Projects & Finance</Text>
                      <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                        Quotations generation, client conversion, projects creation, task management, invoice invoicing, and payment processing.
                      </p>
                    </>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
