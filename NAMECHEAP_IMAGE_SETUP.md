# Image Upload Setup Guide: Namecheap + Supabase

## Overview

This system uploads product images to Namecheap Stellar hosting and stores the URLs in your Supabase database. Images are managed through the following flow:

```
User uploads image → API endpoint → Namecheap FTP → Image URL → Supabase database
```

## Prerequisites

1. **Node.js FTP Library**: Install the `ftp` package
   ```bash
   npm install ftp
   ```

2. **Namecheap Stellar Hosting Account**
   - Access your hosting via FTP
   - Create `/public/images/` directory for storing images

3. **FTP Credentials**
   - Get from Namecheap Control Panel → Hosting → Manage
   - Look for FTP credentials section

## Environment Variables Setup

Add these to your `.env.local` file:

```env
# Namecheap FTP Credentials
NAMECHEAP_FTP_HOST=your-domain.com
NAMECHEAP_FTP_USER=username@yourdomain.com
NAMECHEAP_FTP_PASSWORD=your-ftp-password

# Public Image URL
NEXT_PUBLIC_NAMECHEAP_DOMAIN=yourdomain.com
NAMECHEAP_IMAGE_URL=https://yourdomain.com/images/
```

## File Structure

```
src/
├── app/
│   └── api/
│       ├── upload-image/
│       │   └── route.ts          # Handles image uploads
│       └── delete-image/
│           └── route.ts          # Handles image deletion
├── components/
│   └── ProductImageUpload.tsx    # Upload component UI
├── lib/
│   └── imageUtils.ts            # Helper functions
└── types/
    └── supabase.ts              # Database types
```

## API Endpoints

### 1. POST `/api/upload-image`
Uploads image to Namecheap and returns the public URL.

**Request:**
```javascript
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch('/api/upload-image', {
  method: 'POST',
  body: formData
});

const { url } = await response.json();
```

**Response:**
```json
{
  "success": true,
  "url": "https://yourdomain.com/images/img_1705000000000_abc123.jpg",
  "filename": "img_1705000000000_abc123.jpg"
}
```

### 2. POST `/api/delete-image`
Deletes image from Namecheap and Supabase.

**Request:**
```javascript
await fetch('/api/delete-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://yourdomain.com/images/img_1705000000000_abc123.jpg'
  })
});
```

## Usage Examples

### Single Image Upload
```typescript
import { uploadProductImage, addImageToProduct } from '@/lib/imageUtils';

const handleUpload = async (file: File, productId: string) => {
  try {
    const imageUrl = await uploadProductImage(file);
    await addImageToProduct(productId, imageUrl);
    console.log('Image uploaded:', imageUrl);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### Multiple Images Upload
```typescript
import { uploadMultipleImages } from '@/lib/imageUtils';

const handleMultipleUpload = async (files: File[], productId: string) => {
  try {
    const imageUrls = await uploadMultipleImages(files, productId);
    console.log('All images uploaded:', imageUrls);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### Using the Upload Component
```typescript
import { ProductImageUpload } from '@/components/ProductImageUpload';

export function ProductForm() {
  const [productId] = useState('your-product-id');

  return (
    <ProductImageUpload
      productId={productId}
      onImageAdded={(url) => console.log('Image added:', url)}
      onImageRemoved={(url) => console.log('Image removed:', url)}
      currentImages={[]} // Pass existing product images
    />
  );
}
```

### Displaying Images
```typescript
import Image from 'next/image';

export function ProductCard({ product }) {
  return (
    <div>
      {product.images?.[0] && (
        <Image
          src={product.images[0]}
          alt={product.name}
          width={400}
          height={400}
          priority={false}
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      )}
    </div>
  );
}
```

## Supabase Integration

Your `products` table schema:
```typescript
{
  id: string              // UUID
  name: string           // Product name
  price: number          // Product price
  description: string    // Product description
  images: string[]       // Array of image URLs
  stock: number          // Available quantity
  slug: string           // URL-friendly name
  is_active: boolean     // Product visibility
  created_at: timestamp  // Creation date
  updated_at: timestamp  // Last update
}
```

## Namecheap Directory Structure

Your hosting should look like:
```
/public/
├── images/
│   ├── img_1705000000000_abc123.jpg
│   ├── img_1705000000001_def456.png
│   └── ... (more images)
└── (other files)
```

## Security Considerations

1. **File Validation**
   - Only JPEG, PNG, WebP, and GIF files allowed
   - Maximum file size: 5MB
   - Filename validation and sanitization

2. **FTP Security**
   - Use strong FTP passwords
   - Store credentials in environment variables
   - Never commit `.env.local` to version control

3. **Image Permissions**
   - Images uploaded to `/public/images/` are accessible to anyone
   - Consider adding watermarks for sensitive images
   - Use CDN caching for performance

## Troubleshooting

### FTP Connection Error
```
Error: Failed to connect to FTP server
```
**Solution:**
- Verify FTP credentials in `.env.local`
- Check firewall rules allow FTP connections
- Ensure Namecheap hosting supports FTP (most do)

### Image Not Found After Upload
```
Error: 404 Not Found
```
**Solution:**
- Verify `NAMECHEAP_IMAGE_URL` matches your domain
- Check if `/public/images/` directory exists
- Verify file was uploaded via FTP client

### CORS Error
```
Error: Cross-Origin Request Blocked
```
**Solution:**
- Configure CORS headers in Namecheap if needed
- Use the full domain URL in image requests
- Check browser console for specific error

### Supabase Update Failed
**Solution:**
- Verify product ID exists in database
- Check Supabase Row Level Security (RLS) policies
- Ensure API key has write permissions

## Performance Optimization

1. **Image Optimization**
   ```bash
   npm install sharp
   ```
   Convert images to WebP format before upload

2. **Lazy Loading**
   ```typescript
   <Image
     src={imageUrl}
     priority={false}  // Lazy load non-critical images
   />
   ```

3. **CDN Caching**
   - Configure Namecheap to cache images
   - Set appropriate cache headers

## Next Steps

1. Install FTP dependency: `npm install ftp`
2. Add environment variables to `.env.local`
3. Create `/public/images/` directory on Namecheap hosting
4. Test upload with `ProductImageUpload` component
5. Monitor Supabase for image URL records

## Support

For issues with:
- **Namecheap FTP**: Check Namecheap documentation
- **Supabase**: Visit https://supabase.io/docs
- **Next.js Image**: Check https://nextjs.org/docs/app/api-reference/components/image
