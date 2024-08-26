const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const path = require('path');
const fs = require('fs');

const s3 = new S3Client({ region: process.env.AWS_REGION });
const ssm = new SSMClient({ region: process.env.AWS_REGION });

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single('attachment');

async function getParameter(parameterName) {
    const command = new GetParameterCommand({ Name: parameterName, WithDecryption: true });
    const response = await ssm.send(command);
    return response.Parameter.Value;
}

exports.submitForm = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(500).send('Error uploading file.');
        }

        try {
            const dbUsername = await getParameter(process.env.DB_USERNAME_PARAMETER);
            const dbPassword = await getParameter(process.env.DB_PASSWORD_PARAMETER);
            const dbHost = await getParameter(process.env.DB_HOST_PARAMETER);
            const dbName = await getParameter(process.env.DB_NAME_PARAMETER);

            const params = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: `uploads/${Date.now()}_${req.file.originalname}`,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
                ACL: 'public-read',
            };

            await s3.send(new PutObjectCommand(params));

            // Connect to the database using dbUsername, dbPassword, dbHost, and dbName
            // (database connection code goes here)

            res.send('Form submitted successfully.');
        } catch (error) {
            console.error(error);
            res.status(500).send('Error processing form.');
        }
    });
};
