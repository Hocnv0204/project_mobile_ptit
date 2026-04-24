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
  Row,
  Col,
  Statistic,
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

  // AI Bulk Add states
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const [formattedVocabs, setFormattedVocabs] = useState<Vocabulary[]>([]);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lessonsRes, levelsRes] = await Promise.all<any>([
        api.get("/api/lesson-vocab/admin"),
        api.get("/api/levels"),
      ]);
      setLessons(lessonsRes.data.content || []);
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
      const response: any = await api.get("/api/lesson-vocab/admin");
      setLessons(response.data.content || []);
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
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Operation failed";
      message.error(errorMsg);
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
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Operation failed";
      message.error(errorMsg);
    }
  };

  const handleFormatAI = async () => {
    if (!bulkInput.trim()) {
      message.warning("Please enter some terms");
      return;
    }
    setIsFormatting(true);
    try {
      const response: any = await api.post("/api/ai/terms/format", {
        input: bulkInput,
      });
      setFormattedVocabs(response.data || []);
      message.success("Formatted successfully!");
    } catch (error: any) {
      message.error("Failed to format with AI");
    } finally {
      setIsFormatting(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (formattedVocabs.length === 0) {
      message.warning("No vocabularies to create");
      return;
    }
    setIsSubmittingBulk(true);
    try {
      await api.post(`/api/vocab/${selectedLesson?.id}`, {
        listVocabRequest: formattedVocabs.map(({ term, vi, type, pronunciation, example }) => ({
          term,
          vi,
          type,
          pronunciation,
          example,
        })),
      });
      message.success("Bulk vocabularies created successfully!");
      fetchVocabularies(selectedLesson!.id);
      setIsBulkModalOpen(false);
      setBulkInput("");
      setFormattedVocabs([]);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Bulk creation failed";
      message.error(errorMsg);
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  const handleRemoveFormattedVocab = (index: number) => {
    const newList = [...formattedVocabs];
    newList.splice(index, 1);
    setFormattedVocabs(newList);
  };

  const lessonColumns = [
    { title: "STT", key: "stt", width: 60, render: (_: any, __: any, index: number) => index + 1 },
    {
      title: "Lesson Details",
      key: "details",
      render: (_: any, record: LessonVocab) => (
        <div>
          <div style={{ fontWeight: "bold" }}>{record.name}</div>
          <div style={{ fontSize: "12px", color: "#8c8c8c" }}>
            Level: {levels.find((l) => l.id === record.levelId)?.name || record.levelId}
          </div>
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 150,
      render: (_: any, record: LessonVocab) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleLessonSelect(record)}
          />
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditLesson(record)}
          />
          <Button
            size="small"
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDeleteLesson(record.id)}
          />
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
    <div style={{ padding: "0 8px" }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Total Lessons" value={lessons.length} valueStyle={{ fontSize: '20px' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Vocabularies" value={vocabularies.length} valueStyle={{ fontSize: '20px' }} />
          </Card>
        </Col>
      </Row>

      <Breadcrumb style={{ marginBottom: 8, fontSize: '12px' }}>
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
          size="small"
          title="Lesson Vocabularies"
          extra={
            <Button
              type="primary"
              size="small"
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
            size="small"
          />
        </Card>
      ) : (
        <Card
          size="small"
          title={
            <span style={{ fontSize: '14px' }}>
              <Button
                size="small"
                icon={<ArrowLeftOutlined />}
                onClick={() => setSelectedLesson(null)}
                style={{ marginRight: 8 }}
              />{" "}
              {selectedLesson.name}
            </span>
          }
          extra={
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setIsBulkModalOpen(true)}
            >
              Tạo danh sách từ với AI
            </Button>
          }
        >
          <Table
            columns={vocabColumns}
            dataSource={vocabularies}
            loading={loading}
            rowKey="id"
            size="small"
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
      <Modal
        title="Tạo danh sách từ vựng với AI"
        open={isBulkModalOpen}
        onCancel={() => {
          setIsBulkModalOpen(false);
          setFormattedVocabs([]);
        }}
        footer={
          formattedVocabs.length > 0
            ? [
                <Button
                  key="submit"
                  type="primary"
                  loading={isSubmittingBulk}
                  onClick={handleBulkSubmit}
                  style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                  block
                >
                  Tạo danh sách từ vựng ({formattedVocabs.length})
                </Button>,
              ]
            : null
        }
        width={900}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <p>Nhập danh sách các từ tiếng Anh hoặc tiếng Việt (phân tách bằng dấu phẩy hoặc xuống dòng):</p>
          <Input.TextArea
            rows={4}
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            placeholder="Ví dụ: xin chào, tạm biệt, apple, orange"
          />
          <Button
            type="primary"
            onClick={handleFormatAI}
            loading={isFormatting}
            block
          >
            Định dạng với AI
          </Button>

          {formattedVocabs.length > 0 && (
            <Table
              dataSource={formattedVocabs}
              columns={[
                { title: "Từ vựng", dataIndex: "term", key: "term" },
                { title: "Nghĩa", dataIndex: "vi", key: "vi" },
                { title: "Loại từ", dataIndex: "type", key: "type" },
                { title: "Phiên âm", dataIndex: "pronunciation", key: "pronunciation" },
                {
                  title: "Thao tác",
                  key: "action",
                  render: (_: any, __: any, index: number) => (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveFormattedVocab(index)}
                    />
                  ),
                },
              ]}
              pagination={false}
              size="small"
              rowKey={(record, index) => index || record.term}
              scroll={{ y: 400 }}
            />
          )}
        </Space>
      </Modal>
    </div>
  );
};

export default VocabListPage;
