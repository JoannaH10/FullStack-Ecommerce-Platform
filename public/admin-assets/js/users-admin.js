document.addEventListener('DOMContentLoaded', function() {
    // User Search Functionality
    const userSearchInput = document.querySelector('#users .search-bar');
    if (userSearchInput) {
        userSearchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('#users .data-table tbody tr');

            rows.forEach(row => {
                const name = row.querySelector('td:first-child p').textContent.toLowerCase();
                const email = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
                const phone = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
                const role = row.querySelector('td:nth-child(4)').textContent.toLowerCase();
                const status = row.querySelector('td:nth-child(5) span').textContent.toLowerCase();

                if (name.includes(searchTerm) ||
                    email.includes(searchTerm) ||
                    phone.includes(searchTerm) ||
                    role.includes(searchTerm) ||
                    status.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }

    // User Delete Functionality
    document.addEventListener('click', function(e) {
        if (e.target.closest('.delete-btn')) {
            const button = e.target.closest('.delete-btn');
            const userId = button.getAttribute('data-user-id');
            const userRow = document.getElementById(`user-${userId}`);

            if (confirm('Are you sure you want to delete this user?')) {
                fetch(`/api/s1/users/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    if (!response.ok) {
                        // Attempt to parse JSON error message if available
                        return response.json().then(errorData => {
                            throw new Error(errorData.message || 'Delete failed');
                        });
                    }
                    return response.json();
                })
                .then(() => {
                    userRow.remove();
                    alert('User deleted successfully!');
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert(`Error deleting user: ${error.message}`);
                });
            }
        }
    });

    // User Edit Functionality
    const editModal = document.getElementById('editUserModal');
    const closeModal = editModal.querySelector('.close-modal');
    const editForm = document.getElementById('editUserForm');

    // Event listener for opening the edit modal
    document.addEventListener('click', function(e) {
        if (e.target.closest('.edit-btn')) {
            const button = e.target.closest('.edit-btn');
            const row = button.closest('tr');
            const userId = row.id.split('-')[1];

            // Get user data from the row
            const name = row.querySelector('td:first-child p').textContent;
            const email = row.querySelector('td:nth-child(2)').textContent;
            const phone = row.querySelector('td:nth-child(3)').textContent;
            const role = row.querySelector('td:nth-child(4)').textContent.toLowerCase();
            const status = row.querySelector('td:nth-child(5) span').textContent.toLowerCase();

            // Populate the modal form
            document.getElementById('editUserId').value = userId;
            document.getElementById('editName').value = name;
            document.getElementById('editEmail').value = email;
            document.getElementById('editPhone').value = phone;
            document.getElementById('editRole').value = role;
            document.getElementById('editStatus').value = status;

            // Show the modal
            editModal.style.display = 'block';
        }
    });

    // Close modal when clicking X
    closeModal.addEventListener('click', function() {
        editModal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === editModal) {
            editModal.style.display = 'none';
        }
    });

    // Handle form submission for editing user
    editForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = {
            id: document.getElementById('editUserId').value,
            name: document.getElementById('editName').value,
            email: document.getElementById('editEmail').value,
            phone: document.getElementById('editPhone').value,
            role: document.getElementById('editRole').value,
            status: document.getElementById('editStatus').value
        };

        try {
            const res = await fetch('/api/s1/users/update', {
                method: 'PUT', // Use PUT for updates as per REST conventions
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update user');
            }

            const data = await res.json();

            // Update the row in the table
            const row = document.getElementById(`user-${formData.id}`);
            if (row) {
                row.querySelector('td:first-child p').textContent = formData.name;
                row.querySelector('td:nth-child(2)').textContent = formData.email;
                row.querySelector('td:nth-child(3)').textContent = formData.phone;
                row.querySelector('td:nth-child(4)').textContent = formData.role.charAt(0).toUpperCase() + formData.role.slice(1);

                const statusSpan = row.querySelector('td:nth-child(5) span');
                statusSpan.textContent = formData.status.charAt(0).toUpperCase() + formData.status.slice(1);
                statusSpan.className = 'status ' + formData.status;
            }

            // Close the modal
            editModal.style.display = 'none';

            // Show success message
            alert('User updated successfully!');
        } catch (error) {
            console.error('Error:', error);
            alert(`Error updating user: ${error.message}`);
        }
    });
});