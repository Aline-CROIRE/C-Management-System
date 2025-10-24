// client/src/components/layout/MainLayout.js
"use client";

import { useState, useEffect, useRef } from "react";
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
  width: 100%;
  position: relative;
`;

const SidebarWrapper = styled.div`
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  z-index: 1000;
  transition: transform 0.3s ease-out, width 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  @media (min-width: ${(props) => props.theme.breakpoints?.lg || "1024px"}) {
    width: ${(props) => (props.$isOpen ? "240px" : "60px")};
  }

  @media (max-width: ${(props) => props.theme.breakpoints?.lg || "1024px"}) {
    width: 240px;
    transform: translateX(${(props) => (props.$isOpen ? "0" : "-100%")});
  }
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;

  @media (min-width: ${(props) => props.theme.breakpoints?.lg || "1024px"}) {
    margin-left: ${(props) => (props.$sidebarOpen ? "240px" : "60px")};
    transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @media (max-width: ${(props) => props.theme.breakpoints?.lg || "1024px"}) {
    margin-left: 0;
    transition: none;
  }
`;

const HeaderWrapper = styled.div`
  position: sticky;
  top: 0;
  z-index: 99;
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  border-bottom: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  box-shadow: ${(props) => props.theme.shadows?.sm || "0 1px 2px 0 rgba(0, 0, 0, 0.05)"};
`;

const ContentArea = styled.div`
  flex: 1;
  padding: ${(props) => props.theme.spacing?.xl || "2rem"};
  overflow-y: auto;
  overflow-x: auto;

  @media (max-width: ${(props) => props.theme.breakpoints?.md || "768px"}) {
    padding: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  }
  @media (max-width: ${(props) => props.theme.breakpoints?.sm || "640px"}) {
    padding: ${(props) => props.theme.spacing?.md || "1rem"};
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
  
  @media (min-width: ${(props) => props.theme.breakpoints?.lg || "1024px"}) {
    display: none;
  }
  display: ${(props) => (props.$show ? "block" : "none")};
  transition: opacity 0.3s ease;
  opacity: ${(props) => (props.$show ? 1 : 0)};
  pointer-events: ${(props) => (props.$show ? "auto" : "none")};
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
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(true);

  const sidebarRef = useRef(null);
  const menuButtonRef = useRef(null);

  const LG_BREAKPOINT_VALUE = 1024;

  useEffect(() => {
    const checkScreenSize = () => {
      const isCurrentLargeScreen = window.innerWidth >= LG_BREAKPOINT_VALUE;
      setIsLargeScreen(isCurrentLargeScreen);
      setSidebarOpen(isCurrentLargeScreen);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    if (!isLargeScreen && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isLargeScreen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!sidebarOpen || isLargeScreen) {
        return;
      }

      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setSidebarOpen(false);
      }
    };

    let timeoutId;
    if (sidebarOpen && !isLargeScreen) {
      timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside, true);
      }, 50);
    }

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [sidebarOpen, isLargeScreen]);

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
        <DynamicSidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} user={user} sidebarRef={sidebarRef} />
      </SidebarWrapper>

      <Overlay $show={!isLargeScreen && sidebarOpen} onClick={() => setSidebarOpen(false)} />

      <MainContent $sidebarOpen={sidebarOpen}>
        <HeaderWrapper>
          <DynamicHeader onSidebarToggle={handleSidebarToggle} user={user} menuButtonRef={menuButtonRef} />
        </HeaderWrapper>

        <ContentArea>
          <Outlet />
        </ContentArea>
      </MainContent>
    </LayoutContainer>
  );
};

export default MainLayout;