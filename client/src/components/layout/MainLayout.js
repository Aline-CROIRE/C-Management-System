// client/src/components/layout/MainLayout.js
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
  width: 100%; /* Ensure it takes full width */
  position: relative; /* Needed for the overlay to position correctly relative to this */
`;

const SidebarWrapper = styled.div`
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  z-index: 1000; /* Ensure sidebar is above main content and overlay */
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.3s ease-out;

  width: ${(props) => (props.$isOpen ? "240px" : "60px")};

  @media (max-width: ${(props) => props.theme.breakpoints?.lg || "1024px"}) {
    width: 240px;
    transform: translateX(${(props) => (props.$isOpen ? "0" : "-100%")});
    transition: transform 0.3s ease-out;
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
  overflow-y: auto; /* Keep vertical scrolling for content area */
  /* REMOVED: overflow-x: hidden; to allow global horizontal scroll to work */

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
  }, [location.pathname, isLargeScreen, sidebarOpen]); 


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

      <Overlay $show={!isLargeScreen && sidebarOpen} onClick={handleSidebarToggle} />

      <MainContent $sidebarOpen={sidebarOpen} $isMobile={!isLargeScreen}>
        <HeaderWrapper>
          <DynamicHeader onSidebarToggle={handleSidebarToggle} user={user} />
        </HeaderWrapper>

        <ContentArea>
          <Outlet />
        </ContentArea>
      </MainContent>
    </LayoutContainer>
  );
};

export default MainLayout;