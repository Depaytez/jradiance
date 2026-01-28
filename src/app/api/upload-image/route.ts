import { NextRequest, NextResponse } from "next/server";
import FTP from "ftp";
import { Readable } from "stream";

/**
 * Image upload API endpoint
 * Handles image uploads to Namecheap Stellar hosting via FTP
 *
 * Environment Variables Required:
 * - NAMECHEAP_FTP_HOST: FTP server hostname
 * - NAMECHEAP_FTP_USER: FTP username
 * - NAMECHEAP_FTP_PASSWORD: FTP password
 * - NAMECHEAP_IMAGE_URL: Base URL for accessing uploaded images
 *
 * Example: https://yourdomain.com/images/
 */

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed",
        },
        { status: 400 },
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 },
      );
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `img_${timestamp}_${random}.${extension}`;

    // Upload to Namecheap Stellar hosting
    const imageUrl = await uploadToNamecheap(uint8Array, filename);

    return NextResponse.json({
      success: true,
      url: imageUrl,
      filename: filename,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 },
    );
  }
}

/**
 * Upload image to Namecheap Stellar hosting via FTP
 * Uses node-ftp library (install: npm install ftp)
 */
async function uploadToNamecheap(
  fileBuffer: Uint8Array,
  filename: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const c = new FTP();

    const config = {
      host: process.env.NAMECHEAP_FTP_HOST || "ftp.stellar.hosting",
      user: process.env.NAMECHEAP_FTP_USER,
      password: process.env.NAMECHEAP_FTP_PASSWORD,
    };

    c.on("ready", () => {
      // Change to images directory (create /public/images if it doesn't exist)
      c.cwd("/public/images", (err: Error | undefined) => {
        if (err) {
          // Try to create directory if it doesn't exist
          c.mkdir("/public/images", (mkErr: Error | undefined) => {
            if (mkErr) {
              c.end();
              reject(new Error("Failed to access/create images directory"));
              return;
            }
            uploadFile();
          });
        } else {
          uploadFile();
        }
      });

      function uploadFile() {
        const readable = Readable.from(Buffer.from(fileBuffer));

        c.put(readable, filename, (err: Error | undefined) => {
          c.end();
          if (err) {
            reject(err);
          } else {
            const imageUrl = `${process.env.NAMECHEAP_IMAGE_URL}${filename}`;
            resolve(imageUrl);
          }
        });
      }
    });

    c.on("error", (err: Error) => {
      reject(err);
    });

    c.on("close", () => {
      // Connection closed
    });

    c.connect(config);
  });
}
