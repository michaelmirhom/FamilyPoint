from fastapi import APIRouter, File, UploadFile, HTTPException
import cloudinary
import cloudinary.uploader
import os
from typing import List

router = APIRouter()

# Configure Cloudinary from environment variables
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

@router.post("")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload file to Cloudinary.
    Works in production without ephemeral storage issues.
    """
    try:
        # Read file contents
        contents = await file.read()
        
        # Upload to Cloudinary
        upload_result = cloudinary.uploader.upload(
            contents,
            folder="familypoints",  # Organize files in a folder
            resource_type="auto"  # Auto-detect if it's image/pdf/etc
        )
        
        # Return the secure URL from Cloudinary
        return {
            "filename": upload_result.get("public_id"),
            "url": upload_result.get("secure_url"),
            "cloudinary_id": upload_result.get("public_id")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")
