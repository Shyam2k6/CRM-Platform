import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Progress, Tag, Modal, Form, Input, Select, DatePicker, Row, Col, Space, Typography, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckSquareOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const Projects = () => {
  const { user: currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form] = Form.useForm();
  
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const oppId = searchParams.get('oppId');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects');
      if (res.data.success) {
        setProjects(res.data.data);
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

      const userRes = await api.get('/users');
      if (userRes.data.success) {
        const activeUsers = userRes.data.data.filter(u => u.isActive);
        setUsers(activeUsers);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handover workflow effect
  useEffect(() => {
    const handleHandover = async () => {
      if (oppId) {
        setLoading(true);
        try {
          message.loading({ content: 'Initiating Sales ➔ Project Handover...', key: 'handover' });
          
          // 1. Trigger Opportunity to Client conversion (sets stage Won & links client)
          const convertRes = await api.post(`/clients/convert-opportunity/${oppId}`);
          if (convertRes.data.success) {
            const clientObj = convertRes.data.data;
            
            // 2. Fetch the opportunity details for prefilling
            const oppRes = await api.get(`/opportunities/${oppId}`);
            if (oppRes.data.success) {
              const oppObj = oppRes.data.data;
              
              // 3. Open modal & prefill form
              showModal();
              form.setFieldsValue({
                projectName: oppObj.title,
                associatedClient: clientObj._id,
                associatedOpportunity: oppObj._id,
                budget: oppObj.dealValue,
                description: oppObj.notes,
              });

              message.success({ content: 'Handover complete! Please review and save the Project details.', key: 'handover', duration: 3 });
            }
          }
        } catch (err) {
          console.error(err);
          message.error({ content: 'Failed to complete project handover.', key: 'handover' });
        } finally {
          setLoading(false);
          // Clear query params to prevent re-opening on reload
          setSearchParams({});
        }
      }
    };

    fetchProjects();
    fetchRelations();
    handleHandover();
  }, [oppId]);

  const showModal = (project = null) => {
    setEditingProject(project);
    if (project) {
      form.setFieldsValue({
        projectName: project.projectName,
        associatedClient: project.associatedClient?._id || project.associatedClient,
        associatedOpportunity: project.associatedOpportunity?._id || project.associatedOpportunity,
        associatedQuotation: project.associatedQuotation?._id || project.associatedQuotation,
        budget: project.budget,
        startDate: project.startDate ? dayjs(project.startDate) : null,
        deadline: project.deadline ? dayjs(project.deadline) : null,
        status: project.status,
        projectManager: project.projectManager?._id || project.projectManager,
        teamMembers: project.teamMembers?.map(m => m._id) || [],
        description: project.description,
      });
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setEditingProject(null);
    form.resetFields();
  };

  const onFinish = async (values) => {
    try {
      const formatted = {
        ...values,
        startDate: values.startDate ? values.startDate.toISOString() : undefined,
        deadline: values.deadline ? values.deadline.toISOString() : undefined,
      };

      if (editingProject) {
        const res = await api.put(`/projects/${editingProject._id}`, formatted);
        if (res.data.success) {
          message.success('Project updated successfully');
          fetchProjects();
          handleCancel();
        }
      } else {
        const res = await api.post('/projects', formatted);
        if (res.data.success) {
          message.success('Project created successfully');
          fetchProjects();
          handleCancel();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (projId) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this project?',
      content: 'This will delete the project record.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const res = await api.delete(`/projects/${projId}`);
          if (res.data.success) {
            message.success('Project deleted successfully');
            fetchProjects();
          }
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Not Started': return 'default';
      case 'In Progress': return 'blue';
      case 'On Hold': return 'warning';
      case 'Completed': return 'success';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Project Name',
      dataIndex: 'projectName',
      key: 'projectName',
      render: (text, record) => (
        <div>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>{text}</span>
          <div style={{ fontSize: 11, color: '#64748b' }}>Client: {record.associatedClient?.companyName}</div>
        </div>
      ),
      sorter: (a, b) => a.projectName.localeCompare(b.projectName),
    },
    {
      title: 'Budget',
      dataIndex: 'budget',
      key: 'budget',
      render: (val) => <span style={{ fontWeight: 600 }}>₹{val.toLocaleString()}</span>,
      sorter: (a, b) => a.budget - b.budget,
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress) => (
        <div style={{ width: 140 }}>
          <Progress percent={progress} size="small" status={progress === 100 ? 'success' : 'active'} />
        </div>
      ),
      sorter: (a, b) => a.progress - b.progress,
    },
    {
      title: 'Deadline',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
      sorter: (a, b) => new Date(a.deadline) - new Date(b.deadline),
    },
    {
      title: 'Project Manager',
      dataIndex: 'projectManager',
      key: 'projectManager',
      render: (pm) => pm?.name || 'Unassigned'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            size="small"
            icon={<CheckSquareOutlined />}
            onClick={() => navigate(`/tasks?projectId=${record._id}`)}
          >
            Tasks
          </Button>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          >
            Edit
          </Button>
          {['Admin', 'Management'].includes(currentUser?.role) && (
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record._id)}
            >
              Delete
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
          <Title level={2} style={{ margin: 0 }}>Projects Hub</Title>
          <Paragraph type="secondary">Monitor active customer deliverables, track budgets, and manage team members.</Paragraph>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
          New Project
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={projects}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Project Creator Modal */}
      <Modal
        title={editingProject ? 'Edit Project Settings' : 'Initialize New Project'}
        open={modalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
        width={650}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ status: 'Not Started', progress: 0 }}
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="projectName"
                label="Project Deliverable Name"
                rules={[{ required: true, message: 'Please input the project name!' }]}
              >
                <Input placeholder="e.g. E-Commerce Website Development" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
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
            </Col>
            <Col span={12}>
              <Form.Item
                name="budget"
                label="Budget Allocated (INR)"
                rules={[{ required: true, message: 'Budget is required' }]}
              >
                <Input type="number" prefix="₹" placeholder="e.g. 180000" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label="Start Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="deadline" label="Project Deadline">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="projectManager" label="Project Manager (PM)">
                <Select placeholder="Assign PM" allowClear>
                  {users.filter(u => ['Admin', 'Management', 'Project Manager'].includes(u.role)).map(pm => (
                    <Option key={pm._id} value={pm._id}>{pm.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Project Status">
                <Select>
                  <Option value="Not Started">Not Started</Option>
                  <Option value="In Progress">In Progress</Option>
                  <Option value="On Hold">On Hold</Option>
                  <Option value="Completed">Completed</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="teamMembers" label="Team Members Assigned">
                <Select mode="multiple" placeholder="Select developers and testers" allowClear>
                  {users.map(u => (
                    <Option key={u._id} value={u._id}>{u.name} ({u.role})</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Project Scope / Requirements Summary">
            <TextArea rows={3} placeholder="Write requirements details here..." />
          </Form.Item>

          {/* Hidden handover details */}
          <Form.Item name="associatedOpportunity" style={{ display: 'none' }}>
            <Input />
          </Form.Item>

          <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 0, marginTop: 24 }}>
            <Space>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingProject ? 'Save Changes' : 'Initialize Project'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Projects;
