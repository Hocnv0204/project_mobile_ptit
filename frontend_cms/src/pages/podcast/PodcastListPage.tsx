import React, { useEffect, useState, useRef } from 'react';
import {
  Table, Button, Space, Card, Breadcrumb, message, Modal, Form,
  Select, Tag, Tabs, Descriptions, Input, Tooltip, Badge, Empty, Spin, Typography, Row, Col, Statistic
} from 'antd';
import {
  PlusOutlined, EyeOutlined, DeleteOutlined, SoundOutlined,
  PlayCircleOutlined, ReloadOutlined, ClockCircleOutlined,
  FilterOutlined, RobotOutlined, BookOutlined, MessageOutlined, StopOutlined
} from '@ant-design/icons';
import api from '../../api/axios';

const { Text, Title } = Typography;

// --- Types ---
interface PodcastItem {
  id: number;
  title: string;
  description: string;
  audioUrl: string;
  thumbnailUrl?: string;
  levelId: number;
  topicId: number;
  duration: number;
  orderIndex: number;
  createdAt: string;
}

interface DialogueItem {
  id: number;
  speaker: string;
  content: string;
  orderIndex: number;
  timestampStart: number;
}

interface VocabItem {
  id: number;
  term: string;
  definition: string;
  pronunciation: string;
  example: string;
  wordType: string;
  vocabType: string;
  orderIndex: number;
}

interface PodcastDetail extends PodcastItem {
  dialogues: DialogueItem[];
  vocab: VocabItem[];
}

interface TopicItem {
  id: number;
  name: string;
}

