"use client"

import { useState, useRef, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import styled from "styled-components"
import { FaBars, FaBell, FaUser, FaCog, FaSignOutAlt, FaSearch, FaMoon, FaSun, FaChevronDown } from "react-icons/fa"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../contexts/ThemeContext"
import { useNotifications } from "../../contexts/NotificationContext"
import NotificationPanel from "../inventory/NotificationPanel"

const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${(props) => props.theme.spacing?.lg || "1.5rem"} ${(props) => props.theme.spacing?.xl || "2rem"};
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  border-bottom: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  position: sticky;
  top: 0;
  z-index: 999;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);

  @media (max-width: ${(props) => props.theme.breakpoints?.md || "768px"}) {
    padding: ${(props) => props.theme.spacing?.md || "1rem"};
  }
`

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing?.lg || "1.5rem"};
`

const MenuButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  border-radius: ${(props) => props.theme.borderRadius?.md || "0.5rem"};
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 18px;

  &:hover {
    background: ${(props) => props.theme.colors?.primary || "#1b4332"};
    color: white;
    transform: scale(1.05);
  }

  @media (min-width: ${(props) => props.theme.breakpoints?.lg || "1024px"}) {
    display: none;
  }
`

const PageInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing?.xs || "0.25rem"};

  @media (max-width: ${(props) => props.theme.breakpoints?.sm || "640px"}) {
    display: none;
  }
`

const PageTitle = styled.h1`
  font-size: ${(props) => props.theme.typography?.fontSize?.xl || "1.25rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.bold || "700"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin: 0;
`

const Breadcrumb = styled.div`
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing?.xs || "0.25rem"};
`

const BreadcrumbItem = styled.span`
  &:not(:last-child)::after {
    content: "/";
    margin-left: ${(props) => props.theme.spacing?.xs || "0.25rem"};
    color: ${(props) => props.theme.colors?.border || "#e2e8f0"};
  }
`

const CenterSection = styled.div`
  flex: 1;
  max-width: 400px;
  margin: 0 ${(props) => props.theme.spacing?.xl || "2rem"};

  @media (max-width: ${(props) => props.theme.breakpoints?.md || "768px"}) {
    display: none;
  }
`

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
`

const SearchInput = styled.input`
  width: 100%;
  padding: ${(props) => props.theme.spacing?.sm || "0.5rem"} ${(props) => props.theme.spacing?.sm || "0.5rem"} ${(props) => props.theme.spacing?.sm || "0.5rem"} ${(props) => props.theme.spacing?.["3xl"] || "4rem"};
  border: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.colors?.primary || "#1b4332"};
    background: ${(props) => props.theme.colors?.surface || "#ffffff"};
    box-shadow: ${(props) => props.theme.shadows?.glow || "0 0 20px rgba(27, 67, 50, 0.1)"};
  }

  &::placeholder {
    color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  }
`

const SearchIcon = styled.div`
  position: absolute;
  left: ${(props) => props.theme.spacing?.md || "1rem"};
  top: 50%;
  transform: translateY(-50%);
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  font-size: 16px;
  pointer-events: none;
`

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
  position: relative;
`

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  border-radius: ${(props) => props.theme.borderRadius?.md || "0.5rem"};
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 16px;
  position: relative;

  &:hover {
    background: ${(props) => props.theme.colors?.primary || "#1b4332"};
    color: white;
    transform: scale(1.05);
  }
`

const NotificationBadge = styled.span`
  position: absolute;
  top: -2px;
  right: -2px;
  background: ${(props) => props.theme.colors?.error || "#c53030"};
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  border: 2px solid ${(props) => props.theme.colors?.surface || "#ffffff"};
`

const UserMenu = styled.div`
  position: relative;
`

const UserButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  padding: ${(props) => props.theme.spacing?.sm || "0.5rem"} ${(props) => props.theme.spacing?.md || "1rem"};
  border: none;
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};

  &:hover {
    background: ${(props) => props.theme.colors?.primary || "#1b4332"};
    color: white;
  }

  @media (max-width: ${(props) => props.theme.breakpoints?.sm || "640px"}) {
    padding: ${(props) => props.theme.spacing?.sm || "0.5rem"};
    
    span {
      display: none;
    }
  }
`

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${(props) => props.theme.gradients?.accent || "linear-gradient(135deg, #40916c 0%, #2d5016 100%)"};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: ${(props) => props.theme.typography?.fontWeight?.bold || "700"};
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
  flex-shrink: 0;
`

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  border: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  box-shadow: ${(props) => props.theme.shadows?.xl || "0 20px 25px -5px rgba(0, 0, 0, 0.1)"};
  min-width: 200px;
  z-index: 1000;
  opacity: ${(props) => (props.$show ? 1 : 0)};
  visibility: ${(props) => (props.$show ? "visible" : "hidden")};
  transform: translateY(${(props) => (props.$show ? "0" : "-10px")});
  transition: all 0.3s ease;
`

const DropdownItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
  padding: ${(props) => props.theme.spacing?.md || "1rem"} ${(props) => props.theme.spacing?.lg || "1.5rem"};
  border: none;
  background: none;
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  text-align: left;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};

  &:hover {
    background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  }

  &:first-child {
    border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"} ${(props) => props.theme.borderRadius?.lg || "0.75rem"} 0 0;
  }

  &:last-child {
    border-radius: 0 0 ${(props) => props.theme.borderRadius?.lg || "0.75rem"} ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  }
