import React, { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Table,
  Space,
  Modal,
  message,
  Card,
  Divider,
  Spin,
  Breadcrumb,
  Typography,
  Tooltip,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { lessonWritingApi } from "../../api/lessonWritingApi";
import type {
  ManualCreateLessonRequest,
  ManualSentence,
  ManualSuggestVocabulary,
} from "../../api/lessonWritingApi";
import { levelApi } from "../../api/levelApi";
import { topicApi } from "../../api/topicApi";
import type { Level } from "../../api/levelApi";
import type { Topic } from "../../api/topicApi";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface SentenceFormData extends ManualSentence {
  tempKey?: string;
}

interface VocabularyFormData extends ManualSuggestVocabulary {
  tempKey?: string;
}

const CreateManualLessonPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [levels, setLevels] = useState<Level[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [sentences, setSentences] = useState<SentenceFormData[]>([]);
  const [editingSentenceIdx, setEditingSentenceIdx] = useState<number | null>(
    null,
  );
  const [editingVocabIdx, setEditingVocabIdx] = useState<number | null>(null);
  const [isSentenceModalVisible, setIsSentenceModalVisible] = useState(false);
  const [isVocabModalVisible, setIsVocabModalVisible] = useState(false);
  const [sentenceForm] = Form.useForm();
  const [vocabForm] = Form.useForm();
  const [currentVocabs, setCurrentVocabs] = useState<VocabularyFormData[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [levelsRes, topicsRes] = await Promise.all([
        levelApi.getAll(),
        topicApi.getAll({ size: 100 }),
      ]);
      setLevels(levelsRes.data || []);
      setTopics(topicsRes.data?.content || topicsRes.data || []);
    } catch {
      message.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  // ==================== Sentence Management ====================

  const handleAddSentence = () => {
    setEditingSentenceIdx(null);
    setCurrentVocabs([]);
    sentenceForm.resetFields();
    setIsSentenceModalVisible(true);
  };

  const handleEditSentence = (index: number) => {
    setEditingSentenceIdx(index);
    const sentence = sentences[index];
    setCurrentVocabs(
      (sentence.suggestVocabularies || []).map((v, i) => ({
        ...v,
        tempKey: `vocab_${i}`,
      })),
    );
    sentenceForm.setFieldsValue({
      sentenceVi: sentence.sentenceVi,
      orderIndex: sentence.orderIndex,
    });
    setIsSentenceModalVisible(true);
  };

  const handleDeleteSentence = (index: number) => {
    setSentences((prev) => prev.filter((_, i) => i !== index));
    message.success("Xóa câu thành công");
  };

  const handleSaveSentence = async () => {
    try {
      const values = await sentenceForm.validateFields();
      const newSentence: SentenceFormData = {
        sentenceVi: values.sentenceVi,
        orderIndex: values.orderIndex,
        suggestVocabularies: currentVocabs,
        tempKey: `sentence_${Date.now()}`,
      };

      if (editingSentenceIdx !== null) {
        // Update
        const updated = [...sentences];
        updated[editingSentenceIdx] = newSentence;
        setSentences(updated);
        message.success("Cập nhật câu thành công");
      } else {
        // Add
        setSentences((prev) => [...prev, newSentence]);
        message.success("Thêm câu thành công");
      }

      setIsSentenceModalVisible(false);
      setCurrentVocabs([]);
      sentenceForm.resetFields();
    } catch {
      message.error("Vui lòng điền đầy đủ thông tin câu");
    }
  };

  // ==================== Vocabulary Management ====================

  const handleAddVocab = () => {
    setEditingVocabIdx(null);
    vocabForm.resetFields();
    setIsVocabModalVisible(true);
  };

  const handleEditVocab = (index: number) => {
    setEditingVocabIdx(index);
    const vocab = currentVocabs[index];
    vocabForm.setFieldsValue(vocab);
    setIsVocabModalVisible(true);
  };

  const handleDeleteVocab = (index: number) => {
    setCurrentVocabs((prev) => prev.filter((_, i) => i !== index));
    message.success("Xóa từ vựng thành công");
  };

  const handleSaveVocab = async () => {
    try {
      const values = await vocabForm.validateFields();
      const newVocab: VocabularyFormData = {
        ...values,
        tempKey: `vocab_${Date.now()}`,
      };

      if (editingVocabIdx !== null) {
        // Update
        const updated = [...currentVocabs];
        updated[editingVocabIdx] = newVocab;
        setCurrentVocabs(updated);
        message.success("Cập nhật từ vựng thành công");
      } else {
        // Add
        setCurrentVocabs((prev) => [...prev, newVocab]);
        message.success("Thêm từ vựng thành công");
      }

      setIsVocabModalVisible(false);
      vocabForm.resetFields();
    } catch {
      message.error("Vui lòng điền đầy đủ thông tin từ vựng");
    }
  };

  // ==================== Form Submission ====================

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (sentences.length === 0) {
        message.error("Vui lòng thêm ít nhất một câu");
        return;
      }

      setSubmitting(true);

      const request: ManualCreateLessonRequest = {
        name: values.name,
        description: values.description,
        topicId: values.topicId,
        levelId: values.levelId,
        sentences: sentences.map((s) => ({
          sentenceVi: s.sentenceVi,
          orderIndex: s.orderIndex,
          suggestVocabularies: s.suggestVocabularies,
        })),
      };

      await lessonWritingApi.createManual(request);
      message.success("Tạo bài học thành công!");
      navigate("/lesson-writing");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Tạo bài học thất bại";
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ==================== Render ====================

  const vocabColumns = [
    {
      title: "Từ (English)",
      dataIndex: "term",
      key: "term",
      width: "15%",
    },
    {
      title: "Dịch (Tiếng Việt)",
      dataIndex: "vietnamese",
      key: "vietnamese",
      width: "20%",
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: "10%",
    },
    {
      title: "Phát âm",
      dataIndex: "pronunciation",
      key: "pronunciation",
      width: "15%",
    },
    {
      title: "Ví dụ",
      dataIndex: "example",
      key: "example",
      width: "30%",
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text?.substring(0, 30)}...</span>
        </Tooltip>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: "10%",
      render: (_, __, index: number) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditVocab(index)}
          />
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteVocab(index)}
          />
        </Space>
      ),
    },
  ];

  const sentenceColumns = [
    {
      title: "STT",
      dataIndex: "orderIndex",
      key: "orderIndex",
      width: "5%",
    },
    {
      title: "Câu (Tiếng Việt)",
      dataIndex: "sentenceVi",
      key: "sentenceVi",
      width: "50%",
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text?.substring(0, 100)}...</span>
        </Tooltip>
      ),
    },
    {
      title: "Số từ vựng",
      dataIndex: "suggestVocabularies",
      key: "vocabCount",
      width: "10%",
      render: (vocabs: VocabularyFormData[]) => (
        <span>{vocabs?.length || 0}</span>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: "15%",
      render: (_, __, index: number) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditSentence(index)}
          >
            Sửa
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteSentence(index)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Breadcrumb
        items={[
          { title: "Trang chủ", onClick: () => navigate("/") },
          { title: "Bài học viết" },
          { title: "Tạo thủ công" },
        ]}
      />

      <div style={{ marginTop: "24px" }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/lesson-writing")}
        >
          Quay lại
        </Button>
      </div>

      <Title level={2} style={{ marginTop: "16px" }}>
        Tạo Bài Học Viết Thủ Công
      </Title>

      {loading ? (
        <Spin />
      ) : (
        <div style={{ maxWidth: "1200px" }}>
          {/* Basic Info */}
          <Card title="Thông tin cơ bản" style={{ marginBottom: "24px" }}>
            <Form
              form={form}
              layout="vertical"
              initialValues={{ levelId: undefined, topicId: undefined }}
            >
              <Form.Item
                label="Tên bài học"
                name="name"
                rules={[
                  { required: true, message: "Vui lòng nhập tên bài học" },
                ]}
              >
                <Input placeholder="Nhập tên bài học" />
              </Form.Item>

              <Form.Item
                label="Mô tả"
                name="description"
                rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
              >
                <TextArea rows={4} placeholder="Nhập mô tả bài học" />
              </Form.Item>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <Form.Item
                  label="Chủ đề"
                  name="topicId"
                  rules={[{ required: true, message: "Vui lòng chọn chủ đề" }]}
                >
                  <Select placeholder="Chọn chủ đề">
                    {topics.map((topic: any) => (
                      <Select.Option key={topic.id} value={topic.id}>
                        {topic.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Trình độ"
                  name="levelId"
                  rules={[
                    { required: true, message: "Vui lòng chọn trình độ" },
                  ]}
                >
                  <Select placeholder="Chọn trình độ">
                    {levels.map((level) => (
                      <Select.Option key={level.id} value={level.id}>
                        {level.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>
            </Form>
          </Card>

          {/* Sentences */}
          <Card
            title={`Các câu (${sentences.length})`}
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddSentence}
              >
                Thêm câu
              </Button>
            }
            style={{ marginBottom: "24px" }}
          >
            {sentences.length === 0 ? (
              <Text type="secondary">
                Chưa có câu nào. Hãy nhấn "Thêm câu" để bắt đầu.
              </Text>
            ) : (
              <Table
                columns={sentenceColumns}
                dataSource={sentences.map((s, i) => ({
                  ...s,
                  key: s.tempKey || i,
                }))}
                pagination={false}
                size="small"
              />
            )}
          </Card>

          {/* Submit */}
          <div
            style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}
          >
            <Button onClick={() => navigate("/lesson-writing")}>Hủy</Button>
            <Button
              type="primary"
              loading={submitting}
              onClick={handleSubmit}
              disabled={sentences.length === 0}
            >
              Tạo bài học
            </Button>
          </div>
        </div>
      )}

      {/* Sentence Modal */}
      <Modal
        title={editingSentenceIdx !== null ? "Sửa câu" : "Thêm câu"}
        open={isSentenceModalVisible}
        onOk={handleSaveSentence}
        onCancel={() => {
          setIsSentenceModalVisible(false);
          setEditingSentenceIdx(null);
          setCurrentVocabs([]);
        }}
        width={1000}
      >
        <Form form={sentenceForm} layout="vertical">
          <Form.Item
            label="Câu (Tiếng Việt)"
            name="sentenceVi"
            rules={[
              { required: true, message: "Vui lòng nhập câu tiếng Việt" },
            ]}
          >
            <TextArea rows={3} placeholder="Nhập câu tiếng Việt" />
          </Form.Item>

          <Form.Item
            label="Thứ tự"
            name="orderIndex"
            rules={[{ required: true, message: "Vui lòng nhập thứ tự" }]}
          >
            <InputNumber min={1} placeholder="Nhập thứ tự câu" />
          </Form.Item>
        </Form>

        <Divider>Từ vựng gợi ý</Divider>

        <Button
          type="dashed"
          block
          icon={<PlusOutlined />}
          onClick={handleAddVocab}
          style={{ marginBottom: "16px" }}
        >
          Thêm từ vựng
        </Button>

        {currentVocabs.length > 0 && (
          <Table
            columns={vocabColumns}
            dataSource={currentVocabs.map((v, i) => ({
              ...v,
              key: v.tempKey || i,
            }))}
            pagination={false}
            size="small"
            style={{ marginTop: "16px" }}
          />
        )}
      </Modal>

      {/* Vocabulary Modal */}
      <Modal
        title={editingVocabIdx !== null ? "Sửa từ vựng" : "Thêm từ vựng"}
        open={isVocabModalVisible}
        onOk={handleSaveVocab}
        onCancel={() => {
          setIsVocabModalVisible(false);
          setEditingVocabIdx(null);
        }}
      >
        <Form form={vocabForm} layout="vertical">
          <Form.Item
            label="Từ (English)"
            name="term"
            rules={[{ required: true, message: "Vui lòng nhập từ" }]}
          >
            <Input placeholder="Nhập từ tiếng Anh" />
          </Form.Item>

          <Form.Item
            label="Dịch (Tiếng Việt)"
            name="vietnamese"
            rules={[
              { required: true, message: "Vui lòng nhập dịch tiếng Việt" },
            ]}
          >
            <Input placeholder="Nhập dịch tiếng Việt" />
          </Form.Item>

          <Form.Item label="Loại từ" name="type">
            <Select placeholder="Chọn loại từ">
              <Select.Option value="noun">Danh từ</Select.Option>
              <Select.Option value="verb">Động từ</Select.Option>
              <Select.Option value="adjective">Tính từ</Select.Option>
              <Select.Option value="adverb">Trạng từ</Select.Option>
              <Select.Option value="preposition">Giới từ</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Phát âm" name="pronunciation">
            <Input placeholder="Nhập phát âm" />
          </Form.Item>

          <Form.Item label="Ví dụ" name="example">
            <TextArea rows={2} placeholder="Nhập ví dụ sử dụng từ" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CreateManualLessonPage;
