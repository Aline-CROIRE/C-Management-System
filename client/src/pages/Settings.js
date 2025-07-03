"use client"

import { useState } from "react"
import styled from "styled-components"
import { useTheme } from "../contexts/ThemeContext"
import { useNotifications } from "../contexts/NotificationContext"
import Card from "../components/common/Card"
import Button from "../components/common/Button"
import Input from "../components/common/Input"
import api from "../utils/api"

const SettingsContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
`

const SettingsHeader = styled.div`
  margin-bottom: 2rem;
`

const SettingsTitle = styled.h1`
  font-size: 2rem;
  color: ${(props) => props.theme.colors.text};
  margin-bottom: 0.5rem;
`

const SettingsSection = styled.div`
  margin-bottom: 2rem;
`

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  color: ${(props) => props.theme.colors.text};
  margin-bottom: 1rem;
`

const ToggleSwitch = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`

const ToggleLabel = styled.div`
  flex: 1;
`

const ToggleTitle = styled.h3`
  font-size: 1rem;
  color: ${(props) => props.theme.colors.text};
  margin-bottom: 0.25rem;
`

const ToggleDescription = styled.p`
  font-size: 0.875rem;
  color: ${(props) => props.theme.colors.textSecondary};
`

const Switch = styled.button`
  width: 50px;
  height: 24px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  position: relative;
  transition: background-color 0.3s;
  background-color: ${(props) => (props.active ? props.theme.colors.primary : props.theme.colors.border)};

  &::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    top: 2px;
    left: ${(props) => (props.active ? "28px" : "2px")};
    transition: left 0.3s;
  }
`

const PasswordForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const Settings = () => {
  const { isDarkMode, toggleTheme } = useTheme()
  const { showToast } = useNotifications()
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
  })

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("New passwords do not match", "error")
      return
    }

    if (passwordData.newPassword.length < 6) {
      showToast("Password must be at least 6 characters long", "error")
      return
    }

    setLoading(true)

    try {
      const response = await api.put("/users/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })

      if (response.data.success) {
        showToast("Password changed successfully!", "success")
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to change password", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationToggle = (type) => {
    setNotifications((prev) => ({
      ...prev,
      [type]: !prev[type],
    }))
    showToast(`${type} notifications ${notifications[type] ? "disabled" : "enabled"}`, "info")
  }

  return (
    <SettingsContainer>
      <SettingsHeader>
        <SettingsTitle>Settings</SettingsTitle>
      </SettingsHeader>

      <SettingsSection>
        <Card>
          <SectionTitle>Appearance</SectionTitle>
          <ToggleSwitch>
            <ToggleLabel>
              <ToggleTitle>Dark Mode</ToggleTitle>
              <ToggleDescription>Switch between light and dark themes</ToggleDescription>
            </ToggleLabel>
            <Switch active={isDarkMode} onClick={toggleTheme} />
          </ToggleSwitch>
        </Card>
      </SettingsSection>

      <SettingsSection>
        <Card>
          <SectionTitle>Notifications</SectionTitle>
          <ToggleSwitch>
            <ToggleLabel>
              <ToggleTitle>Email Notifications</ToggleTitle>
              <ToggleDescription>Receive notifications via email</ToggleDescription>
            </ToggleLabel>
            <Switch active={notifications.email} onClick={() => handleNotificationToggle("email")} />
          </ToggleSwitch>
          <ToggleSwitch>
            <ToggleLabel>
              <ToggleTitle>Push Notifications</ToggleTitle>
              <ToggleDescription>Receive browser push notifications</ToggleDescription>
            </ToggleLabel>
            <Switch active={notifications.push} onClick={() => handleNotificationToggle("push")} />
          </ToggleSwitch>
          <ToggleSwitch>
            <ToggleLabel>
              <ToggleTitle>SMS Notifications</ToggleTitle>
              <ToggleDescription>Receive notifications via SMS</ToggleDescription>
            </ToggleLabel>
            <Switch active={notifications.sms} onClick={() => handleNotificationToggle("sms")} />
          </ToggleSwitch>
        </Card>
      </SettingsSection>

      <SettingsSection>
        <Card>
          <SectionTitle>Security</SectionTitle>
          <PasswordForm onSubmit={handlePasswordSubmit}>
            <Input
              label="Current Password"
              name="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              required
            />
            <Input
              label="New Password"
              name="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              required
            />
            <Input
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              required
            />
            <Button type="submit" variant="primary" disabled={loading} style={{ alignSelf: "flex-start" }}>
              {loading ? "Changing..." : "Change Password"}
            </Button>
          </PasswordForm>
        </Card>
      </SettingsSection>
    </SettingsContainer>
  )
}

export default Settings
