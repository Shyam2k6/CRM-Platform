import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, Card, Result } from 'antd';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';

// Custom Ant Design Theme configuration
const themeConfig = {
  token: {
    colorPrimary: '#4f46e5', // Slate/Indigo Indigo-600
    colorInfo: '#4f46e5',
    colorSuccess: '#10b981', // Emerald-500
    colorWarning: '#f59e0b', // Amber-500
    colorError: '#ef4444', // Rose-500
    borderRadius: 8,
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      siderBg: '#0f172a',
    },
    Menu: {
      darkItemBg: '#0f172a',
      darkItemColor: '#94a3b8',
      darkItemSelectedBg: '#4f46e5',
      darkItemSelectedColor: '#ffffff',
      darkItemHoverBg: '#1e293b',
    }
  }
};

// Clean placeholder page component for in-progress modules
const ModulePlaceholder = ({ name }) => (
  <Card className="glass-card" bordered={false} style={{ margin: '12px 0' }}>
    <Result
      status="info"
      title={`${name} Module`}
      subTitle="This module is planned for a later development phase. All routing, layout architecture, and theme bindings are fully configured."
    />
  </Card>
);

function App() {
  return (
    <ConfigProvider theme={themeConfig}>
      <Router>
        <Routes>
          {/* Main Layout containing all nested CRM routes */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            
            {/* CRM Modules */}
            <Route path="leads" element={<ModulePlaceholder name="Leads Management" />} />
            <Route path="opportunities" element={<ModulePlaceholder name="Opportunities & Sales Pipeline" />} />
            <Route path="clients" element={<ModulePlaceholder name="Clients (Client 360)" />} />
            <Route path="activities" element={<ModulePlaceholder name="Activities & Follow-ups" />} />
            <Route path="quotations" element={<ModulePlaceholder name="Quotations & Proposals" />} />
            
            {/* Project Modules */}
            <Route path="projects" element={<ModulePlaceholder name="Projects Management" />} />
            <Route path="tasks" element={<ModulePlaceholder name="Tasks Board" />} />
            
            {/* Finance Modules */}
            <Route path="invoices" element={<ModulePlaceholder name="Invoicing" />} />
            <Route path="payments" element={<ModulePlaceholder name="Payments Registry" />} />
            
            {/* System Modules */}
            <Route path="users" element={<ModulePlaceholder name="User Directory & Role Management" />} />
            <Route path="profile" element={<ModulePlaceholder name="User Profile" />} />
          </Route>

          {/* Fallback routes */}
          <Route path="*" element={
            <Result
              status="404"
              title="404"
              subTitle="Sorry, the page you visited does not exist."
            />
          } />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;
