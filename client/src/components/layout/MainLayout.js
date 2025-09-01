// --- FIX: Add "use client" at the very top ---
// This is necessary because the component uses React hooks (useState, useEffect, etc.)
"use client";

import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../../contexts/AuthContext";
import DynamicSidebar from "./DynamicSidebar";
import DynamicHeader from "./DynamicHeader";
import LoadingSpinner from "../common/LoadingSpinner";

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
`;

const SidebarWrapper = styled.div`
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  z-index: 1000;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  @media (max-width: ${(props) => props.theme.breakpoints?.lg || "1024px"}) {
    transform: translateX(${(props) => (props.$isOpen ? "0" : "-100%")});
  }
`;

const MainContent = styled.main`
  flex: 1;
  // Adjust margin based on whether the sidebar is open AND if it's not a mobile view
  margin-left: ${(props) => (props.$sidebarOpen && !props.$isMobile ? "280px" : "0")};
  // On larger screens, have a smaller margin when sidebar is closed
  @media (min-width: ${(props) => props.theme.breakpoints?.lg || "1024px"}) {
    margin-left: ${(props) => (props.$sidebarOpen ? "280px" : "72px")};
  }
  
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const HeaderWrapper = styled.header`
  position: sticky;
  top: 0;
  z-index: 100;
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  border-bottom: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  box-shadow: ${(props) => props.theme.shadows?.sm || "0 1px 2px 0 rgba(0, 0, 0, 0.05)"};
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 2rem; // Add some padding around the content
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: none; // Hide by default

  @media (max-width: ${(props) => props.theme.breakpoints?.lg || "1024px"}) {
    display: ${(props) => (props.$show ? "block" : "none")};
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
`;

const MainLayout = () => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  
  // State for sidebar visibility
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // State to track if the view is mobile
  const [isMobile, setIsMobile] = useState(false);

  // Effect to check screen size and set mobile state
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // Automatically close sidebar on mobile, keep open on desktop
      setSidebarOpen(!mobile); 
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Effect to close the sidebar on route change when in mobile view
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const handleSidebarToggle = () => {
    setSidebarOpen(prev => !prev);
  };

  if (authLoading) {
    return (
      <LoadingContainer>
        <LoadingSpinner size="60px" />
      </LoadingContainer>
    );
  }

  return (
    <LayoutContainer>
      <SidebarWrapper $isOpen={sidebarOpen}>
        <DynamicSidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} user={user} />
      </SidebarWrapper>

      <Overlay $show={isMobile && sidebarOpen} onClick={handleSidebarToggle} />

      <MainContent $sidebarOpen={sidebarOpen} $isMobile={isMobile}>
        <HeaderWrapper>
          <DynamicHeader onSidebarToggle={handleSidebarToggle} user={user} />
        </HeaderWrapper>

        <ContentArea>
          {/* This Outlet is the placeholder where your page components will be rendered */}
          <Outlet />
        </ContentArea>
      </MainContent>
    </LayoutContainer>
  );
};

export default MainLayout;