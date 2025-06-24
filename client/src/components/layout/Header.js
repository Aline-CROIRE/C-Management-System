"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import styled from "styled-components"
import { FaBell, FaSearch, FaCog, FaBars } from "react-icons/fa"
import { useAuth } from "../../contexts/AuthContext"

const HeaderContainer = styled.header`
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  border-bottom: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  box-shadow: ${(props) => props.theme.shadows?.sm || "0 1px 2px 0 rgba(27, 67, 50, 0.05)"};
  padding: ${(props) => props.theme.spacing?.lg || "1.5rem"} ${(props) => props.theme.spacing?.xl || "2rem"};
  position: sticky;
  top: 0;
  z-index: 999;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);

  @media (max-width: ${(props) => props.theme.breakpoints?.md || "768px"}) {
    padding: ${(props) => props.theme.spacing?.md || "1rem"};
  }
`

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 100%;
`

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  flex: 1;
`

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  font-size: 20px;
  cursor: pointer;
  padding: ${(props) => props.theme.spacing?.sm || "0.5rem"};
  border-radius: ${(props) => props.theme.borderRadius?.md || "0.5rem"};
  transition: all 0.3s ease;

  &:hover {
    background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
    color: ${(props) => props.theme.colors?.primary || "#1b4332"};
  }

  @media (max-width: ${(props) => props.theme.breakpoints?.lg || "1024px"}) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`

const SearchContainer = styled.div`
  position: relative;
  max-width: 400px;
  width: 100%;

  @media (max-width: ${(props) => props.theme.breakpoints?.md || "768px"}) {
    display: none;
  }
`

const SearchInput = styled.input`
  width: 100%;
  padding: ${(props) => props.theme.spacing?.sm || "0.5rem"} ${(props) => props.theme.spacing?.md || "1rem"} ${(props) => props.theme.spacing?.sm || "0.5rem"} ${(props) => props.theme.spacing?.["2xl"] || "3rem"};
  border: 2px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  transition: all 0.3s ease;
  outline: none;

  &::placeholder {
    color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  }

  &:focus {
    border-color: ${(props) => props.theme.colors?.primary || "#1b4332"};
    background: ${(props) => props.theme.colors?.surface || "#ffffff"};
    box-shadow: 0 0 0 3px ${(props) => props.theme.colors?.primary || "#1b4332"}20;
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
`

const IconButton = styled.button`
  width: 44px;
  height: 44px;
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  background: ${(props) => props.theme.colors?.surfaceLight || "#f7fafc"};
  border: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    background: ${(props) => props.theme.colors?.primary || "#1b4332"};
    color: white;
    transform: translateY(-2px);
    box-shadow: ${(props) => props.theme.shadows?.glow || "0 0 20px rgba(64, 145, 108, 0.3)"};
  }

  ${(props) =>
    props.$hasNotification &&
    `
    &::after {
      content: '';
      position: absolute;
      top: 8px;
      right: 8px;
      width: 8px;
      height: 8px;
      background: ${props.theme.colors?.error || "#c53030"};
      border-radius: 50%;
      border: 2px solid ${props.theme.colors?.surface || "#ffffff"};
    }
  `}
`

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
  padding-left: ${(props) => props.theme.spacing?.md || "1rem"};
  border-left: 1px solid ${(props) => props.theme.colors?.border || "#e2e8f0"};

  @media (max-width: ${(props) => props.theme.breakpoints?.sm || "640px"}) {
    border-left: none;
    padding-left: 0;
  }
`

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  
  @media (max-width: ${(props) => props.theme.breakpoints?.md || "768px"}) {
    display: none;
  }
`

const UserName = styled.span`
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
  font-weight: ${(props) => props.theme.typography?.fontWeight?.semibold || "600"};
  color: ${(props) => props.theme.colors?.text || "#2d3748"};
  line-height: 1.2;
`

const UserRole = styled.span`
  font-size: ${(props) => props.theme.typography?.fontSize?.xs || "0.75rem"};
  color: ${(props) => props.theme.colors?.textSecondary || "#718096"};
  line-height: 1.2;
`

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${(props) => props.theme.gradients?.accent || "linear-gradient(135deg, #40916c 0%, #2d5016 100%)"};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: ${(props) => props.theme.typography?.fontWeight?.bold || "700"};
  font-size: ${(props) => props.theme.typography?.fontSize?.sm || "0.875rem"};
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid ${(props) => props.theme.colors?.surface || "#ffffff"};
  box-shadow: ${(props) => props.theme.shadows?.md || "0 4px 6px -1px rgba(27, 67, 50, 0.1)"};

  &:hover {
    transform: scale(1.05);
    box-shadow: ${(props) => props.theme.shadows?.glow || "0 0 20px rgba(64, 145, 108, 0.3)"};
  }
`

const Header = ({ onSidebarToggle }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      // Clear authentication data
      localStorage.removeItem("token")
      localStorage.removeItem("user")

      // Call logout from auth context if available
      if (logout) {
        logout()
      }

      // Navigate to login
      navigate("/login")
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    // Handle search logic
    console.log("Searching for:", searchQuery)
  }

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase()
  }

  return (
    <HeaderContainer>
      <HeaderContent>
        <LeftSection>
          <MobileMenuButton onClick={onSidebarToggle}>
            <FaBars />
          </MobileMenuButton>

          <SearchContainer>
            <form onSubmit={handleSearch}>
              <SearchInput
                type="text"
                placeholder="Search anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <SearchIcon>
                <FaSearch />
              </SearchIcon>
            </form>
          </SearchContainer>
        </LeftSection>

        <RightSection>
          <IconButton $hasNotification>
            <FaBell />
          </IconButton>

          <IconButton>
            <FaCog />
          </IconButton>

          <UserSection>
            {user && (
              <>
                <UserInfo>
                  <UserName>{`${user.firstName || "Aline"} ${user.lastName || "NIYO"}`}</UserName>
                  <UserRole>{user.role || "User"}</UserRole>
                </UserInfo>
                <Avatar onClick={handleLogout} style={{ cursor: "pointer" }}>
                  {getInitials(user.firstName || "Aline", user.lastName || "NIYO")}
                </Avatar>
              </>
            )}
          </UserSection>
        </RightSection>
      </HeaderContent>
    </HeaderContainer>
  )
}

export default Header
