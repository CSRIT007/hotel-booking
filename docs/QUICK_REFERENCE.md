# 🚀 Quick Reference Guide - Hotel Management System

## 📁 File Locations

### Database
- **Base Schema:** `database/database.sql`
- **Full System:** `database/hotel-management-system.sql`

### Staff Pages
- **Location:** `staff/` folder
- **Header:** `staff/header.php` (navigation)
- **Footer:** `staff/footer.php` (scripts)

### Configuration
- **Database Config:** `config/config.php`
- **Helper Functions:** `config/config.php`

---

## 🗄️ Database Tables by Module

### 1. PMS (Property Management)
```
bookings, rooms, hotels, guest_profiles, 
housekeeping_tasks, room_amenities
```

### 2. POS (Point of Sale)
```
pos_categories, pos_products, 
pos_transactions, pos_transaction_items
```

### 3. CRS (Central Reservation)
```
rate_plans, room_rates, 
distribution_channels, channel_bookings
```

### 4. CRM (Customer Relationship)
```
marketing_campaigns, guest_communications, 
loyalty_transactions
```

### 5. RMS (Revenue Management)
```
demand_forecast, pricing_rules, 
competitor_rates
```

### 6. Finance & Accounting
```
chart_of_accounts, general_ledger, 
expenses, invoices, payments
```

### 7. HR (Human Resources)
```
staff_profiles, staff_schedules, 
staff_attendance, payroll, 
performance_reviews, staff_leaves
```

### 8. Maintenance
```
maintenance_requests, maintenance_schedule, 
spare_parts_inventory
```

### 9. Security
```
access_logs, security_incidents, 
surveillance_logs
```

### 10. Analytics
```
daily_reports, guest_satisfaction
```

### 11. Reviews
```
external_reviews, review_templates
```

### 12. Mobile
```
mobile_checkins, service_requests
```

### 13. Events
```
event_spaces, event_bookings
```

### 14. Integrations
```
api_integrations, api_logs
```

### 15. Sustainability
```
energy_consumption, waste_tracking, 
sustainability_initiatives, carbon_footprint
```

### System Tables
```
users, system_settings, audit_trail, 
notifications, contacts, services, testimonials
```

---

## 🎨 Page Template

```php
<?php
require_once __DIR__ . '/../config/config.php';

// Check authentication
if (!isLoggedIn() || !isStaff()) {
    header('Location: ../login.php');
    exit;
}

$conn = getDBConnection();
$current_staff_page = 'your-page-name'; // For navigation highlighting

// Your page logic here
// ...

include __DIR__ . '/header.php';
?>

<h1 class="staff-page-title">Your Page Title</h1>
<p class="staff-page-desc">Description of what this page does.</p>

<div class="staff-dashboard-top">
    <!-- Your content here -->
    
    <!-- Example: Data table -->
    <div class="card staff-table-card">
        <div class="card-header"><strong>Your Data</strong></div>
        <div class="card-body p-0">
            <div class="table-responsive staff-table-scroll">
                <table class="table table-hover mb-0">
                    <thead class="thead-light">
                        <tr>
                            <th>Column 1</th>
                            <th>Column 2</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Your data rows -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<?php include __DIR__ . '/footer.php'; ?>
```

---

## 🔧 Common Functions (in config.php)

### Database
```php
$conn = getDBConnection();  // Get database connection
```

### Authentication
```php
isLoggedIn()           // Check if user is logged in
isStaff()              // Check if user is staff
isGuest()              // Check if user is guest
getCurrentUserId()     // Get current user ID
getCurrentUsername()   // Get current username
```

### Security
```php
htmlspecialchars($str)           // Escape HTML
$conn->real_escape_string($str)  // Escape SQL (use prepared statements instead)
```

---

## 🎨 CSS Classes Reference

### Layout
```css
.staff-main              /* Main content area */
.staff-dashboard-top     /* Top section wrapper */
.staff-page-title        /* Page title */
.staff-page-desc         /* Page description */
```

### Cards
```css
.staff-table-card        /* Card for tables */
.staff-chart-card        /* Card for charts */
.staff-summary-cards     /* Summary stat cards */
```

### Tables
```css
.staff-table-scroll      /* Scrollable table container */
.table                   /* Bootstrap table */
.thead-light             /* Light table header */
```

### Forms
```css
.staff-toolbar           /* Toolbar with filters */
.form-control            /* Form inputs */
.btn                     /* Buttons */
.btn-primary             /* Primary button */
.btn-success             /* Success button */
.btn-danger              /* Danger button */
```

### Status Badges
```css
.badge                   /* Badge base */
.badge-success           /* Green badge */
.badge-warning           /* Yellow badge */
.badge-danger            /* Red badge */
.badge-info              /* Blue badge */
.badge-secondary         /* Grey badge */
```

---

## 📊 Common SQL Patterns

### Select with Join
```sql
SELECT b.*, r.name AS room_name, h.name AS hotel_name, u.username
FROM bookings b
JOIN rooms r ON b.room_id = r.id
JOIN hotels h ON r.hotel_id = h.id
JOIN users u ON b.user_id = u.id
WHERE b.status = 'confirmed'
ORDER BY b.check_in DESC
```

### Insert with Prepared Statement
```php
$stmt = $conn->prepare("INSERT INTO table_name (col1, col2) VALUES (?, ?)");
$stmt->bind_param("ss", $value1, $value2);
$stmt->execute();
$new_id = $conn->insert_id;
$stmt->close();
```

