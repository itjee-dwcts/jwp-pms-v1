import { gql, useMutation, useQuery } from '@apollo/client';
import { Add, Delete, Edit, Search, Visibility } from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// GraphQL query to fetch users with pagination and search
const GET_USERS = gql`
  query GetUsers($page: Int, $perPage: Int, $search: String) {
    users(page: $page, perPage: $perPage, search: $search) {
      items {
        id
        name
        email
        role
        status
        avatarUrl
        createdAt
      }
      total
    }
  }
`;

// GraphQL mutation to delete a user
const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id) {
      id
    }
  }
`;

// Type definitions
interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  avatarUrl?: string;
  createdAt: string;
}

interface UsersData {
  users: {
    items: User[];
    total: number;
  };
}

const Users: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const { data, loading, error, refetch } = useQuery<UsersData>(GET_USERS, {
    variables: { page: page + 1, perPage: rowsPerPage, search: searchTerm },
    fetchPolicy: 'network-only', // Ensures we get the latest data
  });

  const [deleteUser] = useMutation(DELETE_USER, {
    onCompleted: () => {
      refetch(); // Refetch users after deletion
    },
    onError: (err) => {
      alert(`Error deleting user: ${err.message}`);
    },
  });

  const handleDelete = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUser({ variables: { id: userId } });
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const getRoleChipColor = (role: string) => {
    if (role === 'ADMIN') return 'secondary';
    if (role === 'MANAGER') return 'primary';
    return 'default';
  };

  const getStatusChipColor = (status: string) => {
    if (status === 'ACTIVE') return 'success';
    if (status === 'PENDING') return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>User Management</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/users/new')}>New User</Button>
      </Box>
      <Card>
        <Box sx={{ p: 2 }}>
          <TextField fullWidth placeholder="Search users..." value={searchTerm} onChange={handleSearchChange} InputProps={{ startAdornment: (<InputAdornment position="start"><Search /></InputAdornment>), }} />
        </Box>
        {loading && <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}
        {error && <Alert severity="error" sx={{ m: 2 }}>Failed to load users: {error.message}</Alert>}
        {!loading && !error && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.users.items.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar src={user.avatarUrl} sx={{ mr: 2 }}>{user.name.charAt(0)}</Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight="bold">{user.name}</Typography>
                          <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell><Chip label={user.role} size="small" color={getRoleChipColor(user.role)} /></TableCell>
                    <TableCell><Chip label={user.status} size="small" color={getStatusChipColor(user.status)} /></TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <IconButton component={Link} to={`/users/${user.id}`} size="small"><Visibility /></IconButton>
                      <IconButton component={Link} to={`/users/edit/${user.id}`} size="small"><Edit /></IconButton>
                      <IconButton onClick={() => handleDelete(user.id)} size="small" color="error"><Delete /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <TablePagination component="div" count={data?.users.total || 0} page={page} onPageChange={handleChangePage} rowsPerPage={rowsPerPage} onRowsPerPageChange={handleChangeRowsPerPage} rowsPerPageOptions={[5, 10, 25]} />
      </Card>
    </Box>
  );
};

export default Users;
