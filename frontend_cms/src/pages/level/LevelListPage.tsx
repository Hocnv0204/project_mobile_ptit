import React, { useEffect, useState } from "react";
import { Table, Button, Space, Modal, Form, Input, message } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { levelApi } from "../../api/levelApi";
import type { Level, CreateLevelRequest } from "../../api/levelApi";

const LevelListPage: React.FC = () => {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm<CreateLevelRequest>();

  const fetchLevels = async () => {
    setLoading(true);
    try {
      const response: any = await levelApi.getAll();
      setLevels(response.data || []);
    } catch (error) {
      message.error("Failed to fetch levels");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLevels();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: Level) => {
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: "Are you sure you want to delete this level?",
      onOk: async () => {
        try {
          await levelApi.delete(id);
          message.success("Level deleted");
          fetchLevels();
        } catch (error) {
          message.error("Failed to delete level");
        }
      },
    });
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await levelApi.update(editingId, values);
        message.success("Level updated");
      } else {
        await levelApi.create(values);
        message.success("Level created");
      }
      setIsModalVisible(false);
      fetchLevels();
    } catch (error) {
      console.error(error);
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Description", dataIndex: "description", key: "description" },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: Level) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <h2>Levels</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add Level
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={levels}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingId ? "Edit Level" : "Add Level"}
        open={isModalVisible}
        onOk={handleModalSubmit}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please input the name!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LevelListPage;
