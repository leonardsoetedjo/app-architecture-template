import { Layout, Menu } from 'antd';
import React from 'react';
import { Outlet } from 'react-router-dom';

const { Header, Footer, Content } = Layout;

const AppLayout: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <div style={{ fontSize: '20px', fontWeight: 'bold', marginRight: 'auto', color: 'white' }}>
          Example App
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['orders']}
          style={{ borderInlineEnd: 'none', flex: 1, justifyContent: 'center' }}
        >
          <Menu.Item key="orders">
            <a href="/orders">Orders</a>
          </Menu.Item>
        </Menu>
      </Header>
      <Content style={{ padding: '24px', minHeight: 280 }}>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        Example App © {new Date().getFullYear()} - Clean Architecture
      </Footer>
    </Layout>
  );
};

export default AppLayout;
