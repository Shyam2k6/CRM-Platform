import React, { useState, useEffect } from 'react';
import { Card, Button, Tag, Modal, Form, Input, Select, DatePicker, Row, Col, Space, Typography, message, List } from 'antd';
import { PlusOutlined, SearchOutlined, ClockCircleOutlined, UserOutlined, TagOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const TASK_STATUSES = ['Todo', 'In Progress', 'Review', 'Completed'];

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form] = Form.useForm();

  const [searchParams] = useSearchParams();
  const initialProjectId = searchParams.get('projectId');
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || '');

  const fetchTasks = async (projId = selectedProjectId) => {
    setLoading(true);
    try {
      const res = await api.get('/tasks', {
        params: { projectId: projId || undefined }
      });
      if (res.data.success) {
        setTasks(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      if (res.data.success) {
        setProjects(res.data.data);
        
        // If a project is selected, populate the team members dropdown list
        const activeProj = res.data.data.find(p => p._id === selectedProjectId);
        if (activeProj) {
          // Managers + team members
          const members = [...(activeProj.teamMembers || [])];
          if (activeProj.projectManager) members.unshift(activeProj.projectManager);
          setTeamMembers(members);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, [selectedProjectId]);

  const handleProjectChange = (val) => {
    setSelectedProjectId(val || '');
    // Reset team members list until project is selected
    setTeamMembers([]);
  };

  // Drag and drop events
  const onDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = async (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    // Optimistic UI state update
    const originalTasks = [...tasks];
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: targetStatus } : t));

    try {
      const res = await api.put(`/tasks/${taskId}`, { status: targetStatus });
      if (res.data.success) {
        message.success(`Task status updated to ${targetStatus}`);
        fetchTasks(); // refresh
      }
    } catch (err) {
      setTasks(originalTasks);
      message.error('Failed to update task status');
    }
  };

  const showModal = (task = null) => {
    setEditingTask(task);
    if (task) {
      form.setFieldsValue({
        title: task.title,
        description: task.description,
        associatedProject: task.associatedProject?._id || task.associatedProject,
        assignedTo: task.assignedTo?._id || task.assignedTo,
        priority: task.priority,
        dueDate: task.dueDate ? dayjs(task.dueDate) : null,
        status: task.status,
      });
      // Populate team members for editing project
      const proj = projects.find(p => p._id === (task.associatedProject?._id || task.associatedProject));
      if (proj) {
        const members = [...(proj.teamMembers || [])];
        if (proj.projectManager) members.unshift(proj.projectManager);
        setTeamMembers(members);
      }
    } else {
      form.resetFields();
      if (selectedProjectId) {
        form.setFieldsValue({ associatedProject: selectedProjectId });
        // Prefill team members
        const proj = projects.find(p => p._id === selectedProjectId);
        if (proj) {
          const members = [...(proj.teamMembers || [])];
          if (proj.projectManager) members.unshift(proj.projectManager);
          setTeamMembers(members);
        }
      }
    }
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setEditingTask(null);
    form.resetFields();
  };

  const onFinish = async (values) => {
    try {
      const formatted = {
        ...values,
        dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
      };

      if (editingTask) {
        const res = await api.put(`/tasks/${editingTask._id}`, formatted);
        if (res.data.success) {
          message.success('Task details updated');
          fetchTasks();
          handleCancel();
        }
      } else {
        const res = await api.post('/tasks', formatted);
        if (res.data.success) {
          message.success('Task created successfully');
          fetchTasks();
          handleCancel();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (taskId) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this task?',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const res = await api.delete(`/tasks/${taskId}`);
          if (res.data.success) {
            message.success('Task deleted successfully');
            fetchTasks();
          }
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Low': return 'blue';
      case 'Medium': return 'orange';
      case 'High': return 'red';
      case 'Urgent': return 'magenta';
      default: return 'default';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Tasks Board</Title>
          <Paragraph type="secondary">Manage deliverable items. Drag and drop cards to change task stages.</Paragraph>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showModal()}
          disabled={!selectedProjectId}
        >
          New Task
        </Button>
      </div>

      {/* Select Project Filter */}
      <Card style={{ marginBottom: 24 }}>
        <Row align="middle" gutter={16}>
          <Col xs={24} sm={16} md={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text strong>Filter by Project:</Text>
              <Select
                style={{ flex: 1 }}
                placeholder="Select a project deliverable..."
                value={selectedProjectId || undefined}
                onChange={handleProjectChange}
                allowClear
              >
                {projects.map(p => (
                  <Option key={p._id} value={p._id}>{p.projectName}</Option>
                ))}
              </Select>
            </div>
          </Col>
          {!selectedProjectId && (
            <Col span={24} style={{ marginTop: 12 }}>
              <Text type="warning" italic>Please select a Project from the filter above to view, create, or drag tasks.</Text>
            </Col>
          )}
        </Row>
      </Card>

      {/* Kanban Board columns */}
      {selectedProjectId && (
        <Row gutter={16}>
          {TASK_STATUSES.map(status => {
            const statusTasks = tasks.filter(t => t.status === status);
            return (
              <Col xs={24} sm={12} md={6} key={status} onDragOver={onDragOver} onDrop={(e) => onDrop(e, status)}>
                <div className="kanban-column" style={{ minHeight: 500, background: '#f8fafc', padding: 12, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text strong style={{ fontSize: 15 }}>{status}</Text>
                    <Tag color="blue">{statusTasks.length}</Tag>
                  </div>

                  <div style={{ minHeight: 400 }}>
                    {statusTasks.map(task => (
                      <div
                        key={task._id}
                        className="kanban-card"
                        draggable="true"
                        onDragStart={(e) => onDragStart(e, task._id)}
                        style={{ padding: 14, background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 12 }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <Text strong style={{ fontSize: 13, color: '#1e293b', display: 'block', maxWidth: '80%' }}>
                            {task.title}
                          </Text>
                          <Tag color={getPriorityColor(task.priority)} style={{ fontSize: 9, marginRight: 0 }}>
                            {task.priority}
                          </Tag>
                        </div>
                        
                        {task.description && (
                          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                            {task.description.length > 60 ? task.description.slice(0, 60) + '...' : task.description}
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 8, fontSize: 11, color: '#64748b' }}>
                          <div>
                            <UserOutlined style={{ marginRight: 4 }} />
                            {task.assignedTo?.name ? task.assignedTo.name.split(' ')[0] : 'Unassigned'}
                          </div>
                          {task.dueDate && (
                            <div>
                              <ClockCircleOutlined style={{ marginRight: 4 }} />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8, gap: 4 }}>
                          <Button size="small" type="text" onClick={() => showModal(task)}>Edit</Button>
                          <Button size="small" type="text" danger onClick={() => handleDelete(task._id)}>Del</Button>
                        </div>
                      </div>
                    ))}
                    {statusTasks.length === 0 && (
                      <div style={{ border: '2px dashed #cbd5e1', borderRadius: 8, padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 11 }}>
                        No items in {status}
                      </div>
                    )}
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Task Modal */}
      <Modal
        title={editingTask ? 'Edit Task Details' : 'Create Task'}
        open={modalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ priority: 'Medium', status: 'Todo' }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="title"
            label="Task Summary"
            rules={[{ required: true, message: 'Please input task title!' }]}
          >
            <Input placeholder="e.g. Design Landing Page Mockup" />
          </Form.Item>

          <Form.Item name="description" label="Detailed Description">
            <TextArea rows={3} placeholder="Provide details of the deliverables..." />
          </Form.Item>

          <Form.Item
            name="associatedProject"
            label="Project"
            rules={[{ required: true, message: 'Project is required!' }]}
          >
            <Select disabled>
              {projects.map(p => (
                <Option key={p._id} value={p._id}>{p.projectName}</Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="assignedTo" label="Assignee">
                <Select placeholder="Assign team member" allowClear>
                  {teamMembers.map(member => (
                    <Option key={member._id} value={member._id}>{member.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="Priority">
                <Select>
                  <Option value="Low">Low</Option>
                  <Option value="Medium">Medium</Option>
                  <Option value="High">High</Option>
                  <Option value="Urgent">Urgent</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="dueDate" label="Due Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Status">
                <Select>
                  {TASK_STATUSES.map(s => (
                    <Option key={s} value={s}>{s}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 0, marginTop: 24 }}>
            <Space>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingTask ? 'Save Changes' : 'Create Task'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Tasks;
