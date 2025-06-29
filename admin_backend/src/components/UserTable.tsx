import React, { useState, useEffect } from 'react';
import { Table, Card, Statistic, Row, Col, Input, Select, Button, Modal, message, Tag, Space, Descriptions } from 'antd';
import { EyeOutlined, StopOutlined, GiftOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Search } = Input;
const { Option } = Select;

interface User {
  _id: string;
  authProviderId: string;
  authProvider: string;
  nickname: string;
  gold: number;
  gems: number;
  createdAt: string;
  lastLoginAt: string;
  isActive: boolean;
  isBanned: boolean;
  statistics: {
    totalEarnings: number;
    animalsCollected: number;
    totalRecruitments: number;
  };
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalRevenue: number;
}

export const UserTable: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Mock API call - replace with actual API
      const response = await mockFetchUsers({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
        status: filterStatus
      });
      
      setUsers(response.users);
      setPagination(prev => ({
        ...prev,
        total: response.total
      }));
      
      // Update stats
      setStats(response.stats);
    } catch (error) {
      message.error('获取用户数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.current, pagination.pageSize, searchText, filterStatus]);

  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleStatusFilter = (value: string) => {
    setFilterStatus(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setDetailModalVisible(true);
  };

  const handleSendGift = (user: User) => {
    setSelectedUser(user);
    setGiftModalVisible(true);
  };

  const handleBanUser = async (userId: string, isBanned: boolean) => {
    try {
      await mockBanUser(userId, !isBanned);
      message.success(isBanned ? '用户已解封' : '用户已封禁');
      fetchUsers();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleTableChange = (pagination: any) => {
    setPagination(pagination);
  };

  const columns: ColumnsType<User> = [
    {
      title: 'ID',
      dataIndex: '_id',
      key: '_id',
      width: 100,
      render: (text) => text.slice(-8)
    },
    {
      title: '用户昵称',
      dataIndex: 'nickname',
      key: 'nickname',
      width: 120,
      render: (text, record) => (
        <Space>
          {text}
          {record.authProvider === 'google' && <Tag color="blue">Google</Tag>}
          {record.authProvider === 'apple' && <Tag color="gray">Apple</Tag>}
          {record.authProvider === 'wechat' && <Tag color="green">微信</Tag>}
        </Space>
      )
    },
    {
      title: '金币',
      dataIndex: 'gold',
      key: 'gold',
      width: 100,
      render: (value) => value.toLocaleString(),
      sorter: true
    },
    {
      title: '钻石',
      dataIndex: 'gems',
      key: 'gems',
      width: 100,
      render: (value) => value.toLocaleString(),
      sorter: true
    },
    {
      title: '动物收集',
      dataIndex: ['statistics', 'animalsCollected'],
      key: 'animalsCollected',
      width: 100,
      sorter: true
    },
    {
      title: '总收益',
      dataIndex: ['statistics', 'totalEarnings'],
      key: 'totalEarnings',
      width: 120,
      render: (value) => value.toLocaleString(),
      sorter: true
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record) => {
        if (record.isBanned) {
          return <Tag color="red">已封禁</Tag>;
        }
        if (!record.isActive) {
          return <Tag color="gray">已注销</Tag>;
        }
        return <Tag color="green">正常</Tag>;
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<GiftOutlined />}
            onClick={() => handleSendGift(record)}
          >
            赠送
          </Button>
          <Button
            type="link"
            size="small"
            danger={!record.isBanned}
            icon={<StopOutlined />}
            onClick={() => handleBanUser(record._id, record.isBanned)}
          >
            {record.isBanned ? '解封' : '封禁'}
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={stats.totalUsers}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={stats.activeUsers}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日新增"
              value={stats.newUsersToday}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总收益(RMB)"
              value={stats.totalRevenue}
              prefix="¥"
              precision={2}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选和搜索 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Search
              placeholder="搜索用户昵称或ID"
              allowClear
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={4}>
            <Select
              value={filterStatus}
              onChange={handleStatusFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">全部状态</Option>
              <Option value="active">正常用户</Option>
              <Option value="banned">已封禁</Option>
              <Option value="inactive">已注销</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchUsers}
              loading={loading}
            >
              刷新
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 用户表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 项，共 ${total} 项`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 用户详情弹窗 */}
      <Modal
        title="用户详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedUser && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="用户ID">{selectedUser._id}</Descriptions.Item>
            <Descriptions.Item label="昵称">{selectedUser.nickname}</Descriptions.Item>
            <Descriptions.Item label="登录方式">{selectedUser.authProvider}</Descriptions.Item>
            <Descriptions.Item label="第三方ID">{selectedUser.authProviderId}</Descriptions.Item>
            <Descriptions.Item label="金币">{selectedUser.gold.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="钻石">{selectedUser.gems.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="动物收集">{selectedUser.statistics.animalsCollected}</Descriptions.Item>
            <Descriptions.Item label="抽卡次数">{selectedUser.statistics.totalRecruitments}</Descriptions.Item>
            <Descriptions.Item label="总收益">{selectedUser.statistics.totalEarnings.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="注册时间">{new Date(selectedUser.createdAt).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="最后登录">{new Date(selectedUser.lastLoginAt).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="账户状态">
              {selectedUser.isBanned ? '已封禁' : selectedUser.isActive ? '正常' : '已注销'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* 赠送道具弹窗 */}
      <GiftModal
        visible={giftModalVisible}
        user={selectedUser}
        onCancel={() => setGiftModalVisible(false)}
        onSuccess={() => {
          setGiftModalVisible(false);
          fetchUsers();
        }}
      />
    </div>
  );
};

// 赠送道具组件
const GiftModal: React.FC<{
  visible: boolean;
  user: User | null;
  onCancel: () => void;
  onSuccess: () => void;
}> = ({ visible, user, onCancel, onSuccess }) => {
  const [giftType, setGiftType] = useState('gold');
  const [amount, setAmount] = useState(1000);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendGift = async () => {
    if (!user || !reason.trim()) {
      message.error('请填写赠送原因');
      return;
    }

    setLoading(true);
    try {
      await mockSendGift(user._id, giftType, amount, reason);
      message.success('赠送成功');
      onSuccess();
    } catch (error) {
      message.error('赠送失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`向 ${user?.nickname} 赠送道具`}
      open={visible}
      onCancel={onCancel}
      onOk={handleSendGift}
      confirmLoading={loading}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <label>赠送类型：</label>
          <Select
            value={giftType}
            onChange={setGiftType}
            style={{ width: 200, marginLeft: 8 }}
          >
            <Option value="gold">金币</Option>
            <Option value="gems">钻石</Option>
            <Option value="items">道具</Option>
          </Select>
        </div>
        <div>
          <label>数量：</label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            style={{ width: 200, marginLeft: 8 }}
            min={1}
          />
        </div>
        <div>
          <label>赠送原因：</label>
          <Input.TextArea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="请输入赠送原因..."
            rows={3}
            style={{ marginTop: 8 }}
          />
        </div>
      </Space>
    </Modal>
  );
};

// Mock API functions - replace with actual API calls
const mockFetchUsers = async (params: any) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    users: [
      {
        _id: '507f1f77bcf86cd799439011',
        authProviderId: 'google123',
        authProvider: 'google',
        nickname: '测试用户1',
        gold: 15000,
        gems: 500,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        isActive: true,
        isBanned: false,
        statistics: {
          totalEarnings: 50000,
          animalsCollected: 12,
          totalRecruitments: 25
        }
      }
    ],
    total: 1,
    stats: {
      totalUsers: 1234,
      activeUsers: 890,
      newUsersToday: 56,
      totalRevenue: 12345.67
    }
  };
};

const mockBanUser = async (userId: string, banned: boolean) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true };
};

const mockSendGift = async (userId: string, type: string, amount: number, reason: string) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true };
}; 