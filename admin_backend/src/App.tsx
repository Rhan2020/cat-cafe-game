import React from 'react';
import { CloudProvider } from './services/CloudProvider';
import { UserTable } from './components/UserTable';
import { ConfigEditor } from './components/ConfigEditor';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Tabs, Layout } from 'antd';
import 'antd/dist/reset.css'; // Import Antd styles

const { Header, Content } = Layout;

const items = [
  {
    key: '1',
    label: `用户数据监控`,
    children: <UserTable />,
  },
  {
    key: '2',
    label: `游戏配置编辑`,
    children: <ConfigEditor />,
  },
];

function App() {
  return (
    <ErrorBoundary>
      <CloudProvider>
        <Layout style={{ minHeight: '100vh' }}>
          <Header style={{ color: 'white', fontSize: '20px' }}>
            猫咪咖啡馆 - 管理后台
          </Header>
          <Content style={{ padding: '20px' }}>
            <Tabs defaultActiveKey="1" items={items} />
          </Content>
        </Layout>
      </CloudProvider>
    </ErrorBoundary>
  );
}

export default App;
