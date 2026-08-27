import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Tag, Modal, Form, Input, Select, Space, Typography, message, Row, Col } from 'antd';
import { UserAddOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [salespeople, setSalespeople] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [form] = Form.useForm();
  const { user: currentUser } = useAuth();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchLeads = async (page = 1, searchVal = search, statusVal = statusFilter, sourceVal = sourceFilter) => {
    setLoading(true);
    try {
      const res = await api.get('/leads', {
        params: {
          page,
          limit: pagination.pageSize,
          search: searchVal || undefined,
          status: statusVal || undefined,
          source: sourceVal || undefined,
        },
      });
      if (res.data.success) {
        setLeads(res.data.data);
        setPagination({
          ...pagination,
          current: res.data.pagination.page,
          total: res.data.pagination.total,
        });
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
        // Filter users who can handle sales
        const filtered = res.data.data.filter(u => ['Admin', 'Management', 'Sales'].includes(u.role) && u.isActive);
        setSalespeople(filtered);
      }
    } catch (err) {
      console.error('Error fetching salespeople:', err);
    }
  };

  useEffect(() => {
    fetchLeads(1);
    fetchSalespeople();
  }, []);

  const handleTableChange = (newPagination) => {
    fetchLeads(newPagination.current);
  };

  const handleSearch = () => {
    fetchLeads(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setSourceFilter('');
    fetchLeads(1, '', '', '');
  };

  const showModal = (lead = null) => {
    setEditingLead(lead);
    if (lead) {
      form.setFieldsValue({
        name: lead.name,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        requirement: lead.requirement,
        source: lead.source,
        status: lead.status,
        assignedSalesperson: lead.assignedSalesperson?._id || lead.assignedSalesperson,
        notes: lead.notes,
      });
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setEditingLead(null);
    form.resetFields();
  };

  const onFinish = async (values) => {
    try {
      if (editingLead) {
        const res = await api.put(`/leads/${editingLead._id}`, values);
        if (res.data.success) {
          message.success('Lead updated successfully');
          fetchLeads(pagination.current);
          handleCancel();
        }
      } else {
        const res = await api.post('/leads', values);
        if (res.data.success) {
          message.success('Lead created successfully');
          fetchLeads(1);
          handleCancel();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (leadId) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this lead?',
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const res = await api.delete(`/leads/${leadId}`);
          if (res.data.success) {
            message.success('Lead deleted successfully');
            fetchLeads(1);
          }
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'New': return 'blue';
      case 'Contacted': return 'orange';
      case 'Qualified': return 'green';
      case 'Unqualified': return 'purple';
      case 'Converted': return 'cyan';
      case 'Lost': return 'magenta';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <span style={{ fontWeight: 600 }}>{text}</span>
          <div style={{ fontSize: 11, color: '#64748b' }}>{record.company}</div>
        </div>
      )
    },
    {
      title: 'Email / Phone',
      dataIndex: 'email',
      key: 'emailOrPhone',
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{record.phone || 'N/A'}</div>
        </div>
      )
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      render: (source) => <Tag>{source}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedSalesperson',
      key: 'assignedSalesperson',
      render: (salesperson) => salesperson?.name || <Text type="secondary" italic>Unassigned</Text>
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
            disabled={currentUser.role === 'Sales' && record.assignedSalesperson?._id !== currentUser.id}
          >
            Edit
          </Button>
          {['Admin', 'Management'].includes(currentUser.role) && (
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record._id)}
            >
              Delete
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Leads Management</Title>
          <Paragraph type="secondary">Create, view, filter, and assign business opportunities leads.</Paragraph>
        </div>
        <Button type="primary" icon={<UserAddOutlined />} onClick={() => showModal()}>
          Create Lead
        </Button>
      </div>

      {/* Filter panel */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="Search by name/company/req"
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={handleSearch}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by Status"
              value={statusFilter || undefined}
              onChange={(val) => setStatusFilter(val || '')}
              allowClear
            >
              <Option value="New">New</Option>
              <Option value="Contacted">Contacted</Option>
              <Option value="Qualified">Qualified</Option>
              <Option value="Unqualified">Unqualified</Option>
              <Option value="Converted">Converted</Option>
              <Option value="Lost">Lost</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by Source"
              value={sourceFilter || undefined}
              onChange={(val) => setSourceFilter(val || '')}
              allowClear
            >
              <Option value="Website">Website</Option>
              <Option value="Referral">Referral</Option>
              <Option value="Cold Call">Cold Call</Option>
              <Option value="Social Media">Social Media</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space>
              <Button type="primary" onClick={handleSearch}>Filter</Button>
              <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>Reset</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Leads Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={leads}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: false,
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingLead ? 'Edit Lead Details' : 'Create New Lead'}
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
          initialValues={{ status: 'New', source: 'Website' }}
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Contact Person Name"
                rules={[{ required: true, message: 'Please input the contact name!' }]}
              >
                <Input placeholder="e.g. Arun" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="company"
                label="Company Name"
                rules={[{ required: true, message: 'Please input the company name!' }]}
              >
                <Input placeholder="e.g. ABC Technologies" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  { required: true, message: 'Please input the email!' },
                  { type: 'email', message: 'Please enter a valid email!' }
                ]}
              >
                <Input placeholder="e.g. arun@abctech.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Phone Number">
                <Input placeholder="e.g. +91 9876543210" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="requirement"
            label="Lead Requirements"
            rules={[{ required: true, message: 'Please enter requirements details!' }]}
          >
            <TextArea rows={3} placeholder="e.g. We need a fully responsive e-commerce web platform with payments integration." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="source" label="Lead Source">
                <Select>
                  <Option value="Website">Website</Option>
                  <Option value="Referral">Referral</Option>
                  <Option value="Cold Call">Cold Call</Option>
                  <Option value="Social Media">Social Media</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Lead Status">
                <Select>
                  <Option value="New">New</Option>
                  <Option value="Contacted">Contacted</Option>
                  <Option value="Qualified">Qualified</Option>
                  <Option value="Unqualified">Unqualified</Option>
                  <Option value="Converted">Converted</Option>
                  <Option value="Lost">Lost</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="assignedSalesperson" label="Assigned Salesperson">
                <Select placeholder="Assign a salesperson" allowClear>
                  {salespeople.map(person => (
                    <Option key={person._id} value={person._id}>{person.name} ({person.role})</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Internal Notes">
            <TextArea rows={2} placeholder="Add follow-up notes or observations..." />
          </Form.Item>

          <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 0, marginTop: 24 }}>
            <Space>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingLead ? 'Save Changes' : 'Create Lead'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Leads;
