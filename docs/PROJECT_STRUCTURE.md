# 📁 Project Structure

This document describes the clean, organized folder structure of the Hotel Booking System.

```
hotel-booking/
│
├── 📄 index.php              # Home page (main entry point)
├── 📄 login.php              # User login page
├── 📄 register.php           # User registration page
├── 📄 logout.php             # Logout handler
├── 📄 rooms.php              # Room listings page
├── 📄 room-single.php        # Single room detail & booking
├── 📄 about.php              # About us page
├── 📄 services.php           # Services page
├── 📄 contact.php            # Contact form page
├── 📄 setup.php              # Database setup & test script
│
├── 📁 config/                # Configuration files
│   └── config.php            # Database configuration & helper functions
│
├── 📁 database/              # Database files
│   └── database.sql         # Database schema & sample data
│
├── 📁 includes/              # Reusable PHP components
│   ├── header.php           # Common header (navigation, etc.)
│   └── footer.php           # Common footer
│
├── 📁 css/                   # Stylesheets
│   ├── style.css            # Main stylesheet
│   ├── bootstrap.min.css    # Bootstrap framework
│   └── ...                  # Other CSS files
│
├── 📁 js/                    # JavaScript files
│   ├── main.js              # Main JavaScript
│   ├── jquery.min.js        # jQuery library
│   └── ...                  # Other JS files
│
├── 📁 images/                # Image assets
│   ├── room-*.jpg           # Room images
│   ├── person_*.jpg         # Testimonial images
│   └── ...                  # Other images
│
├── 📁 fonts/                 # Font files
│   └── flaticon/            # Flaticon font package
│
├── 📁 scss/                  # SCSS source files (for development)
│   └── style.scss           # Main SCSS file
│
├── 📄 README.md             # Project documentation
├── 📄 QUICK_START.md        # Quick start guide
└── 📄 PROJECT_STRUCTURE.md  # This file
```

## 📋 Folder Purposes

### Root PHP Files
All main PHP pages are kept in the root directory to maintain clean URLs:
- `http://localhost/hotel-booking/login.php` ✅
- Not: `http://localhost/hotel-booking/pages/login.php` ❌

### config/
Contains all configuration files:
- Database connection settings
- Helper functions
- Session management

### database/
Contains database-related files:
- SQL schema files
- Database migration scripts (if any)

### includes/
Reusable PHP components:
- Header with navigation
- Footer with common elements
- Can be extended with more components

### Assets Folders
- `css/` - All stylesheets
- `js/` - All JavaScript files
- `images/` - All image assets
- `fonts/` - Font files
- `scss/` - Source SCSS files (optional, for development)

## 🔗 File Dependencies

### Config Path
All PHP files use:
```php
require_once 'config/config.php';
```

### Includes Path
Header and footer use:
```php
include 'includes/header.php';
include 'includes/footer.php';
```

## 📝 Notes

- **URLs remain clean**: All pages accessible directly from root
- **Organized structure**: Related files grouped in folders
- **Easy maintenance**: Clear separation of concerns
- **Scalable**: Easy to add new features and files

## 🚀 Adding New Files

### Adding a New Page
1. Create PHP file in root: `newpage.php`
2. Add to navigation in `includes/header.php`
3. Use `require_once 'config/config.php';` at top

### Adding a New Component
1. Create file in `includes/`: `includes/newcomponent.php`
2. Include where needed: `include 'includes/newcomponent.php';`

### Adding Database Changes
1. Create SQL file in `database/`: `database/migration_001.sql`
2. Document in README or migration log

---

**Last Updated**: January 2026
