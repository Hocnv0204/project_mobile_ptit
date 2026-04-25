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

const PAGE_SIZE = 10;

type AdminListEnvelope = {
  data?: {
    content?: LessonVocab[];
    pageNumber?: number;
    totalElements?: number;
  };
};

const LessonVocabListPage: React.FC = () => {
  const [lessons, setLessons] = useState<LessonVocab[]>([]);
  const [totalLessons, setTotalLessons] = useState(0);
  const [lessonListPage, setLessonListPage] = useState(1);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm<CreateLessonVocabRequest>();

  const fetchLessons = async (current: number) => {
    setLoading(true);
    try {
      const lessonsRes = (await lessonVocabApi.getAdminPaged({
        page: Math.max(0, current - 1),
        size: PAGE_SIZE,
      })) as AdminListEnvelope;
      const page = lessonsRes?.data;
      const rows = page?.content || [];
      setLessons(rows);
      setTotalLessons(page?.totalElements ?? 0);
      setLessonListPage((page?.pageNumber ?? current - 1) + 1);
      if (rows.length === 0 && current > 1) {
        await fetchLessons(current - 1);
      }
    } catch {
      message.error("Failed to fetch lessons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [lessonsRes, levelsRes] = await Promise.all([
          lessonVocabApi.getAdminPaged({ page: 0, size: PAGE_SIZE }),
          levelApi.getAll(),
        ]);
        const lr = lessonsRes as AdminListEnvelope;
        const p = lr?.data;
        setLessons(p?.content || []);
        setTotalLessons(p?.totalElements ?? 0);
        setLessonListPage((p?.pageNumber ?? 0) + 1);
        setLevels((levelsRes as { data?: Level[] })?.data || []);
      } catch {
        message.error("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    void init();
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
      levelId: record.levelId,
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
          await fetchLessons(lessonListPage);
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
      await fetchLessons(editingId ? lessonListPage : 1);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Operation failed";
      message.error(errorMsg);
      console.error(error);
    }
  };

  const columns = [
    {
      title: "STT",
      key: "stt",
      width: 64,
      render: (_: unknown, __: LessonVocab, index: number) =>
        (lessonListPage - 1) * PAGE_SIZE + index + 1,
    },
    { title: "ID", dataIndex: "id", key: "id", width: 72 },
    { title: "Name", dataIndex: "name", key: "name" },
    {
      title: "Level",
      dataIndex: "levelId",
      key: "levelId",
      render: (levelId: number | null) =>
        levelId ? levels.find((l) => l.id === levelId)?.name || levelId : "N/A",
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
      width: 200,
      render: (_: unknown, record: LessonVocab) => (
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
          alignItems: "center",
        }}
      >
        <h2 style={{ margin: 0 }}>
          Lesson Vocabularies
          <span style={{ marginLeft: 12, fontSize: 14, fontWeight: 400, color: "#888" }}>
            (Tổng: {totalLessons} bài)
          </span>
        </h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add Lesson
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={lessons}
        rowKey="id"
        loading={loading}
        pagination={{
          current: lessonListPage,
          pageSize: PAGE_SIZE,
          total: totalLessons,
          showSizeChanger: false,
          showTotal: (t, range) => `${range[0]}-${range[1]} / ${t} bài`,
          onChange: (p) => {
            void fetchLessons(p);
          },
        }}
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
