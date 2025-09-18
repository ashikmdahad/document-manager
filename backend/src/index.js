const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const mime = require("mime-types");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const fs = require("fs");
const path = require("path");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const mongoUrl = process.env.MONGO_URL || "mongodb://mongo:27017/vivsoft_documents";
mongoose.connect(mongoUrl)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB connection error:", err));

// AWS S3 Configuration
const s3Client = new S3Client({
    region: process.env.AWS_REGION || "ap-southeast-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "internship-v1-bucket";

// Document Schema
const documentSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4, unique: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    s3Key: { type: String, required: true },
    s3Url: { type: String, required: true },
    uploadedBy: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    description: { type: String, default: "" },
    tags: [{ type: String }],
    isPublic: { type: Boolean, default: false },
    sharedWith: [{
        email: String,
        permission: { type: String, enum: ['read', 'write'], default: 'read' },
        sharedAt: { type: Date, default: Date.now }
    }],
    downloadCount: { type: Number, default: 0 },
    lastAccessed: { type: Date, default: Date.now }
});

const Document = mongoose.model("Document", documentSchema);

// User Schema (for document sharing)
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, default: "user" },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);

// Multer configuration for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: function (req, file, cb) {
        // Allow common document types
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'text/csv',
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/zip',
            'application/x-rar-compressed'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'), false);
        }
    }
});

// Helper function to upload file to S3
const { PutObjectCommand } = require("@aws-sdk/client-s3");

