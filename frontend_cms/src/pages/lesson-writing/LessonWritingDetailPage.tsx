import React, { useEffect, useState } from "react";
import {
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Tag,
  message,
  Typography,
  Descriptions,
  Card,
  Table,
  Badge,
  Tooltip,
  Spin,
  Breadcrumb,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { lessonWritingApi } from "../../api/lessonWritingApi";
import type {
  LessonWriting,
  LessonSentence,
  CreateSentenceRequest,
  UpdateSentenceRequest,
} from "../../api/lessonWritingApi";

const { Title, Text } = Typography;

const statusColors: Record<string, string> = {
  COMPLETED: "success",
  GENERATING: "processing",
  FAILED: "error",
};

const LessonWritingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const lessonId = Number(id);

  const [lesson, setLesson] = useState<LessonWriting | null>(null);
  const [loading, setLoading] = useState(true);

  // Sentence modal
  const [isSentenceModalVisible, setIsSentenceModalVisible] = useState(false);
  const [editingSentence, setEditingSentence] = useState<LessonSentence | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentenceForm] = Form.useForm<CreateSentenceRequest | UpdateSentenceRequest>();

  const fetchLesson = async () => {
    setLoading(true);
    try {
      const res: any = await lessonWritingApi.getById(lessonId);
      setLesson(res.data);
    } catch {
      message.error("Không thể tải thông tin bài học");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lessonId) fetchLesson();
  }, [lessonId]);

  // ==================== Sentence Actions ====================

  const handleAddSentence = () => {
    setEditingSentence(null);
    sentenceForm.resetFields();
    setIsSentenceModalVisible(true);
  };

  const handleEditSentence = (sentence: LessonSentence) => {
    setEditingSentence(sentence);
    sentenceForm.setFieldsValue({
      sentenceVi: sentence.sentenceVi,
      orderIndex: sentence.orderIndex,
    });
    setIsSentenceModalVisible(true);
  };

  const handleDeleteSentence = (sentenceId: number) => {
    Modal.confirm({
      title: "Xác nhận xóa câu",
      content: "Bạn có chắc muốn xóa câu này? Từ vựng gợi ý của câu cũng sẽ bị xóa.",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await lessonWritingApi.deleteSentence(sentenceId);
          message.success("Đã xóa câu");
          fetchLesson();
        } catch {
          message.error("Xóa câu thất bại");
        }
      },
    });
  };

  const handleSentenceSubmit = async () => {
    try {
      const values = await sentenceForm.validateFields();
      setSubmitting(true);

      if (editingSentence) {
        await lessonWritingApi.updateSentence(editingSentence.id, {
          sentenceVi: (values as UpdateSentenceRequest).sentenceVi,
          orderIndex: (values as UpdateSentenceRequest).orderIndex,
        });
        message.success("Đã cập nhật câu");
      } else {
        await lessonWritingApi.createSentence({
          lessonWritingId: lessonId,
          sentenceVi: (values as CreateSentenceRequest).sentenceVi,
          orderIndex: (values as CreateSentenceRequest).orderIndex,
        });
        message.success("Đã thêm câu mới");
      }

      setIsSentenceModalVisible(false);
      fetchLesson();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Thao tác thất bại";
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ==================== Sentence Columns ====================

  const sentenceColumns = [
    {
      title: "STT",
      dataIndex: "orderIndex",
      key: "orderIndex",
      width: 60,
      render: (v: number, _: any, index: number) => v ?? index + 1,
    },
    {
      title: "Câu tiếng Việt",
      dataIndex: "sentenceVi",
      key: "sentenceVi",
      render: (text: string) => (
        <Text style={{ fontSize: 15 }}>{text}</Text>
      ),
    },
    {
      title: "Từ vựng gợi ý",
      dataIndex: "suggestVocabularies",
      key: "suggestVocabularies",
      render: (vocabs: any[]) =>
        vocabs && vocabs.length > 0 ? (
          <Space wrap size="small">
            {vocabs.map((v) => (
              <Tooltip
                key={v.id}
                title={`${v.vietnamese} | ${v.type} | ${v.pronunciation}`}
              >
                <Tag color="geekblue">{v.term}</Tag>
              </Tooltip>
            ))}
          </Space>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>Chưa có từ vựng</Text>
        ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      render: (_: any, record: LessonSentence) => (
        <Space size="small">
          <Tooltip title="Sửa">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditSentence(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              onClick={() => handleDeleteSentence(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Text type="danger">Không tìm thấy bài học</Text>
        <br />
        <Button
          style={{ marginTop: 16 }}
          onClick={() => navigate("/lesson-writing")}
          icon={<ArrowLeftOutlined />}
        >
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb + Back */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/lesson-writing")}
        >
          Quay lại
        </Button>
        <Breadcrumb
          items={[
            { title: "Lesson Writing", href: "/lesson-writing" },
            { title: lesson.name },
          ]}
        />
      </div>

      {/* Lesson Info Card */}
      <Card
        style={{ marginBottom: 24 }}
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>{lesson.name}</Title>
            <Badge
              status={(statusColors[lesson.status] as any) || "default"}
              text={lesson.status}
            />
            {lesson.deleteFlag && <Tag color="red">Đã xóa</Tag>}
          </Space>
        }
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchLesson}>
            Làm mới
          </Button>
        }
      >
        <Descriptions column={2} size="small">
          <Descriptions.Item label="ID">{lesson.id}</Descriptions.Item>
          <Descriptions.Item label="Tổng số câu">
            <Tag color="blue">{lesson.totalSentences ?? lesson.sentences?.length ?? 0} câu</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Chủ đề">
            {lesson.topicName || <Text type="secondary">—</Text>}
          </Descriptions.Item>
          <Descriptions.Item label="Trình độ">
            {lesson.levelName ? (
              <Tag color="purple">{lesson.levelName}</Tag>
            ) : (
              <Text type="secondary">—</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            {lesson.createdAt ? new Date(lesson.createdAt).toLocaleString("vi-VN") : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Cập nhật">
            {lesson.updatedAt ? new Date(lesson.updatedAt).toLocaleString("vi-VN") : "—"}
          </Descriptions.Item>
          {lesson.description && (
            <Descriptions.Item label="Mô tả" span={2}>
              <Text style={{ whiteSpace: "pre-wrap" }}>{lesson.description}</Text>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Sentences Section */}
      <Card
        title={
          <span style={{ fontSize: 16, fontWeight: 600 }}>
            Danh sách câu
            <Tag color="blue" style={{ marginLeft: 8 }}>
              {lesson.sentences?.length ?? 0}
            </Tag>
          </span>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddSentence}
          >
            Thêm câu
          </Button>
        }
      >
        <Table
          columns={sentenceColumns}
          dataSource={lesson.sentences || []}
          rowKey="id"
          pagination={false}
          locale={{ emptyText: "Chưa có câu nào. Hãy thêm câu đầu tiên!" }}
        />
      </Card>

      {/* Sentence Modal */}
      <Modal
        title={
          <Space>
            {editingSentence ? <EditOutlined /> : <PlusOutlined />}
            {editingSentence ? "Sửa câu" : "Thêm câu mới"}
          </Space>
        }
        open={isSentenceModalVisible}
        onOk={handleSentenceSubmit}
        onCancel={() => setIsSentenceModalVisible(false)}
        okText={editingSentence ? "Lưu" : "Thêm"}
        cancelText="Hủy"
        confirmLoading={submitting}
      >
        <Form form={sentenceForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="sentenceVi"
            label="Câu tiếng Việt"
            rules={[{ required: true, message: "Vui lòng nhập câu tiếng Việt" }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Nhập câu tiếng Việt..."
            />
          </Form.Item>
          <Form.Item
            name="orderIndex"
            label="Thứ tự (để trống = tự động)"
          >
            <InputNumber min={1} placeholder="Thứ tự câu" style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LessonWritingDetailPage;
