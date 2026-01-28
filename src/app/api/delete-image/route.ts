import { NextRequest, NextResponse } from "next/server";
import FTP from "ftp";

/**
 * API endpoint to delete images from Namecheap hosting
 * Requires image URL to identify and delete the file
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "No image URL provided" },
        { status: 400 },
      );
    }

    // Extract filename from URL
    const filename = url.split("/").pop();
    if (!filename) {
      return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
    }

    // Delete from Namecheap FTP
    await deleteFromNamecheap(filename);

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Image deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 },
    );
  }
}

async function deleteFromNamecheap(filename: string): Promise<void> {

  return new Promise((resolve, reject) => {
    const c = new FTP();

    const config = {
      host: process.env.NAMECHEAP_FTP_HOST || "ftp.stellar.hosting",
      user: process.env.NAMECHEAP_FTP_USER,
      password: process.env.NAMECHEAP_FTP_PASSWORD,
    };

    c.on("ready", () => {
      c.cwd("/public/images", (err) => {
        if (err) {
          c.end();
          reject(new Error("Failed to access images directory"));
          return;
        }

        c.delete(filename, (delErr: Error | null) => {
          c.end();
          if (delErr) {
            reject(delErr);
          } else {
            resolve();
          }
        });
      });
    });

    c.on("error", (err: Error) => {
      reject(err);
    });

    c.connect(config);
  });
}
