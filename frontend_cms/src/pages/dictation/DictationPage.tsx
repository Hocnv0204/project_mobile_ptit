import React, { useEffect, useState } from 'react';
import {
  Table, Button, Space, Card, message, Modal, Form, Input,
  Upload, Tag, Tooltip, Popconfirm,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, UploadOutlined,
  YoutubeOutlined, PlayCircleOutlined,
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import api from '../../api/axios';

interface DictationItem {
  id: string;
  title: string;
  mediaUrl: string;
  totalSegments: number;
}

const DictationPage: React.FC = () => {
  const [dictations, setDictations] = useState<DictationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [srtFile, setSrtFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    fetchDictations();
  }, []);

  const fetchDictations = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/api/admin/dictations');
      setDictations(res.data || []);
    } catch {
      message.error('Không thể tải danh sách dictation');
    } finally {
      setLoading(false);
    }
  };

  // ── Upload props (no auto-upload) ──
  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      const name = file.name.toLowerCase();
      if (!name.endsWith('.srt') && !name.endsWith('.vtt')) {
        message.error('Chỉ chấp nhận file .srt hoặc .vtt');
        return Upload.LIST_IGNORE;
      }
      setSrtFile(file as unknown as File);
      return false; // prevent auto-upload
    },
    maxCount: 1,
    accept: '.srt,.vtt',
  };

  // ── Watch YouTube URL for preview ──
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    const match = url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/v\/)([A-Za-z0-9_-]{11})/);
    if (match) {
      setPreviewUrl(`https://www.youtube.com/embed/${match[1]}`);
    } else {
      setPreviewUrl('');
    }
  };

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

      await api.post('/api/admin/dictations', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      } as any);

      message.success('Tạo dictation thành công!');
      setIsModalOpen(false);
      form.resetFields();
      setSrtFile(null);
      setPreviewUrl('');
      fetchDictations();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Tạo thất bại';
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/admin/dictations/${id}`);
      message.success('Đã xoá dictation');
      fetchDictations();
    } catch {
      message.error('Xoá thất bại');
    }
  };

  const columns = [
    {
      title: 'Tên bài',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <b>{text}</b>,
    },
    {
      title: 'YouTube URL',
      dataIndex: 'mediaUrl',
      key: 'mediaUrl',
      render: (url: string) => (
        <Tooltip title={url}>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <YoutubeOutlined style={{ color: '#FF0000', marginRight: 6 }} />
            {url.length > 40 ? url.slice(0, 40) + '…' : url}
          </a>
        </Tooltip>
      ),
    },
    {
      title: 'Số câu',
      dataIndex: 'totalSegments',
      key: 'totalSegments',
      width: 100,
      render: (n: number) => <Tag color="blue">{n} câu</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      render: (_: any, record: DictationItem) => (
        <Space>
          <Popconfirm
            title="Xoá bài dictation này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xoá"
            cancelText="Huỷ"
          >
            <Button icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <PlayCircleOutlined style={{ color: '#0066FF' }} />
            <span>Quản lý Dictation</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields();
              setSrtFile(null);
              setPreviewUrl('');
              setIsModalOpen(true);
            }}
          >
            Thêm bài mới
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={dictations}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* ── Create Modal ── */}
      <Modal
        title="Tạo bài Dictation mới"
        open={isModalOpen}
        onOk={handleCreate}
        onCancel={() => {
          setIsModalOpen(false);
          setPreviewUrl('');
          setSrtFile(null);
        }}
        okText="Tạo"
        cancelText="Huỷ"
        confirmLoading={submitting}
        width={680}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {/* Title */}
          <Form.Item
            name="title"
            label="Tên bài dictation"
            rules={[{ required: true, message: 'Nhập tên bài' }]}
          >
            <Input placeholder="VD: Future Technologies – TED Talk" />
          </Form.Item>

          {/* YouTube URL */}
          <Form.Item
            name="youtubeUrl"
            label="Link YouTube"
            rules={[
              { required: true, message: 'Nhập link YouTube' },
              {
                pattern: /youtu/,
                message: 'Link không hợp lệ',
              },
            ]}
          >
            <Input
              prefix={<YoutubeOutlined style={{ color: '#FF0000' }} />}
              placeholder="https://www.youtube.com/watch?v=..."
              onChange={handleUrlChange}
            />
          </Form.Item>

          {/* YouTube preview */}
          {previewUrl && (
            <div style={{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }}>
              <iframe
                width="100%"
                height="240"
                src={previewUrl}
                title="YouTube preview"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {/* SRT/VTT file */}
          <Form.Item
            label="File phụ đề (.srt hoặc .vtt)"
            required
            tooltip="Tải file .srt hoặc .vtt của video YouTube. Có thể dùng yt-dlp hoặc downsub.com để lấy file."
          >
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Chọn file SRT / VTT</Button>
            </Upload>
            {srtFile && (
              <div style={{ marginTop: 8, color: '#52c41a' }}>
                ✅ Đã chọn: <b>{srtFile.name}</b>
              </div>
            )}
            <div style={{ marginTop: 6, fontSize: 12, color: '#999' }}>
              Cách lấy file SRT: <code>yt-dlp --write-sub --sub-lang en --sub-format srt &lt;URL&gt;</code>
              &nbsp;hoặc vào <a href="https://downsub.com" target="_blank" rel="noreferrer">downsub.com</a>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DictationPage;
