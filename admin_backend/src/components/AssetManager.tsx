import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Upload,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Space,
  Image,
  Card,
  Statistic,
  Row,
  Col,
  message,
  Popconfirm,
  Tooltip,
  Progress
} from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileImageOutlined,
  SoundOutlined,
  VideoCameraOutlined,
  FileOutlined
} from '@ant-design/icons';
import { useCloud } from '../services/CloudProvider';

const { Option } = Select;
const { TextArea } = Input;

interface Asset {
  _id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  fileName: string;
  fileSize: number;
  mimeType: string;
  originalUrl: string;
  thumbnailUrl?: string;
  status: string;
  visibility: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
  };
}

interface AssetStats {
  byCategory: Array<{
    _id: string;
    count: number;
    totalSize: number;
    avgSize: number;
  }>;
  total: {
    totalAssets: number;
    totalSize: number;
    totalUsage: number;
  };
}

export const AssetManager: React.FC = () => {
  const { db } = useCloud();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState<AssetStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  const [uploadForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });

  // 素材分类选项
  const categoryOptions = [
    { value: 'image', label: '图片', icon: <FileImageOutlined /> },
    { value: 'audio', label: '音频', icon: <SoundOutlined /> },
    { value: 'video', label: '视频', icon: <VideoCameraOutlined /> },
    { value: 'animation', label: '动画', icon: <FileOutlined /> },
    { value: 'ui', label: 'UI', icon: <FileImageOutlined /> },
    { value: 'icon', label: '图标', icon: <FileImageOutlined /> },
    { value: 'background', label: '背景', icon: <FileImageOutlined /> },
    { value: 'character', label: '角色', icon: <FileImageOutlined /> },
    { value: 'effect', label: '特效', icon: <FileOutlined /> }
  ];

  // 状态选项
  const statusOptions = [
    { value: 'active', label: '激活', color: 'green' },
    { value: 'pending', label: '待审核', color: 'orange' },
    { value: 'deprecated', label: '已废弃', color: 'red' },
    { value: 'deleted', label: '已删除', color: 'gray' }
  ];

  // 加载素材列表
  const loadAssets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.current.toString(),
        limit: pagination.pageSize.toString(),
        status: statusFilter,
        ...(searchText && { search: searchText }),
        ...(categoryFilter && { category: categoryFilter })
      });

      const response = await fetch(`/api/assets?${params}`);
      const data = await response.json();

      if (response.ok) {
        setAssets(data.data);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.totalItems
        }));
      } else {
        message.error(data.message || '加载素材失败');
      }
    } catch (error) {
      console.error('加载素材失败:', error);
      message.error('加载素材失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载统计信息
  const loadStats = async () => {
    try {
      const response = await fetch('/api/assets/stats');
      const data = await response.json();

      if (response.ok) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('加载统计信息失败:', error);
    }
  };

  useEffect(() => {
    loadAssets();
    loadStats();
  }, [pagination.current, pagination.pageSize, searchText, categoryFilter, statusFilter]);

  // 文件上传配置
  const uploadProps = {
    name: 'file',
    action: '/api/assets/upload',
    accept: 'image/*,audio/*,video/*,.json',
    showUploadList: false,
    onChange: (info: any) => {
      if (info.file.status === 'uploading') {
        setUploadProgress(info.file.percent || 0);
      } else if (info.file.status === 'done') {
        message.success('文件上传成功');
        setUploadProgress(0);
        loadAssets();
        loadStats();
      } else if (info.file.status === 'error') {
        message.error('文件上传失败');
        setUploadProgress(0);
      }
    },
    onProgress: (progressEvent: any) => {
      const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
      setUploadProgress(percent);
    }
  };

  // 处理素材上传
  const handleUpload = async (values: any) => {
    try {
      const formData = new FormData();
      formData.append('file', values.file.file);
      formData.append('name', values.name);
      formData.append('description', values.description || '');
      formData.append('category', values.category);
      formData.append('tags', (values.tags || []).join(','));

      const response = await fetch('/api/assets/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        message.success('素材上传成功');
        setUploadModalVisible(false);
        uploadForm.resetFields();
        loadAssets();
        loadStats();
      } else {
        message.error(data.message || '上传失败');
      }
    } catch (error) {
      console.error('上传失败:', error);
      message.error('上传失败');
    }
  };

  // 处理素材编辑
  const handleEdit = async (values: any) => {
    if (!selectedAsset) return;

    try {
      const response = await fetch(`/api/assets/${selectedAsset._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...values,
          tags: (values.tags || []).join(',')
        })
      });

      const data = await response.json();

      if (response.ok) {
        message.success('素材信息更新成功');
        setEditModalVisible(false);
        editForm.resetFields();
        loadAssets();
      } else {
        message.error(data.message || '更新失败');
      }
    } catch (error) {
      console.error('更新失败:', error);
      message.error('更新失败');
    }
  };

  // 删除素材
  const handleDelete = async (assetId: string) => {
    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        message.success('素材删除成功');
        loadAssets();
        loadStats();
      } else {
        message.error(data.message || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // 获取分类图标
  const getCategoryIcon = (category: string) => {
    const option = categoryOptions.find(opt => opt.value === category);
    return option?.icon || <FileOutlined />;
  };

  // 表格列配置
  const columns = [
    {
      title: '预览',
      dataIndex: 'thumbnailUrl',
      key: 'preview',
      width: 80,
      render: (thumbnailUrl: string, record: Asset) => {
        if (record.mimeType.startsWith('image/')) {
          return (
            <Image
              width={50}
              height={50}
              src={thumbnailUrl || record.originalUrl}
              style={{ objectFit: 'cover' }}
              placeholder={<div style={{ width: 50, height: 50, background: '#f0f0f0' }} />}
            />
          );
        }
        return (
          <div style={{ 
            width: 50, 
            height: 50, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: '#f0f0f0',
            borderRadius: 4
          }}>
            {getCategoryIcon(record.category)}
          </div>
        );
      }
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Asset) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.fileName}</div>
        </div>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => {
        const option = categoryOptions.find(opt => opt.value === category);
        return (
          <Tag icon={option?.icon}>
            {option?.label || category}
          </Tag>
        );
      }
    },
    {
      title: '大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      render: (size: number) => formatFileSize(size)
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const option = statusOptions.find(opt => opt.value === status);
        return <Tag color={option?.color}>{option?.label || status}</Tag>;
      }
    },
    {
      title: '使用次数',
      dataIndex: 'usageCount',
      key: 'usageCount'
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <div>
          {tags.slice(0, 2).map(tag => (
            <Tag key={tag} size="small">{tag}</Tag>
          ))}
          {tags.length > 2 && <Tag size="small">+{tags.length - 2}</Tag>}
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: any, record: Asset) => (
        <Space>
          <Tooltip title="预览">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedAsset(record);
                setPreviewModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedAsset(record);
                editForm.setFieldsValue({
                  ...record,
                  tags: record.tags
                });
                setEditModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这个素材吗？"
              onConfirm={() => handleDelete(record._id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div>
      {/* 统计信息 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总素材数"
                value={stats.total.totalAssets}
                prefix={<FileOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总大小"
                value={formatFileSize(stats.total.totalSize)}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总使用次数"
                value={stats.total.totalUsage}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="分类数量"
                value={stats.byCategory.length}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => setUploadModalVisible(true)}
            >
              上传素材
            </Button>
          </Col>
          <Col>
            <Input.Search
              placeholder="搜索素材名称或描述"
              style={{ width: 300 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={loadAssets}
            />
          </Col>
          <Col>
            <Select
              placeholder="选择分类"
              style={{ width: 150 }}
              value={categoryFilter}
              onChange={setCategoryFilter}
              allowClear
            >
              {categoryOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Select
              placeholder="选择状态"
              style={{ width: 120 }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              {statusOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  <Tag color={option.color}>{option.label}</Tag>
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* 素材列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={assets}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({
                ...prev,
                current: page,
                pageSize: pageSize || 20
              }));
            }
          }}
        />
      </Card>

      {/* 上传弹窗 */}
      <Modal
        title="上传素材"
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          uploadForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={uploadForm}
          layout="vertical"
          onFinish={handleUpload}
        >
          <Form.Item
            name="file"
            label="选择文件"
            rules={[{ required: true, message: '请选择要上传的文件' }]}
          >
            <Upload.Dragger
              {...uploadProps}
              style={{ marginBottom: 16 }}
            >
              <p style={{ fontSize: 16, margin: '16px 0' }}>
                <UploadOutlined /> 点击或拖拽文件到此区域上传
              </p>
              <p style={{ color: '#666' }}>
                支持图片、音频、视频、动画配置文件，单个文件最大50MB
              </p>
              {uploadProgress > 0 && (
                <Progress percent={uploadProgress} />
              )}
            </Upload.Dragger>
          </Form.Item>

          <Form.Item
            name="name"
            label="素材名称"
            rules={[{ required: true, message: '请输入素材名称' }]}
          >
            <Input placeholder="请输入素材名称" />
          </Form.Item>

          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="请选择分类">
              {categoryOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea
              placeholder="请输入素材描述"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="tags"
            label="标签"
          >
            <Select
              mode="tags"
              placeholder="请输入标签，按回车添加"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                上传
              </Button>
              <Button onClick={() => {
                setUploadModalVisible(false);
                uploadForm.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑弹窗 */}
      <Modal
        title="编辑素材"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          editForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEdit}
        >
          <Form.Item
            name="name"
            label="素材名称"
            rules={[{ required: true, message: '请输入素材名称' }]}
          >
            <Input placeholder="请输入素材名称" />
          </Form.Item>

          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="请选择分类">
              {categoryOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea
              placeholder="请输入素材描述"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
          >
            <Select>
              {statusOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  <Tag color={option.color}>{option.label}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="visibility"
            label="可见性"
          >
            <Select>
              <Option value="public">公开</Option>
              <Option value="internal">内部</Option>
              <Option value="private">私有</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="tags"
            label="标签"
          >
            <Select
              mode="tags"
              placeholder="请输入标签，按回车添加"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button onClick={() => {
                setEditModalVisible(false);
                editForm.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 预览弹窗 */}
      <Modal
        title="素材预览"
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {selectedAsset && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                {selectedAsset.mimeType.startsWith('image/') ? (
                  <Image
                    src={selectedAsset.originalUrl}
                    style={{ width: '100%', maxHeight: 400, objectFit: 'contain' }}
                  />
                ) : (
                  <div style={{ 
                    width: '100%', 
                    height: 300, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: '#f0f0f0',
                    borderRadius: 8
                  }}>
                    {getCategoryIcon(selectedAsset.category)}
                    <div style={{ marginLeft: 8 }}>{selectedAsset.fileName}</div>
                  </div>
                )}
              </Col>
              <Col span={12}>
                <div style={{ padding: 16 }}>
                  <h3>{selectedAsset.name}</h3>
                  <p><strong>文件名：</strong>{selectedAsset.fileName}</p>
                  <p><strong>大小：</strong>{formatFileSize(selectedAsset.fileSize)}</p>
                  <p><strong>类型：</strong>{selectedAsset.mimeType}</p>
                  {selectedAsset.metadata?.width && (
                    <p><strong>尺寸：</strong>{selectedAsset.metadata.width} × {selectedAsset.metadata.height}</p>
                  )}
                  {selectedAsset.metadata?.duration && (
                    <p><strong>时长：</strong>{selectedAsset.metadata.duration}秒</p>
                  )}
                  <p><strong>状态：</strong>
                    <Tag color={statusOptions.find(s => s.value === selectedAsset.status)?.color}>
                      {statusOptions.find(s => s.value === selectedAsset.status)?.label}
                    </Tag>
                  </p>
                  <p><strong>使用次数：</strong>{selectedAsset.usageCount}</p>
                  {selectedAsset.description && (
                    <div>
                      <strong>描述：</strong>
                      <p>{selectedAsset.description}</p>
                    </div>
                  )}
                  {selectedAsset.tags.length > 0 && (
                    <div>
                      <strong>标签：</strong>
                      <div style={{ marginTop: 8 }}>
                        {selectedAsset.tags.map(tag => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};