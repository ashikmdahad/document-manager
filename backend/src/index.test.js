const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('./index');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    // Clear all collections before each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
});

describe('API Endpoints', () => {
    describe('GET /', () => {
        it('should return API information', async () => {
            const res = await request(app).get('/');
            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Vivsoft Internship API Running');
            expect(res.body.version).toBe('1.0.0');
            expect(res.body.endpoints).toBeDefined();
        });
    });

    describe('GET /health', () => {
        it('should return health status', async () => {
            const res = await request(app).get('/health');
            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('healthy');
            expect(res.body.timestamp).toBeDefined();
            expect(res.body.database).toBe('connected');
        });
    });

    describe('User API', () => {
        describe('POST /api/users', () => {
            it('should create a new user', async () => {
                const userData = {
                    name: 'John Doe',
                    email: 'john@example.com',
                    role: 'intern'
                };

                const res = await request(app)
                    .post('/api/users')
                    .send(userData);

                expect(res.statusCode).toBe(201);
                expect(res.body.name).toBe(userData.name);
                expect(res.body.email).toBe(userData.email);
                expect(res.body.role).toBe(userData.role);
                expect(res.body._id).toBeDefined();
                expect(res.body.createdAt).toBeDefined();
            });

            it('should create user with default role', async () => {
                const userData = {
                    name: 'Jane Doe',
                    email: 'jane@example.com'
                };

                const res = await request(app)
                    .post('/api/users')
                    .send(userData);

                expect(res.statusCode).toBe(201);
                expect(res.body.role).toBe('intern');
            });

            it('should return error for missing required fields', async () => {
                const userData = {
                    name: 'John Doe'
                    // missing email
                };

                const res = await request(app)
                    .post('/api/users')
                    .send(userData);

                expect(res.statusCode).toBe(400);
                expect(res.body.error).toBe('Name and email are required');
            });

            it('should return error for duplicate email', async () => {
                const userData = {
                    name: 'John Doe',
                    email: 'john@example.com'
                };

                // Create first user
                await request(app)
                    .post('/api/users')
                    .send(userData);

                // Try to create second user with same email
                const res = await request(app)
                    .post('/api/users')
                    .send(userData);

                expect(res.statusCode).toBe(400);
                expect(res.body.error).toBe('Email already exists');
            });
        });

        describe('GET /api/users', () => {
            it('should return empty array when no users exist', async () => {
                const res = await request(app).get('/api/users');
                expect(res.statusCode).toBe(200);
                expect(res.body).toEqual([]);
            });

            it('should return all users', async () => {
                // Create test users
                const users = [
                    { name: 'John Doe', email: 'john@example.com' },
                    { name: 'Jane Doe', email: 'jane@example.com' }
                ];

                for (const user of users) {
                    await request(app)
                        .post('/api/users')
                        .send(user);
                }

                const res = await request(app).get('/api/users');
                expect(res.statusCode).toBe(200);
                expect(res.body).toHaveLength(2);
                expect(res.body[0].name).toBe('Jane Doe'); // Should be sorted by createdAt desc
                expect(res.body[1].name).toBe('John Doe');
            });
        });

        describe('GET /api/users/:id', () => {
            it('should return user by id', async () => {
                const userData = {
                    name: 'John Doe',
                    email: 'john@example.com'
                };

                const createRes = await request(app)
                    .post('/api/users')
                    .send(userData);

                const userId = createRes.body._id;

                const res = await request(app).get(`/api/users/${userId}`);
                expect(res.statusCode).toBe(200);
                expect(res.body.name).toBe(userData.name);
                expect(res.body.email).toBe(userData.email);
            });

            it('should return 404 for non-existent user', async () => {
                const fakeId = new mongoose.Types.ObjectId();
                const res = await request(app).get(`/api/users/${fakeId}`);
                expect(res.statusCode).toBe(404);
                expect(res.body.error).toBe('User not found');
            });
        });

        describe('PUT /api/users/:id', () => {
            it('should update user', async () => {
                const userData = {
                    name: 'John Doe',
                    email: 'john@example.com'
                };

                const createRes = await request(app)
                    .post('/api/users')
                    .send(userData);

                const userId = createRes.body._id;
                const updateData = {
                    name: 'John Smith',
                    email: 'johnsmith@example.com',
                    role: 'senior'
                };

                const res = await request(app)
                    .put(`/api/users/${userId}`)
                    .send(updateData);

                expect(res.statusCode).toBe(200);
                expect(res.body.name).toBe(updateData.name);
                expect(res.body.email).toBe(updateData.email);
                expect(res.body.role).toBe(updateData.role);
            });

            it('should return 404 for non-existent user', async () => {
                const fakeId = new mongoose.Types.ObjectId();
                const updateData = { name: 'John Smith' };

                const res = await request(app)
                    .put(`/api/users/${fakeId}`)
                    .send(updateData);

                expect(res.statusCode).toBe(404);
                expect(res.body.error).toBe('User not found');
            });
        });

        describe('DELETE /api/users/:id', () => {
            it('should delete user', async () => {
                const userData = {
                    name: 'John Doe',
                    email: 'john@example.com'
                };

                const createRes = await request(app)
                    .post('/api/users')
                    .send(userData);

                const userId = createRes.body._id;

                const res = await request(app).delete(`/api/users/${userId}`);
                expect(res.statusCode).toBe(200);
                expect(res.body.message).toBe('User deleted successfully');

                // Verify user is deleted
                const getRes = await request(app).get(`/api/users/${userId}`);
                expect(getRes.statusCode).toBe(404);
            });

            it('should return 404 for non-existent user', async () => {
                const fakeId = new mongoose.Types.ObjectId();
                const res = await request(app).delete(`/api/users/${fakeId}`);
                expect(res.statusCode).toBe(404);
                expect(res.body.error).toBe('User not found');
            });
        });
    });

    describe('404 handler', () => {
        it('should return 404 for non-existent routes', async () => {
            const res = await request(app).get('/non-existent-route');
            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe('Route not found');
        });
    });
});
