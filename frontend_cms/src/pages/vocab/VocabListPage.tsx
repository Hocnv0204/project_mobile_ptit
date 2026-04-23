import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Space,
  Card,
  Breadcrumb,
  message,
  Modal,
  Form,
  Input,
  Select,
  Tag,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import api from "../../api/axios";

interface Level {
  id: number;
  name: string;
  description: string;
}

interface LessonVocab {
  id: number;
  name: string;
  description: string;
  levelId: number;
}

interface Vocabulary {
  id: number;
  term: string;
  vi: string;
  type: string;
  pronunciation: string;
  example: string;
  imageUrl?: string;
  audioUrl?: string;
}

const VocabListPage: React.FC = () => {
  const [lessons, setLessons] = useState<LessonVocab[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<LessonVocab | null>(
    null,
  );
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVocab, setEditingVocab] = useState<Vocabulary | null>(null);
  const [form] = Form.useForm();

  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonVocab | null>(null);
  const [lessonForm] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lessonsRes, levelsRes] = await Promise.all<any>([
        api.get("/api/lesson-vocab"),
        api.get("/api/levels"),
      ]);
      setLessons(lessonsRes.data || []);
      setLevels(levelsRes.data || []);
    } catch (error) {
      message.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const response: any = await api.get("/api/lesson-vocab");
      setLessons(response.data || []);
    } catch (error) {
      message.error("Failed to fetch lessons");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLesson = () => {
    setEditingLesson(null);
    lessonForm.resetFields();
    setIsLessonModalOpen(true);
  };

  const handleEditLesson = (lesson: LessonVocab) => {
    setEditingLesson(lesson);
    lessonForm.setFieldsValue(lesson);
    setIsLessonModalOpen(true);
  };

  const handleDeleteLesson = async (id: number) => {
    Modal.confirm({
      title: "Are you sure you want to delete this lesson?",
      onOk: async () => {
        try {
          await api.delete(`/api/lesson-vocab/${id}`);
          message.success("Lesson deleted");
          fetchLessons();
        } catch (error) {
          message.error("Delete failed");
        }
      },
    });
  };

  const handleLessonModalOk = async () => {
    try {
      const values = await lessonForm.validateFields();
      if (editingLesson) {
        await api.put(`/api/lesson-vocab/${editingLesson.id}`, values);
        message.success("Lesson updated");
      } else {
        await api.post("/api/lesson-vocab", values);
        message.success("Lesson created");
      }
      fetchLessons();
      setIsLessonModalOpen(false);
    } catch (error) {
      message.error("Operation failed");
    }
  };

  const fetchVocabularies = async (lessonId: number) => {
    setLoading(true);
    try {
      const response: any = await api.get(
        `/api/lesson-vocab/${lessonId}/vocabularies`,
      );
      setVocabularies(response.data);
    } catch (error) {
      message.error("Failed to fetch vocabularies");
    } finally {
      setLoading(false);
    }
  };

  const handleLessonSelect = (lesson: LessonVocab) => {
    setSelectedLesson(lesson);
    fetchVocabularies(lesson.id);
  };

  const handleAddVocab = () => {
    setEditingVocab(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditVocab = (vocab: Vocabulary) => {
    setEditingVocab(vocab);
    form.setFieldsValue(vocab);
    setIsModalOpen(true);
  };

  const handleDeleteVocab = async (id: number) => {
    Modal.confirm({
      title: "Are you sure you want to delete this vocabulary?",
      onOk: async () => {
        try {
          // Backend doesn't seem to have a direct DELETE for vocab,
          // I'll assume we update the lesson vocab list or there's a missing endpoint.
          // For now, I'll mock it if not found, but I'll try to find if it exists.
          // Wait, I saw VocabularyController only has POST.
          message.warning(
            "Delete functionality depends on backend implementation.",
          );
        } catch (error) {
          message.error("Delete failed");
        }
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingVocab) {
        // Update
        message.success("Update simulated (endpoint pending)");
      } else {
        // Create
        await api.post(`api/vocab/${selectedLesson?.id}/single`, values);
        message.success("Vocabulary created!");
        fetchVocabularies(selectedLesson!.id);
      }
      setIsModalOpen(false);
    } catch (error) {
      message.error("Operation failed");
    }
  };

  const lessonColumns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Description", dataIndex: "description", key: "description" },
    {
      title: "Level",
      dataIndex: "levelId",
      key: "levelId",
      render: (levelId: number) => {
        const level = levels.find((l) => l.id === levelId);
        return level ? level.name : levelId;
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: LessonVocab) => (
        <Space size="middle">
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleLessonSelect(record)}
          >
            View Vocabs
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEditLesson(record)}
          >
            Edit
          </Button>
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDeleteLesson(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const vocabColumns = [
    {
      title: "Term",
      dataIndex: "term",
      key: "term",
      render: (text: string) => <b>{text}</b>,
    },
    { title: "Meaning", dataIndex: "vi", key: "vi" },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: "Pronunciation",
      dataIndex: "pronunciation",
      key: "pronunciation",
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: Vocabulary) => (
        <Space size="middle">
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEditVocab(record)}
          />
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDeleteVocab(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item
          onClick={() => setSelectedLesson(null)}
          style={{ cursor: "pointer" }}
        >
          Vocabulary
        </Breadcrumb.Item>
        {selectedLesson && (
          <Breadcrumb.Item>{selectedLesson.name}</Breadcrumb.Item>
        )}
      </Breadcrumb>

      {!selectedLesson ? (
        <Card
          title="Lesson Vocabularies"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddLesson}
            >
              Add Lesson
            </Button>
          }
        >
          <Table
            columns={lessonColumns}
            dataSource={lessons}
            loading={loading}
            rowKey="id"
          />
        </Card>
      ) : (
        <Card
          title={
            <span>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => setSelectedLesson(null)}
                style={{ marginRight: 8 }}
              />{" "}
              Vocabularies in {selectedLesson.name}
            </span>
          }
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddVocab}
            >
              Add Vocabulary
            </Button>
          }
        >
          <Table
            columns={vocabColumns}
            dataSource={vocabularies}
            loading={loading}
            rowKey="id"
          />
        </Card>
      )}

      <Modal
        title={editingVocab ? "Edit Vocabulary" : "Add Vocabulary"}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="term" label="Term" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="vi"
            label="Vietnamese Meaning"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="type" label="Type">
            <Select placeholder="Select type">
              <Select.Option value="noun">Noun</Select.Option>
              <Select.Option value="verb">Verb</Select.Option>
              <Select.Option value="adj">Adjective</Select.Option>
              <Select.Option value="adv">Adverb</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="pronunciation" label="Pronunciation">
            <Input />
          </Form.Item>
          <Form.Item name="example" label="Example">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="imageUrl" label="Image URL">
            <Input />
          </Form.Item>
          <Form.Item name="audioUrl" label="Audio URL">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingLesson ? "Edit Lesson" : "Add Lesson"}
        open={isLessonModalOpen}
        onOk={handleLessonModalOk}
        onCancel={() => setIsLessonModalOpen(false)}
      >
        <Form form={lessonForm} layout="vertical">
          <Form.Item
            name="name"
            label="Lesson Name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="levelId" label="Level" rules={[{ required: true }]}>
            <Select placeholder="Select level">
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

export default VocabListPage;
