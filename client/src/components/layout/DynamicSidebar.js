// client/src/components/layout/DynamicSidebar.js
"use client";

import { useNavigate, useLocation } from "react-router-dom";
import styled from "styled-components";
import {
  FaHome,
  FaChartBar,
  FaTractor,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight,
  FaLeaf,
  FaBoxes,
  FaRecycle,
  FaHardHat,
  FaUsers,
  FaCog,
} from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";

const SidebarContainer = styled.div`
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  /* UPDATED: Reduced width for open and collapsed states */
  width: ${(props) => (props.$isOpen ? "240px" : "60px")}; /* Changed from 280px/72px */
  background: ${(props) =>
    props.theme.gradients?.hero ||
    "linear-gradient(180deg, #0f2419 0%, #1b4332 50%, #2d5016 100%)"};
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease-out;
  z-index: 1000; /* Ensure sidebar is above main content and overlay */
  box-shadow: ${(props) =>
    props.theme.shadows?.xl ||
    "0 20px 25px -5px rgba(27, 67, 50, 0.1)"};
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden; /* Hide overflow when closed/collapsed */
  display: flex; /* Ensure inner content lays out vertically */
  flex-direction: column;

  /* On screens smaller than large breakpoint (e.g., tablet/mobile) */
  @media (max-width: ${(props) => props.theme.breakpoints?.lg || "1024px"}) {
    /* UPDATED: Full open width for mobile overlay */
    width: 240px; /* Changed from 280px */
    transform: translateX(${(props) => (props.$isOpen ? "0" : "-100%")});
    box-shadow: ${(props) =>
      props.$isOpen ? props.theme.shadows?.xl : "none"}; /* Only show shadow when open */
    transition: transform 0.3s ease-out; /* Only transition on transform for mobile overlay */
  }
`;

const SidebarHeader = styled.div`
  padding: ${(props) => props.theme.spacing?.xl || "2rem"}
    ${(props) => props.theme.spacing?.lg || "1.5rem"};
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
  position: relative;
  flex-shrink: 0; /* Prevent header from shrinking when content scrolls */
`;

const Logo = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  background: ${(props) =>
    props.theme.gradients?.accent ||
    "linear-gradient(135deg, #40916c 0%, #2d5016 100%)"};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  box-shadow: ${(props) =>
    props.theme.shadows?.glow || "0 0 20px rgba(64, 145, 108, 0.3)"};
  flex-shrink: 0;
`;

const BrandInfo = styled.div`
  opacity: ${(props) => (props.$isOpen ? 1 : 0)};
  transform: translateX(${(props) => (props.$isOpen ? "0" : "-20px")});
  transition: all 0.3s ease;
  overflow: hidden;
  white-space: nowrap; /* Keep brand info on one line */
  flex-grow: 1; /* Allow brand info to take available space */

  /* Always show brand info when sidebar is fully open on mobile */
  @media (max-width: ${(props) => props.theme.breakpoints?.lg || "1024px"}) {
    opacity: 1;
    transform: translateX(0);
  }
`;

const BrandName = styled.h2`
  font-size: ${(props) =>
    props.theme.typography?.fontSize?.lg || "1.125rem"};
  font-weight: ${(props) =>
    props.theme.typography?.fontWeight?.bold || "700"};
  color: white;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const BrandSubtitle = styled.p`
  font-size: ${(props) =>
    props.theme.typography?.fontSize?.sm || "0.875rem"};
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ToggleButton = styled.button`
  position: absolute;
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${(props) => props.theme.colors?.surface || "#ffffff"};
  border: 2px solid
    ${(props) => props.theme.colors?.primary || "#1b4332"};
  color: ${(props) => props.theme.colors?.primary || "#1b4332"};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.3s ease;
  box-shadow: ${(props) =>
    props.theme.shadows?.md || "0 4px 6px -1px rgba(27, 67, 50, 0.1)"};

  &:hover {
    background: ${(props) => props.theme.colors?.primary || "#1b4332"};
    color: white;
    transform: translateY(-50%) scale(1.1);
  }

  /* Hide this button on smaller screens, as the header menu button will handle toggling */
  @media (max-width: ${(props) => props.theme.breakpoints?.lg || "1024px"}) {
    display: none;
  }
