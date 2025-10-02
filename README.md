# Template React App
> For making life easier

### Stack:
```
Frontend: React JS
Backend Server: Express JS
Relational DB: SQLite
NoSQL DB: LowDB
```

### What's Included
- React web app with all necessary dependencies, multiple example components, and routing.
- Ready-made UI with modern styling and functionality.
- Express server backend with example routes, authentication management (JWT/bcrypt), CSRF protection, logging, compression, header security, and rate-limiting.
- Sqlite database for example token and user credential storage.
- NoSQL (LowDB) database for storing unstructured data.
- User authentication flow using username/password.

### Setup:
1. clone this repo
> Setup frontend app
2. `cd react-app-template`
3. `npm i`
> Setup backend server .env file
5. `cd server/`
6. `npm i`
7. `touch .env`
8. Paste:
```
NODE_ENV=development
EXPRESS_PORT=4000
CSRF_SECRET=CHANGE_THIS_TO_RANDOM_SECRET
SESSION_SECRE=CHANGE_TO_SAME_AS_CSRF_SECRET
JWT_SECRET=CHANGE_THIS_TO_A_RANDOM_SECRET
```
8. `cd ../`
9. `npm run dev`
10. Navigate to http://localhost:5173/ in your browser!

### Next Steps
1. Containerize with docker/docker-compose
