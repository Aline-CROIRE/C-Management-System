"use client"

import { useState, useEffect } from "react"
import { Outlet, useLocation } from "react-router-dom"
import styled from "styled-components"
import { useAuth } from "../../contexts/AuthContext"
import DynamicSidebar from "./DynamicSidebar"
import DynamicHeader from "./DynamicHeader"
import LoadingSpinner from "../common/LoadingSpinner"

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
`

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
`

const MainContent = styled.main`
  flex: 1;
  margin-left: ${(props) => (props.$sidebarOpen ? "280px" : "72px")};
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  min-height: 100vh;

  @media (max-width: ${(props) => props.theme.breakpoints?.lg || "1024px"}) {
    margin-left: 0;
  }
`

const HeaderWrapper = styled.div`
  position: sticky;
  top: 0;
  z-index: 100;
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  border-bottom: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  box-shadow: ${(props) => props.theme.shadows?.sm || "0 1px 2px 0 rgba(0, 0, 0, 0.05)"};
`

const ContentArea = styled.div`
  flex: 1;
  overflow-y: auto;
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
`

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: ${(props) => (props.$show ? "block" : "none")};

  @media (min-width: ${(props) => props.theme.breakpoints?.lg || "1024px"}) {
    display: none;
  }
`

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
`

const MainLayout = () => {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [location.pathname, isMobile])

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleOverlayClick = () => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingSpinner size="60px" />
      </LoadingContainer>
    )
  }

  return (
    <LayoutContainer>
      <SidebarWrapper $isOpen={sidebarOpen}>
        <DynamicSidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} user={user} />
      </SidebarWrapper>

      <Overlay $show={isMobile && sidebarOpen} onClick={handleOverlayClick} />

      <MainContent $sidebarOpen={sidebarOpen && !isMobile}>
        <HeaderWrapper>
          <DynamicHeader onSidebarToggle={handleSidebarToggle} user={user} />
        </HeaderWrapper>

        <ContentArea>
          <Outlet />
        </ContentArea>
      </MainContent>
    </LayoutContainer>
  )
}

export default MainLayout
