import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Tabs, Row, Col, Typography, Descriptions, Tag, Button, Empty, Timeline, Space, Form, Input, Select, message } from 'antd';
import { ArrowLeftOutlined, MailOutlined, PhoneOutlined, HomeOutlined, PlusOutlined, PhoneFilled } from '@ant-design/icons';
import api from '../services/api';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const Client360 = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Quotations/Projects/Invoices lists (to be expanded in later modules)
  const [quotations, setQuotations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);

  const fetchClientData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Client Details
      const clientRes = await api.get(`/clients/${id}`);
      if (clientRes.data.success) {
        const clientData = clientRes.data.data;
        setClient(clientData);

        // 2. Fetch associated opportunities
        const oppRes = await api.get('/opportunities', { params: { search: clientData.companyName } });
        if (oppRes.data.success) {
          setOpportunities(oppRes.data.data);
        }

        // 3. Fetch associated activities
        const actRes = await api.get('/activities', {
          params: { associatedId: id, associatedType: 'Client' }
        });
        if (actRes.data.success) {
          setActivities(actRes.data.data);
        }

        // 4. Fetch associated quotations
        try {
          const quotRes = await api.get(`/quotations?clientId=${id}`);
          if (quotRes.data.success) setQuotations(quotRes.data.data);
        } catch (e) { console.log('Quotations not yet fully loaded'); }

        // 5. Fetch associated projects
        try {
          const projRes = await api.get(`/projects?clientId=${id}`);
          if (projRes.data.success) setProjects(projRes.data.data);
        } catch (e) { console.log('Projects not yet fully loaded'); }

        // 6. Fetch associated invoices
        try {
          const invRes = await api.get(`/invoices?clientId=${id}`);
          if (invRes.data.success) setInvoices(invRes.data.data);
        } catch (e) { console.log('Invoices not yet fully loaded'); }
      }
    } catch (err) {
      console.error(err);
      message.error('Failed to load client profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientData();
  }, [id]);

  const handleLogActivity = async (values) => {
    try {
      const payload = {
        ...values,
        associatedId: id,
        associatedType: 'Client'
      };
      const res = await api.post('/activities', payload);
      if (res.data.success) {
        message.success('Activity logged on Client file');
        form.resetFields();
        // Refresh activities timeline
        const actRes = await api.get('/activities', {
          params: { associatedId: id, associatedType: 'Client' }
        });
        if (actRes.data.success) setActivities(actRes.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!client) {
    return (
      <Card loading={loading}>
        <Empty description="Loading Client Profile..." />
      </Card>
    );
  }

  const items = [
    {
      key: '1',
      label: 'Overview',
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} md={16}>
            <Card title="Client Profile Details" bordered={false}>
              <Descriptions column={1} bordered size="middle">
                <Descriptions.Item label="Company Name">{client.companyName}</Descriptions.Item>
                <Descriptions.Item label="Contact Person">{client.contactPerson}</Descriptions.Item>
                <Descriptions.Item label="Email Address">{client.email}</Descriptions.Item>
                <Descriptions.Item label="Phone Number">{client.phone || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Office Address">{client.address || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Relationship Established">
                  {new Date(client.createdAt).toLocaleDateString()}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="Quick Stats" bordered={false}>
              <Descriptions column={1}>
                <Descriptions.Item label="Active Deals">{opportunities.filter(o => !['Won', 'Lost'].includes(o.stage)).length}</Descriptions.Item>
                <Descriptions.Item label="Won Opportunities">{opportunities.filter(o => o.stage === 'Won').length}</Descriptions.Item>
                <Descriptions.Item label="Invoices Due">₹0.00</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: '2',
      label: 'Deals & Opportunities',
      children: (
        <Card title="Associated Deals" bordered={false}>
          {opportunities.length === 0 ? (
            <Empty description="No opportunities logged for this client" />
          ) : (
            <Row gutter={[16, 16]}>
              {opportunities.map(opp => (
                <Col xs={24} sm={12} key={opp._id}>
                  <Card size="small" title={opp.title} extra={<Tag color={opp.stage === 'Won' ? 'success' : opp.stage === 'Lost' ? 'error' : 'blue'}>{opp.stage}</Tag>}>
                    <div>Value: <span style={{ fontWeight: 600 }}>₹{opp.dealValue.toLocaleString()}</span></div>
                    <div>Probability: {opp.probability}%</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>Owner: {opp.assignedSalesperson?.name || 'Unassigned'}</div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card>
      )
    },
    {
      key: '3',
      label: 'Activities Feed',
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} md={10}>
            <Card title="Log Client Activity" bordered={false}>
              <Form form={form} layout="vertical" onFinish={handleLogActivity} initialValues={{ type: 'Call' }}>
                <Form.Item name="title" label="Subject" rules={[{ required: true, message: 'Please input a subject!' }]}>
                  <Input placeholder="e.g. Discussed proposal review" />
                </Form.Item>
                <Form.Item name="type" label="Activity Type">
                  <Select>
                    <Option value="Call">Call</Option>
                    <Option value="Email">Email</Option>
                    <Option value="Meeting">Meeting</Option>
                    <Option value="Note">Note</Option>
                  </Select>
                </Form.Item>
                <Form.Item name="description" label="Details">
                  <TextArea rows={3} placeholder="Summarize discussion..." />
                </Form.Item>
                <Button type="primary" htmlType="submit" block>Log Interaction</Button>
              </Form>
            </Card>
          </Col>
          <Col xs={24} md={14}>
            <Card title="Activity Timeline" bordered={false}>
              {activities.length === 0 ? (
                <Empty description="No activities logged on this client" />
              ) : (
                <Timeline style={{ marginTop: 12 }}>
                  {activities.map(act => (
                    <Timeline.Item key={act._id} label={dayjs(act.createdAt).format('MMM D, YYYY')}>
                      <Text strong>{act.title}</Text> <Tag>{act.type}</Tag>
                      <div>{act.description}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>Logged by: {act.createdBy?.name || 'System'}</div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              )}
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: '4',
      label: 'Quotations',
      children: (
        <Card title="Proposals issued" bordered={false}>
          {quotations.length === 0 ? (
            <Empty description="No quotations generated for this client yet" />
          ) : (
            <div>Quotations lists go here.</div>
          )}
        </Card>
      )
    },
    {
      key: '5',
      label: 'Projects',
      children: (
        <Card title="Active Client Projects" bordered={false}>
          {projects.length === 0 ? (
            <Empty description="No active project execution linked to this client" />
          ) : (
            <div>Projects list goes here.</div>
          )}
        </Card>
      )
    },
    {
      key: '6',
      label: 'Billing & Invoices',
      children: (
        <Card title="Invoices issued" bordered={false}>
          {invoices.length === 0 ? (
            <Empty description="No invoices billed to this client account" />
          ) : (
            <div>Invoices list goes here.</div>
          )}
        </Card>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/clients')} style={{ marginRight: 16 }} />
        <div>
          <Title level={2} style={{ margin: 0 }}>{client.companyName}</Title>
          <Paragraph style={{ margin: 0, color: '#64748b' }}>
            <Space>
              <span>Contact: {client.contactPerson}</span>
              <Tag color="success">{client.status}</Tag>
            </Space>
          </Paragraph>
        </div>
      </div>

      <Tabs defaultActiveKey="1" items={items} />
    </div>
  );
};

export default Client360;
