"use client";
import React, { useState } from "react";
import CreatePostForm from "@/features/CreatePostForm";
import UpdatePostForm from "@/features/UpdatePostForm";

const ParentPage = () => {
  const [generatedPost, setGeneratedPost] = useState("");

  return (
    <div className="space-y-8">
      <CreatePostForm onPostGenerated={setGeneratedPost} />
      {generatedPost && <UpdatePostForm initialContent={generatedPost} />}
    </div>
  );
};

export default ParentPage;
