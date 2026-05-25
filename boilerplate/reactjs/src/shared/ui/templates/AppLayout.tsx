/**
 * Application Layout Template
 * 
 * Provides the main application shell with:
 * - Header with navigation
 * - Main content area
 * - Footer (optional)
 * - Responsive design
 * 
 * This is a Shared UI component used across all pages.
 */

import React, { ReactNode } from 'react';
import { Layout, Menu } from 'antd';
import { 
  HomeOutlined, 
  ShoppingOutlined, 
  SettingOutlined 
} from '@ant-design/icons';

const { Header, Content, Footer } = Layout;

/**
 * App Layout Props
 */
interface AppLayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * Application Layout Component
 * 
 * Wraps all pages with consistent navigation and layout.
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ children, className }) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        background: '#001529',
        padding: '0 24px'
      }}>
        <div style={{ 
          color: 'white', 
          fontSize: '20px', 
          fontWeight: 600,
          marginRight: '40px'
        }}>
          <ShoppingOutlined style={{ marginRight: '8px' }} />
          Order Management
        </div>
        
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['orders']}
          style={{ flex: 1, minWidth: 0 }}
          items={[
            {
              key: 'orders',
              icon: <ShoppingOutlined />,
              label: 'Orders',
            },
            {
              key: 'home',
              icon: <HomeOutlined />,
              label: 'Dashboard',
            },
            {
              key: 'settings',
              icon: <SettingOutlined />,
              label: 'Settings',
            },
          ]}
        />
      </Header>
      
      <Content style={{ background: '#f0f2f5' }}>
        {children}
      </Content>
      
      <Footer style={{ textAlign: 'center' }}>
        Order Management System ©{new Date().getFullYear()} Created with FSD + MVVM Architecture
      </Footer>
    </Layout>
  );
};