### Update with Prepared Statement
```php
$stmt = $conn->prepare("UPDATE table_name SET col1 = ?, col2 = ? WHERE id = ?");
$stmt->bind_param("ssi", $value1, $value2, $id);
$stmt->execute();
$affected = $stmt->affected_rows;
$stmt->close();
```

### Delete with Prepared Statement
```php
$stmt = $conn->prepare("DELETE FROM table_name WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$stmt->close();
```

### Pagination
```php
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$per_page = 20;
$offset = ($page - 1) * $per_page;

$stmt = $conn->prepare("SELECT * FROM table_name LIMIT ? OFFSET ?");
$stmt->bind_param("ii", $per_page, $offset);
$stmt->execute();
$result = $stmt->get_result();
```

---

## 🎯 Common Features to Implement

### 1. Search & Filter
```php
$search = isset($_GET['q']) ? trim($_GET['q']) : '';
$where = "WHERE name LIKE ? OR email LIKE ?";
$like = '%' . $conn->real_escape_string($search) . '%';
```

### 2. Date Range Filter
```php
$from = isset($_GET['from']) ? $_GET['from'] : date('Y-m-d', strtotime('-30 days'));
$to = isset($_GET['to']) ? $_GET['to'] : date('Y-m-d');
$where = "WHERE date_column BETWEEN ? AND ?";
```

### 3. Status Filter
```php
$status = isset($_GET['status']) ? $_GET['status'] : 'all';
if ($status !== 'all') {
    $where = "WHERE status = ?";
}
```

### 4. Export to CSV
```php
header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename="export.csv"');
$output = fopen('php://output', 'w');
fputcsv($output, ['Column1', 'Column2']); // Headers
foreach ($data as $row) {
    fputcsv($output, $row);
}
fclose($output);
exit;
```

### 5. AJAX Form Submission
```javascript
$('#myForm').on('submit', function(e) {
    e.preventDefault();
    $.ajax({
        url: 'process.php',
        method: 'POST',
        data: $(this).serialize(),
        success: function(response) {
            alert('Success!');
            location.reload();
        },
        error: function() {
            alert('Error occurred');
        }
    });
});
```

---

## 🔐 Security Best Practices

### Always Use Prepared Statements
```php
// ❌ BAD - SQL Injection risk
$sql = "SELECT * FROM users WHERE id = " . $_GET['id'];

// ✅ GOOD - Safe
$stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
$stmt->bind_param("i", $_GET['id']);
```

### Validate Input
```php
// Check required fields
if (empty($_POST['name'])) {
    $errors[] = "Name is required";
}

// Validate email
if (!filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
    $errors[] = "Invalid email";
}

// Validate number
if (!is_numeric($_POST['amount']) || $_POST['amount'] < 0) {
    $errors[] = "Invalid amount";
}
```

### Escape Output
```php
// Always escape when displaying user input
echo htmlspecialchars($user_input);
```

### Check Permissions
```php
if (!isStaff()) {
    die('Access denied');
}
```

---

## 📱 Responsive Design

### Mobile-First Approach
```html
<!-- Stack on mobile, side-by-side on larger screens -->
<div class="row">
    <div class="col-12 col-md-6 col-lg-4">Column 1</div>
    <div class="col-12 col-md-6 col-lg-4">Column 2</div>
    <div class="col-12 col-md-12 col-lg-4">Column 3</div>
</div>
```

### Bootstrap Breakpoints
- `col-*` - Extra small (<576px)
- `col-sm-*` - Small (≥576px)
- `col-md-*` - Medium (≥768px)
- `col-lg-*` - Large (≥992px)
- `col-xl-*` - Extra large (≥1200px)

---

## 🎨 Chart.js Quick Reference

### Line Chart
```javascript
new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['Jan', 'Feb', 'Mar'],
        datasets: [{
            label: 'Revenue',
            data: [1000, 1500, 1200],
            borderColor: 'rgb(40, 167, 69)',
            backgroundColor: 'rgba(40, 167, 69, 0.1)'
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false
    }
});
```

### Bar Chart
```javascript
new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['Room A', 'Room B', 'Room C'],
        datasets: [{
            label: 'Bookings',
            data: [12, 19, 8],
            backgroundColor: 'rgba(13, 110, 253, 0.7)'
        }]
    }
});
```

### Doughnut Chart
```javascript
new Chart(ctx, {
    type: 'doughnut',
    data: {
        labels: ['Confirmed', 'Pending', 'Cancelled'],
        datasets: [{
            data: [45, 15, 5],
            backgroundColor: ['#28a745', '#ffc107', '#dc3545']
        }]
    }
});
```

---

## 🐛 Debugging Tips

### Enable Error Reporting
```php
// Add to top of page during development
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

### Check Database Errors
```php
if (!$stmt) {
    die("Prepare failed: " . $conn->error);
}
if (!$stmt->execute()) {
    die("Execute failed: " . $stmt->error);
}
```

### Console Log in JavaScript
```javascript
console.log('Debug info:', variable);
console.table(arrayData);
```

### SQL Query Testing
```php
// Print query for testing
echo $sql;
// Or use var_dump for arrays
var_dump($data);
```

---

## 📞 Need Help?

- **Documentation:** See `HOTEL_MANAGEMENT_SYSTEM.md`
- **Status:** Check `IMPLEMENTATION_STATUS.md`
- **Structure:** Review `PROJECT_STRUCTURE.md`
- **Database Schema:** Open `database/hotel-management-system.sql`

---

**Happy Coding!** 🚀
