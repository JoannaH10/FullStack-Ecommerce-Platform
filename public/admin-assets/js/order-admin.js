
    // Global variables
    let currentPage = 1;
    const ordersPerPage = 10;
    let totalOrders = 0;
    let allOrders = [];

    // DOM elements
    const ordersTableBody = document.getElementById('ordersTableBody');
    const resultsInfo = document.getElementById('resultsInfo');
    const paginationContainer = document.getElementById('pagination');
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const applyFilters = document.getElementById('applyFilters');
    const editOrderModal = document.getElementById('editOrderModal');
    const closeModal = document.querySelector('.close');
    const editOrderForm = document.getElementById('editOrderForm');

    // Initialize the page
    document.addEventListener('DOMContentLoaded', () => {
        fetchOrders();
        
        // Event listeners
        applyFilters.addEventListener('click', () => {
            currentPage = 1;
            fetchOrders();
        });
        
        closeModal.addEventListener('click', () => {
            editOrderModal.style.display = 'none';
        });
        
        editOrderForm.addEventListener('submit', handleEditSubmit);
    });

    // Fetch orders from the server
    async function fetchOrders() {
        const searchTerm = searchInput.value.trim();
        const status = statusFilter.value;
        
        try {
            const response = await fetch(`/api/orders?page=${currentPage}&limit=${ordersPerPage}&search=${searchTerm}&status=${status}`);
            const data = await response.json();
            
            if (response.ok) {
                allOrders = data.orders;
                totalOrders = data.totalCount;
                renderOrders();
                renderPagination();
            } else {
                throw new Error(data.message || 'Failed to fetch orders');
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            ordersTableBody.innerHTML = `<tr><td colspan="6" class="error">${error.message}</td></tr>`;
        }
    }

    // Render orders in the table
    function renderOrders() {
        if (allOrders.length === 0) {
            ordersTableBody.innerHTML = `<tr><td colspan="6">No orders found</td></tr>`;
            resultsInfo.textContent = `Showing 0 results`;
            return;
        }
        
        ordersTableBody.innerHTML = '';
        
        allOrders.forEach(order => {
            const date = new Date(order.dateOrdered).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#ORDER-${order._id.toString().substring(18, 24)}</td>
                <td>${date}</td>
                <td>
                    <div class="customer-info">
                        <img src="${order.user.profileImage || 'https://randomuser.me/api/portraits/lego/1.jpg'}" alt="User">
                        <span>${order.user.name}</span>
                    </div>
                </td>
                <td>${order.currency} ${order.total.toFixed(2)}</td>
                <td><span class="status ${order.orderStatus}">${order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}</span></td>
                <td>
                    <button class="view-btn" onclick="viewOrder('${order._id}')"><i class="fas fa-eye"></i></button>
                    <button class="edit-btn" onclick="openEditModal('${order._id}')"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" onclick="deleteOrder('${order._id}')"><i class="fas fa-trash"></i></button>
                </td>
            `;
            ordersTableBody.appendChild(tr);
        });
        
        const start = (currentPage - 1) * ordersPerPage + 1;
        const end = Math.min(currentPage * ordersPerPage, totalOrders);
        resultsInfo.textContent = `Showing ${start} to ${end} of ${totalOrders} results`;
    }

    // Render pagination controls
    function renderPagination() {
        const totalPages = Math.ceil(totalOrders / ordersPerPage);
        paginationContainer.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.textContent = 'Previous';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                fetchOrders();
            }
        });
        paginationContainer.appendChild(prevBtn);
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = currentPage === i ? 'active' : '';
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                fetchOrders();
            });
            paginationContainer.appendChild(pageBtn);
        }
        
        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Next';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                fetchOrders();
            }
        });
        paginationContainer.appendChild(nextBtn);
    }

    // Open edit modal
    function openEditModal(orderId) {
        const order = allOrders.find(o => o._id === orderId);
        if (!order) return;
        
        document.getElementById('editOrderId').value = order._id;
        document.getElementById('editOrderStatus').value = order.orderStatus;
        document.getElementById('editCustomerName').value = order.user.name;
        document.getElementById('editTotalAmount').value = order.total;
        
        // Format shipping address
        const shippingAddress = order.shippingAddress;
        const address = `${shippingAddress.address}\n${shippingAddress.city}, ${shippingAddress.postalCode}\n${shippingAddress.country}`;
        document.getElementById('editShippingAddress').value = address;
        
        editOrderModal.style.display = 'block';
    }

    // Handle edit form submission
    async function handleEditSubmit(e) {
        e.preventDefault();
        
        const orderId = document.getElementById('editOrderId').value;
        const status = document.getElementById('editOrderStatus').value;
        
        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ orderStatus: status })
            });
            
            if (response.ok) {
                alert('Order updated successfully!');
                editOrderModal.style.display = 'none';
                fetchOrders();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update order');
            }
        } catch (error) {
            console.error('Error updating order:', error);
            alert(`Error: ${error.message}`);
        }
    }

    // Delete an order
    async function deleteOrder(orderId) {
        if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                alert('Order deleted successfully!');
                fetchOrders();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete order');
            }
        } catch (error) {
            console.error('Error deleting order:', error);
            alert(`Error: ${error.message}`);
        }
    }

    // View order details (placeholder)
    function viewOrder(orderId) {
        // Implement your view order functionality
        window.location.href = `/orders/${orderId}`;
    }
