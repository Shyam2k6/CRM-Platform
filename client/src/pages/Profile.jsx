import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, Space, message, Divider } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const { Title, Paragraph, Text } = Typography;

const Profile = () => {
  const { user, setUser } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
      });
    }
  }, [user]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await api.put(`/users/${user.id}`, {
        name: values.name,
        email: values.email,
        password: values.password || undefined // only update if provided
      });
      if (res.data.success) {
        const updatedUser = res.data.data;
        setUser({
          ...user,
          name: updatedUser.name,
          email: updatedUser.email
        });
        localStorage.setItem('crm_user', JSON.stringify({
          ...user,
          name: updatedUser.name,
          email: updatedUser.email
        }));
        message.success('Profile updated successfully');
        form.setFieldsValue({ password: '' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>My Profile</Title>
        <Paragraph type="secondary">Update your contact information and security settings.</Paragraph>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Please input your name!' }]}
          >
            <Input prefix={<UserOutlined style={{ color: '#94a3b8' }} />} placeholder="Full Name" size="large" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input prefix={<MailOutlined style={{ color: '#94a3b8' }} />} placeholder="Email Address" size="large" />
          </Form.Item>

          <Divider style={{ margin: '24px 0' }} />
          <Text strong style={{ display: 'block', marginBottom: 12 }}>Change Password (Optional)</Text>

          <Form.Item
            name="password"
            label="New Password"
            rules={[{ min: 6, message: 'Password must be at least 6 characters!' }]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="Leave blank to keep current password" size="large" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Button type="primary" htmlType="submit" size="large" loading={loading} block>
              Save Profile Changes
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Profile;
