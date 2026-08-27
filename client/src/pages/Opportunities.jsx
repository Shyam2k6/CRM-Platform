import React, { useState, useEffect } from 'react';
import { Card, Button, Tag, Modal, Form, Input, Select, DatePicker, Slider, Space, Typography, message, Row, Col, Tooltip } from 'antd';
import { PlusOutlined, UnorderedListOutlined, AppstoreOutlined, SearchOutlined, ReloadOutlined, ArrowRightOutlined } from '@ant-design/icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const STAGES = ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

const Opportunities = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [salespeople, setSalespeople] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOpp, setEditingOpp] = useState(null);
  const [form] = Form.useForm();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  // Filters
  const [search, setSearch] = useState('');
  const [salespersonFilter, setSalespersonFilter] = useState('');

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const res = await api.get('/opportunities', {
        params: {
          search: search || undefined,
          assignedSalesperson: salespersonFilter || undefined,
        },
      });
      if (res.data.success) {
        setOpportunities(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalespeople = async () => {
    try {
      const res = await api.get('/users');
      if (res.data.success) {
        const filtered = res.data.data.filter(u => ['Admin', 'Management', 'Sales'].includes(u.role) && u.isActive);
        setSalespeople(filtered);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await api.get('/leads', { params: { limit: 100 } });
      if (res.data.success) {
        // Only show leads that are not converted, or allow converting anyway
        const unconverted = res.data.data.filter(l => l.status !== 'Converted');
        setLeads(unconverted);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOpportunities();
    fetchSalespeople();
    fetchLeads();
  }, []);

  const handleSearch = () => {
    fetchOpportunities();
  };

  const handleReset = () => {
    setSearch('');
    setSalespersonFilter('');
    // Can't use stale states, so pass directly
    api.get('/opportunities').then(res => {
      if (res.data.success) setOpportunities(res.data.data);
    });
  };

  // Drag and Drop handlers
  const onDragStart = (e, oppId) => {
    e.dataTransfer.setData('text/plain', oppId);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = async (e, targetStage) => {
    e.preventDefault();
    const oppId = e.dataTransfer.getData('text/plain');
    if (!oppId) return;

    // Update local state first (Optimistic update)
    const originalOpps = [...opportunities];
    setOpportunities(prev => prev.map(opp => opp._id === oppId ? { ...opp, stage: targetStage } : opp));

    try {
      const res = await api.put(`/opportunities/${oppId}`, { stage: targetStage });
      if (res.data.success) {
        message.success(`Opportunity stage updated to ${targetStage}`);
        fetchOpportunities(); // refresh populate info
      }
    } catch (err) {
      // Revert if error
      setOpportunities(originalOpps);
      message.error('Failed to update stage');
    }
  };

  const showModal = (opp = null) => {
    setEditingOpp(opp);
    if (opp) {
      form.setFieldsValue({
        title: opp.title,
        clientName: opp.clientName,
        associatedLead: opp.associatedLead?._id || opp.associatedLead,
        dealValue: opp.dealValue,
        stage: opp.stage,
        probability: opp.probability,
        expectedCloseDate: opp.expectedCloseDate ? dayjs(opp.expectedCloseDate) : null,
        assignedSalesperson: opp.assignedSalesperson?._id || opp.assignedSalesperson,
        notes: opp.notes,
      });
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setEditingOpp(null);
    form.resetFields();
  };

  const onFinish = async (values) => {
    try {
      const formatted = {
        ...values,
        expectedCloseDate: values.expectedCloseDate ? values.expectedCloseDate.toISOString() : undefined,
      };

      if (editingOpp) {
        const res = await api.put(`/opportunities/${editingOpp._id}`, formatted);
        if (res.data.success) {
          message.success('Opportunity updated successfully');
          fetchOpportunities();
          handleCancel();
        }
      } else {
        const res = await api.post('/opportunities', formatted);
        if (res.data.success) {
          message.success('Opportunity created successfully');
          fetchOpportunities();
          handleCancel();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (oppId) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this opportunity?',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const res = await api.delete(`/opportunities/${oppId}`);
          if (res.data.success) {
            message.success('Opportunity deleted successfully');
            fetchOpportunities();
          }
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const renderKanbanBoard = () => {
    return (
      <Row gutter={12} style={{ overflowX: 'auto', flexWrap: 'nowrap', paddingBottom: 16 }}>
        {STAGES.map(stage => {
          const stageOpps = opportunities.filter(o => o.stage === stage);
          const stageTotal = stageOpps.reduce((sum, o) => sum + o.dealValue, 0);

          return (
            <Col
              key={stage}
              style={{ minWidth: 280, width: '16.66%', flex: '0 0 auto' }}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, stage)}
            >
              <div className="kanban-column" style={{ borderTop: `4px solid ${
                stage === 'Won' ? '#10b981' : stage === 'Lost' ? '#ef4444' : '#2563eb'
              }` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text strong style={{ fontSize: 15 }}>{stage}</Text>
                  <Tag color="blue">{stageOpps.length}</Tag>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
                  Total: <span style={{ fontWeight: 600, color: '#0f172a' }}>{formatCurrency(stageTotal)}</span>
                </div>

                <div style={{ minHeight: 450 }}>
                  {stageOpps.map(opp => (
                    <div
                      key={opp._id}
                      className="kanban-card"
                      draggable="true"
                      onDragStart={(e) => onDragStart(e, opp._id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <Text strong style={{ fontSize: 14, color: '#1e293b', display: 'block', maxWidth: '80%' }}>
                          {opp.title}
                        </Text>
                        <Tag color="purple" style={{ fontSize: 10, marginRight: 0 }}>{opp.probability}%</Tag>
                      </div>
                      <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>
                        Client: <span style={{ fontWeight: 500 }}>{opp.clientName}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#2563eb', marginBottom: 8 }}>
                        {formatCurrency(opp.dealValue)}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          Assignee: {opp.assignedSalesperson?.name ? opp.assignedSalesperson.name.split(' ')[0] : 'Unassigned'}
                        </Text>
                        <Space size={4}>
                          {opp.stage === 'Won' && (
                            <Button size="small" type="primary" onClick={() => navigate(`/projects?oppId=${opp._id}`)}>
                              Handover
                            </Button>
                          )}
                          <Button size="small" type="text" onClick={() => showModal(opp)}>Edit</Button>
                          {['Admin', 'Management'].includes(currentUser.role) && (
                            <Button size="small" type="text" danger onClick={() => handleDelete(opp._id)}>Del</Button>
                          )}
                        </Space>
                      </div>
                    </div>
                  ))}
                  {stageOpps.length === 0 && (
                    <div style={{ border: '2px dashed #cbd5e1', borderRadius: 8, padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                      Drag opportunities here
                    </div>
                  )}
                </div>
              </div>
            </Col>
          );
        })}
      </Row>
    );
  };

  const renderListView = () => {
    return (
      <Row gutter={[16, 16]}>
        {opportunities.map(opp => (
          <Col xs={24} sm={12} md={8} lg={6} key={opp._id}>
            <Card
              title={opp.title}
              extra={<Tag color={opp.stage === 'Won' ? 'success' : opp.stage === 'Lost' ? 'error' : 'processing'}>{opp.stage}</Tag>}
              actions={[
                opp.stage === 'Won' && (
                  <Button type="link" onClick={() => navigate(`/projects?oppId=${opp._id}`)}>Handover</Button>
                ),
                <Button type="link" onClick={() => showModal(opp)}>Edit</Button>,
                ['Admin', 'Management'].includes(currentUser.role) ? (
                  <Button type="link" danger onClick={() => handleDelete(opp._id)}>Delete</Button>
                ) : null
              ].filter(Boolean)}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div><Text type="secondary">Client:</Text> <Text strong>{opp.clientName}</Text></div>
                <div><Text type="secondary">Deal Value:</Text> <Text strong style={{ color: '#2563eb' }}>{formatCurrency(opp.dealValue)}</Text></div>
                <div><Text type="secondary">Probability:</Text> <Tag color="purple">{opp.probability}%</Tag></div>
                <div><Text type="secondary">Assigned To:</Text> <Text>{opp.assignedSalesperson?.name || 'Unassigned'}</Text></div>
                {opp.expectedCloseDate && (
                  <div><Text type="secondary">Close Date:</Text> <Text>{new Date(opp.expectedCloseDate).toLocaleDateString()}</Text></div>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Sales Pipeline & Opportunities</Title>
          <Paragraph type="secondary">Manage your active sales deals. Drag and drop cards to change stages.</Paragraph>
        </div>
        <Space>
          <Button
            type={viewMode === 'kanban' ? 'primary' : 'default'}
            icon={<AppstoreOutlined />}
            onClick={() => setViewMode('kanban')}
          >
            Kanban
          </Button>
          <Button
            type={viewMode === 'list' ? 'primary' : 'default'}
            icon={<UnorderedListOutlined />}
            onClick={() => setViewMode('list')}
          >
            Grid List
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            New Opportunity
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={10}>
            <Input
              placeholder="Search by title, client, notes"
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={handleSearch}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by Salesperson"
              value={salespersonFilter || undefined}
              onChange={(val) => setSalespersonFilter(val || '')}
              allowClear
            >
              {salespeople.map(sp => (
                <Option key={sp._id} value={sp._id}>{sp.name}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={6}>
            <Space>
              <Button type="primary" onClick={handleSearch}>Filter</Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>Reset</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Pipeline View */}
      {viewMode === 'kanban' ? renderKanbanBoard() : renderListView()}

      {/* Add/Edit Modal */}
      <Modal
        title={editingOpp ? 'Edit Opportunity Details' : 'Create New Opportunity'}
        open={modalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ stage: 'New', probability: 10 }}
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="Opportunity Name"
                rules={[{ required: true, message: 'Please input opportunity title!' }]}
              >
                <Input placeholder="e.g. E-Commerce Website" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="clientName"
                label="Client / Company Name"
                rules={[{ required: true, message: 'Please input client company name!' }]}
              >
                <Input placeholder="e.g. ABC Technologies" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="associatedLead" label="Link Associated Lead">
                <Select placeholder="Optional: Link from unconverted leads" allowClear>
                  {leads.map(lead => (
                    <Option key={lead._id} value={lead._id}>{lead.name} ({lead.company})</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="dealValue"
                label="Deal Value (INR)"
                rules={[{ required: true, message: 'Please input the estimated value!' }]}
              >
                <Input type="number" prefix="₹" placeholder="e.g. 200000" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="stage" label="Pipeline Stage">
                <Select>
                  {STAGES.map(stage => (
                    <Option key={stage} value={stage}>{stage}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expectedCloseDate" label="Expected Close Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="probability" label="Winning Probability (%)">
            <Slider min={0} max={100} marks={{ 0: '0%', 50: '50%', 100: '100%' }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="assignedSalesperson" label="Assigned Salesperson">
                <Select placeholder="Assign salesperson">
                  {salespeople.map(sp => (
                    <Option key={sp._id} value={sp._id}>{sp.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Internal Notes / Discussion Requirements">
            <TextArea rows={3} placeholder="Add requirements discussion notes..." />
          </Form.Item>

          <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 0, marginTop: 24 }}>
            <Space>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingOpp ? 'Save Changes' : 'Create Opportunity'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Opportunities;
