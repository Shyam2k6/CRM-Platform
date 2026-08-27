import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Statistic, List, Tag, Space, Divider, Button, Timeline } from 'antd';
import {
  RiseOutlined, FileDoneOutlined, UserOutlined, FundOutlined,
  DollarOutlined, CreditCardOutlined, SolutionOutlined, RocketOutlined, ScheduleOutlined
} from '@ant-design/icons';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../services/api';

const { Title, Paragraph, Text } = Typography;

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error loading dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  if (loading || !data) {
    return (
      <Card loading={loading} style={{ minHeight: 400 }}>
        Loading Business Analytics...
      </Card>
    );
  }

  const { kpis, charts, feeds } = data;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Business Operations Dashboard</Title>
        <Paragraph type="secondary">Centralized overview of leads, pipeline valuation, project execution, and collections performance.</Paragraph>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Revenue Received"
              value={kpis.totalRevenue}
              formatter={(v) => formatCurrency(v)}
              valueStyle={{ color: '#10b981', fontWeight: 700 }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Payments"
              value={kpis.pendingPayments}
              formatter={(v) => formatCurrency(v)}
              valueStyle={{ color: '#ef4444', fontWeight: 700 }}
              prefix={<CreditCardOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Opportunities"
              value={kpis.activeOpportunities}
              valueStyle={{ color: '#2563eb', fontWeight: 700 }}
              prefix={<RiseOutlined />}
            />
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
              Deals Won: <span style={{ fontWeight: 600 }}>{kpis.wonDeals}</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Projects"
              value={kpis.activeProjects}
              valueStyle={{ color: '#8b5cf6', fontWeight: 700 }}
              prefix={<RocketOutlined />}
            />
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
              Total Leads: <span style={{ fontWeight: 600 }}>{kpis.totalLeads}</span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Revenue Trend Area Chart */}
        <Col xs={24} lg={12}>
          <Card title="Monthly Revenue Cashflow Trend" style={{ height: '100%' }}>
            {charts.trend.length === 0 ? (
              <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                Collect payments to populate cashflow trend
              </div>
            ) : (
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <AreaChart data={charts.trend}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>

        {/* Sales Pipeline Funnel Bar Chart */}
        <Col xs={24} lg={12}>
          <Card title="Sales Pipeline Deal Counts" style={{ height: '100%' }}>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <BarChart data={charts.pipeline}>
                  <XAxis dataKey="stage" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip formatter={(value, name) => [value, name === 'count' ? 'Deals Count' : 'Valuation']} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Project Status Pie Chart */}
        <Col xs={24} md={10} lg={8}>
          <Card title="Project Execution status" style={{ height: '100%' }}>
            <div style={{ width: '100%', height: 250, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={charts.projects}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {charts.projects.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 8 }}>
                {charts.projects.map((entry, index) => (
                  <div key={entry.status} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[index % COLORS.length] }} />
                    <span style={{ fontSize: 11, color: '#475569' }}>{entry.status}: {entry.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Col>

        {/* Recent Transactions List */}
        <Col xs={24} md={14} lg={16}>
          <Card title="Recent Invoice Settlements" style={{ height: '100%' }}>
            <List
              dataSource={feeds.recentPayments}
              locale={{ emptyText: 'No transactions recorded yet' }}
              renderItem={(payment) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<DollarOutlined style={{ color: '#10b981', fontSize: 20 }} />}
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text strong>Invoice {payment.associatedInvoice?.invoiceNumber}</Text>
                        <Text strong style={{ color: '#10b981' }}>+ {formatCurrency(payment.amount)}</Text>
                      </div>
                    }
                    description={
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span>Client: {payment.associatedInvoice?.associatedClient?.companyName} ({payment.paymentMethod})</span>
                        <span>{new Date(payment.paymentDate).toLocaleDateString()}</span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
