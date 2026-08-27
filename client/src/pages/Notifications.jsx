import React, { useState, useEffect } from 'react';
import { Card, List, Button, Tag, Typography, Badge, Space, message } from 'antd';
import { BellOutlined, CheckOutlined, ClockCircleOutlined, UserOutlined, DollarOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Title, Paragraph, Text } = Typography;

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await api.put('/notifications/read-all');
      if (res.data.success) {
        message.success('All notifications marked as read');
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'Follow-up': return <ClockCircleOutlined style={{ color: '#f59e0b', fontSize: 18 }} />;
      case 'Deadline': return <BellOutlined style={{ color: '#ef4444', fontSize: 18 }} />;
      case 'Assignment': return <UserOutlined style={{ color: '#2563eb', fontSize: 18 }} />;
      case 'Finance': return <DollarOutlined style={{ color: '#10b981', fontSize: 18 }} />;
      default: return <BellOutlined style={{ color: '#64748b', fontSize: 18 }} />;
    }
  };

  const getTagColor = (type) => {
    switch (type) {
      case 'Follow-up': return 'warning';
      case 'Deadline': return 'error';
      case 'Assignment': return 'processing';
      case 'Finance': return 'success';
      default: return 'default';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Notifications Center <Badge count={unreadCount} style={{ backgroundColor: '#2563eb' }} />
          </Title>
          <Paragraph type="secondary">Review system alerts, task assignments, due follow-ups, and payment records.</Paragraph>
        </div>
        {unreadCount > 0 && (
          <Button type="primary" icon={<CheckOutlined />} onClick={handleMarkAllRead}>
            Mark All as Read
          </Button>
        )}
      </div>

      <Card>
        <List
          loading={loading}
          itemLayout="horizontal"
          dataSource={notifications}
          locale={{ emptyText: 'No notifications received' }}
          renderItem={(item) => (
            <List.Item
              style={{
                background: item.isRead ? 'transparent' : '#f8fafc',
                padding: '16px 24px',
                borderBottom: '1px solid #f1f5f9',
                borderRadius: 8,
                marginBottom: 8,
                transition: 'background-color 0.2s'
              }}
            >
              <List.Item.Meta
                avatar={
                  <div style={{ padding: '8px', background: '#fff', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    {getNotificationIcon(item.type)}
                  </div>
                }
                title={
                  <Space>
                    <Text strong={!item.isRead}>{item.title}</Text>
                    <Tag color={getTagColor(item.type)}>{item.type}</Tag>
                  </Space>
                }
                description={
                  <div>
                    <div style={{ color: '#475569', fontSize: 13, marginTop: 4 }}>{item.message}</div>
                    <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 8 }}>
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default Notifications;
