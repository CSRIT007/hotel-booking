# 🏨 Property Management System - Complete Logic & Auto-Updates

## Overview

The PMS module now has **full CRUD functionality** with **automatic cascading updates** across related tables. When you change one thing, related data automatically updates.

---

## 📊 System Architecture

### Database Tables (Related)
```
users (guests & staff)
  ↓
guest_profiles (extended guest info)
  ↓
bookings (reservations)
  ↓
rooms (room inventory)
  ↓
housekeeping_tasks (cleaning schedule)
  ↓
loyalty_transactions (points history)
  ↓
notifications (guest alerts)
```

---

## 🔄 Automatic Update Logic

### 1. **Booking Status Changes** → Multiple Auto-Updates

#### When Booking Status = "Confirmed"
```
✅ Booking status updated to "confirmed"
  ↓
✅ Room status → "booked"
  ↓
✅ Notification sent to guest: "Your booking has been confirmed!"
```

#### When Booking Status = "Cancelled"
```
✅ Booking status updated to "cancelled"
  ↓
✅ Room status → "available"
  ↓
✅ Housekeeping task created → "cleaning" (medium priority, today)
  ↓
✅ Notification sent to guest: "Your booking has been cancelled."
```

#### When Booking Status = "Completed"
```
✅ Booking status updated to "completed"
  ↓
✅ Room status → "booked" (until checkout)
  ↓
✅ Loyalty points earned (if configured)
  ↓
✅ Notification sent to guest: "Thank you for staying with us!"
```

---

### 2. **Housekeeping Task Updates** → Room Status Changes

#### When Task Status = "In Progress"
```
✅ Task status → "in_progress"
  ↓
✅ Room status → "maintenance"
```

#### When Task Status = "Completed"
```
✅ Task status → "completed"
  ↓
✅ Completed timestamp recorded
  ↓
✅ Room status → "available"
```

---

### 3. **Guest Profile Updates** → Automatic Creation

#### When Guest Registers
```
✅ User account created (users table)
  ↓
✅ Guest profile auto-created (guest_profiles table)
  ↓
✅ Initial loyalty points = 0
  ↓
✅ VIP status = "regular"
```

#### When Profile Updated
```
✅ Profile fields updated (phone, address, etc.)
  ↓
✅ Updated timestamp recorded
  ↓
✅ Changes reflected across all bookings
```

---

### 4. **Loyalty Points Management** → Transaction Logging

#### When Points Earned
```
✅ Points added to guest_profiles.loyalty_points
  ↓
✅ Transaction logged in loyalty_transactions (type: "earn")
  ↓
✅ Description recorded (e.g., "Booking reward")
```

#### When Points Redeemed
```
✅ Points deducted from guest_profiles.loyalty_points
  ↓
✅ Transaction logged in loyalty_transactions (type: "redeem")
  ↓
✅ Description recorded (e.g., "Redeemed for upgrade")
```

#### When Manual Adjustment
```
✅ Points adjusted (+ or -)
  ↓
✅ Transaction logged in loyalty_transactions (type: "adjustment")
  ↓
✅ Staff notes recorded
```

---

### 5. **VIP Status Updates** → Automatic Benefits

#### When VIP Status Changed
```
✅ VIP status updated in guest_profiles
  ↓
✅ Affects future booking priorities
  ↓
✅ May trigger special offers/campaigns (CRM module)
```

---

## 📋 Page Features

### 1. **pms-bookings.php** - Booking Management

**Features:**
- ✅ View all bookings with filters (status, date range, search)
- ✅ Update booking status (dropdown)
- ✅ Delete bookings
- ✅ Statistics dashboard (total, pending, confirmed, revenue)
- ✅ Real-time AJAX updates

**Auto-Updates:**
- Changes booking status → Updates room status
- Changes booking status → Creates housekeeping tasks
- Changes booking status → Sends guest notifications
- Deletes booking → Sets room to available

**Database Operations:**
```sql
-- Update booking status
UPDATE bookings SET status = ? WHERE id = ?

-- Update room status
UPDATE rooms SET status = 'booked' WHERE id = ?

-- Create housekeeping task
INSERT INTO housekeeping_tasks (room_id, task_type, ...) VALUES (?, ?, ...)

-- Create notification
INSERT INTO notifications (user_id, booking_id, type, message) VALUES (?, ?, ?, ?)
```

---

### 2. **pms-guests.php** - Guest Management

**Features:**
- ✅ View all guest profiles with filters (VIP status, search)
- ✅ Edit guest profiles (modal form)
- ✅ Manage loyalty points (earn, redeem, adjust)
- ✅ View booking history per guest
- ✅ VIP status badges (Platinum, Gold, Silver, Regular)
- ✅ Statistics dashboard

**Auto-Updates:**
- Creates profile → Auto-creates guest_profiles entry
- Updates profile → Updates timestamp
- Loyalty changes → Logs transaction
- VIP upgrade → Affects all future bookings

