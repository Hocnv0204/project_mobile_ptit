import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  message,
  Select,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { lessonVocabApi } from "../../api/lessonVocabApi";
import type {
  LessonVocab,
  CreateLessonVocabRequest,
} from "../../api/lessonVocabApi";
import { levelApi } from "../../api/levelApi";
import type { Level } from "../../api/levelApi";

const LessonVocabListPage: React.FC = () => {
  const [lessons, setLessons] = useState<LessonVocab[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm<CreateLessonVocabRequest>();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lessonsRes, levelsRes] = await Promise.all<any>([
        lessonVocabApi.getAll(),
        levelApi.getAll(),
      ]);
      setLessons(lessonsRes.data.content || []);
      setLevels(levelsRes.data || []);
    } catch (error) {
      message.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: LessonVocab) => {
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      levelId: record.levelId ?? undefined,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: "Are you sure you want to delete this lesson?",
      onOk: async () => {
        try {
          await lessonVocabApi.delete(id);
          message.success("Lesson deleted");
          fetchData();
        } catch (error) {
          message.error("Failed to delete lesson");
        }
      },
    });
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await lessonVocabApi.update(editingId, values);
        message.success("Lesson updated");
      } else {
        await lessonVocabApi.create(values);
        message.success("Lesson created");
      }
      setIsModalVisible(false);
      fetchData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Operation failed";
      message.error(errorMsg);
      console.error(error);
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Name", dataIndex: "name", key: "name" },
    {
      title: "Level",
      dataIndex: "levelId",
      key: "levelId",
      render: (levelId: number | null) =>
        levelId ? (levels.find((l) => l.id === levelId)?.name || levelId) : "N/A",
    },
    { title: "Created By", dataIndex: "createBy", key: "createBy" },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: LessonVocab) => (
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
        <h2>Lesson Vocabularies</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add Lesson
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={lessons}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingId ? "Edit Lesson" : "Add Lesson"}
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
          <Form.Item
            name="levelId"
            label="Level"
            rules={[{ required: true, message: "Please select a level!" }]}
          >
            <Select>
              {levels.map((level) => (
                <Select.Option key={level.id} value={level.id}>
                  {level.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LessonVocabListPage;