// --- Helpers ---
const formatDuration = (seconds: number | null | undefined): string => {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatTimestamp = (seconds: number | null | undefined): string => {
  if (seconds === null || seconds === undefined) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const levelMap: Record<number, { label: string; color: string }> = {
  1: { label: 'Beginner', color: 'green' },
  2: { label: 'Elementary', color: 'cyan' },
  3: { label: 'Intermediate', color: 'blue' },
  4: { label: 'Upper-Int.', color: 'orange' },
  5: { label: 'Advanced', color: 'red' },
};

const PodcastListPage: React.FC = () => {
  const [podcasts, setPodcasts] = useState<PodcastItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const fullUrl = url.startsWith('http') ? url : `${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}${url.startsWith('/') ? '' : '/'}${url}`;
    const audio = new Audio(fullUrl);
    audio.play().catch(() => message.warning('Cannot play audio'));
    audioRef.current = audio;
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

  // Detail modal
  const [selectedPodcast, setSelectedPodcast] = useState<PodcastDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Generate modal
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [generateForm] = Form.useForm();

  // Filters
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [filterTopic, setFilterTopic] = useState<number | null>(null);

  // Topics from DB
  const [topics, setTopics] = useState<TopicItem[]>([]);

  useEffect(() => {
    fetchPodcasts();
    fetchTopics();
  }, []);

  // --- API Calls ---
  const fetchTopics = async () => {
    try {
      const response: any = await api.get('/admin/topics?size=100');
      setTopics(response.data?.content || []);
    } catch (error) {
      console.error('Failed to fetch topics', error);
    }
  };

  const fetchPodcasts = async () => {
    setLoading(true);
    try {
      const response: any = await api.get('/podcasts');
      setPodcasts(response.data || []);
    } catch (error) {
      message.error('Failed to fetch podcasts');
    } finally {
      setLoading(false);
    }
  };

  const fetchByLevel = async (levelId: number) => {
    setLoading(true);
    try {
      const response: any = await api.get(`/podcasts/level/${levelId}`);
      setPodcasts(response.data || []);
    } catch (error) {
      message.error('Failed to filter by level');
    } finally {
      setLoading(false);
    }
  };

  const fetchByTopic = async (topicId: number) => {
    setLoading(true);
    try {
      const response: any = await api.get(`/podcasts/topic/${topicId}`);
      setPodcasts(response.data || []);
    } catch (error) {
      message.error('Failed to filter by topic');
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const response: any = await api.get(`/podcasts/${id}`);
      setSelectedPodcast(response.data);
      setIsDetailOpen(true);
    } catch (error) {
      message.error('Failed to fetch podcast detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      const values = await generateForm.validateFields();
      setGenerating(true);
      await api.post('/podcasts/generate', values);
      message.success('Podcast generated successfully!');
      setIsGenerateOpen(false);
      generateForm.resetFields();
      fetchPodcasts();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Generation failed';
      message.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  // --- Filter handlers ---
  const handleFilterLevel = (value: number | null) => {
    setFilterLevel(value);
    setFilterTopic(null);
    if (value) {
      fetchByLevel(value);
    } else {
      fetchPodcasts();
    }
  };

  const handleFilterTopic = (value: number | null) => {
    setFilterTopic(value);
    setFilterLevel(null);
    if (value) {
      fetchByTopic(value);
    } else {
      fetchPodcasts();
    }
  };

  const handleClearFilters = () => {
    setFilterLevel(null);
    setFilterTopic(null);
    fetchPodcasts();
  };

  // --- Table columns ---
  const columns = [
    {
      title: '#',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      sorter: (a: PodcastItem, b: PodcastItem) => a.id - b.id,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string) => (
        <Text strong style={{ fontSize: 14 }}>
          <SoundOutlined style={{ marginRight: 6, color: '#722ed1' }} />
          {text}
        </Text>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 280,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text type="secondary">{text || '—'}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Level',
      dataIndex: 'levelId',
      key: 'levelId',
      width: 120,
      render: (levelId: number) => {
        const level = levelMap[levelId];
        return level ? <Tag color={level.color}>{level.label}</Tag> : <Tag>{levelId}</Tag>;
      },
      filters: Object.entries(levelMap).map(([key, val]) => ({ text: val.label, value: Number(key) })),
      onFilter: (value: any, record: PodcastItem) => record.levelId === value,
    },
    {
      title: 'Topic',
      dataIndex: 'topicId',
      key: 'topicId',
      width: 120,
      render: (topicId: number) => {
        const topic = topics.find(t => t.id === topicId);
        return <Tag color="purple">{topic ? topic.name : `Topic ${topicId}`}</Tag>;
      },
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (val: number) => (
        <span>
          <ClockCircleOutlined style={{ marginRight: 4, color: '#1890ff' }} />
          {formatDuration(val)}
        </span>
      ),
      sorter: (a: PodcastItem, b: PodcastItem) => (a.duration || 0) - (b.duration || 0),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => date ? new Date(date).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }) : '—',
      sorter: (a: PodcastItem, b: PodcastItem) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Actions',
      key: 'action',
      width: 120,
      render: (_: any, record: PodcastItem) => (
        <Space size="small">
          <Tooltip title="View Detail">
            <Button
              type="primary"
              ghost
              icon={<EyeOutlined />}
              onClick={() => fetchDetail(record.id)}
              loading={detailLoading}
            />
          </Tooltip>
          {record.audioUrl && (
            <>
              <Tooltip title="Play Audio">
                <Button
                  icon={<PlayCircleOutlined />}
                  style={{ color: '#722ed1', borderColor: '#722ed1' }}
                  onClick={() => playAudio(record.audioUrl)}
                />
              </Tooltip>
              <Tooltip title="Stop Audio">
                <Button
                  icon={<StopOutlined />}
                  danger
                  onClick={stopAudio}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  // --- Dialogue columns ---
  const dialogueColumns = [
    {
      title: 'Time',
      dataIndex: 'timestampStart',
      key: 'timestampStart',
      width: 80,
      render: (val: number) => (
        <Tag color="blue" style={{ fontFamily: 'monospace' }}>{formatTimestamp(val)}</Tag>
      ),
    },
    {
      title: 'Speaker',
      dataIndex: 'speaker',
      key: 'speaker',
      width: 100,
      render: (speaker: string) => (
        <Tag color={speaker === 'A' ? 'geekblue' : 'volcano'} style={{ fontWeight: 600 }}>
          {speaker === 'A' ? '🎙️ Speaker A' : '🎤 Speaker B'}
        </Tag>
      ),
    },
    {
      title: 'Content',
      dataIndex: 'content',
      key: 'content',
      render: (text: string) => <Text>{text}</Text>,
    },
  ];

  // --- Vocab columns ---
  const vocabColumns = [
    {
      title: 'Term',
      dataIndex: 'term',
      key: 'term',
      width: 140,
      render: (text: string) => <Text strong style={{ color: '#722ed1' }}>{text}</Text>,
    },
    {
      title: 'Definition',
      dataIndex: 'definition',
      key: 'definition',
      ellipsis: true,
    },
    {
      title: 'Type',
      dataIndex: 'wordType',
      key: 'wordType',
      width: 100,
      render: (type: string) => type ? <Tag color="cyan">{type}</Tag> : '—',
    },
    {
      title: 'Pronunciation',
      dataIndex: 'pronunciation',
      key: 'pronunciation',
      width: 150,
      render: (text: string) => text ? <Text type="secondary" italic>/{text}/</Text> : '—',
    },
    {
      title: 'Example',
      dataIndex: 'example',
      key: 'example',
      ellipsis: true,
      render: (text: string) => text ? <Text type="secondary" italic>"{text}"</Text> : '—',
    },
  ];

  return (
    <div>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>
          <SoundOutlined /> Podcast Management
        </Breadcrumb.Item>
      </Breadcrumb>

      {/* Stats Row */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card bordered={false} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Total Podcasts</span>}
              value={podcasts.length}
              prefix={<SoundOutlined />}
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Total Duration</span>}
              value={formatDuration(podcasts.reduce((sum, p) => sum + (p.duration || 0), 0))}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Levels Covered</span>}
              value={new Set(podcasts.map(p => p.levelId)).size}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Topics Covered</span>}
              value={new Set(podcasts.map(p => p.topicId)).size}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Table Card */}
      <Card
        title={
          <Space>
            <SoundOutlined style={{ color: '#722ed1', fontSize: 18 }} />
            <span style={{ fontSize: 16, fontWeight: 600 }}>Podcasts</span>
          </Space>
        }
        extra={
          <Space>
            <Select
              allowClear
              placeholder="Filter by Level"
              style={{ width: 160 }}
              value={filterLevel}
              onChange={handleFilterLevel}
            >
              {Object.entries(levelMap).map(([key, val]) => (
                <Select.Option key={key} value={Number(key)}>{val.label}</Select.Option>
              ))}
            </Select>
            <Button icon={<ReloadOutlined />} onClick={handleClearFilters}>
              Reset
            </Button>
            <Button
              type="primary"
              icon={<RobotOutlined />}
              onClick={() => {
                generateForm.resetFields();
                setIsGenerateOpen(true);
              }}
              style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none' }}
            >
              Generate from AI
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={podcasts}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Total ${total} podcasts` }}
          locale={{ emptyText: <Empty description="No podcasts found" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={
          <Space>
            <SoundOutlined style={{ color: '#722ed1' }} />
            <span>{selectedPodcast?.title || 'Podcast Detail'}</span>
          </Space>
        }
        open={isDetailOpen}
        onCancel={() => { setIsDetailOpen(false); setSelectedPodcast(null); stopAudio(); }}
        footer={[
          <Button key="close" onClick={() => { setIsDetailOpen(false); setSelectedPodcast(null); stopAudio(); }}>
            Close
          </Button>,
          selectedPodcast?.audioUrl && (
            <Button
              key="stop"
              danger
              icon={<StopOutlined />}
              onClick={stopAudio}
            >
              Stop
            </Button>
          ),
          selectedPodcast?.audioUrl && (
            <Button
              key="play"
              type="primary"
              icon={<PlayCircleOutlined />}
              style={{ background: '#722ed1', border: 'none' }}
              onClick={() => playAudio(selectedPodcast!.audioUrl)}
            >
              Play Audio
            </Button>
          ),
        ]}
        width={900}
        styles={{ body: { maxHeight: '65vh', overflowY: 'auto' } }}
      >
        {selectedPodcast && (
          <>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="ID">{selectedPodcast.id}</Descriptions.Item>
              <Descriptions.Item label="Level">
                {levelMap[selectedPodcast.levelId]
                  ? <Tag color={levelMap[selectedPodcast.levelId].color}>{levelMap[selectedPodcast.levelId].label}</Tag>
                  : selectedPodcast.levelId
                }
              </Descriptions.Item>
              <Descriptions.Item label="Topic">
                <Tag color="purple">
                  {topics.find(t => t.id === selectedPodcast.topicId)?.name || `Topic ${selectedPodcast.topicId}`}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Duration">
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                {formatDuration(selectedPodcast.duration)}
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {selectedPodcast.description || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Audio URL" span={2}>
                <Text copyable ellipsis style={{ maxWidth: 500 }}>
                  {selectedPodcast.audioUrl}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {selectedPodcast.createdAt
                  ? new Date(selectedPodcast.createdAt).toLocaleString('vi-VN')
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Order Index">
                {selectedPodcast.orderIndex ?? '—'}
              </Descriptions.Item>
            </Descriptions>

            <Tabs
              defaultActiveKey="dialogues"
              items={[
                {
                  key: 'dialogues',
                  label: (
                    <span>
                      <MessageOutlined /> Dialogues
                      <Badge
                        count={selectedPodcast.dialogues?.length || 0}
                        style={{ marginLeft: 6, backgroundColor: '#722ed1' }}
                        size="small"
                      />
                    </span>
                  ),
                  children: selectedPodcast.dialogues?.length ? (
                    <Table
                      columns={dialogueColumns}
                      dataSource={[...selectedPodcast.dialogues].sort((a, b) => a.orderIndex - b.orderIndex)}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    />
                  ) : (
                    <Empty description="No dialogues" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ),
                },
                {
                  key: 'vocab',
                  label: (
                    <span>
                      <BookOutlined /> Vocabulary
                      <Badge
                        count={selectedPodcast.vocab?.length || 0}
                        style={{ marginLeft: 6, backgroundColor: '#52c41a' }}
                        size="small"
                      />
                    </span>
                  ),
                  children: selectedPodcast.vocab?.length ? (
                    <Table
                      columns={vocabColumns}
                      dataSource={[...selectedPodcast.vocab].sort((a, b) => a.orderIndex - b.orderIndex)}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    />
                  ) : (
                    <Empty description="No vocabulary" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ),
                },
              ]}
            />
          </>
        )}
      </Modal>

      {/* Generate Modal */}
      <Modal
        title={
          <Space>
            <RobotOutlined style={{ color: '#722ed1' }} />
            <span>Generate Podcast from AI</span>
          </Space>
        }
        open={isGenerateOpen}
        onOk={handleGenerate}
        onCancel={() => setIsGenerateOpen(false)}
        confirmLoading={generating}
        okText={generating ? 'Generating...' : 'Generate'}
        okButtonProps={{
          style: { background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none' },
          icon: <RobotOutlined />,
        }}
      >
        <div style={{
          background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
        }}>
          <Text type="secondary">
            🤖 AI will automatically generate a full podcast episode including title, description,
            audio, dialogues and vocabulary based on the selected level and topic.
          </Text>
        </div>
        <Form form={generateForm} layout="vertical">
          <Form.Item
            name="levelId"
            label="Level"
            rules={[{ required: true, message: 'Please select a level' }]}
          >
            <Select placeholder="Select level">
              {Object.entries(levelMap).map(([key, val]) => (
                <Select.Option key={key} value={Number(key)}>
                  <Tag color={val.color} style={{ marginRight: 4 }}>{val.label}</Tag>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="topicId"
            label="Topic"
            rules={[{ required: true, message: 'Please select a topic' }]}
          >
            <Select placeholder="Select topic">
              {topics.map(topic => (
                <Select.Option key={topic.id} value={topic.id}>
                  {topic.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
        {generating && (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <Spin size="large" />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">AI is generating your podcast... This may take a minute.</Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PodcastListPage;
