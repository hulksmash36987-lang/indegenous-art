# Indigenous Art Atlas - Backend API

Simple PHP backend for the Indigenous Art Atlas project.

## Setup

1. Place all files in your web server directory
2. Make sure the `data/` folder is writable
3. Access the API endpoints via your web server

## API Endpoints

### Authentication
- POST `/api/auth.php?action=login` - Login user
- POST `/api/auth.php?action=signup` - Register new user

### Artworks
- GET `/api/artworks.php` - Get all approved artworks
- GET `/api/artworks.php?action=detail&id=1` - Get single artwork
- GET `/api/artworks.php?action=latest&limit=6` - Get latest artworks
- GET `/api/artworks.php?action=similar&id=1&limit=3` - Get similar artworks
- POST `/api/artworks.php?action=submit` - Submit new artwork

### Admin
- GET `/api/admin.php?action=stats&user_id=1` - Get dashboard stats
- GET `/api/admin.php?action=pending&user_id=1` - Get pending submissions
- POST `/api/admin.php?action=approve` - Approve submission
- POST `/api/admin.php?action=reject` - Reject submission
- DELETE `/api/admin.php?action=delete&submission_id=1&user_id=1` - Delete submission
- GET `/api/admin.php?action=users&user_id=1` - Get all users
- POST `/api/admin.php?action=update_role` - Update user role

### Categories
- GET `/api/categories.php` - Get all categories
- POST `/api/categories.php` - Add new category

## Test Credentials

Admin: username=admin, password=admin123
Artist: username=marco, password=pass123
User: username=liam, password=pass123
