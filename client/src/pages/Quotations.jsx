import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Tag, Modal, Form, Input, Select, DatePicker, Row, Col, Space, Typography, message, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined, FileTextOutlined, PrinterOutlined } from '@ant-design/icons';
import api from '../services/api';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const Quotations = () => {
  const [quotations, setQuotations] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Selected opportunity for quick fill
  const [selectedOpp, setSelectedOpp] = useState(null);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/quotations');
      if (res.data.success) {
        setQuotations(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelations = async () => {
    try {
      const oppRes = await api.get('/opportunities');
      if (oppRes.data.success) setOpportunities(oppRes.data.data);

      const clientRes = await api.get('/clients');
      if (clientRes.data.success) setClients(clientRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchQuotations();
    fetchRelations();
  }, []);

  const handleOppChange = (oppId) => {
    const opp = opportunities.find(o => o._id === oppId);
    if (opp) {
      setSelectedOpp(opp);
      // Try to find client with matching company name to pre-select
      const matchedClient = clients.find(c => c.companyName === opp.clientName);
      form.setFieldsValue({
        clientName: opp.clientName,
        associatedClient: matchedClient?._id || undefined,
        items: [{ description: opp.title + ' Development', quantity: 1, unitPrice: opp.dealValue, discount: 0, tax: 18 }]
      });
    }
  };

  const onFinish = async (values) => {
    try {
      const formatted = {
        ...values,
        validUntil: values.validUntil ? values.validUntil.toISOString() : undefined,
      };

      const res = await api.post('/quotations', formatted);
      if (res.data.success) {
        message.success('Quotation generated successfully');
        form.resetFields();
        setModalVisible(false);
        fetchQuotations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (quotationId, newStatus) => {
    try {
      const res = await api.put(`/quotations/${quotationId}`, { status: newStatus });
      if (res.data.success) {
        message.success(`Quotation marked as ${newStatus}`);
        fetchQuotations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrint = (record) => {
    Modal.info({
      title: `Quotation details: ${record.quotationNumber}`,
      width: 700,
      content: (
        <div style={{ padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3>CRM Business operations</h3>
              <div>Email: billing@crmhub.com</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2>QUOTATION</h2>
              <strong>Number:</strong> {record.quotationNumber}
              <div><strong>Date:</strong> {new Date(record.createdAt).toLocaleDateString()}</div>
              <div><strong>Valid Until:</strong> {record.validUntil ? new Date(record.validUntil).toLocaleDateString() : 'N/A'}</div>
            </div>
          </div>

          <Divider />

          <Row gutter={16} style={{ marginBottom: 20 }}>
            <Col span={12}>
              <strong>Billed To:</strong>
              <div>{record.associatedClient?.companyName || record.associatedOpportunity?.clientName}</div>
              <div>Attn: {record.associatedClient?.contactPerson || 'Contact Representative'}</div>
              <div>Email: {record.associatedClient?.email || 'N/A'}</div>
            </Col>
            <Col span={12}>
              <strong>Status:</strong> <Tag color="blue">{record.status}</Tag>
            </Col>
          </Row>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: 8, textAlign: 'left' }}>Description</th>
                <th style={{ padding: 8, textAlign: 'right' }}>Qty</th>
                <th style={{ padding: 8, textAlign: 'right' }}>Unit Price</th>
                <th style={{ padding: 8, textAlign: 'right' }}>Tax %</th>
                <th style={{ padding: 8, textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {record.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: 8 }}>{item.description}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{item.quantity}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>₹{item.unitPrice.toLocaleString()}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{item.tax}%</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>₹{item.subtotal.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: 250, textAlign: 'right' }}>
              <div>Subtotal: ₹{record.subTotal.toLocaleString()}</div>
              <div>Discount: -₹{record.discountTotal.toLocaleString()}</div>
              <div>Tax Total: ₹{record.taxTotal.toLocaleString()}</div>
              <Divider style={{ margin: '8px 0' }} />
              <h3>Grand Total: ₹{record.grandTotal.toLocaleString()}</h3>
            </div>
          </div>
        </div>
      )
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft': return 'default';
      case 'Sent': return 'blue';
      case 'Accepted': return 'success';
      case 'Rejected': return 'error';
      case 'Expired': return 'warning';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Quotation No',
      dataIndex: 'quotationNumber',
      key: 'quotationNumber',
      render: (text) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{text}</span>
    },
    {
      title: 'Client / Opportunity',
      dataIndex: 'associatedClient',
      key: 'clientOrOpp',
      render: (client, record) => (
        <div>
          <div>{client?.companyName || record.associatedOpportunity?.clientName}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>Deal: {record.associatedOpportunity?.title}</div>
        </div>
      )
    },
    {
      title: 'Grand Total',
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      render: (val) => <span style={{ fontWeight: 600, color: '#2563eb' }}>₹{val.toLocaleString()}</span>,
      sorter: (a, b) => a.grandTotal - b.grandTotal,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
    },
    {
      title: 'Valid Until',
      dataIndex: 'validUntil',
      key: 'validUntil',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button size="small" type="primary" icon={<PrinterOutlined />} onClick={() => handlePrint(record)}>
            View / Print
          </Button>
          {record.status === 'Draft' && (
            <Button size="small" onClick={() => updateStatus(record._id, 'Sent')}>
              Mark Sent
            </Button>
          )}
          {record.status === 'Sent' && (
            <>
              <Button size="small" type="dashed" onClick={() => updateStatus(record._id, 'Accepted')}>
                Accept
              </Button>
              <Button size="small" danger type="text" onClick={() => updateStatus(record._id, 'Rejected')}>
                Reject
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Quotations & Proposals</Title>
          <Paragraph type="secondary">Create commercial proposal calculations, print PDFs, and track client approvals.</Paragraph>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          New Quotation
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={quotations}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Creator Modal */}
      <Modal
        title="Generate Commercial Proposal"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
        width={750}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ status: 'Draft', items: [{ description: '', quantity: 1, unitPrice: 0, discount: 0, tax: 18 }] }}
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="associatedOpportunity"
                label="Link to Opportunity"
                rules={[{ required: true, message: 'Please link an opportunity!' }]}
              >
                <Select placeholder="Select opportunity" onChange={handleOppChange}>
                  {opportunities.map(opp => (
                    <Option key={opp._id} value={opp._id}>{opp.title} ({opp.clientName})</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="associatedClient" label="Link to Client Profile (Optional)">
                <Select placeholder="Link target client" allowClear>
                  {clients.map(c => (
                    <Option key={c._id} value={c._id}>{c.companyName}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="validUntil" label="Proposal Validity Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Quotation Status">
                <Select>
                  <Option value="Draft">Draft</Option>
                  <Option value="Sent">Sent</Option>
                  <Option value="Accepted">Accepted</Option>
                  <Option value="Expired">Expired</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '12px 0' }} />
          <Text strong>Proposal Line Items</Text>

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
                      <Col span={10}>
                        <Form.Item
                          {...restField}
                          name={[name, 'description']}
                          label="Description"
                          rules={[{ required: true, message: 'Description is required' }]}
                        >
                          <Input placeholder="e.g. React Frontend Development" />
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item
                          {...restField}
                          name={[name, 'quantity']}
                          label="Qty"
                          rules={[{ required: true, message: 'Required' }]}
                        >
                          <Input type="number" min={1} />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item
                          {...restField}
                          name={[name, 'unitPrice']}
                          label="Unit Price"
                          rules={[{ required: true, message: 'Required' }]}
                        >
                          <Input type="number" min={0} />
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item {...restField} name={[name, 'discount']} label="Disc %">
                          <Input type="number" min={0} max={100} />
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item {...restField} name={[name, 'tax']} label="Tax %">
                          <Input type="number" min={0} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>
                    Add Line Item
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 0, marginTop: 24 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Generate Proposal
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Quotations;