**Database Operations:**
```sql
-- Create or update profile
INSERT INTO guest_profiles (...) VALUES (...)
ON DUPLICATE KEY UPDATE ...

-- Update loyalty points
UPDATE guest_profiles SET loyalty_points = ? WHERE user_id = ?

-- Log loyalty transaction
INSERT INTO loyalty_transactions (guest_id, transaction_type, points, description) 
VALUES (?, ?, ?, ?)
```

---

### 3. **pms-housekeeping.php** - Housekeeping Management

**Features:**
- ✅ Daily task schedule with filters (date, status, type)
- ✅ Create new tasks (modal form)
- ✅ Assign tasks to staff
- ✅ Update task status (dropdown)
- ✅ Delete tasks
- ✅ Priority system (urgent, high, medium, low)
- ✅ Statistics dashboard

**Auto-Updates:**
- Creates task → May set room to "maintenance"
- Completes task → Sets room to "available"
- Assigns task → Changes status to "in_progress"
- Cancels task → Room status unchanged

**Database Operations:**
```sql
-- Create task
INSERT INTO housekeeping_tasks (room_id, task_type, priority, ...) 
VALUES (?, ?, ?, ...)

-- Update task status
UPDATE housekeeping_tasks SET status = ?, completed_at = ? WHERE id = ?

-- Update room status
UPDATE rooms SET status = 'available' WHERE id = ?

-- Assign task
UPDATE housekeeping_tasks SET assigned_to = ?, status = 'in_progress' WHERE id = ?
```

---

## 🔗 Integration Points

### With Other Modules

#### CRS (Central Reservation System)
- Bookings created through CRS → Auto-update PMS
- Rate changes → Affect booking prices

#### Finance Module
- Completed bookings → Generate invoices
- Booking revenue → Update financial reports

#### CRM Module
- Guest profiles → Marketing campaigns
- VIP status → Targeted promotions
- Loyalty points → Rewards programs

#### HR Module
- Housekeeping staff → Task assignments
- Staff schedules → Task availability

#### Maintenance Module
- Maintenance tasks → Block rooms
- Completed maintenance → Room available

---

## 📊 Data Flow Example

### Complete Booking Lifecycle

```
1. Guest makes booking (via website or staff)
   ↓
2. Booking created (status: "pending")
   ↓
3. Staff confirms booking
   ↓
4. AUTO: Room status → "booked"
   AUTO: Notification sent to guest
   ↓
5. Guest checks in
   ↓
6. AUTO: Housekeeping task created for checkout day
   ↓
7. Guest checks out
   ↓
8. Staff marks booking as "completed"
   ↓
9. AUTO: Loyalty points added to guest profile
   AUTO: Transaction logged
   AUTO: Thank you notification sent
   ↓
10. Housekeeping completes cleaning
   ↓
11. AUTO: Room status → "available"
   ↓
12. Room ready for next booking
```

---

## 🛠️ Technical Implementation

### AJAX Requests
All updates use AJAX for smooth UX:
```javascript
$.ajax({
    url: 'pms-bookings.php',
    method: 'POST',
    data: { action: 'update_status', booking_id: 123, status: 'confirmed' },
    dataType: 'json',
    success: function(response) {
        if (response.success) {
            location.reload(); // Refresh to show updates
        }
    }
});
```

### Database Transactions
Critical operations use transactions:
```php
$conn->begin_transaction();
try {
    // Update booking
    // Update room
    // Create notification
    $conn->commit();
} catch (Exception $e) {
    $conn->rollback();
}
```

### Foreign Keys
Ensure data integrity:
```sql
FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
```

---

## 🎯 Benefits

### For Staff
- ✅ One action updates everything
- ✅ No manual data entry in multiple places
- ✅ Reduced errors
- ✅ Faster operations

### For Guests
- ✅ Automatic notifications
- ✅ Loyalty points tracked automatically
- ✅ Consistent experience

### For Management
- ✅ Real-time statistics
- ✅ Accurate reporting
- ✅ Audit trail of all changes
- ✅ Data integrity maintained

---

## 📝 Future Enhancements

### Planned Features
- [ ] Booking calendar view (drag & drop)
- [ ] Automated check-in/check-out
- [ ] Room assignment optimization
- [ ] Housekeeping mobile app
- [ ] Guest preferences auto-application
- [ ] Predictive maintenance scheduling
- [ ] AI-powered room recommendations

---

## 🔐 Security

### Access Control
- ✅ Staff authentication required
- ✅ Role-based permissions (coming soon)
- ✅ Audit trail of all changes
- ✅ SQL injection prevention (prepared statements)
- ✅ XSS protection (htmlspecialchars)

---

## 📞 Support

For questions about the PMS system:
1. Check this documentation
2. Review the code comments
3. Test in development environment first
4. Use the template files as reference

---

**The PMS system is now fully functional with automatic cascading updates!** 🎉

Every change triggers the appropriate related updates, ensuring data consistency across the entire hotel management system.
