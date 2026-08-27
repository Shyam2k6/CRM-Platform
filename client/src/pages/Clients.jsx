import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Typography, Space, Input, Modal, Form, message, Row, Col } from 'antd';
import { EyeOutlined, SearchOutlined, ReloadOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const { Title, Paragraph } = Typography;

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [search, setSearch] = useState('');
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const fetchClients = async (searchVal = search) => {
    setLoading(true);
    try {
      const res = await api.get('/clients', {
        params: { search: searchVal || undefined }
      });
      if (res.data.success) {
        setClients(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSearch = () => {
    fetchClients();
  };

  const handleReset = () => {
    setSearch('');
    fetchClients('');
  };

  const showModal = (client = null) => {
    setEditingClient(client);
    if (client) {
      form.setFieldsValue(client);
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setEditingClient(null);
    form.resetFields();
  };

  const onFinish = async (values) => {
    try {
      if (editingClient) {
        const res = await api.put(`/clients/${editingClient._id}`, values);
        if (res.data.success) {
          message.success('Client profile updated');
          fetchClients();
          handleCancel();
        }
      } else {
        const res = await api.post('/clients', values);
        if (res.data.success) {
          message.success('Client created successfully');
          fetchClients();
          handleCancel();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    {
      title: 'Company Name',
      dataIndex: 'companyName',
      key: 'companyName',
      render: (text, record) => (
        <span style={{ fontWeight: 600, color: '#2563eb', cursor: 'pointer' }} onClick={() => navigate(`/clients/${record._id}`)}>
          {text}
        </span>
      ),
      sorter: (a, b) => a.companyName.localeCompare(b.companyName),
    },
    {
      title: 'Contact Person',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => phone || 'N/A'
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
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/clients/${record._id}`)}
          >
            360° Profile
          </Button>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Client Accounts</Title>
          <Paragraph type="secondary">Manage your active business client relations and view unified customer files.</Paragraph>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
          Add Client
        </Button>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={16} md={12}>
            <Input
              placeholder="Search by company, contact, or email..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={handleSearch}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Space>
              <Button type="primary" onClick={handleSearch}>Search</Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>Reset</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Clients Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={clients}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Modal */}
      <Modal
        title={editingClient ? 'Edit Client Profile' : 'Add Client Account'}
        open={modalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="companyName"
            label="Company Name"
            rules={[{ required: true, message: 'Please input the company name!' }]}
          >
            <Input placeholder="e.g. ABC Technologies" />
          </Form.Item>

          <Form.Item
            name="contactPerson"
            label="Contact Person Name"
            rules={[{ required: true, message: 'Please input the contact name!' }]}
          >
            <Input placeholder="e.g. Arun Kumar" />
          </Form.Item>

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

          <Form.Item name="phone" label="Phone Number">
            <Input placeholder="e.g. +91 9876543210" />
          </Form.Item>

          <Form.Item name="address" label="Office Address">
            <Input placeholder="e.g. Bengaluru, India" />
          </Form.Item>

          <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 0, marginTop: 24 }}>
            <Space>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingClient ? 'Save Changes' : 'Create Client'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Clients;
