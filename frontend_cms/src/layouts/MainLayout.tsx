import React, { useState } from "react";
import { Layout, Menu, Button, theme } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BookOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    {
      key: "/",
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    {
      key: "/vocab",
      icon: <BookOutlined />,
      label: "Vocabulary",
    },
    {
      key: "/level",
      icon: <BookOutlined />,
      label: "Levels",
    },
    {
      key: "/lesson-vocab",
      icon: <BookOutlined />,
      label: "Lesson Vocabularies",
    },
    {
      key: '/lesson-writing',
      icon: <BookOutlined />,
      label: 'Lesson Writing',
    },
    {
      key: '/podcasts',
      icon: <SoundOutlined />,
      label: 'Podcasts',
    },
    {
      key: '/dictation',
      icon: <SoundOutlined />,
      label: 'Dictation',
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: "Users",
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 20,
            fontWeight: "bold",
          }}
        >
          {collapsed ? "CMS" : "PTIT English CMS"}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[
            menuItems.find(item => location.pathname === item.key || 
              (item.key !== '/' && location.pathname.startsWith(item.key)))?.key || location.pathname
          ]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingRight: 24,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: "16px", width: 64, height: 64 }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span>
              Welcome, <b>{user?.fullName || "Admin"}</b>
            </span>
            <Button
              type="primary"
              danger
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </Header>
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: "initial",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
