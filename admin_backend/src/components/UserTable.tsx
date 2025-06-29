import React, { useEffect, useState } from 'react';
import { Table } from 'antd';
import { useCloud } from '../services/CloudProvider';

// Define the structure of user data for the table
interface User {
  key: string; // Required by Antd Table
  _id: string;
  nickname: string;
  gold: number;
  gems: number;
  lastLoginAt: string;
}

const columns = [
  {
    title: 'Nickname',
    dataIndex: 'nickname',
    key: 'nickname',
  },
  {
    title: 'Gold',
    dataIndex: 'gold',
    key: 'gold',
    sorter: (a: User, b: User) => a.gold - b.gold,
  },
  {
    title: 'Gems',
    dataIndex: 'gems',
    key: 'gems',
    sorter: (a: User, b: User) => a.gems - b.gems,
  },
  {
    title: 'Last Login',
    dataIndex: 'lastLoginAt',
    key: 'lastLoginAt',
    sorter: (a: User, b: User) => new Date(a.lastLoginAt).getTime() - new Date(b.lastLoginAt).getTime(),
  },
  {
    title: 'OpenID',
    dataIndex: '_id',
    key: '_id',
  },
];

export const UserTable: React.FC = () => {
  const { db } = useCloud();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!db) {
        return;
      }
      setLoading(true);
      try {
        const result = await db.collection('users').get();
        const formattedUsers: User[] = result.data.map((user: any) => ({
          key: user._id,
          _id: user._id,
          nickname: user.nickname,
          gold: user.gold,
          gems: user.gems,
          lastLoginAt: new Date(user.lastLoginAt).toLocaleString(),
        }));
        setUsers(formattedUsers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };

    if (db) {
      fetchUsers();
    }
  }, [db]);

  return <Table columns={columns} dataSource={users} loading={loading} />;
}; 