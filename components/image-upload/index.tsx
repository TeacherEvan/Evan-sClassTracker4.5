"use client";

import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import React, { useState } from 'react';
import './image-uploader.css';

export function ImageUploader() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadResult, setUploadResult] = useState<string | null>(null);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const seedDatabase = useMutation(api.seed.seedDatabase);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setSelectedFile(event.target.files[0]);
            setUploadResult(null);
        }
    };

    const handleUpload = async () => {
        if (selectedFile) {
            setIsLoading(true);
            setUploadResult(null);
            try {
                const postUrl = await generateUploadUrl();
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": selectedFile.type },
                    body: selectedFile,
                });
                const { storageId } = await result.json();
                console.log("Uploaded storageId:", storageId);
                await seedDatabase({});
                setUploadResult("success");
            } catch (error) {
                console.error(error);
                setUploadResult("error");
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="image-uploader">
            <input type="file" onChange={handleFileChange} disabled={isLoading} />
            <button onClick={handleUpload} disabled={!selectedFile || isLoading}>
                {isLoading ? "Uploading..." : "Upload"}
            </button>
            {uploadResult === "success" && <p className="success-message">Upload successful!</p>}
            {uploadResult === "error" && <p className="error-message">Upload failed. Please try again.</p>}
        </div>
    );
}
