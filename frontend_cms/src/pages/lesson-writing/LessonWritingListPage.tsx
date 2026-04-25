import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Tooltip,
  message,
  Badge,
  Typography,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UndoOutlined,
  RobotOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { lessonWritingApi } from "../../api/lessonWritingApi";
import type {
  LessonWritingSummary,
  CreateLessonWritingRequest,
  UpdateLessonWritingRequest,
} from "../../api/lessonWritingApi";
import { levelApi } from "../../api/levelApi";
import { topicApi } from "../../api/topicApi";
import type { Level } from "../../api/levelApi";
import type { Topic } from "../../api/topicApi";

const { Title } = Typography;

const statusColors: Record<string, string> = {
  COMPLETED: "success",
  GENERATING: "processing",
  FAILED: "error",
};

const LessonWritingListPage: React.FC = () => {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<LessonWritingSummary[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTopicId, setFilterTopicId] = useState<number | undefined>();
  const [filterLevelId, setFilterLevelId] = useState<number | undefined>();
  const [filterDeleted, setFilterDeleted] = useState<boolean | undefined>();

  // Modals
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingLesson, setEditingLesson] =
    useState<LessonWritingSummary | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [createForm] = Form.useForm<CreateLessonWritingRequest>();
  const [editForm] = Form.useForm<UpdateLessonWritingRequest>();

  const fetchData = async (page = 0) => {
    setLoading(true);
    try {
      const [lessonsRes, levelsRes, topicsRes] = await Promise.all<any>([
        lessonWritingApi.getAll({
          searchTerm: searchTerm || undefined,
          topicId: filterTopicId,
          levelId: filterLevelId,
          isDeleted: filterDeleted,
          page,
          size: pageSize,
        }),
        levelApi.getAll(),
        topicApi.getAll({ size: 100 }),
      ]);
      const pageData = lessonsRes.data;
      setLessons(pageData.content || []);
      setTotal(pageData.totalElements || 0);
      setLevels(levelsRes.data || []);
      setTopics(topicsRes.data?.content || topicsRes.data || []);
    } catch {
      message.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(0);
  }, [searchTerm, filterTopicId, filterLevelId, filterDeleted]);

  // ==================== Actions ====================

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc muốn xóa bài học này? (Xóa mềm)",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await lessonWritingApi.delete(id);
          message.success("Đã xóa bài học");
          fetchData(currentPage);
        } catch {
          message.error("Xóa bài học thất bại");
        }
      },
    });
  };

  const handleRestore = async (id: number) => {
    try {
      await lessonWritingApi.restore(id);
      message.success("Đã khôi phục bài học");
      fetchData(currentPage);
    } catch {
      message.error("Khôi phục thất bại");
    }
  };

  const handleCreateSubmit = async () => {
    try {
      const values = await createForm.validateFields();
      setSubmitting(true);
      await lessonWritingApi.generateWithAi(values);
      message.success("Đang tạo bài học bằng AI, vui lòng chờ...");
      setIsCreateModalVisible(false);
      createForm.resetFields();
      fetchData(0);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Tạo bài học thất bại";
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditOpen = (lesson: LessonWritingSummary) => {
    setEditingLesson(lesson);
    editForm.setFieldsValue({ name: lesson.name, description: "" });
    setIsEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    if (!editingLesson) return;
    try {
      const values = await editForm.validateFields();
      setSubmitting(true);
      await lessonWritingApi.update(editingLesson.id, values);
      message.success("Cập nhật thành công");
      setIsEditModalVisible(false);
      fetchData(currentPage);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Cập nhật thất bại";
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ==================== Columns ====================

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 60,
    },
    {
      title: "Tên bài học",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: LessonWritingSummary) => (
        <Button
          type="link"
          style={{
            padding: 0,
            textAlign: "left",
            height: "auto",
            whiteSpace: "normal",
          }}
          onClick={() => navigate(`/lesson-writing/${record.id}`)}
        >
          {name}
        </Button>
      ),
    },
    {
      title: "Chủ đề",
      dataIndex: "topicName",
      key: "topicName",
      render: (v: string | null) =>
        v || <span style={{ color: "#999" }}>—</span>,
    },
    {
      title: "Trình độ",
      dataIndex: "levelName",
      key: "levelName",
      render: (v: string | null) =>
        v ? (
          <Tag color="blue">{v}</Tag>
        ) : (
          <span style={{ color: "#999" }}>—</span>
        ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Badge
          status={(statusColors[status] as any) || "default"}
          text={status || "—"}
        />
      ),
    },
    {
      title: "Đã xóa",
      dataIndex: "deleteFlag",
      key: "deleteFlag",
      render: (v: boolean) =>
        v ? <Tag color="red">Đã xóa</Tag> : <Tag color="green">Hoạt động</Tag>,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (d: string) =>
        d ? new Date(d).toLocaleDateString("vi-VN") : "—",
    },
    {
      title: "Thao tác",
      key: "action",
      width: 180,
      render: (_: any, record: LessonWritingSummary) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => navigate(`/lesson-writing/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditOpen(record)}
            />
          </Tooltip>
          {record.deleteFlag ? (
            <Tooltip title="Khôi phục">
              <Button
                icon={<UndoOutlined />}
                size="small"
                style={{ color: "#52c41a", borderColor: "#52c41a" }}
                onClick={() => handleRestore(record.id)}
              />
            </Tooltip>
          ) : (
            <Tooltip title="Xóa">
              <Button
                icon={<DeleteOutlined />}
                size="small"
                danger
                onClick={() => handleDelete(record.id)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Quản lý Lesson Writing
        </Title>
        <Space>
          <Button
            type="primary"
            onClick={() => navigate("/lesson-writing/create-manual")}
          >
            Tạo thủ công
          </Button>
          <Button
            type="primary"
            icon={<RobotOutlined />}
            onClick={() => {
              createForm.resetFields();
              setIsCreateModalVisible(true);
            }}
          >
            Tạo bài với AI
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
          background: "#fafafa",
          padding: "12px 16px",
          borderRadius: 8,
          border: "1px solid #f0f0f0",
        }}
      >
        <Input
          placeholder="Tìm kiếm theo tên..."
          prefix={<SearchOutlined />}
          style={{ width: 220 }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
        />
        <Select
          placeholder="Lọc theo chủ đề"
          style={{ width: 180 }}
          allowClear
          value={filterTopicId}
          onChange={(v) => setFilterTopicId(v)}
        >
          {topics.map((t) => (
            <Select.Option key={t.id} value={t.id}>
              {t.name}
            </Select.Option>
          ))}
        </Select>
        <Select
          placeholder="Lọc theo trình độ"
          style={{ width: 160 }}
          allowClear
          value={filterLevelId}
          onChange={(v) => setFilterLevelId(v)}
        >
          {levels.map((l) => (
            <Select.Option key={l.id} value={l.id}>
              {l.name}
            </Select.Option>
          ))}
        </Select>
        <Select
          placeholder="Trạng thái xóa"
          style={{ width: 150 }}
          allowClear
          value={filterDeleted}
          onChange={(v) => setFilterDeleted(v)}
        >
          <Select.Option value={false}>Hoạt động</Select.Option>
          <Select.Option value={true}>Đã xóa</Select.Option>
        </Select>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={lessons}
        rowKey="id"
        loading={loading}
        pagination={{
          total,
          current: currentPage + 1,
          pageSize,
          onChange: (p) => {
            setCurrentPage(p - 1);
            fetchData(p - 1);
          },
          showTotal: (t) => `Tổng ${t} bài học`,
        }}
        rowClassName={(record: LessonWritingSummary) =>
          record.deleteFlag ? "ant-table-row-deleted" : ""
        }
      />

      {/* Create Modal (Generate with AI) */}
      <Modal
        title={
          <Space>
            <RobotOutlined style={{ color: "#1890ff" }} />
            Tạo bài học với AI
          </Space>
        }
        open={isCreateModalVisible}
        onOk={handleCreateSubmit}
        onCancel={() => setIsCreateModalVisible(false)}
        okText="Tạo với AI"
        cancelText="Hủy"
        confirmLoading={submitting}
        width={600}
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="draftName"
            label="Tên tạm thời (Draft Name)"
            rules={[{ required: true, message: "Vui lòng nhập tên tạm thời" }]}
          >
            <Input placeholder="VD: Bài học về gia đình..." />
          </Form.Item>
          <Form.Item
            name="topicId"
            label="Chủ đề"
            rules={[{ required: true, message: "Vui lòng chọn chủ đề" }]}
          >
            <Select
              placeholder="Chọn chủ đề"
              showSearch
              optionFilterProp="children"
            >
              {topics.map((t) => (
                <Select.Option key={t.id} value={t.id}>
                  {t.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="levelId"
            label="Trình độ"
            rules={[{ required: true, message: "Vui lòng chọn trình độ" }]}
          >
            <Select placeholder="Chọn trình độ">
              {levels.map((l) => (
                <Select.Option key={l.id} value={l.id}>
                  {l.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="description"
            label="Mô tả nội dung (AI sẽ dựa vào đây để tạo bài)"
            rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Mô tả chi tiết nội dung bài học bạn muốn AI tạo..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title={
          <Space>
            <EditOutlined />
            Chỉnh sửa bài học
          </Space>
        }
        open={isEditModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => setIsEditModalVisible(false)}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={submitting}
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Tên bài học">
            <Input placeholder="Tên bài học" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Mô tả bài học" />
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        .ant-table-row-deleted td {
          opacity: 0.55;
        }
      `}</style>
    </div>
  );
};

export default LessonWritingListPage;