async function uploadToS3(fileBuffer, fileName, mimeType) {
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: fileBuffer,
        ContentType: mimeType,
    });

    try {
        const result = await s3Client.send(command);
        return {
            key: fileName,
            location: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "ap-southeast-1"}.amazonaws.com/${fileName}`,
            bucket: BUCKET_NAME
        };
    } catch (error) {
        throw new Error(`S3 upload failed: ${error.message}`);
    }
}

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Vivsoft Document Management API',
            version: '1.0.0',
            description: 'A comprehensive document management system with upload, sharing, and collaboration features',
        },
        servers: [
            {
                url: 'http://localhost:3001',
                description: 'Development server',
            },
        ],
        components: {
            schemas: {
                Document: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        filename: { type: 'string' },
                        originalName: { type: 'string' },
                        mimeType: { type: 'string' },
                        size: { type: 'number' },
                        s3Key: { type: 'string' },
                        s3Url: { type: 'string' },
                        uploadedBy: { type: 'string' },
                        uploadedAt: { type: 'string', format: 'date-time' },
                        description: { type: 'string' },
                        tags: { type: 'array', items: { type: 'string' } },
                        isPublic: { type: 'boolean' },
                        sharedWith: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    email: { type: 'string' },
                                    permission: { type: 'string', enum: ['read', 'write'] },
                                    sharedAt: { type: 'string', format: 'date-time' }
                                }
                            }
                        },
                        downloadCount: { type: 'number' },
                        lastAccessed: { type: 'string', format: 'date-time' }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        email: { type: 'string' },
                        role: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                }
            }
        }
    },
    apis: ['./src/index.js'], // Path to the API docs
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get API information
 *     responses:
 *       200:
 *         description: API information
 */
app.get("/", (req, res) => {
    res.json({
        message: "Vivsoft Document Management API",
        version: "1.0.0",
        endpoints: {
            documents: "/api/documents",
            users: "/api/users",
            health: "/health",
            swagger: "/api-docs"
        }
    });
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     responses:
 *       200:
 *         description: Service health status
 */
app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        s3: "configured"
    });
});

// User Management Routes

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
app.get("/api/users", async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 */
app.post("/api/users", async (req, res) => {
    try {
        const { name, email, role } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: "Name and email are required" });
        }

        const user = new User({ name, email, role });
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ error: "Email already exists" });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Document Management Routes

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Get all documents
 *     parameters:
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         description: Filter by user email
 *       - in: query
 *         name: public
 *         schema:
 *           type: boolean
 *         description: Filter public documents
 *     responses:
 *       200:
 *         description: List of documents
 */
app.get("/api/documents", async (req, res) => {
    try {
        const { user, public: isPublic } = req.query;
        let filter = {};

        if (user) {
            filter.$or = [
                { uploadedBy: user },
                { 'sharedWith.email': user },
                { isPublic: true }
            ];
        } else if (isPublic === 'true') {
            filter.isPublic = true;
        }

        const documents = await Document.find(filter).sort({ uploadedAt: -1 });
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/documents/upload:
 *   post:
 *     summary: Upload a new document
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: document
 *         type: file
 *         required: true
 *         description: The document file to upload
 *       - in: formData
 *         name: uploadedBy
 *         type: string
 *         required: true
 *         description: Email of the user uploading the document
 *       - in: formData
 *         name: description
 *         type: string
 *         description: Document description
 *       - in: formData
 *         name: tags
 *         type: string
 *         description: Comma-separated tags
 *       - in: formData
 *         name: isPublic
 *         type: boolean
 *         description: Whether the document is public
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 */
app.post("/api/documents/upload", upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const { uploadedBy, description, tags, isPublic } = req.body;

        if (!uploadedBy) {
            return res.status(400).json({ error: "uploadedBy is required" });
        }

        // Generate unique filename
        const fileExtension = mime.extension(req.file.mimetype) || 'bin';
        const fileName = `documents/${Date.now()}-${uuidv4()}.${fileExtension}`;

        // Upload to S3
        const s3Result = await uploadToS3(req.file.buffer, fileName, req.file.mimetype);

        const document = new Document({
            filename: fileName.split('/').pop(),
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            s3Key: s3Result.key,
            s3Url: s3Result.location,
            uploadedBy,
            description: description || "",
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            isPublic: isPublic === 'true'
        });

        await document.save();
        res.status(201).json(document);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: Get document by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document details
 */
app.get("/api/documents/:id", async (req, res) => {
    try {
        const document = await Document.findOne({ id: req.params.id });
        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        // Update last accessed
        document.lastAccessed = new Date();
        await document.save();

        res.json(document);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/documents/{id}/download:
 *   get:
 *     summary: Download document
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document download URL
 */
app.get("/api/documents/:id/download", async (req, res) => {
    try {
        const document = await Document.findOne({ id: req.params.id });
        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        // Generate signed URL for download using AWS SDK v3
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: document.s3Key,
            ResponseContentDisposition: `attachment; filename="${document.originalName}"`
        });

        const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        // Update download count
        document.downloadCount += 1;
        document.lastAccessed = new Date();
        await document.save();

        res.json({ downloadUrl, filename: document.originalName });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/documents/{id}/share:
 *   post:
 *     summary: Share document with users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emails:
 *                 type: array
 *                 items:
 *                   type: string
 *               permission:
 *                 type: string
 *                 enum: [read, write]
 *     responses:
 *       200:
 *         description: Document shared successfully
 */
app.post("/api/documents/:id/share", async (req, res) => {
    try {
        const { emails, permission = 'read' } = req.body;

        if (!emails || !Array.isArray(emails)) {
            return res.status(400).json({ error: "emails array is required" });
        }

        const document = await Document.findOne({ id: req.params.id });
        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        // Add new shares
        emails.forEach(email => {
            const existingShare = document.sharedWith.find(share => share.email === email);
            if (!existingShare) {
                document.sharedWith.push({ email, permission });
            }
        });

        await document.save();
        res.json({ message: "Document shared successfully", document });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     summary: Delete document
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document deleted successfully
 */
app.delete("/api/documents/:id", async (req, res) => {
    try {
        const document = await Document.findOne({ id: req.params.id });
        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        // Delete from S3 using AWS SDK v3
        const deleteCommand = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: document.s3Key
        });

        await s3Client.send(deleteCommand);

        // Delete from database
        await Document.deleteOne({ id: req.params.id });

        res.json({ message: "Document deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
        }
    }
    res.status(500).json({ error: "Something went wrong!" });
});

// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Document Management API running on port ${PORT}`);
    console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});

module.exports = app;
