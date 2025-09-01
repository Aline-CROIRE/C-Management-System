"use client"

import { useState, useEffect } from "react"
import styled from "styled-components"
import { useAuth } from "../contexts/AuthContext"
import { useNotifications } from "../contexts/NotificationContext"
import Card from "../components/common/Card"
import Button from "../components/common/Button"
import Input from "../components/common/Input"
import api from "../utils/api"

const ProfileContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
`

const ProfileHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`

const ProfileTitle = styled.h1`
  font-size: 2rem;
  color: ${(props) => props.theme.colors.text};
  margin-bottom: 0.5rem;
`

const ProfileSubtitle = styled.p`
  color: ${(props) => props.theme.colors.textSecondary};
  font-size: 1.1rem;
`

const ProfileForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const AvatarSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`

const Avatar = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: ${(props) => props.theme.gradients.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: white;
  font-weight: bold;
`

const ModulesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`

const ModuleBadge = styled.span`
  background: ${(props) => props.theme.colors.primary};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: ${(props) => props.theme.borderRadius.full};
  font-size: 0.875rem;
`

const Profile = () => {
  const { user, updateUser } = useAuth()
  const { showToast } = useNotifications()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: "",
    position: "",
  })

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        department: user.department || "",
        position: user.position || "",
      })
    }
  }, [user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await api.put("/users/profile", formData)

      if (response.data.success) {
        updateUser(response.data.user)
        showToast("Profile updated successfully!", "success")
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to update profile", "error")
    } finally {
      setLoading(false)
    }
  }

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    }
    return user?.email?.[0]?.toUpperCase() || "U"
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <ProfileContainer>
      <ProfileHeader>
        <ProfileTitle>My Profile</ProfileTitle>
        <ProfileSubtitle>Manage your account information</ProfileSubtitle>
      </ProfileHeader>

      <Card>
        <AvatarSection>
          <Avatar>{getInitials()}</Avatar>
          <div style={{ textAlign: "center" }}>
            <h3>
              {user.firstName} {user.lastName}
            </h3>
            <p style={{ color: "#666", marginTop: "0.5rem" }}>{user.role === "admin" ? "Administrator" : "User"}</p>
            {user.modules && user.modules.length > 0 && (
              <div>
                <p style={{ marginTop: "1rem", marginBottom: "0.5rem", fontWeight: "bold" }}>Assigned Modules:</p>
                <ModulesList>
                  {user.modules.map((module, index) => (
                    <ModuleBadge key={index}>{module}</ModuleBadge>
                  ))}
                </ModulesList>
              </div>
            )}
          </div>
        </AvatarSection>

        <ProfileForm onSubmit={handleSubmit}>
          <FormRow>
            <Input
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
            />
            <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
          </FormRow>

          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            disabled
          />

          <FormRow>
            <Input label="Phone" name="phone" value={formData.phone} onChange={handleInputChange} />
            <Input label="Department" name="department" value={formData.department} onChange={handleInputChange} />
          </FormRow>

          <Input label="Position" name="position" value={formData.position} onChange={handleInputChange} />

          <Button type="submit" variant="primary" disabled={loading} style={{ alignSelf: "flex-start" }}>
            {loading ? "Updating..." : "Update Profile"}
          </Button>
        </ProfileForm>
      </Card>
    </ProfileContainer>
  )
}

export default Profile