`

// Moved UserInfo, UserName, UserRole definitions to top-level for accessibility
const UserInfoBlock = styled.div` /* Renamed to avoid conflict */
  padding: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  border-bottom: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  text-align: center;
`

const UserDisplayName = styled.div` /* Renamed to avoid conflict */
  font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold || "600"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  margin-bottom: ${(props) => props.theme.spacing?.xs || "0.25rem"};
`

const UserDisplayRole = styled.div` /* Renamed to avoid conflict */
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  text-transform: capitalize;
`


// Page title mapping
const PAGE_TITLES = {
  "/dashboard": { title: "Dashboard", breadcrumb: ["Home", "Dashboard"] },
  "/inventory": { title: "Inventory Management", breadcrumb: ["Modules", "Inventory"] },
  "/purchase-orders": { title: "Purchase Orders", breadcrumb: ["Modules", "Purchase Orders"] },
  "/sales": { title: "Sales Management", breadcrumb: ["Modules", "Sales"] },
  "/suppliers": { title: "Supplier Management", breadcrumb: ["Modules", "Suppliers"] },
  "/reports": { title: "Analytics & Reports", breadcrumb: ["Modules", "Reports"] },
  "/users": { title: "User Management", breadcrumb: ["Admin", "Users"] },
  "/profile": { title: "Profile Settings", breadcrumb: ["Account", "Profile"] },
  "/settings": { title: "System Settings", breadcrumb: ["Account", "Settings"] },
}

const DynamicHeader = ({ onSidebarToggle, user }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { unreadCount } = useNotifications()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotificationPanel, setShowNotificationPanel] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const userMenuRef = useRef(null)
  const notificationButtonRef = useRef(null);
  const notificationPanelRef = useRef(null);


  // Close user menu or notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close user menu
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
      // Close notification panel
      // Only close if click is outside the button AND outside the panel itself
      if (notificationButtonRef.current && !notificationButtonRef.current.contains(event.target) &&
          notificationPanelRef.current && !notificationPanelRef.current.contains(event.target)) {
        setShowNotificationPanel(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])


  // Get current page info
  const getCurrentPageInfo = () => {
    const path = location.pathname
    return PAGE_TITLES[path] || { title: "Management System", breadcrumb: ["Home"] }
  }

  const pageInfo = getCurrentPageInfo()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      console.log("Searching for:", searchQuery)
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase()
  }

  return (
    <HeaderContainer>
      <LeftSection>
        <MenuButton onClick={onSidebarToggle}>
          <FaBars />
        </MenuButton>

        <PageInfo>
          <PageTitle>{pageInfo.title}</PageTitle>
          <Breadcrumb>
            {pageInfo.breadcrumb.map((item, index) => (
              <BreadcrumbItem key={index}>{item}</BreadcrumbItem>
            ))}
          </Breadcrumb>
        </PageInfo>
      </LeftSection>

      <CenterSection>
        <SearchContainer>
          <form onSubmit={handleSearch}>
            <SearchIcon>
              <FaSearch />
            </SearchIcon>
            <SearchInput
              type="text"
              placeholder="Search across all modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </SearchContainer>
      </CenterSection>

      <RightSection>
        <ActionButton onClick={toggleTheme} title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
          {theme === "light" ? <FaMoon /> : <FaSun />}
        </ActionButton>

        <ActionButton 
            ref={notificationButtonRef}
            onClick={() => setShowNotificationPanel(!showNotificationPanel)} 
            title="Notifications"
        >
          <FaBell />
          {unreadCount > 0 && <NotificationBadge>{unreadCount > 9 ? '9+' : unreadCount}</NotificationBadge>}
        </ActionButton>

        <UserMenu ref={userMenuRef}>
          <UserButton onClick={() => setShowUserMenu(!showUserMenu)}>
            <UserAvatar>{getInitials(user?.firstName, user?.lastName)}</UserAvatar>
            <span>{user?.firstName}</span>
            <FaChevronDown style={{ fontSize: "12px" }} />
          </UserButton>

          <DropdownMenu $show={showUserMenu}>
            <UserInfoBlock> {/* Use the renamed component */}
              <UserDisplayName> {/* Use the renamed component */}
                {user?.firstName} {user?.lastName}
              </UserDisplayName>
              <UserDisplayRole>{user?.role}</UserDisplayRole> {/* Use the renamed component */}
            </UserInfoBlock>

            <DropdownItem onClick={() => { setShowUserMenu(false); navigate("/profile"); }}>
              <FaUser />
              Profile Settings
            </DropdownItem>

            <DropdownItem onClick={() => { setShowUserMenu(false); navigate("/settings"); }}>
              <FaCog />
              System Settings
            </DropdownItem>

            <DropdownItem onClick={handleLogout}>
              <FaSignOutAlt />
              Sign Out
            </DropdownItem>
          </DropdownMenu>
        </UserMenu>
      </RightSection>

      {/* Render NotificationPanel, passing refs for correct outside click detection */}
      {showNotificationPanel && (
        <NotificationPanel 
          onClose={() => setShowNotificationPanel(false)} 
          notificationPanelRef={notificationPanelRef} // Pass ref to panel
          anchorEl={notificationButtonRef.current} // Pass button element for positioning
        />
      )}
    </HeaderContainer>
  )
}

export default DynamicHeader