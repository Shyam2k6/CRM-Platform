import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Input, Select, DatePicker, Row, Col, Typography, Timeline, Badge, List, Space, Tag, message } from 'antd';
import { PhoneOutlined, MailOutlined, TeamOutlined, FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined, PlusOutlined } from '@ant-design/icons';
import api from '../services/api';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [leads, setLeads] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Selected association type
  const [assocType, setAssocType] = useState('Lead');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get all activities
      const res = await api.get('/activities');
      if (res.data.success) {
        setActivities(res.data.data);
      }

      // Get upcoming followups
      const upRes = await api.get('/activities/upcoming');
      if (upRes.data.success) {
        setUpcoming(upRes.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssociations = async () => {
    try {
      const leadRes = await api.get('/leads', { params: { limit: 100 } });
      if (leadRes.data.success) setLeads(leadRes.data.data);

      const oppRes = await api.get('/opportunities');
      if (oppRes.data.success) setOpportunities(oppRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchAssociations();
  }, []);

  const onFinish = async (values) => {
    try {
      const formatted = {
        ...values,
        followUpDate: values.followUpDate ? values.followUpDate.toISOString() : undefined,
      };

      const res = await api.post('/activities', formatted);
      if (res.data.success) {
        message.success('Activity logged successfully');
        form.resetFields();
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteFollowUp = async (activityId) => {
    try {
      const res = await api.put(`/activities/${activityId}/status`, { followUpStatus: 'Completed' });
      if (res.data.success) {
        message.success('Follow-up marked as completed');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'Call': return <PhoneOutlined style={{ color: '#10b981' }} />;
      case 'Email': return <MailOutlined style={{ color: '#3b82f6' }} />;
      case 'Meeting': return <TeamOutlined style={{ color: '#f59e0b' }} />;
      case 'Note': return <FileTextOutlined style={{ color: '#64748b' }} />;
      default: return <ClockCircleOutlined style={{ color: '#2563eb' }} />;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Activities & Follow-ups</Title>
        <Paragraph type="secondary">Log client calls, track meetings, write internal notes, and schedule upcoming follow-ups.</Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        {/* Log Activity Column */}
        <Col xs={24} lg={8}>
          <Card title="Log New Activity" style={{ height: '100%' }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={{ type: 'Call', associatedType: 'Lead' }}
            >
              <Form.Item
                name="title"
                label="Activity Subject"
                rules={[{ required: true, message: 'Please input a subject!' }]}
              >
                <Input placeholder="e.g. Initial Call with Client" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="type" label="Activity Type">
                    <Select>
                      <Option value="Call">Call</Option>
                      <Option value="Email">Email</Option>
                      <Option value="Meeting">Meeting</Option>
                      <Option value="Note">Note</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="associatedType" label="Related Entity">
                    <Select onChange={(val) => setAssocType(val)}>
                      <Option value="Lead">Lead</Option>
                      <Option value="Opportunity">Opportunity</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="associatedId"
                label={assocType === 'Lead' ? 'Select Lead' : 'Select Opportunity'}
                rules={[{ required: true, message: 'Please select an entity!' }]}
              >
                <Select placeholder={`Select target ${assocType}`}>
                  {assocType === 'Lead'
                    ? leads.map(l => (
                        <Option key={l._id} value={l._id}>{l.name} ({l.company})</Option>
                      ))
                    : opportunities.map(o => (
                        <Option key={o._id} value={o._id}>{o.title} ({o.clientName})</Option>
                      ))
                  }
                </Select>
              </Form.Item>

              <Form.Item name="description" label="Activity Details / Summary">
                <TextArea rows={3} placeholder="Provide details of the conversation..." />
              </Form.Item>

              <Form.Item name="followUpDate" label="Schedule Follow-up Date (Optional)">
                <DatePicker showTime style={{ width: '100%' }} placeholder="Select date & time" />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" icon={<PlusOutlined />} block>
                  Log Activity
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Timeline & Followups Columns */}
        <Col xs={24} lg={16}>
          <Row gutter={[24, 24]}>
            {/* Upcoming Followups */}
            <Col span={24}>
              <Card title={<span><ClockCircleOutlined style={{ marginRight: 8, color: '#f59e0b' }} />Upcoming Follow-ups</span>}>
                <List
                  loading={loading}
                  dataSource={upcoming}
                  locale={{ emptyText: 'No pending follow-ups scheduled' }}
                  renderItem={item => (
                    <List.Item
                      actions={[
                        <Button
                          type="primary"
                          size="small"
                          icon={<CheckCircleOutlined />}
                          onClick={() => handleCompleteFollowUp(item._id)}
                        >
                          Mark Done
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={getActivityIcon(item.type)}
                        title={<Text strong>{item.title}</Text>}
                        description={
                          <div>
                            <div>{item.description}</div>
                            <Space style={{ marginTop: 4 }}>
                              <Badge status="processing" text={`Due: ${dayjs(item.followUpDate).format('MMM D, YYYY h:mm A')}`} />
                              <Tag color="cyan">{item.associatedType}</Tag>
                            </Space>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>

            {/* Activity History Timeline */}
            <Col span={24}>
              <Card title="Activity History Feed">
                {activities.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>No activity history logged yet</div>
                ) : (
                  <Timeline mode="left" style={{ marginTop: 16 }}>
                    {activities.map(act => (
                      <Timeline.Item
                        key={act._id}
                        dot={getActivityIcon(act.type)}
                        label={dayjs(act.createdAt).format('MMM D, YYYY h:mm A')}
                      >
                        <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text strong style={{ fontSize: 14 }}>{act.title}</Text>
                            <Tag color="blue">{act.associatedType}</Tag>
                          </div>
                          {act.description && <Paragraph style={{ margin: '8px 0 0 0', fontSize: 13, color: '#475569' }}>{act.description}</Paragraph>}
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
                            Logged by: {act.createdBy?.name || 'System'}
                          </div>
                        </div>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                )}
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default Activities;
