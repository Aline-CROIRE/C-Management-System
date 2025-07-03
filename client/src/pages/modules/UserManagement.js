"use client"

import { useState, useEffect } from "react"
import styled from "styled-components"
import { useNotifications } from "../../contexts/NotificationContext"
import Card from "../../components/common/Card"
import Button from "../../components/common/Button"
import Input from "../../components/common/Input"
import api from "../../utils/api"

const UserManagementContainer = styled.div`
  padding: 2rem;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`

const Title = styled.h1`
  font-size: 2rem;
  color: ${(props) => props.theme.colors.text};
`

const UsersTable = styled.div`
  overflow-x: auto;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid ${(props) => props.theme.colors.border};
  }
  
  th {
    background: ${(props) => props.theme.colors.surfaceLight};
    font-weight: bold;
    color: ${(props) => props.theme.colors.text};
  }
  
  td {
    color: ${(props) => props.theme.colors.textSecondary};
  }
`

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: ${(props) => props.theme.borderRadius.full};
  font-size: 0.875rem;
  font-weight: medium;
  background: ${(props) => (props.active ? props.theme.colors.success : props.theme.colors.error)};
  color: white;
`

const RoleBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: ${(props) => props.theme.borderRadius.full};
  font-size: 0.875rem;
  font-weight: medium;
  background: ${(props) => (props.role === "admin" ? props.theme.colors.primary : props.theme.colors.secondary)};
  color: white;
`

const ModulesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
`

const ModuleBadge = styled.span`
  background: ${(props) => props.theme.colors.accent};
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: ${(props) => props.theme.borderRadius.sm};
  font-size: 0.75rem;
`

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`

const ModalContent = styled.div`
  background: ${(props) => props.theme.colors.surface};
  padding: 2rem;
  border-radius: ${(props) => props.theme.borderRadius.lg};
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
`

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  color: ${(props) => props.theme.colors.text};
`

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: ${(props) => props.theme.colors.textSecondary};
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const CheckboxItem = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
`

const UserManagement = () => {
  const { showToast } = useNotifications()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "user",
    modules: [],
    isActive: true,
  })

  const availableModules = ["IMS", "ISA", "Waste Management", "Construction Sites", "Analytics"]

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users")
      if (response.data.success) {
        setUsers(response.data.users)
      }
    } catch (error) {
      showToast("Failed to fetch users", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleModuleChange = (module) => {
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.includes(module) ? prev.modules.filter((m) => m !== module) : [...prev.modules, module],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      let response
      if (editingUser) {
        response = await api.put(`/users/${editingUser._id}`, formData)
      } else {
        response = await api.post("/users", formData)
      }

      if (response.data.success) {
        showToast(editingUser ? "User updated successfully" : "User created successfully", "success")
        fetchUsers()
        closeModal()
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Operation failed", "error")
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      modules: user.modules || [],
      isActive: user.isActive,
    })
    setShowModal(true)
  }

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await api.delete(`/users/${userId}`)
        if (response.data.success) {
          showToast("User deleted successfully", "success")
          fetchUsers()
        }
      } catch (error) {
        showToast("Failed to delete user", "error")
      }
    }
  }

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await api.patch(`/users/${userId}/status`, {
        isActive: !currentStatus,
      })
      if (response.data.success) {
        showToast(`User ${!currentStatus ? "activated" : "deactivated"} successfully`, "success")
        fetchUsers()
      }
    } catch (error) {
      showToast("Failed to update user status", "error")
    }
  }

  const openModal = () => {
    setEditingUser(null)
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      role: "user",
      modules: [],
      isActive: true,
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingUser(null)
  }

  if (loading) {
    return <div>Loading users...</div>
  }

  return (
    <UserManagementContainer>
      <Header>
        <Title>User Management</Title>
        <Button onClick={openModal} variant="primary">
          Add New User
        </Button>
      </Header>

      <Card>
        <UsersTable>
          <Table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Modules</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>
                    {user.firstName} {user.lastName}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <RoleBadge role={user.role}>{user.role}</RoleBadge>
                  </td>
                  <td>
                    <ModulesList>
                      {user.modules?.map((module, index) => (
                        <ModuleBadge key={index}>{module}</ModuleBadge>
                      ))}
                    </ModulesList>
                  </td>
                  <td>
                    <StatusBadge active={user.isActive}>{user.isActive ? "Active" : "Inactive"}</StatusBadge>
                  </td>
                  <td>
                    <ActionButtons>
                      <Button onClick={() => handleEdit(user)} variant="secondary" size="small">
                        Edit
                      </Button>
                      <Button
                        onClick={() => toggleUserStatus(user._id, user.isActive)}
                        variant={user.isActive ? "warning" : "success"}
                        size="small"
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button onClick={() => handleDelete(user._id)} variant="danger" size="small">
                        Delete
                      </Button>
                    </ActionButtons>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </UsersTable>
      </Card>

      {showModal && (
        <Modal onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{editingUser ? "Edit User" : "Add New User"}</ModalTitle>
              <CloseButton onClick={closeModal}>&times;</CloseButton>
            </ModalHeader>

            <Form onSubmit={handleSubmit}>
              <Input
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />

              <div>
                <label>Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label>Modules</label>
                <CheckboxGroup>
                  {availableModules.map((module) => (
                    <CheckboxItem key={module}>
                      <input
                        type="checkbox"
                        checked={formData.modules.includes(module)}
                        onChange={() => handleModuleChange(module)}
                      />
                      {module}
                    </CheckboxItem>
                  ))}
                </CheckboxGroup>
              </div>

              <CheckboxItem>
                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} />
                Active User
              </CheckboxItem>

              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                <Button type="button" onClick={closeModal} variant="secondary">
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  {editingUser ? "Update" : "Create"} User
                </Button>
              </div>
            </Form>
          </ModalContent>
        </Modal>
      )}
    </UserManagementContainer>
  )
}

export default UserManagement
