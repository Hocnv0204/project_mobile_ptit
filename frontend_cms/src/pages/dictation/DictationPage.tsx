import React, { useEffect, useState } from 'react';
import {
  Table, Button, Space, Card, message, Modal, Form, Input,
  Upload, Tag, Tooltip, Popconfirm, Row, Col, Statistic, Badge, Typography, Divider,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, UploadOutlined,
  YoutubeOutlined, PlayCircleOutlined, FileTextOutlined,
  SoundOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import api from '../../api/axios';

const { Title, Text } = Typography;

interface DictationItem {
  id: string;
  title: string;
  mediaUrl: string;
  totalSegments: number;
}

/** Trích xuất YouTube video ID từ nhiều dạng URL */
function extractYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/v\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

const DictationPage: React.FC = () => {
  const [dictations, setDictations] = useState<DictationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [srtFile, setSrtFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewModal, setPreviewModal] = useState<{ open: boolean; url: string; title: string }>({
    open: false, url: '', title: '',
  });

  useEffect(() => {
    fetchDictations();
  }, []);

  // ── API: Fetch list ──────────────────────────────────
  const fetchDictations = async () => {
    setLoading(true);
    try {
      // axios interceptor unwraps response → response.data (= BaseResponse)
      // so `res` here is BaseResponse { code, message, data: DictationItem[] }
      const res: any = await api.get('/admin/dictations');
      setDictations(res.data || []);
    } catch {
      message.error('Không thể tải danh sách dictation');
    } finally {
      setLoading(false);
    }
  };

  // ── Upload props (no auto-upload) ────────────────────
  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      const name = file.name.toLowerCase();
      if (!name.endsWith('.srt') && !name.endsWith('.vtt')) {
        message.error('Chỉ chấp nhận file .srt hoặc .vtt');
        return Upload.LIST_IGNORE;
      }
      setSrtFile(file as unknown as File);
      return false;
    },
    maxCount: 1,
    accept: '.srt,.vtt',
    onRemove: () => { setSrtFile(null); },
    fileList: srtFile ? [{ uid: '-1', name: srtFile.name, status: 'done' } as any] : [],
  };

  // ── Watch YouTube URL → live embed preview ───────────
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vid = extractYoutubeId(e.target.value);
    setPreviewUrl(vid ? `https://www.youtube.com/embed/${vid}` : '');
  };

  // ── Create dictation ─────────────────────────────────
  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      if (!srtFile) {
        message.error('Vui lòng upload file SRT hoặc VTT');
        return;
      }
      setSubmitting(true);

      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('youtubeUrl', values.youtubeUrl);
      formData.append('srtFile', srtFile);

      await api.post('/admin/dictations', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      } as any);

      message.success('✅ Tạo dictation thành công!');
      setIsModalOpen(false);
      form.resetFields();
      setSrtFile(null);
      setPreviewUrl('');
      fetchDictations();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Tạo thất bại';
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete dictation ─────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/dictations/${id}`);
      message.success('Đã xoá dictation');
      fetchDictations();
    } catch {
      message.error('Xoá thất bại');
    }
  };

  // ── Stats ────────────────────────────────────────────
  const totalSegments = dictations.reduce((s, d) => s + d.totalSegments, 0);

  // ── Table columns ────────────────────────────────────
  const columns = [
    {
      title: '#',
      key: 'index',
      width: 50,
      render: (_: any, __: any, idx: number) => (
        <Text type="secondary" style={{ fontSize: 12 }}>{idx + 1}</Text>
      ),
    },
    {
      title: 'Thumbnail',
      dataIndex: 'mediaUrl',
      key: 'thumb',
      width: 110,
      render: (url: string, record: DictationItem) => {
        const vid = extractYoutubeId(url);
        return vid ? (
          <div
            style={{ position: 'relative', cursor: 'pointer', borderRadius: 6, overflow: 'hidden', width: 96, height: 54 }}
            onClick={() => setPreviewModal({ open: true, url: `https://www.youtube.com/embed/${vid}?autoplay=1`, title: record.title })}
          >
            <img
              src={`https://img.youtube.com/vi/${vid}/mqdefault.jpg`}
              alt={record.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.30)',
            }}>
              <PlayCircleOutlined style={{ color: '#fff', fontSize: 22 }} />
            </div>
          </div>
        ) : (
          <div style={{ width: 96, height: 54, background: '#f0f0f0', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <YoutubeOutlined style={{ color: '#ccc', fontSize: 24 }} />
          </div>
        );
      },
    },
    {
      title: 'Tên bài',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'YouTube URL',
      dataIndex: 'mediaUrl',
      key: 'mediaUrl',
      ellipsis: true,
      render: (url: string) => (
        <Tooltip title={url}>
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#1677ff' }}>
            <YoutubeOutlined style={{ color: '#FF0000', marginRight: 5 }} />
            {url.length > 42 ? url.slice(0, 42) + '…' : url}
          </a>
        </Tooltip>
      ),
    },
    {
      title: 'Số câu',
      dataIndex: 'totalSegments',
      key: 'totalSegments',
      width: 100,
      align: 'center' as const,
      render: (n: number) => (
        <Tag color={n > 0 ? 'blue' : 'default'} icon={<FileTextOutlined />}>
          {n} câu
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 110,
      align: 'center' as const,
      render: (_: any, record: DictationItem) => (
        record.totalSegments > 0
          ? <Badge status="success" text="Sẵn sàng" />
          : <Badge status="warning" text="Trống" />
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 80,
      align: 'center' as const,
      render: (_: any, record: DictationItem) => (
        <Space>
          <Popconfirm
            title="Xoá bài dictation này?"
            description="Toàn bộ segment sẽ bị xoá vĩnh viễn."
            onConfirm={() => handleDelete(record.id)}
            okText="Xoá"
            okType="danger"
            cancelText="Huỷ"
          >
            <Button icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '8px 0' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <Space align="center">
          <SoundOutlined style={{ fontSize: 24, color: '#0066FF' }} />
          <Title level={4} style={{ margin: 0 }}>Quản lý Dictation</Title>
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="middle"
          style={{ background: 'linear-gradient(90deg, #0066FF, #6C63FF)' }}
          onClick={() => {
            form.resetFields();
            setSrtFile(null);
            setPreviewUrl('');
            setIsModalOpen(true);
          }}
        >
          Thêm bài mới
        </Button>
      </div>

      {/* ── Stats cards ── */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <Card variant="borderless" style={{ background: 'linear-gradient(135deg, #e8f4ff, #f0f5ff)', borderRadius: 12 }}>
            <Statistic
              title="Tổng số bài"
              value={dictations.length}
              prefix={<PlayCircleOutlined style={{ color: '#0066FF' }} />}
              styles={{ content: { color: '#0066FF', fontWeight: 700 } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless" style={{ background: 'linear-gradient(135deg, #f6ffed, #f0fff4)', borderRadius: 12 }}>
            <Statistic
              title="Tổng số câu"
              value={totalSegments}
              prefix={<FileTextOutlined style={{ color: '#52c41a' }} />}
              styles={{ content: { color: '#52c41a', fontWeight: 700 } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless" style={{ background: 'linear-gradient(135deg, #fff7e6, #fffbe6)', borderRadius: 12 }}>
            <Statistic
              title="Bài đã sẵn sàng"
              value={dictations.filter(d => d.totalSegments > 0).length}
              prefix={<CheckCircleOutlined style={{ color: '#fa8c16' }} />}
              styles={{ content: { color: '#fa8c16', fontWeight: 700 } }}
              suffix={`/ ${dictations.length}`}
            />
          </Card>
        </Col>
      </Row>

      {/* ── Table ── */}
      <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <Table
          columns={columns}
          dataSource={dictations}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (total) => `Tổng ${total} bài` }}
          locale={{ emptyText: 'Chưa có bài dictation nào. Nhấn "Thêm bài mới" để bắt đầu.' }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* ── Create Modal ── */}
      <Modal
        title={
          <Space>
            <PlayCircleOutlined style={{ color: '#0066FF' }} />
            <span>Tạo bài Dictation mới</span>
          </Space>
        }
        open={isModalOpen}
        onOk={handleCreate}
        onCancel={() => {
          setIsModalOpen(false);
          setPreviewUrl('');
          setSrtFile(null);
        }}
        okText="Tạo bài"
        cancelText="Huỷ"
        confirmLoading={submitting}
        width={700}
        okButtonProps={{ style: { background: 'linear-gradient(90deg, #0066FF, #6C63FF)' } }}
        destroyOnHidden
      >
        <Divider style={{ margin: '12px 0 20px' }} />
        <Form form={form} layout="vertical">
          {/* Title */}
          <Form.Item
            name="title"
            label="Tên bài dictation"
            rules={[{ required: true, message: 'Nhập tên bài' }]}
          >
            <Input placeholder="VD: Future Technologies – TED Talk" size="large" />
          </Form.Item>

          {/* YouTube URL */}
          <Form.Item
            name="youtubeUrl"
            label="Link YouTube"
            rules={[
              { required: true, message: 'Nhập link YouTube' },
              { pattern: /youtu/, message: 'Link không hợp lệ' },
            ]}
          >
            <Input
              prefix={<YoutubeOutlined style={{ color: '#FF0000' }} />}
              placeholder="https://www.youtube.com/watch?v=..."
              onChange={handleUrlChange}
              size="large"
            />
          </Form.Item>

          {/* YouTube embed preview */}
          {previewUrl && (
            <div style={{ marginBottom: 16, borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}>
              <iframe
                width="100%"
                height="250"
                src={previewUrl}
                title="YouTube preview"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {/* SRT/VTT upload */}
          <Form.Item
            label="File phụ đề (.srt hoặc .vtt)"
            required
            tooltip="Tải file .srt hoặc .vtt của video YouTube. Dùng yt-dlp hoặc downsub.com để tải."
          >
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />} size="large" style={{ width: '100%' }}>
                Chọn file SRT / VTT
              </Button>
            </Upload>
            {srtFile && (
              <div style={{ marginTop: 8, color: '#52c41a', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircleOutlined />
                <span>Đã chọn: <b>{srtFile.name}</b></span>
              </div>
            )}
            <div style={{ marginTop: 8, fontSize: 12, color: '#999', lineHeight: 1.6 }}>
              <b>Cách tải file SRT:</b>{' '}
              <code style={{ background: '#f5f5f5', padding: '1px 6px', borderRadius: 4 }}>
                yt-dlp --write-sub --sub-lang en --sub-format srt &lt;URL&gt;
              </code>
              {' '}hoặc dùng{' '}
              <a href="https://downsub.com" target="_blank" rel="noreferrer">downsub.com</a>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── YouTube Quick Preview Modal ── */}
      <Modal
        title={
          <Space>
            <YoutubeOutlined style={{ color: '#FF0000' }} />
            <span>{previewModal.title}</span>
          </Space>
        }
        open={previewModal.open}
        onCancel={() => setPreviewModal({ open: false, url: '', title: '' })}
        footer={null}
        width={760}
        destroyOnHidden
      >
        <div style={{ borderRadius: 10, overflow: 'hidden' }}>
          <iframe
            width="100%"
            height="390"
            src={previewModal.url}
            title={previewModal.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </Modal>
    </div>
  );
};

export default DictationPage;
