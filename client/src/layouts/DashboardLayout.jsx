import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Badge, Space, Typography, Drawer } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  ContactsOutlined,
  StockOutlined,
  SolutionOutlined,
  ScheduleOutlined,
  FileTextOutlined,
  ProjectOutlined,
  CheckSquareOutlined,
  DollarOutlined,
  CreditCardOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const DashboardLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data.slice(0, 5)); // show latest 5
        setUnreadCount(res.data.data.filter((n) => !n.isRead).length);
      }
    } catch (err) {
      console.log('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll every 30s
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.log('Error reading notifications:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Determine menu items by role
  const getMenuItems = () => {
    const role = user?.role;
    const items = [];

    // Dashboard (Restricted to non-Employee roles)
    if (role !== 'Employee') {
      items.push({
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: <Link to="/dashboard">Dashboard</Link>,
      });
    }

    // CRM Section
    const crmChildren = [];
    if (['Admin', 'Management', 'Sales'].includes(role)) {
      crmChildren.push({
        key: '/leads',
        icon: <ContactsOutlined />,
        label: <Link to="/leads">Leads</Link>,
      });
      crmChildren.push({
        key: '/opportunities',
        icon: <StockOutlined />,
        label: <Link to="/opportunities">Opportunities</Link>,
      });
    }
    if (['Admin', 'Management', 'Sales', 'Finance', 'Project Manager'].includes(role)) {
      crmChildren.push({
        key: '/clients',
        icon: <SolutionOutlined />,
        label: <Link to="/clients">Clients</Link>,
      });
    }
    if (['Admin', 'Management', 'Sales', 'Project Manager'].includes(role)) {
      crmChildren.push({
        key: '/activities',
        icon: <ScheduleOutlined />,
        label: <Link to="/activities">Activities</Link>,
      });
    }
    if (['Admin', 'Management', 'Sales'].includes(role)) {
      crmChildren.push({
        key: '/quotations',
        icon: <FileTextOutlined />,
        label: <Link to="/quotations">Quotations</Link>,
      });
    }

    if (crmChildren.length > 0) {
      items.push({
        key: 'crm-grp',
        label: 'CRM',
        type: 'group',
        children: crmChildren,
      });
    }

    // Projects Section
    const projChildren = [];
    if (['Admin', 'Management', 'Project Manager', 'Employee', 'Sales'].includes(role)) {
      projChildren.push({
        key: '/projects',
        icon: <ProjectOutlined />,
        label: <Link to="/projects">Projects</Link>,
      });
      projChildren.push({
        key: '/tasks',
        icon: <CheckSquareOutlined />,
        label: <Link to="/tasks">Tasks</Link>,
      });
    }

    if (projChildren.length > 0) {
      items.push({
        key: 'project-grp',
        label: 'Projects',
        type: 'group',
        children: projChildren,
      });
    }

    // Finance Section
    const finChildren = [];
    if (['Admin', 'Management', 'Finance'].includes(role)) {
      finChildren.push({
        key: '/invoices',
        icon: <DollarOutlined />,
        label: <Link to="/invoices">Invoices</Link>,
      });
      finChildren.push({
        key: '/payments',
        icon: <CreditCardOutlined />,
        label: <Link to="/payments">Payments</Link>,
      });
    }

    if (finChildren.length > 0) {
      items.push({
        key: 'finance-grp',
        label: 'Finance',
        type: 'group',
        children: finChildren,
      });
    }

    // Management / Administration
    if (['Admin', 'Management'].includes(role)) {
      items.push({
        key: 'mgmt-grp',
        label: 'Management',
        type: 'group',
        children: [
          {
            key: '/users',
            icon: <TeamOutlined />,
            label: <Link to="/users">Users</Link>,
          },
        ],
      });
    }

    return items;
  };

  // Notification content
  const notificationMenu = (
    <div style={{
      width: 320,
      background: 'white',
      borderRadius: 12,
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0',
      padding: '12px 16px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text strong style={{ fontSize: 16 }}>Notifications</Text>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={markAllRead} style={{ padding: 0 }}>
            Mark all read
          </Button>
        )}
      </div>
      <div style={{ maxHeight: 250, overflowY: 'auto', marginBottom: 8 }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: '#94a3b8' }}>No notifications</div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif._id}
              style={{
                padding: '8px 0',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                flexDirection: 'column',
                opacity: notif.isRead ? 0.6 : 1
              }}
            >
              <Text strong style={{ fontSize: 13, color: notif.isRead ? '#64748b' : '#1e293b' }}>
                {notif.title}
              </Text>
              <Text style={{ fontSize: 12, color: '#64748b' }}>{notif.message}</Text>
            </div>
          ))
        )}
      </div>
      <Button type="primary" block size="small" onClick={() => navigate('/notifications')}>
        View All Notifications
      </Button>
    </div>
  );

  // User Profile options
  const profileMenu = {
    items: [
      {
        key: 'profile',
        label: <Link to="/profile">My Profile</Link>,
        icon: <UserOutlined />,
      },
      {
        type: 'divider',
      },
      {
        key: 'logout',
        label: 'Logout',
        icon: <LogoutOutlined />,
        danger: true,
        onClick: handleLogout,
      },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={250}
        theme="dark"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: '#0f172a',
          zIndex: 10,
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: '0 24px',
          background: '#0f172a',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <Text strong style={{ color: '#3b82f6', fontSize: collapsed ? 20 : 22, letterSpacing: 1 }}>
            {collapsed ? 'C' : 'CRM'}
          </Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          style={{ background: '#0f172a', padding: '16px 0' }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: 'all 0.2s' }}>
        <Header
          className="glass-header"
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 9,
            height: 64,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />

          <Space size={24}>
            <Dropdown dropdownRender={() => notificationMenu} trigger={['click']} placement="bottomRight">
              <Badge count={unreadCount} overflowCount={9} style={{ boxShadow: 'none' }}>
                <Button type="text" shape="circle" icon={<BellOutlined style={{ fontSize: 18 }} />} />
              </Badge>
            </Dropdown>

            <Dropdown menu={profileMenu} trigger={['click']} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }} size={8}>
                <Avatar style={{ backgroundColor: '#2563eb' }}>
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </Avatar>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                  <Text strong style={{ fontSize: 13 }}>{user?.name}</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>{user?.role}</Text>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: '0',
            minHeight: 280,
          }}
        >
          <div className="fade-in-section">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
