import "dotenv/config";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

const bucket = "assets";
const key = "test/connection.txt";

async function testStorage() {
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: "SoulScriptly storage connection works!",
    ContentType: "text/plain",
  }));

  const result = await s3.send(new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  }));

  console.log("Storage test:", await result.Body.transformToString());
}

testStorage().catch(console.error);