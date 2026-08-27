import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Tag, Modal, Form, Input, Select, DatePicker, Row, Col, Space, Typography, message, Divider } from 'antd';
import { PlusOutlined, CreditCardOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../services/api';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  const [invoiceForm] = Form.useForm();
  const [paymentForm] = Form.useForm();

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/invoices');
      if (res.data.success) {
        setInvoices(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelations = async () => {
    try {
      const clientRes = await api.get('/clients');
      if (clientRes.data.success) setClients(clientRes.data.data);

      const projectRes = await api.get('/projects');
      if (projectRes.data.success) setProjects(projectRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchRelations();
  }, []);

  const handleCreateInvoice = async (values) => {
    try {
      const formatted = {
        ...values,
        dueDate: values.dueDate.toISOString(),
      };
      const res = await api.post('/invoices', formatted);
      if (res.data.success) {
        message.success('Invoice generated successfully');
        setInvoiceModalVisible(false);
        invoiceForm.resetFields();
        fetchInvoices();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecordPayment = async (values) => {
    try {
      const payload = {
        ...values,
        associatedInvoice: selectedInvoice._id,
        paymentDate: values.paymentDate ? values.paymentDate.toISOString() : undefined,
      };

      const res = await api.post('/payments', payload);
      if (res.data.success) {
        message.success('Payment recorded successfully');
        setPaymentModalVisible(false);
        paymentForm.resetFields();
        fetchInvoices();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const showPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    paymentForm.resetFields();
    paymentForm.setFieldsValue({ amount: invoice.dueAmount });
    setPaymentModalVisible(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft': return 'default';
      case 'Sent': return 'blue';
      case 'Partially Paid': return 'warning';
      case 'Paid': return 'success';
      case 'Overdue': return 'error';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Invoice No',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (text) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{text}</span>
    },
    {
      title: 'Client / Project',
      dataIndex: 'associatedClient',
      key: 'clientOrProj',
      render: (client, record) => (
        <div>
          <div>{client?.companyName}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>Project: {record.associatedProject?.projectName || 'N/A'}</div>
        </div>
      )
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (val) => <span>₹{val.toLocaleString()}</span>,
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
      title: 'Due Amount',
      dataIndex: 'dueAmount',
      key: 'dueAmount',
      render: (val) => <span style={{ fontWeight: 600, color: val > 0 ? '#ef4444' : '#10b981' }}>₹{val.toLocaleString()}</span>,
      sorter: (a, b) => a.dueAmount - b.dueAmount,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          {record.dueAmount > 0 && (
            <Button
              type="primary"
              size="small"
              icon={<CreditCardOutlined />}
              onClick={() => showPaymentModal(record)}
            >
              Record Payment
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
          <Title level={2} style={{ margin: 0 }}>Invoicing & Billing</Title>
          <Paragraph type="secondary">Generate corporate invoices, check outstanding balances, and record payments.</Paragraph>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setInvoiceModalVisible(true)}>
          Create Invoice
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={invoices}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Invoice Creator Modal */}
      <Modal
        title="Generate Invoice"
        open={invoiceModalVisible}
        onCancel={() => setInvoiceModalVisible(false)}
        footer={null}
        destroyOnClose
        width={600}
      >
        <Form
          form={invoiceForm}
          layout="vertical"
          onFinish={handleCreateInvoice}
          initialValues={{ status: 'Sent', items: [{ description: 'Project Milestone payment', amount: 0 }] }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="associatedClient"
            label="Client Account"
            rules={[{ required: true, message: 'Please select a client!' }]}
          >
            <Select placeholder="Select client company">
              {clients.map(c => (
                <Option key={c._id} value={c._id}>{c.companyName}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="associatedProject" label="Link to Project (Optional)">
            <Select placeholder="Link project deliverable" allowClear>
              {projects.map(p => (
                <Option key={p._id} value={p._id}>{p.projectName}</Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="dueDate"
                label="Due Date"
                rules={[{ required: true, message: 'Due date is required!' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Initial Status">
                <Select>
                  <Option value="Draft">Draft</Option>
                  <Option value="Sent">Sent</Option>
                  <Option value="Paid">Paid</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '12px 0' }} />
          <Text strong>Billing Line Items</Text>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card key={key} size="small" style={{ marginBottom: 12, background: '#f8fafc' }} extra={
                    fields.length > 1 && (
                      <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                    )
                  }>
                    <Row gutter={12}>
                      <Col span={16}>
                        <Form.Item
                          {...restField}
                          name={[name, 'description']}
                          label="Description"
                          rules={[{ required: true, message: 'Required' }]}
                        >
                          <Input placeholder="e.g. Design Wireframes Delivery" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'amount']}
                          label="Amount (INR)"
                          rules={[{ required: true, message: 'Required' }]}
                        >
                          <Input type="number" placeholder="e.g. 50000" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>
                    Add Billing Item
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 0, marginTop: 24 }}>
            <Space>
              <Button onClick={() => setInvoiceModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Generate Invoice
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        title={selectedInvoice ? `Record Payment for ${selectedInvoice.invoiceNumber}` : 'Record Payment'}
        open={paymentModalVisible}
        onCancel={() => setPaymentModalVisible(false)}
        footer={null}
        destroyOnClose
        width={450}
      >
        {selectedInvoice && (
          <div style={{ marginBottom: 16 }}>
            <div>Total Invoice Amount: <strong>₹{selectedInvoice.totalAmount.toLocaleString()}</strong></div>
            <div>Outstanding Due Amount: <strong>₹{selectedInvoice.dueAmount.toLocaleString()}</strong></div>
          </div>
        )}

        <Form
          form={paymentForm}
          layout="vertical"
          onFinish={handleRecordPayment}
          initialValues={{ paymentMethod: 'Bank Transfer' }}
        >
          <Form.Item
            name="amount"
            label="Payment Amount (INR)"
            rules={[
              { required: true, message: 'Please input payment amount!' },
              {
                validator: (_, value) => {
                  if (value && parseFloat(value) > selectedInvoice?.dueAmount) {
                    return Promise.reject(`Amount cannot exceed remaining due ₹${selectedInvoice.dueAmount.toLocaleString()}`);
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input type="number" prefix="₹" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="paymentMethod" label="Payment Method">
                <Select>
                  <Option value="Bank Transfer">Bank Transfer</Option>
                  <Option value="UPI">UPI</Option>
                  <Option value="Credit Card">Credit Card</Option>
                  <Option value="Cash">Cash</Option>
                  <Option value="Cheque">Cheque</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="paymentDate" label="Payment Date">
                <DatePicker style={{ width: '100%' }} defaultValue={dayjs()} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="reference" label="Transaction Reference No (Optional)">
            <Input placeholder="e.g. TXN987654321" />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input placeholder="e.g. Received from Arun" />
          </Form.Item>

          <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 0, marginTop: 24 }}>
            <Space>
              <Button onClick={() => setPaymentModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Record Payment
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Invoices;