`;

const Navigation = styled.nav`
  padding: ${(props) => props.theme.spacing?.lg || "1.5rem"} 0;
  flex: 1; /* Allow navigation to grow and shrink */
  overflow-y: auto; /* Allow scrolling for long navigation lists */
  overflow-x: hidden; /* Prevent horizontal scroll in nav text */
`;

const NavSection = styled.div`
  margin-bottom: ${(props) => props.theme.spacing?.xl || "2rem"};
`;

const NavSectionTitle = styled.h3`
  font-size: ${(props) =>
    props.theme.typography?.fontSize?.xs || "0.75rem"};
  font-weight: ${(props) =>
    props.theme.typography?.fontWeight?.semibold || "600"};
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 ${(props) => props.theme.spacing?.md || "1rem"} 0;
  padding: 0 ${(props) => props.theme.spacing?.lg || "1.5rem"};
  opacity: ${(props) => (props.$isOpen ? 1 : 0)};
  transition: opacity 0.3s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  /* Always show section title when sidebar is fully open on mobile */
  @media (max-width: ${(props) => props.theme.breakpoints?.lg || "1024px"}) {
    opacity: 1;
  }
`;

const NavList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const NavItem = styled.li`
  margin-bottom: ${(props) => props.theme.spacing?.xs || "0.25rem"};
`;

const NavLink = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
  padding: ${(props) => props.theme.spacing?.md || "1rem"}
    ${(props) => props.theme.spacing?.lg || "1.5rem"};
  background: none;
  border: none;
  color: ${(props) => (props.$active ? "white" : "rgba(255, 255, 255, 0.7)")};
  font-size: ${(props) => props.theme.typography?.fontSize?.base || "1rem"};
  font-weight: ${(props) =>
    props.theme.typography?.fontWeight?.medium || "500"};
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 0
    ${(props) => props.theme.borderRadius?.lg || "0.75rem"}
    ${(props) => props.theme.borderRadius?.lg || "0.75rem"} 0;
  margin-right: ${(props) => props.theme.spacing?.md || "1rem"};
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: ${(props) => props.theme.colors?.accent || "#40916c"};
    transform: scaleY(${(props) => (props.$active ? 1 : 0)});
    transition: transform 0.3s ease;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    transform: translateX(4px);
  }

  ${(props) =>
    props.$active &&
    `
    background: rgba(255, 255, 255, 0.15);
    color: white;
    box-shadow: ${
      props.theme.shadows?.md || "0 4px 6px -1px rgba(27, 67, 50, 0.1)"
    };
  `}
`;

const NavIcon = styled.div`
  /* UPDATED: Slightly smaller icon size for collapsed state */
  font-size: ${(props) => (props.$isOpen ? "20px" : "18px")};
  width: ${(props) => (props.$isOpen ? "20px" : "18px")};
  height: ${(props) => (props.$isOpen ? "20px" : "18px")};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  @media (max-width: ${(props) => props.theme.breakpoints?.lg || "1024px"}) {
    font-size: 20px; /* Reset to default for mobile overlay */
    width: 20px;
    height: 20px;
  }
`;

const NavText = styled.span`
  opacity: ${(props) => (props.$isOpen ? 1 : 0)};
  transform: translateX(${(props) => (props.$isOpen ? "0" : "-20px")});
  transition: all 0.3s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1; /* Allow text to take available space */

  /* Always show nav text when sidebar is fully open on mobile */
  @media (max-width: ${(props) => props.theme.breakpoints?.lg || "1024px"}) {
    opacity: 1;
    transform: translateX(0);
  }
`;

const SidebarFooter = styled.div`
  padding: ${(props) => props.theme.spacing?.lg || "1.5rem"};
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0; /* Prevent footer from shrinking */
  /* Ensure footer content hides when sidebar is closed on desktop */
  opacity: ${(props) => (props.$isOpen ? 1 : 0)};
  transition: opacity 0.3s ease;

  /* Always show footer when sidebar is fully open on mobile */
  @media (max-width: ${(props) => props.theme.breakpoints?.lg || "1024px"}) {
    opacity: 1;
  }
`;

