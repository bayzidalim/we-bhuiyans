export default function cloudinaryLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
    // Check if it's a Cloudinary URL
    if (!src.includes('res.cloudinary.com')) {
        return src;
    }

    // Split at /upload/ to insert transformations
    const [base, rest] = src.split('/upload/');
    if (!rest) return src; // Safety check

    // Construct transformation string
    const params = ['f_auto', 'c_limit']; // c_limit prevents upscaling

    // Add width
    if (width) {
        params.push(`w_${width}`);
    }

    // Add quality (default to auto if not specified)
    params.push(`q_${quality || 'auto'}`);

    return `${base}/upload/${params.join(',')}/${rest}`;
}
