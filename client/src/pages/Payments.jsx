import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Space } from 'antd';
import api from '../services/api';

const { Title, Paragraph } = Typography;

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments');
      if (res.data.success) {
        setPayments(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const columns = [
    {
      title: 'Payment Date',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      render: (date) => new Date(date).toLocaleString(),
      sorter: (a, b) => new Date(a.paymentDate) - new Date(b.paymentDate),
    },
    {
      title: 'Invoice Number',
      dataIndex: 'associatedInvoice',
      key: 'invoiceNum',
      render: (invoice) => (
        <div>
          <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{invoice?.invoiceNumber}</span>
          <div style={{ fontSize: 11, color: '#64748b' }}>Client: {invoice?.associatedClient?.companyName}</div>
        </div>
      )
    },
    {
      title: 'Amount Logged',
      dataIndex: 'amount',
      key: 'amount',
      render: (val) => <span style={{ fontWeight: 600, color: '#10b981' }}>₹{val.toLocaleString()}</span>,
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Payment Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
    },
    {
      title: 'Transaction Reference',
      dataIndex: 'reference',
      key: 'reference',
      render: (ref) => ref || 'N/A'
    },
    {
      title: 'Recorded By',
      dataIndex: 'recordedBy',
      key: 'recordedBy',
      render: (user) => user?.name || 'System'
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Payments Log</Title>
        <Paragraph type="secondary">Review the full transaction audit log of client invoice settlements.</Paragraph>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={payments}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default Payments;