const UserProfile = styled.div`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing?.md || "1rem"};
  padding: ${(props) => props.theme.spacing?.md || "1rem"};
  border-radius: ${(props) => props.theme.borderRadius?.lg || "0.75rem"};
  background: rgba(255, 255, 255, 0.1);
  margin-bottom: ${(props) => props.theme.spacing?.md || "1rem"};
`;

const UserAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${(props) =>
    props.theme.gradients?.accent ||
    "linear-gradient(135deg, #40916c 0%, #2d5016 100%)"};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: ${(props) =>
    props.theme.typography?.fontWeight?.bold || "700"};
  font-size: ${(props) =>
    props.theme.typography?.fontSize?.sm || "0.875rem"};
  flex-shrink: 0;
`;

const UserInfo = styled.div`
  opacity: ${(props) => (props.$isOpen ? 1 : 0)};
  transform: translateX(${(props) => (props.$isOpen ? "0" : "-20px")});
  transition: all 0.3s ease;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  flex-grow: 1; /* Allow user info to take available space */

  /* Always show user info when sidebar is fully open on mobile */
  @media (max-width: ${(props) => props.theme.breakpoints?.lg || "1024px"}) {
    opacity: 1;
    transform: translateX(0);
  }
`;

const UserName = styled.div`
  font-size: ${(props) =>
    props.theme.typography?.fontSize?.sm || "0.875rem"};
  font-weight: ${(props) =>
    props.theme.typography?.fontWeight?.semibold || "600"};
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserRole = styled.div`
  font-size: ${(props) =>
    props.theme.typography?.fontSize?.xs || "0.75rem"};
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// Module configuration with icons and routes (unchanged)
const MODULE_CONFIG = {
  IMS: {
    icon: <FaBoxes />,
    label: "Inventory",
    path: "/inventory",
    section: "modules",
  },
  ISA: {
    icon: <FaTractor />,
    label: "Agriculture",
    path: "/agriculture",
    section: "modules",
  },
  "Waste Management": {
    icon: <FaRecycle />,
    label: "Waste Management",
    path: "/waste",
    section: "modules",
  },
  "Construction Sites": {
    icon: <FaHardHat />,
    label: "Construction",
    path: "/construction",
    section: "modules",
  },
  Analytics: {
    icon: <FaChartBar />,
    label: "Analytics",
    path: "/analytics",
    section: "main",
  },
  "User Management": {
    icon: <FaUsers />,
    label: "Users",
    path: "/users",
    section: "admin",
  },
};

const DynamicSidebar = ({ isOpen, onToggle, user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const baseNavItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <FaHome />,
      path: "/dashboard",
      section: "main",
    },
  ];

  const generateNavItems = () => {
    if (!user) return baseNavItems;

    const navItems = [...baseNavItems];

    if (user.modules && user.modules.length > 0) {
      user.modules.forEach((moduleName) => {
        const moduleConfig = MODULE_CONFIG[moduleName];
        if (moduleConfig) {
          navItems.push({
            id: moduleName.toLowerCase().replace(/\s+/g, "-"),
            label: moduleConfig.label,
            icon: moduleConfig.icon,
            path: moduleConfig.path,
            section: moduleConfig.section,
            module: moduleName,
          });
        }
      });
    }

    navItems.push({
      id: "settings",
      label: "Settings",
      icon: <FaCog />,
      path: "/settings",
      section: "system",
    });

    return navItems;
  };

  const groupNavItems = (items) => {
    const grouped = {
      main: [],
      modules: [],
      admin: [],
      system: [],
    };

    items.forEach((item) => {
      const section = item.section || "main";
      if (grouped[section]) {
        grouped[section].push(item);
      }
    });

    return grouped;
  };

  const navItems = generateNavItems();
  const groupedNavItems = groupNavItems(navItems);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      logout();
      navigate("/login");
    }
  };

  const isActiveRoute = (path) => {
    // Check for exact path or if it's a base path for a module
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ""}${
      lastName?.charAt(0) || ""
    }`.toUpperCase();
  };

  return (
    <SidebarContainer $isOpen={isOpen}>
      <SidebarHeader>
        <Logo>
          <FaLeaf />
        </Logo>
        <BrandInfo $isOpen={isOpen}>
          <BrandName>ManagePro</BrandName>
          <BrandSubtitle>Business Suite</BrandSubtitle>
        </BrandInfo>
        {/* ToggleButton only for desktop to expand/collapse, hidden on mobile */}
        <ToggleButton onClick={onToggle}>
          {isOpen ? <FaChevronLeft /> : <FaChevronRight />}
        </ToggleButton>
      </SidebarHeader>

      <Navigation>
        {groupedNavItems.main.length > 0 && (
          <NavSection>
            <NavSectionTitle $isOpen={isOpen}>Main</NavSectionTitle>
            <NavList>
              {groupedNavItems.main.map((item) => (
                <NavItem key={item.id}>
                  <NavLink
                    $active={isActiveRoute(item.path)}
                    onClick={() => handleNavigation(item.path)}
                  >
                    <NavIcon $isOpen={isOpen}>{item.icon}</NavIcon> {/* Pass isOpen to NavIcon */}
                    <NavText $isOpen={isOpen}>{item.label}</NavText>
                  </NavLink>
                </NavItem>
              ))}
            </NavList>
          </NavSection>
        )}

        {groupedNavItems.modules.length > 0 && (
          <NavSection>
            <NavSectionTitle $isOpen={isOpen}>Modules</NavSectionTitle>
            <NavList>
              {groupedNavItems.modules.map((item) => (
                <NavItem key={item.id}>
                  <NavLink
                    $active={isActiveRoute(item.path)}
                    onClick={() => handleNavigation(item.path)}
                  >
                    <NavIcon $isOpen={isOpen}>{item.icon}</NavIcon> {/* Pass isOpen to NavIcon */}
                    <NavText $isOpen={isOpen}>{item.label}</NavText>
                  </NavLink>
                </NavItem>
              ))}
            </NavList>
          </NavSection>
        )}

        {groupedNavItems.admin.length > 0 && (
          <NavSection>
            <NavSectionTitle $isOpen={isOpen}>Administration</NavSectionTitle>
            <NavList>
              {groupedNavItems.admin.map((item) => (
                <NavItem key={item.id}>
                  <NavLink
                    $active={isActiveRoute(item.path)}
                    onClick={() => handleNavigation(item.path)}
                  >
                    <NavIcon $isOpen={isOpen}>{item.icon}</NavIcon> {/* Pass isOpen to NavIcon */}
                    <NavText $isOpen={isOpen}>{item.label}</NavText>
                  </NavLink>
                </NavItem>
              ))}
            </NavList>
          </NavSection>
        )}

        {groupedNavItems.system.length > 0 && (
          <NavSection>
            <NavSectionTitle $isOpen={isOpen}>System</NavSectionTitle>
            <NavList>
              {groupedNavItems.system.map((item) => (
                <NavItem key={item.id}>
                  <NavLink
                    $active={isActiveRoute(item.path)}
                    onClick={() => handleNavigation(item.path)}
                  >
                    <NavIcon $isOpen={isOpen}>{item.icon}</NavIcon> {/* Pass isOpen to NavIcon */}
                    <NavText $isOpen={isOpen}>{item.label}</NavText>
                  </NavLink>
                </NavItem>
              ))}
            </NavList>
          </NavSection>
        )}
      </Navigation>

      <SidebarFooter $isOpen={isOpen}>
        {user && (
          <UserProfile>
            <UserAvatar>{getInitials(user.firstName, user.lastName)}</UserAvatar>
            <UserInfo $isOpen={isOpen}>
              <UserName>{`${user.firstName} ${user.lastName}`}</UserName>
              <UserRole>{user.role}</UserRole>
            </UserInfo>
          </UserProfile>
        )}

        <NavLink
          onClick={handleLogout}
          style={{ color: "#ef4444", marginTop: "8px" }}
        >
          <NavIcon $isOpen={isOpen}>
            <FaSignOutAlt />
          </NavIcon>
          <NavText $isOpen={isOpen}>Sign out</NavText>
        </NavLink>
      </SidebarFooter>
    </SidebarContainer>
  );
};

export default DynamicSidebar;