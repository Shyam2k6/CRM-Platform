import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Layout, 
  Menu, 
  Button, 
  Avatar, 
  Dropdown, 
  Badge, 
  Space, 
  Breadcrumb, 
  Typography,
  theme
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  TeamOutlined,
  LineChartOutlined,
  ContactsOutlined,
  ScheduleOutlined,
  AuditOutlined,
  ProjectOutlined,
  CarryOutOutlined,
  FileTextOutlined,
  CreditCardOutlined,
  UserOutlined,
  BellOutlined,
  LogoutOutlined,
  SettingOutlined
} from '@ant-design/icons';

const { Header, Sider, Content, Footer } = Layout;
const { Title, Text } = Typography;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  // Define sidebar menu structure
  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'crm',
      label: 'CRM',
      type: 'group',
      children: [
        { key: '/leads', icon: <TeamOutlined />, label: 'Leads' },
        { key: '/opportunities', icon: <LineChartOutlined />, label: 'Opportunities' },
        { key: '/clients', icon: <ContactsOutlined />, label: 'Clients' },
        { key: '/activities', icon: <ScheduleOutlined />, label: 'Activities' },
        { key: '/quotations', icon: <AuditOutlined />, label: 'Quotations' },
      ],
    },
    {
      key: 'projects-group',
      label: 'Projects',
      type: 'group',
      children: [
        { key: '/projects', icon: <ProjectOutlined />, label: 'Projects' },
        { key: '/tasks', icon: <CarryOutOutlined />, label: 'Tasks' },
      ],
    },
    {
      key: 'finance-group',
      label: 'Finance',
      type: 'group',
      children: [
        { key: '/invoices', icon: <FileTextOutlined />, label: 'Invoices' },
        { key: '/payments', icon: <CreditCardOutlined />, label: 'Payments' },
      ],
    },
    {
      key: 'system',
      label: 'System',
      type: 'group',
      children: [
        { key: '/users', icon: <UserOutlined />, label: 'Users' },
      ],
    },
  ];

  // User Profile dropdown items
  const profileItems = [
    {
      key: 'profile',
      label: 'My Profile',
      icon: <UserOutlined />,
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: <SettingOutlined />,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Sign Out',
      icon: <LogoutOutlined />,
      danger: true,
    },
  ];

  const handleProfileClick = ({ key }) => {
    if (key === 'logout') {
      // Temporary simple logout
      navigate('/login');
    } else {
      navigate('/profile');
    }
  };

  // Convert current path to breadcrumbs
  const getBreadcrumbs = () => {
    const pathSnippets = location.pathname.split('/').filter(i => i);
    const breadcrumbItems = [
      {
        title: <Link to="/">Home</Link>,
        key: 'home',
      }
    ];

    pathSnippets.forEach((snippet, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
      const name = snippet.charAt(0).toUpperCase() + snippet.slice(1);
      breadcrumbItems.push({
        title: index === pathSnippets.length - 1 ? name : <Link to={url}>{name}</Link>,
        key: url,
      });
    });

    return breadcrumbItems;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        width={256}
        collapsedWidth={80}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: '0 24px',
          transition: 'all 0.2s'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar 
              size={36} 
              style={{ 
                backgroundColor: '#4f46e5', 
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)'
              }}
            >
              AG
            </Avatar>
            {!collapsed && (
              <Title level={4} style={{ margin: 0, color: '#ffffff', letterSpacing: '0.5px' }}>
                Antigravity <span style={{ fontSize: '10px', color: '#4f46e5', verticalAlign: 'super' }}>CRM</span>
              </Title>
            )}
          </div>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ paddingBottom: 24 }}
        />
      </Sider>
      <Layout>
        <Header>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <Space size={24}>
            <Badge count={3} size="small">
              <Button type="text" shape="circle" icon={<BellOutlined />} style={{ fontSize: '18px' }} />
            </Badge>
            <Dropdown 
              menu={{ 
                items: profileItems,
                onClick: handleProfileClick 
              }} 
              trigger={['click']}
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar style={{ backgroundColor: '#87d068' }} icon={<UserOutlined />} />
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.2' }} className="hidden-mobile">
                  <Text strong style={{ fontSize: '14px' }}>Demo Admin</Text>
                  <Text type="secondary" style={{ fontSize: '11px' }}>Administrator</Text>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: '0 16px' }}>
          <Breadcrumb 
            items={getBreadcrumbs()} 
            style={{ margin: '16px 0' }}
          />
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
            className="fade-in"
          >
            <Outlet />
          </div>
        </Content>
        <Footer style={{ textAlign: 'center', color: '#64748b' }}>
          Antigravity CRM &copy; {new Date().getFullYear()} - Production-Grade CRM Platform
        </Footer>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
