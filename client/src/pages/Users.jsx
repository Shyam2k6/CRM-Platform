import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Tag, Modal, Form, Input, Select, Switch, Space, Typography, message } from 'antd';
import { UserAddOutlined, EditOutlined, PoweroffOutlined } from '@ant-design/icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Title, Paragraph } = Typography;
const { Option } = Select;

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const { user: currentUser } = useAuth();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showModal = (user = null) => {
    setEditingUser(user);
    if (user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      });
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setEditingUser(null);
    form.resetFields();
  };

  const onFinish = async (values) => {
    try {
      if (editingUser) {
        // Update user
        const res = await api.put(`/users/${editingUser._id}`, values);
        if (res.data.success) {
          message.success('User updated successfully');
          fetchUsers();
          handleCancel();
        }
      } else {
        // Create user
        const res = await api.post('/users', values);
        if (res.data.success) {
          message.success('User created successfully');
          fetchUsers();
          handleCancel();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeactivate = async (userId) => {
    Modal.confirm({
      title: 'Are you sure you want to deactivate this user?',
      content: 'Deactivated users will not be able to log in to the CRM.',
      okText: 'Yes, Deactivate',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const res = await api.delete(`/users/${userId}`);
          if (res.data.success) {
            message.success('User deactivated successfully');
            fetchUsers();
          }
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        let color = 'blue';
        if (role === 'Admin') color = 'gold';
        else if (role === 'Management') color = 'purple';
        else if (role === 'Finance') color = 'magenta';
        else if (role === 'Project Manager') color = 'cyan';
        return <Tag color={color}>{role}</Tag>;
      },
      filters: [
        { text: 'Admin', value: 'Admin' },
        { text: 'Management', value: 'Management' },
        { text: 'Sales', value: 'Sales' },
        { text: 'Project Manager', value: 'Project Manager' },
        { text: 'Employee', value: 'Employee' },
        { text: 'Finance', value: 'Finance' },
      ],
      onFilter: (value, record) => record.role === value,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'success' : 'error'}>
          {isActive ? 'Active' : 'Deactivated'}
        </Tag>
      ),
      filters: [
        { text: 'Active', value: true },
        { text: 'Deactivated', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
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
            disabled={currentUser.role !== 'Admin' && currentUser.id !== record._id}
          >
            Edit
          </Button>
          {record.role !== 'Admin' && record.isActive && currentUser.role === 'Admin' && (
            <Button
              type="text"
              danger
              icon={<PoweroffOutlined />}
              onClick={() => handleDeactivate(record._id)}
            >
              Deactivate
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>User Administration</Title>
          <Paragraph type="secondary">Manage system users, change roles, and deactivate accounts.</Paragraph>
        </div>
        <Button type="primary" icon={<UserAddOutlined />} onClick={() => showModal()}>
          Add User
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingUser ? 'Edit User Details' : 'Register New User'}
        open={modalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ isActive: true }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please input the name!' }]}
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
            <Input placeholder="e.g. arun@company.com" disabled={!!editingUser} />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: 'Please input the password!' },
                { min: 6, message: 'Password must be at least 6 characters!' }
              ]}
            >
              <Input.Password placeholder="••••••••" />
            </Form.Item>
          )}

          <Form.Item
            name="role"
            label="System Role"
            rules={[{ required: true, message: 'Please select a role!' }]}
          >
            <Select placeholder="Select role">
              <Option value="Admin">Admin</Option>
              <Option value="Management">Management</Option>
              <Option value="Sales">Sales</Option>
              <Option value="Project Manager">Project Manager</Option>
              <Option value="Employee">Employee</Option>
              <Option value="Finance">Finance</Option>
            </Select>
          </Form.Item>

          {editingUser && (
            <Form.Item name="isActive" label="Active Account Status" valuePropName="checked">
              <Switch checkedChildren="Active" unCheckedChildren="Deactivated" />
            </Form.Item>
          )}

          <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 0, marginTop: 24 }}>
            <Space>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingUser ? 'Save Changes' : 'Create User'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;
